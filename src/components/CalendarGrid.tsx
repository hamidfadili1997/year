import React, { useRef } from 'react';
import { months, monthsShort, getDaysInMonth, isWeekend, getHolidayName } from '../utils';

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
    /** Opens the day detail sheet - right-click on desktop, long-press on touch. */
    onDayInspect: (monthIndex: number, day: number) => void;
}

const LONG_PRESS_MS = 450;
const LONG_PRESS_SLOP_PX = 10;

export const CalendarGrid: React.FC<CalendarGridProps> = ({
    year,
    categories,
    dayAssignments,
    onDayClick,
    onDayInspect
}) => {
    const pressTimer = useRef<number | null>(null);
    const pressOrigin = useRef<{ x: number; y: number } | null>(null);
    // Set when a long-press fires so the click that follows touchend is swallowed.
    const longPressFired = useRef(false);

    const cancelPress = () => {
        if (pressTimer.current !== null) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
        pressOrigin.current = null;
    };

    const handleTouchStart = (e: React.TouchEvent, monthIndex: number, day: number) => {
        const touch = e.touches[0];
        if (!touch) return;
        pressOrigin.current = { x: touch.clientX, y: touch.clientY };
        longPressFired.current = false;
        pressTimer.current = window.setTimeout(() => {
            longPressFired.current = true;
            navigator.vibrate?.(15);
            onDayInspect(monthIndex, day);
            cancelPress();
        }, LONG_PRESS_MS);
    };

    // Scrolling the grid sideways must not count as a long press.
    const handleTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const origin = pressOrigin.current;
        if (!touch || !origin) return;
        if (
            Math.abs(touch.clientX - origin.x) > LONG_PRESS_SLOP_PX ||
            Math.abs(touch.clientY - origin.y) > LONG_PRESS_SLOP_PX
        ) {
            cancelPress();
        }
    };

    const handleClick = (monthIndex: number, day: number) => {
        if (longPressFired.current) {
            longPressFired.current = false;
            return;
        }
        onDayClick(monthIndex, day);
    };

    const handleContextMenu = (e: React.MouseEvent, monthIndex: number, day: number) => {
        e.preventDefault(); // Prevent default browser context menu
        onDayInspect(monthIndex, day);
    };

    const today = new Date();

    return (
        <div className="calendar-scroll">
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
                            <div className="month-label">
                                <span className="month-label-full">{month}</span>
                                <span className="month-label-short">{monthsShort[monthIndex]}</span>
                            </div>
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

                                const isToday =
                                    today.getFullYear() === year &&
                                    today.getMonth() === monthIndex &&
                                    today.getDate() === day;

                                let className = 'day-cell';
                                if (isToday) className += ' today';
                                let tooltip = `${month} ${day}, ${year}`;
                                if (isToday) tooltip += ' (Today)';
                                const colors: string[] = [];

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
                                const style: React.CSSProperties = {};
                                if (colors.length === 1) {
                                    style.backgroundColor = colors[0];
                                } else if (colors.length > 1) {
                                    // Create a repeating striped pattern
                                    const stripeWidth = 6; // px
                                    const gradientParts: string[] = [];
                                    colors.forEach((col, idx) => {
                                        gradientParts.push(`${col} ${idx * stripeWidth}px`);
                                        gradientParts.push(`${col} ${(idx + 1) * stripeWidth}px`);
                                    });
                                    style.background = `repeating-linear-gradient(45deg, ${gradientParts.join(', ')})`;
                                } else {
                                    className += weekend ? ' weekend' : ' weekday';
                                }

                                if (holidayName) className += ' holiday';
                                if (activeCustomCats.length > 0) className += ' custom';

                                return (
                                    <div
                                        key={i}
                                        role="button"
                                        tabIndex={-1}
                                        aria-label={tooltip}
                                        className={className}
                                        title={tooltip}
                                        style={style}
                                        onClick={() => handleClick(monthIndex, day)}
                                        onContextMenu={(e) => handleContextMenu(e, monthIndex, day)}
                                        onTouchStart={(e) => handleTouchStart(e, monthIndex, day)}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={cancelPress}
                                        onTouchCancel={cancelPress}
                                    ></div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
