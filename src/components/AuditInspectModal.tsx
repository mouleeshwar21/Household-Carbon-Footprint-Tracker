import React, { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { CarbonAudit } from '../types/carbon';
import { useEcoTrack } from '../context/EcoTrackContext';
import { STREAM_META, computeAuditBreakdown, formatMass } from '../utils/calculations';

interface AuditInspectModalProps {
  audit: CarbonAudit | null;
  initialEditMode?: boolean;
  onClose: () => void;
}

export const AuditInspectModal: React.FC<AuditInspectModalProps> = ({
  audit,
  initialEditMode = false,
  onClose,
}) => {
  const { profile, upsertAudit } = useEcoTrack();
  const [editMode, setEditMode] = useState(initialEditMode);
  const [draft, setDraft] = useState<CarbonAudit | null>(audit ? { ...audit } : null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(audit ? { ...audit } : null);
    setEditMode(initialEditMode);
  }, [audit, initialEditMode]);

  useEffect(() => {
    if (!audit) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [audit, onClose]);

  if (!audit || !draft) return null;

  const breakdown = computeAuditBreakdown(
    draft,
    draft.regionId,
    draft.members,
    draft.solarOffsetPct,
    profile.unitSystem
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await upsertAudit(draft);
    setSaving(false);
    setEditMode(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-[var(--text-muted)]">{draft.month}</p>
            <h3 className="text-lg font-bold">{draft.label} — Household Audit</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs font-semibold hover:bg-[var(--bg-surface-alt)] btn-press"
            >
              {editMode ? 'View Summary' : 'Edit Entry'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-alt)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)]">
              <p className="text-[11px] text-[var(--text-muted)]">Total CO₂e</p>
              <p className="text-base font-bold font-mono tabular-nums mt-0.5">
                {formatMass(breakdown.totalKgCo2e, profile.unitSystem)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)]">
              <p className="text-[11px] text-[var(--text-muted)]">Per Person</p>
              <p className="text-base font-bold font-mono tabular-nums mt-0.5">
                {formatMass(breakdown.perPersonKg, profile.unitSystem)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)]">
              <p className="text-[11px] text-[var(--text-muted)]">Solar Offset</p>
              <p className="text-base font-bold font-mono tabular-nums mt-0.5">
                {draft.solarOffsetPct}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)]">
              <p className="text-[11px] text-[var(--text-muted)]">Members</p>
              <p className="text-base font-bold font-mono tabular-nums mt-0.5">
                {draft.members}
              </p>
            </div>
          </div>

          {!editMode ? (
            <div className="space-y-2.5">
              {breakdown.streams.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span>{s.emoji}</span>
                    <span className="font-medium">{s.label}</span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      ({s.rawDisplay})
                    </span>
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {formatMass(s.kgCo2e, profile.unitSystem)}
                  </span>
                </div>
              ))}
              {draft.notes && (
                <p className="pt-2 text-xs text-[var(--text-secondary)]">
                  <strong>Notes:</strong> {draft.notes}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  ['electricityKwh', STREAM_META.electricity.label, 'kWh'],
                  ['lpgKg', STREAM_META.lpg.label, 'kg'],
                  ['petrolL', STREAM_META.petrol.label, 'L'],
                  ['dieselL', STREAM_META.diesel.label, 'L'],
                  ['airTravelKm', STREAM_META.airTravel.label, 'km'],
                  ['pngM3', STREAM_META.png.label, 'm³'],
                  ['waterM3', STREAM_META.water.label, 'm³'],
                  ['wasteKg', STREAM_META.waste.label, 'kg'],
                  ['compostKg', 'Composted Organics', 'kg'],
                  ['solarOffsetPct', 'Solar Offset', '%'],
                ] as const
              ).map(([field, label, unit]) => (
                <label key={field} className="block text-xs">
                  <span className="font-medium text-[var(--text-secondary)]">
                    {label} ({unit})
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={Number(draft[field] || 0)}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? { ...prev, [field]: Math.max(0, Number(e.target.value)) } : prev
                      )
                    }
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-sm"
                  />
                </label>
              ))}
              <label className="sm:col-span-2 block text-xs">
                <span className="font-medium text-[var(--text-secondary)]">Audit Notes</span>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={draft.notes || ''}
                  onChange={(e) =>
                    setDraft((prev) => (prev ? { ...prev, notes: e.target.value } : prev))
                  }
                  className="mt-1 w-full p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm"
                />
              </label>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-semibold flex items-center gap-1.5 btn-press"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
