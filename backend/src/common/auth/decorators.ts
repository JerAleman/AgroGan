import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { getTenantStore, TenantStore } from '../tenant/tenant-context';

export const IS_PUBLIC_KEY = 'isPublic';
/** Marca una ruta como pública (sin autenticación). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Restringe una ruta a determinados roles. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/** Inyecta el usuario/tenant del contexto actual. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): TenantStore | undefined => getTenantStore(),
);
