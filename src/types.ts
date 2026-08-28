export interface Break {
  id: string;
  startTime: number; // timestamp
  endTime?: number;  // timestamp (undefined if currently on break)
  type?: 'lunch' | 'rest' | 'other';
}

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD based on local start time
  startTime: number; // timestamp ms
  endTime?: number;  // timestamp ms (undefined if shift is active)
  breaks: Break[];
  notes?: string;
  hourlyRate?: number;
  tags?: string[];
}

export interface TimeclockSettings {
  hourlyRate: number;
  dailyTargetHours: number;
  currency: string;
  overtimeThresholdHours: number;
  autoDeductLunch: boolean;
}

export type TimeclockStatus = 'clocked_out' | 'clocked_in' | 'on_break';

export interface DayWorkSummary {
  date: string; // YYYY-MM-DD
  displayDate: string;
  isToday: boolean;
  isYesterday: boolean;
  totalDurationMs: number; // net work time excluding breaks
  totalBreakDurationMs: number;
  shiftCount: number;
  shifts: Shift[];
  regularHours: number;
  overtimeHours: number;
  estimatedEarnings: number;
}
