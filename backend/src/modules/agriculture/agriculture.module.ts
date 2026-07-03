import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { AgricultureController } from './agriculture.controller';
import { AgricultureService } from './agriculture.service';

@Module({
  imports: [InventoryModule],
  controllers: [AgricultureController],
  providers: [AgricultureService],
  exports: [AgricultureService],
})
export class AgricultureModule {}
