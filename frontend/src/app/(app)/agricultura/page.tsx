'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Margin {
  campaignId: string;
  crop: string;
  establishment: string;
  season: string;
  revenue: number;
  directCost: number;
  grossMargin: number;
  areaHa: number;
  grossMarginPerHa: number;
}

export default function AgriculturaPage() {
  const [margins, setMargins] = useState<Margin[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Margin[]>('/agriculture/gross-margin').then(setMargins).catch((e) => setError(e.detail));
  }, []);

  const money = (n: number) => `$${n.toLocaleString('es-AR')}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agricultura</h1>
        <p className="text-sm text-slate-500">Margen bruto por campaña y cultivo</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Cultivo</th>
              <th className="px-4 py-3">Campaña</th>
              <th className="px-4 py-3">Establecimiento</th>
              <th className="px-4 py-3 text-right">Área (ha)</th>
              <th className="px-4 py-3 text-right">Ingreso</th>
              <th className="px-4 py-3 text-right">Costo</th>
              <th className="px-4 py-3 text-right">MB total</th>
              <th className="px-4 py-3 text-right">MB/ha</th>
            </tr>
          </thead>
          <tbody>
            {margins.map((m) => (
              <tr key={m.campaignId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{m.crop}</td>
                <td className="px-4 py-3 text-slate-500">{m.season}</td>
                <td className="px-4 py-3 text-slate-500">{m.establishment}</td>
                <td className="px-4 py-3 text-right">{m.areaHa}</td>
                <td className="px-4 py-3 text-right">{money(m.revenue)}</td>
                <td className="px-4 py-3 text-right text-slate-500">{money(m.directCost)}</td>
                <td className={`px-4 py-3 text-right font-medium ${m.grossMargin < 0 ? 'text-red-600' : 'text-brand-700'}`}>
                  {money(m.grossMargin)}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${m.grossMarginPerHa < 0 ? 'text-red-600' : 'text-brand-700'}`}>
                  {money(m.grossMarginPerHa)}
                </td>
              </tr>
            ))}
            {margins.length === 0 && !error && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  No hay campañas cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
