import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LivestockService } from './livestock.service';
import { CreateHealthEventDto } from './dto/health-event.dto';

@ApiTags('Livestock')
@ApiBearerAuth()
@Controller('livestock')
export class LivestockController {
  constructor(private readonly livestock: LivestockService) {}

  @Post('health-events')
  createHealthEvent(@Body() dto: CreateHealthEventDto) {
    return this.livestock.createHealthEvent(dto);
  }
}
