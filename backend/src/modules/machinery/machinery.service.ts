import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMachineDto, CreateMachineTaskDto, CreateMaintenanceDto } from './dto/machinery.dto';

@Injectable()
export class MachineryService {
  constructor(private readonly prisma: PrismaService) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  createMachine(dto: CreateMachineDto) {
    return this.prisma.machine.create({
      data: {
        tenantId: this.tid,
        name: dto.name,
        type: dto.type ?? 'otro',
        ownership: dto.ownership ?? 'own',
        acquisitionCost: dto.acquisitionCost ?? 0,
        hourMeter: dto.hourMeter ?? 0,
      },
    });
  }

  listMachines() {
    return this.prisma.machine.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  async createTask(dto: CreateMachineTaskDto) {
    await this.assertMachine(dto.machineId);
    if (dto.clientUuid) {
      const existing = await this.prisma.machineTask.findFirst({ where: { tenantId: this.tid, clientUuid: dto.clientUuid } });
      if (existing) return existing;
    }
    const task = await this.prisma.machineTask.create({
      data: {
        tenantId: this.tid,
        machineId: dto.machineId,
        description: dto.description,
        hours: dto.hours ?? 0,
        hectares: dto.hectares ?? 0,
        fuelQty: dto.fuelQty ?? 0,
        date: dto.date ? new Date(dto.date) : new Date(),
        clientUuid: dto.clientUuid,
      },
    });
    // Actualiza el horómetro
    if (dto.hours) {
      await this.prisma.machine.update({ where: { id: dto.machineId }, data: { hourMeter: { increment: dto.hours } } });
    }
    return task;
  }

  listTasks(machineId?: string) {
    return this.prisma.machineTask.findMany({
      where: { tenantId: this.tid, ...(machineId ? { machineId } : {}) },
      orderBy: { date: 'desc' },
      take: 50,
    });
  }

  async createMaintenance(dto: CreateMaintenanceDto) {
    await this.assertMachine(dto.machineId);
    return this.prisma.maintenanceOrder.create({
      data: {
        tenantId: this.tid,
        machineId: dto.machineId,
        type: dto.type,
        cost: dto.cost ?? 0,
        description: dto.description,
        nextDue: dto.nextDue ? new Date(dto.nextDue) : null,
      },
    });
  }

  listMaintenance(machineId?: string) {
    return this.prisma.maintenanceOrder.findMany({
      where: { tenantId: this.tid, ...(machineId ? { machineId } : {}) },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  /** KPIs por máquina: horas totales, hectáreas, combustible, costo/ha. */
  async summary() {
    const machines = await this.prisma.machine.findMany({ where: { tenantId: this.tid } });
    const result: {
      machineId: string; name: string; type: string; ownership: string;
      hourMeter: number; totalHours: number; totalHectares: number;
      totalFuel: number; fuelPerHa: number; maintenanceCost: number;
    }[] = [];
    for (const m of machines) {
      const tasks = await this.prisma.machineTask.aggregate({
        where: { tenantId: this.tid, machineId: m.id },
        _sum: { hours: true, hectares: true, fuelQty: true },
      });
      const maintenance = await this.prisma.maintenanceOrder.aggregate({
        where: { tenantId: this.tid, machineId: m.id },
        _sum: { cost: true },
      });
      const ha = tasks._sum.hectares ?? 0;
      const fuel = tasks._sum.fuelQty ?? 0;
      result.push({
        machineId: m.id,
        name: m.name,
        type: m.type,
        ownership: m.ownership,
        hourMeter: m.hourMeter,
        totalHours: tasks._sum.hours ?? 0,
        totalHectares: ha,
        totalFuel: fuel,
        fuelPerHa: ha > 0 ? Number((fuel / ha).toFixed(2)) : 0,
        maintenanceCost: maintenance._sum.cost ?? 0,
      });
    }
    return result;
  }

  private async assertMachine(id: string) {
    const m = await this.prisma.machine.findFirst({ where: { id, tenantId: this.tid } });
    if (!m) throw new NotFoundException('Máquina no encontrada');
  }
}
