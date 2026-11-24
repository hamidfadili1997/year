import type { Assignments } from './types';

export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/** Weeks start on Monday. */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** First year the planner has data for. Assignments saved before years existed belong to it. */
export const MIN_YEAR = 2026;

export const PALETTE = [
    '#e5484d', '#f2811d', '#e9b308', '#46a758', '#12a594',
    '#0091ff', '#5b5bd6', '#a144af', '#e93d82', '#7d6e5d',
];

export const getDaysInMonth = (year: number, monthIndex: number) =>
    new Date(year, monthIndex + 1, 0).getDate();

/** Number of blank cells before day 1 in a Monday-first grid. */
export const getMonthOffset = (year: number, monthIndex: number) =>
    (new Date(year, monthIndex, 1).getDay() + 6) % 7;

export const isWeekend = (year: number, monthIndex: number, day: number) => {
    const dayOfWeek = new Date(year, monthIndex, day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
};

export const dayKey = (year: number, monthIndex: number, day: number) =>
    `${year}-${monthIndex}-${day}`;

/** Same date every year. Keys are `monthIndex-day`. */
const fixedHolidays: Record<string, string> = {
    '0-1': "New Year's Day",
    '0-11': 'Independence Manifesto Day',
    '0-14': 'Amazigh New Year',
    '4-1': 'Labour Day',
    '6-30': 'Throne Day',
    '7-14': 'Oued Ed-Dahab Day',
    '7-20': 'Revolution Day',
    '7-21': 'Youth Day',
    '10-6': 'Green March Day',
    '10-18': 'Independence Day',
};

/** Lunar-calendar holidays move every year and are only confirmed by moon sighting. */
const movableHolidays: Record<number, Record<string, string>> = {
    2026: {
        '2-20': 'Eid al-Fitr (Estimated)',
        '2-21': 'Eid al-Fitr Holiday (Estimated)',
        '4-27': 'Eid al-Adha (Estimated)',
        '4-28': 'Eid al-Adha Holiday (Estimated)',
        '5-17': 'Islamic New Year (Estimated)',
        '7-26': "The Prophet's Birthday (Estimated)",
    },
    2027: {
        '2-10': 'Eid al-Fitr (Estimated)',
        '2-11': 'Eid al-Fitr Holiday (Estimated)',
        '4-17': 'Eid al-Adha (Estimated)',
        '4-18': 'Eid al-Adha Holiday (Estimated)',
        '5-7': 'Islamic New Year (Estimated)',
        '7-15': "The Prophet's Birthday (Estimated)",
    },
};

export const getHolidayName = (year: number, monthIndex: number, day: number): string | undefined => {
    const key = `${monthIndex}-${day}`;
    return movableHolidays[year]?.[key] ?? fixedHolidays[key];
};

export const hasMovableHolidays = (year: number) => year in movableHolidays;

/**
 * Normalises stored assignments: values become arrays, and keys saved before
 * multi-year support (`monthIndex-day`) are moved to MIN_YEAR.
 */
export const migrateAssignments = (raw: unknown): Assignments => {
    const out: Assignments = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        const ids = (Array.isArray(value) ? value : [value]).filter(
            (v): v is string => typeof v === 'string'
        );
        if (ids.length === 0) continue;
        const fullKey = key.split('-').length === 2 ? `${MIN_YEAR}-${key}` : key;
        out[fullKey] = ids;
    }
    return out;
};

/** Readable text colour (dark or white) for a hex background. */
export const textOn = (hex: string) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return '#ffffff';
    const n = parseInt(m[1], 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.4 ? '#1c1a17' : '#ffffff';
};

export const nextColor = (used: string[]) =>
    PALETTE.find(c => !used.includes(c)) ?? PALETTE[used.length % PALETTE.length];
