# 05 — Backlog priorizado, User Stories, Plan de Sprints y Roadmap

Cubre entregables: Backlog priorizado, User stories, Plan de implementación por sprints, Roadmap 12 meses.

**Priorización:** MoSCoW + valor/esfuerzo (WSJF simplificado). P0 = MVP crítico, P1 = MVP deseable, P2 = Fase 2, P3 = Fase 3.

---

## 1. Épicas y priorización

| ID | Épica | Prioridad | Fase |
|----|-------|-----------|------|
| E01 | Plataforma multi-tenant + Auth (Cognito) | P0 | MVP |
| E02 | Organización: empresas/campos/establecimientos/lotes/potreros | P0 | MVP |
| E03 | Roles y permisos (RBAC/ABAC) | P0 | MVP |
| E04 | Ganadería núcleo (stock, movimientos, pesadas, sanidad) | P0 | MVP |
| E05 | Inventario + consumo automático | P0 | MVP |
| E06 | Agricultura básica | P0 | MVP |
| E07 | Maquinaria básica | P1 | MVP |
| E08 | Dashboard ejecutivo v1 | P0 | MVP |
| E09 | Reportes + export Excel/PDF | P0 | MVP |
| E10 | Copiloto Campo AI v1 (chat + RAG + resumen) | P0 | MVP |
| E11 | Mobile PWA offline + sync | P0 | MVP |
| E12 | Importación Excel | P1 | MVP |
| E13 | Auditoría, backups, observabilidad | P0 | MVP |
| E14 | CI/CD + IaC (CDK) | P0 | MVP |
| E15 | IoT Core (sensores, RFID, balanzas, clima) | P2 | Fase 2 |
| E16 | Cría/reproducción avanzada | P2 | Fase 2 |
| E17 | Recría/engorde + Feedlot avanzado | P2 | Fase 2 |
| E18 | Tambo | P2 | Fase 2 |
| E19 | Finanzas/contabilidad/impuestos avanzados | P2 | Fase 2 |
| E20 | Servicios a terceros (facturación completa) | P2 | Fase 2 |
| E21 | IA predictiva + agentes con aprobación | P2 | Fase 2 |
| E22 | Marketplace de integraciones | P2 | Fase 2 |
| E23 | Computer vision, benchmark anónimo, ESG, e-factura | P3 | Fase 3 |
| E24 | Modelo silo/enterprise + data residency | P3 | Fase 3 |

## 2. User stories (selección, formato ágil con criterios de aceptación)

> Formato: *Como [rol] quiero [acción] para [valor].* AC = criterios de aceptación.

### E01 — Multi-tenant + Auth
- **US-01.1** Como *dueño*, quiero registrar mi empresa y crear mi cuenta para empezar a usar la plataforma.
  - AC: alta self-service; se crea `Tenant` + usuario admin; email de verificación; login con MFA opcional.
- **US-01.2** Como *plataforma*, quiero aislar los datos de cada tenant para garantizar confidencialidad.
  - AC: RLS activa; test automatizado prueba que tenant A no accede a datos de tenant B.

### E02 — Organización
- **US-02.1** Como *administrador*, quiero cargar mis establecimientos, lotes y potreros con su superficie y mapa.
  - AC: CRUD con área en ha; dibujo/carga de geometría en mapa; jerarquía empresa→campo→establecimiento→lote→potrero.

### E03 — Roles
- **US-03.1** Como *admin del tenant*, quiero asignar roles con permisos por módulo y establecimiento.
  - AC: permisos read/write/approve/export por módulo; scope por establecimiento/actividad; acceso a IA y a reportes financieros configurable.

### E04 — Ganadería
- **US-04.1** Como *encargado ganadero*, quiero registrar una pesada por caravana o manual para seguir la evolución de peso.
  - AC: alta de `WeighingEvent`; cálculo de ADG; funciona offline; idempotente por `client_uuid`.
- **US-04.2** Como *encargado*, quiero registrar compras, ventas, nacimientos, muertes, traslados y cambios de categoría para mantener el stock exacto.
  - AC: cada movimiento actualiza stock por categoría; historial trazable; reversible con auditoría.
- **US-04.3** Como *veterinario*, quiero registrar una tarea sanitaria que descuente el producto del inventario.
  - AC: `HealthEvent` genera `InventoryMovement` (out); si stock < mínimo → `Alert`; registra próxima fecha (`next_due_date`).

### E05 — Inventario
- **US-05.1** Como *administrador*, quiero ver stock por depósito y recibir alerta cuando un insumo baja del mínimo.
  - AC: `InventoryStock` por depósito; alerta configurable; sugerencia de compra.
- **US-05.2** Como *sistema*, quiero descontar insumos automáticamente al ejecutar una orden de trabajo.
  - AC: `WorkOrderItem.used_qty` → `InventoryMovement`; valorización por costo promedio.

