import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Leaf } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';

export const OpeningCurtainReveal: React.FC = () => {
  const { curtainVisible, profile } = useEcoTrack();

  return (
    <AnimatePresence>
      {curtainVisible && (
        <motion.div
          key="ecotrack-v22-curtain"
          initial={{ clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
          animate={{ clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
          exit={{
            clipPath: 'circle(0% at 4% 8%)',
            transition: {
              duration: 0.72,
              ease: [0.76, 0, 0.24, 1],
            },
          }}
          className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-gradient-to-br from-[#0d2620] via-[#091c18] to-[#05110e] text-white px-6 select-none overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[540px] h-[540px] rounded-full bg-emerald-500/10 blur-[120px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="relative flex flex-col items-center text-center max-w-xl"
          >
            <p className="text-xs sm:text-sm tracking-[0.2em] text-[#fcd34d] font-medium mb-8">
              ✦ शुभं करोतु कल्याणम् · Prakriti &amp; Prosperity in Harmony ✦
            </p>

            <div className="relative mb-7 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#fcd34d]/20 blur-2xl scale-125" />
              <div className="relative w-28 h-28 rounded-full border border-[#fcd34d]/45 bg-[#132a26]/80 shadow-[0_0_50px_rgba(252,211,77,0.22)] flex flex-col items-center justify-center gap-1">
                <Leaf className="w-6 h-6 text-[#fcd34d]" />
                <span className="font-mono text-[11px] tracking-[0.18em] text-[#fcd34d] font-semibold">
                  SEAL
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
              EcoTrack
            </h1>
            <p className="font-editorial text-emerald-200/85 text-base sm:text-lg mb-6">
              TerraLedger Household Carbon Ledger
            </p>

            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white/10 border border-white/15 backdrop-blur-md text-xs sm:text-sm text-emerald-50">
              <span className="font-medium">{profile.householdName}</span>
              <span className="text-white/40" aria-hidden="true">
                ·
              </span>
              <span className="font-mono text-[#fcd34d]">Workspace Unlocked</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
