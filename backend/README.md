# Backend — Agro360 Cloud

API multi-tenant en **NestJS (TypeScript)**, arquitectura modular por dominios (bounded contexts), Prisma + PostgreSQL/Aurora con Row Level Security.

## Estructura

```
backend/
├── src/
│   ├── main.ts                     # bootstrap + Swagger/OpenAPI
│   ├── app.module.ts               # módulo raíz
│   ├── common/
│   │   ├── tenant/                 # contexto de tenant (AsyncLocalStorage) + middleware
│   │   ├── auth/                   # guard Cognito JWT, RBAC/ABAC
│   │   ├── prisma/                 # PrismaService con SET app.current_tenant (RLS)
│   │   ├── audit/                  # interceptor de auditoría
│   │   └── errors/                 # filtro RFC 7807
│   └── modules/
│       ├── tenant/                 # tenants, planes, suscripciones
│       ├── org/                    # company, farm, establishment, lot, paddock
│       ├── iam/                    # users, roles, permissions
│       ├── livestock/              # ganadería (stock, movimientos, pesadas, sanidad)
│       ├── inventory/              # productos, depósitos, movimientos, consumo auto
│       ├── agriculture/            # campañas, labores, work orders
│       ├── machinery/              # máquinas, tareas, combustible, mantenimiento
│       ├── finance/                # (Fase 2) compras, ventas, transacciones
│       ├── services/               # (Fase 2) servicios a terceros
│       ├── reports/                # reportes + export
│       ├── ai/                     # copiloto: orquestación, tools, RAG, guardrails
│       ├── iot/                    # (Fase 2) ingesta IoT
│       ├── sync/                   # sincronización offline (batch idempotente)
│       └── notifications/          # alertas y notificaciones
├── prisma/
│   └── schema.prisma
├── test/
├── package.json
└── tsconfig.json
```

## Principios
- **Aislamiento de tenant** en toda operación: JWT → `TenantMiddleware` → `AsyncLocalStorage` → `PrismaService` fija `SET LOCAL app.current_tenant`.
- **Idempotencia** en escritura de eventos (`Idempotency-Key`/`clientUuid`) para sync offline.
- **Event-driven**: publicación a EventBridge para consumos, alertas e IA.
- **OpenAPI** autogenerado (ver `../infra/openapi.yaml` como contrato de referencia).

## Scripts
```bash
npm install
npm run start:dev      # desarrollo (usar en local, no en sandbox)
npm run build
npm run test
npx prisma migrate dev
```

## Variables de entorno (ejemplo)
Ver `.env.example`.
