import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getUserId } from '../../common/tenant/tenant-context';
import { LivestockService } from '../livestock/livestock.service';
import { AgricultureService } from '../agriculture/agriculture.service';
import { InventoryService } from '../inventory/inventory.service';
import { ReportsService } from '../reports/reports.service';

export interface AiAnswer {
  answer: string;
  explainability: { dataUsed: string[]; assumptions: string[]; confidence: number };
  mode: 'recommend';
  suggestedActions?: { label: string; action: string }[];
}

/**
 * Copiloto Campo AI.
 *
 * AI_MODE=rules (dev/demo): intérprete determinístico de intención que responde
 *   consultando SOLO datos del tenant a través de "tools" (métodos de servicio
 *   ya aislados por tenantId). No genera SQL ni llama a servicios externos.
 * AI_MODE=bedrock (prod): el mismo conjunto de tools se expone a Amazon Bedrock
 *   (function calling) + Knowledge Bases (RAG). Ver docs/08-ai-strategy.md.
 *
 * Toda respuesta incluye explicabilidad (datos usados, supuestos, confianza) y
 * queda registrada (AiConversation/AiMessage + AuditLog) para auditoría.
 */
@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly livestock: LivestockService,
    private readonly agriculture: AgricultureService,
    private readonly inventory: InventoryService,
    private readonly reports: ReportsService,
  ) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  async ask(text: string): Promise<AiAnswer> {
    const answer = await this.route(text);
    await this.persist(text, answer);
    return answer;
  }

  private async route(text: string): Promise<AiAnswer> {
    const q = text.toLowerCase();

    // Intención: tareas sanitarias que vencen.
    if (/(sanitari|vacun|vencen|vence|tacto|tratamiento)/.test(q) && /(vencen|vence|semana|pr[oó]xim|atrasad)/.test(q)) {
      const tasks = await this.livestock.dueHealthTasks(7);
      return {
        answer: tasks.length
          ? `Tenés ${tasks.length} tarea(s) sanitaria(s) que vencen en los próximos 7 días.`
          : 'No hay tareas sanitarias que venzan en los próximos 7 días.',
        explainability: {
          dataUsed: ['livestock.dueHealthTasks(7)'],
          assumptions: ['Ventana de 7 días desde hoy'],
          confidence: 0.9,
        },
        mode: 'recommend',
        suggestedActions: tasks.length ? [{ label: 'Ver tareas', action: 'GET /v1/livestock/due-health-tasks' }] : [],
      };
    }

    // Intención: stock ganadero (opcionalmente por categoría mencionada).
    if (/(stock|cabezas|cuant[oa]s|hacienda|novillo|vaca|ternero|vaquillon|toro)/.test(q)) {
      const stock = await this.livestock.stockByCategory();
      const mentioned = stock.find((s) => q.includes(s.categoryName.toLowerCase()));
      if (mentioned) {
        return {
          answer: `Tenés ${mentioned.headCount} ${mentioned.categoryName} (peso promedio ${mentioned.avgWeight} kg).`,
          explainability: {
            dataUsed: [`livestock.stockByCategory → ${mentioned.categoryName}`],
            assumptions: [`Categoría "${mentioned.categoryName}" según tu configuración`],
            confidence: 0.92,
          },
          mode: 'recommend',
        };
      }
      const total = stock.reduce((a, s) => a + s.headCount, 0);
      const detail = stock.map((s) => `${s.categoryName}: ${s.headCount}`).join(', ');
      return {
        answer: `Stock total: ${total} cabezas. Detalle → ${detail || 'sin datos'}.`,
        explainability: { dataUsed: ['livestock.stockByCategory'], assumptions: [], confidence: 0.9 },
        mode: 'recommend',
      };
    }

    // Intención: insumos a comprar / stock bajo.
    if (/(insumo|comprar|reponer|stock m[ií]nimo|falta|faltante)/.test(q)) {
      const alerts = await this.inventory.getAlerts();
      return {
        answer: alerts.length
          ? `Hay ${alerts.length} producto(s) bajo el mínimo que conviene reponer: ${alerts.map((a) => a.message).join(' | ')}`
          : 'No hay productos por debajo del stock mínimo.',
        explainability: { dataUsed: ['inventory.getAlerts'], assumptions: ['Umbral = stock mínimo configurado'], confidence: 0.9 },
        mode: 'recommend',
        suggestedActions: alerts.length ? [{ label: 'Generar orden de compra', action: 'CREATE purchase (requiere aprobación)' }] : [],
      };
    }

    // Intención: margen / rentabilidad / mejor-peor campaña o lote.
    if (/(margen|rentab|rinde|rendimiento|peor|mejor|campa[ñn]a|lote)/.test(q)) {
      const margins = await this.agriculture.grossMargin();
      if (!margins.length) {
        return {
          answer: 'Todavía no hay campañas con datos de margen cargados.',
          explainability: { dataUsed: ['agriculture.grossMargin'], assumptions: [], confidence: 0.8 },
          mode: 'recommend',
        };
      }
      const worst = [...margins].sort((a, b) => a.grossMarginPerHa - b.grossMarginPerHa)[0];
      const best = [...margins].sort((a, b) => b.grossMarginPerHa - a.grossMarginPerHa)[0];
      const pickWorst = /peor|bajo|menor/.test(q);
      const target = pickWorst ? worst : best;
      return {
        answer: `${pickWorst ? 'Peor' : 'Mejor'} margen: campaña ${target.crop} (${target.season}) en ${target.establishment} con ${target.grossMarginPerHa} por ha (margen bruto total ${target.grossMargin}).`,
        explainability: {
          dataUsed: ['agriculture.grossMargin (revenue − costos directos)'],
          assumptions: ['Margen bruto = ingresos − costos directos de labores cargadas'],
          confidence: 0.85,
        },
        mode: 'recommend',
        suggestedActions: [{ label: 'Ver detalle de campañas', action: 'GET /v1/agriculture/gross-margin' }],
      };
    }

    // Intención: resumen del campo.
    if (/(resumen|c[oó]mo va|estado|panorama|situaci[oó]n)/.test(q)) {
      return this.weeklySummary();
    }

    // Fallback.
    return {
      answer:
        'Puedo ayudarte con: stock ganadero por categoría, tareas sanitarias que vencen, insumos a reponer, márgenes por campaña/lote y un resumen del campo. Probá preguntando, por ejemplo: "¿cuánto stock de novillos tengo?"',
      explainability: { dataUsed: [], assumptions: [], confidence: 0.4 },
      mode: 'recommend',
    };
  }

  async weeklySummary(): Promise<AiAnswer> {
    const dash = await this.reports.dashboard();
    const topCat = [...dash.livestock.byCategory].sort((a, b) => b.headCount - a.headCount)[0];
    const parts = [
      `Superficie total: ${dash.totalAreaHa} ha.`,
      `Hacienda: ${dash.livestock.totalHead} cabezas${topCat ? ` (mayor categoría: ${topCat.categoryName}, ${topCat.headCount})` : ''}.`,
      `Margen bruto agrícola acumulado: ${dash.agriculture.totalGrossMargin}.`,
      `Alertas activas: ${dash.alerts.count} (${dash.alerts.stock.length} de stock, ${dash.alerts.dueHealthTasks} sanitarias por vencer).`,
    ];
    return {
      answer: `Resumen del campo — ${parts.join(' ')}`,
      explainability: {
        dataUsed: ['reports.dashboard', 'livestock.stockByCategory', 'agriculture.grossMargin', 'inventory.getAlerts'],
        assumptions: ['Datos al día de hoy'],
        confidence: 0.88,
      },
      mode: 'recommend',
    };
  }

  private async persist(question: string, answer: AiAnswer) {
    const userId = getUserId() ?? 'unknown';
    const conversation = await this.prisma.aiConversation.create({
      data: { tenantId: this.tid, userId },
    });
    await this.prisma.aiMessage.createMany({
      data: [
        { tenantId: this.tid, conversationId: conversation.id, role: 'user', content: question },
        {
          tenantId: this.tid,
          conversationId: conversation.id,
          role: 'assistant',
          content: answer.answer,
          dataUsed: JSON.stringify(answer.explainability.dataUsed),
          confidence: answer.explainability.confidence,
        },
      ],
    });
    await this.prisma.auditLog.create({
      data: { tenantId: this.tid, userId, action: 'ai.ask', entityType: 'AiConversation', entityId: conversation.id, isAi: true },
    });
  }
}