### E06 — Agricultura
- **US-06.1** Como *agrónomo*, quiero planificar una campaña con sus labores y ver el margen bruto por lote.
  - AC: `CropCampaign` + `AgriculturalActivity`; costos directos; rinde por lote; margen bruto = ingreso − costos directos.

### E08 — Dashboard
- **US-08.1** Como *dueño*, quiero un panel con stock ganadero, superficie, tareas pendientes y alertas, filtrable por establecimiento y fecha.
  - AC: widgets configurables; filtros multidimensión; carga < 2 s con datos cacheados.

### E10 — Copiloto AI
- **US-10.1** Como *administrador*, quiero preguntar en lenguaje natural "¿cuánto stock de novillos tengo?" y recibir la respuesta con los datos usados.
  - AC: respuesta scoped al tenant; muestra datos/fuente y nivel de confianza; se registra en `AuditLog`.
- **US-10.2** Como *usuario*, quiero un resumen semanal automático de mi campo.
  - AC: genera resumen (stock, movimientos, alertas, tareas); disponible en app y por email.
- **US-10.3** Como *usuario*, quiero preguntar sobre mis documentos cargados (protocolos, contratos).
  - AC: RAG sobre `Document`; cita el documento fuente; guardrail para temas veterinarios/legales.

### E11 — Mobile offline
- **US-11.1** Como *operario*, quiero cargar eventos sin señal y que se sincronicen solos al volver la conexión.
  - AC: cola local (IndexedDB); sync automática; resolución de conflictos determinística; sin duplicados (idempotencia).

*(El backlog completo por historia se mantiene en el tracker; aquí figura la muestra representativa por épica.)*

## 3. Definition of Ready / Done

- **DoR:** historia con AC claros, diseño/mock enlazado, dependencias resueltas, estimada.
- **DoD:** código + tests (unit/integration), RLS verificada, OpenAPI actualizado, observabilidad, revisión de seguridad, desplegado en staging, demo aceptada.

## 4. Plan de sprints (MVP · 8 sprints × 2 semanas ≈ 16 semanas)

| Sprint | Foco | Entregables clave |
|--------|------|-------------------|
| **S1** | Fundaciones | Monorepo, CI/CD, CDK base (VPC, Aurora, ECS, Cognito), esqueleto NestJS/Next.js, RLS + tenant context |
| **S2** | Auth + Organización | Registro tenant, login/MFA, roles base, CRUD empresa/campo/establecimiento/lote/potrero, mapa GIS básico |
| **S3** | Ganadería I | Categorías, rodeos, batches, stock por categoría, movimientos (compra/venta/nac/muerte) |
| **S4** | Ganadería II + Inventario I | Traslados, cambios de categoría, pesadas + ADG; productos, depósitos, movimientos |
| **S5** | Inventario II + Sanidad | Consumo automático, stock mínimo + alertas; sanidad/nutrición con descuento de stock |
| **S6** | Agricultura + Maquinaria | Campañas, labores, órdenes de trabajo, costos, margen bruto; equipos, tareas, combustible, mantenimiento |
| **S7** | Dashboard + Reportes + Import/Export | Dashboard v1, reportes (stock, resumen ganadero, margen agrícola), export Excel/PDF, import Excel |
| **S8** | Copiloto AI v1 + Mobile offline + Hardening | Chat + RAG + resumen semanal; PWA offline + sync; auditoría, backups, pruebas de aislamiento, UAT pilotos |

**Buffer/estabilización:** 2 semanas post-S8 para feedback de pilotos antes de GA.

## 5. Roadmap 12 meses

| Trimestre | Objetivo | Hitos |
|-----------|----------|-------|
| **T1 (M1–M3)** | MVP + pilotos | Sprints S1–S8; 5 empresas piloto; validación offline + copiloto v1 |
| **T2 (M4–M6)** | GA + IoT/datos de campo | E15 (IoT Core, RFID, balanzas, clima), integración satélite/NDVI, cría avanzada (E16), finanzas avanzadas inicio (E19) |
| **T3 (M7–M9)** | Profundidad ganadera + IA predictiva | Recría/engorde + Feedlot (E17), Tambo (E18), IA predictiva (E21) modo recomendar, servicios a terceros (E20) |
| **T4 (M10–M12)** | Escala regional + enterprise | Contabilidad/impuestos por país (E19), agentes con aprobación (E21), marketplace (E22), modelo bridge/silo enterprise (E24), inicio computer vision/benchmark (E23) |

### Hitos de negocio asociados
- **M3:** MVP en producción con pilotos pagos.
- **M6:** GA multi-país (AR/UY) con IoT básico.
- **M9:** cobertura ganadera completa + predictiva → expansión CL/PY/BR.
- **M12:** oferta enterprise (aislamiento fuerte) + ecosistema de integraciones.

## 6. Dependencias críticas
- E01 (tenant/RLS) bloquea todo → primero.
- E05 (inventario) requerido por E04 sanidad y E06 labores.
- E10 (IA) depende de datos reales de E04/E05/E06 y de `Document`.
- E11 (offline) requiere APIs idempotentes definidas en S3–S6.
