import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { CONVERSIONS, EMISSION_FACTORS, UnitSystem } from '../utils/calculations';
import { MonthlyAuditRecord } from '../services/carbonApi';
import { useCarbon } from '../context/CarbonContext';

interface MonthlyTrendChartProps {
  records: MonthlyAuditRecord[];
  unitSystem: UnitSystem;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  records,
  unitSystem,
}) => {
  const { theme } = useCarbon();
  const mult = unitSystem === 'imperial' ? CONVERSIONS.KG_TO_LBS : 1;
  const unitShort = unitSystem === 'imperial' ? 'lbs' : 'kg';

  const chartData = records.map((rec) => ({
    month: rec.label.split(' ')[0].slice(0, 3) + ' ' + rec.month.slice(2, 4),
    total: Number((rec.result.totalKgCO2e * mult).toFixed(1)),
    perCapita: Number((rec.result.perCapitaKgCO2e * mult).toFixed(1)),
  }));

  const parisPerCapita = Number(
    (EMISSION_FACTORS.benchmarks.parisMonthlyPerCapitaKg * mult).toFixed(1)
  );

  return (
    <div className="v22-card rounded-[24px] p-6 flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs opacity-65 mb-1">
            <span>Longitudinal Trajectory</span>
            <span aria-hidden="true">·</span>
            <span>Total vs Per-Capita</span>
          </div>
          <h3 className="text-base font-bold">
            Historical Multi-Month Carbon Trend
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs opacity-80">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: theme.chartPrimary }}
            />
            Household Total ({unitShort})
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: theme.chartSecondary }}
            />
            Per-Capita ({unitShort})
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.chartPrimary} stopOpacity={0.28} />
                <stop offset="95%" stopColor={theme.chartPrimary} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorPerCapita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.chartSecondary} stopOpacity={0.24} />
                <stop offset="95%" stopColor={theme.chartSecondary} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.chartGrid}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: theme.chartText }}
              axisLine={{ stroke: theme.chartGrid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: theme.chartText }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.tooltipBg,
                borderColor: theme.tooltipBorder,
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: theme.isDark ? '#f8fafc' : '#111827',
              }}
            />
            <ReferenceLine
              y={parisPerCapita}
              stroke={theme.chartPrimary}
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="total"
              name={`Household Total (${unitShort})`}
              stroke={theme.chartPrimary}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
            <Area
              type="monotone"
              dataKey="perCapita"
              name={`Per-Capita (${unitShort})`}
              stroke={theme.chartSecondary}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorPerCapita)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
