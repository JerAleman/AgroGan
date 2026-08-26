# Tests — Agro360 Cloud

Pruebas transversales (integración / e2e / seguridad) que cruzan servicios. Las pruebas unitarias viven junto al código en `backend/` y `frontend/`.

## Categorías

| Tipo | Ubicación | Objetivo |
|------|-----------|----------|
| Unit | `backend/**`, `frontend/**` | Lógica de dominio, componentes |
| Integración | `tests/integration/` | API + DB (con RLS), consumo de inventario, sync |
| E2E | `tests/e2e/` | Flujos de usuario (onboarding, carga offline→sync) |
| **Aislamiento de tenant** | `tests/security/` | **Crítico**: tenant A no puede leer/escribir datos de tenant B |
| Carga | `tests/load/` | Picos estacionales (cosecha/servicio) |

## Prueba crítica de aislamiento (obligatoria en CI)

```
GIVEN dos tenants A y B con datos propios
WHEN  un usuario de A consulta/escribe recursos de B (por id conocido)
THEN  la API responde 404/403 y RLS impide el acceso a nivel de base de datos
```

Esta suite debe ejecutarse en cada PR y bloquear el merge si falla. Ver riesgo RT1 en [docs/09-risks.md](../docs/09-risks.md).

## Ejecución
```bash
# Integración (requiere Postgres con RLS aplicada)
npm run test:integration
# E2E
npm run test:e2e
```
