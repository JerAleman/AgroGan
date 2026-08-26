# Quickstart — Agro360 Cloud (MVP ejecutable)

MVP funcional: backend NestJS multi-tenant + frontend Next.js. Corre localmente sin
dependencias externas (SQLite + auth JWT local + copiloto en modo reglas).

## Requisitos
- Node.js 20+ (probado con Node 22)

## 1. Backend (API)

```bash
cd backend
npm install
cp .env.example .env            # ya trae valores dev por defecto (SQLite)
npm run prisma:generate
npm run db:push                 # crea la base SQLite (prisma/dev.db)
npm run db:seed                 # carga datos demo (2 tenants)
npm run start:dev               # API en http://localhost:3000/v1  (Swagger: /docs)
```

**Usuarios demo:**
- `demo@agro360.cloud` / `Demo1234` → tenant con datos (La Esperanza SA)
- `otro@agro360.cloud` / `Demo1234` → tenant vacío (para comprobar aislamiento)

### Probar la API
```bash
curl http://localhost:3000/v1/health

TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@agro360.cloud","password":"Demo1234"}' | jq -r .accessToken)

curl http://localhost:3000/v1/livestock/stock -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3000/v1/ai/ask -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"text":"cuanto stock de novillos tengo?"}'
```

## 2. Frontend (Web)

```bash
cd frontend
npm install
npm run dev        # abrí la URL que muestra la consola (ej. http://localhost:3001)
```
Iniciá sesión con las credenciales demo. Navegá por Dashboard, Ganadería, Inventario y Copiloto.

## 3. Tests

```bash
cd backend
npm test           # unit (cálculos: ADG, margen, delta de existencias)
npm run test:e2e   # e2e: flujo de negocio + AISLAMIENTO DE TENANTS (crítico)
```

## Qué está implementado (MVP)
- **Multi-tenant** con aislamiento (verificado por tests): un tenant no accede a datos de otro.
- **Auth**: registro self-service de empresa, login, roles.
- **Ganadería**: categorías, rodeos, tropas, movimientos (compra/venta/nacimiento/muerte/traslado), pesadas con **ADG**, sanidad con **descuento automático de inventario**.
- **Inventario**: productos, depósitos, movimientos, stock calculado, **alertas de mínimo**.
- **Agricultura**: cultivos, campañas, labores con consumo de insumos, **margen bruto**.
- **Reportes**: dashboard ejecutivo, resumen ganadero.
- **Copiloto Campo AI**: preguntas en lenguaje natural sobre datos propios, con **explicabilidad** (datos usados, supuestos, confianza) y auditoría.
- **Sync offline**: endpoint batch **idempotente** (por `clientUuid`).

## Notas dev vs. producción
| Aspecto | Dev (este repo) | Producción (diseñado) |
|---------|-----------------|------------------------|
| Base de datos | SQLite | Aurora PostgreSQL Serverless v2 + **RLS** (`prisma/postgres-rls.sql`) |
| Auth | JWT local | Amazon Cognito (`AUTH_MODE=cognito`) |
| IA | Reglas (`AI_MODE=rules`) | Amazon Bedrock + Knowledge Bases (RAG) |
| Infra | local | AWS CDK (ECS Fargate, S3, CloudFront…) — ver `infra/` y `docs/03-architecture.md` |

La arquitectura objetivo completa está en [`docs/`](docs/).
