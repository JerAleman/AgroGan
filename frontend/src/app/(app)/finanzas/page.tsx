'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PnL {
  revenue: number;
  expenses: number;
  ebitda: number;
  margin: number;
  byCategory: Record<string, { ingresos: number; egresos: number }>;
}

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
}

export default function FinanzasPage() {
  const [pnl, setPnl] = useState<PnL | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<PnL>('/finance/pnl').then(setPnl).catch((e) => setError(e.detail));
    api.get<Account[]>('/finance/accounts').then(setAccounts).catch(() => {});
  }, []);

  const totalBalance = accounts.reduce((a, acc) => a + acc.balance, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Finanzas</h1>
        <p className="text-sm text-slate-500">Flujo de caja, P&L y cuentas</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {pnl && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card icon="📈" label="Ingresos (90d)" value={`$${pnl.revenue.toLocaleString('es-AR')}`} color="text-green-700" />
          <Card icon="📉" label="Egresos (90d)" value={`$${pnl.expenses.toLocaleString('es-AR')}`} color="text-red-700" />
          <Card icon="💰" label="EBITDA" value={`$${pnl.ebitda.toLocaleString('es-AR')}`} color={pnl.ebitda >= 0 ? 'text-green-700' : 'text-red-700'} />
          <Card icon="📊" label="Margen" value={`${pnl.margin}%`} color="text-slate-900" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Cuentas</h2>
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <p className="font-medium text-slate-900">{acc.name}</p>
                  <p className="text-xs text-slate-400">{acc.type} - {acc.currency}</p>
                </div>
                <p className="text-lg font-bold text-slate-900">${acc.balance.toLocaleString('es-AR')}</p>
              </div>
            ))}
            {accounts.length > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-brand-50 p-4">
                <p className="font-medium text-brand-700">Total</p>
                <p className="text-lg font-bold text-brand-700">${totalBalance.toLocaleString('es-AR')}</p>
              </div>
            )}
          </div>
        </div>

        {pnl && Object.keys(pnl.byCategory).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Por Categoria</h2>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">Categoria</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-600">Ingresos</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-600">Egresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(pnl.byCategory).map(([cat, data]) => (
                    <tr key={cat}>
                      <td className="px-4 py-2 text-slate-700 capitalize">{cat.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2 text-right text-green-700">{data.ingresos > 0 ? `$${data.ingresos.toLocaleString('es-AR')}` : '-'}</td>
                      <td className="px-4 py-2 text-right text-red-700">{data.egresos > 0 ? `$${data.egresos.toLocaleString('es-AR')}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
