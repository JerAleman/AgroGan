import { IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateFarmDto {
  @IsUUID() companyId!: string;
  @IsString() @MinLength(2) name!: string;
}

export class CreateEstablishmentDto {
  @IsUUID() farmId!: string;
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsNumber() @Min(0) totalAreaHa?: number;
}

export class CreateLotDto {
  @IsUUID() establishmentId!: string;
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsNumber() @Min(0) areaHa?: number;
}

export class CreatePaddockDto {
  @IsUUID() establishmentId!: string;
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsNumber() @Min(0) areaHa?: number;
  @IsOptional() @IsString() forageType?: string;
}
