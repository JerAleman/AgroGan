import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export enum HealthEventType {
  VACUNA = 'vacuna',
  TRATAMIENTO = 'tratamiento',
  DIAGNOSTICO = 'diagnostico',
}

export class CreateHealthEventDto {
  @IsOptional() @IsUUID()
  batchId?: string;

  @IsOptional() @IsUUID()
  animalId?: string;

  @IsDateString()
  date!: string;

  @IsEnum(HealthEventType)
  type!: HealthEventType;

  @IsOptional() @IsUUID()
  productId?: string;

  @IsOptional() @IsNumber()
  dose?: number;

  @IsOptional() @IsNumber()
  headCount?: number;

  @IsOptional() @IsDateString()
  nextDueDate?: string;

  /** Idempotencia offline: dedup por (tenant_id, clientUuid). */
  @IsOptional() @IsString()
  clientUuid?: string;
}
