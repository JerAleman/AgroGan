import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LivestockService } from '../livestock/livestock.service';
import { AgricultureService } from '../agriculture/agriculture.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly livestock: LivestockService,
    private readonly agriculture: AgricultureService,
    private readonly inventory: InventoryService,
  ) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  /** Resumen ganadero: existencias por categoría + movimientos del período. */
  async livestockSummary(fromISO?: string, toISO?: string) {
    const from = fromISO ? new Date(fromISO) : new Date(Date.now() - 90 * 86_400_000);
    const to = toISO ? new Date(toISO) : new Date();

    const stock = await this.livestock.stockByCategory();
    const totalHead = stock.reduce((a, s) => a + s.headCount, 0);

    const movements = await this.prisma.livestockMovement.groupBy({
      by: ['type'],
      where: { tenantId: this.tid, date: { gte: from, lte: to } },
      _sum: { headCount: true, amount: true },
    });
    const byType: Record<string, { head: number; amount: number }> = {};
    for (const m of movements) {
      byType[m.type] = { head: m._sum.headCount ?? 0, amount: m._sum.amount ?? 0 };
    }

    return {
      period: { from, to },
      totalHead,
      byCategory: stock,
      movements: {
        purchases: byType['purchase'] ?? { head: 0, amount: 0 },
        sales: byType['sale'] ?? { head: 0, amount: 0 },
        births: byType['birth'] ?? { head: 0, amount: 0 },
        deaths: byType['death'] ?? { head: 0, amount: 0 },
      },
    };
  }

  /** KPIs del dashboard ejecutivo. */
  async dashboard() {
    const [areaAgg, stock, margins, alerts, dueTasks] = await Promise.all([
      this.prisma.establishment.aggregate({ where: { tenantId: this.tid }, _sum: { totalAreaHa: true } }),
      this.livestock.stockByCategory(),
      this.agriculture.grossMargin(),
      this.inventory.getAlerts(),
      this.livestock.dueHealthTasks(7),
    ]);

    const totalHead = stock.reduce((a, s) => a + s.headCount, 0);
    const totalGrossMargin = margins.reduce((a, m) => a + m.grossMargin, 0);

    return {
      totalAreaHa: areaAgg._sum.totalAreaHa ?? 0,
      livestock: { totalHead, byCategory: stock },
      agriculture: { totalGrossMargin, campaigns: margins },
      alerts: { count: alerts.length + dueTasks.length, stock: alerts, dueHealthTasks: dueTasks.length },
    };
  }
}
