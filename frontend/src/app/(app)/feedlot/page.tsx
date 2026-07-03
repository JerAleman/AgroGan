'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PenSummary {
  penId: string;
  penName: string;
  capacity: number;
  headCount: number;
  totalKgConsumed: number;
  totalFeedCost: number;
  totalWeightGain: number;
  conversionRatio: number;
  costPerKgGain: number;
}

export default function FeedlotPage() {
  const [pens, setPens] = useState<PenSummary[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<PenSummary[]>('/feedlot/summary').then(setPens).catch((e) => setError(e.detail));
  }, []);

  const totalHead = pens.reduce((a, p) => a + p.headCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Feedlot</h1>
        <p className="text-sm text-slate-500">
          {pens.length} corral(es) - {totalHead} cabezas activas
        </p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {pens.map((pen) => (
          <div key={pen.penId} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{pen.penName}</h3>
              <span className="text-xs text-slate-500">{pen.headCount}/{pen.capacity} cap.</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Consumo total" value={`${pen.totalKgConsumed.toLocaleString('es-AR')} kg`} />
              <Stat label="Costo alimento" value={`$${pen.totalFeedCost.toLocaleString('es-AR')}`} />
              <Stat label="Conversion" value={pen.conversionRatio > 0 ? `${pen.conversionRatio}:1` : '-'} />
              <Stat label="Costo/kg ganado" value={pen.costPerKgGain > 0 ? `$${pen.costPerKgGain}` : '-'} />
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${pen.capacity > 0 ? Math.min((pen.headCount / pen.capacity) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        ))}
        {pens.length === 0 && !error && (
          <p className="text-slate-500">No hay corrales de feedlot configurados.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}
