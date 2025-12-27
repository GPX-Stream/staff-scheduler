import { Clock } from 'lucide-react';
import { TIMEZONES } from '../constants';

export const TimezoneSelector = ({ displayOffset, setDisplayOffset, compact = false }) => {
  if (compact) {
    return (
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-600">Viewing in:</span>
          <select
            value={displayOffset}
            onChange={(e) => setDisplayOffset(Number(e.target.value))}
            className="px-2 py-1 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.label} value={tz.offset}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-slate-500" />
        <h2 className="font-semibold text-slate-700 text-sm">Display Timezone</h2>
      </div>
      <select
        value={displayOffset}
        onChange={(e) => setDisplayOffset(Number(e.target.value))}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz.label} value={tz.offset}>{tz.label}</option>
        ))}
      </select>
    </div>
  );
};
