import React, { useState, useEffect, useMemo } from 'react';
import { Shift, TimeclockSettings, TimeclockStatus } from './types';
import { getInitialSeedShifts } from './utils/mockData';
import { groupShiftsByDay, formatLocalDateKey } from './utils/timeUtils';
import { playPunchSound } from './utils/audio';
import { Header } from './components/Header';
import { ClockControls } from './components/ClockControls';
import { TodayDashboard } from './components/TodayDashboard';
import { HistoryView } from './components/HistoryView';
import { ManualShiftModal } from './components/ManualShiftModal';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_SHIFTS_KEY = 'timeclock_shifts_v1';
const STORAGE_SETTINGS_KEY = 'timeclock_settings_v1';

const DEFAULT_SETTINGS: TimeclockSettings = {
  hourlyRate: 22,
  dailyTargetHours: 8,
  currency: '€',
  overtimeThresholdHours: 8,
  autoDeductLunch: false,
};

export default function App() {
  // Load initial settings
  const [settings, setSettings] = useState<TimeclockSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Load shifts (initialize with sample history if empty)
  const [shifts, setShifts] = useState<Shift[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SHIFTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return getInitialSeedShifts();
  });

  const [activeView, setActiveView] = useState<'dashboard' | 'history'>('dashboard');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [presetDateForModal, setPresetDateForModal] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Periodic tick for live dashboard updates
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SHIFTS_KEY, JSON.stringify(shifts));
    } catch {
      // ignore
    }
  }, [shifts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Find currently active shift (if any)
  const activeShift = useMemo(() => {
    return shifts.find(s => !s.endTime) || null;
  }, [shifts]);

  // Compute status
  const status: TimeclockStatus = useMemo(() => {
    if (!activeShift) return 'clocked_out';
    const activeBreak = activeShift.breaks.find(b => !b.endTime);
    if (activeBreak) return 'on_break';
    return 'clocked_in';
  }, [activeShift]);

  // Group all shifts by day
  const daySummaries = useMemo(() => {
    return groupShiftsByDay(shifts, settings, tick);
  }, [shifts, settings, tick]);

  // Today's summary & today's shifts
  const todayKey = formatLocalDateKey(tick);
  const todaySummary = useMemo(() => {
    return daySummaries.find(d => d.date === todayKey) || null;
  }, [daySummaries, todayKey]);

  const todayShifts = useMemo(() => {
    return shifts
      .filter(s => (s.date || formatLocalDateKey(s.startTime)) === todayKey)
      .sort((a, b) => b.startTime - a.startTime); // newest first
  }, [shifts, todayKey]);

  // History days count (days other than today)
  const historyDaysCount = useMemo(() => {
    return daySummaries.filter(d => !d.isToday).length;
  }, [daySummaries]);

  // CLOCK IN / START SHIFT
  const handleStartShift = (notes?: string) => {
    const now = Date.now();
    const newShift: Shift = {
      id: `shift-${now}`,
      date: formatLocalDateKey(now),
      startTime: now,
      breaks: [],
      notes: notes,
      hourlyRate: settings.hourlyRate,
      tags: ['Normaali'],
    };

    setShifts(prev => [newShift, ...prev]);
    playPunchSound('clock_in');
  };

  // CLOCK OUT / END SHIFT
  const handleEndShift = () => {
    if (!activeShift) return;
    const now = Date.now();

    setShifts(prev =>
      prev.map(s => {
        if (s.id === activeShift.id) {
          // If on a break right now, close the break too
          const updatedBreaks = s.breaks.map(b => (!b.endTime ? { ...b, endTime: now } : b));
          return {
            ...s,
            endTime: now,
            breaks: updatedBreaks,
          };
        }
        return s;
      })
    );

    playPunchSound('clock_out');
  };

  // TAKE BREAK / RESUME WORK
  const handleToggleBreak = () => {
    if (!activeShift) return;
    const now = Date.now();
    const isCurrentlyOnBreak = activeShift.breaks.some(b => !b.endTime);

    if (!isCurrentlyOnBreak) {
      // Start new break
      playPunchSound('break_start');
      setShifts(prev =>
        prev.map(s => {
          if (s.id === activeShift.id) {
            return {
              ...s,
              breaks: [
                ...s.breaks,
                {
                  id: `brk-${now}`,
                  startTime: now,
                  type: 'rest',
                },
              ],
            };
          }
          return s;
        })
      );
    } else {
      // End active break
      playPunchSound('break_end');
      setShifts(prev =>
        prev.map(s => {
          if (s.id === activeShift.id) {
            return {
              ...s,
              breaks: s.breaks.map(b => (!b.endTime ? { ...b, endTime: now } : b)),
            };
          }
          return s;
        })
      );
    }
  };

  // UPDATE LIVE SHIFT NOTE
  const handleUpdateActiveShiftNotes = (notes: string) => {
    if (!activeShift) return;
    setShifts(prev =>
      prev.map(s => (s.id === activeShift.id ? { ...s, notes: notes.trim() || undefined } : s))
    );
  };

  // SAVE MANUAL / EDITED SHIFT
  const handleSaveManualShift = (savedShift: Shift) => {
    setShifts(prev => {
      const exists = prev.some(s => s.id === savedShift.id);
      if (exists) {
        return prev.map(s => (s.id === savedShift.id ? savedShift : s));
      }
      return [savedShift, ...prev];
    });
  };

  // DELETE SHIFT
  const handleDeleteShift = (shiftId: string) => {
    if (window.confirm('Haluatko varmasti poistaa tämän työvuoron?')) {
      setShifts(prev => prev.filter(s => s.id !== shiftId));
    }
  };

  // OPEN MANUAL MODAL FOR ADD
  const handleOpenAddModal = (presetDate?: string) => {
    setEditingShift(null);
    setPresetDateForModal(presetDate);
    setIsManualModalOpen(true);
  };

  // OPEN MANUAL MODAL FOR EDIT
  const handleOpenEditModal = (shiftToEdit: Shift) => {
    setEditingShift(shiftToEdit);
    setPresetDateForModal(undefined);
    setIsManualModalOpen(true);
  };

  // RESET SAMPLE DATA
  const handleResetSampleData = () => {
    const seed = getInitialSeedShifts();
    setShifts(seed);
  };

  // CLEAR ALL DATA
  const handleClearAllData = () => {
    setShifts([]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Application Header with Navigation & Live Clock */}
      <Header
        status={status}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAddShift={() => handleOpenAddModal()}
        historyCount={historyDaysCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Clock In / Clock Out Prominent Controls */}
        <ClockControls
          status={status}
          activeShift={activeShift}
          onStartShift={handleStartShift}
          onEndShift={handleEndShift}
          onToggleBreak={handleToggleBreak}
          onUpdateShiftNotes={handleUpdateActiveShiftNotes}
        />

        {/* View Selection: Today's Dashboard vs History */}
        {activeView === 'dashboard' ? (
          <TodayDashboard
            todaySummary={todaySummary}
            todayShifts={todayShifts}
            settings={settings}
            activeShift={activeShift}
            onEditShift={handleOpenEditModal}
            onDeleteShift={handleDeleteShift}
            onAddManualShift={() => handleOpenAddModal(todayKey)}
          />
        ) : (
          <HistoryView
            daySummaries={daySummaries}
            allShifts={shifts}
            settings={settings}
            onEditShift={handleOpenEditModal}
            onDeleteShift={handleDeleteShift}
            onAddManualShift={presetDate => handleOpenAddModal(presetDate)}
            onResetSeedData={handleResetSampleData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-sm py-6 text-center text-xs text-slate-500">
        <p className="max-w-md mx-auto font-medium">
          Työaikakello • Reaaliaikainen työajanseuranta ja kattava työhistoria.
        </p>
      </footer>

      {/* Manual / Missed Shift Modal */}
      <ManualShiftModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingShift(null);
        }}
        onSaveShift={handleSaveManualShift}
        editingShift={editingShift}
        defaultHourlyRate={settings.hourlyRate}
        currency={settings.currency}
        presetDate={presetDateForModal}
      />

      {/* Settings & Hourly Rate Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onResetSeedData={handleResetSampleData}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}
