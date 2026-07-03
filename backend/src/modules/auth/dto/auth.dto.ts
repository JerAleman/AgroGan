import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterTenantDto {
  @IsString() @MinLength(2)
  companyName!: string;

  @IsOptional() @IsString()
  country?: string;

  @IsOptional() @IsString()
  defaultCurrency?: string;

  @IsEmail()
  adminEmail!: string;

  @IsString() @MinLength(2)
  adminFullName!: string;

  @IsString() @MinLength(6)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
