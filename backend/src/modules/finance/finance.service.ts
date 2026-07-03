import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAccountDto, CreateBudgetDto, CreateTransactionDto } from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  // ── Cuentas ──
  createAccount(dto: CreateAccountDto) {
    return this.prisma.financeAccount.create({
      data: {
        tenantId: this.tid,
        name: dto.name,
        type: dto.type,
        currency: dto.currency ?? 'ARS',
        balance: dto.balance ?? 0,
      },
    });
  }

  listAccounts() {
    return this.prisma.financeAccount.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Transacciones ──
  async createTransaction(dto: CreateTransactionDto) {
    await this.assertAccount(dto.accountId);
    if (dto.clientUuid) {
      const existing = await this.prisma.financeTransaction.findFirst({
        where: { tenantId: this.tid, clientUuid: dto.clientUuid },
      });
      if (existing) return existing;
    }

    const tx = await this.prisma.financeTransaction.create({
      data: {
        tenantId: this.tid,
        accountId: dto.accountId,
        type: dto.type,
        category: dto.category ?? 'general',
        amount: dto.amount,
        description: dto.description,
        counterparty: dto.counterparty,
        date: dto.date ? new Date(dto.date) : new Date(),
        clientUuid: dto.clientUuid,
      },
    });

    // Update account balance
    const delta = dto.type === 'ingreso' ? dto.amount : -dto.amount;
    await this.prisma.financeAccount.update({
      where: { id: dto.accountId },
      data: { balance: { increment: delta } },
    });

    return tx;
  }

  listTransactions(from?: string, to?: string, category?: string) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    return this.prisma.financeTransaction.findMany({
      where: {
        tenantId: this.tid,
        ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
        ...(category ? { category } : {}),
      },
      include: { account: true },
      orderBy: { date: 'desc' },
    });
  }

  // ── Flujo de caja ──
  async cashFlow(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 90 * 86_400_000);
    const toDate = to ? new Date(to) : new Date();

    const transactions = await this.prisma.financeTransaction.findMany({
      where: { tenantId: this.tid, date: { gte: fromDate, lte: toDate } },
      orderBy: { date: 'asc' },
    });

    let totalIngresos = 0;
    let totalEgresos = 0;
    const byCategory: Record<string, { ingresos: number; egresos: number }> = {};

    for (const tx of transactions) {
      if (tx.type === 'ingreso') {
        totalIngresos += tx.amount;
      } else {
        totalEgresos += tx.amount;
      }
      if (!byCategory[tx.category]) byCategory[tx.category] = { ingresos: 0, egresos: 0 };
      if (tx.type === 'ingreso') byCategory[tx.category].ingresos += tx.amount;
      else byCategory[tx.category].egresos += tx.amount;
    }

    return {
      period: { from: fromDate, to: toDate },
      totalIngresos,
      totalEgresos,
      netCashFlow: totalIngresos - totalEgresos,
      byCategory,
    };
  }

  // ── P&L ──
  async profitAndLoss(from?: string, to?: string) {
    const cashFlowData = await this.cashFlow(from, to);
    const ebitda = cashFlowData.totalIngresos - cashFlowData.totalEgresos;
    return {
      period: cashFlowData.period,
      revenue: cashFlowData.totalIngresos,
      expenses: cashFlowData.totalEgresos,
      ebitda,
      margin: cashFlowData.totalIngresos > 0 ? Number(((ebitda / cashFlowData.totalIngresos) * 100).toFixed(1)) : 0,
      byCategory: cashFlowData.byCategory,
    };
  }

  // ── Presupuestos ──
  createBudget(dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        tenantId: this.tid,
        name: dto.name,
        period: dto.period,
        category: dto.category,
        planned: dto.planned ?? 0,
        actual: dto.actual ?? 0,
      },
    });
  }

  listBudgets(period?: string) {
    return this.prisma.budget.findMany({
      where: { tenantId: this.tid, ...(period ? { period } : {}) },
      orderBy: { period: 'desc' },
    });
  }

  private async assertAccount(id: string) {
    const a = await this.prisma.financeAccount.findFirst({ where: { id, tenantId: this.tid } });
    if (!a) throw new NotFoundException('Cuenta no encontrada');
  }
}
