import React, { useState, useEffect } from 'react';
import { Play, Square, Coffee, Check, MessageSquare, AlertCircle } from 'lucide-react';
import { Shift, TimeclockStatus } from '../types';
import { formatTime, formatDurationDigital, calculateBreakDurationMs } from '../utils/timeUtils';

interface ClockControlsProps {
  status: TimeclockStatus;
  activeShift: Shift | null;
  onStartShift: (notes?: string) => void;
  onEndShift: () => void;
  onToggleBreak: () => void;
  onUpdateShiftNotes: (notes: string) => void;
}

export const ClockControls: React.FC<ClockControlsProps> = ({
  status,
  activeShift,
  onStartShift,
  onEndShift,
  onToggleBreak,
  onUpdateShiftNotes,
}) => {
  const [currentDurationMs, setCurrentDurationMs] = useState(0);
  const [currentBreakDurationMs, setCurrentBreakDurationMs] = useState(0);
  const [initialNote, setInitialNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [activeNoteText, setActiveNoteText] = useState(activeShift?.notes || '');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Sync active shift notes
  useEffect(() => {
    setActiveNoteText(activeShift?.notes || '');
  }, [activeShift?.notes]);

  // Live timer interval for active shift
  useEffect(() => {
    if (!activeShift) {
      setCurrentDurationMs(0);
      setCurrentBreakDurationMs(0);
      return;
    }

    const updateTimers = () => {
      const now = Date.now();
      const elapsedSinceStart = now - activeShift.startTime;
      const totalBreakMs = calculateBreakDurationMs(activeShift, now);
      const netWorkingMs = Math.max(0, elapsedSinceStart - totalBreakMs);

      setCurrentDurationMs(netWorkingMs);
      setCurrentBreakDurationMs(totalBreakMs);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [activeShift, status]);

  const handleStart = () => {
    onStartShift(initialNote.trim() || undefined);
    setInitialNote('');
  };

  const handleEnd = () => {
    setShowEndConfirm(false);
    onEndShift();
  };

  const handleSaveNotes = () => {
    onUpdateShiftNotes(activeNoteText);
    setIsEditingNote(false);
  };

  // Find if currently in an active break
  const activeBreak = activeShift?.breaks.find(b => !b.endTime);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] relative overflow-hidden">
      {/* Decorative top gradient stripe */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

      {/* Subtle modern background glow based on status */}
      <div
        className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none transition-colors duration-700 ${
          status === 'clocked_in'
            ? 'bg-emerald-500'
            : status === 'on_break'
            ? 'bg-amber-500'
            : 'bg-indigo-500'
        }`}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Status, Live Digital Timer & Details */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Vuoron tila
            </span>
            <span className="text-slate-300">•</span>
            {status === 'clocked_out' && (
              <span className="text-xs text-slate-500 font-medium">Valmiina aloittamaan</span>
            )}
            {status === 'clocked_in' && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                Aloitettu klo {formatTime(activeShift?.startTime)}
              </span>
            )}
            {status === 'on_break' && (
              <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                Tauko alkoi klo {formatTime(activeBreak?.startTime)}
              </span>
            )}
          </div>

          {/* Large Digital Timer or Ready Greeting */}
          {status !== 'clocked_out' ? (
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                  {formatDurationDigital(currentDurationMs)}
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600">
                  {status === 'on_break' ? 'Tehollinen työaika' : 'Aktiivinen työaika'}
                </span>
              </div>

              {currentBreakDurationMs > 0 && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-700 font-mono font-medium">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Taukoaika: {formatDurationDigital(currentBreakDurationMs)}</span>
                  {status === 'on_break' && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[11px] uppercase font-bold animate-pulse">
                      Keskeytetty
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Ei aktiivista työvuoroa
              </h2>
              <p className="text-sm text-slate-500 max-w-md">
                Aloita työvuorosi painamalla alla olevaa painiketta aloittaaksesi työtuntien mittauksen.
              </p>
            </div>
          )}

          {/* Shift Notes (Pre-clock in or active shift note) */}
          {status === 'clocked_out' ? (
            <div className="pt-2 max-w-md">
              <div className="relative">
                <input
                  id="start-shift-note-input"
                  type="text"
                  value={initialNote}
                  onChange={e => setInitialNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  placeholder="Tehtävä- tai projektimerkintä (valinnainen)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="pt-1">
              {!isEditingNote ? (
                <button
                  id="active-shift-edit-note-btn"
                  onClick={() => setIsEditingNote(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 transition-colors py-1 group cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  <span>
                    {activeShift?.notes ? (
                      <span className="text-slate-700 italic font-medium">"{activeShift.notes}"</span>
                    ) : (
                      <span className="text-slate-500 underline decoration-slate-300 underline-offset-2 hover:decoration-emerald-500">
                        + Lisää merkintä vuorolle
                      </span>
                    )}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2 max-w-md mt-1">
                  <input
                    id="active-shift-note-input"
                    type="text"
                    value={activeNoteText}
                    onChange={e => setActiveNoteText(e.target.value)}
                    placeholder="Kirjoita vuoromerkintä..."
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleSaveNotes()}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    id="save-active-shift-note-btn"
                    onClick={handleSaveNotes}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                    title="Tallenna merkintä"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingNote(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium cursor-pointer"
                  >
                    Peruuta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Clear Big Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3">
          {status === 'clocked_out' ? (
            /* START SHIFT BUTTON */
            <button
              id="start-shift-btn"
              onClick={handleStart}
              className="group relative flex items-center justify-center gap-3 px-8 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-extrabold text-lg sm:text-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-150 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <span className="tracking-tight">ALOITA VUORO</span>
            </button>
          ) : (
            /* ACTIVE CONTROLS (Break & End Shift) */
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              {/* Take Break / Resume Button */}
              <button
                id="toggle-break-btn"
                onClick={onToggleBreak}
                className={`flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-sm sm:text-base border transition-all cursor-pointer ${
                  status === 'on_break'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                }`}
              >
                <Coffee className="w-5 h-5 text-amber-700" />
                <span>{status === 'on_break' ? 'Päätä tauko' : 'Pidä tauko'}</span>
              </button>

              {/* End Shift Button with safety confirm */}
              {!showEndConfirm ? (
                <button
                  id="end-shift-btn"
                  onClick={() => setShowEndConfirm(true)}
                  className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-[0.98] text-white font-bold text-base sm:text-lg shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/25 transition-all cursor-pointer"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>LOPETA VUORO</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-xl shadow-xs">
                  <div className="flex items-center gap-1.5 px-2 text-xs text-rose-800 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Lopetetaanko vuoro?</span>
                  </div>
                  <button
                    id="confirm-end-shift-btn"
                    onClick={handleEnd}
                    className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Kyllä, lopeta
                  </button>
                  <button
                    id="cancel-end-shift-btn"
                    onClick={() => setShowEndConfirm(false)}
                    className="px-2.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Peruuta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
