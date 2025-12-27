import { COLORS, DAYS, TIMEZONES, DAY_PATTERNS } from '../constants';
import { localToUTC } from '../utils';

/**
 * Declarative staff configuration
 * - timezone: matches city name in TIMEZONES labels
 * - days: 'all' | 'weekdays' | 'noSunday' | custom array of day names
 * - start/end: local time hours for shift
 */
const STAFF_CONFIG = [
  { name: 'Jin N.',   timezone: 'Cambodia', color: 0, days: 'all',      start: 12, end: 14 },
  { name: 'Dane B.',  timezone: 'UK',       color: 1, days: 'noSunday', start: 10, end: 17 },
  { name: 'Jaxon B.', timezone: 'Florida',  color: 2, days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], start: 12, end: 15 },
  { name: 'Greg C.',  timezone: 'France',   color: 3, days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], start: 15, end: 19 },
  { name: 'Andy I.',  timezone: 'Dallas',   color: 4, days: 'weekdays', start: 10, end: 18 },
  { name: 'Alexx B.', timezone: 'Florida',  color: 5, days: 'weekdays', start: 9,  end: 17 },
  { name: 'Jeff S.',  timezone: 'Florida',  color: 6, days: 'weekdays', start: 9,  end: 17 },
];

/**
 * Get timezone offset by city name
 */
const getTimezoneOffset = (name) => {
  const tz = TIMEZONES.find(t => t.label.includes(name));
  if (!tz) throw new Error(`Unknown timezone: ${name}`);
  return tz.offset;
};

/**
 * Resolve day pattern string to array, or return array as-is
 */
const resolveDays = (days) => {
  if (Array.isArray(days)) return days;
  if (DAY_PATTERNS[days]) return DAY_PATTERNS[days];
  throw new Error(`Unknown day pattern: ${days}`);
};

/**
 * Build DEFAULT_STAFF from config
 */
const buildStaffFromConfig = () => {
  return STAFF_CONFIG.map((config, index) => ({
    id: index + 1,
    name: config.name,
    color: COLORS[config.color],
    timezoneOffset: getTimezoneOffset(config.timezone),
  }));
};

/**
 * Build DEFAULT_BLOCKS from config
 */
const buildBlocksFromConfig = () => {
  const blocks = {};

  STAFF_CONFIG.forEach((config, index) => {
    const staffId = index + 1;
    const offset = getTimezoneOffset(config.timezone);
    const days = resolveDays(config.days);

    days.forEach(day => {
      const dayIndex = DAYS.indexOf(day);
      for (let h = config.start; h < config.end; h++) {
        const utcHour = localToUTC(dayIndex, h, offset);
        blocks[`${staffId}-${utcHour}`] = true;
      }
    });
  });

  return blocks;
};

export const DEFAULT_STAFF = buildStaffFromConfig();
export const DEFAULT_BLOCKS = buildBlocksFromConfig();

// Backwards compatibility
export const generateDefaultBlocks = buildBlocksFromConfig;
