# 09 — Riesgos y Mitigaciones

Matriz de riesgos por categoría. Prob. (probabilidad) e Imp. (impacto) en escala Baja/Media/Alta.

---

## 1. Riesgos técnicos

| ID | Riesgo | Prob. | Imp. | Mitigación |
|----|--------|-------|------|-----------|
| RT1 | Fuga de datos entre tenants (falla de aislamiento) | Media | **Alta** | RLS en Aurora (defense-in-depth), tenant context propagado, **tests de aislamiento automáticos en CI**, revisiones de seguridad |
| RT2 | Conflictos/pérdida de datos en sync offline | Media | Alta | Idempotencia por `client_uuid`, resolución determinística de conflictos, cola local persistente, reintentos, telemetría de sync |
| RT3 | Costos de Bedrock/OpenSearch fuera de control | Alta | Media | Cuotas por plan, caché de respuestas, pgvector en vez de OpenSearch en MVP, budgets/alarmas, cost tags por tenant |
| RT4 | Latencia/perf en dashboards con datos crecientes | Media | Media | Vistas materializadas, CDC a data lake, caching, particionamiento por fecha |
| RT5 | Complejidad operativa (microservicios prematuros) | Media | Media | Modular monolith en MVP; extraer servicios solo con necesidad real |
| RT6 | Migraciones de esquema riesgosas en prod | Media | Alta | Migraciones versionadas (Prisma), expand/contract, gates en CI, backups + PITR |

## 2. Riesgos de IA

| ID | Riesgo | Prob. | Imp. | Mitigación |
|----|--------|-------|------|-----------|
| RA1 | Alucinaciones / cifras inventadas | Media | Alta | Text-to-insight con **tools parametrizadas** (sin SQL libre), grounding obligatorio, explicabilidad, golden set de evaluación |
| RA2 | Prompt injection vía documentos RAG | Media | Alta | Separación instrucciones/datos, sanitización, allow-list de acciones, datos nunca como instrucciones |
| RA3 | Recomendación veterinaria/financiera peligrosa | Media | **Alta** | Guardrails + disclaimers obligatorios, validación humana, modo "solo recomendar" por defecto |
| RA4 | Acción automática no deseada de agentes | Baja | Alta | Human-in-the-loop, aprobación explícita, auditoría, sin acciones destructivas |
| RA5 | Uso de datos del cliente sin consentimiento | Baja | Alta | Opt-in explícito, no reentrenamiento de FM, registro de consentimiento revocable |

## 3. Riesgos de negocio / producto

| ID | Riesgo | Prob. | Imp. | Mitigación |
|----|--------|-------|------|-----------|
| RN1 | Baja adopción por resistencia al cambio (Excel/papel) | Alta | Alta | UX simple, modo campo, onboarding < 1 día, importación desde Excel, pilotos acompañados |
| RN2 | Scope creep del MVP | Alta | Media | MoSCoW estricto, MVP acotado, backlog priorizado, DoR/DoD |
| RN3 | Estacionalidad (picos cosecha/servicio) tensiona soporte/infra | Media | Media | Autoescalado, playbooks de soporte, capacidad reservada en picos |
| RN4 | Diferenciación insuficiente vs. incumbentes | Media | Alta | Foco en offline-first + IA explicable + mobile; medir NPS vs. competencia |
| RN5 | Riesgo legal por parecido con competidor | Baja | Alta | UI/textos/assets 100% originales; solo dominio funcional como referencia; revisión legal |

## 4. Riesgos de conectividad / campo

| ID | Riesgo | Prob. | Imp. | Mitigación |
|----|--------|-------|------|-----------|
| RC1 | Conectividad nula en el campo | Alta | Media | Offline-first real, sync diferida, funciones críticas 100% locales |
| RC2 | Integración IoT/RFID/balanzas heterogénea | Alta | Media | IoT Core con adaptadores, protocolos estándar (MQTT/LoRaWAN), carga manual como fallback |
| RC3 | Baja alfabetización digital del usuario | Media | Media | UX de modo campo, voz a texto, tutoriales in-app, soporte |

## 5. Riesgos de seguridad / compliance

| ID | Riesgo | Prob. | Imp. | Mitigación |
|----|--------|-------|------|-----------|
| RS1 | Brecha de seguridad / acceso indebido | Baja | Alta | MFA, IAM least privilege, WAF, cifrado KMS, auditoría, pentests |
| RS2 | Requisitos de data residency por país | Media | Media | Modelo silo por región, configuración de residencia, doc de compliance |
| RS3 | Cumplimiento normativo agropecuario por país (fitosanitarios, trazabilidad) | Media | Media | Motor de reglas configurable por país; validación con expertos locales |

## 6. Riesgos de ejecución / equipo

| ID | Riesgo | Prob. | Imp. | Mitigación |
|----|--------|-------|------|-----------|
| RE1 | Falta de expertise de dominio agropecuario | Media | Alta | Asesores agrónomos/veterinarios en el equipo; validación con pilotos |
| RE2 | Dependencia de un único proveedor cloud (lock-in) | Media | Baja | Abstracciones donde sea barato (MapLibre, Postgres estándar), aceptar lock-in consciente por velocidad |
| RE3 | Deuda técnica acumulada por velocidad de MVP | Media | Media | DoD con calidad, refactors planificados, ADRs, cobertura de tests en dominios críticos |

## 7. Top 5 riesgos a vigilar (dashboard de riesgos)
1. **RT1 / RA3** — aislamiento de tenants y seguridad de recomendaciones de IA (impacto reputacional/legal).
2. **RN1** — adopción real en el campo (define el negocio).
3. **RT2** — integridad del sync offline (confianza en los datos).
4. **RT3** — costos de IA (margen del SaaS).
5. **RN2** — disciplina de scope del MVP (time-to-market).
