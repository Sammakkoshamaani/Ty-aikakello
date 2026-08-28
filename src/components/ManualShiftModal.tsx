import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, MessageSquare, Coffee, DollarSign, AlertCircle } from 'lucide-react';
import { Shift, Break } from '../types';
import { formatLocalDateKey } from '../utils/timeUtils';

interface ManualShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveShift: (shift: Shift) => void;
  editingShift: Shift | null;
  defaultHourlyRate: number;
  currency?: string;
  presetDate?: string;
}

export const ManualShiftModal: React.FC<ManualShiftModalProps> = ({
  isOpen,
  onClose,
  onSaveShift,
  editingShift,
  defaultHourlyRate,
  currency = '€',
  presetDate,
}) => {
  const [date, setDate] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | string>(defaultHourlyRate);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (editingShift) {
      const d = new Date(editingShift.startTime);
      setDate(editingShift.date || formatLocalDateKey(d));
      setStartTimeStr(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );

      if (editingShift.endTime) {
        const endD = new Date(editingShift.endTime);
        setEndTimeStr(
          `${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`
        );
      } else {
        setEndTimeStr('');
      }

      // Compute total existing break minutes
      let totalBreakMin = 0;
      if (editingShift.breaks) {
        for (const b of editingShift.breaks) {
          if (b.endTime && b.endTime > b.startTime) {
            totalBreakMin += Math.round((b.endTime - b.startTime) / (1000 * 60));
          }
        }
      }
      setBreakMinutes(totalBreakMin);
      setNotes(editingShift.notes || '');
      setHourlyRate(editingShift.hourlyRate ?? defaultHourlyRate);
    } else {
      // New Shift
      const todayStr = presetDate || formatLocalDateKey(Date.now());
      setDate(todayStr);
      setStartTimeStr('09:00');
      setEndTimeStr('17:00');
      setBreakMinutes(30);
      setNotes('');
      setHourlyRate(defaultHourlyRate);
    }
    setErrorMessage('');
  }, [editingShift, isOpen, defaultHourlyRate, presetDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!date) {
      setErrorMessage('Valitse päivämäärä.');
      return;
    }
    if (!startTimeStr) {
      setErrorMessage('Ilmoita aloitusaika.');
      return;
    }

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [year, month, day] = date.split('-').map(Number);

    const startTimestamp = new Date(year, month - 1, day, startH, startM, 0, 0).getTime();
    let endTimestamp: number | undefined = undefined;

    if (endTimeStr) {
      const [endH, endM] = endTimeStr.split(':').map(Number);
      const calculatedEnd = new Date(year, month - 1, day, endH, endM, 0, 0).getTime();

      // If end time is earlier than start time, reject or flag error
      if (calculatedEnd <= startTimestamp) {
        setErrorMessage('Lopetusajan on oltava aloitusajan jälkeen.');
        return;
      }
      endTimestamp = calculatedEnd;
    }

    const breaks: Break[] = [];
    if (breakMinutes > 0 && endTimestamp) {
      // Create a centered break segment
      const midpoint = startTimestamp + (endTimestamp - startTimestamp) / 2;
      const bDurationMs = breakMinutes * 60 * 1000;
      const bStart = Math.max(startTimestamp, midpoint - bDurationMs / 2);
      const bEnd = Math.min(endTimestamp, bStart + bDurationMs);

      breaks.push({
        id: `brk-${Date.now()}`,
        startTime: bStart,
        endTime: bEnd,
        type: 'lunch',
      });
    }

    const newShift: Shift = {
      id: editingShift ? editingShift.id : `shift-${Date.now()}`,
      date: date,
      startTime: startTimestamp,
      endTime: endTimestamp,
      breaks,
      notes: notes.trim() || undefined,
      hourlyRate: Number(hourlyRate) > 0 ? Number(hourlyRate) : defaultHourlyRate,
    };

    onSaveShift(newShift);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              {editingShift ? 'Muokkaa työvuoroa' : 'Lisää vuoro manuaalisesti'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Vuoron päivämäärä</span>
            </label>
            <input
              id="manual-shift-date-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-all"
            />
          </div>

          {/* Time In & Time Out */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Aloitusaika (Sisään)
              </label>
              <input
                id="manual-shift-start-time-input"
                type="time"
                value={startTimeStr}
                onChange={e => setStartTimeStr(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Lopetusaika (Ulos)
              </label>
              <input
                id="manual-shift-end-time-input"
                type="time"
                value={endTimeStr}
                onChange={e => setEndTimeStr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* Break Duration & Hourly Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                <span>Tauon kesto (min)</span>
              </label>
              <input
                id="manual-shift-break-min-input"
                type="number"
                min="0"
                step="5"
                value={breakMinutes}
                onChange={e => setBreakMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tuntipalkka ({currency})</span>
              </label>
              <input
                id="manual-shift-rate-input"
                type="number"
                min="0"
                step="0.50"
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Muistiinpanot / Työtehtävät (valinnainen)</span>
            </label>
            <textarea
              id="manual-shift-notes-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="esim. Projektipalaveri, asiakasesitys, huoltotyöt..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              Peruuta
            </button>
            <button
              id="save-manual-shift-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              {editingShift ? 'Tallenna muutokset' : 'Lisää vuoro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
