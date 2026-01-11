import React from 'react';

interface HeaderProps {
    year: number;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ year, theme, toggleTheme }) => {
    return (
        <div className="calendar-header">
            <h1>Yearly Calendar {year}</h1>
            <div className="controls">
                <button onClick={toggleTheme} className="theme-toggle">
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </button>
            </div>
        </div>
    );
};
