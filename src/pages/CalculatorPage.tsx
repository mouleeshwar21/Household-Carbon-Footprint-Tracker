import React, { useEffect, useMemo, useState } from 'react';
import { Check, Save, Sparkles } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import {
  ActivityInputs,
  CurrencyCode,
  RegionId,
  StreamKey,
} from '../types/carbon';
import {
  CURRENCY_CONFIG,
  PARIS_TARGET_PER_PERSON_KG,
  REGIONAL_PRESETS,
  STREAM_META,
  computeAuditBreakdown,
  formatMass,
  fromDisplayAmount,
  toDisplayAmount,
} from '../utils/calculations';
import { AnimatedCounter } from '../components/AnimatedCounter';

type FilterTab = 'all' | 'energy' | 'mobility' | 'waterWaste';

interface StreamInputConfig {
  field: keyof ActivityInputs;
  stream: StreamKey;
  kind: 'kwh' | 'mass' | 'liquidFuel' | 'distance' | 'gasVol' | 'waterVol';
  maxMetric: number;
  stepMetric: number;
  group: FilterTab;
}

const STREAM_INPUTS: StreamInputConfig[] = [
  { field: 'electricityKwh', stream: 'electricity', kind: 'kwh', maxMetric: 1500, stepMetric: 5, group: 'energy' },
  { field: 'lpgKg', stream: 'lpg', kind: 'mass', maxMetric: 60, stepMetric: 0.5, group: 'energy' },
  { field: 'pngM3', stream: 'png', kind: 'gasVol', maxMetric: 120, stepMetric: 1, group: 'energy' },
  { field: 'petrolL', stream: 'petrol', kind: 'liquidFuel', maxMetric: 250, stepMetric: 1, group: 'mobility' },
  { field: 'dieselL', stream: 'diesel', kind: 'liquidFuel', maxMetric: 250, stepMetric: 1, group: 'mobility' },
  { field: 'airTravelKm', stream: 'airTravel', kind: 'distance', maxMetric: 12000, stepMetric: 50, group: 'mobility' },
  { field: 'waterM3', stream: 'water', kind: 'waterVol', maxMetric: 80, stepMetric: 1, group: 'waterWaste' },
  { field: 'wasteKg', stream: 'waste', kind: 'mass', maxMetric: 150, stepMetric: 1, group: 'waterWaste' },
];

