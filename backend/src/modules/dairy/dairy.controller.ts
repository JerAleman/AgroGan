import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DairyService } from './dairy.service';
import { CreateCowDto, CreateMilkProductionDto, CreateMilkSettlementDto } from './dto/dairy.dto';

@ApiTags('Dairy')
@ApiBearerAuth()
@Controller('dairy')
export class DairyController {
  constructor(private readonly dairy: DairyService) {}

  @Get('cows')
  cows(@Query('status') status?: string) {
    return this.dairy.listCows(status);
  }

  @Post('cows')
  createCow(@Body() dto: CreateCowDto) {
    return this.dairy.createCow(dto);
  }

  @Get('productions')
  productions(@Query('days') days?: string) {
    return this.dairy.listProductions(days ? Number(days) : 30);
  }

  @Post('productions')
  createProduction(@Body() dto: CreateMilkProductionDto) {
    return this.dairy.createProduction(dto);
  }

  @Get('settlements')
  settlements() {
    return this.dairy.listSettlements();
  }

  @Post('settlements')
  createSettlement(@Body() dto: CreateMilkSettlementDto) {
    return this.dairy.createSettlement(dto);
  }

  @Get('summary')
  summary() {
    return this.dairy.dairySummary();
  }
}
