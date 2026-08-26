import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TokenService } from '../../common/auth/token.service';
import { LoginDto, RegisterTenantDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Alta self-service: crea Tenant + Company + usuario owner y devuelve un token.
   */
  async registerTenant(dto: RegisterTenantDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.adminEmail } });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName,
        country: dto.country ?? 'AR',
        defaultCurrency: dto.defaultCurrency ?? 'ARS',
        companies: { create: { name: dto.companyName, country: dto.country ?? 'AR' } },
      },
    });

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.adminEmail,
        passwordHash: await bcrypt.hash(dto.password, 10),
        fullName: dto.adminFullName,
        role: 'owner',
      },
    });

    return this.buildAuthResponse(user, tenant);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { id: user.tenantId } });
    return this.buildAuthResponse(user, tenant!);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const tenant = await this.prisma.tenant.findUnique({ where: { id: user.tenantId } });
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenant: { id: tenant!.id, name: tenant!.name, country: tenant!.country, currency: tenant!.defaultCurrency },
    };
  }

  private buildAuthResponse(user: { id: string; email: string; fullName: string; role: string; tenantId: string }, tenant: { id: string; name: string }) {
    const accessToken = this.tokens.sign({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });
    return {
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      tenant: { id: tenant.id, name: tenant.name },
    };
  }
}
