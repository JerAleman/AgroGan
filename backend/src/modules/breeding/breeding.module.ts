import { Module } from '@nestjs/common';
import { BreedingController } from './breeding.controller';
import { BreedingService } from './breeding.service';

@Module({
  controllers: [BreedingController],
  providers: [BreedingService],
  exports: [BreedingService],
})
export class BreedingModule {}
