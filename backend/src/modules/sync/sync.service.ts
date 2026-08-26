import { Injectable, Logger } from '@nestjs/common';
import { LivestockService } from '../livestock/livestock.service';
import { InventoryService } from '../inventory/inventory.service';
import { AgricultureService } from '../agriculture/agriculture.service';
import { SyncBatchDto, SyncEventDto } from './dto/sync.dto';

export interface SyncResult {
  clientUuid: string;
  status: 'applied' | 'rejected';
  id?: string;
  error?: string;
}

/**
 * Procesa un lote de eventos generados offline. Cada handler es idempotente por
 * (tenantId, clientUuid), por lo que reintentos o duplicados no generan datos
 * repetidos. Los errores se aíslan por evento (uno malo no frena el resto).
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger('SyncService');

  constructor(
    private readonly livestock: LivestockService,
    private readonly inventory: InventoryService,
    private readonly agriculture: AgricultureService,
  ) {}

  async processBatch(dto: SyncBatchDto): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    for (const event of dto.events) {
      results.push(await this.processOne(event));
    }
    return results;
  }

  private async processOne(event: SyncEventDto): Promise<SyncResult> {
    const payload = { ...event.payload, clientUuid: event.clientUuid } as any;
    try {
      let record: { id: string };
      switch (event.entity) {
        case 'weighing':
          record = await this.livestock.createWeighing(payload);
          break;
        case 'livestock-movement':
          record = await this.livestock.createMovement(payload);
          break;
        case 'health-event':
          record = (await this.livestock.createHealthEvent(payload)) as { id: string };
          break;
        case 'inventory-movement':
          record = await this.inventory.createMovement(payload);
          break;
        case 'agri-activity':
          record = await this.agriculture.createActivity(payload);
          break;
        default:
          return { clientUuid: event.clientUuid, status: 'rejected', error: `Entidad desconocida: ${event.entity}` };
      }
      return { clientUuid: event.clientUuid, status: 'applied', id: record.id };
    } catch (err) {
      this.logger.warn(`Sync rechazado (${event.entity}/${event.clientUuid}): ${(err as Error).message}`);
      return { clientUuid: event.clientUuid, status: 'rejected', error: (err as Error).message };
    }
  }
}
