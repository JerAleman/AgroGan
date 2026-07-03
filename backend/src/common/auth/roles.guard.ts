import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators';
import { getTenantStore } from '../tenant/tenant-context';

/**
 * Guard global de roles (RBAC). Solo aplica si la ruta declara @Roles(...).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const role = getTenantStore()?.role;
    // owner y admin siempre tienen acceso.
    if (role === 'owner' || role === 'admin') return true;
    if (!role || !required.includes(role)) {
      throw new ForbiddenException('No tenés permisos para esta acción');
    }
    return true;
  }
}
