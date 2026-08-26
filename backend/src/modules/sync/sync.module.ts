import { Module } from '@nestjs/common';
import { LivestockModule } from '../livestock/livestock.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AgricultureModule } from '../agriculture/agriculture.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [LivestockModule, InventoryModule, AgricultureModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
