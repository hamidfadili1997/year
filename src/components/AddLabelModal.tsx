import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface Category {
    id: string;
    name: string;
    color: string;
}

interface AddLabelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, color: string, existingId?: string) => void;
    categories: Category[];
}

export const AddLabelModal: React.FC<AddLabelModalProps> = ({ isOpen, onClose, onSave, categories }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#e66465');
    const [existingId, setExistingId] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setName('');
            setColor('#e66465');
            setExistingId('');
        }
    }, [isOpen]);

    const handleSave = () => {
        if (existingId) {
            onSave('', '', existingId);
        } else {
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
            onSave(name, color);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Add Label to Day</h3>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>Choose Existing:</label>
                    <select
                        value={existingId}
                        onChange={(e) => setExistingId(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                        }}
                    >
                        <option value="">-- Create New --</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {!existingId && (
                    <div className="add-category" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            placeholder="Label (e.g. Birthday)"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                            }}
                            autoFocus
                        />
                        <input
                            type="color"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                            }}
                        />
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};
