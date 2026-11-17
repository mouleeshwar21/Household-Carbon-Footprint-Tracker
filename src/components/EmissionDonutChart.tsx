import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CalculationResult } from '../utils/calculations';
import { useCarbon } from '../context/CarbonContext';
import { AnimatedCounter } from './ui/AnimatedCounter';

interface EmissionDonutChartProps {
  result: CalculationResult;
}

export const EmissionDonutChart: React.FC<EmissionDonutChartProps> = ({ result }) => {
  const { theme } = useCarbon();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const data = result.streamList.map((item) => ({
    name: item.label,
    emoji: item.emoji,
    key: item.key,
    value: item.displayValue,
    share: item.sharePercent,
    color: item.color,
  }));

  const activeItem = data[activeIndex] || data[0];

  return (
    <div className="v22-card rounded-[24px] p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 text-xs opacity-65 mb-1">
          <span>Activity Share Breakdown</span>
          <span aria-hidden="true">·</span>
          <span>8 Household Streams</span>
        </div>
        <h3 className="text-base font-extrabold text-[#132a26]">
          8-Stream Emissions Distribution
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-4">
        <div className="sm:col-span-6 h-60 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={2.5}
                dataKey="value"
                onMouseEnter={(_, idx) => setActiveIndex(idx)}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={`slice-${entry.key}`}
                    fill={entry.color}
                    stroke={activeIndex === idx ? '#132a26' : 'transparent'}
                    strokeWidth={activeIndex === idx ? 2.5 : 0}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value ?? 0} ${result.unitLabel}`, 'Monthly Emission']}
                contentStyle={{
                  backgroundColor: theme.tooltipBg,
                  borderColor: theme.tooltipBorder,
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: theme.isDark ? '#f8fafc' : '#111827',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {activeItem && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span
                className="font-mono tabular-nums text-xl font-extrabold"
                style={{ color: activeItem.color }}
              >
                <AnimatedCounter value={activeItem.share} decimals={1} suffix="%" />
              </span>
              <span className="text-[11px] font-bold opacity-75 truncate max-w-[110px]">
                {activeItem.emoji} {activeItem.name}
              </span>
            </div>
          )}
        </div>

        <div className="sm:col-span-6 space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {data.map((item, idx) => (
            <button
              key={item.key}
              type="button"
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => setActiveIndex(idx)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-between ${
                activeIndex === idx
                  ? 'v22-subcard ring-1 ring-emerald-500/50'
                  : 'hover:opacity-85'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-bold truncate">
                  {item.emoji} {item.name}
                </span>
              </div>
              <div className="font-mono tabular-nums text-xs font-bold shrink-0 ml-2">
                {item.value} <span className="opacity-60 font-normal">({item.share}%)</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
