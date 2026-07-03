import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncBatchDto } from './dto/sync.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post('batch')
  @ApiOperation({ summary: 'Sincroniza un lote de eventos offline (idempotente por clientUuid)' })
  batch(@Body() dto: SyncBatchDto) {
    return this.sync.processBatch(dto);
  }
}
