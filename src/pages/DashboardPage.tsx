import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  Flame,
  Fuel,
  Globe2,
  Minus,
  Palette,
  Plus,
  Sparkles,
  SunMedium,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import {
  PARIS_TARGET_PER_PERSON_KG,
  QUICK_WINS_CATALOG,
  REGIONAL_PRESETS,
  THEMES_CATALOG,
  computeAuditBreakdown,
  formatCurrencyFromUsd,
  formatMass,
} from '../utils/calculations';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmissionGoalSummary } from '../components/charts/EmissionGoalSummary';
import { EmissionDonutChart } from '../components/charts/EmissionDonutChart';
import { MonthlyTrendChart } from '../components/charts/MonthlyTrendChart';
import { DailyTipWidget } from '../components/DailyTipWidget';
import { AuditInspectModal } from '../components/AuditInspectModal';
import { CarbonAudit, RegionId } from '../types/carbon';

export const DashboardPage: React.FC = () => {
  const {
    profile,
    audits,
    activeAudit,
    previousAudit,
    setActiveMonth,
    updateProfileFields,
    upsertAudit,
    quickAdjustStream,
    deleteAuditWithUndo,
    setTheme,
  } = useEcoTrack();

  const [viewMode, setViewMode] = useState<'bento' | 'capsule'>('bento');
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, idx) => {
      const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
      return {
        shortDay: dt.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: dt.getDate(),
        fullLabel: dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: idx === dayOfWeek,
      };
    });
  }, []);
  const todayWeekIdx = Math.max(0, currentWeekDays.findIndex((d) => d.isToday));
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(todayWeekIdx);
  const [inspectAudit, setInspectAudit] = useState<CarbonAudit | null>(null);
  const [inspectEditMode, setInspectEditMode] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const computation = useMemo(
    () =>
      computeAuditBreakdown(
        activeAudit,
        profile.regionId,
        profile.members,
        profile.solarOffsetPct,
        profile.unitSystem
      ),
    [activeAudit, profile.members, profile.regionId, profile.solarOffsetPct, profile.unitSystem]
  );

  const prevComputation = useMemo(
    () =>
      previousAudit
        ? computeAuditBreakdown(
            previousAudit,
            profile.regionId,
            profile.members,
            previousAudit.solarOffsetPct,
            profile.unitSystem
          )
        : null,
    [previousAudit, profile.members, profile.regionId, profile.unitSystem]
  );

  const momDeltaPct = prevComputation
    ? ((computation.totalKgCo2e - prevComputation.totalKgCo2e) /
        Math.max(1, prevComputation.totalKgCo2e)) *
      100
    : 0;

  const displayFactor = profile.unitSystem === 'metric' ? 1 : 2.20462262;
  const massUnit = profile.unitSystem === 'metric' ? 'kg' : 'lbs';

  const handleAdjustMembers = (delta: number) => {
    const next = Math.min(25, Math.max(1, profile.members + delta));
    updateProfileFields({ members: next });
    void upsertAudit({ ...activeAudit, members: next });
  };

  const handleBumpSolar = (delta: number) => {
    const next = Math.min(100, Math.max(0, profile.solarOffsetPct + delta));
    updateProfileFields({ solarOffsetPct: next });
    void upsertAudit({ ...activeAudit, solarOffsetPct: next });
  };

  const recentAudits = [...audits].reverse().slice(0, 5);
  const topQuickWins = QUICK_WINS_CATALOG.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Workspace Bar: Title + Bento/Capsule Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">
            {REGIONAL_PRESETS[profile.regionId].name} · {profile.members} Household Members ·{' '}
            <span className="font-mono">{activeAudit.label}</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 text-balance">
            Household Carbon Overview
          </h1>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] self-start">
          <button
            type="button"
            onClick={() => setViewMode('bento')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors btn-press ${
              viewMode === 'bento'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Bento Workspace
          </button>
          <button
            type="button"
            onClick={() => setViewMode('capsule')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors btn-press ${
              viewMode === 'capsule'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            6-Month Capsule
          </button>
        </div>
      </div>

      {/* 4 Animated KPI Summary Cards */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="bento-card rounded-2xl p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Current Month Total</p>
          <div className="mt-2 flex items-baseline gap-2">
            <AnimatedCounter
              value={computation.totalKgCo2e * displayFactor}
              decimals={1}
              suffix={` ${massUnit}`}
              className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]"
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Solar offset saved{' '}
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {formatMass(computation.solarSavedKg, profile.unitSystem)}
            </span>
          </p>
        </div>

        <div className="bento-card rounded-2xl p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Month-over-Month Change</p>
          <div className="mt-2 flex items-center gap-2">
            <AnimatedCounter
              value={Math.abs(momDeltaPct)}
              decimals={1}
              prefix={momDeltaPct <= 0 ? '-' : '+'}
              suffix="%"
              className={`text-2xl sm:text-3xl font-bold ${
                momDeltaPct <= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            />
            {momDeltaPct <= 0 ? (
              <ArrowDownRight className="w-5 h-5 text-emerald-500" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            {previousAudit ? `Compared to ${previousAudit.label}` : 'Baseline cycle'}
          </p>
        </div>

        <div className="bento-card rounded-2xl p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">
            Per-Person vs. Paris {formatMass(PARIS_TARGET_PER_PERSON_KG, profile.unitSystem, 0)}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <AnimatedCounter
              value={computation.perPersonKg * displayFactor}
              decimals={1}
              suffix={` ${massUnit}`}
              className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]"
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono">
            {computation.vsParisPct <= 0 ? 'Below' : 'Above'} 1.5°C limit by{' '}
            {Math.abs(computation.vsParisPct).toFixed(1)}%
          </p>
        </div>

        <div className="bento-card rounded-2xl p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Peak Emission Source</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              {computation.peakStream.emoji}
            </span>
            <span className="text-xl font-bold tracking-tight truncate">
              {computation.peakStream.label}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono">
            <AnimatedCounter value={computation.peakStream.sharePct} decimals={1} suffix="%" /> of
            total ({formatMass(computation.peakStream.kgCo2e, profile.unitSystem)})
          </p>
        </div>
      </motion.section>

      {/* Quick-Log 4-Stream Interactive +/- Steppers */}
      <section className="bento-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold tracking-tight">
              Quick-Log Stream Steppers ({activeAudit.label})
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Nudge daily utility meters directly; totals and charts recalculate immediately.
            </p>
          </div>
          <Link
            to="/calculator"
            className="text-xs font-semibold text-[var(--accent-secondary)] hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            <span>Open Full 8-Stream Calculator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              {
                field: 'electricityKwh',
                label: 'Electricity',
                emoji: '⚡',
                step: 15,
                unit: 'kWh',
                color: '#F59E0B',
              },
              {
                field: 'lpgKg',
                label: 'Cooking LPG',
                emoji: '🔥',
                step: 1,
                unit: 'kg',
                color: '#EF4444',
              },
              {
                field: 'petrolL',
                label: 'Petrol Fuel',
                emoji: '⛽',
                step: 5,
                unit: 'L',
                color: '#8B5CF6',
              },
              {
                field: 'waterM3',
                label: 'Water Supply',
                emoji: '💧',
                step: 1,
                unit: 'm³',
                color: '#3B82F6',
              },
            ] as const
          ).map((item) => (
            <div
              key={item.field}
              className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </p>
                <p className="font-mono tabular-nums text-base font-bold mt-0.5">
                  {Number(activeAudit[item.field] || 0).toFixed(1)}{' '}
                  <span className="text-xs font-normal text-[var(--text-muted)]">{item.unit}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  aria-label={`Decrease ${item.label}`}
                  onClick={() => quickAdjustStream(item.field, -item.step)}
                  className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] flex items-center justify-center btn-press"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Increase ${item.label}`}
                  onClick={() => quickAdjustStream(item.field, item.step)}
                  className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center btn-press"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* V22 Bento Workspace OR 6-Month Capsule View */}
      {viewMode === 'bento' ? (
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Hero Banner */}
          <div className="md:col-span-7 bento-card rounded-2xl overflow-hidden relative min-h-[250px] flex flex-col justify-between p-6 text-white bg-[#132a26]">
            {!heroImgFailed && (
              <img
                src="/src/assets/images/hero_botanical_home_1794720795128.jpg"
                alt="Courtyard eco-residence with rooftop solar canopy"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-[#0b1f1b]/95 via-[#0f2923]/80 to-[#0f2923]/35"
            />
            <div className="relative z-10 flex items-center gap-3">
              <img
                src="/src/assets/images/eco_avatar_household_1794720793438.jpg"
                alt="Household botanical crest"
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-xl object-cover border border-[#fcd34d]/40"
              />
              <div>
                <p className="text-xs font-mono text-[#fcd34d]">ACTIVE LEDGER</p>
                <h2 className="text-xl font-bold">{profile.householdName}</h2>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-md">
                <p className="font-editorial text-sm text-emerald-100/90">
                  “Precision carbon accounting turns daily household routines into measurable planetary stewardship.”
                </p>
              </div>
              <Link
                to="/calculator"
                className="px-4 py-2.5 rounded-xl bg-[#fcd34d] text-[#132a26] text-xs font-bold flex items-center gap-1.5 hover:brightness-105 whitespace-nowrap shrink-0 btn-press"
              >
                <span>Update {activeAudit.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Household Members +/- & Solar Offset +10% */}
          <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bento-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-muted)]">Household Size</span>
                <Users className="w-4 h-4 text-[var(--accent-secondary)]" />
              </div>
              <div className="my-4">
                <AnimatedCounter value={profile.members} className="text-4xl font-extrabold" />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Residents sharing footprint
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjustMembers(-1)}
                  className="flex-1 h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] hover:border-[var(--border-strong)] flex items-center justify-center btn-press"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustMembers(1)}
                  className="flex-1 h-9 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center btn-press"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bento-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-muted)]">Rooftop Solar</span>
                <SunMedium className="w-4 h-4 text-amber-500" />
              </div>
              <div className="my-4">
                <AnimatedCounter
                  value={profile.solarOffsetPct}
                  suffix="%"
                  className="text-4xl font-extrabold text-amber-500"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Grid kWh offset active
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBumpSolar(-10)}
                  className="px-3 h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] text-xs font-mono font-semibold btn-press"
                >
                  -10%
                </button>
                <button
                  type="button"
                  onClick={() => handleBumpSolar(10)}
                  className="flex-1 h-9 rounded-xl bg-amber-500 text-slate-950 text-xs font-mono font-bold btn-press"
                >
                  +10% Offset
                </button>
              </div>
            </div>
          </div>

          {/* Deep Dark-Forest Trend Card */}
          <div className="md:col-span-4 bento-card rounded-2xl p-6 bg-[#132a26] text-white border-emerald-400/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#fcd34d]">TRAJECTORY</span>
              <Zap className="w-4 h-4 text-[#fcd34d]" />
            </div>
            <div className="my-4">
              <p className="text-xs text-emerald-100/75">6-Month Net Improvement</p>
              <p className="text-3xl font-extrabold font-mono text-[#fcd34d] mt-1">
                {audits.length >= 2
                  ? `${(
                      ((audits[audits.length - 1].totalKgCo2e - audits[0].totalKgCo2e) /
                        Math.max(1, audits[0].totalKgCo2e)) *
                      100
                    ).toFixed(1)}%`
                  : '0.0%'}
              </p>
              <p className="text-xs text-emerald-100/80 mt-2 leading-relaxed">
                Sustained decline driven by rooftop solar expansion and urban transit shifts.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-200/80 pt-3 border-t border-white/10 flex justify-between">
              <span>Trees Equivalent</span>
              <span className="text-[#fcd34d]">{computation.treesNeededPerYear} / yr</span>
            </div>
          </div>

          {/* Regional Grid & Peak Driver */}
          <div className="md:col-span-4 bento-card rounded-2xl p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Regional Grid Factor</span>
              <Globe2 className="w-4 h-4 text-[var(--accent-secondary)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Active Electricity Grid Preset
              </label>
              <select
                value={profile.regionId}
                onChange={(e) => updateProfileFields({ regionId: e.target.value as RegionId })}
                className="w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm font-medium"
              >
                {Object.values(REGIONAL_PRESETS).map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.name} ({reg.gridKgPerKwh} kg/kWh)
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Source Benchmark</span>
              <span className="font-mono font-medium">
                {REGIONAL_PRESETS[profile.regionId].sourceLabel}
              </span>
            </div>
          </div>

          {/* 1.5°C Potential Sphere Card */}
          <div className="md:col-span-4 bento-card rounded-2xl p-6 flex flex-col justify-between items-center text-center">
            <p className="text-xs font-medium text-[var(--text-muted)] self-start">
              Paris 1.5°C Alignment Sphere
            </p>
            <div className="my-3 relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400/25 via-teal-500/20 to-[#132a26]/40 border border-emerald-400/35 flex flex-col items-center justify-center shadow-[inset_0_2px_16px_rgba(255,255,255,0.2)]">
              <AnimatedCounter
                value={Math.max(0, Math.min(100, Math.round((167 / Math.max(1, computation.perPersonKg)) * 100)))}
                suffix="%"
                className="text-2xl font-extrabold"
              />
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Paris Score</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {computation.perPersonKg <= 167
                ? 'Your per-person footprint already meets the 1.5°C pathway.'
                : `Trim ${formatMass(computation.perPersonKg - 167, profile.unitSystem)} / person / mo to reach 1.5°C target.`}
            </p>
          </div>

          {/* Billing Cycle Navigator + 7-Day Strip */}
          <div className="md:col-span-6 bento-card rounded-2xl p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Billing Cycle Navigator</p>
                <h3 className="text-base font-bold mt-0.5">Active Cycle &amp; Weekly Meter</h3>
              </div>
              <select
                value={activeAudit.month}
                onChange={(e) => setActiveMonth(e.target.value)}
                className="h-9 px-3 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-xs font-mono font-semibold"
              >
                {audits.map((a) => (
                  <option key={a.id} value={a.month}>
                    {a.label} ({a.month})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {currentWeekDays.map((day, idx) => {
                const selected = selectedDayOffset === idx;
                return (
                  <button
                    key={day.shortDay}
                    type="button"
                    onClick={() => setSelectedDayOffset(idx)}
                    className={`py-2.5 rounded-xl text-center transition-colors btn-press ${
                      selected
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold'
                        : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] border border-transparent'
                    }`}
                  >
                    <span className="block text-[10px] opacity-80">{day.shortDay}</span>
                    <span className="block font-mono text-xs mt-1">{day.dateNum}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              {currentWeekDays[selectedDayOffset]?.fullLabel} · Daily run-rate:{' '}
              <strong className="text-[var(--text-primary)]">
                {formatMass(computation.totalKgCo2e / 30, profile.unitSystem)}
              </strong>{' '}
              / day
            </p>
          </div>

          {/* 6-Theme Studio Switcher */}
          <div className="md:col-span-6 bento-card rounded-2xl p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Visual Atmosphere</p>
                <h3 className="text-base font-bold mt-0.5 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <span>6-Theme Studio</span>
                </h3>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {THEMES_CATALOG.find((t) => t.id === profile.theme)?.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEMES_CATALOG.map((t) => {
                const active = profile.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all btn-press ${
                      active
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1">
                        {t.swatches.map((hex, i) => (
                          <span
                            key={i}
                            className="w-3 h-3 rounded-full border border-black/15"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      {active && <Check className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />}
                    </div>
                    <p className="text-xs font-semibold truncate">{t.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        /* 6-Month Capsule Tracker View */
        <section className="bento-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">6-Month Capsule Tracker</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Select any monthly capsule to focus the entire dashboard on that cycle.
              </p>
            </div>
          </div>
          {audits.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--text-muted)]">
              No monthly capsules recorded yet.{' '}
              <Link to="/calculator" className="text-[var(--accent-secondary)] font-semibold hover:underline">
                Log your first audit
              </Link>
              .
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {audits.slice(-6).map((a) => {
                const selected = a.month === activeAudit.month;
                const perPerson = a.totalKgCo2e / Math.max(1, a.members);
                const underParis = perPerson <= PARIS_TARGET_PER_PERSON_KG;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setActiveMonth(a.month)}
                    className={`p-4 rounded-2xl border text-left transition-all btn-press ${
                      selected
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-transparent shadow-md'
                        : 'bg-[var(--bg-surface-alt)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <p className="text-xs font-mono opacity-80">{a.month}</p>
                    <p className="text-sm font-bold mt-1">{a.label}</p>
                    <p className="text-xl font-extrabold font-mono mt-3">
                      {formatMass(a.totalKgCo2e, profile.unitSystem, 0)}
                    </p>
                    <p className="text-[11px] mt-1 opacity-80">
                      {underParis ? 'Paris Aligned' : 'Above Paris Limit'} · {a.solarOffsetPct}% Solar
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Charts Row: Goal Summary & Donut Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmissionGoalSummary
          computation={computation}
          monthlyTargetKg={profile.monthlyTargetKg}
          regionId={profile.regionId}
          members={profile.members}
          unitSystem={profile.unitSystem}
        />
        <EmissionDonutChart computation={computation} unitSystem={profile.unitSystem} />
      </section>

      {/* Trend Chart + Daily Habit Checklist */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <MonthlyTrendChart
            audits={audits}
            unitSystem={profile.unitSystem}
            members={profile.members}
          />
        </div>
        <div className="lg:col-span-5">
          <DailyTipWidget />
        </div>
      </section>

      {/* Recent Audits Table + Top 3 Quick Wins */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bento-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Recent Monthly Audits</h3>
              <p className="text-xs text-[var(--text-muted)]">
                Inspect full stream breakdowns or delete with 10-second Undo recovery.
              </p>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-[var(--accent-secondary)] hover:underline whitespace-nowrap"
            >
              View All ({audits.length})
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  <th className="py-2.5 pr-3 font-medium">Billing Cycle</th>
                  <th className="py-2.5 px-3 font-medium text-right">Total CO₂e</th>
                  <th className="py-2.5 px-3 font-medium text-right">Per Person</th>
                  <th className="py-2.5 pl-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentAudits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-[var(--text-muted)]">
                      No monthly audits recorded yet.{' '}
                      <Link
                        to="/calculator"
                        className="text-[var(--accent-secondary)] font-semibold hover:underline"
                      >
                        Log an audit
                      </Link>
                    </td>
                  </tr>
                ) : (
                  recentAudits.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-surface-alt)] transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <span className="font-semibold block">{row.label}</span>
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          {row.month} · {row.solarOffsetPct}% solar
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                        {formatMass(row.totalKgCo2e, profile.unitSystem)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                        {formatMass(row.totalKgCo2e / Math.max(1, row.members), profile.unitSystem)}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectAudit(row);
                              setInspectEditMode(false);
                            }}
                            title="Inspect Audit"
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] btn-press"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAuditWithUndo(row.id)}
                            title="Delete Audit"
                            className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-500 btn-press"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bento-card rounded-2xl p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Top 3 Quick Wins</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                High-leverage actions tailored to your peak streams
              </p>
            </div>
            <Link
              to="/recommendations"
              className="text-xs font-semibold text-[var(--accent-secondary)] hover:underline whitespace-nowrap"
            >
              Explore All
            </Link>
          </div>

          <div className="space-y-3">
            {topQuickWins.map((action) => (
              <div
                key={action.id}
                className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug">{action.title}</p>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    -{formatMass(action.annualSavingsKg, profile.unitSystem, 0)}/yr
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  {action.difficulty} · Est. savings{' '}
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {formatCurrencyFromUsd(action.annualSavingsUsd, profile.currency)}/yr
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AuditInspectModal
        audit={inspectAudit}
        initialEditMode={inspectEditMode}
        onClose={() => setInspectAudit(null)}
      />
    </div>
  );
};
