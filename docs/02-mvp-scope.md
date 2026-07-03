# 02 — Alcance del MVP

**Objetivo del MVP:** validar que una empresa agropecuaria puede operar su día a día (ganadería + agricultura básica + inventario + maquinaria) desde web y mobile offline, obtener reportes de stock/margen, y usar un copiloto de IA sobre sus propios datos — todo multi-tenant y seguro.

**Duración estimada:** 12–16 semanas (8 sprints de 2 semanas). Ver [plan de sprints](05-backlog-roadmap.md#4-plan-de-sprints-mvp).

---

## 1. Principios de recorte del MVP

- **Profundidad vs. amplitud:** cubrir ganadería con buena profundidad (es el mayor dolor operativo diario) y agricultura/maquinaria/finanzas en versión básica.
- **Mobile primero para captura, web para análisis.**
- **Multi-tenant desde el día 1** (no se puede "agregar después" sin dolor).
- **IA como diferenciador temprano** pero acotada: preguntas sobre datos propios + resumen + RAG de documentos.

## 2. In-scope (MVP)

### 2.1 Plataforma y cuenta
- Multi-tenant básico (pooled) con `tenant_id` obligatorio y RLS en Aurora.
- Autenticación con **Amazon Cognito** (email+password, MFA opcional, recuperación).
- Onboarding self-service con wizard + plantillas por tipo de explotación (cría / invernada / agrícola / mixto).
- Gestión de **empresas, campos, establecimientos, lotes y potreros**.
- Roles base (subset): Admin tenant, Dueño, Administrador de campo, Encargado ganadero, Encargado agrícola, Operario, Contador (solo lectura financiera), Consultor externo.
- Auditoría de acciones críticas (create/update/delete/aprobación).

### 2.2 Dashboard general (v1)
- Superficie total y por lote/cultivo.
- Stock ganadero por categoría.
- Movimientos del período (compras, ventas, nacimientos, muertes).
- Tareas pendientes y alertas críticas (stock mínimo, sanidad vencida).
- Filtros por establecimiento, actividad, campaña, categoría, fecha.
- Mapa GIS básico (Mapbox) con campos/lotes/potreros.

### 2.3 Ganadería (núcleo del MVP)
- Stock diario por categoría de hacienda.
- Novedades: compras, ventas, nacimientos, muertes, traslados, cambios de categoría, cesiones.
- Pesadas (carga manual; RFID/balanza en Fase 2) → curva de peso, ganancia diaria (ADG).
- Sanidad básica: registro de tareas sanitarias con **descuento automático de stock** (vacunas/medicamentos).
- Suplementación básica con consumo contra inventario.
- Rodeos, categorías, potreros; trazabilidad grupal (individual básica).
- Reportes: stock ganadero, resumen ganadero, tareas ganaderas, índices físicos básicos.

### 2.4 Inventario / Artículos
- Almacenes/depósitos.
- Productos (insumos agrícolas, veterinarios, combustible, suplementos).
- Movimientos entrada/salida y transferencias.
- Stock mínimo + alertas de reposición.
- **Consumo automático contra órdenes de trabajo** (agrícolas y ganaderas).
- Valorización por costo promedio.

### 2.5 Agricultura básica
- Campañas agrícolas, lotes, cultivos.
- Labores: siembra, fumigación, fertilización, cosecha.
- Órdenes de trabajo con consumo de insumos.
- Costos directos por lote/labor.
- Reporte de margen bruto agrícola y rinde por lote.

### 2.6 Maquinaria básica
- Equipos (propios/contratados).
- Tareas realizadas (horas / hectáreas).
- Consumo de combustible.
- Mantenimiento (registro y alertas simples).

### 2.7 Copiloto Campo AI (v1)
- Chat en lenguaje natural sobre datos del tenant (text-to-insight vía consultas parametrizadas seguras).
- Resumen semanal del campo (generado).
- Alertas explicadas (por qué se dispara, datos usados).
- **RAG** sobre documentos cargados por el tenant (manuales, protocolos, contratos).
- Modo "solo recomendar" (sin ejecución automática en MVP).
- Guardrails + explicabilidad (datos usados, supuestos, confianza) + auditoría de cada respuesta.

### 2.8 Mobile PWA offline (v1)
- Carga offline de eventos simples (pesadas, movimientos, tareas, consumos).
- Sincronización automática al reconectar (cola local + resolución de conflictos).
- Escaneo QR/código de caravana (cámara).
- Modo campo (botones grandes, mínimos pasos).

### 2.9 Datos e integración
- Importación masiva desde Excel (hacienda inicial, productos, lotes).
- Exportación Excel/PDF de reportes.

### 2.10 Plataforma técnica
- CI/CD (GitHub Actions) + IaC (AWS CDK).
- Backups automáticos + PITR de Aurora.
- Observabilidad base (CloudWatch, trazas).

## 3. Out-of-scope (MVP → fases posteriores)

| Funcionalidad | Fase |
|---------------|------|
| IoT Core, RFID automático, balanzas electrónicas, sensores | 2 |
| Clima georreferenciado y satélite/NDVI | 2 |
| Feedlot avanzado, Tambo | 2 |
| Cría/reproducción avanzada (tacto, preñez, índices completos) | 2 |
| Finanzas avanzadas, contabilidad completa, impuestos por país | 2 |
| Servicios a terceros (facturación completa) | 2 |
| IA predictiva (peso, venta, rinde, riesgo) | 2 |
| Agentes de IA que ejecutan acciones con aprobación | 2 |
| Marketplace de integraciones | 2 |
| Computer vision, benchmark anónimo, ESG, facturación electrónica | 3 |
| Modelo silo/enterprise, data residency avanzada | 3 (bajo demanda enterprise) |

## 4. Criterios de aceptación del MVP (Definition of Done global)

1. Un tenant nuevo se registra y configura su primer establecimiento en < 1 día sin soporte.
2. Un operario carga una pesada y un movimiento **sin conexión**; al reconectar, se sincroniza sin pérdida.
3. Ejecutar una tarea sanitaria **descuenta stock** automáticamente y dispara alerta si cae bajo el mínimo.
4. El dashboard muestra stock ganadero y margen bruto agrícola con datos reales cargados.
5. El copiloto responde "¿cuánto stock de novillos tengo?" y "¿qué tareas vencen esta semana?" con explicación de datos usados.
6. Dos tenants distintos **nunca** ven datos del otro (verificado con pruebas de aislamiento).
7. Reportes exportables a Excel/PDF.
8. Pipeline CI/CD despliega a un entorno AWS reproducible vía CDK.

## 5. Métricas de validación del MVP

- ≥ 5 empresas piloto operando su ganadería real durante 6 semanas.
- ≥ 60% de eventos cargados desde mobile.
- ≥ 80% de syncs offline exitosos al primer intento.
- ≥ 50% de usuarios activos consultan el copiloto al menos 1 vez/semana.
- Feedback cualitativo: "reemplaza mi Excel" en ≥ 3 de 5 pilotos.
