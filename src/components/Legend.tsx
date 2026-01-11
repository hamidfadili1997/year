import React from 'react';

interface Category {
    id: string;
    name: string;
    color: string;
}

interface LegendProps {
    categories: Category[];
}

export const Legend: React.FC<LegendProps> = ({ categories }) => {
    return (
        <div className="legend">
            <div className="legend-item">
                <div className="color-box" style={{ backgroundColor: 'var(--weekday-bg)' }}></div>
                <span>Regular Day</span>
            </div>
            <div className="legend-item">
                <div className="color-box" style={{ backgroundColor: 'var(--weekend-bg)' }}></div>
                <span>Weekend</span>
            </div>
            <div className="legend-item">
                <div className="color-box" style={{ backgroundColor: 'var(--holiday-bg)' }}></div>
                <span>Holiday</span>
            </div>
            {categories.map(cat => (
                <div className="legend-item" key={cat.id}>
                    <div className="color-box" style={{ backgroundColor: cat.color }}></div>
                    <span>{cat.name}</span>
                </div>
            ))}
        </div>
    );
};
