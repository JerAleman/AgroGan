'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken, ApiError } from '@/lib/api';

interface AuthResponse {
  accessToken: string;
  user: { fullName: string; role: string };
  tenant: { name: string };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@agro360.cloud');
  const [password, setPassword] = useState('Demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      setToken(res.accessToken);
      router.replace('/dashboard');
    } catch (err) {
      setError((err as ApiError).detail || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Panel izquierdo (branding) */}
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-slate-900 to-brand-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-slate-900">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M12 3v18M12 7l3-2M12 7l-3-2M12 12l3-2M12 12l-3-2M12 17l3-2M12 17l-3-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-lg font-bold">Agro360 Cloud</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Gestión agropecuaria<br />inteligente</h2>
          <p className="mt-3 max-w-md text-slate-300">
            Ganadería, agricultura, feedlot, tambo, finanzas e IoT en una sola plataforma. Con un copiloto de IA que entiende tu campo.
          </p>
          <div className="mt-8 flex gap-6 text-sm">
            <div><p className="text-2xl font-bold text-brand-400">11</p><p className="text-slate-400">módulos</p></div>
            <div><p className="text-2xl font-bold text-brand-400">Offline</p><p className="text-slate-400">first</p></div>
            <div><p className="text-2xl font-bold text-brand-400">IA</p><p className="text-slate-400">explicable</p></div>
          </div>
        </div>
        <p className="text-xs text-slate-500">© 2026 Agro360 Cloud · Multi-tenant SaaS</p>
      </div>

      {/* Panel derecho (formulario) */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-2xl">🌾</div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenido</h1>
          <p className="mb-6 text-sm text-slate-500">Ingresá a tu cuenta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-6 rounded-lg bg-white p-3 text-center text-xs text-slate-500 shadow-sm">
            Demo: <b>demo@agro360.cloud</b> / <b>Demo1234</b>
          </p>
        </div>
      </div>
    </main>
  );
}
