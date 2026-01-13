import React from 'react';
import { months, getDaysInMonth, isWeekend, getHolidayName } from '../utils';

interface Category {
    id: string;
    name: string;
    color: string;
}

interface CalendarGridProps {
    year: number;
    categories: Category[];
    dayAssignments: Record<string, string[]>;
    onDayClick: (monthIndex: number, day: number) => void;
    onDayContextMenu: (e: React.MouseEvent, monthIndex: number, day: number) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
    year,
    categories,
    dayAssignments,
    onDayClick,
    onDayContextMenu
}) => {
    return (
        <div className="calendar-table">
            {/* Header Row */}
            <div className="header-row">
                <div className="month-label">Month</div>
                {Array.from({ length: 31 }, (_, i) => (
                    <div key={i} className="day-header">{i + 1}</div>
                ))}
            </div>

            {/* Month Rows */}
            {months.map((month, monthIndex) => {
                const daysInMonth = getDaysInMonth(monthIndex, year);

                return (
                    <div key={month} className="month-row">
                        <div className="month-label">{month}</div>
                        {Array.from({ length: 31 }, (_, i) => {
                            const day = i + 1;
                            if (day > daysInMonth) {
                                return <div key={i} className="day-cell empty"></div>;
                            }

                            const customCatIDs = dayAssignments[`${monthIndex}-${day}`] || [];
                            const activeCustomCats = customCatIDs
                                .map(id => categories.find(c => c.id === id))
                                .filter(c => !!c) as Category[];

                            const holidayName = getHolidayName(monthIndex, day);
                            const weekend = isWeekend(year, monthIndex, day);

                            const today = new Date();
                            const isToday =
                                today.getFullYear() === year &&
                                today.getMonth() === monthIndex &&
                                today.getDate() === day;

                            let className = 'day-cell';
                            if (isToday) className += ' today';
                            let tooltip = `${month} ${day}, ${year}`;
                            if (isToday) tooltip += ' (Today)';
                            let colors: string[] = [];

                            // Collect all colors
                            activeCustomCats.forEach(cat => colors.push(cat.color));
                            if (holidayName) colors.push('#BA68C8'); // Holiday Purple
                            if (weekend) colors.push('#ccc'); // Weekend Gray

                            // Handle Tooltip
                            if (holidayName) tooltip += `: ${holidayName}`;
                            if (activeCustomCats.length > 0) {
                                const labels = activeCustomCats.map(c => c.name).join(', ');
                                tooltip += ` (${labels})`;
                            }

                            // Dynamic Style
                            let style: React.CSSProperties = {};
                            if (colors.length === 1) {
                                style.backgroundColor = colors[0];
                            } else if (colors.length > 1) {
                                // Create a striped gradient
                                const step = 100 / colors.length;
                                const gradientParts = colors.map((col, idx) => {
                                    return `${col} ${idx * step}%, ${col} ${(idx + 1) * step}%`;
                                });
                                style.background = `linear-gradient(to bottom right, ${gradientParts.join(', ')})`;
                            } else {
                                className += weekend ? ' weekend' : ' weekday';
                            }

                            if (holidayName) className += ' holiday';
                            if (activeCustomCats.length > 0) className += ' custom';

                            return (
                                <div
                                    key={i}
                                    className={className}
                                    title={tooltip}
                                    style={style}
                                    onClick={() => onDayClick(monthIndex, day)}
                                    onContextMenu={(e) => onDayContextMenu(e, monthIndex, day)}
                                ></div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};
