import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';

const STREAM_COLORS = [
  { color: '#F59E0B', label: 'Electricity' },
  { color: '#EF4444', label: 'LPG' },
  { color: '#8B5CF6', label: 'Petrol' },
  { color: '#6366F1', label: 'Diesel' },
  { color: '#06B6D4', label: 'Flights' },
  { color: '#F97316', label: 'PNG' },
  { color: '#3B82F6', label: 'Water' },
  { color: '#84CC16', label: 'Waste' },
];

export const AppStartAnimation: React.FC = () => {
  const { startAnimVisible, dismissStartAnimation } = useEcoTrack();
  const [calibratedKg, setCalibratedKg] = useState(0);

  useEffect(() => {
    if (!startAnimVisible) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setCalibratedKg(167);
      const fastTimer = window.setTimeout(() => {
        dismissStartAnimation();
      }, 350);
      return () => window.clearTimeout(fastTimer);
    }

    setCalibratedKg(0);
    const startTime = performance.now();
    const tickDuration = 1250;
    let rafId = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / tickDuration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCalibratedKg(Number((167 * eased).toFixed(1)));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    const exitTimer = window.setTimeout(() => {
      dismissStartAnimation();
    }, 2050);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(exitTimer);
    };
  }, [startAnimVisible, dismissStartAnimation]);

  return (
    <AnimatePresence>
      {startAnimVisible && (
        <motion.div
          key="ecotrack-start-intro"
          initial={{ clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
          animate={{ clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
          exit={{
            clipPath: 'circle(0% at 50% 8%)',
            transition: {
              duration: 0.72,
              ease: [0.76, 0, 0.24, 1],
            },
          }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-gradient-to-br from-[#061813] via-[#091f19] to-[#030d0a] text-white px-6 select-none overflow-hidden"
        >
          {/* Ambient radial forest glow */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute w-[560px] h-[560px] rounded-full bg-emerald-500/12 blur-[130px]"
          />
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.85, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute -bottom-24 right-1/4 w-[380px] h-[380px] rounded-full bg-[#fcd34d]/10 blur-[120px]"
          />

          <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
            {/* Stage 1: Kinetic SVG Botanical Crest & Orbital Ring */}
            <div className="relative w-32 h-32 mb-7 flex items-center justify-center">
              <motion.svg
                viewBox="0 0 120 120"
                className="w-full h-full overflow-visible"
                aria-hidden="true"
              >
                {/* Slow rotating outer dashed meridian */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="rgba(167, 243, 208, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                  initial={{ rotate: 0, opacity: 0 }}
                  animate={{ rotate: 90, opacity: 1 }}
                  transition={{ duration: 2.2, ease: 'linear' }}
                  style={{ originX: '60px', originY: '60px' }}
                />

                {/* Golden orbital carbon ring */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#fcd34d"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Roofline solar arch */}
                <motion.path
                  d="M 32 59 L 60 35 L 88 59"
                  fill="none"
                  stroke="#fcd34d"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.55, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Botanical leaf stem & blade */}
                <motion.path
                  d="M 60 82 C 47 76, 44 61, 60 49 C 76 61, 73 76, 60 82 Z"
                  fill="rgba(52, 211, 153, 0.16)"
                  stroke="#34d399"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.path
                  d="M 60 82 L 60 56"
                  fill="none"
                  stroke="#a7f3d0"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.55, ease: 'easeOut' }}
                />
              </motion.svg>
            </div>

            {/* Stage 2: Masked Headline & Editorial Subhead */}
            <div className="overflow-hidden mb-2">
              <motion.h1
                initial={{ y: '105%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 0.62, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white"
              >
                EcoTrack
              </motion.h1>
            </div>

            <div className="overflow-hidden mb-7">
              <motion.p
                initial={{ y: '105%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.46, ease: [0.16, 1, 0.3, 1] }}
                className="font-editorial text-sm sm:text-base text-emerald-200/85"
              >
                TerraLedger Global Household Carbon Intelligence
              </motion.p>
            </div>

            {/* Stage 3: 8-Stream Spectrum Wave */}
            <div className="flex items-end justify-center gap-2 h-8 mb-6" aria-hidden="true">
              {STREAM_COLORS.map((s, idx) => (
                <motion.span
                  key={s.label}
                  initial={{ scaleY: 0.15, opacity: 0 }}
                  animate={{
                    scaleY: [0.2, 1, 0.55, 0.85],
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.9,
                    delay: 0.5 + idx * 0.055,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ backgroundColor: s.color, originY: 1 }}
                  className="w-2 h-7 rounded-full"
                />
              ))}
            </div>

            {/* Stage 4: Live Paris 1.5°C Calibration Readout */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.65 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/8 border border-white/15 backdrop-blur-md text-xs text-emerald-100/90"
            >
              <span className="font-mono tabular-nums font-bold text-[#fcd34d]">
                {calibratedKg.toFixed(1)} kg CO₂e/mo
              </span>
              <span className="text-white/35" aria-hidden="true">
                ·
              </span>
              <span>Paris 1.5°C Pathway</span>
            </motion.div>
          </div>

          {/* Unobtrusive Skip Intro button */}
          <motion.button
            type="button"
            onClick={dismissStartAnimation}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.78 }}
            whileHover={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="absolute bottom-6 right-6 z-20 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/18 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 backdrop-blur-md btn-press"
          >
            <span>Skip Intro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
