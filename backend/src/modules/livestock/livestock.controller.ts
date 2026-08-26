import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LivestockService } from './livestock.service';
import {
  CreateBatchDto,
  CreateCategoryDto,
  CreateHealthEventDto,
  CreateHerdDto,
  CreateLivestockMovementDto,
  CreateWeighingDto,
} from './dto/livestock.dto';

@ApiTags('Livestock')
@ApiBearerAuth()
@Controller('livestock')
export class LivestockController {
  constructor(private readonly livestock: LivestockService) {}

  @Get('categories')
  categories() {
    return this.livestock.listCategories();
  }
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.livestock.createCategory(dto);
  }

  @Get('herds')
  herds() {
    return this.livestock.listHerds();
  }
  @Post('herds')
  createHerd(@Body() dto: CreateHerdDto) {
    return this.livestock.createHerd(dto);
  }

  @Get('batches')
  batches() {
    return this.livestock.listBatches();
  }
  @Post('batches')
  createBatch(@Body() dto: CreateBatchDto) {
    return this.livestock.createBatch(dto);
  }

  @Post('movements')
  createMovement(@Body() dto: CreateLivestockMovementDto) {
    return this.livestock.createMovement(dto);
  }

  @Post('weighings')
  createWeighing(@Body() dto: CreateWeighingDto) {
    return this.livestock.createWeighing(dto);
  }

  @Post('health-events')
  createHealthEvent(@Body() dto: CreateHealthEventDto) {
    return this.livestock.createHealthEvent(dto);
  }

  @Get('stock')
  stock() {
    return this.livestock.stockByCategory();
  }

  @Get('due-health-tasks')
  dueHealthTasks(@Query('days') days?: string) {
    return this.livestock.dueHealthTasks(days ? Number(days) : 7);
  }
}
