import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BreedingService } from './breeding.service';
import { CreateReproductiveEventDto, CreateSireDto } from './dto/breeding.dto';

@ApiTags('Breeding')
@ApiBearerAuth()
@Controller('breeding')
export class BreedingController {
  constructor(private readonly breeding: BreedingService) {}

  @Get('sires')
  sires() {
    return this.breeding.listSires();
  }

  @Post('sires')
  createSire(@Body() dto: CreateSireDto) {
    return this.breeding.createSire(dto);
  }

  @Get('events')
  events(@Query('type') type?: string) {
    return this.breeding.listEvents(type);
  }

  @Post('events')
  createEvent(@Body() dto: CreateReproductiveEventDto) {
    return this.breeding.createEvent(dto);
  }

  @Get('indices')
  indices() {
    return this.breeding.reproductiveIndices();
  }

  @Get('empty-cows')
  emptyCows() {
    return this.breeding.emptyCows();
  }
}
