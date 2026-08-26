# 06 — Diseño de APIs

**Estilo:** REST sobre HTTPS, JSON. GraphQL evaluado como opción futura para el dashboard (agregaciones flexibles); MVP en REST por simplicidad y caching.
**Base URL:** `https://api.agro360.cloud/v1`
**Auth:** Bearer JWT (Cognito). El `tenant_id` viaja en el claim; **no** se acepta por query/body.
**Especificación completa:** [`infra/openapi.yaml`](../infra/openapi.yaml).

---

## 1. Convenciones

- **Versionado** por path (`/v1`).
- **Idempotencia:** endpoints de escritura de eventos aceptan header `Idempotency-Key` (o `client_uuid` en body) para sync offline segura.
- **Paginación:** cursor-based (`?limit=&cursor=`).
- **Filtros:** query params (`?establishmentId=&from=&to=&categoryId=`).
- **Errores:** formato RFC 7807 (`application/problem+json`): `{ type, title, status, detail, traceId }`.
- **Rate limiting:** por tenant y por usuario (WAF + API Gateway usage plans).
- **Fechas:** ISO 8601 UTC.

## 2. Recursos por dominio

### Auth & Usuarios
```
POST   /auth/register-tenant        # alta self-service de empresa + admin
POST   /auth/login                  # (delegado a Cognito Hosted UI / SDK)
POST   /auth/refresh
GET    /me
GET    /users            POST /users            PATCH /users/{id}     DELETE /users/{id}
GET    /roles            POST /roles            PATCH /roles/{id}
GET    /permissions
```

### Tenants & Plataforma SaaS (superadmin)
```
GET    /admin/tenants    POST /admin/tenants    PATCH /admin/tenants/{id}
GET    /admin/plans      POST /admin/subscriptions
```

### Organización
```
GET/POST/PATCH/DELETE  /companies
GET/POST/PATCH/DELETE  /farms
GET/POST/PATCH/DELETE  /establishments
GET/POST/PATCH/DELETE  /lots            # incluye geometría GeoJSON
GET/POST/PATCH/DELETE  /paddocks
GET/POST                /cost-centers
GET/POST                /seasons          # campañas/ejercicios
```

### Agricultura
```
GET/POST/PATCH  /crops
GET/POST/PATCH  /crop-campaigns
GET/POST/PATCH  /agricultural-activities        # siembra/fumigación/fertilización/cosecha/riego
GET/POST/PATCH  /work-orders                     # type=agri|livestock|machinery|service
POST            /work-orders/{id}/complete       # dispara consumo de inventario
GET             /reports/gross-margin?scope=lot|crop|campaign
```

### Ganadería
```
GET/POST/PATCH  /livestock/categories
GET/POST/PATCH  /livestock/herds
GET/POST/PATCH  /livestock/batches
GET/POST/PATCH  /livestock/animals
POST            /livestock/weighings             # idempotente (client_uuid)
POST            /livestock/health-events         # descuenta stock
POST            /livestock/nutrition-events
POST            /livestock/reproductive-events    # Fase 2 avanzado
POST            /livestock/movements             # compra|venta|nacimiento|muerte|traslado|cambio-categoría
GET             /livestock/stock?establishmentId=&categoryId=&date=
GET             /reports/livestock-summary
```

### Inventario
```
GET/POST/PATCH  /inventory/products
GET/POST        /inventory/warehouses
GET             /inventory/stock?warehouseId=&productId=
POST            /inventory/movements             # in|out|transfer|adjust (idempotente)
GET             /inventory/alerts                # stock mínimo / vencimientos
```

### Maquinaria
```
GET/POST/PATCH  /machines
POST            /machines/{id}/tasks
POST            /machines/{id}/fuel
POST            /machines/{id}/maintenance
GET             /reports/machine-profitability
```

### Servicios a terceros (Fase 2 completo)
```
GET/POST  /customers   /contracts   /service-orders   /invoices   /payments
GET       /reports/service-profitability?scope=customer|task|field
```

### Finanzas (Fase 2 completo)
```
GET/POST  /suppliers  /purchases  /sales  /financial-transactions  /budgets  /tax-records
GET       /reports/cashflow    /reports/pnl?scope=activity|establishment|company
```

### IA — Copiloto
```
POST   /ai/conversations                 # inicia conversación
POST   /ai/conversations/{id}/messages    # pregunta en lenguaje natural → respuesta con explicabilidad
GET    /ai/recommendations                # lista recomendaciones/acciones sugeridas
POST   /ai/recommendations/{id}/approve   # ejecuta acción (agentes, Fase 2)
POST   /ai/summary                        # genera resumen diario/semanal
GET    /ai/documents    POST /ai/documents # gestión de fuentes RAG (subida a S3 + indexado)
```

### IoT (Fase 2)
```
GET/POST  /iot/devices
GET       /iot/measurements?deviceId=&metric=&from=&to=
POST      /iot/ingest        # (uso interno; principal ingesta vía IoT Core rules)
```

### Documentos, Reportes, Alertas, Notificaciones
```
GET/POST  /documents         # presigned URL para subida a S3
GET/POST  /reports           # genera/lista reportes (async → S3)
GET       /alerts            PATCH /alerts/{id}   # ack/resolve
GET       /notifications     PATCH /notifications/{id}/read
```

### Import / Export
```
POST   /import/excel?entity=livestock|products|lots   # carga masiva async
GET    /export?entity=&format=xlsx|pdf&filters=...
```

### Sync offline
```
POST   /sync/batch     # lote de eventos con client_uuid; respuesta con estado por evento
GET    /sync/changes?since=<cursor>   # delta para el cliente
```

## 3. Ejemplos

### Registrar pesada (offline-safe)
```http
POST /v1/livestock/weighings
Authorization: Bearer <jwt>
Idempotency-Key: 8f0c...-uuid
Content-Type: application/json

{ "batchId": "…", "date": "2026-07-03T10:00:00Z", "weight": 312.5, "method": "manual" }
```
```json
201 Created
{ "id": "…", "batchId": "…", "weight": 312.5, "adg": 0.72, "clientUuid": "8f0c...-uuid" }
```

### Pregunta al copiloto
```http
POST /v1/ai/conversations/{id}/messages
{ "text": "¿Cuánto stock de novillos tengo y qué tareas sanitarias vencen esta semana?" }
```
```json
200 OK
{
  "answer": "Tenés 812 novillos... 3 tareas sanitarias vencen esta semana.",
  "explainability": {
    "dataUsed": ["livestock/stock?categoryId=novillo", "livestock/health-events?due<=7d"],
    "assumptions": ["categoría 'novillo' según tu configuración"],
    "confidence": 0.92
  },
  "mode": "recommend",
  "auditId": "…"
}
```

## 4. Seguridad de API
- Todos los endpoints exigen JWT válido; `tenant_id` derivado del token (nunca del cliente).
- Autorización por scope RBAC/ABAC en cada handler (guards NestJS).
- Validación de entrada con DTOs + class-validator; rechazo de payloads no conformes.
- WAF + usage plans (rate limiting) + protección anti prompt-injection en endpoints de IA.
