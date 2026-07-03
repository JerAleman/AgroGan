import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators';
import { getTenantStore } from '../tenant/tenant-context';

/**
 * Guard global: exige un contexto de tenant válido (poblado por el middleware
 * a partir del JWT), salvo en rutas marcadas con @Public().
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const store = getTenantStore();
    if (!store?.tenantId || !store?.userId) {
      throw new UnauthorizedException('Token ausente o inválido');
    }
    return true;
  }
}
