'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearToken, getToken } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/ganaderia', label: 'Ganaderia', icon: '🐄' },
  { href: '/cria', label: 'Cria', icon: '🐂' },
  { href: '/feedlot', label: 'Feedlot', icon: '🏗️' },
  { href: '/tambo', label: 'Tambo', icon: '🥛' },
  { href: '/agricultura', label: 'Agricultura', icon: '🌾' },
  { href: '/inventario', label: 'Inventario', icon: '📦' },
  { href: '/maquinaria', label: 'Maquinaria', icon: '🚜' },
  { href: '/finanzas', label: 'Finanzas', icon: '💰' },
  { href: '/servicios', label: 'Servicios', icon: '🤝' },
  { href: '/copiloto', label: 'Copiloto AI', icon: '🤖' },
];

interface Me {
  fullName: string;
  role: string;
  tenant: { name: string };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api
      .get<Me>('/auth/me')
      .then((data) => setMe(data))
      .catch(() => router.replace('/login'))
      .finally(() => setReady(true));
  }, [router]);

  function logout() {
    clearToken();
    router.replace('/login');
  }

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Cargando…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <span className="text-2xl">🌾</span>
          <span className="font-bold text-slate-900">Agro360</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-800">{me?.tenant.name}</p>
          <p className="text-xs text-slate-500">{me?.fullName} · {me?.role}</p>
          <button onClick={logout} className="mt-2 text-xs font-medium text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