export const CalculatorPage: React.FC = () => {
  const { profile, audits, activeAudit, setActiveMonth, updateProfileFields, upsertAudit } = useEcoTrack();
  const [month, setMonth] = useState(activeAudit.month);
  const [label, setLabel] = useState(activeAudit.label);
  const [notes, setNotes] = useState(activeAudit.notes || '');
  const [solarPct, setSolarPct] = useState(activeAudit.solarOffsetPct);
  const [members, setMembers] = useState(activeAudit.members);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [savedBanner, setSavedBanner] = useState(false);

  const [inputs, setInputs] = useState<ActivityInputs>({
    electricityKwh: activeAudit.electricityKwh,
    lpgKg: activeAudit.lpgKg,
    petrolL: activeAudit.petrolL,
    dieselL: activeAudit.dieselL,
    airTravelKm: activeAudit.airTravelKm,
    pngM3: activeAudit.pngM3,
    waterM3: activeAudit.waterM3,
    wasteKg: activeAudit.wasteKg,
    compostKg: activeAudit.compostKg,
    evKm: activeAudit.evKm || 0,
    motorcycleKm: activeAudit.motorcycleKm || 0,
    transitKm: activeAudit.transitKm || 0,
    biomassKg: activeAudit.biomassKg || 0,
    heatPumpKwh: activeAudit.heatPumpKwh || 0,
  });

  useEffect(() => {
    setMonth(activeAudit.month);
    setLabel(activeAudit.label);
    setNotes(activeAudit.notes || '');
    setSolarPct(activeAudit.solarOffsetPct);
    setMembers(activeAudit.members);
    setInputs({
      electricityKwh: activeAudit.electricityKwh,
      lpgKg: activeAudit.lpgKg,
      petrolL: activeAudit.petrolL,
      dieselL: activeAudit.dieselL,
      airTravelKm: activeAudit.airTravelKm,
      pngM3: activeAudit.pngM3,
      waterM3: activeAudit.waterM3,
      wasteKg: activeAudit.wasteKg,
      compostKg: activeAudit.compostKg,
      evKm: activeAudit.evKm || 0,
      motorcycleKm: activeAudit.motorcycleKm || 0,
      transitKm: activeAudit.transitKm || 0,
      biomassKg: activeAudit.biomassKg || 0,
      heatPumpKwh: activeAudit.heatPumpKwh || 0,
    });
  }, [activeAudit]);

  const breakdown = useMemo(
    () =>
      computeAuditBreakdown(
        inputs,
        profile.regionId,
        members,
        solarPct,
        profile.unitSystem
      ),
    [inputs, members, profile.regionId, profile.unitSystem, solarPct]
  );

  const consumptionTier = useMemo(() => {
    const perPerson = breakdown.perPersonKg;
    if (perPerson <= 150) {
      return {
        label: 'Minimal Consumption',
        detail: `Within the ${formatMass(PARIS_TARGET_PER_PERSON_KG, profile.unitSystem, 0)}/person Paris climate pace`,
        boxClass:
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
        dotClass: 'bg-emerald-500',
      };
    }
    if (perPerson <= 320) {
      return {
        label: 'Moderate Consumption',
        detail: `Above the ${formatMass(PARIS_TARGET_PER_PERSON_KG, profile.unitSystem, 0)}/person Paris target`,
        boxClass: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
        dotClass: 'bg-amber-500',
      };
    }
    return {
      label: 'High Consumption',
      detail: 'Over 2× the Paris climate allowance per person',
      boxClass: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
      dotClass: 'bg-rose-500',
    };
  }, [breakdown.perPersonKg, profile.unitSystem]);

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    const existing = audits.find((a) => a.month === newMonth);
    if (existing) {
      setActiveMonth(existing.month);
      return;
    }
    if (/^\d{4}-\d{2}$/.test(newMonth)) {
      const [y, m] = newMonth.split('-').map(Number);
      const dt = new Date(y, m - 1, 1);
      setLabel(dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    }
  };

  const handleSaveAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertAudit({
      ...inputs,
      month,
      label: label.trim() || month,
      regionId: profile.regionId,
      members,
      solarOffsetPct: solarPct,
      notes,
    });
    updateProfileFields({ members, solarOffsetPct: solarPct });
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 3200);
  };

  const visibleStreams =
    filterTab === 'all' ? STREAM_INPUTS : STREAM_INPUTS.filter((s) => s.group === filterTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">
            IPCC / IEA / DEFRA Emission Engine · {profile.unitSystem === 'metric' ? 'Metric (SI)' : 'Imperial (US)'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
            8-Stream Household Carbon Calculator
          </h1>
        </div>
      </div>

      <form onSubmit={handleSaveAudit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-8 space-y-5">
          {/* Billing Cycle & Grid Controls */}
          <div className="bento-card rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <label className="text-xs block">
              <span className="font-semibold text-[var(--text-secondary)]">Billing Month</span>
              <input
                type="month"
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-sm"
              />
            </label>

            <label className="text-xs block">
              <span className="font-semibold text-[var(--text-secondary)]">Regional Grid</span>
              <select
                value={profile.regionId}
                onChange={(e) => updateProfileFields({ regionId: e.target.value as RegionId })}
                className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-xs font-medium"
              >
                {Object.values(REGIONAL_PRESETS).map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.shortName} ({reg.gridKgPerKwh} kg/kWh)
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs block">
              <span className="font-semibold text-[var(--text-secondary)]">Currency</span>
              <select
                value={profile.currency}
                onChange={(e) => updateProfileFields({ currency: e.target.value as CurrencyCode })}
                className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-xs font-mono"
              >
                {Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => (
                  <option key={code} value={code}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs block">
              <span className="font-semibold text-[var(--text-secondary)]">Residents</span>
              <input
                type="number"
                min={1}
                max={25}
                value={members}
                onChange={(e) => setMembers(Math.min(25, Math.max(1, Number(e.target.value) || 1)))}
                className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-sm"
              />
            </label>
          </div>

          {/* Stream Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              {(
                [
                  ['all', 'All 8 Streams'],
                  ['energy', 'Home Energy'],
                  ['mobility', 'Mobility & Flights'],
                  ['waterWaste', 'Water & Waste'],
                ] as const
              ).map(([tabKey, tabLabel]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setFilterTab(tabKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap btn-press ${
                    filterTab === tabKey
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tabLabel}
                </button>
              ))}
            </div>
          </div>

          {/* 8 Primary Streams Sliders + Numeric Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleStreams.map((item) => {
              const meta = STREAM_META[item.stream];
              const metricVal = Number(inputs[item.field] || 0);
              const displayVal = toDisplayAmount(metricVal, item.kind, profile.unitSystem);
              const maxDisplay = toDisplayAmount(item.maxMetric, item.kind, profile.unitSystem);
              const unitLabel = profile.unitSystem === 'metric' ? meta.metricUnit : meta.imperialUnit;
              const streamResult = breakdown.streams.find((s) => s.key === item.stream);

              return (
                <div key={item.field} className="bento-card rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{meta.emoji}</span>
                      <span className="text-sm font-bold truncate">{meta.label}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[var(--text-muted)]">
                      {formatMass(streamResult?.kgCo2e || 0, profile.unitSystem)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={Math.round(maxDisplay)}
                      step={item.stepMetric}
                      value={Number(displayVal.toFixed(1))}
                      onChange={(e) => {
                        const rawDisplay = Number(e.target.value);
                        const metricNext = fromDisplayAmount(rawDisplay, item.kind, profile.unitSystem);
                        setInputs((prev) => ({
                          ...prev,
                          [item.field]: Math.max(0, Number(metricNext.toFixed(2))),
                        }));
                      }}
                      style={{ accentColor: meta.color }}
                      className="flex-1 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 w-28 shrink-0">
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={Number(displayVal.toFixed(1))}
                        onChange={(e) => {
                          const rawDisplay = Math.max(0, Number(e.target.value) || 0);
                          const metricNext = fromDisplayAmount(rawDisplay, item.kind, profile.unitSystem);
                          setInputs((prev) => ({
                            ...prev,
                            [item.field]: Number(metricNext.toFixed(2)),
                          }));
                        }}
                        className="w-full h-9 px-2.5 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-xs text-right"
                      />
                      <span className="text-[11px] font-mono text-[var(--text-muted)] w-7">
                        {unitLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Advanced Clean Tech & Mobility Credits */}
          <div className="bento-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Advanced Clean Tech &amp; Mobility Credits</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <label className="text-xs block">
                <span className="text-[var(--text-secondary)] font-medium">
                  Rooftop Solar Offset (%)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={solarPct}
                  onChange={(e) => setSolarPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="mt-1 w-full h-9 px-3 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-xs"
                />
              </label>

              <label className="text-xs block">
                <span className="text-[var(--text-secondary)] font-medium">
                  Composted Organics (kg)
                </span>
                <input
                  type="number"
                  min={0}
                  value={inputs.compostKg}
                  onChange={(e) =>
                    setInputs((p) => ({ ...p, compostKg: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="mt-1 w-full h-9 px-3 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-xs"
                />
              </label>

              <label className="text-xs block">
                <span className="text-[var(--text-secondary)] font-medium">EV Commute (km)</span>
                <input
                  type="number"
                  min={0}
                  value={inputs.evKm}
                  onChange={(e) =>
                    setInputs((p) => ({ ...p, evKm: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="mt-1 w-full h-9 px-3 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-xs"
                />
              </label>

              <label className="text-xs block">
                <span className="text-[var(--text-secondary)] font-medium">
                  Public Transit (km)
                </span>
                <input
                  type="number"
                  min={0}
                  value={inputs.transitKm}
                  onChange={(e) =>
                    setInputs((p) => ({ ...p, transitKm: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="mt-1 w-full h-9 px-3 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-xs"
                />
              </label>

              <label className="text-xs block">
                <span className="text-[var(--text-secondary)] font-medium">
                  Motorcycle / Scooter (km)
                </span>
                <input
                  type="number"
                  min={0}
                  value={inputs.motorcycleKm}
                  onChange={(e) =>
                    setInputs((p) => ({
                      ...p,
                      motorcycleKm: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="mt-1 w-full h-9 px-3 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-xs"
                />
              </label>

              <label className="text-xs block">
                <span className="text-[var(--text-secondary)] font-medium">
                  Heat Pump Usage (kWh)
                </span>
                <input
                  type="number"
                  min={0}
                  value={inputs.heatPumpKwh || 0}
                  onChange={(e) =>
                    setInputs((p) => ({
                      ...p,
                      heatPumpKwh: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="mt-1 w-full h-9 px-3 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-xs"
                />
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="bento-card rounded-2xl p-5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Billing Cycle Notes
            </label>
            <input
              type="text"
              maxLength={400}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Installed inverter AC in master bedroom or summer travel cycle"
              className="w-full h-10 px-3.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm"
            />
          </div>
        </div>

        {/* Sticky Live Emission Breakdown */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 bento-card rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-xs font-mono text-[var(--text-muted)]">{label}</p>
            <h2 className="text-lg font-bold mt-0.5">Live Footprint Summary</h2>
            <div className="mt-3">
              <AnimatedCounter
                value={
                  profile.unitSystem === 'metric'
                    ? breakdown.totalKgCo2e
                    : breakdown.totalKgCo2e * 2.20462
                }
                decimals={1}
                suffix={profile.unitSystem === 'metric' ? ' kg CO₂e' : ' lbs CO₂e'}
                className="text-3xl font-extrabold"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Per person:{' '}
                <strong className="font-mono text-[var(--text-primary)]">
                  {formatMass(breakdown.perPersonKg, profile.unitSystem)}
                </strong>{' '}
                / mo
              </p>
            </div>

            <div
              className={`mt-3 px-3.5 py-2.5 rounded-xl border flex items-start gap-2.5 ${consumptionTier.boxClass}`}
            >
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${consumptionTier.dotClass}`} />
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">{consumptionTier.label}</p>
                <p className="text-[11px] opacity-85 mt-0.5 leading-snug">{consumptionTier.detail}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-[var(--border-subtle)]">
            {breakdown.streams.map((s) => (
              <div key={s.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>
                    {s.emoji} {s.label}
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {formatMass(s.kgCo2e, profile.unitSystem)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-surface-alt)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, s.sharePct)}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Solar Offset Saved</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                -{formatMass(breakdown.solarSavedKg, profile.unitSystem)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Compost Credit</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                -{formatMass(breakdown.compostSavedKg, profile.unitSystem)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Annual Trees Equivalent</span>
              <span className="font-mono font-semibold">{breakdown.treesNeededPerYear} trees</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 btn-press"
          >
            {savedBanner ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved to {month} Ledger</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Monthly Audit</span>
              </>
            )}
          </button>
        </aside>
      </form>
    </div>
  );
};
