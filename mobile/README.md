# Mobile — Agro360 Cloud

App de campo **offline-first**. Estrategia MVP: **PWA** (compartida con `frontend/`) para acelerar time-to-market; evolución a **React Native/Expo** en Fase 2 si se requieren capacidades nativas (BLE para balanzas/RFID, mejor cámara/NFC).

## Objetivos de la app de campo
- Carga de eventos **sin conexión** (pesadas, movimientos, sanidad, nutrición, tareas).
- **Sincronización automática** al reconectar, sin duplicados ni pérdida.
- **Modo campo**: botones grandes, alto contraste, mínimos taps.
- **Escaneo** de caravanas (QR/NFC) y **voz a texto** (Fase 2).

## Estrategia offline (compartida con frontend PWA)

```
Captura → cola local (IndexedDB / Dexie) con clientUuid (UUID v7)
   │  estado: pending → syncing → synced | conflict
   ▼
Reconexión (Background Sync API) → POST /v1/sync/batch
   │  respuesta por evento: applied | duplicate | rejected
   ▼
Resolución de conflictos determinística (last-write-wins por campo +
  reglas de dominio; conflictos irresueltos → bandeja de revisión)
```

### Garantías
- **Idempotencia:** el backend deduplica por `(tenant_id, client_uuid)`.
- **Orden causal:** dependencias (ej. crear batch antes de pesarlo) resueltas por cola ordenada + reintentos.
- **Integridad:** los eventos no se borran de la cola hasta confirmación `applied|duplicate`.

## Componentes (Fase 2, si RN)
```
mobile/
├── app/                # pantallas (expo-router)
├── src/offline/        # motor de cola + sync (compartible con frontend)
├── src/scan/           # cámara QR / NFC / BLE (balanzas, RFID)
└── src/voice/          # voz a texto para partes diarios
```

## MVP
El MVP se entrega como **PWA instalable** desde `frontend/`. Esta carpeta documenta la estrategia y aloja el futuro cliente nativo.
