import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Edit3, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { CarbonAudit } from '../types/carbon';
import { REGIONAL_PRESETS, formatMass } from '../utils/calculations';
import { AuditInspectModal } from '../components/AuditInspectModal';

export const HistoryPage: React.FC = () => {
  const { audits, profile, deleteAuditWithUndo, deleteAllAudits, setActiveMonth } = useEcoTrack();
  const [search, setSearch] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<CarbonAudit | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...audits].reverse();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.month.includes(q) ||
        (a.notes || '').toLowerCase().includes(q)
    );
  }, [audits, search]);

  const handleExportCsv = () => {
    if (audits.length === 0) return;
    const headers = [
      'Month',
      'Label',
      'Region',
      'Members',
      'SolarOffsetPct',
      'Electricity_kWh',
      'LPG_kg',
      'Petrol_L',
      'Diesel_L',
      'AirTravel_km',
      'PNG_m3',
      'Water_m3',
      'Waste_kg',
      'Compost_kg',
      'Total_kg_CO2e',
      'Notes',
    ];
    const rows = audits.map((a) =>
      [
        a.month,
        `"${a.label.replace(/"/g, '""')}"`,
        a.regionId,
        a.members,
        a.solarOffsetPct,
        a.electricityKwh,
        a.lpgKg,
        a.petrolL,
        a.dieselL,
        a.airTravelKm,
        a.pngM3,
        a.waterM3,
        a.wasteKg,
        a.compostKg,
        a.totalKgCo2e,
        `"${(a.notes || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ecotrack-v22-audits-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">
            {audits.length} Stored Billing {audits.length === 1 ? 'Cycle' : 'Cycles'} · 10-Second Undo Recovery
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
            Household Audit History
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          {audits.length > 0 && (
            <>
              {!confirmClearAll ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="h-10 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 whitespace-nowrap btn-press"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <button
                    type="button"
                    onClick={() => {
                      deleteAllAudits();
                      setConfirmClearAll(false);
                      setSearch('');
                    }}
                    className="h-8 px-3 rounded-lg bg-rose-600 text-white text-xs font-bold whitespace-nowrap btn-press"
                  >
                    Confirm Delete All
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="h-8 px-2.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleExportCsv}
                className="h-10 px-4 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-semibold flex items-center gap-2 whitespace-nowrap btn-press"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Ledger</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bento-card rounded-2xl p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by month, label, or notes..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                <th className="py-3 pr-3 font-medium">Cycle</th>
                <th className="py-3 px-3 font-medium">Grid &amp; Solar</th>
                <th className="py-3 px-3 font-medium text-right">Power (kWh)</th>
                <th className="py-3 px-3 font-medium text-right">Total CO₂e</th>
                <th className="py-3 px-3 font-medium text-right">Per Person</th>
                <th className="py-3 pl-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <p className="text-sm font-medium text-[var(--text-muted)]">
                      {audits.length === 0
                        ? 'Your audit history is empty.'
                        : 'No matching monthly audits found.'}
                    </p>
                    {audits.length === 0 && (
                      <Link
                        to="/calculator"
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-semibold btn-press"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log Monthly Audit</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-surface-alt)] transition-colors"
                  >
                    <td className="py-3.5 pr-3">
                      <button
                        type="button"
                        onClick={() => setActiveMonth(row.month)}
                        className="text-left hover:underline"
                      >
                        <span className="font-semibold block">{row.label}</span>
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          {row.month}
                        </span>
                      </button>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-[var(--text-secondary)]">
                      {REGIONAL_PRESETS[row.regionId]?.shortName || row.regionId} ·{' '}
                      <span className="font-mono">{row.solarOffsetPct}% solar</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      {row.electricityKwh}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold">
                      {formatMass(row.totalKgCo2e, profile.unitSystem)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                      {formatMass(row.totalKgCo2e / Math.max(1, row.members), profile.unitSystem)}
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAudit(row);
                            setEditMode(false);
                          }}
                          title="Inspect"
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] btn-press"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAudit(row);
                            setEditMode(true);
                          }}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--accent-secondary)] btn-press"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAuditWithUndo(row.id)}
                          title="Delete"
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

      <AuditInspectModal
        audit={selectedAudit}
        initialEditMode={editMode}
        onClose={() => setSelectedAudit(null)}
      />
    </div>
  );
};
