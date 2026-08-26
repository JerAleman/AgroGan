'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface StockLine {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  qty: number;
  minStock: number;
  belowMin: boolean;
}

export default function InventarioPage() {
  const [stock, setStock] = useState<StockLine[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<StockLine[]>('/inventory/stock').then(setStock).catch((e) => setError(e.detail));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
        <p className="text-sm text-slate-500">Stock de insumos y alertas de reposición</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Mínimo</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.productId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{s.productName}</td>
                <td className="px-4 py-3 text-slate-500">{s.category}</td>
                <td className="px-4 py-3 text-right">{s.qty.toLocaleString('es-AR')} {s.unit}</td>
                <td className="px-4 py-3 text-right text-slate-400">{s.minStock.toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-center">
                  {s.belowMin ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">🔴 Bajo mínimo</span>
                  ) : (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">🟢 OK</span>
                  )}
                </td>
              </tr>
            ))}
            {stock.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay productos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
