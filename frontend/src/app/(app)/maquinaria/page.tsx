'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface MachineSummary {
  machineId: string;
  name: string;
  type: string;
  ownership: string;
  hourMeter: number;
  totalHours: number;
  totalHectares: number;
  totalFuel: number;
  fuelPerHa: number;
  maintenanceCost: number;
}

export default function MaquinariaPage() {
  const [machines, setMachines] = useState<MachineSummary[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<MachineSummary[]>('/machinery/summary').then(setMachines).catch((e) => setError(e.detail));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Maquinaria</h1>
        <p className="text-sm text-slate-500">Resumen de equipos, horas, combustible y mantenimiento</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {machines.length === 0 && !error ? (
        <p className="text-slate-500">No hay máquinas cargadas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {machines.map((m) => (
            <div key={m.machineId} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🚜</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  m.ownership === 'own' ? 'bg-brand-50 text-brand-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {m.ownership === 'own' ? 'Propio' : 'Contratado'}
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-slate-800">{m.name}</h3>
              <p className="text-xs text-slate-500">{m.type} · Horómetro: {m.hourMeter}h</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div><span className="font-medium">{m.totalHours}h</span> trabajadas</div>
                <div><span className="font-medium">{m.totalHectares} ha</span></div>
                <div><span className="font-medium">{m.totalFuel}L</span> comb.</div>
                <div><span className="font-medium">{m.fuelPerHa} L/ha</span></div>
              </div>
              {m.maintenanceCost > 0 && (
                <p className="mt-2 text-xs text-amber-600">🔧 Mantenimiento: ${m.maintenanceCost.toLocaleString('es-AR')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
