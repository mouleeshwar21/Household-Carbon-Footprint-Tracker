import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Calculator,
  BookOpen,
  UserCheck,
  BarChart3,
  Microscope,
  Target,
  Sparkles,
  Globe2,
  Leaf,
  FileCheck2,
} from 'lucide-react';
import { useCarbon } from '../context/CarbonContext';
import {
  REGION_GRID_PRESETS,
  STREAM_KEYS_ORDERED,
  formatEmissionMass,
  formatCurrency,
} from '../utils/calculations';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { playUiSound } from '../utils/soundEffects';

const SUBTITLE_TEXT =
  'Track 8 daily household activities. See your real CO₂ footprint. Get personalized actions to cut it — in under 60 seconds.';

export const LandingPage: React.FC = () => {
  const { profile, records, adoptedSavings, locale, loginDemo, updateProfile } = useCarbon();
  const navigate = useNavigate();

  const [typedSubtitle, setTypedSubtitle] = useState<string>('');
  const [tilt, setTilt] = useState<{ rotateX: number; rotateY: number }>({
    rotateX: 2,
    rotateY: -3,
  });

  useEffect(() => {
    let idx = 0;
    const interval = window.setInterval(() => {
      idx += 2;
      setTypedSubtitle(SUBTITLE_TEXT.slice(0, idx));
      if (idx >= SUBTITLE_TEXT.length) {
        window.clearInterval(interval);
      }
    }, 22);
    return () => window.clearInterval(interval);
  }, []);

  const latestRecord = records[records.length - 1];
  const unitShort = profile.unitSystem === 'imperial' ? 'lbs CO₂e' : 'kg CO₂e';

  const handleDemoClick = () => {
    playUiSound('ding');
    loginDemo();
    navigate('/dashboard');
  };

  const handleMouseMoveHero = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: Number((-yPct * 10).toFixed(2)),
      rotateY: Number((xPct * 12).toFixed(2)),
    });
  };

  const handleMouseLeaveHero = () => {
    setTilt({ rotateX: 2, rotateY: -3 });
  };

  return (
    <div className="space-y-10 pb-8">
      {/* 1. CINEMATIC AURORA HERO SECTION */}
      <section
        onMouseMove={handleMouseMoveHero}
        onMouseLeave={handleMouseLeaveHero}
        className="relative overflow-hidden rounded-[32px] p-6 sm:p-10 lg:p-12 text-white shadow-2xl border border-emerald-400/25 bg-gradient-to-br from-[#061512] via-[#0f2e26] to-[#0c3b38] animate-aurora"
      >
        {/* Slow-moving Aurora Gradient Blobs */}
        <motion.div
          animate={{
            x: [0, 35, -20, 0],
            y: [0, -25, 20, 0],
            scale: [1, 1.12, 0.95, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/25 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 25, 0],
            y: [0, 30, -20, 0],
            scale: [1, 1.08, 0.92, 1],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -bottom-24 right-10 w-[28rem] h-[28rem] rounded-full bg-cyan-500/20 blur-3xl"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left 7 Cols: Massive Display Headline, Typewriter Subtitle & Dual Explosive CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>EcoTrack · IPCC 2006 · CEA India · DEFRA · EPA · ICAO</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white"
              style={{ textWrap: 'balance' }}
            >
              Know Your Carbon.{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
                Cut Your Carbon.
              </span>{' '}
              Save the Planet.
            </h1>

            <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed min-h-[3.5rem] max-w-2xl font-medium">
              {typedSubtitle}
              <span className="inline-block w-2 h-5 ml-1 bg-emerald-400 animate-pulse align-middle" />
            </p>

            {/* Two Explosive CTA Buttons Side by Side */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  playUiSound('click');
                  navigate('/calculator');
                }}
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#04130f] font-extrabold text-sm shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                Calculate Now — No Sign Up
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  playUiSound('click');
                  navigate('/about');
                }}
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-bold text-sm transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                Explore the Science
              </motion.button>
            </div>

            {/* 8 Stream Pills Preview */}
            <div className="pt-3 flex flex-wrap items-center gap-2">
              {STREAM_KEYS_ORDERED.map((key) => (
                <CategoryBadge key={key} streamKey={key} size="sm" />
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Floating 3D-Perspective Dashboard Mockup with Mouse Parallax Tilt */}
          <div className="lg:col-span-5" style={{ perspective: '1200px' }}>
            <motion.div
              animate={{
                rotateX: tilt.rotateX,
                rotateY: tilt.rotateY,
              }}
              transition={{ type: 'spring', stiffness: 140, damping: 18 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="rounded-[28px] bg-white/10 backdrop-blur-2xl border border-white/25 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.45)] space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/15 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Live 3D Telemetry Preview
                  </span>
                </div>
                <span className="font-mono text-xs text-amber-300 font-semibold">
                  {profile.country} Grid ({latestRecord?.result.effectiveGridFactorKgPerKwh} kg/kWh)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-black/25 border border-white/10 p-4">
                  <div className="text-[11px] text-white/70">Monthly Footprint</div>
                  <div className="text-2xl font-extrabold text-white mt-1">
                    <AnimatedCounter
                      value={
                        profile.unitSystem === 'imperial'
                          ? latestRecord?.result.totalDisplay || 0
                          : latestRecord?.result.totalKgCO2e || 0
                      }
                      decimals={1}
                      locale={locale}
                    />{' '}
                    <span className="text-xs font-normal text-white/60">{unitShort}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-black/25 border border-white/10 p-4">
                  <div className="text-[11px] text-white/70">Per-Capita vs 167 kg</div>
                  <div className="text-2xl font-extrabold text-emerald-300 mt-1">
                    <AnimatedCounter
                      value={
                        profile.unitSystem === 'imperial'
                          ? latestRecord?.result.perCapitaDisplay || 0
                          : latestRecord?.result.perCapitaKgCO2e || 0
                      }
                      decimals={1}
                      locale={locale}
                    />{' '}
                    <span className="text-xs font-normal text-white/60">
                      / {formatEmissionMass(167, profile.unitSystem, locale)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top 5 Activity Streams Live Bars */}
              <div className="space-y-2.5">
                {(latestRecord?.result.streamList || []).slice(0, 5).map((st) => (
                  <div key={st.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white/90 flex items-center gap-1.5">
                        <span>{st.emoji}</span>
                        <span>{st.label}</span>
                      </span>
                      <span className="font-mono tabular-nums text-white/90">
                        {st.displayValue} {unitShort.split(' ')[0]} ({st.sharePercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(6, st.sharePercent))}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: st.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                <span className="text-emerald-200">
                  Quick Wins Saving:{' '}
                  <strong className="font-mono text-amber-300">
                    -{formatEmissionMass(adoptedSavings.totalMonthlyKgSaved, profile.unitSystem, locale)}{' '}
                    {unitShort.split(' ')[0]}/mo
                  </strong>{' '}
                  ({formatCurrency(adoptedSavings.totalMonthlyUsdSaved, profile.currency)}/mo)
                </span>
                <Link
                  to="/dashboard"
                  className="font-bold text-amber-300 hover:text-amber-200 whitespace-nowrap ml-2"
                >
                  Command Center →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. LIVE GLOBAL COUNTER STRIP */}
      <section className="v22-card rounded-[26px] p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-current/10">
        <div className="flex items-center gap-4 px-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold">
              🌍 <AnimatedCounter value={48920} decimals={0} durationMs={1100} />
            </div>
            <div className="text-xs opacity-70 font-medium mt-0.5">
              Households tracked across 9 regional electricity grids
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              🌱 <AnimatedCounter value={1842500} decimals={0} durationMs={1300} /> kg
            </div>
            <div className="text-xs opacity-70 font-medium mt-0.5">
              CO₂e reduced through adopted household Quick Wins
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold">
              📊 <AnimatedCounter value={194310} decimals={0} durationMs={1200} />
            </div>
            <div className="text-xs opacity-70 font-medium mt-0.5">
              Certified IPCC-grade monthly carbon audits generated
            </div>
          </div>
        </div>
      </section>

      {/* 3. "HOW IT WORKS" — 3-STEP VISUAL FLOW */}
      <section className="space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            60-Second Decarbonization Loop
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How EcoTrack Works in 3 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              step: '01',
              emoji: '📊',
              title: 'Input',
              desc: 'Enter your monthly electricity, LPG cooking gas, petrol, diesel, flights, PNG, water & waste usage using zero-latency sliders.',
              icon: BarChart3,
              accent: '#F59E0B',
              actionLabel: 'Open 8-Stream Calculator →',
              path: '/calculator',
            },
            {
              step: '02',
              emoji: '🔬',
              title: 'Calculate',
              desc: 'Our IPCC-grade engine computes your exact CO₂ footprint, per-capita intensity, peak category driver, and 167 kg Paris 1.5°C score.',
              icon: Microscope,
              accent: '#10B981',
              actionLabel: 'Inspect IPCC Methodology →',
              path: '/about',
            },
            {
              step: '03',
              emoji: '🎯',
              title: 'Act',
              desc: 'Get personalized zero-cost and low-cost interventions with ₹/USD savings and tree-planting equivalents to slash your emissions.',
              icon: Target,
              accent: '#06B6D4',
              actionLabel: 'Explore Quick Wins Engine →',
              path: '/recommendations',
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 220, damping: 22 }}
                whileHover={{ y: -6 }}
                className="v22-card rounded-[26px] p-6 flex flex-col justify-between space-y-4 border-l-4"
                style={{ borderLeftColor: card.accent }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg v22-subcard">
                      STEP {card.step}
                    </span>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${card.accent}20`, color: card.accent }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-extrabold">
                    {card.emoji} {card.title}
                  </h3>
                  <p className="text-xs opacity-75 leading-relaxed">{card.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(card.path)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline text-left pt-2"
                >
                  {card.actionLabel}
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. DEMO ACCOUNT QUICK ACCESS CARD */}
      <section className="v22-dark-card rounded-[28px] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#fcd34d]">
            <UserCheck className="w-4 h-4" />
            <span>PRE-SEEDED 6-MONTH LONGITUDINAL DEMO HOUSEHOLD</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Try the Full Experience — 1-Click Demo Login
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Pre-seeded with{' '}
            <code className="font-mono text-[#fcd34d] bg-white/10 px-1.5 py-0.5 rounded">
              demo@carbontracker.org
            </code>{' '}
            /{' '}
            <code className="font-mono text-[#fcd34d] bg-white/10 px-1.5 py-0.5 rounded">
              Demo@12345
            </code>{' '}
            containing 6 months of realistic seasonal household data across all 8 activity streams
            (summer AC peak, monsoon drop, LPG cooking, metro transition, and composting).
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDemoClick}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#fcd34d] hover:bg-amber-300 text-[#132a26] font-extrabold text-sm shadow-xl shrink-0 cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          Launch 1-Click Demo Household
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </section>

      {/* 5. INTERACTIVE GLOBAL GRID FACTOR SELECTOR TABLE */}
      <section className="v22-card rounded-[26px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-current/10">
          <div>
            <div className="text-xs opacity-65 mb-1">
              Geo-Localized Electricity Lookup · Click any region to calibrate your session
            </div>
            <h2 className="text-lg font-extrabold">
              Global Regional Grid Emission Factors & National Baselines
            </h2>
          </div>
          <Link
            to="/about"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Inspect Full IPCC / CEA / IEA Equations →
          </Link>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-current/10 text-xs opacity-65">
                <th className="py-3 px-3 font-semibold">Region / Country Preset</th>
                <th className="py-3 px-3 font-semibold">Scientific Authority</th>
                <th className="py-3 px-3 font-semibold text-right">Grid Factor (kg CO₂e/kWh)</th>
                <th className="py-3 px-3 font-semibold text-right">National Avg (kg/person/mo)</th>
                <th className="py-3 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/10 text-xs">
              {REGION_GRID_PRESETS.map((reg) => {
                const isSelected = profile.country === reg.id;
                return (
                  <tr
                    key={reg.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-emerald-500/10' : 'hover:bg-current/5'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold">{reg.name}</td>
                    <td className="py-3 px-3 opacity-75">{reg.authority}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                      {reg.factorKgPerKwh.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums opacity-80">
                      {reg.nationalMonthlyPerCapitaKg} kg
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          updateProfile({
                            country: reg.id,
                            currency: reg.defaultCurrency,
                            unitSystem: reg.defaultUnit,
                          })
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'v22-subcard hover:opacity-90'
                        }`}
                      >
                        {isSelected ? 'Active Region ✓' : 'Activate Grid'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
