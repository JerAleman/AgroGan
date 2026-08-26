'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Gauge, KpiCard, Card, BarChart, Sparkline } from '@/components/ui';

interface Dashboard {
  totalAreaHa: number;
  livestock: { totalHead: number; byCategory: { categoryName: string; headCount: number; avgWeight: number }[] };
  agriculture: { totalGrossMargin: number; campaigns: { crop: string; season: string; grossMargin: number; grossMarginPerHa: number }[] };
  alerts: { count: number; stock: { message: string; severity: string }[]; dueHealthTasks: number };
}

const money = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const num = (n: number) => n.toLocaleString('es-AR');

const QUICK = [
  { href: '/ganaderia', label: 'Hacienda', sub: 'stock y pesadas', icon: 'cow' },
  { href: '/copiloto', label: 'Copiloto AI', sub: 'consultá tus datos', icon: 'bot' },
  { href: '/inventario', label: 'Inventario', sub: 'insumos y stock', icon: 'box' },
  { href: '/finanzas', label: 'Finanzas', sub: 'resultado y caja', icon: 'coin' },
];

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [insight, setInsight] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Dashboard>('/reports/dashboard').then(setData).catch((e) => setError(e.detail));
    api.post<{ answer: string }>('/ai/ask', { text: 'dame un resumen del campo' }).then((r) => setInsight(r.answer)).catch(() => {});
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-500">Cargando…</p>;

  // Health de sanidad: % de tareas sin vencer (demo simple)
  const healthPct = data.alerts.dueHealthTasks > 0 ? 82 : 98;
  const spark = [3, 5, 4, 6, 5, 7, 9, 8, 11, 14];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Panel ejecutivo</p>
        <h1 className="text-2xl font-bold text-slate-900">Tablero del negocio</h1>
        <p className="text-sm text-slate-500">Resumen productivo y financiero · últimos 30 días</p>
      </div>

      {/* Hero con gauge */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-10">
          <div className="flex flex-col items-center">
            <Gauge value={healthPct} label="Sanidad OK" />
          </div>
          <div className="grid flex-1 grid-cols-2 gap-6 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Hacienda total</p>
              <p className="mt-1 text-2xl font-bold">{num(data.livestock.totalHead)}</p>
              <p className="text-xs text-slate-400">cabezas</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Superficie</p>
              <p className="mt-1 text-2xl font-bold">{num(data.totalAreaHa)}</p>
              <p className="text-xs text-slate-400">hectáreas</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Margen bruto</p>
              <p className="mt-1 text-2xl font-bold text-brand-400">{money(data.agriculture.totalGrossMargin)}</p>
              <p className="text-xs text-slate-400">agrícola acum.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Alertas</p>
              <p className="mt-1 text-2xl font-bold text-amber-400">{data.alerts.count}</p>
              <p className="text-xs text-slate-400">requieren atención</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs con sparklines */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Vacas" value={num(data.livestock.byCategory.find((c) => /vaca/i.test(c.categoryName))?.headCount ?? 0)} sub="cabezas" spark={spark} accent="brand" />
        <KpiCard label="Novillos" value={num(data.livestock.byCategory.find((c) => /novillo/i.test(c.categoryName))?.headCount ?? 0)} sub="cabezas" spark={spark.map((s) => s * 0.8)} accent="blue" />
        <KpiCard label="Terneros" value={num(data.livestock.byCategory.find((c) => /ternero/i.test(c.categoryName))?.headCount ?? 0)} sub="cabezas" spark={spark.map((s) => s * 1.2)} accent="amber" />
        <KpiCard label="Alertas stock" value={num(data.alerts.stock.length)} sub="bajo mínimo" accent="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stock por categoría con barras */}
        <Card title="Stock por categoría" className="lg:col-span-2">
          <BarChart
            data={data.livestock.byCategory.map((c) => c.headCount)}
            labels={data.livestock.byCategory.map((c) => c.categoryName)}
          />
          <div className="mt-4 space-y-2">
            {data.livestock.byCategory.map((c) => (
              <div key={c.categoryName} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{c.categoryName}</span>
                <span className="font-medium text-slate-900">{num(c.headCount)} cab · {c.avgWeight} kg</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Accesos rápidos */}
        <Card title="Accesos rápidos">
          <div className="grid grid-cols-2 gap-3">
            {QUICK.map((q) => (
              <Link key={q.href} href={q.href} className="group rounded-xl border border-slate-200 p-3 transition hover:border-brand-400 hover:bg-brand-50">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">{q.label}</p>
                <p className="text-xs text-slate-400">{q.sub}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Margen por campaña */}
        <Card title="Margen por campaña" className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-2 font-medium">Cultivo</th>
                <th className="pb-2 font-medium">Campaña</th>
                <th className="pb-2 text-right font-medium">MB total</th>
                <th className="pb-2 text-right font-medium">MB/ha</th>
              </tr>
            </thead>
            <tbody>
              {data.agriculture.campaigns.map((c, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-800">{c.crop}</td>
                  <td className="py-2 text-slate-500">{c.season}</td>
                  <td className={`py-2 text-right font-medium ${c.grossMargin < 0 ? 'text-red-600' : 'text-brand-700'}`}>{money(c.grossMargin)}</td>
                  <td className={`py-2 text-right font-bold ${c.grossMarginPerHa < 0 ? 'text-red-600' : 'text-brand-700'}`}>{money(c.grossMarginPerHa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Lectura inteligente (copiloto) */}
        <Card
          title="Lectura inteligente"
          action={<span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">IA</span>}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-brand-400">🤖</span>
            <p className="text-sm leading-relaxed text-slate-600">{insight || 'Analizando los datos de tu campo…'}</p>
          </div>
          <Link href="/copiloto" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
            Abrir Copiloto AI →
          </Link>
        </Card>
      </div>

      {data.alerts.stock.length > 0 && (
        <Card title="⚠ Alertas de inventario">
          <ul className="space-y-1.5 text-sm text-amber-700">
            {data.alerts.stock.map((a, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${a.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                {a.message}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
