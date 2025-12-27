import { WEEK_HOURS, DAYS, TIMEZONES } from '../constants';

/**
 * Convert local day/hour to UTC hour index (0-167)
 * @param {number} dayIndex - 0=Monday, 6=Sunday
 * @param {number} hour - 0-23
 * @param {number} timezoneOffset - hours from UTC (e.g., -5 for ET, +7 for Cambodia)
 * @returns {number} UTC hour index (0-167)
 */
export const localToUTC = (dayIndex, hour, timezoneOffset) => {
  const utcHour = dayIndex * 24 + hour - timezoneOffset;
  return ((utcHour % WEEK_HOURS) + WEEK_HOURS) % WEEK_HOURS;
};

/**
 * Convert UTC hour index (0-167) to local day/hour
 * @param {number} utcHourIndex - 0-167
 * @param {number} timezoneOffset - hours from UTC
 * @returns {{ dayIndex: number, hour: number, day: string }}
 */
export const utcToLocal = (utcHourIndex, timezoneOffset) => {
  const localHour = utcHourIndex + timezoneOffset;
  const wrapped = ((localHour % WEEK_HOURS) + WEEK_HOURS) % WEEK_HOURS;
  const dayIndex = Math.floor(wrapped / 24);
  const hour = wrapped % 24;
  return { dayIndex, hour, day: DAYS[dayIndex] };
};

/**
 * Convert display grid position to UTC hour
 * @param {number} dayIndex - 0-6
 * @param {number} hour - 0-23
 * @param {number} displayOffset - display timezone offset
 * @returns {number} UTC hour index (0-167)
 */
export const displayToUTC = (dayIndex, hour, displayOffset) => {
  return localToUTC(dayIndex, hour, displayOffset);
};

/**
 * Detect the user's timezone offset from their device
 * @returns {number} timezone offset in hours from UTC
 */
export const detectUserTimezone = () => {
  // getTimezoneOffset returns minutes, negative for east of UTC
  // We need to invert the sign (e.g., EST is UTC-5, but getTimezoneOffset returns +300)
  const offsetMinutes = new Date().getTimezoneOffset();
  return -offsetMinutes / 60;
};

/**
 * Find the closest matching timezone from TIMEZONES array
 * @param {number} offset - timezone offset in hours
 * @returns {number} the offset from the closest matching timezone
 */
export const findClosestTimezone = (offset) => {
  let closest = TIMEZONES[0].offset;
  let minDiff = Math.abs(offset - closest);

  for (const tz of TIMEZONES) {
    const diff = Math.abs(offset - tz.offset);
    if (diff < minDiff) {
      minDiff = diff;
      closest = tz.offset;
    }
  }

  return closest;
};

/**
 * Get the best initial timezone offset based on user's device
 * @returns {number} timezone offset to use as default
 */
export const getInitialTimezoneOffset = () => {
  const userOffset = detectUserTimezone();
  return findClosestTimezone(userOffset);
};
