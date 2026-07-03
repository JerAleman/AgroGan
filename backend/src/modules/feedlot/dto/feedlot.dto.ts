import { IsString, IsOptional, IsInt, IsNumber, IsDateString, Min } from 'class-validator';

export class CreatePenDto {
  @IsString() name: string;
  @IsOptional() @IsInt() @Min(0) capacity?: number;
}

export class CreateTroopDto {
  @IsString() penId: string;
  @IsString() categoryName: string;
  @IsOptional() @IsInt() @Min(0) headCount?: number;
  @IsOptional() @IsNumber() entryWeight?: number;
  @IsOptional() @IsNumber() targetWeight?: number;
  @IsOptional() @IsDateString() projectedExitDate?: string;
}

export class CreateDietDto {
  @IsString() name: string;
  @IsOptional() @IsNumber() costPerKg?: number;
  @IsOptional() @IsString() composition?: string;
}

export class CreateConsumptionDto {
  @IsString() troopId: string;
  @IsString() dietId: string;
  @IsOptional() @IsNumber() kgConsumed?: number;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() clientUuid?: string;
}
