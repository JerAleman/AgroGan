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
 * Copiloto Campo AI v2.
 *
 * AI_MODE=rules (dev/demo): intérprete determinístico de intención con regex
 *   expandido que cubre ~15 tipos de preguntas. Consulta SOLO datos del tenant
 *   a través de "tools" (métodos de servicio aislados por tenantId).
 * AI_MODE=bedrock (prod): los mismos tools se exponen a Amazon Bedrock
 *   (function calling) + Knowledge Bases (RAG). Ver docs/08-ai-strategy.md.
 *
 * Toda respuesta incluye explicabilidad y queda registrada para auditoría.
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

  // ─── Router de intenciones ───────────────────────────────────────────────────

  private async route(text: string): Promise<AiAnswer> {
    const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quita acentos

    // 1. Tareas sanitarias que vencen
    if (this.match(q, [/sanitari.*venc/, /vacun.*venc/, /tratamiento.*venc/, /tareas.*venc/, /que.*atender.*semana/])) {
      return this.answerDueHealthTasks();
    }

    // 2. Última pesada / peso actual
    if (this.match(q, [/ultim.*pesad/, /peso.*actual/, /cuanto.*pesan/, /peso.*promedio/])) {
      return this.answerWeight(q);
    }

    // 3. Ganancia diaria (ADG)
    if (this.match(q, [/ganancia.*diari/, /adg/, /cuanto.*engord/, /kilos.*dia/])) {
      return this.answerAdg();
    }

    // 4. Nacimientos / partos
    if (this.match(q, [/nacimiento/, /partos/, /terneros.*nacieron/, /cuantos.*nacieron/])) {
      return this.answerBirths();
    }

    // 5. Muertes / mortandad
    if (this.match(q, [/muerte/, /mortandad/, /murieron/, /baja/])) {
      return this.answerDeaths();
    }

    // 6. Superficie / campos (antes de stock para no capturar "cuantas hectareas")
    if (this.match(q, [/superficie/, /hectare/, /cuant.*campo/, /establecimiento/])) {
      return this.answerArea();
    }

    // 7. Ventas / compras de hacienda (antes de stock para no capturar "cuanto vendi")
    if (this.match(q, [/cuanto.*vend/, /venta.*hacienda/, /compra.*hacienda/, /cuanto.*compr/])) {
      return this.answerSales();
    }

    // 8. Stock ganadero (con filtro de categoría mencionada)
    if (this.match(q, [/stock/, /cabeza/, /hacienda/, /novillo/, /vaca/, /ternero/, /vaquillon/, /toro/, /existencia/, /cuant[oa]s.*teng/])) {
      return this.answerStock(q);
    }

    // 9. Insumos a comprar / stock bajo
    if (this.match(q, [/insumo/, /comprar/, /reponer/, /stock.*min/, /falta/, /faltante/, /provision/])) {
      return this.answerLowStock();
    }

    // 10. Margen / rentabilidad / mejor-peor campaña o lote
    if (this.match(q, [/margen/, /rentab/, /rinde/, /rendimiento/, /peor.*camp/, /mejor.*camp/, /lote.*rentab/])) {
      return this.answerMargin(q);
    }

    // 11. Costos agrícolas
    if (this.match(q, [/costo.*hectar/, /costo.*ha/, /gast.*agri/, /cuanto.*cost.*sembrar/])) {
      return this.answerAgriCosts();
    }

    // 12. Alertas activas
    if (this.match(q, [/alerta/, /atencion/, /urgente/, /critic/])) {
      return this.answerAlerts();
    }

    // 13. Resumen del campo
    if (this.match(q, [/resumen/, /como.*va/, /estado/, /panorama/, /situacion/])) {
      return this.weeklySummary();
    }

    // 14. Movimientos de inventario
    if (this.match(q, [/movimiento.*inventar/, /que.*consum/, /cuanto.*use/])) {
      return this.answerInventoryMovements();
    }

    // 15. Ayuda
    if (this.match(q, [/ayuda/, /que.*pod.*pregunt/, /que.*sab/])) {
      return this.answerHelp();
    }

    // Fallback
    return this.answerHelp();
  }

  // ─── Respuestas por intención ────────────────────────────────────────────────

  private async answerDueHealthTasks(): Promise<AiAnswer> {
    const tasks = await this.livestock.dueHealthTasks(7);
    return {
      answer: tasks.length
        ? `Tenés ${tasks.length} tarea(s) sanitaria(s) que vencen en los próximos 7 días.`
        : 'No hay tareas sanitarias que venzan en los próximos 7 días.',
      explainability: { dataUsed: ['livestock.dueHealthTasks(7)'], assumptions: ['Ventana de 7 días'], confidence: 0.9 },
      mode: 'recommend',
      suggestedActions: tasks.length ? [{ label: 'Ver tareas', action: 'GET /v1/livestock/due-health-tasks' }] : [],
    };
  }

  private async answerWeight(q: string): Promise<AiAnswer> {
    const stock = await this.livestock.stockByCategory();
    const mentioned = stock.find((s) => q.includes(s.categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
    if (mentioned) {
      return {
        answer: `Los ${mentioned.categoryName} tienen un peso promedio de ${mentioned.avgWeight} kg (${mentioned.headCount} cabezas).`,
        explainability: { dataUsed: [`livestock.stockByCategory → ${mentioned.categoryName}`], assumptions: ['Peso promedio del último registro'], confidence: 0.88 },
        mode: 'recommend',
      };
    }
    const detail = stock.map((s) => `${s.categoryName}: ${s.avgWeight} kg`).join(', ');
    return {
      answer: `Pesos promedio actuales → ${detail || 'sin datos'}.`,
      explainability: { dataUsed: ['livestock.stockByCategory'], assumptions: ['Peso promedio del último registro por lote'], confidence: 0.85 },
      mode: 'recommend',
    };
  }

  private async answerAdg(): Promise<AiAnswer> {
    const weighings = await this.prisma.weighingEvent.findMany({
      where: { tenantId: this.tid },
      orderBy: { date: 'desc' },
      take: 20,
    });
    const withAdg = weighings.filter((w) => w.adg > 0);
    if (!withAdg.length) {
      return {
        answer: 'No hay suficientes pesadas registradas para calcular la ganancia diaria (necesitás al menos 2 por tropa).',
        explainability: { dataUsed: ['weighingEvent'], assumptions: [], confidence: 0.7 },
        mode: 'recommend',
      };
    }
    const avg = withAdg.reduce((a, w) => a + w.adg, 0) / withAdg.length;
    return {
      answer: `La ganancia diaria promedio de las últimas pesadas es ${avg.toFixed(3)} kg/día (basado en ${withAdg.length} registros).`,
      explainability: { dataUsed: ['weighingEvent.adg (últimos 20)'], assumptions: ['Promedio de ADG con pesadas previas'], confidence: 0.85 },
      mode: 'recommend',
    };
  }

  private async answerBirths(): Promise<AiAnswer> {
    const movements = await this.prisma.livestockMovement.findMany({
      where: { tenantId: this.tid, type: 'birth' },
      orderBy: { date: 'desc' },
      take: 10,
    });
    const total = movements.reduce((a, m) => a + m.headCount, 0);
    return {
      answer: total > 0
        ? `Registraste ${total} nacimiento(s) en los últimos movimientos.`
        : 'No hay nacimientos registrados.',
      explainability: { dataUsed: ['livestockMovement(type=birth)'], assumptions: ['Últimos 10 movimientos de nacimiento'], confidence: 0.9 },
      mode: 'recommend',
    };
  }

  private async answerDeaths(): Promise<AiAnswer> {
    const movements = await this.prisma.livestockMovement.findMany({
      where: { tenantId: this.tid, type: 'death' },
      orderBy: { date: 'desc' },
      take: 10,
    });
    const total = movements.reduce((a, m) => a + m.headCount, 0);
    return {
      answer: total > 0
        ? `Se registraron ${total} muerte(s) en los últimos movimientos.`
        : 'No hay muertes registradas.',
      explainability: { dataUsed: ['livestockMovement(type=death)'], assumptions: ['Últimos 10 movimientos de muerte'], confidence: 0.9 },
      mode: 'recommend',
    };
  }

  private async answerStock(q: string): Promise<AiAnswer> {
    const stock = await this.livestock.stockByCategory();
    const mentioned = stock.find((s) => q.includes(s.categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
    if (mentioned) {
      return {
        answer: `Tenés ${mentioned.headCount} ${mentioned.categoryName} (peso promedio ${mentioned.avgWeight} kg).`,
        explainability: { dataUsed: [`livestock.stockByCategory → ${mentioned.categoryName}`], assumptions: [`Categoría "${mentioned.categoryName}" según tu configuración`], confidence: 0.92 },
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

  private async answerLowStock(): Promise<AiAnswer> {
    const alerts = await this.inventory.getAlerts();
    return {
      answer: alerts.length
        ? `Hay ${alerts.length} producto(s) bajo el mínimo: ${alerts.map((a) => a.message).join(' | ')}`
        : 'No hay productos por debajo del stock mínimo.',
      explainability: { dataUsed: ['inventory.getAlerts'], assumptions: ['Umbral = stock mínimo configurado'], confidence: 0.9 },
      mode: 'recommend',
      suggestedActions: alerts.length ? [{ label: 'Generar orden de compra', action: 'CREATE purchase (requiere aprobación)' }] : [],
    };
  }

  private async answerMargin(q: string): Promise<AiAnswer> {
    const margins = await this.agriculture.grossMargin();
    if (!margins.length) {
      return { answer: 'No hay campañas con datos de margen.', explainability: { dataUsed: ['agriculture.grossMargin'], assumptions: [], confidence: 0.8 }, mode: 'recommend' };
    }
    const worst = [...margins].sort((a, b) => a.grossMarginPerHa - b.grossMarginPerHa)[0];
    const best = [...margins].sort((a, b) => b.grossMarginPerHa - a.grossMarginPerHa)[0];
    const pickWorst = /peor|bajo|menor|negativ/.test(q);
    const target = pickWorst ? worst : best;
    return {
      answer: `${pickWorst ? 'Peor' : 'Mejor'} margen: ${target.crop} (${target.season}) en ${target.establishment} → $${target.grossMarginPerHa}/ha (margen bruto total $${target.grossMargin}).`,
      explainability: { dataUsed: ['agriculture.grossMargin (revenue − costos directos)'], assumptions: ['Margen bruto = ingresos − costos directos'], confidence: 0.85 },
      mode: 'recommend',
      suggestedActions: [{ label: 'Ver campañas', action: 'GET /v1/agriculture/gross-margin' }],
    };
  }

  private async answerAgriCosts(): Promise<AiAnswer> {
    const margins = await this.agriculture.grossMargin();
    if (!margins.length) {
      return { answer: 'No hay labores cargadas para calcular costos.', explainability: { dataUsed: [], assumptions: [], confidence: 0.7 }, mode: 'recommend' };
    }
    const detail = margins.map((m) => `${m.crop} (${m.season}): $${m.areaHa > 0 ? (m.directCost / m.areaHa).toFixed(0) : '?'}/ha`).join(', ');
    return {
      answer: `Costos directos por hectárea → ${detail}.`,
      explainability: { dataUsed: ['agriculture.grossMargin'], assumptions: ['Costo/ha = costos directos / área'], confidence: 0.85 },
      mode: 'recommend',
    };
  }

  private async answerAlerts(): Promise<AiAnswer> {
    const [stockAlerts, dueTasks] = await Promise.all([
      this.inventory.getAlerts(),
      this.livestock.dueHealthTasks(7),
    ]);
    const total = stockAlerts.length + dueTasks.length;
    const parts: string[] = [];
    if (stockAlerts.length) parts.push(`${stockAlerts.length} de inventario bajo mínimo`);
    if (dueTasks.length) parts.push(`${dueTasks.length} sanitaria(s) por vencer`);
    return {
      answer: total > 0
        ? `Tenés ${total} alerta(s) activas: ${parts.join(', ')}.`
        : 'No hay alertas activas.',
      explainability: { dataUsed: ['inventory.getAlerts', 'livestock.dueHealthTasks'], assumptions: [], confidence: 0.9 },
      mode: 'recommend',
    };
  }

  private async answerArea(): Promise<AiAnswer> {
    const ests = await this.prisma.establishment.findMany({ where: { tenantId: this.tid } });
    const total = ests.reduce((a, e) => a + e.totalAreaHa, 0);
    const detail = ests.map((e) => `${e.name}: ${e.totalAreaHa} ha`).join(', ');
    return {
      answer: `Superficie total: ${total} ha. ${detail ? `Establecimientos → ${detail}.` : ''}`,
      explainability: { dataUsed: ['establishment.totalAreaHa'], assumptions: [], confidence: 0.95 },
      mode: 'recommend',
    };
  }

  private async answerSales(): Promise<AiAnswer> {
    const sales = await this.prisma.livestockMovement.findMany({
      where: { tenantId: this.tid, type: 'sale' },
      orderBy: { date: 'desc' },
      take: 10,
    });
    const totalHead = sales.reduce((a, s) => a + s.headCount, 0);
    const totalAmount = sales.reduce((a, s) => a + s.amount, 0);
    return {
      answer: totalHead > 0
        ? `Últimas ventas: ${totalHead} cabezas por $${totalAmount.toLocaleString('es-AR')}.`
        : 'No hay ventas registradas.',
      explainability: { dataUsed: ['livestockMovement(type=sale, últimos 10)'], assumptions: [], confidence: 0.9 },
      mode: 'recommend',
    };
  }

  private async answerInventoryMovements(): Promise<AiAnswer> {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { tenantId: this.tid, type: 'out' },
      orderBy: { date: 'desc' },
      take: 10,
    });
    if (!movements.length) {
      return { answer: 'No hay consumos de inventario registrados.', explainability: { dataUsed: [], assumptions: [], confidence: 0.8 }, mode: 'recommend' };
    }
    return {
      answer: `Se registraron ${movements.length} consumo(s) recientes de inventario.`,
      explainability: { dataUsed: ['inventoryMovement(type=out, últimos 10)'], assumptions: [], confidence: 0.85 },
      mode: 'recommend',
    };
  }

  private answerHelp(): AiAnswer {
    return {
      answer: 'Puedo responder sobre: stock ganadero, peso/ganancia diaria, nacimientos, muertes, tareas sanitarias, insumos a reponer, márgenes por campaña, costos agrícolas, alertas, superficie, ventas, consumos de inventario y un resumen general del campo. Probá: "¿cuánto stock de novillos tengo?" o "¿qué tareas vencen esta semana?"',
      explainability: { dataUsed: [], assumptions: [], confidence: 1 },
      mode: 'recommend',
    };
  }

  async weeklySummary(): Promise<AiAnswer> {
    const dash = await this.reports.dashboard();
    const topCat = [...dash.livestock.byCategory].sort((a, b) => b.headCount - a.headCount)[0];
    const parts = [
      `Superficie total: ${dash.totalAreaHa} ha.`,
      `Hacienda: ${dash.livestock.totalHead} cabezas${topCat ? ` (mayor: ${topCat.categoryName}, ${topCat.headCount})` : ''}.`,
      `Margen bruto agrícola: $${dash.agriculture.totalGrossMargin.toLocaleString('es-AR')}.`,
      `Alertas activas: ${dash.alerts.count} (${dash.alerts.stock.length} inventario, ${dash.alerts.dueHealthTasks} sanitarias).`,
    ];
    return {
      answer: `Resumen del campo — ${parts.join(' ')}`,
      explainability: { dataUsed: ['reports.dashboard'], assumptions: ['Datos al día de hoy'], confidence: 0.88 },
      mode: 'recommend',
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private match(q: string, patterns: RegExp[]): boolean {
    return patterns.some((p) => p.test(q));
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
