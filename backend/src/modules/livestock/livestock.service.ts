import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantId } from '../../common/tenant/tenant-context';
import { CreateHealthEventDto } from './dto/health-event.dto';

@Injectable()
export class LivestockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un evento sanitario y descuenta automáticamente el producto
   * del inventario. Idempotente por (tenant_id, clientUuid) para soportar
   * sincronización offline. Si el stock cae bajo el mínimo, emite una alerta
   * (publicación a EventBridge — omitida en este esqueleto).
   */
  async createHealthEvent(dto: CreateHealthEventDto) {
    const tenantId = getTenantId();

    return this.prisma.forTenant(async (tx) => {
      // 1. Idempotencia: si ya existe el clientUuid, devolver el existente.
      if (dto.clientUuid) {
        const existing = await tx.healthEvent.findFirst({
          where: { tenantId, clientUuid: dto.clientUuid },
        });
        if (existing) return existing;
      }

      // 2. Crear el evento sanitario.
      const event = await tx.healthEvent.create({
        data: {
          tenantId,
          batchId: dto.batchId,
          animalId: dto.animalId,
          date: new Date(dto.date),
          type: dto.type,
          productId: dto.productId,
          dose: dto.dose,
          nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
          clientUuid: dto.clientUuid,
        },
      });

      // 3. Descontar inventario si aplica (producto + dosis * cabezas).
      if (dto.productId && dto.dose && dto.headCount) {
        const consumedQty = dto.dose * dto.headCount;
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            productId: dto.productId,
            type: 'out',
            qty: consumedQty,
            sourceType: 'health_event',
            sourceId: event.id,
            date: new Date(dto.date),
          },
        });
        // NOTE: recalcular InventoryStock y, si stock < min_stock,
        // publicar evento 'inventory.below_min' a EventBridge → Alert.
      }

      return event;
    });
  }
}
