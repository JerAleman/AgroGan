# 04 — Modelo de Datos (ERD)

**Versión:** 1.0 · Base transaccional: **Aurora PostgreSQL** con Row Level Security. Todas las tablas de negocio incluyen `tenant_id UUID NOT NULL` (excepto tablas de plataforma SaaS globales).

---

## 1. Convenciones

- **PK:** `id UUID` (v7 preferido, ordenable por tiempo).
- **Multi-tenant:** `tenant_id UUID NOT NULL` + índice `(tenant_id, ...)` + política RLS.
- **Auditoría:** `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` (soft delete).
- **Idempotencia offline:** eventos aceptan `client_uuid UNIQUE` para deduplicar syncs.
- **Dinero:** `numeric(18,4)` + `currency` (código ISO); `fx_rate` cuando aplica.
- **Geo:** columnas `geometry`/`geography` (PostGIS) para lotes/potreros/sensores.

## 2. Dominios y agrupación de entidades

```
PLATAFORMA SaaS      : Tenant, Plan, Subscription, User, Role, Permission, RolePermission, UserRole
ORGANIZACIÓN/CAMPO   : Company, Farm, Establishment, Lot, Paddock, CostCenter, Activity, Season(Campaign)
AGRICULTURA          : Crop, CropCampaign, AgriculturalActivity, WorkOrder, WorkOrderItem
GANADERÍA            : LivestockCategory, Herd, LivestockBatch, LivestockAnimal,
                       WeighingEvent, HealthEvent, NutritionEvent, ReproductiveEvent,
                       BirthEvent, DeathEvent, TransferEvent, CategoryChangeEvent
INVENTARIO           : InputProduct, InventoryWarehouse, InventoryStock, InventoryMovement, ProductBatch
MAQUINARIA           : Machine, MachineTask, MaintenanceOrder, FuelMovement
SERVICIOS 3ROS       : Customer, Contract, ThirdPartyService (ServiceOrder), Invoice, Payment
FINANZAS             : Supplier, Purchase, Sale, FinancialTransaction, Budget, TaxRecord
DATOS EXTERNOS/IoT   : WeatherObservation, MarketPrice, IoTDevice, IoTMeasurement
IA / PLATAFORMA      : AIConversation, AIRecommendation, Document, Report, Alert, Notification, AuditLog
```

## 3. Diagrama ERD (textual, relaciones principales)

```
Tenant 1───* User            Tenant 1───* Company
Tenant 1───* Plan/Subscription
User *───* Role (UserRole)    Role *───* Permission (RolePermission)

Company 1───* Farm 1───* Establishment 1───* Lot 1───* Paddock
Establishment 1───* CostCenter
Company 1───* Activity        Company 1───* Season(Campaign)

── AGRICULTURA ──
Establishment 1───* CropCampaign *───1 Crop
CropCampaign 1───* AgriculturalActivity
Lot 1───* AgriculturalActivity
AgriculturalActivity 1───1 WorkOrder 1───* WorkOrderItem *───1 InputProduct
WorkOrder *───1 Machine (opcional)   WorkOrder *───1 User(responsable)

── GANADERÍA ──
Establishment 1───* Herd 1───* LivestockBatch *───1 LivestockCategory
LivestockBatch 1───* LivestockAnimal            Paddock 1───* LivestockBatch (ubicación)
LivestockBatch/Animal 1───* WeighingEvent
LivestockBatch/Animal 1───* HealthEvent *───* InputProduct (consumo → InventoryMovement)
LivestockBatch/Animal 1───* NutritionEvent *───* InputProduct
LivestockAnimal 1───* ReproductiveEvent / BirthEvent / DeathEvent
LivestockBatch 1───* TransferEvent (origen/destino Establishment|Paddock)
LivestockBatch 1───* CategoryChangeEvent (from LivestockCategory → to LivestockCategory)

── INVENTARIO ──
InventoryWarehouse 1───* InventoryStock *───1 InputProduct
InputProduct 1───* ProductBatch (lote, vencimiento)
InventoryWarehouse 1───* InventoryMovement *───1 InputProduct
InventoryMovement *───1 (WorkOrder | HealthEvent | NutritionEvent | Purchase)  [origen del consumo]

── MAQUINARIA ──
Machine 1───* MachineTask *───1 (Lot|Establishment|Customer)
Machine 1───* MaintenanceOrder     Machine 1───* FuelMovement *───1 InputProduct(combustible)

── SERVICIOS 3ROS ──
Customer 1───* Contract 1───* ThirdPartyService(ServiceOrder) 1───* Invoice 1───* Payment
ThirdPartyService *───1 Machine/WorkOrder

── FINANZAS ──
Supplier 1───* Purchase 1───* InventoryMovement(entrada)
Sale *───1 (LivestockBatch | Crop harvest)     Sale/Purchase 1───* FinancialTransaction
CostCenter 1───* FinancialTransaction           Budget *───1 (Activity|CostCenter|Season)
TaxRecord *───1 (Sale|Purchase|Invoice)

── EXTERNOS / IoT ──
Establishment 1───* WeatherObservation          MarketPrice (global + por región/commodity)
Establishment 1───* IoTDevice 1───* IoTMeasurement

── IA / PLATAFORMA ──
User 1───* AIConversation 1───* AIRecommendation
AIRecommendation *───1 (WorkOrder|Purchase|Alert) [acción sugerida/ejecutada]
Tenant 1───* Document (RAG source)               Tenant 1───* Report
Tenant 1───* Alert 1───* Notification
AuditLog registra todo (quién, qué, cuándo, tenant, IA sí/no)
```

