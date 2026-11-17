import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, Plus, Printer } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import {
  PARIS_TARGET_PER_PERSON_KG,
  REGIONAL_PRESETS,
  computeAuditBreakdown,
  formatMass,
} from '../utils/calculations';

export const ReportsPage: React.FC = () => {
  const { profile, audits, activeAudit, setActiveMonth } = useEcoTrack();

  const computation = useMemo(
    () =>
      computeAuditBreakdown(
        activeAudit,
        profile.regionId,
        activeAudit.members,
        activeAudit.solarOffsetPct,
        profile.unitSystem
      ),
    [activeAudit, profile.regionId, profile.unitSystem]
  );

  const region = REGIONAL_PRESETS[profile.regionId];
  const parisCompliant = computation.perPersonKg <= PARIS_TARGET_PER_PERSON_KG;

  if (audits.length === 0) {
    return (
      <div className="bento-card rounded-2xl p-10 text-center space-y-3 max-w-2xl">
        <h1 className="text-xl font-bold">No Audit Records Available</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Log at least one monthly audit in the Calculator to generate a certified household carbon report.
        </p>
        <Link
          to="/calculator"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-semibold btn-press"
        >
          <Plus className="w-4 h-4" />
          <span>Log Monthly Audit</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">
            Print-Ready Verification Statement
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
            Certified Household Carbon Report
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeAudit.month}
            onChange={(e) => setActiveMonth(e.target.value)}
            className="h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono font-semibold"
          >
            {audits.map((a) => (
              <option key={a.id} value={a.month}>
                {a.label} ({a.month})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-10 px-4 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-semibold flex items-center gap-2 whitespace-nowrap btn-press"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Certified Printable Sheet */}
      <article className="bento-card print-sheet rounded-2xl p-6 sm:p-10 space-y-8 max-w-4xl">
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <p className="text-xs font-mono text-[var(--accent-secondary)] font-semibold">
              TERRALEDGER · ECOTRACK V22 CERTIFICATE
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1">
              {profile.householdName}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Billing Cycle: <strong className="font-mono">{activeAudit.label}</strong> · Grid:{' '}
              {region.name} ({region.sourceLabel})
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] self-start">
            <Award className="w-5 h-5 text-[#d97706]" />
            <div className="text-xs">
              <p className="font-bold">
                {parisCompliant ? 'Paris 1.5°C Aligned' : 'Transitioning Household'}
              </p>
              <p className="font-mono text-[11px] text-[var(--text-muted)]">
                ID: {activeAudit.id.toUpperCase()}
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[var(--bg-surface-alt)]">
            <p className="text-xs text-[var(--text-muted)]">Net Household CO₂e</p>
            <p className="text-xl font-extrabold font-mono mt-1">
              {formatMass(computation.totalKgCo2e, profile.unitSystem)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-surface-alt)]">
            <p className="text-xs text-[var(--text-muted)]">Per Resident</p>
            <p className="text-xl font-extrabold font-mono mt-1">
              {formatMass(computation.perPersonKg, profile.unitSystem)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-surface-alt)]">
            <p className="text-xs text-[var(--text-muted)]">Solar Offset Credit</p>
            <p className="text-xl font-extrabold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
              -{formatMass(computation.solarSavedKg, profile.unitSystem)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-surface-alt)]">
            <p className="text-xs text-[var(--text-muted)]">Annual Tree Equivalent</p>
            <p className="text-xl font-extrabold font-mono mt-1">
              {computation.treesNeededPerYear} trees
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold mb-3">Verified 8-Stream Emissions Ledger</h3>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                <th className="py-2.5 pr-3 font-medium">Activity Stream</th>
                <th className="py-2.5 px-3 font-medium text-right">Metered Volume</th>
                <th className="py-2.5 px-3 font-medium text-right">Share</th>
                <th className="py-2.5 pl-3 font-medium text-right">Emissions</th>
              </tr>
            </thead>
            <tbody>
              {computation.streams.map((s) => (
                <tr key={s.key} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <td className="py-2.5 pr-3 font-medium">
                    {s.emoji} {s.label}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                    {s.rawDisplay}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {s.sharePct}%
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono tabular-nums font-bold">
                    {formatMass(s.kgCo2e, profile.unitSystem)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="pt-5 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex flex-col sm:flex-row justify-between gap-2">
          <span>
            Methodology: IPCC AR6 · IEA Emission Factors · UK DEFRA Conversion Factors · CEA India Baseline
          </span>
          <span className="font-mono">Generated {new Date().toLocaleDateString()}</span>
        </footer>
      </article>
    </div>
  );
};
