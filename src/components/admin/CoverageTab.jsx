import { Clock } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const formatHour = (hour) => {
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
};

export const CoverageTab = ({ coverage, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...coverage,
      [field]: parseInt(value, 10),
    });
  };

  const start = coverage?.start ?? 8;
  const end = coverage?.end ?? 20;
  const coverageHours = end > start ? end - start : 24 - start + end;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Coverage Hours</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Set the operational hours that require staff coverage (in UTC)
        </p>
      </div>

      {/* Time Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Start Time (UTC)
            </label>
            <select
              value={start}
              onChange={(e) => handleChange('start', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {formatHour(hour)}
                </option>
              ))}
            </select>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              End Time (UTC)
            </label>
            <select
              value={end}
              onChange={(e) => handleChange('end', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {formatHour(hour)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Clock className="w-5 h-5" />
            <span className="font-medium">
              {coverageHours} hours of coverage required daily
            </span>
          </div>
          <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
            From {formatHour(start)} to {formatHour(end)} UTC
          </p>
        </div>
      </div>

    </div>
  );
};
