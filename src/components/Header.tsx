import React, { useEffect, useState } from 'react';
import { Clock, Sliders, Plus, Calendar, LayoutDashboard, Coffee } from 'lucide-react';
import { TimeclockStatus } from '../types';
import { formatTime } from '../utils/timeUtils';

interface HeaderProps {
  status: TimeclockStatus;
  activeView: 'dashboard' | 'history';
  onViewChange: (view: 'dashboard' | 'history') => void;
  onOpenSettings: () => void;
  onOpenAddShift: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  activeView,
  onViewChange,
  onOpenSettings,
  onOpenAddShift,
  historyCount,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const d = new Date(currentTime);
  const weekday = d.toLocaleDateString('fi-FI', { weekday: 'short' });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const dateStr = d.toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  const formattedDate = `${capitalizedWeekday} ${dateStr}`;

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-30 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Live Clock */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">Työaikakello</h1>
                {status === 'clocked_in' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Työvuorossa
                  </span>
                )}
                {status === 'on_break' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                    <Coffee className="w-3.5 h-3.5 animate-bounce" />
                    Tauolla
                  </span>
                )}
                {status === 'clocked_out' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Ei työvuorossa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <span>{formattedDate}</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600 font-semibold">{formatTime(currentTime, true)}</span>
              </p>
            </div>
          </div>

          {/* Quick actions for mobile */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              id="header-mobile-add-shift-btn"
              onClick={onOpenAddShift}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
              title="Lisää mennyt vuoro"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              id="header-mobile-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
              title="Asetukset"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Main Views Segmented Control */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 shadow-inner">
            <button
              id="nav-dashboard-btn"
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              <span>Tänään</span>
            </button>
            <button
              id="nav-history-btn"
              onClick={() => onViewChange('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeView === 'history'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Historia</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  {historyCount} pv
                </span>
              )}
            </button>
          </div>

          {/* Desktop action buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              id="header-desktop-add-shift-btn"
              onClick={onOpenAddShift}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold shadow-xs hover:border-slate-300 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lisää vuoro</span>
            </button>
            <button
              id="header-desktop-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
              title="Asetukset & tuntipalkka"
            >
              <Sliders className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
