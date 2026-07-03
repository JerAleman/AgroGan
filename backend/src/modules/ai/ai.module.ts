import { Module } from '@nestjs/common';
import { LivestockModule } from '../livestock/livestock.module';
import { AgricultureModule } from '../agriculture/agriculture.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ReportsModule } from '../reports/reports.module';
import { BreedingModule } from '../breeding/breeding.module';
import { FeedlotModule } from '../feedlot/feedlot.module';
import { DairyModule } from '../dairy/dairy.module';
import { FinanceModule } from '../finance/finance.module';
import { ServicesModule } from '../services/services.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    LivestockModule,
    AgricultureModule,
    InventoryModule,
    ReportsModule,
    BreedingModule,
    FeedlotModule,
    DairyModule,
    FinanceModule,
    ServicesModule,
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
