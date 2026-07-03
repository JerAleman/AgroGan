import { Module } from '@nestjs/common';
import { LivestockModule } from '../livestock/livestock.module';
import { AgricultureModule } from '../agriculture/agriculture.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ReportsModule } from '../reports/reports.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [LivestockModule, AgricultureModule, InventoryModule, ReportsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
