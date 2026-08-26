'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearToken, getToken } from '@/lib/api';

interface NavItem { href: string; label: string; icon: string; sub?: string }
interface NavGroup { title: string | null; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    title: null,
    items: [{ href: '/dashboard', label: 'Inicio', icon: 'home' }],
  },
  {
    title: 'Ganadería',
    items: [
      { href: '/ganaderia', label: 'Hacienda', icon: 'cow' },
      { href: '/cria', label: 'Cría', icon: 'calf' },
      { href: '/feedlot', label: 'Feedlot', icon: 'silo' },
      { href: '/tambo', label: 'Tambo', icon: 'milk' },
    ],
  },
  {
    title: 'Campo',
    items: [
      { href: '/agricultura', label: 'Agricultura', icon: 'wheat' },
      { href: '/inventario', label: 'Inventario', icon: 'box' },
      { href: '/maquinaria', label: 'Maquinaria', icon: 'tractor' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { href: '/finanzas', label: 'Finanzas', icon: 'coin' },
      { href: '/servicios', label: 'Servicios', icon: 'handshake' },
    ],
  },
  {
    title: 'Inteligencia',
    items: [{ href: '/copiloto', label: 'Copiloto AI', icon: 'bot' }],
  },
];

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const paths: Record<string, string> = {
    home: 'M3 12l9-9 9 9M5 10v10h14V10',
    cow: 'M4 8c0-2 2-3 4-3m8 0c2 0 4 1 4 3M6 9c0 4 2 8 6 8s6-4 6-8M9 12h.01M15 12h.01',
    calf: 'M5 9c0-2 1-4 3-4m8 0c2 0 3 2 3 4M7 10c0 3 2 6 5 6s5-3 5-6',
    silo: 'M6 21V7a6 6 0 0112 0v14M6 11h12M6 15h12',
    milk: 'M8 3h8l-1 4v13a1 1 0 01-1 1h-4a1 1 0 01-1-1V7L8 3zM9 11h6',
    wheat: 'M12 3v18M12 7l3-2M12 7l-3-2M12 12l3-2M12 12l-3-2M12 17l3-2M12 17l-3-2',
    box: 'M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4 9-4M12 11v10',
    tractor: 'M4 17a2 2 0 104 0 2 2 0 00-4 0zM16 17a3 3 0 106 0 3 3 0 00-6 0zM6 17V9h5l2 4M11 9V6h4v3',
    coin: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v12M9 9h4a2 2 0 010 4h-2a2 2 0 000 4h4',
    handshake: 'M12 5l3-2 6 6-3 3-3-3-4 4-3-3 4-4-3-3 6-6 3 2',
    bot: 'M12 3v3M8 6h8a3 3 0 013 3v7a3 3 0 01-3 3H8a3 3 0 01-3-3V9a3 3 0 013-3zM9 12h.01M15 12h.01M9 16h6',
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={paths[name] ?? paths.home} />
    </svg>
  );
}

interface Me { fullName: string; role: string; tenant: { name: string } }

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    api.get<Me>('/auth/me').then(setMe).catch(() => router.replace('/login')).finally(() => setReady(true));
  }, [router]);

  function logout() { clearToken(); router.replace('/login'); }

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-400">Cargando…</div>;
  }

  const initials = (me?.tenant.name ?? 'A').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar oscuro */}
      <aside className="flex w-64 flex-col bg-slate-900 text-slate-300">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-slate-900">
            <Icon name="wheat" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Agro360</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Cloud</p>
          </div>
        </div>

        {/* Tenant card */}
        <div className="mx-3 mb-3 rounded-xl bg-slate-800/70 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/20 text-sm font-bold text-brand-400">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{me?.tenant.name}</p>
              <p className="truncate text-[11px] text-slate-400">{me?.fullName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-auto px-3 pb-4">
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.title && (
                <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active ? 'bg-brand-500 text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px]">
              <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="font-medium text-slate-700">{me?.tenant.name}</span>
            <span>·</span>
            <span className="capitalize">{pathname.replace('/', '') || 'inicio'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Actualizar
            </button>
            <div className="relative">
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-500" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-slate-400">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
