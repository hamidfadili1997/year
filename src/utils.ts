export const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const getDaysInMonth = (monthIndex: number, year: number) => {
    return new Date(year, monthIndex + 1, 0).getDate();
};

export const isWeekend = (year: number, monthIndex: number, day: number) => {
    const date = new Date(year, monthIndex, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
};

const holidays: Record<string, string> = {
    "0-1": "New Year's Day",
    "0-11": "Independence Manifesto Day",
    "0-14": "Amazigh New Year",
    "2-20": "Eid al-Fitr (Estimated)",
    "2-21": "Eid al-Fitr Holiday (Estimated)",
    "4-1": "Labour Day",
    "4-27": "Eid al-Adha (Estimated)",
    "4-28": "Eid al-Adha Holiday (Estimated)",
    "5-17": "Islamic New Year (Estimated)",
    "6-30": "Throne Day",
    "7-14": "Oued Ed-Dahab Day",
    "7-20": "Revolution Day",
    "7-21": "Youth Day",
    "7-26": "The Prophet's Birthday (Estimated)",
    "10-6": "Green March Day",
    "10-18": "Independence Day",
};

export const getHolidayName = (monthIndex: number, day: number) => {
    return holidays[`${monthIndex}-${day}`];
};
