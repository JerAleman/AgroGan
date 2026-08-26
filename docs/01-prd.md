# 01 — Product Requirements Document (PRD)
## Agro360 Cloud — Plataforma SaaS de Gestión Agropecuaria

**Versión:** 1.0 · **Autor:** Equipo de Producto · **Estado:** Draft para validación

---

## 1. Resumen ejecutivo

Agro360 Cloud es una plataforma SaaS B2B multi-tenant, cloud-native y mobile-first, que unifica la gestión técnica, operativa y administrativa de empresas agropecuarias (agricultura + ganadería). Se diferencia de los ERP agropecuarios tradicionales por su experiencia de usuario moderna, su capacidad offline en el campo, y un copiloto de IA que convierte los datos del productor en respuestas, alertas y recomendaciones accionables.

**Propuesta de valor central:** *"Dejá de gestionar el campo en Excel y planillas dispersas. Cargá una vez desde el celular y obtené stock, costos, márgenes, alertas y decisiones en tiempo real — con un copiloto de IA que entiende tu campo."*

## 2. Objetivos y metas

### 2.1 Objetivos de producto
- Unificar en una plataforma la operación de campo y la administración/finanzas.
- Dar visibilidad de **rentabilidad por actividad, lote, rodeo, máquina y establecimiento**.
- Habilitar la carga de datos **en el campo, offline**, desde el celular.
- Ofrecer un **copiloto de IA explicable** sobre datos propios.
- Escalar de una pyme agropecuaria a un holding regional sin mezclar datos.

### 2.2 Metas medibles (North Star + KPIs)
- **North Star:** eventos operativos cargados por establecimiento activo por semana.
- Onboarding de una empresa chica en **< 1 día**.
- **≥ 70%** de eventos cargados desde mobile a los 3 meses de uso.
- **≥ 60%** de tenants activos usando el copiloto de IA semanalmente.
- Retención lógica (NRR) **> 110%** anual.
- TTV (time-to-value): primer reporte de margen bruto útil en **< 2 semanas**.

## 3. Personas y usuarios

| Persona | Rol | Necesidad principal | Dispositivo |
|---------|-----|---------------------|-------------|
| **Martín** — Dueño/Director | Decisor | Rentabilidad por actividad y consolidado, sin depender de Excel | Web + mobile |
| **Sofía** — Administradora de campo | Operación diaria | Stock, costos, tareas y márgenes en tiempo real | Web + mobile |
| **Julián** — Encargado ganadero | Operario senior | Cargar pesadas, movimientos, sanidad rápido y offline | Mobile |
| **Lucía** — Agrónoma | Asesora | Planificar campañas, comparar lotes, ver rinde y margen | Web |
| **Diego** — Veterinario | Asesor | Sanidad, reproducción, alertas por animal/rodeo | Web + mobile |
| **Roberto** — Contador | Administración | Costos, centros de costo, export contable, impuestos | Web |
| **Ana** — Contratista de maquinaria | Servicios a 3ros | Órdenes de trabajo, facturación, rentabilidad por cliente | Web + mobile |
| **Superadmin SaaS** | Operador plataforma | Gestión de tenants, planes, soporte | Web |

## 4. Problemas a resolver (Jobs To Be Done)

1. *"Cuando necesito saber cuánto me costó producir, tengo que reconstruirlo de varias planillas."*
2. *"Cargo datos en papel en el campo y los paso a la compu días después — con errores."*
3. *"No sé cuál de mis lotes o rodeos es realmente rentable."*
4. *"Descubro faltantes de insumos tarde y freno una labor."*
5. *"El veterinario y yo no vemos la misma información sanitaria."*
6. *"Tengo datos, pero no tengo tiempo de analizarlos para decidir."*

## 5. Alcance funcional (módulos)

> Detalle de prioridad y fases en [Backlog & Roadmap](05-backlog-roadmap.md). Marcado MVP en [Alcance MVP](02-mvp-scope.md).

