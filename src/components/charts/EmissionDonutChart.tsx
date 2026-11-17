import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AuditComputationResult, UnitSystem } from '../../types/carbon';
import { formatMass } from '../../utils/calculations';
import { AnimatedCounter } from '../AnimatedCounter';

interface EmissionDonutChartProps {
  computation: AuditComputationResult;
  unitSystem: UnitSystem;
}

export const EmissionDonutChart: React.FC<EmissionDonutChartProps> = ({
  computation,
  unitSystem,
}) => {
  const activeStreams = computation.streams.filter((s) => s.kgCo2e > 0.1);
  const chartData = activeStreams.length > 0 ? activeStreams : computation.streams;

  return (
    <div className="bento-card rounded-2xl p-6 flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
            8-Stream Footprint Share
          </p>
          <h3 className="text-lg font-bold tracking-tight">Emission Breakdown</h3>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">
          Peak: {computation.peakStream.emoji} {computation.peakStream.sharePct}%
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-6 relative h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="kgCo2e"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={84}
                paddingAngle={2.5}
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-strong)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
                formatter={(val: any, _name: any, item: any) => [
                  `${formatMass(Number(val), unitSystem)} (${item?.payload?.sharePct ?? 0}%)`,
                  item?.payload?.label ?? 'Stream',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <AnimatedCounter
              value={unitSystem === 'metric' ? computation.totalKgCo2e : computation.totalKgCo2e * 2.20462}
              decimals={0}
              className="text-xl font-bold text-[var(--text-primary)]"
            />
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {unitSystem === 'metric' ? 'kg CO₂e' : 'lbs CO₂e'}
            </span>
          </div>
        </div>

        <div className="sm:col-span-6 space-y-2">
          {computation.streams.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate text-[var(--text-secondary)]">
                  {s.emoji} {s.label}
                </span>
              </div>
              <span className="font-mono tabular-nums font-medium text-[var(--text-primary)] shrink-0">
                {s.sharePct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
