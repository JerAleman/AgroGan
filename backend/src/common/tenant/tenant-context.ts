import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  tenantId: string;
  userId?: string;
  role?: string;
}

/**
 * Contexto de tenant por request usando AsyncLocalStorage.
 * Se puebla en AuthGuard a partir del JWT y se propaga a servicios/Prisma.
 */
export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function runWithTenant<T>(store: TenantStore, fn: () => T): T {
  return tenantStorage.run(store, fn);
}

export function getTenantStore(): TenantStore | undefined {
  return tenantStorage.getStore();
}

export function getTenantId(): string {
  const store = tenantStorage.getStore();
  if (!store?.tenantId) {
    throw new Error('Tenant context no inicializado (falta tenantId).');
  }
  return store.tenantId;
}

export function getUserId(): string | undefined {
  return tenantStorage.getStore()?.userId;
}
