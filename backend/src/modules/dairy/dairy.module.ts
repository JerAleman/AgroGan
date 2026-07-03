import { Module } from '@nestjs/common';
import { DairyController } from './dairy.controller';
import { DairyService } from './dairy.service';

@Module({
  controllers: [DairyController],
  providers: [DairyService],
  exports: [DairyService],
})
export class DairyModule {}
