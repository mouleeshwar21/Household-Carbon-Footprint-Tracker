import React, { useState } from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Minus, Plus, Target } from 'lucide-react';
import {
  CalculationResult,
  CONVERSIONS,
  UnitSystem,
  formatEmissionMass,
} from '../utils/calculations';
import { GoalPresetType, GoalSettings } from '../services/carbonApi';
import { useCarbon } from '../context/CarbonContext';

interface EmissionGoalSummaryProps {
  currentResult: CalculationResult;
  baselineKg: number;
  adoptedMonthlyKgSaved: number;
  goalSettings: GoalSettings;
  onUpdateGoal: (settings: GoalSettings) => void;
  unitSystem: UnitSystem;
  locale: string;
}

export const EmissionGoalSummary: React.FC<EmissionGoalSummaryProps> = ({
  currentResult,
  baselineKg,
  adoptedMonthlyKgSaved,
  goalSettings,
  onUpdateGoal,
  unitSystem,
  locale,
}) => {
  const { theme } = useCarbon();
  const [pathwayView, setPathwayView] = useState<'trajectory' | 'budget'>('trajectory');

  const mult = unitSystem === 'imperial' ? CONVERSIONS.KG_TO_LBS : 1;
  const unitShort = unitSystem === 'imperial' ? 'lbs' : 'kg';

  const getTargetCapKg = (): number => {
    switch (goalSettings.preset) {
      case 'modest_10':
        return Math.round(baselineKg * 0.9);
      case 'standard_15':
        return Math.round(baselineKg * 0.85);
      case 'paris_25':
        return Math.round(
          Math.min(baselineKg * 0.75, currentResult.parisTargetTotalKg)
        );
      case 'custom':
      default:
        return Math.max(50, goalSettings.customCapKg || Math.round(baselineKg * 0.85));
    }
  };

  const targetCapKg = getTargetCapKg();
  const actualKg = currentResult.totalKgCO2e;
  const netProjectedKg = Math.max(0, actualKg - adoptedMonthlyKgSaved);
  const remainingReductionNeededKg = Math.max(0, netProjectedKg - targetCapKg);

  const rawProgressPct =
    netProjectedKg <= targetCapKg
      ? 100
      : Math.max(12, Math.min(99, Math.round((targetCapKg / netProjectedKg) * 100)));

  const radialData = [
    {
      name: 'Goal Alignment',
      value: rawProgressPct,
      fill: theme.chartPrimary,
    },
  ];

  const trajectoryData = [
    {
      stage: 'Initial Baseline',
      value: Number((baselineKg * mult).toFixed(1)),
      color: theme.chartText,
    },
    {
      stage: 'Current Actual',
      value: Number((actualKg * mult).toFixed(1)),
      color: theme.chartSecondary,
    },
    {
      stage: 'Net After Quick Wins',
      value: Number((netProjectedKg * mult).toFixed(1)),
      color: theme.chartPrimary,
    },
    {
      stage: 'Paris 1.5°C Budget',
      value: Number((currentResult.parisTargetTotalKg * mult).toFixed(1)),
      color: '#10b981',
    },
  ];

  const categoryBudgetData = currentResult.streamList.map((st) => ({
    name: st.label.split(' ')[0],
    actual: Number((st.kgCO2e * mult).toFixed(1)),
    budget: Number((st.fairShareBudgetKg * mult).toFixed(1)),
    color: st.color,
    overBudget: st.kgCO2e > st.fairShareBudgetKg,
  }));

  const handlePresetSelect = (preset: GoalPresetType) => {
    let nextCap = goalSettings.customCapKg;
    if (preset === 'modest_10') nextCap = Math.round(baselineKg * 0.9);
    if (preset === 'standard_15') nextCap = Math.round(baselineKg * 0.85);
    if (preset === 'paris_25')
      nextCap = Math.round(Math.min(baselineKg * 0.75, currentResult.parisTargetTotalKg));
    onUpdateGoal({ preset, customCapKg: nextCap });
  };

  const adjustCustomCap = (deltaKg: number) => {
    const nextCap = Math.max(50, Math.round(targetCapKg + deltaKg));
    onUpdateGoal({ preset: 'custom', customCapKg: nextCap });
  };

  return (
    <section
      aria-labelledby="goal-suite-heading"
      className="v22-card rounded-[24px] p-6"
    >
      {/* Header & Target Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-current/10">
        <div>
          <div className="flex items-center gap-2 text-xs opacity-65 mb-1">
            <span>Decarbonization Target Suite</span>
            <span aria-hidden="true">·</span>
            <span>Monthly Cap Governance</span>
          </div>
          <h2 id="goal-suite-heading" className="text-lg font-bold">
            Monthly Reduction Goal & Pathway Alignment
          </h2>
        </div>

        {/* Target Presets Segmented Control */}
        <div className="flex flex-wrap items-center gap-1.5 v22-subcard p-1 rounded-xl">
          {(
            [
              { id: 'modest_10', label: '-10% Modest' },
              { id: 'standard_15', label: '-15% Standard' },
              { id: 'paris_25', label: '-25% Paris-Aligned' },
              { id: 'custom', label: 'Custom Cap' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePresetSelect(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                goalSettings.preset === item.id
                  ? 'bg-emerald-500 text-[#04130f] shadow-xs'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Radial Progress Left + Composed Pathway Chart Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
        <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-current/10 pb-6 lg:pb-0 lg:pr-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium opacity-75">
              Cap Completion Score
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => adjustCustomCap(-15)}
                aria-label="Decrease monthly carbon cap"
                className="p-1.5 rounded-lg v22-subcard hover:opacity-80 transition-opacity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono tabular-nums text-xs font-bold px-2">
                Cap: {formatEmissionMass(targetCapKg, unitSystem, locale)} {unitShort}
              </span>
              <button
                type="button"
                onClick={() => adjustCustomCap(15)}
                aria-label="Increase monthly carbon cap"
                className="p-1.5 rounded-lg v22-subcard hover:opacity-80 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="68%"
                outerRadius="92%"
                barSize={16}
                data={radialData}
                startAngle={210}
                endAngle={-30}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: theme.chartGrid }}
                  dataKey="value"
                  cornerRadius={8}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="font-mono tabular-nums text-3xl font-bold">
                {rawProgressPct}%
              </span>
              <span className="text-xs opacity-65 mt-0.5">
                {netProjectedKg <= targetCapKg ? 'Target Cap Achieved' : 'Pathway Progress'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-current/10 text-left">
            <div>
              <div className="text-xs opacity-65">Monthly Cap</div>
              <div className="font-mono tabular-nums text-sm font-bold mt-0.5">
                {formatEmissionMass(targetCapKg, unitSystem, locale)} {unitShort}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-65">Net Projected</div>
              <div className="font-mono tabular-nums text-sm font-bold text-emerald-500 mt-0.5">
                {formatEmissionMass(netProjectedKg, unitSystem, locale)} {unitShort}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-65">Remaining Gap</div>
              <div className="font-mono tabular-nums text-sm font-bold mt-0.5">
                {remainingReductionNeededKg > 0
                  ? `${formatEmissionMass(remainingReductionNeededKg, unitSystem, locale)} ${unitShort}`
                  : `0 ${unitShort}`}
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 cols: Dual Pathway View Switcher & ComposedChart */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold">
                {pathwayView === 'trajectory'
                  ? 'Trajectory View: Baseline vs Actual vs Adopted Quick Wins'
                  : 'Category Budget View: Actual vs Fair-Share Carbon Allocation'}
              </span>
            </div>

            <div className="flex items-center gap-1 v22-subcard p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPathwayView('trajectory')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  pathwayView === 'trajectory'
                    ? 'bg-emerald-500 text-[#04130f] shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Trajectory View
              </button>
              <button
                type="button"
                onClick={() => setPathwayView('budget')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  pathwayView === 'budget'
                    ? 'bg-emerald-500 text-[#04130f] shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Category Budget View
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            {pathwayView === 'trajectory' ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trajectoryData}
                  margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.chartGrid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 12, fill: theme.chartText }}
                    axisLine={{ stroke: theme.chartGrid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: theme.chartText }}
                    axisLine={false}
                    tickLine={false}
                    unit={` ${unitShort}`}
                  />
                  <Tooltip
                    formatter={(val) => [`${val ?? 0} ${currentResult.unitLabel}`, 'Emissions']}
                    contentStyle={{
                      backgroundColor: theme.tooltipBg,
                      borderColor: theme.tooltipBorder,
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: theme.isDark ? '#f8fafc' : '#111827',
                    }}
                  />
                  <ReferenceLine
                    y={Number((targetCapKg * mult).toFixed(1))}
                    stroke={theme.chartPrimary}
                    strokeDasharray="4 4"
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={44}>
                    {trajectoryData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={categoryBudgetData}
                  margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.chartGrid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: theme.chartText }}
                    axisLine={{ stroke: theme.chartGrid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: theme.chartText }}
                    axisLine={false}
                    tickLine={false}
                    unit={` ${unitShort}`}
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
                  <Bar
                    dataKey="actual"
                    name={`Actual (${unitShort})`}
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  >
                    {categoryBudgetData.map((entry, index) => (
                      <Cell
                        key={`actual-${index}`}
                        fill={entry.overBudget ? theme.chartAccent : theme.chartPrimary}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="budget"
                    name={`Fair-Share Paris Budget (${unitShort})`}
                    fill={theme.chartText}
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
