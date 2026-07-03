import { Module } from '@nestjs/common';
import { FeedlotController } from './feedlot.controller';
import { FeedlotService } from './feedlot.service';

@Module({
  controllers: [FeedlotController],
  providers: [FeedlotService],
  exports: [FeedlotService],
})
export class FeedlotModule {}
