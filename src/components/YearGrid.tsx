import React, { useEffect, useMemo, useRef } from 'react';
import type { Assignments, Label } from '../types';
import {
    MONTHS, dayKey, getDaysInMonth, getHolidayName, isWeekend, textOn,
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

    const at = (vars: { m?: number; d?: number }, extra: React.CSSProperties = {}) =>
        ({ ...extra, '--m': vars.m, '--d': vars.d }) as React.CSSProperties;

    return (
        <div className={`year-grid${activeLabelId ? ' painting' : ''}`}>
            {Array.from({ length: 31 }, (_, i) => (
                <span key={`d-${i}`} className="day-head" style={at({ d: i + 1 })} aria-hidden="true">{i + 1}</span>
            ))}
            {MONTHS.map((month, m) => {
                const days = getDaysInMonth(year, m);
                const isCurrent = now.getFullYear() === year && now.getMonth() === m;

                return (
                    <React.Fragment key={month}>
                        <span className={`month-head${isCurrent ? ' current' : ''}`} style={at({ m })} title={`${month} ${year}`}>
                            <span className="month-full">{month}</span>
                            <span className="month-short" aria-hidden="true">{month.slice(0, 3)}</span>
                        </span>
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
                                        style={at({ m, d }, fillFor(dayLabels.map(l => l.color)))}
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
                    </React.Fragment>
                );
            })}
        </div>
    );
};