## 4. Entidades clave (campos principales)

### Tenant
`id, name, country, default_currency, locale, tenancy_model(pooled|bridge|silo), plan_id, status, created_at`

### User
`id, tenant_id, cognito_sub, email, full_name, phone, status, locale, last_login_at`

### Role / Permission
- `Role(id, tenant_id, name, is_system)`
- `Permission(id, module, action[read|write|approve|export|ai], resource_scope)`
- `RolePermission(role_id, permission_id, scope_json)` — ABAC vía `scope_json` (`farm_id`, `establishment_id`, `activity`).

### Company / Farm / Establishment / Lot / Paddock
- `Company(id, tenant_id, name, tax_id, country)`
- `Farm(id, tenant_id, company_id, name, geom)`
- `Establishment(id, tenant_id, farm_id, name, total_area_ha, centroid_geom)`
- `Lot(id, tenant_id, establishment_id, name, area_ha, geom)`
- `Paddock(id, tenant_id, establishment_id, name, area_ha, geom, forage_type)`

### CropCampaign / AgriculturalActivity
- `Crop(id, tenant_id, name, species, variety)`
- `CropCampaign(id, tenant_id, establishment_id, crop_id, season_id, planned_area_ha, sowing_date, expected_yield, status)`
- `AgriculturalActivity(id, tenant_id, campaign_id, lot_id, type[siembra|fumigacion|fertilizacion|cosecha|riego], date, area_ha, status, cost_direct, yield_result)`

### WorkOrder / WorkOrderItem
- `WorkOrder(id, tenant_id, type[agri|livestock|machinery|service], establishment_id, responsible_user_id, status[planned|in_progress|done|approved], scheduled_date, source[manual|ai], client_uuid)`
- `WorkOrderItem(id, tenant_id, work_order_id, input_product_id, planned_qty, used_qty, unit, cost)`

### InputProduct / Inventory
- `InputProduct(id, tenant_id, name, category[fitosanitario|fertilizante|semilla|vacuna|medicamento|suplemento|combustible|repuesto|herramienta], unit, requires_batch, min_stock, max_stock, avg_cost, currency)`
- `InventoryWarehouse(id, tenant_id, establishment_id, name)`
- `InventoryStock(id, tenant_id, warehouse_id, product_id, qty, valuation, updated_at)`
- `ProductBatch(id, tenant_id, product_id, batch_code, expiry_date, qty)`
- `InventoryMovement(id, tenant_id, warehouse_id, product_id, batch_id, type[in|out|transfer|adjust], qty, unit_cost, source_type, source_id, date, client_uuid)`

### Ganadería
- `LivestockCategory(id, tenant_id, name, species[bovino|ovino|...], sex, age_range)`
- `Herd(id, tenant_id, establishment_id, name, purpose[cria|recria|engorde|feedlot|tambo])`
- `LivestockBatch(id, tenant_id, herd_id, category_id, paddock_id, head_count, avg_weight, entry_date)`
- `LivestockAnimal(id, tenant_id, batch_id, rfid_tag, visual_tag, sex, birth_date, category_id, status)`
- `WeighingEvent(id, tenant_id, animal_id|batch_id, date, weight, method[manual|rfid|scale], client_uuid)`
- `HealthEvent(id, tenant_id, animal_id|batch_id, date, type[vacuna|tratamiento|diagnostico], product_id, dose, next_due_date, vet_user_id, client_uuid)`
- `NutritionEvent(id, tenant_id, batch_id, date, product_id, qty, client_uuid)`
- `ReproductiveEvent(id, tenant_id, animal_id, type[servicio|tacto|prenez|parto|destete], date, result, sire_id)`
- `BirthEvent / DeathEvent(id, tenant_id, animal_id|batch_id, date, cause, count)`
- `TransferEvent(id, tenant_id, batch_id, from_establishment_id, to_establishment_id, from_paddock_id, to_paddock_id, head_count, date, client_uuid)`
- `CategoryChangeEvent(id, tenant_id, batch_id, from_category_id, to_category_id, head_count, date)`

