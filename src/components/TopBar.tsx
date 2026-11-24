import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { SyncState } from '../types';

interface TopBarProps {
    year: number;
    canGoBack: boolean;
    onPrevYear: () => void;
    onNextYear: () => void;
    onToday: () => void;
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
    sync: SyncState;
    onRetrySync: () => void;
}

const SYNC_TEXT: Record<SyncState, string> = {
    'local': 'Saved on this device',
    'loading': 'Loading…',
    'saving': 'Saving…',
    'saved': 'Synced',
    'load-error': 'Couldn’t load your planner',
    'save-error': 'Couldn’t save changes',
};

const Chevron: React.FC<{ dir: 'left' | 'right' }> = ({ dir }) => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
            d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
            fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        />
    </svg>
);

export const TopBar: React.FC<TopBarProps> = ({
    year, canGoBack, onPrevYear, onNextYear, onToday, theme, onToggleTheme, sync, onRetrySync,
}) => {
    const { user, login, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const failed = sync === 'load-error' || sync === 'save-error';

    useEffect(() => {
        if (!menuOpen) return;
        const close = (e: Event) => {
            if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', close);
        return () => {
            document.removeEventListener('pointerdown', close);
            document.removeEventListener('keydown', close);
        };
    }, [menuOpen]);

    return (
        <header className="topbar">
            <div className="topbar-inner">
                <span className="brand">Yearly Calendar</span>

                <nav className="year-nav" aria-label="Year">
                    <button
                        type="button" className="icon-btn" onClick={onPrevYear} disabled={!canGoBack}
                        aria-label={`Previous year, ${year - 1}`} title={canGoBack ? String(year - 1) : undefined}
                    >
                        <Chevron dir="left" />
                    </button>
                    <h1 className="year" aria-live="polite">{year}</h1>
                    <button
                        type="button" className="icon-btn" onClick={onNextYear}
                        aria-label={`Next year, ${year + 1}`} title={String(year + 1)}
                    >
                        <Chevron dir="right" />
                    </button>
                    <button type="button" className="btn today-btn" onClick={onToday}>Today</button>
                </nav>

                <div className="topbar-actions">
                    {user && (
                        failed ? (
                            <button type="button" className="sync-status failed" onClick={onRetrySync}>
                                {SYNC_TEXT[sync]} · Retry
                            </button>
                        ) : (
                            <span className="sync-status" role="status">{SYNC_TEXT[sync]}</span>
                        )
                    )}

                    <button
                        type="button" className="icon-btn" onClick={onToggleTheme}
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                        title={`${theme === 'dark' ? 'Light' : 'Dark'} theme`}
                    >
                        {theme === 'dark' ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <circle cx="12" cy="12" r="4.5" fill="currentColor" />
                                <path
                                    d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor" />
                            </svg>
                        )}
                    </button>

                    {user ? (
                        <div className="account" ref={menuRef}>
                            <button
                                type="button"
                                className={`avatar-btn${failed ? ' failed' : ''}`}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                aria-label="Account"
                                onClick={() => setMenuOpen(o => !o)}
                            >
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                                ) : (
                                    <span>{(user.displayName || user.email || '?')[0].toUpperCase()}</span>
                                )}
                            </button>
                            {menuOpen && (
                                <div className="menu" role="menu">
                                    <p className="menu-name">{user.displayName || user.email}</p>
                                    <p className="menu-status">{SYNC_TEXT[sync]}</p>
                                    <button
                                        type="button" className="btn" role="menuitem"
                                        onClick={() => { setMenuOpen(false); logout(); }}
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button" className="btn primary" onClick={login}
                            title="Sign in with Google to keep your planner in sync across devices"
                        >
                            Sign in<span className="hide-narrow"> to sync</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
