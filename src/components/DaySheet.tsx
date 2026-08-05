import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { months, isWeekend, getHolidayName } from '../utils';

interface Category {
    id: string;
    name: string;
    color: string;
}

interface DaySheetProps {
    year: number;
    date: { monthIndex: number; day: number };
    categories: Category[];
    assignedIds: string[];
    onClose: () => void;
    onAddExisting: (categoryId: string) => void;
    onCreate: (name: string, color: string) => void;
    onRemove: (categoryId: string) => void;
    onClearAll: () => void;
}

/**
 * Day detail panel. Reachable by right-click (desktop) or long-press (touch),
 * so touch users can read what a day holds - `title` tooltips never show there.
 * Renders as a bottom sheet on phones and a centered dialog on wider screens.
 *
 * The parent mounts this only while open (keyed by day), so local draft state
 * resets naturally on every open instead of via an effect.
 */
export const DaySheet: React.FC<DaySheetProps> = ({
    year,
    date,
    categories,
    assignedIds,
    onClose,
    onAddExisting,
    onCreate,
    onRemove,
    onClearAll
}) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#e66465');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const { monthIndex, day } = date;
    const holidayName = getHolidayName(monthIndex, day);
    const weekend = isWeekend(year, monthIndex, day);
    const assigned = assignedIds
        .map(id => categories.find(c => c.id === id))
        .filter(c => !!c) as Category[];
    const unassigned = categories.filter(c => !assignedIds.includes(c.id));

    const handleCreate = () => {
        if (!name.trim()) {
            Swal.fire({
                title: 'Error!',
                text: 'Please enter a name for the new label.',
                icon: 'error',
                confirmButtonColor: '#3085d6',
                background: 'var(--bg-color)',
                color: 'var(--text-color)'
            });
            return;
        }
        onCreate(name.trim(), color);
    };

    return (
        <div className="sheet-overlay" onClick={onClose}>
            <div
                className="sheet-content"
                role="dialog"
                aria-modal="true"
                aria-label={`${months[monthIndex]} ${day}, ${year}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="sheet-grabber" />

                <header className="sheet-header">
                    <div>
                        <h3>{months[monthIndex]} {day}, {year}</h3>
                        <p className="sheet-subtitle">
                            {holidayName ? holidayName : weekend ? 'Weekend' : 'Regular day'}
                        </p>
                    </div>
                    <button className="sheet-close" onClick={onClose} aria-label="Close">×</button>
                </header>

                <section className="sheet-section">
                    <h4>Labels on this day</h4>
                    {assigned.length === 0 ? (
                        <p className="sheet-empty">No labels yet.</p>
                    ) : (
                        <ul className="sheet-chip-list">
                            {assigned.map(cat => (
                                <li key={cat.id} className="sheet-chip">
                                    <span className="color-box" style={{ backgroundColor: cat.color }} />
                                    <span className="sheet-chip-name">{cat.name}</span>
                                    <button
                                        className="sheet-chip-remove"
                                        onClick={() => onRemove(cat.id)}
                                        aria-label={`Remove ${cat.name} from this day`}
                                    >×</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {unassigned.length > 0 && (
                    <section className="sheet-section">
                        <h4>Add existing label</h4>
                        <ul className="sheet-chip-list">
                            {unassigned.map(cat => (
                                <li key={cat.id}>
                                    <button
                                        className="sheet-chip sheet-chip-add"
                                        onClick={() => onAddExisting(cat.id)}
                                    >
                                        <span className="color-box" style={{ backgroundColor: cat.color }} />
                                        <span className="sheet-chip-name">{cat.name}</span>
                                        <span className="sheet-chip-plus">+</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="sheet-section">
                    {creating ? (
                        <>
                            <h4>New label</h4>
                            <div className="sheet-create-row">
                                <input
                                    type="text"
                                    placeholder="Label (e.g. Birthday)"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                                    autoFocus
                                />
                                <input
                                    type="color"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                    aria-label="Label color"
                                />
                                <button className="btn-primary" onClick={handleCreate}>Add</button>
                            </div>
                        </>
                    ) : (
                        <button className="sheet-link-button" onClick={() => setCreating(true)}>
                            + Create a new label
                        </button>
                    )}
                </section>

                {assigned.length > 0 && (
                    <button className="sheet-danger" onClick={onClearAll}>
                        Clear all labels on this day
                    </button>
                )}
            </div>
        </div>
    );
};
