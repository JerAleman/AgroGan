'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface DairySummary {
  totalCows: number;
  activeCows: number;
  totalLiters30d: number;
  avgLitersPerCowPerDay: number;
  avgSomaticCells: number;
}

interface Settlement {
  id: string;
  periodFrom: string;
  periodTo: string;
  totalLiters: number;
  pricePerLiter: number;
  totalAmount: number;
}

export default function TamboPage() {
  const [summary, setSummary] = useState<DairySummary | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DairySummary>('/dairy/summary').then(setSummary).catch((e) => setError(e.detail));
    api.get<Settlement[]>('/dairy/settlements').then(setSettlements).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tambo</h1>
        <p className="text-sm text-slate-500">Produccion lechera y calidad</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card icon="🐄" label="Vacas en ordene" value={`${summary.activeCows}`} sub={`${summary.totalCows} totales`} />
          <Card icon="🥛" label="Litros (30d)" value={summary.totalLiters30d.toLocaleString('es-AR')} sub="produccion total" />
          <Card icon="📊" label="Lts/vaca/dia" value={`${summary.avgLitersPerCowPerDay}`} sub="promedio" />
          <Card icon="🔬" label="Cel. Somaticas" value={summary.avgSomaticCells.toLocaleString('es-AR')} sub="promedio (cel/ml)" />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Liquidaciones</h2>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Periodo</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">Litros</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">$/Litro</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settlements.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 text-slate-700">{new Date(s.periodFrom).toLocaleDateString('es-AR')} - {new Date(s.periodTo).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{s.totalLiters.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-2 text-right text-slate-600">${s.pricePerLiter}</td>
                  <td className="px-4 py-2 text-right font-semibold text-slate-900">${s.totalAmount.toLocaleString('es-AR')}</td>
                </tr>
              ))}
              {settlements.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-slate-400 text-center">Sin liquidaciones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}
