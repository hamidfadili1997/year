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
            <div className="header-actions">
                <button onClick={toggleTheme} className="theme-toggle">
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                {user ? (
                    <>
                        <button
                            onClick={onCloudSave}
                            className="auth-button save"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : '☁️ Save'}
                        </button>
                        <div className="user-info">
                            {user.photoURL && (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || 'User'}
                                    className="user-avatar"
                                    referrerPolicy="no-referrer"
                                />
                            )}
                            <span className="user-name">{user.displayName}</span>
                        </div>
                        <button onClick={logout} className="auth-button logout">Logout</button>
                    </>
                ) : (
                    <button onClick={login} className="auth-button login">Sign in with Google</button>
                )}
            </div>
        </div>
    );
};
