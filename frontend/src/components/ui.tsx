'use client';

import React from 'react';

// ─── Gauge circular (donut de porcentaje) ───
export function Gauge({ value, label, size = 150 }: { value: number; label?: string; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-white">{Math.round(pct)}%</span>
        {label && <span className="text-[11px] uppercase tracking-wide text-slate-300">{label}</span>}
      </div>
    </div>
  );
}

// ─── Sparkline (mini gráfico de línea) ───
export function Sparkline({ data, color = '#22c55e', width = 90, height = 32 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const points = data.map((d, i) => `${i * step},${height - ((d - min) / range) * height}`).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polygon points={areaPoints} fill={color} opacity={0.1} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Tarjeta KPI ───
export function KpiCard({
  icon,
  label,
  value,
  sub,
  spark,
  accent = 'brand',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  spark?: number[];
  accent?: 'brand' | 'blue' | 'amber' | 'red';
}) {
  const accents = {
    brand: 'text-brand-600 bg-brand-50',
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accents[accent]}`}>{icon}</span>}
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
        {spark && <Sparkline data={spark} />}
      </div>
    </div>
  );
}

// ─── Card genérica ───
export function Card({ title, action, children, className = '' }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Barras verticales simples ───
export function BarChart({ data, labels, height = 180 }: { data: number[]; labels?: string[]; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t bg-brand-500 transition-all hover:bg-brand-600"
            style={{ height: `${(d / max) * (height - 20)}px`, minHeight: d > 0 ? 3 : 0 }}
            title={String(d)}
          />
          {labels && <span className="text-[9px] text-slate-400">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}
