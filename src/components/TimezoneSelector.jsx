import { Clock } from 'lucide-react';

export const TimezoneSelector = ({ displayTimezone, setDisplayTimezone, timezones, compact = false }) => {
  if (compact) {
    return (
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
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
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
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
  );
};
