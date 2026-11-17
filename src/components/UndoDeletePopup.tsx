import React, { useEffect, useState } from 'react';
import { RotateCcw, Trash2, X } from 'lucide-react';
import { MonthlyAuditRecord, carbonApi } from '../services/carbonApi';
import { playUiSound } from '../utils/soundEffects';

interface UndoDeletePopupProps {
  deletedRecord: MonthlyAuditRecord | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoDeletePopup: React.FC<UndoDeletePopupProps> = ({
  deletedRecord,
  onUndo,
  onDismiss,
}) => {
  const [remainingMs, setRemainingMs] = useState<number>(10000);

  useEffect(() => {
    if (!deletedRecord) return;
    setRemainingMs(10000);
    const start = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, 10000 - elapsed);
      setRemainingMs(left);
      if (left <= 0) {
        window.clearInterval(timer);
        carbonApi.purgeDeletedRecord(deletedRecord.id);
        onDismiss();
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [deletedRecord, onDismiss]);

  // Keyboard Ctrl+Z / Cmd+Z listener while popup is active
  useEffect(() => {
    if (!deletedRecord) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        playUiSound('ding');
        onUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deletedRecord, onUndo]);

  if (!deletedRecord) return null;

  const secondsLeft = Math.ceil(remainingMs / 1000);

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-gray-900/95 backdrop-blur-xl text-white border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden animate-slide-up-popup"
    >
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              Record for {deletedRecord.label} deleted
            </div>
            <div className="text-[11px] font-mono text-emerald-300/90 truncate mt-0.5">
              {deletedRecord.result.totalKgCO2e} kg CO₂e · {secondsLeft}s left (Ctrl+Z)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              playUiSound('ding');
              onUndo();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl transition-all whitespace-nowrap shrink-0 animate-undo-pulse"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            UNDO
          </button>
          <button
            type="button"
            onClick={() => {
              carbonApi.purgeDeletedRecord(deletedRecord.id);
              onDismiss();
            }}
            aria-label="Dismiss undo notification"
            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 10-second shrinkWidth countdown progress bar */}
      <div className="h-1.5 w-full bg-gray-800">
        <div
          key={deletedRecord.id}
          className="h-full bg-gradient-to-r from-emerald-400 to-[#fcd34d] animate-shrink-bar"
        />
      </div>
    </div>
  );
};
