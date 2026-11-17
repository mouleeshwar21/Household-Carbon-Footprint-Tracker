import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Trees } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import {
  PARIS_TARGET_PER_PERSON_KG,
  QUICK_WINS_CATALOG,
  STREAM_META,
  TREE_ABSORPTION_KG_PER_YEAR,
  computeAuditBreakdown,
  formatCurrencyFromUsd,
  formatMass,
} from '../utils/calculations';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { LocalEcoHubLocator } from '../components/LocalEcoHubLocator';

export const RecommendationsPage: React.FC = () => {
  const { profile, activeAudit, adoptedActionIds, toggleAdoptedAction } = useEcoTrack();
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Zero Cost' | 'Low Cost' | 'Upgrade'>('All');
  const [forecastYears, setForecastYears] = useState(3);
  const [expandedId, setExpandedId] = useState<string | null>(QUICK_WINS_CATALOG[0].id);

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

  const adoptedTotals = useMemo(() => {
    return QUICK_WINS_CATALOG.reduce(
      (acc, act) => {
        if (adoptedActionIds.includes(act.id)) {
          acc.kgYr += act.annualSavingsKg;
          acc.usdYr += act.annualSavingsUsd;
        }
        return acc;
      },
      { kgYr: 0, usdYr: 0 }
    );
  }, [adoptedActionIds]);

  const projectedMonthlyPerPerson = Math.max(
    40,
    computation.perPersonKg - adoptedTotals.kgYr / 12 / Math.max(1, profile.members)
  );
  const parisProgressPct = Math.min(
    100,
    Math.round((PARIS_TARGET_PER_PERSON_KG / Math.max(1, projectedMonthlyPerPerson)) * 100)
  );

  const filteredActions =
    difficultyFilter === 'All'
      ? QUICK_WINS_CATALOG
      : QUICK_WINS_CATALOG.filter((a) => a.difficulty === difficultyFilter);

  const forecastTrees = Math.round(
    (adoptedTotals.kgYr * forecastYears) / TREE_ABSORPTION_KG_PER_YEAR
  );
  const forecastCurrencyUsd = adoptedTotals.usdYr * forecastYears;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)]">
          Household Abatement Roadmap · {adoptedActionIds.length} Actions Adopted
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
          Quick Wins &amp; Impact Forecaster
        </h1>
      </div>

      {/* Live Abatement Ticker + Paris Target Progress + Forecaster */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bento-card rounded-2xl p-6 flex flex-col justify-between gap-4 bg-[#132a26] text-white">
          <div>
            <p className="text-xs font-mono text-[#fcd34d]">LIVE ABATEMENT TICKER</p>
            <h2 className="text-lg font-bold mt-1">Committed Annual Reduction</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <AnimatedCounter
                value={
                  profile.unitSystem === 'metric'
                    ? adoptedTotals.kgYr
                    : adoptedTotals.kgYr * 2.20462
                }
                decimals={0}
                suffix={profile.unitSystem === 'metric' ? ' kg/yr' : ' lbs/yr'}
                className="text-2xl sm:text-3xl font-extrabold text-[#fcd34d]"
              />
              <p className="text-xs text-emerald-100/75 mt-1">CO₂e abated annually</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300">
                {formatCurrencyFromUsd(adoptedTotals.usdYr, profile.currency)}
              </p>
              <p className="text-xs text-emerald-100/75 mt-1">Estimated annual utility savings</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-emerald-100/80">Paris 1.5°C Alignment After Actions</span>
              <span className="font-mono font-bold text-[#fcd34d]">{parisProgressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#fcd34d] transition-all duration-500"
                style={{ width: `${parisProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bento-card rounded-2xl p-6 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Multi-Year Horizon</p>
              <h2 className="text-lg font-bold mt-0.5">Interactive Impact Forecaster</h2>
            </div>
            <span className="font-mono text-sm font-bold text-[var(--accent-secondary)]">
              {forecastYears} {forecastYears === 1 ? 'Year' : 'Years'}
            </span>
          </div>

          <div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={forecastYears}
              onChange={(e) => setForecastYears(Number(e.target.value))}
              className="w-full cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)] mt-1">
              <span>1 yr</span>
              <span>5 yrs</span>
              <span>10 yrs</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)]">
              <p className="text-xs text-[var(--text-muted)]">Cumulative CO₂e Saved</p>
              <p className="text-lg font-bold font-mono mt-1">
                {formatMass(adoptedTotals.kgYr * forecastYears, profile.unitSystem, 0)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)]">
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <Trees className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mature Trees Equivalent</span>
              </p>
              <AnimatedCounter
                value={forecastTrees}
                suffix=" trees"
                className="text-lg font-bold mt-1 block"
              />
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)]">
              <p className="text-xs text-[var(--text-muted)]">Household Cash Retained</p>
              <p className="text-lg font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                {formatCurrencyFromUsd(forecastCurrencyUsd, profile.currency)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filterable Action Catalog */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">Actionable Household Guides</h2>
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            {(['All', 'Zero Cost', 'Low Cost', 'Upgrade'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setDifficultyFilter(tier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap btn-press ${
                  difficultyFilter === tier
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActions.map((action) => {
            const adopted = adoptedActionIds.includes(action.id);
            const expanded = expandedId === action.id;
            const streamMeta = action.category !== 'all' ? STREAM_META[action.category] : null;

            return (
              <div
                key={action.id}
                className={`bento-card rounded-2xl p-5 flex flex-col justify-between gap-4 ${
                  adopted ? 'border-emerald-500/45 bg-[var(--accent-soft)]' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">
                        {streamMeta ? `${streamMeta.emoji} ${streamMeta.label}` : 'All Streams'} ·{' '}
                        {action.difficulty}
                      </p>
                      <h3 className="text-base font-bold leading-snug">{action.title}</h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleAdoptedAction(action.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 btn-press ${
                        adopted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-[var(--text-primary)]'
                      }`}
                    >
                      {adopted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Adopted</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5" />
                          <span>Adopt</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-2.5 leading-relaxed">
                    {action.summary}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border-subtle)]">
                    <div className="font-mono">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        -{formatMass(action.annualSavingsKg, profile.unitSystem, 0)}/yr
                      </span>
                      <span className="mx-2 text-[var(--text-muted)]">·</span>
                      <span className="font-semibold">
                        {formatCurrencyFromUsd(action.annualSavingsUsd, profile.currency)}/yr
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : action.id)}
                      className="text-xs font-semibold text-[var(--accent-secondary)] flex items-center gap-1"
                    >
                      <span>3-Step Guide</span>
                      {expanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {expanded && (
                    <ol className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs text-[var(--text-secondary)]">
                      {action.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-mono font-bold text-[var(--accent-secondary)] shrink-0">
                            0{idx + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Google Maps Grounding Locator for local EV, solar, compost & transit */}
      <LocalEcoHubLocator />
    </div>
  );
};
