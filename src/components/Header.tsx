import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    year: number;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    onCloudSave: () => void;
    isSaving: boolean;
}

export const Header: React.FC<HeaderProps> = ({ year, theme, toggleTheme, onCloudSave, isSaving }) => {
    const { user, login, logout } = useAuth();

    return (
        <div className="calendar-header">
            <h1>Yearly Calendar {year}</h1>
            <div className="controls">
                <button onClick={toggleTheme} className="theme-toggle">
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </button>
                {user ? (
                    <div className="user-info">
                        <button
                            onClick={onCloudSave}
                            className="auth-button save"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save to Cloud'}
                        </button>
                        <span>{user.displayName}</span>
                        <button onClick={logout} className="auth-button logout">Logout</button>
                    </div>
                ) : (
                    <button onClick={login} className="auth-button login">Login with Google</button>
                )}
            </div>
        </div>
    );
};
