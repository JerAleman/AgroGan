# 07 — Wireframes descriptivos

Descripción textual de las pantallas principales (web y mobile). No reproduce UI de terceros; propone una experiencia original, simple y mobile-first. Cada wireframe describe layout, componentes y comportamiento.

**Sistema de diseño:** shadcn/ui + Tailwind. Estética limpia, alto contraste (uso a sol pleno), tipografía grande, semáforos de estado (verde/ámbar/rojo), iconografía agropecuaria propia.

---

## 1. Principios de UX

- **Modo campo:** botones grandes, mínimos taps, tolerante a guantes/sol; captura por voz y escaneo.
- **Offline visible:** indicador de conexión y de "N eventos por sincronizar".
- **Progressive disclosure:** lo esencial primero; detalle bajo demanda.
- **Tableros por rol:** cada rol ve su home relevante.
- **Consistencia:** navegación lateral (web) / bottom tab bar (mobile).

## 2. Navegación global

- **Web (desktop):** barra lateral izquierda con módulos (Dashboard, Ganadería, Agricultura, Inventario, Maquinaria, Finanzas, Copiloto AI, Reportes, Configuración). Top bar con selector de establecimiento/campaña, buscador global, campana de notificaciones, avatar/tenant.
- **Mobile:** bottom tab bar de 5 ítems (Inicio, Cargar +, Ganadería, Copiloto, Más). Botón central "Cargar +" prominente para captura rápida.

---

## 3. Wireframes

### W1 — Dashboard ejecutivo (web)
```
┌───────────────────────────────────────────────────────────────────────┐
│ [Agro360]  Establecimiento: [La Esperanza ▾]  Campaña: [24/25 ▾] 🔔 👤 │
├───────────┬───────────────────────────────────────────────────────────┤
│ ▸Dashboard│  Filtros: [Actividad ▾][Categoría ▾][Fecha ▾]   [Exportar] │
│  Ganadería│ ┌─────────┐┌─────────┐┌─────────┐┌─────────┐               │
│  Agricultura│ │Sup. total││Stock haci││Margen br.││Alertas  │           │
│  Inventario││ 2.450 ha ││ 3.812 cab││ +18% ▲   ││  4 🔴    │            │
│  Maquinaria│ └─────────┘└─────────┘└─────────┘└─────────┘              │
│  Finanzas │ ┌──────────────────────────┐ ┌──────────────────────────┐  │
│  Copiloto │ │ Mapa GIS (lotes/potreros) │ │ Stock por categoría (bar) │ │
│  Reportes │ │  [Mapbox con capas]       │ │ vacas/vaq/novillos/ternI  │ │
│  Config   │ └──────────────────────────┘ └──────────────────────────┘  │
│           │ ┌──────────────────────────┐ ┌──────────────────────────┐  │
│           │ │ Tareas pendientes (lista) │ │ Evolución productiva (ln) │ │
│           │ └──────────────────────────┘ └──────────────────────────┘  │
└───────────┴───────────────────────────────────────────────────────────┘
```
- Widgets arrastrables/configurables por rol. Cada KPI enlaza a su reporte.
- Alertas con semáforo; click abre detalle con explicación (origen del dato).

### W2 — Home mobile (operario, modo campo)
```
┌───────────────────────────┐
│ La Esperanza      🔵 online │
│ ⚠ 3 eventos por sincronizar│
├───────────────────────────┤
│  Accesos rápidos           │
│ ┌────────┐ ┌────────┐      │
│ │ ⚖ Pesar│ │ 🔄 Mover│     │
│ └────────┘ └────────┘      │
│ ┌────────┐ ┌────────┐      │
│ │ 💉 Sanid│ │ 🌾 Tarea│     │
│ └────────┘ └────────┘      │
│  Tareas de hoy             │
│  • Vacunar rodeo 4  [Ir]   │
│  • Recuento potrero 7 [Ir] │
├───────────────────────────┤
│ 🏠   ➕Cargar  🐄  🤖  ⋯    │
└───────────────────────────┘
```
- Botón "Cargar +" abre menú de captura rápida. Todo funciona offline.

### W3 — Captura de pesada (mobile)
```
┌───────────────────────────┐
│ ← Registrar pesada         │
├───────────────────────────┤
│ Rodeo/Tropa: [Novillos R4▾]│
│ Método: (•)Manual ( )RFID  │
│ [ 📷 Escanear caravana ]   │
│ Peso (kg):  [   312.5   ]  │
│ Fecha: [Hoy 10:00]         │
│ 🎙 "Trescientos doce..."    │
│                            │
│ ADG estimado: 0,72 kg/día  │
│ ┌────────────────────────┐ │
│ │      GUARDAR (offline)  ││ │
│ └────────────────────────┘ │
└───────────────────────────┘
```
- Entrada por voz (voz-a-texto) y escaneo de caravana. Guardado en cola local; feedback inmediato de ADG.

