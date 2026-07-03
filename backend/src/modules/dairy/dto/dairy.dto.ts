import { IsString, IsOptional, IsInt, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateCowDto {
  @IsString() identifier: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsInt() @Min(1) lactationNumber?: number;
}

export class CreateMilkProductionDto {
  @IsString() cowId: string;
  @IsOptional() @IsNumber() liters?: number;
  @IsOptional() @IsNumber() fatPct?: number;
  @IsOptional() @IsNumber() proteinPct?: number;
  @IsOptional() @IsInt() somaticCells?: number;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() clientUuid?: string;
}

export class CreateMilkSettlementDto {
  @IsDateString() periodFrom: string;
  @IsDateString() periodTo: string;
  @IsOptional() @IsNumber() totalLiters?: number;
  @IsOptional() @IsNumber() pricePerLiter?: number;
  @IsOptional() @IsNumber() bonuses?: number;
  @IsOptional() @IsNumber() deductions?: number;
}
