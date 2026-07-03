'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Indices {
  totalServidas: number;
  totalPrenadas: number;
  totalVacias: number;
  totalParidas: number;
  totalDestetadas: number;
  pregnancyRate: number;
  calvingRate: number;
  weaningRate: number;
}

interface Sire {
  id: string;
  name: string;
  breed: string | null;
  sireType: string;
  status: string;
}

export default function CriaPage() {
  const [indices, setIndices] = useState<Indices | null>(null);
  const [sires, setSires] = useState<Sire[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Indices>('/breeding/indices').then(setIndices).catch((e) => setError(e.detail));
    api.get<Sire[]>('/breeding/sires').then(setSires).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cria / Reproduccion</h1>
        <p className="text-sm text-slate-500">Indices reproductivos y gestion de toros</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {indices && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card icon="🐂" label="Tasa Prenez" value={`${indices.pregnancyRate}%`} sub={`${indices.totalPrenadas} / ${indices.totalServidas} servidas`} />
          <Card icon="🐣" label="Tasa Paricion" value={`${indices.calvingRate}%`} sub={`${indices.totalParidas} paridas`} />
          <Card icon="🍼" label="Tasa Destete" value={`${indices.weaningRate}%`} sub={`${indices.totalDestetadas} destetadas`} />
          <Card icon="⚠️" label="Vacas Vacias" value={`${indices.totalVacias}`} sub="detectadas en tacto" />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Toros / Padres</h2>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Nombre</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Raza</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Tipo</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sires.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-2 text-slate-600">{s.breed ?? '-'}</td>
                  <td className="px-4 py-2 text-slate-600">{s.sireType}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {sires.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-slate-400 text-center">Sin toros registrados</td></tr>
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
