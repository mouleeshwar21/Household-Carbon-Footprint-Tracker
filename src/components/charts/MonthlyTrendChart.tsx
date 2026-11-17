import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CarbonAudit, UnitSystem } from '../../types/carbon';
import { PARIS_TARGET_PER_PERSON_KG, formatMass } from '../../utils/calculations';

interface MonthlyTrendChartProps {
  audits: CarbonAudit[];
  unitSystem: UnitSystem;
  members: number;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  audits,
  unitSystem,
  members,
}) => {
  const data = audits.map((a) => ({
    month: a.label.slice(0, 3) + ' ' + a.month.slice(2, 4),
    totalKg: a.totalKgCo2e,
    perPersonKg: Number((a.totalKgCo2e / Math.max(1, a.members)).toFixed(1)),
  }));

  const parisHouseholdCeiling = PARIS_TARGET_PER_PERSON_KG * Math.max(1, members);

  return (
    <div className="bento-card rounded-2xl p-6 flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
            Multi-Month Emissions Curve
          </p>
          <h3 className="text-lg font-bold tracking-tight">6-Month Footprint Trend</h3>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">
          Paris Limit: {formatMass(parisHouseholdCeiling, unitSystem, 0)}
        </span>
      </div>

      <div className="h-60 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] px-4 text-center">
            Log at least one monthly audit to view your emissions trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="ecoAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
            <XAxis
              dataKey="month"
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
                color: 'var(--text-primary)',
              }}
              formatter={(val: any) => [formatMass(Number(val), unitSystem), 'Household Total']}
            />
            <ReferenceLine
              y={parisHouseholdCeiling}
              stroke="#fcd34d"
              strokeDasharray="4 4"
              label={{
                value: 'Paris 1.5°C',
                position: 'insideTopRight',
                fill: '#d97706',
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="totalKg"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#ecoAreaGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
