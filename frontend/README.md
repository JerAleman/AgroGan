# Frontend — Agro360 Cloud

Web app en **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**, con **TanStack Query** (server state), **Zustand** (estado local/offline) y **Mapbox/MapLibre** para GIS. Empaquetada como **PWA** para soporte offline.

## Estructura sugerida

```
frontend/
├── src/
│   ├── app/                        # rutas (App Router)
│   │   ├── (auth)/login/
│   │   ├── (app)/dashboard/
│   │   ├── (app)/ganaderia/
│   │   ├── (app)/agricultura/
│   │   ├── (app)/inventario/
│   │   ├── (app)/maquinaria/
│   │   ├── (app)/copiloto/         # Copiloto Campo AI
│   │   └── (app)/reportes/
│   ├── components/                 # UI (shadcn/ui) + componentes de dominio
│   ├── features/                   # lógica por dominio (hooks, queries, stores)
│   ├── lib/
│   │   ├── api/                    # cliente API tipado (desde OpenAPI)
│   │   ├── auth/                   # integración Cognito (Amplify/aws-sdk)
│   │   └── offline/                # cola local (Dexie/IndexedDB) + sync
│   └── styles/
├── public/
│   ├── manifest.webmanifest        # PWA
│   └── sw.js                       # service worker (o via next-pwa)
├── package.json
└── next.config.mjs
```

## Puntos clave
- **Tipos de API** generados desde `../infra/openapi.yaml` (openapi-typescript) para un cliente tipado end-to-end.
- **Tableros por rol**: el layout carga widgets según permisos del usuario.
- **GIS**: MapLibre GL como opción sin lock-in de costos (alternativa a Mapbox).
- **PWA offline**: service worker + IndexedDB; ver `mobile/` para la estrategia de sync compartida.
- **i18n**: español LATAM; formatos por país (moneda/fecha/número).

## Scripts
```bash
npm install
npm run dev       # desarrollo local (no ejecutar en el sandbox)
npm run build
npm run lint
```
