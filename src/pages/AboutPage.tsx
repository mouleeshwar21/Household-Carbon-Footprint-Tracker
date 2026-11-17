import React from 'react';
import { REGIONAL_PRESETS, STREAM_META } from '../utils/calculations';

const FACTOR_ROWS = [
  { stream: STREAM_META.electricity, factor: '0.820 kg CO₂e / kWh (India CEA default; regional 0.056–0.820)', source: 'CEA v19 / IEA / eGRID / EEA' },
  { stream: STREAM_META.lpg, factor: '2.980 kg CO₂e / kg LPG (~42.3 kg per 14.2 kg cylinder)', source: 'IPCC 2006 / DEFRA' },
  { stream: STREAM_META.petrol, factor: '2.310 kg CO₂e / liter', source: 'UK DEFRA / EPA' },
  { stream: STREAM_META.diesel, factor: '2.680 kg CO₂e / liter', source: 'UK DEFRA / EPA' },
  { stream: STREAM_META.airTravel, factor: '0.115 kg CO₂e / passenger-km (RF-adjusted)', source: 'DEFRA Aviation' },
  { stream: STREAM_META.png, factor: '2.020 kg CO₂e / m³ piped natural gas', source: 'IPCC Stationary Combustion' },
  { stream: STREAM_META.water, factor: '0.344 kg CO₂e / m³ municipal supply & treatment', source: 'WaterUK / DEFRA' },
  { stream: STREAM_META.waste, factor: '0.520 kg CO₂e / kg landfill minus 0.400 kg / kg compost credit', source: 'IPCC Waste / EPA WARM' },
];

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)]">
          Scientific Transparency &amp; Emission Factors
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
          IPCC / IEA / DEFRA Methodology
        </h1>
      </div>

      <section className="bento-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold">1. Primary Activity Emission Factors</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                <th className="py-2.5 pr-3 font-medium">Stream</th>
                <th className="py-2.5 px-3 font-medium">Conversion Factor</th>
                <th className="py-2.5 pl-3 font-medium">Reference Authority</th>
              </tr>
            </thead>
            <tbody>
              {FACTOR_ROWS.map((row) => (
                <tr
                  key={row.stream.label}
                  className="border-b border-[var(--border-subtle)] last:border-b-0"
                >
                  <td className="py-3 pr-3 font-semibold whitespace-nowrap">
                    {row.stream.emoji} {row.stream.label}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs">{row.factor}</td>
                  <td className="py-3 pl-3 text-xs text-[var(--text-muted)]">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bento-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold">2. 9 Regional Electricity Grid Presets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(REGIONAL_PRESETS).map((reg) => (
            <div
              key={reg.id}
              className="p-4 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)]"
            >
              <p className="text-sm font-bold">{reg.name}</p>
              <p className="font-mono text-lg font-extrabold mt-1">
                {reg.gridKgPerKwh} <span className="text-xs font-normal">kg CO₂e/kWh</span>
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Avg: {reg.avgPerPersonMonthlyKg} kg/person/mo · {reg.sourceLabel}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bento-card rounded-2xl p-6 space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          3. Paris 1.5°C Benchmark &amp; Tree Sequestration
        </h2>
        <p>
          EcoTrack benchmarks per-resident monthly emissions against the{' '}
          <strong className="font-mono text-[var(--text-primary)]">167 kg CO₂e / person / month</strong>{' '}
          (2.0 tonnes CO₂e/year) sustainable household lifestyle pathway aligned with 1.5°C climate targets.
        </p>
        <p>
          Tree offset equivalents use a conservative mature broadleaf sequestration rate of{' '}
          <strong className="font-mono text-[var(--text-primary)]">22 kg CO₂ / tree / year</strong>.
          Rooftop solar net-metering reduces gross grid electricity demand linearly by your configured offset percentage.
        </p>
      </section>
    </div>
  );
};
