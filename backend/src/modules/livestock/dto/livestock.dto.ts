import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() species?: string;
  @IsOptional() @IsString() sex?: string;
}

export class CreateHerdDto {
  @IsUUID() establishmentId!: string;
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsIn(['cria', 'recria', 'engorde', 'feedlot', 'tambo']) purpose?: string;
}

export class CreateBatchDto {
  @IsUUID() herdId!: string;
  @IsUUID() categoryId!: string;
  @IsOptional() @IsUUID() paddockId?: string;
  @IsOptional() @IsInt() @Min(0) headCount?: number;
  @IsOptional() @IsNumber() @Min(0) avgWeight?: number;
}

export class CreateLivestockMovementDto {
  @IsOptional() @IsUUID() batchId?: string;
  @IsUUID() categoryId!: string;
  @IsIn(['purchase', 'sale', 'birth', 'death', 'transfer', 'category_change']) type!: string;
  @IsInt() @Min(1) headCount!: number;
  @IsOptional() @IsNumber() @Min(0) weight?: number;
  @IsOptional() @IsNumber() @Min(0) amount?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() clientUuid?: string;
}

export class CreateWeighingDto {
  @IsUUID() batchId!: string;
  @IsNumber() @Min(0) weight!: number;
  @IsOptional() @IsIn(['manual', 'rfid', 'scale']) method?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() clientUuid?: string;
}

export class CreateHealthEventDto {
  @IsUUID() batchId!: string;
  @IsIn(['vacuna', 'tratamiento', 'diagnostico']) type!: string;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsNumber() @Min(0) dose?: number;
  @IsOptional() @IsInt() @Min(0) headCount?: number;
  @IsOptional() @IsString() nextDueDate?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() clientUuid?: string;
}
