'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface StockLine {
  categoryId: string;
  categoryName: string;
  headCount: number;
  avgWeight: number;
}

export default function GanaderiaPage() {
  const [stock, setStock] = useState<StockLine[]>([]);
  const [error, setError] = useState('');

  function load() {
    api.get<StockLine[]>('/livestock/stock').then(setStock).catch((e) => setError(e.detail));
  }
  useEffect(load, []);

  const total = stock.reduce((a, s) => a + s.headCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ganadería</h1>
          <p className="text-sm text-slate-500">Existencias por categoría · Total: {total.toLocaleString('es-AR')} cabezas</p>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stock.map((s) => (
          <div key={s.categoryId} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-3xl">🐄</span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {s.avgWeight} kg prom
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{s.categoryName}</p>
            <p className="text-2xl font-bold text-slate-900">{s.headCount.toLocaleString('es-AR')}</p>
          </div>
        ))}
        {stock.length === 0 && !error && (
          <p className="text-slate-500">No hay hacienda cargada todavía.</p>
        )}
      </div>
    </div>
  );
}
