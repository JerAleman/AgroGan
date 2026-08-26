-- Agro360 Cloud — Row Level Security (RLS) para PRODUCCIÓN (PostgreSQL/Aurora).
--
-- En dev usamos SQLite y aislamiento a nivel de aplicación (los servicios filtran
-- por tenantId, verificado por tests). En producción, además, se activa RLS como
-- última línea de defensa. Ejecutar este script tras aplicar el schema en Postgres.
-- El backend fija `SET LOCAL app.current_tenant = '<uuid>'` en cada transacción
-- (ver PrismaService.forTenant). Ver docs/03-architecture.md §8.

CREATE OR REPLACE FUNCTION current_tenant() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant', true), '')::uuid;
$$ LANGUAGE sql STABLE;

DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'Company', 'Farm', 'Establishment', 'Lot', 'Paddock',
    'InputProduct', 'InventoryWarehouse', 'InventoryMovement',
    'LivestockCategory', 'Herd', 'LivestockBatch', 'LivestockMovement',
    'WeighingEvent', 'HealthEvent',
    'Crop', 'CropCampaign', 'AgriculturalActivity',
    'Alert', 'AiConversation', 'AiMessage', 'AuditLog', 'User'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING ("tenantId" = current_tenant()) WITH CHECK ("tenantId" = current_tenant());',
      t
    );
  END LOOP;
END $$;
