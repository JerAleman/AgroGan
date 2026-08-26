import { Module } from '@nestjs/common';
import { LivestockModule } from '../livestock/livestock.module';
import { AgricultureModule } from '../agriculture/agriculture.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [LivestockModule, AgricultureModule, InventoryModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
