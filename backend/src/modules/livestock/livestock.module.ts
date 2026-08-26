import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { LivestockController } from './livestock.controller';
import { LivestockService } from './livestock.service';

@Module({
  imports: [InventoryModule],
  controllers: [LivestockController],
  providers: [LivestockService],
  exports: [LivestockService],
})
export class LivestockModule {}
