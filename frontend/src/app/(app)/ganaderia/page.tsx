'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui';

interface StockLine { categoryId: string; categoryName: string; headCount: number; avgWeight: number }

export default function GanaderiaPage() {
  const [stock, setStock] = useState<StockLine[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<StockLine[]>('/livestock/stock').then(setStock).catch((e) => setError(e.detail));
  }, []);

  const total = stock.reduce((a, s) => a + s.headCount, 0);
  const num = (n: number) => n.toLocaleString('es-AR');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Ganadería</p>
        <h1 className="text-2xl font-bold text-slate-900">Hacienda</h1>
        <p className="text-sm text-slate-500">Existencias por categoría · Total: {num(total)} cabezas</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stock.map((s) => (
          <div key={s.categoryId} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl">🐄</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{s.avgWeight} kg</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{s.categoryName}</p>
            <p className="text-2xl font-bold text-slate-900">{num(s.headCount)}</p>
          </div>
        ))}
        {stock.length === 0 && !error && <p className="text-slate-500">No hay hacienda cargada todavía.</p>}
      </div>
    </div>
  );
}
