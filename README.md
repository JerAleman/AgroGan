# Agro360 Cloud 🌾🐄

> Plataforma SaaS B2B multi-tenant de gestión y administración agropecuaria — cloud-native, mobile-first, offline-first, con IA generativa aplicada al agro.

**Estado:** Fase de diseño / MVP (greenfield)
**Mercado inicial:** Argentina, Chile, Uruguay, Paraguay, Brasil
**Idioma inicial:** Español LATAM
**Cloud:** AWS

---

## ¿Qué es Agro360 Cloud?

Un sistema integral de control de gestión agropecuaria que unifica en una sola plataforma la operación técnica y administrativa del campo: agricultura, ganadería (cría, recría, engorde, feedlot, tambo), maquinaria, servicios a terceros, inventarios, finanzas, contabilidad, trazabilidad y rentabilidad — potenciado por un copiloto de IA que responde preguntas en lenguaje natural sobre los datos reales del productor.

La plataforma responde a las preguntas clave del productor:
- ¿Qué está pasando hoy en el campo?
- ¿Cuánto stock tengo y cuánto me cuesta producir?
- ¿Qué margen bruto tengo por actividad, lote o rodeo?
- ¿Qué decisiones debería tomar esta semana?
- ¿Qué riesgos climáticos, sanitarios, productivos o financieros existen?

## Diferenciadores

1. **UX moderna, mobile-first y offline-first** para uso real en el campo sin conectividad.
2. **Copiloto Campo AI**: consulta de datos en lenguaje natural, resúmenes, alertas explicables y agentes que ejecutan acciones con aprobación humana.
3. **Analítica predictiva** (peso, fecha óptima de venta, rinde, riesgo).
4. **Integración IoT nativa** (RFID, balanzas, clima, satélite, maquinaria).
5. **Multi-tenancy real y seguro** en AWS con aislamiento fuerte.
6. **Configurable por país**: moneda, impuestos, unidades productivas.

## Estructura del repositorio

```
agro360-cloud/
├── frontend/     # Next.js + TypeScript + Tailwind + shadcn/ui (web app + PWA offline)
├── backend/      # NestJS (TypeScript), arquitectura modular por dominios
├── mobile/       # App móvil offline-first (PWA / futura RN)
├── infra/        # AWS CDK (TypeScript) — IaC, más OpenAPI spec
├── docs/         # Entregables de producto y arquitectura (PRD, ADRs, diseño)
└── tests/        # Pruebas e2e / de integración transversales
```

## Documentación (entregables de diseño)

| # | Documento | Descripción |
|---|-----------|-------------|
| 01 | [PRD](docs/01-prd.md) | Product Requirements Document completo |
| 02 | [Alcance MVP](docs/02-mvp-scope.md) | Scope del MVP (12–16 semanas) |
| 03 | [Arquitectura AWS](docs/03-architecture.md) | Arquitectura, stack, multi-tenancy, seguridad, costos |
| 04 | [Modelo de datos](docs/04-data-model.md) | ERD y entidades |
| 05 | [Backlog & Roadmap](docs/05-backlog-roadmap.md) | Backlog, user stories, sprints, roadmap 12 meses |
| 06 | [APIs](docs/06-api.md) | Diseño de APIs + OpenAPI |
| 07 | [Wireframes](docs/07-wireframes.md) | Wireframes descriptivos |
| 08 | [Estrategia de IA](docs/08-ai-strategy.md) | Copiloto Campo AI, RAG, agentes, guardrails |
| 09 | [Riesgos](docs/09-risks.md) | Riesgos y mitigaciones |

## Stack tecnológico (resumen)

- **Frontend:** Next.js, TypeScript, Tailwind, shadcn/ui, TanStack Query, Zustand, Mapbox, PWA offline.
- **Backend:** NestJS (TypeScript), Prisma, PostgreSQL/Aurora Serverless v2, OpenAPI, event-driven (EventBridge/SQS).
- **IA:** Amazon Bedrock, Knowledge Bases (RAG), Agents, Guardrails.
- **Infra:** AWS CDK, ECS Fargate, Aurora Serverless v2, S3, CloudFront, Cognito, WAF, IoT Core.

Ver [decisiones de stack](docs/03-architecture.md#5-decisiones-de-stack).

## Nota legal

Este producto usa el **dominio funcional agropecuario** como referencia de mercado. **No** copia marca, textos, diseño visual, assets, pantallas ni propiedad intelectual de ningún competidor. Toda la UX, terminología de producto y assets son originales.
