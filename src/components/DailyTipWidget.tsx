import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { DAILY_HABITS, STREAM_META, formatMass } from '../utils/calculations';
import { AnimatedCounter } from './AnimatedCounter';

export const DailyTipWidget: React.FC = () => {
  const { completedHabits, toggleHabit, profile } = useEcoTrack();

  const dailySavedKg = DAILY_HABITS.reduce(
    (sum, item) => (completedHabits.includes(item.id) ? sum + item.impactKgDay : sum),
    0
  );

  return (
    <div className="bento-card rounded-2xl p-6 flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
            Daily Action Check-In
          </p>
          <h3 className="text-lg font-bold tracking-tight">Sustainable Habit Checklist</h3>
        </div>
        <div className="text-right">
          <AnimatedCounter
            value={profile.unitSystem === 'metric' ? dailySavedKg : dailySavedKg * 2.20462}
            decimals={1}
            suffix={profile.unitSystem === 'metric' ? ' kg' : ' lbs'}
            className="text-base font-bold text-emerald-600 dark:text-emerald-400"
          />
          <p className="text-[11px] text-[var(--text-muted)]">saved today</p>
        </div>
      </div>

      <div className="space-y-2">
        {DAILY_HABITS.map((habit) => {
          const checked = completedHabits.includes(habit.id);
          const stream = STREAM_META[habit.stream];
          return (
            <button
              key={habit.id}
              type="button"
              onClick={() => toggleHabit(habit.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors flex items-center justify-between gap-3 btn-press ${
                checked
                  ? 'bg-[var(--accent-soft)] border-[var(--border-strong)]'
                  : 'bg-[var(--bg-surface-alt)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {checked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                )}
                <span
                  className={`text-xs sm:text-sm truncate ${
                    checked
                      ? 'line-through text-[var(--text-muted)]'
                      : 'text-[var(--text-primary)] font-medium'
                  }`}
                >
                  {habit.label}
                </span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] shrink-0">
                {stream.emoji} -{formatMass(habit.impactKgDay, profile.unitSystem, 1)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
