import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateConsumptionDto, CreateDietDto, CreatePenDto, CreateTroopDto } from './dto/feedlot.dto';

@Injectable()
export class FeedlotService {
  constructor(private readonly prisma: PrismaService) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  // ── Corrales ──
  createPen(dto: CreatePenDto) {
    return this.prisma.feedlotPen.create({
      data: { tenantId: this.tid, name: dto.name, capacity: dto.capacity ?? 0 },
    });
  }

  listPens() {
    return this.prisma.feedlotPen.findMany({
      where: { tenantId: this.tid },
      include: { troops: { where: { status: 'active' } } },
      orderBy: { name: 'asc' },
    });
  }

  // ── Tropas ──
  async createTroop(dto: CreateTroopDto) {
    await this.assertPen(dto.penId);
    return this.prisma.feedlotTroop.create({
      data: {
        tenantId: this.tid,
        penId: dto.penId,
        categoryName: dto.categoryName,
        headCount: dto.headCount ?? 0,
        entryWeight: dto.entryWeight ?? 0,
        currentWeight: dto.entryWeight ?? 0,
        targetWeight: dto.targetWeight ?? 0,
        projectedExitDate: dto.projectedExitDate ? new Date(dto.projectedExitDate) : null,
      },
    });
  }

  listTroops(status?: string) {
    return this.prisma.feedlotTroop.findMany({
      where: { tenantId: this.tid, ...(status ? { status } : {}) },
      include: { pen: true },
      orderBy: { entryDate: 'desc' },
    });
  }

  // ── Dietas ──
  createDiet(dto: CreateDietDto) {
    return this.prisma.feedlotDiet.create({
      data: { tenantId: this.tid, name: dto.name, costPerKg: dto.costPerKg ?? 0, composition: dto.composition },
    });
  }

  listDiets() {
    return this.prisma.feedlotDiet.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Consumo diario ──
  async createConsumption(dto: CreateConsumptionDto) {
    await this.assertTroop(dto.troopId);
    await this.assertDiet(dto.dietId);

    if (dto.clientUuid) {
      const existing = await this.prisma.feedlotConsumption.findFirst({
        where: { tenantId: this.tid, clientUuid: dto.clientUuid },
      });
      if (existing) return existing;
    }

    return this.prisma.feedlotConsumption.create({
      data: {
        tenantId: this.tid,
        troopId: dto.troopId,
        dietId: dto.dietId,
        kgConsumed: dto.kgConsumed ?? 0,
        date: dto.date ? new Date(dto.date) : new Date(),
        clientUuid: dto.clientUuid,
      },
    });
  }

  // ── Resumen economico por corral ──
  async penSummary() {
    const pens = await this.prisma.feedlotPen.findMany({
      where: { tenantId: this.tid },
      include: { troops: { where: { status: 'active' }, include: { consumptions: { include: { diet: true } } } } },
    });

    return pens.map((pen) => {
      const totalHead = pen.troops.reduce((a, t) => a + t.headCount, 0);
      let totalKgConsumed = 0;
      let totalFeedCost = 0;
      let totalWeightGain = 0;

      for (const troop of pen.troops) {
        const gain = (troop.currentWeight - troop.entryWeight) * troop.headCount;
        totalWeightGain += gain;
        for (const c of troop.consumptions) {
          totalKgConsumed += c.kgConsumed;
          totalFeedCost += c.kgConsumed * c.diet.costPerKg;
        }
      }

      const conversionRatio = totalWeightGain > 0 ? Number((totalKgConsumed / totalWeightGain).toFixed(2)) : 0;
      const costPerKgGain = totalWeightGain > 0 ? Number((totalFeedCost / totalWeightGain).toFixed(2)) : 0;

      return {
        penId: pen.id,
        penName: pen.name,
        capacity: pen.capacity,
        headCount: totalHead,
        totalKgConsumed,
        totalFeedCost: Number(totalFeedCost.toFixed(2)),
        totalWeightGain: Number(totalWeightGain.toFixed(2)),
        conversionRatio,
        costPerKgGain,
      };
    });
  }

  private async assertPen(id: string) {
    const p = await this.prisma.feedlotPen.findFirst({ where: { id, tenantId: this.tid } });
    if (!p) throw new NotFoundException('Corral no encontrado');
  }
  private async assertTroop(id: string) {
    const t = await this.prisma.feedlotTroop.findFirst({ where: { id, tenantId: this.tid } });
    if (!t) throw new NotFoundException('Tropa no encontrada');
  }
  private async assertDiet(id: string) {
    const d = await this.prisma.feedlotDiet.findFirst({ where: { id, tenantId: this.tid } });
    if (!d) throw new NotFoundException('Dieta no encontrada');
  }
}
