import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateAccountDto {
  @IsString() name: string;
  @IsString() type: string; // caja | banco | cuenta_corriente
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() balance?: number;
}

export class CreateTransactionDto {
  @IsString() accountId: string;
  @IsString() type: string; // ingreso | egreso | transferencia
  @IsOptional() @IsString() category?: string;
  @IsNumber() amount: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() counterparty?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() clientUuid?: string;
}

export class CreateBudgetDto {
  @IsString() name: string;
  @IsString() period: string;
  @IsString() category: string;
  @IsOptional() @IsNumber() planned?: number;
  @IsOptional() @IsNumber() actual?: number;
}
