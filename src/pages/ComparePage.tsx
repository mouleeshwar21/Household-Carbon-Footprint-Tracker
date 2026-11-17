import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { computeAuditBreakdown, formatMass } from '../utils/calculations';

export const ComparePage: React.FC = () => {
  const { audits, profile } = useEcoTrack();
  const [monthA, setMonthA] = useState(
    audits.length >= 2 ? audits[audits.length - 2].month : audits[0]?.month || '2026-10'
  );
  const [monthB, setMonthB] = useState(
    audits.length >= 1 ? audits[audits.length - 1].month : '2026-11'
  );

  useEffect(() => {
    if (audits.length === 0) return;
    if (!audits.some((a) => a.month === monthA)) {
      setMonthA(audits.length >= 2 ? audits[audits.length - 2].month : audits[0].month);
    }
    if (!audits.some((a) => a.month === monthB)) {
      setMonthB(audits[audits.length - 1].month);
    }
  }, [audits, monthA, monthB]);

  const auditA = audits.find((a) => a.month === monthA) || audits[0];
  const auditB = audits.find((a) => a.month === monthB) || audits[audits.length - 1];

  const calcA = useMemo(
    () =>
      auditA
        ? computeAuditBreakdown(
            auditA,
            auditA.regionId,
            auditA.members,
            auditA.solarOffsetPct,
            profile.unitSystem
          )
        : null,
    [auditA, profile.unitSystem]
  );

  const calcB = useMemo(
    () =>
      auditB
        ? computeAuditBreakdown(
            auditB,
            auditB.regionId,
            auditB.members,
            auditB.solarOffsetPct,
            profile.unitSystem
          )
        : null,
    [auditB, profile.unitSystem]
  );

  if (!auditA || !auditB || !calcA || !calcB) {
    return (
      <div className="bento-card rounded-2xl p-8 text-center text-sm text-[var(--text-muted)]">
        Log at least one monthly audit to compare billing cycles.
      </div>
    );
  }

  const chartData = calcA.streams.map((sA, idx) => {
    const sB = calcB.streams[idx];
    return {
      name: sA.label.split(' ')[0],
      [auditA.label]: sA.kgCo2e,
      [auditB.label]: sB.kgCo2e,
    };
  });

  const totalDelta = calcB.totalKgCo2e - calcA.totalKgCo2e;
  const totalDeltaPct =
    calcA.totalKgCo2e > 0 ? (totalDelta / calcA.totalKgCo2e) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">
            Side-by-Side Stream Variance Analysis
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
            Compare Billing Cycles
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={auditA.month}
            onChange={(e) => setMonthA(e.target.value)}
            className="h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono font-semibold"
          >
            {audits.map((a) => (
              <option key={a.id} value={a.month}>
                Baseline: {a.label}
              </option>
            ))}
          </select>
          <span className="text-xs font-mono text-[var(--text-muted)]">vs.</span>
          <select
            value={auditB.month}
            onChange={(e) => setMonthB(e.target.value)}
            className="h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono font-semibold"
          >
            {audits.map((a) => (
              <option key={a.id} value={a.month}>
                Target: {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Headline Variance Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card rounded-2xl p-5">
          <p className="text-xs text-[var(--text-muted)]">{auditA.label}</p>
          <p className="text-2xl font-extrabold font-mono mt-1">
            {formatMass(calcA.totalKgCo2e, profile.unitSystem)}
          </p>
        </div>
        <div className="bento-card rounded-2xl p-5">
          <p className="text-xs text-[var(--text-muted)]">{auditB.label}</p>
          <p className="text-2xl font-extrabold font-mono mt-1">
            {formatMass(calcB.totalKgCo2e, profile.unitSystem)}
          </p>
        </div>
        <div className="bento-card rounded-2xl p-5">
          <p className="text-xs text-[var(--text-muted)]">Net Variance</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-2xl font-extrabold font-mono ${
                totalDelta <= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {totalDelta > 0 ? '+' : ''}
              {formatMass(totalDelta, profile.unitSystem)} ({totalDeltaPct.toFixed(1)}%)
            </span>
            {totalDelta <= 0 ? (
              <ArrowDownRight className="w-5 h-5 text-emerald-500" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-rose-500" />
            )}
          </div>
        </div>
      </div>

      {/* Grouped Bar Comparison */}
      <div className="bento-card rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Stream-by-Stream Comparison</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-strong)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [formatMass(Number(val), profile.unitSystem), 'CO₂e']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey={auditA.label} fill="#64748b" radius={[6, 6, 0, 0]} />
              <Bar dataKey={auditB.label} fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Variance Table */}
      <div className="bento-card rounded-2xl p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              <th className="py-2.5 pr-3 font-medium">Emission Stream</th>
              <th className="py-2.5 px-3 font-medium text-right">{auditA.label}</th>
              <th className="py-2.5 px-3 font-medium text-right">{auditB.label}</th>
              <th className="py-2.5 pl-3 font-medium text-right">Delta</th>
            </tr>
          </thead>
          <tbody>
            {calcA.streams.map((sA, idx) => {
              const sB = calcB.streams[idx];
              const diff = sB.kgCo2e - sA.kgCo2e;
              return (
                <tr key={sA.key} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <td className="py-3 pr-3 font-medium">
                    {sA.emoji} {sA.label}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {formatMass(sA.kgCo2e, profile.unitSystem)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {formatMass(sB.kgCo2e, profile.unitSystem)}
                  </td>
                  <td
                    className={`py-3 pl-3 text-right font-mono tabular-nums font-semibold ${
                      diff <= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {diff > 0 ? '+' : ''}
                    {formatMass(diff, profile.unitSystem)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
