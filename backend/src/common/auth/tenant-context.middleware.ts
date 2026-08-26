import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TokenService } from './token.service';
import { runWithTenant } from '../tenant/tenant-context';

/**
 * Extrae y valida el JWT (si está presente) y ejecuta el resto del request
 * dentro del contexto de tenant (AsyncLocalStorage). No rechaza: la aplicación
 * de la política de acceso la hace AuthGuard, permitiendo rutas públicas.
 *
 * El tenantId SIEMPRE proviene del claim del token, nunca del cliente.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tokens: TokenService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      const claims = this.tokens.safeVerify(auth.slice(7));
      if (claims) {
        return runWithTenant(
          { tenantId: claims.tenantId, userId: claims.sub, role: claims.role },
          () => next(),
        );
      }
    }
    return next();
  }
}
