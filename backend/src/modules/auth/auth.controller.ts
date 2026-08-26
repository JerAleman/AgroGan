import { Body, Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterTenantDto } from './dto/auth.dto';
import { CurrentUser, Public } from '../../common/auth/decorators';
import { TenantStore } from '../../common/tenant/tenant-context';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register-tenant')
  @ApiOperation({ summary: 'Alta self-service de empresa (tenant) + usuario admin' })
  register(@Body() dto: RegisterTenantDto) {
    return this.auth.registerTenant(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login con email y password' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  me(@CurrentUser() user: TenantStore) {
    if (!user?.userId) throw new UnauthorizedException();
    return this.auth.me(user.userId);
  }
}
