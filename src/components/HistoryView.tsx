import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  Download,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Coffee,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Shift, TimeclockSettings, DayWorkSummary } from '../types';
import {
  formatFriendlyDate,
  formatTime,
  formatDurationHuman,
  calculateShiftDurationMs,
  calculateBreakDurationMs,
  msToDecimalHours,
  exportShiftsToCSV,
} from '../utils/timeUtils';

interface HistoryViewProps {
  daySummaries: DayWorkSummary[];
  allShifts: Shift[];
  settings: TimeclockSettings;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onAddManualShift: (presetDate?: string) => void;
  onResetSeedData: () => void;
}

type FilterRange = 'all' | 'this_week' | 'last_week' | 'this_month';

export const HistoryView: React.FC<HistoryViewProps> = ({
  daySummaries,
  allShifts,
  settings,
  onEditShift,
  onDeleteShift,
  onAddManualShift,
  onResetSeedData,
}) => {
  const [filterRange, setFilterRange] = useState<FilterRange>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // Filter out "Today" to strictly show "all other days you have worked" in History view
  const historyDays = useMemo(() => {
    return daySummaries.filter(day => !day.isToday);
  }, [daySummaries]);

  // Apply range filtering and search query
  const filteredDays = useMemo(() => {
    const now = new Date();

    return historyDays.filter(daySummary => {
      const [y, m, d] = daySummary.date.split('-').map(Number);
      const dayDate = new Date(y, m - 1, d);
      const dayTime = dayDate.getTime();

      // Range Filter
      if (filterRange === 'this_week') {
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Finnish monday=1..sunday=7
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);
        if (dayTime < startOfWeek.getTime()) return false;
      } else if (filterRange === 'last_week') {
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - (dayOfWeek - 1) - 7);
        startOfLastWeek.setHours(0, 0, 0, 0);
        const endOfLastWeek = new Date(now);
        endOfLastWeek.setDate(now.getDate() - (dayOfWeek - 1));
        endOfLastWeek.setHours(0, 0, 0, 0);
        if (dayTime < startOfLastWeek.getTime() || dayTime >= endOfLastWeek.getTime()) return false;
      } else if (filterRange === 'this_month') {
        if (dayDate.getMonth() !== now.getMonth() || dayDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const dateMatch = daySummary.displayDate.toLowerCase().includes(query) || daySummary.date.includes(query);
        const notesMatch = daySummary.shifts.some(s => (s.notes || '').toLowerCase().includes(query));
        if (!dateMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [historyDays, filterRange, searchQuery]);

  // Aggregate stats for filtered history
  const stats = useMemo(() => {
    let totalMs = 0;
    let totalBreaksMs = 0;
    let totalEarnings = 0;

    for (const day of filteredDays) {
      totalMs += day.totalDurationMs;
      totalBreaksMs += day.totalBreakDurationMs;
      totalEarnings += day.estimatedEarnings;
    }

    const totalHours = msToDecimalHours(totalMs);
    const avgDailyHours = filteredDays.length > 0 ? +(totalHours / filteredDays.length).toFixed(1) : 0;

    return {
      totalHours,
      totalBreaksMs,
      totalEarnings,
      daysCount: filteredDays.length,
      avgDailyHours,
    };
  }, [filteredDays]);

  const toggleDayExpanded = (dateKey: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateKey]: prev[dateKey] === undefined ? false : !prev[dateKey],
    }));
  };

  const handleExportCSV = () => {
    const shiftsToExport = filteredDays.flatMap(d => d.shifts);
    const csvContent = exportShiftsToCSV(shiftsToExport.length > 0 ? shiftsToExport : allShifts, settings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tyoaikahistoria-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* History Header Banner with Summary Stats */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Työhistoria</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                Aiemmat työpäivät
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tarkastele aiempia työvuoroja, päivittäisiä tunteja, taukoja ja ansaittuja palkkioita.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="history-export-csv-btn"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Lataa tuntikirjaus CSV-muodossa"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vie CSV-tiedosto</span>
            </button>
            <button
              id="history-add-missed-shift-btn"
              onClick={() => onAddManualShift()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lisää mennyt vuoro</span>
            </button>
          </div>
        </div>

        {/* History Stats KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tunnit yhteensä
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-0.5">
              {stats.totalHours.toString().replace('.', ',')} <span className="text-xs font-sans text-slate-500 font-normal">h</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Työpäiviä
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-0.5">
              {stats.daysCount} <span className="text-xs font-sans text-slate-500 font-normal">pv</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Palkkio yhteensä
            </span>
            <div className="text-lg sm:text-xl font-bold text-emerald-700 font-mono mt-0.5">
              {stats.totalEarnings.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {settings.currency}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Päiväkeskiarvo
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-0.5">
              {stats.avgDailyHours.toString().replace('.', ',')} <span className="text-xs font-sans text-slate-500 font-normal">h / pv</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'Kaikki päivät' },
              { id: 'this_week', label: 'Tämä viikko' },
              { id: 'last_week', label: 'Viime viikko' },
              { id: 'this_month', label: 'Tämä kuukausi' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              id={`filter-history-${tab.id}-btn`}
              onClick={() => setFilterRange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterRange === tab.id
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Hae päivällä, merkinnällä..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* History Day Cards List */}
      {filteredDays.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Ei aiempia työvuoroja löytynyt</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? 'Hakuehtoja vastaavia aiempia työvuoroja ei löytynyt.'
              : 'Muilta päiviltä ei ole vielä tallennettuja työvuoroja.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              id="history-empty-add-shift-btn"
              onClick={() => onAddManualShift()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              + Lisää mennyt vuoro
            </button>
            <button
              id="history-empty-seed-btn"
              onClick={onResetSeedData}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lataa esimerkkidata</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDays.map(day => {
            const isExpanded = expandedDays[day.date] !== false; // default expanded
            const decimalHrs = msToDecimalHours(day.totalDurationMs);
            const dayDate = new Date(day.date + 'T00:00:00');
            const weekday = dayDate.toLocaleDateString('fi-FI', { weekday: 'short' });
            const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

            return (
              <div
                key={day.date}
                id={`history-day-card-${day.date}`}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] transition-colors"
              >
                {/* Day Card Header / Summary Row */}
                <div
                  onClick={() => toggleDayExpanded(day.date)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none bg-white hover:bg-slate-50/70 transition-colors"
                >
                  {/* Left: Date & Badges */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-700 shrink-0">
                      <span className="text-[10px] font-bold uppercase text-emerald-700">
                        {capitalizedWeekday}
                      </span>
                      <span className="text-sm font-extrabold font-mono leading-none">
                        {dayDate.getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">
                          {formatFriendlyDate(day.date)}
                        </h3>
                        {day.isYesterday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Eilen
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-mono">
                          ({day.shiftCount} {day.shiftCount === 1 ? 'vuoro' : 'vuoroa'})
                        </span>
                      </div>

                      {/* Break & OT badges */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        {day.totalBreakDurationMs > 0 && (
                          <span className="flex items-center gap-1 text-amber-700 font-mono text-[11px] font-medium">
                            <Coffee className="w-3 h-3" />
                            {formatDurationHuman(day.totalBreakDurationMs)} tauot
                          </span>
                        )}
                        {day.overtimeHours > 0 && (
                          <span className="text-purple-700 font-bold text-[11px]">
                            +{day.overtimeHours.toFixed(1).replace('.', ',')} h ylityö
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Total Daily Hours, Earnings & Chevron */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="flex items-baseline gap-1.5 sm:justify-end">
                        <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
                          {formatDurationHuman(day.totalDurationMs)}
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-medium">
                          ({decimalHrs.toString().replace('.', ',')} h)
                        </span>
                      </div>
                      <div className="text-xs text-emerald-700 font-mono font-semibold">
                        {day.estimatedEarnings.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {settings.currency}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAddManualShift(day.date);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                        title="Lisää toinen vuoro tälle päivälle"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-slate-400 hover:text-slate-700 p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Shift Details for this Day */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-2.5">
                    {day.shifts.map((shift, sIdx) => {
                      const shiftDurationMs = calculateShiftDurationMs(shift);
                      const breakDurationMs = calculateBreakDurationMs(shift);
                      const shiftHours = msToDecimalHours(shiftDurationMs);
                      const rate = shift.hourlyRate ?? settings.hourlyRate;
                      const earnings = +(shiftHours * rate).toFixed(2);

                      return (
                        <div
                          key={shift.id}
                          id={`history-shift-row-${shift.id}`}
                          className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-mono text-sm font-semibold text-slate-900">
                              <span className="text-slate-400 text-xs font-normal">
                                #{sIdx + 1}
                              </span>
                              <span>{formatTime(shift.startTime)}</span>
                              <span className="text-slate-400">→</span>
                              <span>{shift.endTime ? formatTime(shift.endTime) : 'Käynnissä'}</span>
                            </div>

                            {/* Notes & Break badges */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {shift.notes ? (
                                <span className="text-slate-700 italic font-medium">"{shift.notes}"</span>
                              ) : (
                                <span className="text-slate-400">Ei merkintää</span>
                              )}
                              {breakDurationMs > 0 && (
                                <span className="text-amber-700 font-mono text-[11px] flex items-center gap-1 font-medium">
                                  <Coffee className="w-3 h-3" />
                                  Tauko: {formatDurationHuman(breakDurationMs)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            <div className="text-right">
                              <div className="font-mono text-sm font-bold text-slate-900">
                                {formatDurationHuman(shiftDurationMs)}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono font-medium">
                                {earnings.toFixed(2).replace('.', ',')} {settings.currency} ({rate} {settings.currency}/h)
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                id={`history-edit-shift-${shift.id}`}
                                onClick={() => onEditShift(shift)}
                                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                                title="Muokkaa vuoroa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`history-delete-shift-${shift.id}`}
                                onClick={() => onDeleteShift(shift.id)}
                                className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                                title="Poista vuoro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
