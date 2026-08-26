import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AskDto } from './dto/ai.dto';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('ask')
  @ApiOperation({ summary: 'Pregunta en lenguaje natural al Copiloto Campo AI' })
  ask(@Body() dto: AskDto) {
    return this.ai.ask(dto.text);
  }

  @Post('summary')
  @ApiOperation({ summary: 'Resumen del campo generado por el copiloto' })
  summary() {
    return this.ai.weeklySummary();
  }
}
