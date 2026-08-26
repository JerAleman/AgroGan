import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getTenantId } from '../tenant/tenant-context';

/**
 * PrismaService.
 *
 * - DEV (SQLite): el aislamiento multi-tenant se aplica en la capa de servicios,
 *   que siempre filtran por tenantId (helper `tenantId()`), reforzado por tests
 *   de aislamiento.
 * - PROD (PostgreSQL/Aurora): además se activa Row Level Security; `forTenant`
 *   fija `app.current_tenant` dentro de una transacción (última línea de defensa).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** tenantId del contexto actual, para usar en cláusulas where/data. */
  tenantId(): string {
    return getTenantId();
  }

  /**
   * Ejecuta operaciones con RLS activa (solo Postgres). En SQLite es un
   * passthrough transaccional para mantener la misma firma en el código.
   */
  async forTenant<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    const provider = process.env.DATABASE_URL?.startsWith('postgres');
    return this.$transaction(async (tx) => {
      if (provider) {
        await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${getTenantId()}'`);
      }
      return fn(tx as unknown as PrismaClient);
    });
  }
}
