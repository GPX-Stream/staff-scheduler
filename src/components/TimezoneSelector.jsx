import { useState } from 'react';
import { Clock, X, Check } from 'lucide-react';

// Extract short label from timezone (e.g., "New York (ET)" -> "ET" or "New York")
const getShortLabel = (label) => {
  const match = label.match(/\(([^)]+)\)/);
  if (match) return match[1];
  // Fallback: take first word or abbreviate
  return label.split(' ')[0];
};

// Shared modal component
const TimezoneModal = ({ isOpen, onClose, timezones, displayTimezone, onSelect }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Display Timezone
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timezone List */}
        <div className="max-h-[60vh] overflow-y-auto py-1">
          {timezones.map((tz) => {
            const isSelected = tz.id === displayTimezone;
            return (
              <button
                key={tz.id}
                onClick={() => onSelect(tz.id)}
                className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100'
                }`}
              >
                <span className={`text-sm ${
                  isSelected
                    ? 'font-medium text-blue-700 dark:text-blue-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {tz.label}
                </span>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export const TimezoneSelector = ({ displayTimezone, setDisplayTimezone, timezones, compact = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentTz = timezones.find(tz => tz.id === displayTimezone);
  const shortLabel = currentTz ? getShortLabel(currentTz.label) : '';

  const handleSelect = (tzId) => {
    setDisplayTimezone(tzId);
    setIsModalOpen(false);
  };

  // Minimal mobile trigger (used on mobile for both compact and non-compact)
  const MobileTrigger = ({ className = '' }) => (
    <button
      onClick={() => setIsModalOpen(true)}
      className={`w-full px-3 py-1.5 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-100 transition-colors ${className}`}
    >
      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
        {shortLabel}
      </span>
    </button>
  );

  if (compact) {
    return (
      <>
        {/* Mobile: minimal trigger with modal */}
        <div className="md:hidden">
          <MobileTrigger className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80" />
        </div>

        {/* Desktop: inline dropdown */}
        <div className="hidden md:block p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Viewing in:</span>
            <select
              value={displayTimezone}
              onChange={(e) => setDisplayTimezone(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timezones.map((tz) => (
                <option key={tz.id} value={tz.id}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        <TimezoneModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          timezones={timezones}
          displayTimezone={displayTimezone}
          onSelect={handleSelect}
        />
      </>
    );
  }

  // Non-compact: mobile shows minimal trigger, desktop shows full dropdown
  return (
    <>
      {/* Mobile: minimal trigger */}
      <div className="md:hidden bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <MobileTrigger />
      </div>

      {/* Desktop: full dropdown */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Display Timezone</h2>
        </div>
        <select
          value={displayTimezone}
          onChange={(e) => setDisplayTimezone(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {timezones.map((tz) => (
            <option key={tz.id} value={tz.id}>{tz.label}</option>
          ))}
        </select>
      </div>

      <TimezoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        timezones={timezones}
        displayTimezone={displayTimezone}
        onSelect={handleSelect}
      />
    </>
  );
};
