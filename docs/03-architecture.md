# 03 — Arquitectura AWS, Stack, Multi-tenancy, Seguridad y Costos

**Versión:** 1.0 · Cubre entregables: Arquitectura AWS, diagrama lógico textual, decisiones de stack, estrategia de multi-tenancy, estrategia de seguridad, estrategia de costos AWS.

---

## 1. Principios de arquitectura

1. **Cloud-native, serverless-first donde tenga sentido** (Aurora Serverless v2, Lambda, EventBridge) para pagar por uso y absorber estacionalidad.
2. **Modular monolith al inicio, microservicios cuando el dominio lo pida.** Evitamos sobre-fragmentar en el MVP.
3. **Event-driven** para desacoplar consumos de stock, alertas, IA y sync.
4. **Offline-first** en el borde (mobile) con sincronización idempotente.
5. **Multi-tenant desde el diseño** con `tenant_id` en todo y aislamiento defense-in-depth.
6. **IaC total** (AWS CDK) — nada se crea a mano.

## 2. Diagrama lógico (textual)

```
                                   ┌───────────────────────────┐
        Usuarios web/mobile        │        Amazon Route 53      │
        (Next.js / PWA)  ───────►  │        + AWS WAF + CDN       │
                                   │        (CloudFront)          │
                                   └───────────────┬─────────────┘
                                                   │
                          ┌────────────────────────┼───────────────────────────┐
                          ▼                                                      ▼
              ┌───────────────────────┐                           ┌──────────────────────────┐
              │  Frontend estático     │                           │      Amazon Cognito        │
              │  S3 + CloudFront (SPA/  │                           │  User/Identity Pools        │
              │  Next.js SSR opcional)  │                           │  MFA · SAML/OIDC · tenants  │
              └───────────────────────┘                           └──────────────┬─────────────┘
                                                                                  │ JWT (tenant_id claim)
                                                                                  ▼
                                              ┌────────────────────────────────────────────────┐
                                              │        API Gateway (REST) / ALB                   │
                                              │        + Cognito Authorizer + WAF                 │
                                              └───────────────────────┬──────────────────────────┘
                                                                      │
                                              ┌───────────────────────▼──────────────────────────┐
                                              │      Backend NestJS en ECS Fargate                 │
                                              │      (modular monolith por dominios)               │
                                              │  auth · tenant · farm · agri · livestock · inv ·   │
                                              │  machinery · services · finance · reports · ai ·   │
                                              │  iot · notifications · import-export               │
                                              └───┬───────────┬──────────┬───────────┬────────────┘
                                                  │           │          │           │
              ┌───────────────────────────────────┘           │          │           └───────────────────────┐
              ▼                                                ▼          ▼                                   ▼
   ┌────────────────────┐                        ┌───────────────────┐ ┌───────────────────┐    ┌──────────────────────┐
   │ Aurora PostgreSQL   │                        │    DynamoDB        │ │  Amazon S3          │    │   EventBridge (bus)   │
   │ Serverless v2       │                        │  offline sync/     │ │  documentos, PDFs,  │    │   eventos de negocio  │
   │ (transaccional,     │                        │  sesiones, cola,   │ │  imágenes, data lake│    └──────────┬───────────┘
   │  RLS por tenant_id) │                        │  IoT liviano       │ └─────────┬───────────┘               │
   └────────────────────┘                        └───────────────────┘           │              ┌────────────┼─────────────┐
                                                                                  │              ▼            ▼             ▼
                                                                                  │        ┌─────────┐  ┌──────────┐  ┌──────────┐
                                                                                  │        │  SQS     │  │ Lambda    │  │ Step     │
                                                                                  │        │ (colas)  │  │ (jobs)    │  │ Functions│
                                                                                  │        └─────────┘  └──────────┘  └──────────┘
                                                                                  ▼
                          ┌───────────────────────────────────────────────────────────────────────────────┐
                          │                         Capa de IA (Amazon Bedrock)                              │
                          │  Foundation Models · Knowledge Bases (RAG) · Agents (acciones con aprobación) ·  │
                          │  Guardrails · Embeddings                                                          │
                          │            └── Vector store: OpenSearch Serverless / Aurora pgvector             │
                          └───────────────────────────────────────────────────────────────────────────────┘

   ┌───────────────────────── Analítica / BI ──────────────────────────┐   ┌──────────── IoT (Fase 2) ────────────┐
   │  S3 data lake → Glue → Athena → QuickSight Embedded                 │   │  AWS IoT Core (MQTT, rules, shadows)  │
   │  (Redshift Serverless / SageMaker opcional enterprise)             │   │  → IoT Rule → SQS/EventBridge → ingest │
   └────────────────────────────────────────────────────────────────────┘   └───────────────────────────────────────┘

   Transversal: KMS (cifrado) · Secrets Manager · CloudWatch · X-Ray · CloudTrail · Backup/PITR · SNS/SES
```

