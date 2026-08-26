import { IsString, IsOptional, IsInt, IsDateString, Min } from 'class-validator';

export class CreateSireDto {
  @IsString() name: string;
  @IsOptional() @IsString() breed?: string;
  @IsOptional() @IsString() sireType?: string;
}

export class CreateReproductiveEventDto {
  @IsOptional() @IsString() batchId?: string;
  @IsOptional() @IsString() sireId?: string;
  @IsString() type: string; // servicio | tacto | paricion | destete
  @IsOptional() @IsInt() @Min(0) headCount?: number;
  @IsOptional() @IsString() result?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() clientUuid?: string;
}
