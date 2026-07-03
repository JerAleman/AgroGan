import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateMachineDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() type?: string; // tractor | cosechadora | fumigadora | sembradora | camion | otro
  @IsOptional() @IsIn(['own', 'contracted']) ownership?: string;
  @IsOptional() @IsNumber() @Min(0) acquisitionCost?: number;
  @IsOptional() @IsNumber() @Min(0) hourMeter?: number;
}

export class CreateMachineTaskDto {
  @IsUUID() machineId!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) hours?: number;
  @IsOptional() @IsNumber() @Min(0) hectares?: number;
  @IsOptional() @IsNumber() @Min(0) fuelQty?: number;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() clientUuid?: string;
}

export class CreateMaintenanceDto {
  @IsUUID() machineId!: string;
  @IsIn(['preventive', 'corrective']) type!: string;
  @IsOptional() @IsNumber() @Min(0) cost?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() nextDue?: string;
}