### Maquinaria
- `Machine(id, tenant_id, name, type, ownership[own|contracted], acquisition_cost, depreciation_method, hour_meter)`
- `MachineTask(id, tenant_id, machine_id, target_type[lot|establishment|customer], target_id, date, hours, hectares, fuel_qty, operator_id)`
- `MaintenanceOrder(id, tenant_id, machine_id, type[preventive|corrective], date, cost, next_due)`
- `FuelMovement(id, tenant_id, machine_id, product_id, qty, cost, date)`

### Servicios / Finanzas
- `Customer / Supplier(id, tenant_id, name, tax_id, contact, balance)`
- `Contract(id, tenant_id, customer_id, type, start_date, end_date, terms)`
- `ThirdPartyService(id, tenant_id, contract_id, customer_id, type, date, qty, unit, price, cost)`
- `Invoice(id, tenant_id, customer_id, date, total, currency, status)`
- `Payment(id, tenant_id, invoice_id|purchase_id, date, amount, method)`
- `Purchase(id, tenant_id, supplier_id, date, total, currency)`
- `Sale(id, tenant_id, type[hacienda|grano|leche], date, qty, unit_price, total, currency)`
- `CostCenter(id, tenant_id, name, activity_id)`
- `Budget(id, tenant_id, scope_type, scope_id, season_id, amount, currency)`
- `FinancialTransaction(id, tenant_id, cost_center_id, type[income|expense], amount, currency, fx_rate, date, ref_type, ref_id)`
- `TaxRecord(id, tenant_id, country, tax_type, base, rate, amount, ref_type, ref_id)`

### Externos / IoT
- `WeatherObservation(id, tenant_id, establishment_id, date, rain_mm, temp, humidity, source)`
- `MarketPrice(id, commodity, market, currency, price, date)` — global/compartida
- `IoTDevice(id, tenant_id, establishment_id, type[weather|scale|rfid|gps|tank|silo], protocol[mqtt|lorawan|http], status)`
- `IoTMeasurement(id, tenant_id, device_id, metric, value, unit, ts)` — alto volumen → DynamoDB/timeseries

### IA / Plataforma
- `AIConversation(id, tenant_id, user_id, channel[text|voice], started_at)`
- `AIRecommendation(id, tenant_id, conversation_id, prompt, response, data_used_json, assumptions, confidence, mode[recommend|execute_approved], status, linked_ref_type, linked_ref_id)`
- `Document(id, tenant_id, name, type, s3_key, indexed[bool], kb_id)`
- `Report(id, tenant_id, type, params_json, s3_key, generated_at)`
- `Alert(id, tenant_id, type[stock|sanitary|reproductive|weight|financial|climate], severity, entity_ref, message, status, created_at)`
- `Notification(id, tenant_id, user_id, alert_id, channel[in_app|email|push], read_at)`
- `AuditLog(id, tenant_id, user_id, action, entity_type, entity_id, before_json, after_json, is_ai, ts)`

## 5. Row Level Security (patrón)

```sql
ALTER TABLE livestock_batch ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON livestock_batch
  USING (tenant_id = current_setting('app.current_tenant')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);

-- El backend ejecuta al inicio de cada transacción:
--   SET LOCAL app.current_tenant = '<tenant_id_del_jwt>';
```
Se aplica la misma política a todas las tablas con `tenant_id`. Tablas globales (`MarketPrice`) quedan sin RLS o con política de solo lectura.

## 6. Índices y particionamiento recomendados

- Índices compuestos `(tenant_id, <fk/fecha>)` en tablas de eventos.
- Particionar por rango de fecha (`created_at`) las tablas de alto volumen: `WeighingEvent`, `InventoryMovement`, `IoTMeasurement` (esta última preferentemente fuera de Aurora).
- `UNIQUE (tenant_id, client_uuid)` en tablas de eventos para idempotencia offline.

## 7. Notas de evolución
- **pgvector** en Aurora para embeddings de `Document` (RAG) en MVP.
- CDC (DMS/streams) hacia S3 data lake para analítica (Athena/QuickSight).
- Series temporales de IoT en DynamoDB o Timestream si el volumen crece.
