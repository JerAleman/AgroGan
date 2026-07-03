import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  tenantId: string;
  userId?: string;
  roles?: string[];
}

/**
 * Contexto de tenant por request usando AsyncLocalStorage.
 * Se puebla en TenantMiddleware a partir del JWT de Cognito y se propaga
 * a PrismaService (para fijar RLS) y al resto de la aplicación.
 */
export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getTenantId(): string {
  const store = tenantStorage.getStore();
  if (!store?.tenantId) {
    throw new Error('Tenant context no inicializado (falta tenantId).');
  }
  return store.tenantId;
}
