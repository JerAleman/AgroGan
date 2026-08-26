import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCowDto, CreateMilkProductionDto, CreateMilkSettlementDto } from './dto/dairy.dto';

@Injectable()
export class DairyService {
  constructor(private readonly prisma: PrismaService) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  // ── Vacas ──
  createCow(dto: CreateCowDto) {
    return this.prisma.dairyCow.create({
      data: {
        tenantId: this.tid,
        identifier: dto.identifier,
        status: dto.status ?? 'active',
        lactationNumber: dto.lactationNumber ?? 1,
      },
    });
  }

  listCows(status?: string) {
    return this.prisma.dairyCow.findMany({
      where: { tenantId: this.tid, ...(status ? { status } : {}) },
      orderBy: { identifier: 'asc' },
    });
  }

  // ── Produccion diaria ──
  async createProduction(dto: CreateMilkProductionDto) {
    await this.assertCow(dto.cowId);
    if (dto.clientUuid) {
      const existing = await this.prisma.dailyMilkProduction.findFirst({
        where: { tenantId: this.tid, clientUuid: dto.clientUuid },
      });
      if (existing) return existing;
    }

    return this.prisma.dailyMilkProduction.create({
      data: {
        tenantId: this.tid,
        cowId: dto.cowId,
        liters: dto.liters ?? 0,
        fatPct: dto.fatPct,
        proteinPct: dto.proteinPct,
        somaticCells: dto.somaticCells,
        date: dto.date ? new Date(dto.date) : new Date(),
        clientUuid: dto.clientUuid,
      },
    });
  }

  listProductions(days = 30) {
    const from = new Date(Date.now() - days * 86_400_000);
    return this.prisma.dailyMilkProduction.findMany({
      where: { tenantId: this.tid, date: { gte: from } },
      include: { cow: true },
      orderBy: { date: 'desc' },
    });
  }

  // ── Liquidaciones ──
  createSettlement(dto: CreateMilkSettlementDto) {
    const totalLiters = dto.totalLiters ?? 0;
    const pricePerLiter = dto.pricePerLiter ?? 0;
    const bonuses = dto.bonuses ?? 0;
    const deductions = dto.deductions ?? 0;
    const totalAmount = totalLiters * pricePerLiter + bonuses - deductions;

    return this.prisma.milkSettlement.create({
      data: {
        tenantId: this.tid,
        periodFrom: new Date(dto.periodFrom),
        periodTo: new Date(dto.periodTo),
        totalLiters,
        pricePerLiter,
        bonuses,
        deductions,
        totalAmount,
      },
    });
  }

  listSettlements() {
    return this.prisma.milkSettlement.findMany({
      where: { tenantId: this.tid },
      orderBy: { periodTo: 'desc' },
    });
  }

  // ── Resumen tambo ──
  async dairySummary() {
    const cows = await this.prisma.dairyCow.findMany({ where: { tenantId: this.tid } });
    const activeCows = cows.filter((c) => c.status === 'active');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
    const recentProductions = await this.prisma.dailyMilkProduction.findMany({
      where: { tenantId: this.tid, date: { gte: thirtyDaysAgo } },
    });

    const totalLiters30d = recentProductions.reduce((a, p) => a + p.liters, 0);
    const avgLitersPerCowPerDay = activeCows.length > 0 && recentProductions.length > 0
      ? Number((totalLiters30d / 30 / activeCows.length).toFixed(1))
      : 0;

    const somaticCells = recentProductions.filter((p) => p.somaticCells != null);
    const avgSomaticCells = somaticCells.length > 0
      ? Math.round(somaticCells.reduce((a, p) => a + (p.somaticCells ?? 0), 0) / somaticCells.length)
      : 0;

    return {
      totalCows: cows.length,
      activeCows: activeCows.length,
      totalLiters30d: Number(totalLiters30d.toFixed(1)),
      avgLitersPerCowPerDay,
      avgSomaticCells,
    };
  }

  private async assertCow(id: string) {
    const c = await this.prisma.dairyCow.findFirst({ where: { id, tenantId: this.tid } });
    if (!c) throw new NotFoundException('Vaca no encontrada');
  }
}
