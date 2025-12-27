import { TIMEZONES } from '../constants';

/**
 * Format hour as 12-hour time string
 * @param {number} hour - 0-23
 * @returns {string} Formatted time (e.g., "9 AM", "12 PM")
 */
export const formatHour = (hour) => {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
};

/**
 * Get timezone label from offset
 * @param {number} offset - Timezone offset in hours
 * @returns {string} Timezone label or UTC offset string
 */
export const getTimezoneLabel = (offset) => {
  const tz = TIMEZONES.find(t => t.offset === offset);
  return tz ? tz.label : `UTC${offset >= 0 ? '+' : ''}${offset}`;
};
