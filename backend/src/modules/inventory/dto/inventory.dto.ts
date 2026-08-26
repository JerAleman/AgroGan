import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export const PRODUCT_CATEGORIES = [
  'fitosanitario', 'fertilizante', 'semilla', 'vacuna', 'medicamento',
  'suplemento', 'combustible', 'repuesto', 'herramienta',
];

export class CreateProductDto {
  @IsString() @MinLength(2) name!: string;
  @IsIn(PRODUCT_CATEGORIES) category!: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Min(0) minStock?: number;
  @IsOptional() @IsNumber() @Min(0) avgCost?: number;
}

export class CreateWarehouseDto {
  @IsUUID() establishmentId!: string;
  @IsString() @MinLength(2) name!: string;
}

export class CreateMovementDto {
  @IsUUID() warehouseId!: string;
  @IsUUID() productId!: string;
  @IsIn(['in', 'out', 'transfer', 'adjust']) type!: string;
  @IsNumber() qty!: number;
  @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @IsOptional() @IsString() clientUuid?: string;
}
