import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateCropDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() species?: string;
}

export class CreateCampaignDto {
  @IsUUID() establishmentId!: string;
  @IsUUID() cropId!: string;
  @IsString() season!: string;
  @IsOptional() @IsNumber() @Min(0) plannedAreaHa?: number;
  @IsOptional() @IsNumber() @Min(0) expectedYield?: number;
  @IsOptional() @IsNumber() @Min(0) revenue?: number;
}

export class CreateActivityDto {
  @IsUUID() campaignId!: string;
  @IsUUID() lotId!: string;
  @IsIn(['siembra', 'fumigacion', 'fertilizacion', 'cosecha', 'riego']) type!: string;
  @IsOptional() @IsNumber() @Min(0) areaHa?: number;
  @IsOptional() @IsNumber() @Min(0) costDirect?: number;
  @IsOptional() @IsNumber() @Min(0) yieldResult?: number;
  @IsOptional() @IsString() date?: string;
  // Consumo automático opcional de insumo desde inventario.
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsNumber() @Min(0) productQty?: number;
  @IsOptional() @IsString() clientUuid?: string;
}
