import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { TopBar } from './components/TopBar';
import { LabelPanel } from './components/LabelPanel';
import { YearGrid } from './components/YearGrid';
import { DaySheet } from './components/DaySheet';
import { LabelEditor } from './components/LabelEditor';
import { usePlanner } from './hooks/usePlanner';
import { MIN_YEAR, dayKey, hasMovableHolidays, nextColor } from './utils';

type Theme = 'dark' | 'light';

const currentYear = () => Math.max(new Date().getFullYear(), MIN_YEAR);

const yearFromHash = () => {
    const y = parseInt(window.location.hash.slice(1), 10);
    return y >= MIN_YEAR && y <= 9999 ? y : null;
};

function App() {
    const planner = usePlanner();
    const { labels, assignments } = planner;

    // ---- Theme ----
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('calendar_theme');
        if (saved === 'dark' || saved === 'light') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('calendar_theme', theme);
    }, [theme]);

    // ---- Year (kept in the URL hash so a reload or shared link keeps it) ----
    const [year, setYear] = useState(() => yearFromHash() ?? currentYear());

    useEffect(() => {
        window.history.replaceState(null, '', `#${year}`);
    }, [year]);

    useEffect(() => {
        const onHash = () => {
            const y = yearFromHash();
            if (y) setYear(y);
        };
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    // Bumped by the Today button to bring today's cell into view.
    const [todayTick, setTodayTick] = useState(0);

    useEffect(() => {
        if (!todayTick) return;
        document.querySelector('.day.today')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, [todayTick]);

    const goToday = () => {
        setYear(currentYear());
        setTodayTick(t => t + 1);
    };

    // ---- Interaction state ----
    const [activeLabelId, setActiveLabelId] = useState<string | null>(null);
    const [openDay, setOpenDay] = useState<{ monthIndex: number; day: number } | null>(null);
    const [editor, setEditor] = useState<{ labelId?: string } | null>(null);

    const activeLabel = labels.find(l => l.id === activeLabelId) ?? null;
    const editingLabel = editor?.labelId ? labels.find(l => l.id === editor.labelId) : undefined;

    useEffect(() => {
        if (!activeLabel) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !document.querySelector('dialog[open]')) setActiveLabelId(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [activeLabel]);

    const { setDayLabel } = planner;
    const paint = useCallback(
        (key: string, on: boolean) => {
            if (activeLabelId) setDayLabel(key, activeLabelId, on);
        },
        [activeLabelId, setDayLabel]
    );

    const { yearCounts, totalCounts } = useMemo(() => {
        const yearCounts: Record<string, number> = {};
        const totalCounts: Record<string, number> = {};
        const prefix = `${year}-`;
        for (const [key, ids] of Object.entries(assignments)) {
            for (const id of ids) {
                totalCounts[id] = (totalCounts[id] ?? 0) + 1;
                if (key.startsWith(prefix)) yearCounts[id] = (yearCounts[id] ?? 0) + 1;
            }
        }
        return { yearCounts, totalCounts };
    }, [assignments, year]);

    const usedColors = labels.map(l => l.color);
    const openKey = openDay ? dayKey(year, openDay.monthIndex, openDay.day) : null;

    return (
        <div className={`app${activeLabel ? ' is-painting' : ''}`}>
            <TopBar
                year={year}
                canGoBack={year > MIN_YEAR}
                onPrevYear={() => setYear(y => Math.max(MIN_YEAR, y - 1))}
                onNextYear={() => setYear(y => y + 1)}
                onToday={goToday}
                theme={theme}
                onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
                sync={planner.sync}
                onRetrySync={planner.retrySync}
            />

            <div className="layout">
                <LabelPanel
                    year={year}
                    labels={labels}
                    counts={yearCounts}
                    activeLabelId={activeLabel?.id ?? null}
                    onSelect={setActiveLabelId}
                    onEdit={labelId => setEditor({ labelId })}
                    onCreate={() => setEditor({})}
                    onQuickCreate={name => setActiveLabelId(planner.addLabel(name, nextColor(usedColors)))}
                />

                <main className="main">
                    <div className="key" aria-label="Key">
                        <span><i className="key-box weekend" />Weekend</span>
                        <span><i className="key-box holiday">1</i>Public holiday</span>
                        <span><i className="key-box today" />Today</span>
                        {!hasMovableHolidays(year) && (
                            <span className="key-note">Eid and other lunar holiday dates aren’t available for {year} yet.</span>
                        )}
                    </div>

                    <YearGrid
                        year={year}
                        labels={labels}
                        assignments={assignments}
                        activeLabelId={activeLabel?.id ?? null}
                        onPaint={paint}
                        onOpenDay={(monthIndex, day) => setOpenDay({ monthIndex, day })}
                    />
                </main>
            </div>

            {activeLabel && (
                <div className="paintbar" role="status">
                    <span className="swatch" style={{ backgroundColor: activeLabel.color }} />
                    <span className="paintbar-text">
                        <strong>{activeLabel.name}</strong>
                        <span className="touch-only"> — tap days</span>
                        <span className="mouse-only"> — click or drag across days</span>
                    </span>
                    <button type="button" className="paintbar-btn" onClick={() => setEditor({ labelId: activeLabel.id })}>
                        Edit
                    </button>
                    <button type="button" className="paintbar-btn solid" onClick={() => setActiveLabelId(null)}>
                        Done
                    </button>
                </div>
            )}

            {openDay && openKey && (
                <DaySheet
                    key={openKey}
                    year={year}
                    monthIndex={openDay.monthIndex}
                    day={openDay.day}
                    labels={labels}
                    assignedIds={assignments[openKey] ?? []}
                    onToggle={(labelId, on) => setDayLabel(openKey, labelId, on)}
                    onCreate={(name, color) => setDayLabel(openKey, planner.addLabel(name, color), true)}
                    onClear={() => planner.clearDay(openKey)}
                    onClose={() => setOpenDay(null)}
                />
            )}

            {editor && (
                <LabelEditor
                    key={editor.labelId ?? 'new'}
                    label={editingLabel}
                    usedColors={usedColors}
                    dayCount={editingLabel ? totalCounts[editingLabel.id] ?? 0 : 0}
                    onSave={(name, color) => {
                        if (editingLabel) planner.updateLabel(editingLabel.id, name, color);
                        else setActiveLabelId(planner.addLabel(name, color));
                        setEditor(null);
                    }}
                    onDelete={() => {
                        if (editingLabel) planner.removeLabel(editingLabel.id);
                        setEditor(null);
                    }}
                    onClose={() => setEditor(null)}
                />
            )}
        </div>
    );
}

export default App;