1. **Dashboard ejecutivo** — configurable por tenant/establecimiento/actividad/rol, con filtros multi-dimensión y mapa GIS.
2. **Agricultura** — campañas, lotes, labores (siembra, fumigación, fertilización, cosecha, riego), órdenes de trabajo, KPIs de margen y rinde.
3. **Ganadería** — stock por categoría, movimientos (compra/venta/nacimiento/muerte/traslado/cambio de categoría), pesadas, sanidad, nutrición, trazabilidad individual y grupal.
4. **Cría** — reproducción, servicio, tacto, parición, destete, índices reproductivos, semáforos.
5. **Recría y engorde** — carga animal, ganancia diaria, costo por kilo, resultado por tropa, simulación de venta.
6. **Feedlot** — corrales, dietas, raciones, conversión, costo por kilo ganado, proyección de salida.
7. **Tambo** — producción de leche, litros/vaca, calidad, mastitis, margen por litro.
8. **Maquinaria** — equipos propios/contratados, tareas, combustible, mantenimiento, amortización, rentabilidad por equipo.
9. **Servicios a terceros** — clientes, contratos, órdenes, facturación, rentabilidad por cliente/tarea/campo.
10. **Artículos e inventarios** — almacenes, insumos, stock min/max, lotes, vencimientos, valorización, consumo automático contra tareas.
11. **Administración, finanzas, contabilidad e impuestos** — centros de costo, compras/ventas, cuentas corrientes, flujo de caja, márgenes, EBITDA agropecuario, export contable, impuestos por país.
12. **Copiloto Campo AI** — chat en lenguaje natural, reportes automáticos, alertas explicadas, RAG sobre documentos, agentes con aprobación.
13. **IA predictiva y analítica** — predicción de peso/venta/rinde/stock, riesgos, simulador de escenarios, benchmark anónimo.
14. **Computer vision (futuro)** — conteo, condición corporal, lectura de caravanas, NDVI.
15. **IoT y datos de campo** — sensores, balanzas, RFID, GPS, LoRaWAN, MQTT, weather/satélite.
16. **Experiencia de usuario** — web responsive, mobile offline-first, escaneo QR/RFID, voz a texto, onboarding self-service.

## 6. Roles y permisos

Roles configurables con permisos granulares por **módulo, campo, establecimiento, actividad, acción (lectura/escritura/aprobación/exportación), acceso a IA y acceso a reportes financieros**:

Super admin SaaS · Admin del tenant · Dueño/director · Administrador de campo · Encargado agrícola · Encargado ganadero · Veterinario · Agrónomo · Operario · Contador · Consultor externo · Cliente de servicios · Auditor · Soporte interno.

Modelo: **RBAC + ABAC** (atributos: `tenant_id`, `farm_id`, `establishment_id`, `activity`). Ver [seguridad](03-architecture.md#8-estrategia-de-seguridad).

## 7. Requerimientos no funcionales

| Categoría | Requerimiento |
|-----------|---------------|
| **Disponibilidad** | 99.9% mensual (MVP), 99.95% (enterprise) |
| **Performance** | p95 API < 400 ms; carga de evento mobile < 1 s (local, offline) |
| **Offline** | App de campo 100% funcional sin red; sync automática al reconectar |
| **Escalabilidad** | De 1 a 10.000+ tenants; picos estacionales (cosecha, servicio) |
| **Seguridad** | Cifrado en tránsito/reposo, tenant isolation, MFA, RLS, auditoría |
| **Observabilidad** | Trazas, métricas, logs por tenant; alertas de negocio |
| **i18n / l10n** | Español LATAM inicial; moneda, impuestos y unidades por país |
| **Portabilidad de datos** | Export completo por tenant; borrado seguro |
| **Compliance IA** | No entrenar con datos del cliente sin consentimiento; guardrails; explicabilidad |

## 8. Diferenciación vs. competidores

- No replicar un ERP tradicional: foco en **simpleza, velocidad y mobile**.
- **Offline-first real** (muchos competidores exigen conectividad).
- **IA generativa como copiloto** con explicabilidad y auditoría (no solo dashboards estáticos).
- **Onboarding self-service** con plantillas por tipo de explotación.
- **Marketplace de integraciones** (fase futura).

> Nota: se usa únicamente el dominio funcional del mercado como referencia. No se copian marca, textos, UI, assets ni PI de ningún competidor.

## 9. Criterios de éxito (Definition of Success)

- El productor carga la operación diaria desde el celular, incluso sin señal.
- El administrador ve stock, costos, márgenes y tareas en tiempo real.
- El dueño entiende rentabilidad por actividad sin Excel.
- Veterinario y agrónomo ven sanidad/reproducción y campañas respectivamente.
- La IA responde preguntas útiles sobre datos reales, de forma explicable.
- Cada tenant está aislado; el sistema escala a múltiples empresas.
- Onboarding de empresa chica < 1 día.

## 10. Suposiciones y restricciones

- Conectividad intermitente en el campo → arquitectura offline-first obligatoria.
- Usuarios con baja alfabetización digital → UX de "modo campo" (botones grandes, pocos pasos, voz).
- Datos sensibles de negocio → aislamiento y confidencialidad como requisito de venta.
- Estacionalidad marcada → autoescalado y modelo de costos variable.

## 11. Fuera de alcance (inicial)

- Facturación electrónica fiscal por país (Fase 3).
- Integraciones bancarias directas (Fase 3).
- Computer vision en producción (Fase 3, requiere validación de calidad de datos).
- Módulo ESG/huella de carbono (Fase 3).

## 12. Métricas de producto (instrumentación)

Activación (primer establecimiento + primer evento), adopción por módulo, uso de mobile vs web, tasa de sync offline exitosa, uso del copiloto, precisión percibida de recomendaciones (feedback 👍/👎), tiempo de onboarding, NRR/churn.
