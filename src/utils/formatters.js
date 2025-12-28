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
 * Get timezone label from IANA timezone ID
 * @param {string} timezoneId - IANA timezone ID (e.g., 'America/New_York')
 * @param {Array} timezones - Available timezones array (required)
 * @returns {string} Timezone label or the ID itself if not found
 */
export const getTimezoneLabel = (timezoneId, timezones) => {
  if (!timezones?.length) return timezoneId;
  const tz = timezones.find(t => t.id === timezoneId);
  return tz ? tz.label : timezoneId;
};
