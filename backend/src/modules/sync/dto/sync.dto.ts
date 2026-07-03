import { Type } from 'class-transformer';
import { IsArray, IsIn, IsObject, IsString, ValidateNested } from 'class-validator';

export class SyncEventDto {
  @IsString() clientUuid!: string;
  @IsIn(['weighing', 'livestock-movement', 'health-event', 'inventory-movement', 'agri-activity'])
  entity!: string;
  @IsObject() payload!: Record<string, unknown>;
}

export class SyncBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncEventDto)
  events!: SyncEventDto[];
}
