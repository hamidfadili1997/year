import React, { useState } from 'react';
import Swal from 'sweetalert2';

interface Category {
    id: string;
    name: string;
    color: string;
}

interface LegendControlsProps {
    categories: Category[];
    selectedCategoryId: string | null;
    onSelectCategory: (id: string | null) => void;
    onAddCategory: (name: string, color: string) => void;
    onRemoveCategory: (id: string) => void;
}

export const LegendControls: React.FC<LegendControlsProps> = ({
    categories,
    selectedCategoryId,
    onSelectCategory,
    onAddCategory,
    onRemoveCategory
}) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#000000');

    const handleAdd = () => {
        if (!newCategoryName.trim()) {
            Swal.fire({
                title: 'Error!',
                text: 'Please enter a category name.',
                icon: 'error',
                confirmButtonColor: '#3085d6',
                background: 'var(--bg-color)',
                color: 'var(--text-color)'
            });
            return;
        }
        onAddCategory(newCategoryName, newCategoryColor);
        setNewCategoryName('');
        setNewCategoryColor('#000000');
    };

    const handleRemoveClick = (e: React.MouseEvent, cat: Category) => {
        e.stopPropagation();
        Swal.fire({
            title: 'Are you sure?',
            text: `Delete category "${cat.name}" and clear all assignments?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: 'var(--bg-color)',
            color: 'var(--text-color)'
        }).then((result) => {
            if (result.isConfirmed) {
                onRemoveCategory(cat.id);
            }
        });
    };

    return (
        <div className="custom-legend-controls">
            <h3>Manage Custom Legend</h3>
            <p style={{ fontSize: '0.9em', color: 'var(--text-color)', opacity: 0.8, marginTop: '-10px', marginBottom: '15px' }}>
                Tip: Right-click any day on the calendar to quickly add a label!
            </p>
            <div className="add-category">
                <input
                    type="text"
                    placeholder="Category Name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd();
                    }}
                />
                <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd();
                    }}
                />
                <button onClick={handleAdd}>Add Category</button>
            </div>
            <div className="category-list">
                <div
                    className={`category-item ${selectedCategoryId === null ? 'selected' : ''}`}
                    onClick={() => onSelectCategory(null)}
                >
                    <span>Eraser / None</span>
                </div>
                {categories.map(cat => (
                    <div
                        key={cat.id}
                        className={`category-item ${selectedCategoryId === cat.id ? 'selected' : ''}`}
                        onClick={() => onSelectCategory(cat.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="color-box" style={{ backgroundColor: cat.color }}></div>
                            <span>{cat.name}</span>
                        </div>
                        <button
                            className="remove-cat-btn"
                            onClick={(e) => handleRemoveClick(e, cat)}
                            title="Remove Category"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-color)',
                                cursor: 'pointer',
                                opacity: 0.6,
                                padding: '4px 8px',
                                fontSize: '1.2em'
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
