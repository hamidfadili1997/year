import React from 'react';
import type { Label } from '../types';

interface LabelPanelProps {
    year: number;
    labels: Label[];
    /** Days carrying each label in the visible year. */
    counts: Record<string, number>;
    activeLabelId: string | null;
    onSelect: (id: string | null) => void;
    onEdit: (id: string) => void;
    onCreate: () => void;
    onQuickCreate: (name: string) => void;
}

const SUGGESTIONS = ['Vacation', 'Birthday', 'Work trip'];

/** Sidebar on desktop, thumb-reach bottom bar on phones. */
export const LabelPanel: React.FC<LabelPanelProps> = ({
    year, labels, counts, activeLabelId, onSelect, onEdit, onCreate, onQuickCreate,
}) => (
    <aside className="panel" aria-label="Labels">
        <div className="panel-head">
            <h2>Labels</h2>
            <p className="muted">
                {labels.length === 0
                    ? 'Labels colour your days — holidays off, trips, birthdays. Start with one:'
                    : 'Pick a label to mark many days at once, or click any day to see and edit it.'}
            </p>
        </div>

        {labels.length === 0 ? (
            <div className="suggestions">
                {SUGGESTIONS.map(name => (
                    <button key={name} type="button" className="chip" onClick={() => onQuickCreate(name)}>
                        + {name}
                    </button>
                ))}
            </div>
        ) : (
            <ul className="label-list">
                {labels.map(label => {
                    const active = label.id === activeLabelId;
                    return (
                        <li key={label.id} className={`label-row${active ? ' active' : ''}`}>
                            <button
                                type="button"
                                className="label-pick"
                                aria-pressed={active}
                                title={active ? 'Stop marking days' : `Mark days as ${label.name}`}
                                onClick={() => onSelect(active ? null : label.id)}
                            >
                                <span className="swatch" style={{ backgroundColor: label.color }} />
                                <span className="label-name">{label.name}</span>
                                <span className="label-count" title={`${counts[label.id] ?? 0} days in ${year}`}>
                                    {counts[label.id] ?? 0}
                                </span>
                            </button>
                            <button
                                type="button"
                                className="icon-btn label-edit"
                                aria-label={`Edit ${label.name}`}
                                title="Rename, recolour or delete"
                                onClick={() => onEdit(label.id)}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                    <path
                                        d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"
                                        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </li>
                    );
                })}
            </ul>
        )}

        <button type="button" className="btn new-label" onClick={onCreate} aria-label="New label">
            <span aria-hidden="true">+</span>
            <span className="new-label-text">New label</span>
        </button>
    </aside>
);
