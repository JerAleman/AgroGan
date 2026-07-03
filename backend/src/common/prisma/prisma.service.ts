import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getTenantId } from '../tenant/tenant-context';

/**
 * PrismaService con enforcement de Row Level Security.
 *
 * `forTenant()` ejecuta las operaciones dentro de una transacción que fija
 * `app.current_tenant`, de modo que las políticas RLS de PostgreSQL filtran
 * automáticamente por tenant_id. Es la última línea de defensa de aislamiento,
 * independiente de la lógica de aplicación.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async forTenant<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    const tenantId = getTenantId();
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
      return fn(tx as unknown as PrismaClient);
    });
  }
}
