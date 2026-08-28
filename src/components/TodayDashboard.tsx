import React from 'react';
import { Clock, Coffee, DollarSign, Calendar, Edit2, Trash2, CheckCircle2, TrendingUp } from 'lucide-react';
import { Shift, TimeclockSettings, DayWorkSummary } from '../types';
import {
  formatTime,
  formatDurationHuman,
  calculateShiftDurationMs,
  calculateBreakDurationMs,
  msToDecimalHours,
} from '../utils/timeUtils';

interface TodayDashboardProps {
  todaySummary: DayWorkSummary | null;
  todayShifts: Shift[];
  settings: TimeclockSettings;
  activeShift: Shift | null;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onAddManualShift: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  todaySummary,
  todayShifts,
  settings,
  activeShift,
  onEditShift,
  onDeleteShift,
  onAddManualShift,
}) => {
  const totalWorkedMs = todaySummary ? todaySummary.totalDurationMs : 0;
  const totalBreakMs = todaySummary ? todaySummary.totalBreakDurationMs : 0;
  const totalDecimalHours = msToDecimalHours(totalWorkedMs);

  const targetHours = settings.dailyTargetHours || 8;
  const progressPercent = Math.min(100, Math.round((totalDecimalHours / targetHours) * 100));

  const regularHours = Math.min(totalDecimalHours, settings.overtimeThresholdHours || 8);
  const overtimeHours = Math.max(0, totalDecimalHours - (settings.overtimeThresholdHours || 8));
  const rate = settings.hourlyRate || 0;
  const totalEarnings = +(regularHours * rate + overtimeHours * rate * 1.5).toFixed(2);

  const completedShiftsCount = todayShifts.filter(s => s.endTime).length;
  const hasActiveShift = !!activeShift;

  return (
    <div className="space-y-6">
      {/* Top Banner: Total Hours Worked Today Hero Block */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
        {/* Soft background ambient gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/50 via-teal-50/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Päivän yhteenveto
              </span>
              <span className="text-slate-500 text-xs font-medium">
                Tavoite: {targetHours} h työpäivä
              </span>
            </div>
            
            <h2 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
              Tänään tehdyt työtunnit yhteensä
            </h2>

            <div className="flex items-baseline gap-3">
              <span
                id="today-total-hours-display"
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 font-mono tracking-tight"
              >
                {formatDurationHuman(totalWorkedMs)}
              </span>
              <span className="text-lg sm:text-xl font-mono text-slate-500 font-semibold">
                ({totalDecimalHours.toString().replace('.', ',')} h)
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {progressPercent >= 100 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Päivätavoite saavutettu! {overtimeHours > 0 ? `(+${overtimeHours.toFixed(2).replace('.', ',')} h ylityötä)` : ''}
                </span>
              ) : (
                <span>
                  {(targetHours - totalDecimalHours).toFixed(2).replace('.', ',')} tuntia jäljellä tavoitteeseen ({targetHours} h)
                </span>
              )}
            </p>
          </div>

          {/* Progress Bar & Goal Status */}
          <div className="w-full lg:w-72 bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-600 font-semibold">Tavoitteen edistyminen</span>
              <span className="text-emerald-700 font-mono font-bold text-sm">{progressPercent}%</span>
            </div>
            {/* Progress Bar Container */}
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent >= 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-2.5">
              <span>0 h</span>
              <span>{targetHours / 2} h</span>
              <span className="font-semibold text-slate-700">{targetHours} h Tavoite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Work Time */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-300 transition-all shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tehollinen työaika</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {formatDurationHuman(totalWorkedMs)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {hasActiveShift ? 'Aktiivinen seuranta käynnissä' : `${todayShifts.length} kirjausta tänään`}
          </p>
        </div>

        {/* Card 2: Breaks Taken */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-300 transition-all shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pidetyt tauot</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {formatDurationHuman(totalBreakMs)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {todayShifts.reduce((acc, s) => acc + (s.breaks?.length || 0), 0)} taukojaksoa
          </p>
        </div>

        {/* Card 3: Estimated Earnings */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-300 transition-all shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Päivän ansio</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalEarnings.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {settings.currency}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Palkkiolla {rate} {settings.currency}/h {overtimeHours > 0 ? '(sis. 1,5x ylityö)' : ''}
          </p>
        </div>

        {/* Card 4: Shifts Count */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-300 transition-all shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Vuorojen määrä</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {todayShifts.length} <span className="text-xs text-slate-500 font-sans font-medium">vuoroa</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {completedShiftsCount} päätetty {hasActiveShift ? '+ 1 aktiivinen' : ''}
          </p>
        </div>
      </div>

      {/* Today's Shift Logs / Breakdown */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-[0_2px_16px_-3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Tämän päivän työvuorot</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Päivän leimaukset, aikaleimat ja taukoerittelyt
            </p>
          </div>

          <button
            id="today-add-shift-btn"
            onClick={onAddManualShift}
            className="text-xs px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            + Lisää vuoro
          </button>
        </div>

        {todayShifts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Ei vielä kirjattuja työvuoroja tälle päivälle</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Paina yllä olevaa <strong className="text-emerald-700">"ALOITA VUORO"</strong> -painiketta aloittaaksesi työajan seurannan tai lisää vuoro käsin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayShifts.map((shift, idx) => {
              const isActive = !shift.endTime;
              const shiftDurationMs = calculateShiftDurationMs(shift);
              const breakDurationMs = calculateBreakDurationMs(shift);
              const decimalHrs = msToDecimalHours(shiftDurationMs);
              const shiftEarnings = +(decimalHrs * (shift.hourlyRate || rate)).toFixed(2);

              return (
                <div
                  key={shift.id}
                  id={`today-shift-row-${shift.id}`}
                  className={`border rounded-xl p-4 transition-colors ${
                    isActive
                      ? 'bg-emerald-50/60 border-emerald-300/80 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Shift Punch Times */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          #{todayShifts.length - idx}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-semibold text-slate-900">
                          <span>{formatTime(shift.startTime)}</span>
                          <span className="text-slate-400">→</span>
                          {isActive ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Käynnissä nyt
                            </span>
                          ) : (
                            <span>{formatTime(shift.endTime)}</span>
                          )}
                        </div>

                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                            Käynnissä
                          </span>
                        )}
                      </div>

                      {/* Notes / Breaks summary */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {shift.notes && (
                          <span className="italic text-slate-700 font-medium">
                            "{shift.notes}"
                          </span>
                        )}
                        {breakDurationMs > 0 && (
                          <span className="flex items-center gap-1 text-amber-700 font-mono font-medium">
                            <Coffee className="w-3 h-3" />
                            Tauko: {formatDurationHuman(breakDurationMs)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Duration, Earnings & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-right">
                        <div className="font-mono text-sm sm:text-base font-bold text-slate-900">
                          {formatDurationHuman(shiftDurationMs)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono font-medium">
                          {shiftEarnings.toFixed(2).replace('.', ',')} {settings.currency}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`edit-shift-btn-${shift.id}`}
                          onClick={() => onEditShift(shift)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                          title="Muokkaa vuoroa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-shift-btn-${shift.id}`}
                          onClick={() => onDeleteShift(shift.id)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                          title="Poista vuoro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