## 3. Componentes y responsabilidades

| Capa | Servicio AWS | Rol |
|------|-------------|-----|
| Edge/CDN | CloudFront + WAF + Route 53 | Distribución frontend, protección L7, rate limiting |
| Auth | Cognito (User + Identity Pools) | Login, MFA, federación SAML/OIDC, claim `tenant_id` |
| API | API Gateway (REST) o ALB | Entrada, authorizer Cognito, throttling |
| Cómputo | ECS Fargate | Backend NestJS (modular monolith) |
| DB transaccional | Aurora PostgreSQL Serverless v2 | Datos de negocio con RLS |
| NoSQL/escala | DynamoDB | Cola de sync offline, sesiones, IoT liviano, notificaciones |
| Objetos | S3 | Documentos, adjuntos, reportes, data lake |
| Eventos | EventBridge + SQS + SNS/SES | Desacople, notificaciones, email |
| Orquestación | Lambda + Step Functions | Jobs event-driven, workflows (ej. cierre de campaña) |
| IA | Bedrock (+ Knowledge Bases, Agents, Guardrails) | Copiloto, RAG, agentes |
| Búsqueda/vector | OpenSearch Serverless o Aurora `pgvector` | RAG y búsqueda semántica |
| BI | Glue + Athena + QuickSight Embedded | Analítica, dashboards embebidos |
| IoT (F2) | AWS IoT Core | Ingesta de sensores/balanzas/RFID |
| Seguridad | KMS, Secrets Manager, IAM | Cifrado, secretos, least privilege |
| Observabilidad | CloudWatch, X-Ray, CloudTrail | Métricas, trazas, auditoría inmutable |

## 4. Flujos clave

- **Carga offline → sync:** mobile encola eventos localmente (IndexedDB) → al reconectar, `POST /sync/batch` idempotente (client-generated UUID) → backend valida, persiste en Aurora, publica evento en EventBridge → consumidores actualizan stock, disparan alertas.
- **Consumo automático de inventario:** ejecutar `WorkOrder`/`HealthEvent` → regla de negocio descuenta `InventoryMovement` → si stock < mínimo, EventBridge → Lambda → `Alert` + notificación (SNS/SES).
- **Copiloto:** pregunta del usuario → backend arma contexto seguro (scoped a `tenant_id`) → Bedrock (RAG desde Knowledge Base + consultas parametrizadas a Aurora) → respuesta con explicabilidad → `AIConversation`/`AuditLog`.

## 5. Decisiones de stack

### 5.1 Frontend
- **Next.js + TypeScript** (App Router). SSR/ISR para páginas públicas y de marketing; CSR para app.
- **Tailwind + shadcn/ui** para UI consistente y rápida.
- **TanStack Query** (server state) + **Zustand** (UI/local state) — Zustand por su simplicidad para estado offline.
- **Mapbox GL** para GIS (alternativa: MapLibre para evitar lock-in de costos).
- **PWA offline** con Service Worker + IndexedDB (Dexie.js) + Background Sync.

### 5.2 Backend
- **NestJS (TypeScript)** — decisión sobre FastAPI: mantiene un solo lenguaje (TS) en todo el stack, gran soporte de módulos por dominio, DI, OpenAPI nativo. FastAPI queda como opción si se incorpora equipo Python/ML fuerte.
- **Prisma** como ORM (migraciones, type-safety). RLS gestionada vía sesión `SET app.tenant_id`.
- **Arquitectura modular por dominios** (bounded contexts), lista para extraer microservicios.
- **OpenAPI** autogenerado. Ver [APIs](06-api.md).

