import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FeedlotService } from './feedlot.service';
import { CreateConsumptionDto, CreateDietDto, CreatePenDto, CreateTroopDto } from './dto/feedlot.dto';

@ApiTags('Feedlot')
@ApiBearerAuth()
@Controller('feedlot')
export class FeedlotController {
  constructor(private readonly feedlot: FeedlotService) {}

  @Get('pens')
  pens() {
    return this.feedlot.listPens();
  }

  @Post('pens')
  createPen(@Body() dto: CreatePenDto) {
    return this.feedlot.createPen(dto);
  }

  @Get('troops')
  troops(@Query('status') status?: string) {
    return this.feedlot.listTroops(status);
  }

  @Post('troops')
  createTroop(@Body() dto: CreateTroopDto) {
    return this.feedlot.createTroop(dto);
  }

  @Get('diets')
  diets() {
    return this.feedlot.listDiets();
  }

  @Post('diets')
  createDiet(@Body() dto: CreateDietDto) {
    return this.feedlot.createDiet(dto);
  }

  @Post('consumptions')
  createConsumption(@Body() dto: CreateConsumptionDto) {
    return this.feedlot.createConsumption(dto);
  }

  @Get('summary')
  summary() {
    return this.feedlot.penSummary();
  }
}
