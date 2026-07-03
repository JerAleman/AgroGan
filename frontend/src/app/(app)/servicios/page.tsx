'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Profitability {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  pendingAmount: number;
}

interface Order {
  id: string;
  type: string;
  description: string | null;
  areaHa: number;
  amount: number;
  status: string;
  date: string;
  customer: { name: string };
}

export default function ServiciosPage() {
  const [profitability, setProfitability] = useState<Profitability[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Profitability[]>('/services/profitability').then(setProfitability).catch((e) => setError(e.detail));
    api.get<Order[]>('/services/orders').then(setOrders).catch(() => {});
  }, []);

  const totalRevenue = profitability.reduce((a, p) => a + p.totalRevenue, 0);
  const totalProfit = profitability.reduce((a, p) => a + p.profit, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Servicios a Terceros</h1>
        <p className="text-sm text-slate-500">
          Facturacion: ${totalRevenue.toLocaleString('es-AR')} - Ganancia: ${totalProfit.toLocaleString('es-AR')}
        </p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Rentabilidad por Cliente</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {profitability.map((p) => (
            <div key={p.customerId} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <h3 className="font-semibold text-slate-900">{p.customerName}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-slate-400 text-xs">Ordenes</p><p className="font-medium">{p.totalOrders}</p></div>
                <div><p className="text-slate-400 text-xs">Facturado</p><p className="font-medium">${p.totalRevenue.toLocaleString('es-AR')}</p></div>
                <div><p className="text-slate-400 text-xs">Ganancia</p><p className="font-medium text-green-700">${p.profit.toLocaleString('es-AR')}</p></div>
                <div><p className="text-slate-400 text-xs">Pendiente cobro</p><p className="font-medium text-amber-600">${p.pendingAmount.toLocaleString('es-AR')}</p></div>
              </div>
            </div>
          ))}
          {profitability.length === 0 && !error && (
            <p className="text-slate-500">No hay clientes de servicios registrados.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Ordenes Recientes</h2>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Fecha</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Cliente</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Tipo</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">Ha</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">Monto</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-2 text-slate-600">{new Date(o.date).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-2 text-slate-900">{o.customer.name}</td>
                  <td className="px-4 py-2 text-slate-600 capitalize">{o.type}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{o.areaHa}</td>
                  <td className="px-4 py-2 text-right font-medium">${o.amount.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-4 text-slate-400 text-center">Sin ordenes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700',
    in_progress: 'bg-blue-50 text-blue-700',
    completed: 'bg-green-50 text-green-700',
    invoiced: 'bg-purple-50 text-purple-700',
    paid: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