### 5.3 IA
- **Amazon Bedrock** (modelos gestionados, sin operar infra de GPU).
- **Knowledge Bases** para RAG; **Agents** para acciones con aprobación (Fase 2); **Guardrails** para seguridad de contenido.

### 5.4 Infra
- **AWS CDK (TypeScript)** — mismo lenguaje que backend/frontend, constructos de alto nivel.
- **ECS Fargate** para MVP (menos complejidad operativa que EKS). Migrar a EKS solo si la escala/portabilidad lo justifica.

> ADRs formales se documentan en `docs/adr/` (a crear a medida que se decide).

## 6. Modelos de multi-tenancy

Ver también aislamiento en [seguridad](#8-estrategia-de-seguridad).

### 6.1 Modelo A — Pooled (clientes pequeños/medianos) — **default MVP**
- Infraestructura compartida; una base Aurora con **Row Level Security** y `tenant_id` en todas las tablas.
- Aislamiento lógico: cada request setea `SET app.current_tenant = <tenant_id>` derivado del JWT; políticas RLS filtran automáticamente.
- Cognito: un User Pool con atributo `custom:tenant_id` (o pool por marca/región).
- **Pros:** costo bajo por tenant, operación simple. **Contras:** aislamiento lógico (no físico).

### 6.2 Modelo B — Silo / Bridge (enterprise)
- **Bridge:** DB/silo de datos dedicado por tenant enterprise (schema o cluster Aurora separado) sobre el mismo plano de cómputo.
- **Silo:** stack dedicado (cuenta AWS separada, VPC, Aurora, buckets) para clientes con requisitos fuertes de aislamiento/data residency.
- Enrutamiento por **tenant routing layer** (mapa `tenant_id → shard/cluster/cuenta`).
- **Pros:** aislamiento fuerte, blast radius acotado, data residency. **Contras:** mayor costo/complejidad operativa.

### 6.3 Estrategia de adopción
- MVP: 100% pooled.
- Enterprise: ofrecer bridge (schema/cluster dedicado) como upsell; silo solo bajo contrato específico.
- **Tenant context** viaja en todo: JWT → API → backend (`AsyncLocalStorage`) → Prisma middleware (RLS) → eventos (atributo `tenant_id`) → logs/trazas.

## 7. Estrategia de datos y analítica

- **OLTP:** Aurora (normalizado, RLS).
- **Eventos/IoT liviano:** DynamoDB (particionado por `tenant_id#entity`).
- **Data lake:** CDC/export a S3 (Parquet), catalogado con Glue, consultado con Athena.
- **BI:** QuickSight Embedded con RLS por `tenant_id` (dashboards nativos como alternativa).
- **ML:** SageMaker opcional para modelos custom (Fase 2/3).

## 8. Estrategia de seguridad

### 8.1 Aislamiento de tenants (defense-in-depth)
1. **JWT** con `tenant_id` firmado por Cognito.
2. **Authorizer** valida token y extrae claims.
3. **Middleware backend** fija el contexto de tenant y lo propaga (`AsyncLocalStorage`).
4. **RLS en Aurora**: políticas `USING (tenant_id = current_setting('app.current_tenant')::uuid)` en cada tabla — última línea de defensa aunque falle el código de aplicación.
5. **S3**: prefijos por tenant + políticas IAM/condiciones; presigned URLs scoped.
6. **Tests de aislamiento automatizados** en CI (un tenant intenta leer datos de otro → debe fallar).

### 8.2 Identidad y acceso
- **MFA** (TOTP) obligatorio para roles admin/financieros.
- **RBAC + ABAC**: permisos por módulo/acción + atributos (`farm_id`, `establishment_id`, `activity`).
- **IAM least privilege** para servicios; roles por tarea Fargate; sin credenciales estáticas.
- **Federación** SAML/OIDC para enterprise (SSO corporativo).

### 8.3 Datos
- **Cifrado en reposo** (KMS: Aurora, S3, DynamoDB, EBS) y **en tránsito** (TLS 1.2+).
- **Secrets Manager** para credenciales/tokens; rotación automática.
- **Backups automáticos + PITR** (Aurora), versionado S3, políticas de retención.
- **Export completo por tenant** y **borrado seguro** (derecho de portabilidad/olvido).
- **Data residency** configurable por región (modelo silo).

### 8.4 Aplicación y API
- **WAF** (OWASP Top 10, rate limiting, geo/IP rules).
- Validación estricta de input (DTOs), output encoding.
- **Auditoría inmutable** (`AuditLog` + CloudTrail) de acciones críticas y de IA.

### 8.5 Seguridad de IA
- **Guardrails de Bedrock**: bloqueo de contenido peligroso; disclaimer obligatorio para temas veterinarios/financieros/legales ("requiere validación profesional").
- **Protección contra prompt injection** en RAG: sanitización, separación de instrucciones vs. datos, allow-list de acciones de agentes.
- **Validación humana** obligatoria para acciones críticas (agentes en modo "ejecutar con aprobación").
- **Consentimiento explícito** para uso de datos en modelos; **no** se entrena con datos del cliente sin permiso.
- **Explicabilidad**: cada recomendación registra datos usados, supuestos y nivel de confianza.

## 9. Estrategia de costos AWS

### 9.1 Palancas de optimización
- **Serverless/auto-scaling** (Aurora Serverless v2 escala ACUs; Fargate escala tareas) → pagar por uso, absorber estacionalidad (cosecha/servicio).
- **Bedrock on-demand** al inicio; evaluar **provisioned throughput** solo con volumen alto.
- **S3 Intelligent-Tiering** + lifecycle a Glacier para documentos/imágenes antiguas.
- **Caching** (CloudFront, TanStack Query, respuestas de IA frecuentes) para bajar llamadas a Bedrock/DB.
- **Compute Savings Plans** cuando el baseline de Fargate se estabilice.
- **Presupuestos por tenant** para modelo de pricing (metering de uso de IA/IoT).

### 9.2 Estimación de orden de magnitud (ilustrativa, MVP, 1 región, ~20–50 tenants)

> Cifras aproximadas mensuales en USD; **estimación de diseño, no cotización**. Requiere validación con [AWS Pricing Calculator](https://calculator.aws/).

| Servicio | Rango mensual estimado | Notas |
|----------|------------------------|-------|
| Aurora Serverless v2 | $150–500 | 2–8 ACUs según carga; escala a mínimo fuera de pico |
| ECS Fargate | $100–300 | 2–4 tareas backend con autoscaling |
| Cognito | $0–50 | primeros 50k MAU en tier gratuito |
| S3 + CloudFront + WAF | $50–150 | documentos, frontend, protección |
| DynamoDB | $20–80 | on-demand, sync/notificaciones |
| Bedrock (IA) | $100–600 | **muy variable** según uso; principal driver a controlar |
| EventBridge/SQS/SNS/SES/Lambda | $20–60 | volumen bajo-medio |
| CloudWatch/X-Ray/CloudTrail | $30–100 | logs y trazas |
| OpenSearch Serverless (RAG) | $100–350 | alternativa: pgvector en Aurora para reducir costo |
| **Total orientativo MVP** | **~$600–2.100/mes** | crece ~lineal con tenants; IA e OpenSearch son los mayores drivers |

### 9.3 Recomendaciones de control de costos
- Usar **Aurora `pgvector`** en lugar de OpenSearch Serverless en MVP (ahorro relevante) y migrar solo si el volumen de RAG lo exige.
- **Cache de respuestas de IA** y límites de tokens por plan.
- **Cost allocation tags** por `tenant_id`/módulo para medir márgenes por cliente.
- Alarmas de **AWS Budgets** por servicio y por tenant enterprise.

## 10. Entornos y despliegue

- Entornos: `dev`, `staging`, `prod` (cuentas AWS separadas idealmente).
- **CI/CD:** GitHub Actions (build/test/lint → CDK diff → deploy con aprobación en prod).
- **Blue/green o rolling** en ECS; migraciones de DB versionadas (Prisma) con gate previo.
- **DR:** backups cross-region opcional (enterprise); RPO/RTO definidos por plan.
