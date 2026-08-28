import { Shift, Break, DayWorkSummary, TimeclockSettings } from '../types';

/**
 * Format a Date or timestamp to YYYY-MM-DD in local time
 */
export function formatLocalDateKey(dateOrTimestamp: Date | number): string {
  const d = typeof dateOrTimestamp === 'number' ? new Date(dateOrTimestamp) : dateOrTimestamp;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format timestamp to Finnish 24h readable time: e.g. "08:30" or "17:15"
 */
export function formatTime(timestamp?: number, includeSeconds = false): string {
  if (!timestamp) return '--:--';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('fi-FI', {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
  });
}

/**
 * Format timestamp to friendly Finnish date: e.g. "ke 27.8.2026" or "Keskiviikko 27.8.2026"
 */
export function formatFriendlyDate(dateKeyOrTimestamp: string | number): string {
  let d: Date;
  if (typeof dateKeyOrTimestamp === 'string') {
    const [y, m, day] = dateKeyOrTimestamp.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(dateKeyOrTimestamp);
  }
  
  const weekday = d.toLocaleDateString('fi-FI', { weekday: 'short' });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const dateStr = d.toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  return `${capitalizedWeekday} ${dateStr}`;
}

/**
 * Calculate net duration (in ms) of a shift up to a given current timestamp
 */
export function calculateShiftDurationMs(shift: Shift, now: number = Date.now()): number {
  const start = shift.startTime;
  const end = shift.endTime ?? now;
  if (end < start) return 0;

  const totalElapsed = end - start;

  // Subtract breaks
  let breakDuration = 0;
  if (shift.breaks && shift.breaks.length > 0) {
    for (const b of shift.breaks) {
      const bStart = b.startTime;
      const bEnd = b.endTime ?? (shift.endTime ? shift.endTime : now);
      if (bEnd > bStart) {
        breakDuration += (bEnd - bStart);
      }
    }
  }

  return Math.max(0, totalElapsed - breakDuration);
}

/**
 * Calculate total break duration (in ms) of a shift
 */
export function calculateBreakDurationMs(shift: Shift, now: number = Date.now()): number {
  let breakDuration = 0;
  if (shift.breaks && shift.breaks.length > 0) {
    for (const b of shift.breaks) {
      const bStart = b.startTime;
      const bEnd = b.endTime ?? (shift.endTime ? shift.endTime : now);
      if (bEnd > bStart) {
        breakDuration += (bEnd - bStart);
      }
    }
  }
  return breakDuration;
}

/**
 * Format milliseconds into HH:MM:SS
 */
export function formatDurationDigital(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Format duration in Finnish: "8 t 15 min", "45 min", "30 s"
 */
export function formatDurationHuman(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) {
    const sec = Math.floor(ms / 1000);
    return `${sec} s`;
  }
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} t`;
  }
  return `${hours} t ${minutes} min`;
}

export function msToDecimalHours(ms: number): number {
  return +(ms / (1000 * 60 * 60)).toFixed(2);
}

/**
 * Group all shifts by Date (YYYY-MM-DD) and compute daily aggregates
 */
export function groupShiftsByDay(
  shifts: Shift[],
  settings: TimeclockSettings,
  now: number = Date.now()
): DayWorkSummary[] {
  const todayKey = formatLocalDateKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = formatLocalDateKey(yesterdayDate);

  const groups: Record<string, Shift[]> = {};

  for (const shift of shifts) {
    const key = shift.date || formatLocalDateKey(shift.startTime);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(shift);
  }

  // Sort each day's shifts chronologically
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => a.startTime - b.startTime);
  });

  // Convert to summary list sorted descending by date
  const sortedDateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return sortedDateKeys.map(dateKey => {
    const dayShifts = groups[dateKey];
    let totalDurationMs = 0;
    let totalBreakDurationMs = 0;

    for (const shift of dayShifts) {
      totalDurationMs += calculateShiftDurationMs(shift, now);
      totalBreakDurationMs += calculateBreakDurationMs(shift, now);
    }

    const totalHours = msToDecimalHours(totalDurationMs);
    const overtimeThreshold = settings.overtimeThresholdHours || 8;
    const regularHours = Math.min(totalHours, overtimeThreshold);
    const overtimeHours = Math.max(0, totalHours - overtimeThreshold);
    
    // Default hourly rate calculation (1.5x for overtime)
    const rate = settings.hourlyRate || 0;
    const estimatedEarnings = +(
      regularHours * rate +
      overtimeHours * rate * 1.5
    ).toFixed(2);

    return {
      date: dateKey,
      displayDate: formatFriendlyDate(dateKey),
      isToday: dateKey === todayKey,
      isYesterday: dateKey === yesterdayKey,
      totalDurationMs,
      totalBreakDurationMs,
      shiftCount: dayShifts.length,
      shifts: dayShifts,
      regularHours,
      overtimeHours,
      estimatedEarnings,
    };
  });
}

/**
 * Generate CSV string from shifts for timesheet export in Finnish
 */
export function exportShiftsToCSV(shifts: Shift[], settings: TimeclockSettings): string {
  const headers = [
    'Päivämäärä',
    'Aloitusaika',
    'Lopetusaika',
    'Tauot (min)',
    'Työtunnit (h)',
    'Tuntipalkka',
    'Arvioidut ansiot',
    'Muistiinpanot',
  ];

  const rows = shifts.map(s => {
    const dateStr = s.date || formatLocalDateKey(s.startTime);
    const startStr = formatTime(s.startTime);
    const endStr = s.endTime ? formatTime(s.endTime) : 'Käynnissä';
    const breakMs = calculateBreakDurationMs(s);
    const breakMin = Math.round(breakMs / (1000 * 60));
    const netMs = calculateShiftDurationMs(s);
    const netHours = msToDecimalHours(netMs);
    const rate = s.hourlyRate ?? settings.hourlyRate;
    const earnings = +(netHours * rate).toFixed(2);
    const cleanNotes = (s.notes || '').replace(/"/g, '""');

    return [
      dateStr,
      `"${startStr}"`,
      `"${endStr}"`,
      breakMin,
      netHours,
      rate,
      earnings,
      `"${cleanNotes}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
