import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LayoutGrid, Calculator } from 'lucide-react';
import { useCarbon } from '../context/CarbonContext';
import { formatEmissionMass } from '../utils/calculations';

export const WelcomeEntryModal: React.FC = () => {
  const {
    profile,
    records,
    showWelcomeModal,
    closeWelcomeModal,
    locale,
  } = useCarbon();
  const navigate = useNavigate();

  if (!showWelcomeModal) return null;

  const latest = records[records.length - 1];
  const unitShort = profile.unitSystem === 'imperial' ? 'lbs CO₂e' : 'kg CO₂e';

  const handleAction = (path: string) => {
    closeWelcomeModal();
    navigate(path);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="v22-card rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-popup-entry">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Household Carbon Ledger Ready
            </div>
            <h2 id="welcome-modal-title" className="text-xl font-extrabold mt-1">
              Welcome back, {profile.householdName}! 🏠
            </h2>
          </div>
          <button
            type="button"
            onClick={closeWelcomeModal}
            aria-label="Close welcome modal"
            className="p-1.5 rounded-xl v22-subcard hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl v22-subcard text-center">
          <div>
            <div className="text-[11px] opacity-65">Current Month</div>
            <div className="font-mono tabular-nums text-base font-bold mt-0.5">
              {formatEmissionMass(latest.result.totalKgCO2e, profile.unitSystem, locale)}{' '}
              <span className="text-[10px] font-normal">{unitShort}</span>
            </div>
          </div>
          <div className="border-x border-current/10">
            <div className="text-[11px] opacity-65">Occupants</div>
            <div className="font-mono tabular-nums text-base font-bold mt-0.5">
              {profile.members} Members
            </div>
          </div>
          <div>
            <div className="text-[11px] opacity-65">Home Type</div>
            <div className="text-xs font-bold mt-1 truncate px-1">
              {profile.homeType}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleAction('/dashboard')}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md"
          >
            <LayoutGrid className="w-4 h-4" />
            Go to Dashboard
          </button>
          <button
            type="button"
            onClick={() => handleAction('/calculator')}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#132a26] hover:bg-[#1b3b35] text-[#fcd34d] text-xs font-bold transition-colors shadow-md"
          >
            <Calculator className="w-4 h-4" />
            Log This Month&apos;s Data
          </button>
        </div>
      </div>
    </div>
  );
};
