import React, { useState } from 'react';
import type { Label } from '../types';
import { MONTHS, getHolidayName, nextColor } from '../utils';
import { Modal } from './Modal';

interface DaySheetProps {
    year: number;
    monthIndex: number;
    day: number;
    labels: Label[];
    assignedIds: string[];
    onToggle: (labelId: string, on: boolean) => void;
    /** Creates a label and assigns it to this day. */
    onCreate: (name: string, color: string) => void;
    onClear: () => void;
    onClose: () => void;
}

export const DaySheet: React.FC<DaySheetProps> = ({
    year, monthIndex, day, labels, assignedIds, onToggle, onCreate, onClear, onClose,
}) => {
    const [newName, setNewName] = useState('');
    const date = new Date(year, monthIndex, day);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const title = `${MONTHS[monthIndex]} ${day}, ${year}`;
    const holiday = getHolidayName(year, monthIndex, day);
    const newColor = nextColor(labels.map(l => l.color));

    const create = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        onCreate(newName, newColor);
        setNewName('');
    };

    return (
        <Modal label={title} onClose={onClose}>
            <header className="sheet-head">
                <div>
                    <p className="sheet-weekday">{weekday}</p>
                    <h2 className="modal-title">{title}</h2>
                </div>
                <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </header>

            {holiday && <p className="holiday-note">Public holiday · {holiday}</p>}

            {labels.length > 0 ? (
                <ul className="check-list">
                    {labels.map(label => {
                        const on = assignedIds.includes(label.id);
                        return (
                            <li key={label.id}>
                                <label className={`check-row${on ? ' on' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={on}
                                        onChange={e => onToggle(label.id, e.target.checked)}
                                    />
                                    <span className="swatch" style={{ backgroundColor: label.color }} />
                                    <span className="check-name">{label.name}</span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="muted">No labels yet. Name one below to mark this day.</p>
            )}

            <form className="inline-form" onSubmit={create}>
                <span className="swatch" style={{ backgroundColor: newColor }} />
                <input
                    className="input"
                    type="text"
                    value={newName}
                    maxLength={40}
                    placeholder="New label…"
                    aria-label="New label name"
                    onChange={e => setNewName(e.target.value)}
                />
                <button type="submit" className="btn" disabled={!newName.trim()}>Add</button>
            </form>

            <div className="modal-actions">
                {assignedIds.length > 0 && (
                    <button type="button" className="btn ghost push-left" onClick={onClear}>Clear day</button>
                )}
                <button type="button" className="btn primary" onClick={onClose}>Done</button>
            </div>
        </Modal>
    );
};
