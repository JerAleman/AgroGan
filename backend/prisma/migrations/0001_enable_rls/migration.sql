-- Agro360 Cloud — Habilitación de Row Level Security (RLS) por tenant.
-- Se aplica a todas las tablas con columna tenant_id.
-- El backend fija `SET LOCAL app.current_tenant = '<uuid>'` en cada transacción.

-- Función helper para leer el tenant actual de la sesión.
CREATE OR REPLACE FUNCTION current_tenant() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- Patrón por tabla (repetir para cada tabla multi-tenant):
DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'establishment', 'livestock_category', 'livestock_batch',
    'weighing_event', 'health_event', 'input_product', 'inventory_movement'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
        USING (tenant_id = current_tenant())
        WITH CHECK (tenant_id = current_tenant());
    $f$, t);
  END LOOP;
END $$;
