import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MachineryService } from './machinery.service';
import { CreateMachineDto, CreateMachineTaskDto, CreateMaintenanceDto } from './dto/machinery.dto';

@ApiTags('Machinery')
@ApiBearerAuth()
@Controller('machinery')
export class MachineryController {
  constructor(private readonly machinery: MachineryService) {}

  @Get('machines')
  machines() {
    return this.machinery.listMachines();
  }
  @Post('machines')
  createMachine(@Body() dto: CreateMachineDto) {
    return this.machinery.createMachine(dto);
  }

  @Post('tasks')
  createTask(@Body() dto: CreateMachineTaskDto) {
    return this.machinery.createTask(dto);
  }
  @Get('tasks')
  tasks(@Query('machineId') machineId?: string) {
    return this.machinery.listTasks(machineId);
  }

  @Post('maintenance')
  createMaintenance(@Body() dto: CreateMaintenanceDto) {
    return this.machinery.createMaintenance(dto);
  }
  @Get('maintenance')
  maintenance(@Query('machineId') machineId?: string) {
    return this.machinery.listMaintenance(machineId);
  }

  @Get('summary')
  summary() {
    return this.machinery.summary();
  }
}
