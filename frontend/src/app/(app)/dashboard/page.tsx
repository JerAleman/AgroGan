'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Dashboard {
  totalAreaHa: number;
  livestock: { totalHead: number; byCategory: { categoryName: string; headCount: number; avgWeight: number }[] };
  agriculture: {
    totalGrossMargin: number;
    campaigns: { crop: string; season: string; establishment: string; grossMargin: number; grossMarginPerHa: number }[];
  };
  alerts: { count: number; stock: { message: string; severity: string }[]; dueHealthTasks: number };
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Dashboard>('/reports/dashboard').then(setData).catch((e) => setError(e.detail));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-500">Cargando dashboard…</p>;

  const money = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard ejecutivo</h1>
        <p className="text-sm text-slate-500">Panorama general del campo en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Superficie total" value={`${data.totalAreaHa.toLocaleString('es-AR')} ha`} />
        <Kpi label="Hacienda" value={`${data.livestock.totalHead.toLocaleString('es-AR')} cab`} />
        <Kpi label="Margen bruto agrícola" value={money(data.agriculture.totalGrossMargin)} />
        <Kpi label="Alertas activas" value={String(data.alerts.count)} sub={`${data.alerts.dueHealthTasks} sanitarias por vencer`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-800">Stock por categoría</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2">Categoría</th>
                <th className="pb-2 text-right">Cabezas</th>
                <th className="pb-2 text-right">Peso prom.</th>
              </tr>
            </thead>
            <tbody>
              {data.livestock.byCategory.map((c) => (
                <tr key={c.categoryName} className="border-t border-slate-100">
                  <td className="py-2">{c.categoryName}</td>
                  <td className="py-2 text-right font-medium">{c.headCount.toLocaleString('es-AR')}</td>
                  <td className="py-2 text-right text-slate-500">{c.avgWeight} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-800">Margen por campaña</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2">Cultivo</th>
                <th className="pb-2">Campaña</th>
                <th className="pb-2 text-right">MB/ha</th>
              </tr>
            </thead>
            <tbody>
              {data.agriculture.campaigns.map((c, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-2">{c.crop}</td>
                  <td className="py-2 text-slate-500">{c.season}</td>
                  <td className={`py-2 text-right font-medium ${c.grossMarginPerHa < 0 ? 'text-red-600' : 'text-brand-700'}`}>
                    {money(c.grossMarginPerHa)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.alerts.stock.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-2 font-semibold text-amber-800">⚠ Alertas de inventario</h2>
          <ul className="space-y-1 text-sm text-amber-700">
            {data.alerts.stock.map((a, i) => (
              <li key={i}>• {a.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
