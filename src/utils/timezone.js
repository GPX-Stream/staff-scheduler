import { WEEK_HOURS, DAYS } from '../constants';

/**
 * Get the current UTC offset in hours for a given IANA timezone ID
 * This automatically handles DST transitions
 * @param {string} timezoneId - IANA timezone ID (e.g., 'America/New_York')
 * @returns {number} offset in hours from UTC (e.g., -5 for EST, -4 for EDT)
 */
export const getTimezoneOffset = (timezoneId) => {
  try {
    const now = new Date();
    // Get the timezone's offset by comparing local time representations
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezoneId }));
    const offsetMs = tzDate - utcDate;
    return offsetMs / (1000 * 60 * 60);
  } catch {
    // Fallback to UTC if timezone ID is invalid
    console.warn(`Invalid timezone ID: ${timezoneId}, defaulting to UTC`);
    return 0;
  }
};

/**
 * Convert local day/hour to UTC hour index (0-167)
 * @param {number} dayIndex - 0=Monday, 6=Sunday
 * @param {number} hour - 0-23
 * @param {string} timezoneId - IANA timezone ID
 * @returns {number} UTC hour index (0-167)
 */
export const localToUTC = (dayIndex, hour, timezoneId) => {
  const offset = typeof timezoneId === 'string' ? getTimezoneOffset(timezoneId) : timezoneId;
  const utcHour = dayIndex * 24 + hour - offset;
  return ((utcHour % WEEK_HOURS) + WEEK_HOURS) % WEEK_HOURS;
};

/**
 * Convert UTC hour index (0-167) to local day/hour
 * @param {number} utcHourIndex - 0-167
 * @param {string} timezoneId - IANA timezone ID
 * @returns {{ dayIndex: number, hour: number, day: string }}
 */
export const utcToLocal = (utcHourIndex, timezoneId) => {
  const offset = typeof timezoneId === 'string' ? getTimezoneOffset(timezoneId) : timezoneId;
  const localHour = utcHourIndex + offset;
  const wrapped = ((localHour % WEEK_HOURS) + WEEK_HOURS) % WEEK_HOURS;
  const dayIndex = Math.floor(wrapped / 24);
  const hour = wrapped % 24;
  return { dayIndex, hour, day: DAYS[dayIndex] };
};

/**
 * Convert display grid position to UTC hour
 * @param {number} dayIndex - 0-6
 * @param {number} hour - 0-23
 * @param {string} displayTimezone - IANA timezone ID for display
 * @returns {number} UTC hour index (0-167)
 */
export const displayToUTC = (dayIndex, hour, displayTimezone) => {
  return localToUTC(dayIndex, hour, displayTimezone);
};

/**
 * Detect the user's IANA timezone from their device
 * @returns {string} IANA timezone ID
 */
export const detectUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

/**
 * Find the closest matching timezone from timezones array
 * @param {string} userTimezone - user's IANA timezone ID
 * @param {Array} timezones - Available timezones array (required)
 * @returns {string} the ID of the closest matching timezone from our list
 */
export const findClosestTimezone = (userTimezone, timezones) => {
  if (!timezones?.length) {
    // If no timezones provided, return user's timezone as-is
    return userTimezone;
  }
  // First, check if the user's timezone is in our list
  const exactMatch = timezones.find(tz => tz.id === userTimezone);
  if (exactMatch) return exactMatch.id;

  // Otherwise, find the closest by current offset
  const userOffset = getTimezoneOffset(userTimezone);
  let closest = timezones[0].id;
  let minDiff = Math.abs(userOffset - getTimezoneOffset(closest));

  for (const tz of timezones) {
    const tzOffset = getTimezoneOffset(tz.id);
    const diff = Math.abs(userOffset - tzOffset);
    if (diff < minDiff) {
      minDiff = diff;
      closest = tz.id;
    }
  }

  return closest;
};

/**
 * Get the best initial timezone based on user's device
 * @param {Array} timezones - Available timezones array (required)
 * @returns {string} IANA timezone ID to use as default
 */
export const getInitialTimezone = (timezones) => {
  const userTimezone = detectUserTimezone();
  return findClosestTimezone(userTimezone, timezones);
};

// Legacy alias for backwards compatibility
export const getInitialTimezoneOffset = getInitialTimezone;
