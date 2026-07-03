import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { tenantStorage } from './tenant-context';

/**
 * Valida el JWT de Cognito y establece el contexto de tenant para el request.
 * El tenant_id SIEMPRE proviene del claim del token, nunca del cliente.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
    tokenUse: 'access',
    clientId: process.env.COGNITO_CLIENT_ID ?? '',
  });

  async use(req: Request, _res: Response, next: NextFunction) {
    // Rutas públicas (registro, health) pueden saltar esta validación vía config.
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta token Bearer');
    }

    try {
      const payload: any = await this.verifier.verify(auth.slice(7));
      const tenantId = payload['custom:tenant_id'];
      if (!tenantId) throw new UnauthorizedException('Token sin tenant_id');

      tenantStorage.run(
        {
          tenantId,
          userId: payload.sub,
          roles: (payload['cognito:groups'] as string[]) ?? [],
        },
        () => next(),
      );
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
