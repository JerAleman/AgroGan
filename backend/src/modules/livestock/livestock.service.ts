import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { computeAdg, headDelta } from '../../common/util/calc';
import {
  CreateBatchDto,
  CreateCategoryDto,
  CreateHealthEventDto,
  CreateHerdDto,
  CreateLivestockMovementDto,
  CreateWeighingDto,
} from './dto/livestock.dto';

@Injectable()
export class LivestockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  // ── Categorías ──
  createCategory(dto: CreateCategoryDto) {
    return this.prisma.livestockCategory.create({
      data: { tenantId: this.tid, name: dto.name, species: dto.species ?? 'bovino', sex: dto.sex },
    });
  }
  listCategories() {
    return this.prisma.livestockCategory.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Rodeos ──
  async createHerd(dto: CreateHerdDto) {
    await this.assertEstablishment(dto.establishmentId);
    return this.prisma.herd.create({
      data: { tenantId: this.tid, establishmentId: dto.establishmentId, name: dto.name, purpose: dto.purpose ?? 'cria' },
    });
  }
  listHerds() {
    return this.prisma.herd.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Batches ──
  async createBatch(dto: CreateBatchDto) {
    await this.assertHerd(dto.herdId);
    await this.assertCategory(dto.categoryId);
    return this.prisma.livestockBatch.create({
      data: {
        tenantId: this.tid,
        herdId: dto.herdId,
        categoryId: dto.categoryId,
        paddockId: dto.paddockId,
        headCount: dto.headCount ?? 0,
        avgWeight: dto.avgWeight ?? 0,
      },
    });
  }
  listBatches() {
    return this.prisma.livestockBatch.findMany({
      where: { tenantId: this.tid },
      include: { category: true, herd: true },
      orderBy: { entryDate: 'desc' },
    });
  }

  // ── Movimientos (impactan el stock del batch) ──
  async createMovement(dto: CreateLivestockMovementDto) {
    await this.assertCategory(dto.categoryId);
    if (dto.clientUuid) {
      const existing = await this.prisma.livestockMovement.findFirst({
        where: { tenantId: this.tid, clientUuid: dto.clientUuid },
      });
      if (existing) return existing;
    }
    if (dto.batchId) await this.assertBatch(dto.batchId);

    const movement = await this.prisma.livestockMovement.create({
      data: {
        tenantId: this.tid,
        batchId: dto.batchId,
        categoryId: dto.categoryId,
        type: dto.type,
        headCount: dto.headCount,
        weight: dto.weight ?? 0,
        amount: dto.amount ?? 0,
        notes: dto.notes,
        clientUuid: dto.clientUuid,
      },
    });

    // Ajuste de existencias del batch.
    if (dto.batchId) {
      const delta = headDelta(dto.type, dto.headCount);
      if (delta !== 0) {
        await this.prisma.livestockBatch.update({
          where: { id: dto.batchId },
          data: { headCount: { increment: delta } },
        });
      }
    }
    return movement;
  }

  // ── Pesadas (calcula ADG contra la pesada previa del batch) ──
  async createWeighing(dto: CreateWeighingDto) {
    await this.assertBatch(dto.batchId);
    if (dto.clientUuid) {
      const existing = await this.prisma.weighingEvent.findFirst({
        where: { tenantId: this.tid, clientUuid: dto.clientUuid },
      });
      if (existing) return existing;
    }

    const date = dto.date ? new Date(dto.date) : new Date();
    const prev = await this.prisma.weighingEvent.findFirst({
      where: { tenantId: this.tid, batchId: dto.batchId, date: { lt: date } },
      orderBy: { date: 'desc' },
    });

    const adg = computeAdg({ weight: dto.weight, date }, prev ? { weight: prev.weight, date: prev.date } : null);

    const event = await this.prisma.weighingEvent.create({
      data: {
        tenantId: this.tid,
        batchId: dto.batchId,
        weight: dto.weight,
        method: dto.method ?? 'manual',
        date,
        adg,
        clientUuid: dto.clientUuid,
      },
    });

    // Actualiza el peso promedio del batch.
    await this.prisma.livestockBatch.update({
      where: { id: dto.batchId },
      data: { avgWeight: dto.weight },
    });
    return event;
  }

  // ── Eventos sanitarios (descuenta inventario automáticamente) ──
  async createHealthEvent(dto: CreateHealthEventDto) {
    await this.assertBatch(dto.batchId);
    if (dto.clientUuid) {
      const existing = await this.prisma.healthEvent.findFirst({
        where: { tenantId: this.tid, clientUuid: dto.clientUuid },
      });
      if (existing) return existing;
    }

    const event = await this.prisma.healthEvent.create({
      data: {
        tenantId: this.tid,
        batchId: dto.batchId,
        type: dto.type,
        productId: dto.productId,
        dose: dto.dose,
        headCount: dto.headCount ?? 0,
        nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
        date: dto.date ? new Date(dto.date) : new Date(),
        clientUuid: dto.clientUuid,
      },
    });

    let inventory: { movementId: string; belowMin: boolean; stock: number } | null = null;
    if (dto.productId && dto.dose && dto.headCount) {
      inventory = await this.inventory.consume({
        productId: dto.productId,
        qty: dto.dose * dto.headCount,
        sourceType: 'health_event',
        sourceId: event.id,
        clientUuid: dto.clientUuid ? `${dto.clientUuid}:inv` : undefined,
      });
    }

    return { ...event, inventory };
  }

  // ── Stock ganadero por categoría ──
  async stockByCategory(): Promise<{ categoryId: string; categoryName: string; headCount: number; avgWeight: number }[]> {
    const categories = await this.prisma.livestockCategory.findMany({ where: { tenantId: this.tid } });
    const result: { categoryId: string; categoryName: string; headCount: number; avgWeight: number }[] = [];
    for (const cat of categories) {
      const agg = await this.prisma.livestockBatch.aggregate({
        where: { tenantId: this.tid, categoryId: cat.id },
        _sum: { headCount: true },
        _avg: { avgWeight: true },
      });
      result.push({
        categoryId: cat.id,
        categoryName: cat.name,
        headCount: agg._sum.headCount ?? 0,
        avgWeight: Number((agg._avg.avgWeight ?? 0).toFixed(1)),
      });
    }
    return result;
  }

  // ── Tareas sanitarias que vencen dentro de N días ──
  async dueHealthTasks(days = 7) {
    const limit = new Date(Date.now() + days * 86_400_000);
    return this.prisma.healthEvent.findMany({
      where: { tenantId: this.tid, nextDueDate: { not: null, lte: limit } },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  // ── helpers de aislamiento/integridad ──
  private async assertEstablishment(id: string) {
    const e = await this.prisma.establishment.findFirst({ where: { id, tenantId: this.tid } });
    if (!e) throw new NotFoundException('Establecimiento no encontrado');
  }
  private async assertHerd(id: string) {
    const h = await this.prisma.herd.findFirst({ where: { id, tenantId: this.tid } });
    if (!h) throw new NotFoundException('Rodeo no encontrado');
  }
  private async assertCategory(id: string) {
    const c = await this.prisma.livestockCategory.findFirst({ where: { id, tenantId: this.tid } });
    if (!c) throw new NotFoundException('Categoría no encontrada');
  }
  private async assertBatch(id: string) {
    const b = await this.prisma.livestockBatch.findFirst({ where: { id, tenantId: this.tid } });
    if (!b) throw new NotFoundException('Lote/tropa no encontrado');
  }
}
