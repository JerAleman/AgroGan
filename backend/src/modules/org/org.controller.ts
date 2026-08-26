import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrgService } from './org.service';
import { CreateEstablishmentDto, CreateFarmDto, CreateLotDto, CreatePaddockDto } from './dto/org.dto';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller()
export class OrgController {
  constructor(private readonly org: OrgService) {}

  @Get('companies')
  companies() {
    return this.org.listCompanies();
  }

  @Get('farms')
  farms() {
    return this.org.listFarms();
  }
  @Post('farms')
  createFarm(@Body() dto: CreateFarmDto) {
    return this.org.createFarm(dto);
  }

  @Get('establishments')
  establishments() {
    return this.org.listEstablishments();
  }
  @Get('establishments/:id')
  establishment(@Param('id') id: string) {
    return this.org.getEstablishment(id);
  }
  @Post('establishments')
  createEstablishment(@Body() dto: CreateEstablishmentDto) {
    return this.org.createEstablishment(dto);
  }

  @Get('lots')
  lots(@Query('establishmentId') establishmentId?: string) {
    return this.org.listLots(establishmentId);
  }
  @Post('lots')
  createLot(@Body() dto: CreateLotDto) {
    return this.org.createLot(dto);
  }

  @Get('paddocks')
  paddocks(@Query('establishmentId') establishmentId?: string) {
    return this.org.listPaddocks(establishmentId);
  }
  @Post('paddocks')
  createPaddock(@Body() dto: CreatePaddockDto) {
    return this.org.createPaddock(dto);
  }
}
