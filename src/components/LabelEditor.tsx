import React, { useState } from 'react';
import type { Label } from '../types';
import { PALETTE, nextColor } from '../utils';
import { Modal } from './Modal';

interface LabelEditorProps {
    /** Label being edited; omit to create a new one. */
    label?: Label;
    usedColors: string[];
    /** Days (all years) carrying this label, shown in the delete warning. */
    dayCount: number;
    onSave: (name: string, color: string) => void;
    onDelete: () => void;
    onClose: () => void;
}

export const LabelEditor: React.FC<LabelEditorProps> = ({ label, usedColors, dayCount, onSave, onDelete, onClose }) => {
    const [name, setName] = useState(label?.name ?? '');
    const [color, setColor] = useState(label?.color ?? nextColor(usedColors));
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) onSave(name, color);
    };

    return (
        <Modal label={label ? 'Edit label' : 'New label'} onClose={onClose}>
            <form onSubmit={submit} className="form">
                <h2 className="modal-title">{label ? 'Edit label' : 'New label'}</h2>

                <label className="field">
                    <span className="field-label">Name</span>
                    <input
                        className="input"
                        type="text"
                        value={name}
                        maxLength={40}
                        placeholder="e.g. Vacation"
                        onChange={e => setName(e.target.value)}
                        autoFocus
                    />
                </label>

                <div className="field">
                    <span className="field-label">Colour</span>
                    <div className="swatches">
                        {PALETTE.map(c => (
                            <button
                                key={c}
                                type="button"
                                className={`swatch-btn${c === color ? ' selected' : ''}`}
                                style={{ backgroundColor: c }}
                                aria-label={`Colour ${c}`}
                                aria-pressed={c === color}
                                onClick={() => setColor(c)}
                            />
                        ))}
                        <label className={`swatch-btn custom${PALETTE.includes(color) ? '' : ' selected'}`} title="Custom colour">
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="Custom colour" />
                        </label>
                    </div>
                </div>

                {confirmingDelete ? (
                    <div className="confirm">
                        <p>
                            Delete “{label?.name}”?
                            {dayCount > 0 && ` It will be removed from ${dayCount} day${dayCount === 1 ? '' : 's'}.`}
                        </p>
                        <div className="modal-actions">
                            <button type="button" className="btn" onClick={() => setConfirmingDelete(false)}>Keep</button>
                            <button type="button" className="btn danger" onClick={onDelete}>Delete</button>
                        </div>
                    </div>
                ) : (
                    <div className="modal-actions">
                        {label && (
                            <button type="button" className="btn ghost danger-text push-left" onClick={() => setConfirmingDelete(true)}>
                                Delete
                            </button>
                        )}
                        <button type="button" className="btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn primary" disabled={!name.trim()}>
                            {label ? 'Save' : 'Create'}
                        </button>
                    </div>
                )}
            </form>
        </Modal>
    );
};
