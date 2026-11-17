import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AuditComputationResult, UnitSystem } from '../../types/carbon';
import { REGIONAL_PRESETS, formatMass } from '../../utils/calculations';
import { AnimatedCounter } from '../AnimatedCounter';

interface EmissionGoalSummaryProps {
  computation: AuditComputationResult;
  monthlyTargetKg: number;
  regionId: keyof typeof REGIONAL_PRESETS;
  members: number;
  unitSystem: UnitSystem;
}

export const EmissionGoalSummary: React.FC<EmissionGoalSummaryProps> = ({
  computation,
  monthlyTargetKg,
  regionId,
  members,
  unitSystem,
}) => {
  const safeTarget = Math.max(100, monthlyTargetKg);
  const ratioPct = Math.min(100, Math.round((computation.totalKgCo2e / safeTarget) * 100));
  const onTrack = computation.totalKgCo2e <= safeTarget;

  const radialData = [
    {
      name: 'Budget Used',
      value: ratioPct,
      fill: onTrack ? '#10b981' : '#f59e0b',
    },
  ];

  const regionalTotal = REGIONAL_PRESETS[regionId].avgPerPersonMonthlyKg * members;
  const barData = [
    { name: 'Current', kg: computation.totalKgCo2e, fill: '#10b981' },
    { name: 'Your Goal', kg: safeTarget, fill: '#3b82f6' },
    { name: 'Paris 1.5°C', kg: computation.parisTargetTotalKg, fill: '#fcd34d' },
    { name: 'Region Avg', kg: regionalTotal, fill: '#64748b' },
  ];

  return (
    <div className="bento-card rounded-2xl p-6 flex flex-col justify-between gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
            Monthly Carbon Budget &amp; Trajectory
          </p>
          <h3 className="text-lg font-bold tracking-tight">Goal vs. Paris 1.5°C Ceiling</h3>
        </div>
        <span
          className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md ${
            onTrack
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
          }`}
        >
          {onTrack ? 'Within Budget' : 'Above Goal'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-5 relative h-48 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="68%"
              outerRadius="96%"
              barSize={14}
              data={radialData}
              startAngle={210}
              endAngle={-30}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: 'rgba(148, 163, 184, 0.2)' }}
                dataKey="value"
                cornerRadius={8}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <AnimatedCounter
              value={ratioPct}
              suffix="%"
              className="text-2xl font-bold text-[var(--text-primary)]"
            />
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
              of {formatMass(safeTarget, unitSystem, 0)}
            </span>
          </div>
        </div>

        <div className="md:col-span-7 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
                cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                contentStyle={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-strong)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
                formatter={(val: any) => [formatMass(Number(val), unitSystem), 'CO₂e']}
              />
              <Bar dataKey="kg" radius={[8, 8, 0, 0]} maxBarSize={38}>
                {barData.map((entry, idx) => (
                  <Cell key={`bar-${idx}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
        <span>
          Paris Target: <strong className="font-mono text-[var(--text-primary)]">{formatMass(computation.parisTargetTotalKg, unitSystem, 0)}</strong> / mo
        </span>
        <span>
          Annual Tree Offset Needed: <strong className="font-mono text-[var(--text-primary)]">{computation.treesNeededPerYear}</strong> mature trees
        </span>
      </div>
    </div>
  );
};
