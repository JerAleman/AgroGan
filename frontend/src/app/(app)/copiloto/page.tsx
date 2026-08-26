'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface AiAnswer {
  answer: string;
  explainability: { dataUsed: string[]; assumptions: string[]; confidence: number };
  mode: string;
}

interface ChatEntry {
  role: 'user' | 'assistant';
  text: string;
  meta?: AiAnswer['explainability'];
}

const SUGGESTIONS = [
  '¿Cuánto stock de novillos tengo?',
  '¿Qué insumos debo comprar?',
  '¿Qué campaña tuvo peor margen?',
  '¿Qué tareas sanitarias vencen esta semana?',
  'Dame un resumen del campo',
];

export default function CopilotoPage() {
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(text: string) {
    if (!text.trim()) return;
    setChat((c) => [...c, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post<AiAnswer>('/ai/ask', { text });
      setChat((c) => [...c, { role: 'assistant', text: res.answer, meta: res.explainability }]);
    } catch (e) {
      setChat((c) => [...c, { role: 'assistant', text: 'Ocurrió un error al consultar el copiloto.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-3xl flex-col">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">🤖 Copiloto Campo AI</h1>
        <p className="text-sm text-slate-500">Preguntá en lenguaje natural sobre los datos de tu campo</p>
      </div>

      <div className="my-4 flex-1 space-y-4 overflow-auto rounded-xl border border-slate-200 bg-white p-4">
        {chat.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-brand-400 hover:text-brand-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {chat.map((e, i) => (
          <div key={i} className={e.role === 'user' ? 'text-right' : ''}>
            <div
              className={`inline-block max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                e.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'
              }`}
            >
              {e.text}
            </div>
            {e.meta && (
              <div className="mt-1 text-left text-xs text-slate-400">
                <span className="font-medium">Datos usados:</span> {e.meta.dataUsed.join(', ') || '—'} ·{' '}
                <span className="font-medium">Confianza:</span> {Math.round(e.meta.confidence * 100)}%
              </div>
            )}
          </div>
        ))}
        {loading && <p className="text-sm text-slate-400">El copiloto está pensando…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu pregunta…"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
