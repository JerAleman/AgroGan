import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './common/auth/decorators';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'agro360-backend', ts: new Date().toISOString() };
  }
}
