import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto, CreateServiceOrderDto } from './dto/services.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  // ── Clientes ──
  createCustomer(dto: CreateCustomerDto) {
    return this.prisma.serviceCustomer.create({
      data: { tenantId: this.tid, name: dto.name, taxId: dto.taxId, contact: dto.contact },
    });
  }

  listCustomers() {
    return this.prisma.serviceCustomer.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Ordenes de servicio ──
  async createOrder(dto: CreateServiceOrderDto) {
    await this.assertCustomer(dto.customerId);
    if (dto.clientUuid) {
      const existing = await this.prisma.serviceOrder.findFirst({
        where: { tenantId: this.tid, clientUuid: dto.clientUuid },
      });
      if (existing) return existing;
    }

    return this.prisma.serviceOrder.create({
      data: {
        tenantId: this.tid,
        customerId: dto.customerId,
        type: dto.type,
        description: dto.description,
        areaHa: dto.areaHa ?? 0,
        amount: dto.amount ?? 0,
        cost: dto.cost ?? 0,
        status: dto.status ?? 'pending',
        date: dto.date ? new Date(dto.date) : new Date(),
        clientUuid: dto.clientUuid,
      },
    });
  }

  listOrders(status?: string) {
    return this.prisma.serviceOrder.findMany({
      where: { tenantId: this.tid, ...(status ? { status } : {}) },
      include: { customer: true },
      orderBy: { date: 'desc' },
    });
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.prisma.serviceOrder.findFirst({ where: { id, tenantId: this.tid } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return this.prisma.serviceOrder.update({ where: { id }, data: { status } });
  }

  // ── Rentabilidad por cliente ──
  async profitability() {
    const customers = await this.prisma.serviceCustomer.findMany({ where: { tenantId: this.tid } });
    const result: {
      customerId: string;
      customerName: string;
      totalOrders: number;
      totalRevenue: number;
      totalCost: number;
      profit: number;
      pendingAmount: number;
    }[] = [];

    for (const cust of customers) {
      const orders = await this.prisma.serviceOrder.findMany({ where: { tenantId: this.tid, customerId: cust.id } });
      const totalRevenue = orders.reduce((a, o) => a + o.amount, 0);
      const totalCost = orders.reduce((a, o) => a + o.cost, 0);
      const pendingAmount = orders
        .filter((o) => o.status !== 'paid')
        .reduce((a, o) => a + o.amount, 0);

      result.push({
        customerId: cust.id,
        customerName: cust.name,
        totalOrders: orders.length,
        totalRevenue,
        totalCost,
        profit: totalRevenue - totalCost,
        pendingAmount,
      });
    }
    return result;
  }

  private async assertCustomer(id: string) {
    const c = await this.prisma.serviceCustomer.findFirst({ where: { id, tenantId: this.tid } });
    if (!c) throw new NotFoundException('Cliente no encontrado');
  }
}
