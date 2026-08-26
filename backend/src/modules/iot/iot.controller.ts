import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IotService } from './iot.service';
import { BulkMeasurementsDto, CreateAlertRuleDto, CreateDeviceDto, CreateMeasurementDto } from './dto/iot.dto';

@ApiTags('IoT')
@ApiBearerAuth()
@Controller('iot')
export class IotController {
  constructor(private readonly iot: IotService) {}

  @Get('devices')
  devices() {
    return this.iot.listDevices();
  }

  @Post('devices')
  createDevice(@Body() dto: CreateDeviceDto) {
    return this.iot.createDevice(dto);
  }

  @Post('measurements')
  createMeasurement(@Body() dto: CreateMeasurementDto) {
    return this.iot.createMeasurement(dto);
  }

  @Post('measurements/bulk')
  bulkMeasurements(@Body() dto: BulkMeasurementsDto) {
    return this.iot.bulkIngest(dto);
  }

  @Get('measurements')
  measurements(@Query('deviceId') deviceId?: string, @Query('metric') metric?: string, @Query('hours') hours?: string) {
    return this.iot.listMeasurements(deviceId, metric, hours ? Number(hours) : 24);
  }

  @Get('alert-rules')
  alertRules() {
    return this.iot.listAlertRules();
  }

  @Post('alert-rules')
  createAlertRule(@Body() dto: CreateAlertRuleDto) {
    return this.iot.createAlertRule(dto);
  }
}
