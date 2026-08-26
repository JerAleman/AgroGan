import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReproductiveEventDto, CreateSireDto } from './dto/breeding.dto';

@Injectable()
export class BreedingService {
  constructor(private readonly prisma: PrismaService) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  // ── Toros / Padres ──
  createSire(dto: CreateSireDto) {
    return this.prisma.sire.create({
      data: { tenantId: this.tid, name: dto.name, breed: dto.breed, sireType: dto.sireType ?? 'toro' },
    });
  }

  listSires() {
    return this.prisma.sire.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Eventos Reproductivos ──
  async createEvent(dto: CreateReproductiveEventDto) {
    if (dto.clientUuid) {
      const existing = await this.prisma.reproductiveEvent.findFirst({
        where: { tenantId: this.tid, clientUuid: dto.clientUuid },
      });
      if (existing) return existing;
    }
    if (dto.sireId) await this.assertSire(dto.sireId);

    return this.prisma.reproductiveEvent.create({
      data: {
        tenantId: this.tid,
        batchId: dto.batchId,
        sireId: dto.sireId,
        type: dto.type,
        headCount: dto.headCount ?? 0,
        result: dto.result,
        notes: dto.notes,
        date: dto.date ? new Date(dto.date) : new Date(),
        clientUuid: dto.clientUuid,
      },
    });
  }

  listEvents(type?: string) {
    return this.prisma.reproductiveEvent.findMany({
      where: { tenantId: this.tid, ...(type ? { type } : {}) },
      include: { sire: true },
      orderBy: { date: 'desc' },
    });
  }

  // ── Indices Reproductivos ──
  async reproductiveIndices() {
    const events = await this.prisma.reproductiveEvent.findMany({
      where: { tenantId: this.tid },
    });

    const servicios = events.filter((e) => e.type === 'servicio');
    const tactos = events.filter((e) => e.type === 'tacto');
    const pariciones = events.filter((e) => e.type === 'paricion');
    const destetes = events.filter((e) => e.type === 'destete');

    const totalServidas = servicios.reduce((a, e) => a + e.headCount, 0);
    const totalPrenadas = tactos.filter((e) => e.result === 'prenada').reduce((a, e) => a + e.headCount, 0);
    const totalVacias = tactos.filter((e) => e.result === 'vacia').reduce((a, e) => a + e.headCount, 0);
    const totalParidas = pariciones.reduce((a, e) => a + e.headCount, 0);
    const totalDestetadas = destetes.reduce((a, e) => a + e.headCount, 0);

    const pregnancyRate = totalServidas > 0 ? Number(((totalPrenadas / totalServidas) * 100).toFixed(1)) : 0;
    const calvingRate = totalPrenadas > 0 ? Number(((totalParidas / totalPrenadas) * 100).toFixed(1)) : 0;
    const weaningRate = totalParidas > 0 ? Number(((totalDestetadas / totalParidas) * 100).toFixed(1)) : 0;

    return {
      totalServidas,
      totalPrenadas,
      totalVacias,
      totalParidas,
      totalDestetadas,
      pregnancyRate,
      calvingRate,
      weaningRate,
    };
  }

  // ── Vacas vacias (repetidoras) ──
  async emptyCows() {
    const events = await this.prisma.reproductiveEvent.findMany({
      where: { tenantId: this.tid, type: 'tacto', result: 'vacia' },
      orderBy: { date: 'desc' },
    });
    return events;
  }

  private async assertSire(id: string) {
    const s = await this.prisma.sire.findFirst({ where: { id, tenantId: this.tid } });
    if (!s) throw new NotFoundException('Toro/padre no encontrado');
  }
}
