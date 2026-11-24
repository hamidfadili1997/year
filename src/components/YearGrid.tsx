import React, { useEffect, useMemo, useRef } from 'react';
import type { Assignments, Label } from '../types';
import {
    MONTHS, WEEKDAYS, dayKey, getDaysInMonth, getHolidayName, getMonthOffset, isWeekend, textOn,
} from '../utils';

interface YearGridProps {
    year: number;
    labels: Label[];
    assignments: Assignments;
    /** Label being painted, or null when clicking a day should open its details. */
    activeLabelId: string | null;
    onPaint: (key: string, on: boolean) => void;
    onOpenDay: (monthIndex: number, day: number) => void;
}

const fillFor = (colors: string[]): React.CSSProperties => {
    if (colors.length === 0) return {};
    if (colors.length === 1) return { background: colors[0], color: textOn(colors[0]) };
    const step = 100 / colors.length;
    const stops = colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`);
    return { background: `linear-gradient(135deg, ${stops.join(', ')})` };
};

export const YearGrid: React.FC<YearGridProps> = ({ year, labels, assignments, activeLabelId, onPaint, onOpenDay }) => {
    const labelsById = useMemo(() => new Map(labels.map(l => [l.id, l])), [labels]);
    const now = new Date();
    const todayKey = dayKey(now.getFullYear(), now.getMonth(), now.getDate());

    // Mouse drag-painting: null when idle, otherwise whether the drag adds or removes.
    const drag = useRef<boolean | null>(null);
    const handledByPointer = useRef(false);

    useEffect(() => {
        const stop = () => {
            drag.current = null;
            // The click that follows pointerup must still see the flag.
            setTimeout(() => { handledByPointer.current = false; }, 0);
        };
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
        return () => {
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('pointercancel', stop);
        };
    }, []);

    const has = (key: string) => !!activeLabelId && (assignments[key]?.includes(activeLabelId) ?? false);

    return (
        <div className={`months${activeLabelId ? ' painting' : ''}`}>
            {MONTHS.map((month, m) => {
                const days = getDaysInMonth(year, m);
                const offset = getMonthOffset(year, m);
                const isCurrent = now.getFullYear() === year && now.getMonth() === m;

                return (
                    <section key={month} id={`month-${m}`} className={`month${isCurrent ? ' current' : ''}`} aria-label={`${month} ${year}`}>
                        <h2>{month}</h2>
                        <div className="week-head" aria-hidden="true">
                            {WEEKDAYS.map(w => <span key={w}>{w[0]}</span>)}
                        </div>
                        <div className="days">
                            {Array.from({ length: offset }, (_, i) => <span key={`pad-${i}`} />)}
                            {Array.from({ length: days }, (_, i) => {
                                const d = i + 1;
                                const key = dayKey(year, m, d);
                                const dayLabels = (assignments[key] ?? [])
                                    .map(id => labelsById.get(id))
                                    .filter((l): l is Label => !!l);
                                const holiday = getHolidayName(year, m, d);
                                const isToday = key === todayKey;

                                let className = 'day';
                                if (isWeekend(year, m, d)) className += ' weekend';
                                if (holiday) className += ' holiday';
                                if (dayLabels.length > 0) className += ' labeled';
                                if (dayLabels.length > 1) className += ' multi';
                                if (isToday) className += ' today';

                                const details = [
                                    isToday && 'Today',
                                    holiday,
                                    dayLabels.map(l => l.name).join(', '),
                                ].filter(Boolean).join(' · ');
                                const weekday = new Date(year, m, d).toLocaleDateString('en-US', { weekday: 'long' });
                                const description = `${weekday}, ${month} ${d}${details ? ` — ${details}` : ''}`;

                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        className={className}
                                        style={fillFor(dayLabels.map(l => l.color))}
                                        title={description}
                                        aria-label={description}
                                        onPointerDown={e => {
                                            if (!activeLabelId || e.pointerType !== 'mouse' || e.button !== 0) return;
                                            const on = !has(key);
                                            drag.current = on;
                                            handledByPointer.current = true;
                                            onPaint(key, on);
                                        }}
                                        onPointerEnter={() => {
                                            if (drag.current !== null) onPaint(key, drag.current);
                                        }}
                                        onClick={() => {
                                            if (handledByPointer.current) return;
                                            if (activeLabelId) onPaint(key, !has(key));
                                            else onOpenDay(m, d);
                                        }}
                                        onContextMenu={e => {
                                            e.preventDefault();
                                            onOpenDay(m, d);
                                        }}
                                    >
                                        <span className="day-num">{d}</span>
                                        {holiday && dayLabels.length > 0 && <span className="day-dot" />}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};
