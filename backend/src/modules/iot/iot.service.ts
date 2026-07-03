import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BulkMeasurementsDto, CreateAlertRuleDto, CreateDeviceDto, CreateMeasurementDto } from './dto/iot.dto';

@Injectable()
export class IotService {
  constructor(private readonly prisma: PrismaService) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  // ── Dispositivos ──
  createDevice(dto: CreateDeviceDto) {
    return this.prisma.iotDevice.create({
      data: { tenantId: this.tid, name: dto.name, deviceType: dto.deviceType, location: dto.location },
    });
  }

  listDevices() {
    return this.prisma.iotDevice.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Mediciones ──
  async createMeasurement(dto: CreateMeasurementDto) {
    await this.assertDevice(dto.deviceId);
    if (dto.clientUuid) {
      const existing = await this.prisma.iotMeasurement.findFirst({
        where: { tenantId: this.tid, clientUuid: dto.clientUuid },
      });
      if (existing) return existing;
    }

    const measurement = await this.prisma.iotMeasurement.create({
      data: {
        tenantId: this.tid,
        deviceId: dto.deviceId,
        metric: dto.metric,
        value: dto.value,
        unit: dto.unit ?? '',
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
        clientUuid: dto.clientUuid,
      },
    });

    // Check alert rules
    await this.evaluateAlertRules(dto.deviceId, dto.metric, dto.value);

    return measurement;
  }

  async bulkIngest(dto: BulkMeasurementsDto) {
    const results: { created: number; skipped: number } = { created: 0, skipped: 0 };

    for (const m of dto.measurements) {
      if (m.clientUuid) {
        const existing = await this.prisma.iotMeasurement.findFirst({
          where: { tenantId: this.tid, clientUuid: m.clientUuid },
        });
        if (existing) {
          results.skipped++;
          continue;
        }
      }

      await this.prisma.iotMeasurement.create({
        data: {
          tenantId: this.tid,
          deviceId: m.deviceId,
          metric: m.metric,
          value: m.value,
          unit: m.unit ?? '',
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          clientUuid: m.clientUuid,
        },
      });
      results.created++;

      await this.evaluateAlertRules(m.deviceId, m.metric, m.value);
    }

    return results;
  }

  listMeasurements(deviceId?: string, metric?: string, hours = 24) {
    const since = new Date(Date.now() - hours * 3_600_000);
    return this.prisma.iotMeasurement.findMany({
      where: {
        tenantId: this.tid,
        ...(deviceId ? { deviceId } : {}),
        ...(metric ? { metric } : {}),
        timestamp: { gte: since },
      },
      include: { device: true },
      orderBy: { timestamp: 'desc' },
      take: 500,
    });
  }

  // ── Reglas de alerta ──
  createAlertRule(dto: CreateAlertRuleDto) {
    return this.prisma.iotAlertRule.create({
      data: {
        tenantId: this.tid,
        deviceId: dto.deviceId,
        metric: dto.metric,
        operator: dto.operator,
        threshold: dto.threshold,
        severity: dto.severity ?? 'medium',
        message: dto.message,
      },
    });
  }

  listAlertRules() {
    return this.prisma.iotAlertRule.findMany({ where: { tenantId: this.tid }, orderBy: { createdAt: 'desc' } });
  }

  // ── Evaluar reglas al recibir medicion ──
  private async evaluateAlertRules(deviceId: string, metric: string, value: number) {
    const rules = await this.prisma.iotAlertRule.findMany({
      where: {
        tenantId: this.tid,
        metric,
        enabled: true,
        OR: [{ deviceId }, { deviceId: null }],
      },
    });

    for (const rule of rules) {
      let triggered = false;
      switch (rule.operator) {
        case 'gt': triggered = value > rule.threshold; break;
        case 'lt': triggered = value < rule.threshold; break;
        case 'gte': triggered = value >= rule.threshold; break;
        case 'lte': triggered = value <= rule.threshold; break;
        case 'eq': triggered = value === rule.threshold; break;
      }

      if (triggered) {
        await this.prisma.alert.create({
          data: {
            tenantId: this.tid,
            type: 'iot',
            severity: rule.severity,
            message: rule.message ?? `IoT alerta: ${metric} = ${value} (umbral: ${rule.operator} ${rule.threshold})`,
            entityRef: `device:${deviceId}`,
          },
        });
      }
    }
  }

  private async assertDevice(id: string) {
    const d = await this.prisma.iotDevice.findFirst({ where: { id, tenantId: this.tid } });
    if (!d) throw new NotFoundException('Dispositivo no encontrado');
  }
}
