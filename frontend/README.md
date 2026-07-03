# Frontend — Agro360 Cloud

Web app en **Next.js 14 (App Router) + TypeScript + Tailwind**, conectada al backend NestJS.

## Pantallas implementadas (MVP)

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión (JWT) con credenciales demo precargadas |
| `/dashboard` | KPIs (superficie, hacienda, margen bruto, alertas), stock por categoría, margen por campaña |
| `/ganaderia` | Existencias de hacienda por categoría |
| `/inventario` | Stock de insumos con alertas de mínimo (semáforo) |
| `/copiloto` | Copiloto Campo AI: chat en lenguaje natural con explicabilidad |

## Estructura

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # layout raíz
│   │   ├── page.tsx              # redirección según sesión
│   │   ├── login/page.tsx
│   │   └── (app)/               # área autenticada (sidebar + guardia de sesión)
│   │       ├── layout.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── ganaderia/page.tsx
│   │       ├── inventario/page.tsx
│   │       └── copiloto/page.tsx
│   └── lib/
│       └── api.ts               # cliente HTTP + manejo de token JWT
├── next.config.mjs              # NEXT_PUBLIC_API_URL (default http://localhost:3000/v1)
├── tailwind.config.ts
└── package.json
```

## Ejecutar

```bash
npm install
# Backend debe estar corriendo en http://localhost:3000/v1 (ver ../backend)
npm run dev        # http://localhost:3000  (Next elige otro puerto si 3000 está ocupado)
npm run build      # build de producción (verificado)
```

> Configurá `NEXT_PUBLIC_API_URL` si el backend corre en otra URL.

## Roadmap frontend
- PWA offline + cola de sincronización (IndexedDB) — ver `mobile/`
- Mapa GIS (MapLibre), altas/edición desde UI, importación Excel, tableros por rol.
