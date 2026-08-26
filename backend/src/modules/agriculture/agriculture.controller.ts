import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgricultureService } from './agriculture.service';
import { CreateActivityDto, CreateCampaignDto, CreateCropDto } from './dto/agriculture.dto';

@ApiTags('Agriculture')
@ApiBearerAuth()
@Controller('agriculture')
export class AgricultureController {
  constructor(private readonly agriculture: AgricultureService) {}

  @Get('crops')
  crops() {
    return this.agriculture.listCrops();
  }
  @Post('crops')
  createCrop(@Body() dto: CreateCropDto) {
    return this.agriculture.createCrop(dto);
  }

  @Get('campaigns')
  campaigns() {
    return this.agriculture.listCampaigns();
  }
  @Post('campaigns')
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.agriculture.createCampaign(dto);
  }

  @Get('activities')
  activities(@Query('campaignId') campaignId?: string) {
    return this.agriculture.listActivities(campaignId);
  }
  @Post('activities')
  createActivity(@Body() dto: CreateActivityDto) {
    return this.agriculture.createActivity(dto);
  }

  @Get('gross-margin')
  grossMargin() {
    return this.agriculture.grossMargin();
  }
}