### W4 — Ganadería: stock y movimientos (web)
```
┌───────────────────────────────────────────────────────────┐
│ Ganadería › Stock            [+ Nuevo movimiento]           │
│ Tabs: [Stock][Movimientos][Pesadas][Sanidad][Nutrición]    │
├───────────────────────────────────────────────────────────┤
│ Categoría     │ Cabezas │ Peso prom │ ADG   │ Δ mes         │
│ Vacas         │  1.240  │  420 kg   │  —    │  +12          │
│ Novillos      │    812  │  312 kg   │ 0,72  │  −40 (venta)  │
│ Terneros/as   │    980  │   95 kg   │ 0,85  │  +210 (nac.)  │
│ ...           │         │           │       │               │
├───────────────────────────────────────────────────────────┤
│ Línea de tiempo de movimientos (compras/ventas/nac/muerte)  │
└───────────────────────────────────────────────────────────┘
```

### W5 — Sanidad con descuento de stock (web/mobile)
```
Nueva tarea sanitaria
- Rodeo/animal: [Rodeo 4 ▾]   Fecha: [hoy]
- Tipo: (•)Vacuna ( )Tratamiento
- Producto: [Aftosa X ▾]  Stock actual: 120 dosis
- Dosis/animal: [1]  Cabezas: [240]  → Consumo: 240 dosis
- Próxima aplicación: [+180 días]
⚠ Al guardar, se descontarán 240 dosis. Stock quedará en −120 → ALERTA reposición.
[ Guardar ]
```
- Muestra impacto en inventario antes de confirmar; dispara alerta si cruza el mínimo.

### W6 — Inventario (web)
```
Inventario › Productos
Filtros: [Categoría ▾][Depósito ▾][Estado stock ▾]
┌─────────────┬────────┬────────┬──────────┬─────────┐
│ Producto     │ Stock  │ Mínimo │ Vencim.  │ Estado  │
│ Aftosa X     │ 120    │ 300    │ 2026-11  │ 🔴 bajo  │
│ Glifosato    │ 4.800L │ 1.000L │ —        │ 🟢 ok    │
│ Urea         │ 0      │ 500    │ —        │ 🔴 falta │
└─────────────┴────────┴────────┴──────────┴─────────┘
[ Sugerencia de compra: 3 productos → generar orden ]
```

### W7 — Agricultura: campaña y labores (web)
```
Agricultura › Campaña 24/25 › Lote 7 (Soja)
Timeline: Siembra → Fumigación → Fertilización → Cosecha
KPIs: Rinde 3,4 tn/ha | Costo 480 US$/ha | Margen bruto +210 US$/ha
[ + Nueva labor ]  [ Comparar lotes ]
Tabla de labores con costo, insumos consumidos y responsable.
```

### W8 — Copiloto Campo AI (web/mobile)
```
┌───────────────────────────────────────────────┐
│ 🤖 Copiloto Campo AI            [Modo: Recom.] │
├───────────────────────────────────────────────┤
│ Vos: ¿Qué lote tuvo peor margen esta campaña?  │
│ ─────────────────────────────────────────────  │
│ Copiloto: El Lote 12 (maíz) con −35 US$/ha.     │
│  ▸ Datos usados: costos lote 12, rinde, precio  │
│  ▸ Supuestos: precio maíz spot al 03/07         │
│  ▸ Confianza: 88%   👍 👎                        │
│  [Ver reporte]  [Crear tarea]  [Explicar más]   │
├───────────────────────────────────────────────┤
│ [🎙]  Escribí tu pregunta...            [Enviar]│
└───────────────────────────────────────────────┘
```
- Toda respuesta muestra explicabilidad (datos/supuestos/confianza) y feedback. Acciones (crear tarea/orden) requieren aprobación humana.

### W9 — Onboarding wizard (web)
```
Paso 1/5: Datos de la empresa (nombre, país, moneda, impuestos)
Paso 2/5: Tipo de explotación → [Cría][Invernada][Feedlot][Tambo][Agrícola][Mixto]
          (aplica plantilla de categorías/actividades)
Paso 3/5: Cargar establecimientos y lotes (mapa o importar Excel)
Paso 4/5: Stock inicial de hacienda + inventario (importar Excel)
Paso 5/5: Invitar usuarios y asignar roles
[ Finalizar → Dashboard ]   Progreso: ▓▓▓▓░ 
```
- Objetivo: empresa chica operativa en < 1 día.

### W10 — Maquinaria (web)
```
Maquinaria › Tractor JD 6110 (Propio)
KPIs: Horas 1.240 | Combustible 3,1 L/ha | Costo/ha 22 US$ | vs mercado −18%
Tabs: [Tareas][Combustible][Mantenimiento][Rentabilidad]
Alertas: 🔧 Service 250h en 12h de uso
```

### W11 — Centro de alertas y notificaciones
```
Alertas (semáforo, agrupadas por tipo)
🔴 Stock: Aftosa X bajo mínimo
🔴 Sanidad: 3 tareas vencen esta semana
🟠 Peso: ADG bajo en Novillos R4
🟠 Clima: pronóstico de heladas (Fase 2)
[ Marcar leídas ] [ Configurar reglas ]
```

## 4. Estados y microinteracciones
- **Vacío:** ilustración + CTA ("Cargá tu primer rodeo").
- **Offline:** banner persistente + badge de pendientes; botón "Sincronizar ahora".
- **Carga:** skeletons; nunca spinners bloqueantes en captura.
- **Errores de sync:** lista de eventos en conflicto con resolución asistida.

## 5. Accesibilidad y localización
- Contraste AA+, targets táctiles ≥ 48px, soporte de lectores de pantalla.
- Español LATAM; formatos de número/fecha/moneda por país; terminología regional configurable (ej. "rodeo"/"tropa").
