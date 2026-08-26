# 08 — Estrategia de IA · Copiloto Campo AI

Cubre: estrategia de IA generativa, IA predictiva, RAG, agentes, guardrails, explicabilidad, auditoría y computer vision (futuro).

**Plataforma base:** Amazon Bedrock (foundation models gestionados) + Knowledge Bases (RAG) + Agents + Guardrails.

---

## 1. Visión

"Copiloto Campo AI" convierte los datos del tenant en respuestas, resúmenes, alertas y recomendaciones **explicables y accionables**, respetando privacidad, aislamiento de tenant y validación humana en decisiones críticas.

Principios:
1. **Grounded en datos del tenant** (nunca inventar cifras).
2. **Explicable** (datos usados, supuestos, confianza).
3. **Seguro** (guardrails, aislamiento, sin consejo profesional peligroso).
4. **Con humano en el loop** para acciones que cambian estado.
5. **Auditable** (todo queda registrado).

## 2. Capacidades por fase

| Capacidad | Fase |
|-----------|------|
| Chat en lenguaje natural sobre datos propios (text-to-insight) | MVP |
| Resumen diario/semanal del campo | MVP |
| Alertas explicadas | MVP |
| RAG sobre documentos cargados (manuales, protocolos, contratos) | MVP |
| Modo "solo recomendar" | MVP |
| IA predictiva (peso, fecha de venta, rinde, stock, riesgos) | Fase 2 |
| Agentes que ejecutan acciones con aprobación | Fase 2 |
| Interfaz por voz | Fase 2 |
| Simulador de escenarios (precio, TC, costo, clima) | Fase 2 |
| Benchmark anónimo entre productores | Fase 3 |
| Computer vision (conteo, condición corporal, NDVI, caravanas) | Fase 3 |

## 3. Arquitectura de IA

```
Usuario → /ai/conversations/{id}/messages
   │
   ▼
[Orquestador de IA en backend NestJS]
   │  1. Autoriza (RBAC/ABAC + acceso IA del rol)
   │  2. Fija tenant context (aislamiento)
   │  3. Clasifica intención: consulta de datos | RAG documental | acción | mixta
   ├──► Text-to-insight: traduce a consultas PARAMETRIZADAS seguras (allow-list) a Aurora
   │        (NO SQL libre generado por el modelo; se usan "tools"/funciones registradas)
   ├──► RAG: Bedrock Knowledge Base (Documents del tenant) → chunks relevantes con citas
   ├──► Predicción: invoca endpoints de modelos (Fase 2, SageMaker/servicios) 
   ▼
[Bedrock Foundation Model] compone respuesta grounded + explicabilidad
   │
   ▼
[Guardrails de Bedrock] valida contenido
   │
   ▼
Respuesta → registra AIConversation/AIRecommendation/AuditLog → usuario
```

### 3.1 Text-to-insight (seguro, sin SQL libre)
- El modelo **no** genera SQL directo. Se le exponen **herramientas/funciones** (tool use) que mapean a queries parametrizadas y validadas (`getStockByCategory`, `getGrossMargin`, `getDueHealthTasks`, etc.), todas scoped por `tenant_id`.
- Esto elimina inyección SQL, fuga entre tenants y respuestas alucinadas sobre datos.

### 3.2 RAG
- Documentos del tenant subidos a S3 → indexados en **Bedrock Knowledge Base** (vector store: **Aurora pgvector** en MVP; OpenSearch Serverless si escala).
- Chunking + embeddings; recuperación con citación de fuente.
- **Aislamiento:** un KB/namespace por tenant (o filtro por `tenant_id` en metadata + verificación en backend).

### 3.3 Agentes (Fase 2)
- **Bedrock Agents** con action groups acotados y allow-list: crear orden de trabajo, agendar vacunación, sugerir compra, generar reporte/presupuesto, crear alerta, preparar email.
- **Modo ejecución con aprobación:** el agente propone → usuario aprueba → backend ejecuta la acción real → auditoría.
- Nunca ejecuta acciones destructivas ni financieras sin aprobación.

## 4. IA predictiva y analítica (Fase 2)

Modelos objetivo (baseline con datos históricos del tenant + features de clima/mercado):
- Predicción de **ganancia diaria de peso** y **fecha óptima de venta**.
- Predicción de **stock futuro** y **consumo de insumos**.
- Predicción de **rinde agrícola**.
- **Riesgos**: climático, sanitario, reproductivo, financiero.
- **Detección de anomalías** (mortandad, consumo, peso, costos, márgenes).
- **Simulador de escenarios**: precio carne/grano, tipo de cambio, costo alimento, rinde, clima.
- **Benchmark anónimo** (Fase 3): agregación estadística con privacidad diferencial / k-anonymity; opt-in explícito.

Enfoque: empezar con reglas + modelos estadísticos simples; escalar a SageMaker cuando haya volumen y valor probado.

## 5. Guardrails y seguridad de IA

- **Guardrails de Bedrock:** bloqueo de contenido dañino; **disclaimers obligatorios** en temas veterinarios, sanitarios, financieros o legales ("Esta sugerencia no reemplaza el criterio de un profesional; validá con tu veterinario/contador").
- **Prompt injection:** separación estricta instrucciones vs. datos; sanitización de documentos RAG; los datos recuperados nunca se tratan como instrucciones; allow-list de tools/acciones.
- **Aislamiento:** todo prompt se construye con contexto scoped al tenant; imposible referenciar datos de otro tenant.
- **Límites:** cuotas de tokens por plan; rate limiting; caché de respuestas frecuentes.
- **Validación humana** para toda acción que cambie estado.

## 6. Explicabilidad

Cada respuesta/recomendación devuelve y persiste:
- `dataUsed`: qué fuentes/consultas se usaron.
- `assumptions`: supuestos (ej. precio spot, fecha, categoría configurada).
- `confidence`: nivel de confianza (0–1) con criterio documentado.
- Citas de documentos en respuestas RAG.
- Feedback del usuario (👍/👎) para mejora continua y evaluación.

## 7. Privacidad y gobierno de datos

- **No se entrena** con datos del cliente sin **consentimiento explícito** (opt-in por tenant).
- Datos enviados a modelos gestionados por Bedrock no se usan para reentrenar los FM (configuración de la plataforma).
- Consentimiento y propósito registrados; posibilidad de revocar.
- **Auditoría** (`AuditLog` con `is_ai=true`) de toda interacción y acción de IA.

## 8. Evaluación de calidad (LLMOps)

- **Golden set** de preguntas por dominio (ganadería, agricultura, inventario, finanzas) con respuestas esperadas.
- Métricas: exactitud factual (grounding), tasa de "no sé" apropiada, latencia, costo por consulta, satisfacción (feedback).
- Evaluaciones automáticas en CI para cambios de prompts/modelos; canary antes de rollout.
- Monitoreo de deriva y de costos por tenant.

## 9. Computer Vision (Fase 3, exploratoria)
- Conteo de animales, estimación de condición corporal, detección de renguera, lectura de caravanas por cámara, detección de malezas/enfermedades, NDVI/vigor satelital.
- Requiere validación de **calidad de datos** y de modelos antes de producción; se ofrece como feature opt-in con clara comunicación de precisión.

## 10. Experiencia (UX de IA)
- Respuestas con acciones sugeridas ("Ver reporte", "Crear tarea", "Explicar más").
- Indicador de modo (Recomendar / Ejecutar con aprobación).
- Voz a texto para consultas y partes diarios (Fase 2).
- Transparencia: siempre visible qué datos se usaron.
