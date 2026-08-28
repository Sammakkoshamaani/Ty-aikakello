import React, { useState } from 'react';
import { X, Sliders, DollarSign, Target, Clock, RotateCcw, Trash2, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { TimeclockSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TimeclockSettings;
  onSaveSettings: (newSettings: TimeclockSettings) => void;
  onResetSeedData: () => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetSeedData,
  onClearAllData,
}) => {
  const [hourlyRate, setHourlyRate] = useState(settings.hourlyRate);
  const [dailyTargetHours, setDailyTargetHours] = useState(settings.dailyTargetHours);
  const [overtimeThresholdHours, setOvertimeThresholdHours] = useState(settings.overtimeThresholdHours);
  const [currency, setCurrency] = useState(settings.currency);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      hourlyRate: Number(hourlyRate) || 0,
      dailyTargetHours: Number(dailyTargetHours) || 8,
      overtimeThresholdHours: Number(overtimeThresholdHours) || 8,
      currency: currency || '€',
      autoDeductLunch: settings.autoDeductLunch,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Asetukset</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Hourly Rate */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tuntipalkka (peruspalkkio)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm font-bold">
                {currency}
              </span>
              <input
                id="settings-hourly-rate-input"
                type="number"
                min="0"
                step="0.50"
                value={hourlyRate}
                onChange={e => setHourlyRate(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Daily Target Workday */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>Päivätavoite (h)</span>
              </label>
              <input
                id="settings-daily-target-input"
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={dailyTargetHours}
                onChange={e => setDailyTargetHours(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Ylityöraja (h)</span>
              </label>
              <input
                id="settings-ot-threshold-input"
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={overtimeThresholdHours}
                onChange={e => setOvertimeThresholdHours(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Currency Symbol */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Valuutan symboli
            </label>
            <div className="flex gap-2">
              {['€', '$', '£', 'kr', 'CHF'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    currency === c
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Data & Clear section */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Tietojen hallinta
            </label>

            <button
              type="button"
              id="settings-load-sample-btn"
              onClick={() => {
                onResetSeedData();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Palauta esimerkkihistoria</span>
            </button>

            {!showClearConfirm ? (
              <button
                type="button"
                id="settings-clear-all-btn"
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Tyhjennä koko työhistoria</span>
              </button>
            ) : (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Oletko varma? Tämä poistaa kaikki tallennetut vuorot pysyvästi.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="settings-confirm-clear-btn"
                    onClick={() => {
                      onClearAllData();
                      setShowClearConfirm(false);
                      onClose();
                    }}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Kyllä, poista kaikki
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Peruuta
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              Peruuta
            </button>
            <button
              id="settings-save-btn"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tallennettu!</span>
                </>
              ) : (
                <span>Tallenna asetukset</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
