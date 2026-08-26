import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeviceDto {
  @IsString() name: string;
  @IsString() deviceType: string; // weather_station | scale | water_sensor | soil_sensor | gps_collar | camera
  @IsOptional() @IsString() location?: string;
}

export class CreateMeasurementDto {
  @IsString() deviceId: string;
  @IsString() metric: string;
  @IsNumber() value: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsDateString() timestamp?: string;
  @IsOptional() @IsString() clientUuid?: string;
}

export class BulkMeasurementItem {
  @IsString() deviceId: string;
  @IsString() metric: string;
  @IsNumber() value: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsDateString() timestamp?: string;
  @IsOptional() @IsString() clientUuid?: string;
}

export class BulkMeasurementsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkMeasurementItem)
  measurements: BulkMeasurementItem[];
}

export class CreateAlertRuleDto {
  @IsOptional() @IsString() deviceId?: string;
  @IsString() metric: string;
  @IsString() operator: string; // gt | lt | eq | gte | lte
  @IsNumber() threshold: number;
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsString() message?: string;
}
