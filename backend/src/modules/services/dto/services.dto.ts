import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateCustomerDto {
  @IsString() name: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsString() contact?: string;
}

export class CreateServiceOrderDto {
  @IsString() customerId: string;
  @IsString() type: string; // siembra | cosecha | fumigacion | transporte | otro
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() areaHa?: number;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsNumber() cost?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() clientUuid?: string;
}
