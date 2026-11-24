import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Assignments, Label, SyncState } from '../types';
import { migrateAssignments } from '../utils';

const SAVE_DELAY_MS = 800;

function readLocal<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

const serialize = (labels: Label[], assignments: Assignments) =>
    JSON.stringify({ categories: labels, dayAssignments: assignments });

/**
 * Planner data. Always kept in localStorage; when signed in it is loaded from
 * the cloud once and then saved back automatically after each change.
 */
export function usePlanner() {
    const { user } = useAuth();
    const uid = user?.uid ?? null;

    const [labels, setLabels] = useState<Label[]>(() => readLocal('calendar_categories', []));
    const [assignments, setAssignments] = useState<Assignments>(() =>
        migrateAssignments(readLocal('calendar_assignments', {}))
    );

    useEffect(() => {
        localStorage.setItem('calendar_categories', JSON.stringify(labels));
    }, [labels]);

    useEffect(() => {
        localStorage.setItem('calendar_assignments', JSON.stringify(assignments));
    }, [assignments]);

    // ---- Cloud sync ----
    const [cloudState, setCloudState] = useState<Exclude<SyncState, 'local'>>('loading');
    /** uid whose cloud copy has been loaded; saving is only allowed for this user. */
    const [readyUid, setReadyUid] = useState<string | null>(null);
    const [loadTick, setLoadTick] = useState(0);
    const [saveTick, setSaveTick] = useState(0);
    const lastSynced = useRef<string | null>(null);
    const latestPayload = useRef('');

    useEffect(() => {
        if (!uid) return;
        let cancelled = false;
        (async () => {
            try {
                const snap = await getDoc(doc(db, 'users', uid));
                if (cancelled) return;
                if (snap.exists()) {
                    const data = snap.data();
                    const cloudLabels: Label[] = Array.isArray(data.categories) ? data.categories : [];
                    const cloudAssignments = migrateAssignments(data.dayAssignments);
                    lastSynced.current = serialize(cloudLabels, cloudAssignments);
                    setLabels(cloudLabels);
                    setAssignments(cloudAssignments);
                } else {
                    lastSynced.current = null;
                }
                setReadyUid(uid);
                setCloudState('saved');
            } catch (error) {
                console.error('Error loading cloud data:', error);
                if (!cancelled) setCloudState('load-error');
            }
        })();
        return () => {
            cancelled = true;
            setReadyUid(null);
        };
    }, [uid, loadTick]);

    const payload = serialize(labels, assignments);
    const canSave = uid !== null && readyUid === uid;

    useEffect(() => {
        latestPayload.current = payload;
        if (!uid || !canSave || payload === lastSynced.current) return;
        const timer = setTimeout(async () => {
            setCloudState('saving');
            try {
                await setDoc(doc(db, 'users', uid), {
                    ...JSON.parse(payload),
                    lastUpdated: new Date().toISOString(),
                });
                lastSynced.current = payload;
                if (latestPayload.current === payload) setCloudState('saved');
            } catch (error) {
                console.error('Error saving to cloud:', error);
                setCloudState('save-error');
            }
        }, SAVE_DELAY_MS);
        return () => clearTimeout(timer);
    }, [payload, canSave, uid, saveTick]);

    const sync: SyncState = !uid ? 'local' : readyUid !== uid && cloudState !== 'load-error' ? 'loading' : cloudState;

    const retrySync = useCallback(() => {
        // A failed load is retried as a load so unsynced cloud data is never overwritten.
        if (cloudState === 'load-error') {
            setCloudState('loading');
            setLoadTick(t => t + 1);
        } else {
            setSaveTick(t => t + 1);
        }
    }, [cloudState]);

    // ---- Mutations ----
    const setDayLabel = useCallback((key: string, labelId: string, on: boolean) => {
        setAssignments(prev => {
            const current = prev[key] ?? [];
            if (current.includes(labelId) === on) return prev;
            const next = { ...prev };
            const updated = on ? [...current, labelId] : current.filter(id => id !== labelId);
            if (updated.length) next[key] = updated;
            else delete next[key];
            return next;
        });
    }, []);

    const clearDay = useCallback((key: string) => {
        setAssignments(prev => {
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    const addLabel = useCallback((name: string, color: string) => {
        const label: Label = { id: crypto.randomUUID(), name: name.trim(), color };
        setLabels(prev => [...prev, label]);
        return label.id;
    }, []);

    const updateLabel = useCallback((id: string, name: string, color: string) => {
        setLabels(prev => prev.map(l => (l.id === id ? { ...l, name: name.trim(), color } : l)));
    }, []);

    const removeLabel = useCallback((id: string) => {
        setLabels(prev => prev.filter(l => l.id !== id));
        setAssignments(prev => {
            const next: Assignments = {};
            for (const [key, ids] of Object.entries(prev)) {
                const kept = ids.filter(x => x !== id);
                if (kept.length) next[key] = kept;
            }
            return next;
        });
    }, []);

    return { labels, assignments, sync, retrySync, setDayLabel, clearDay, addLabel, updateLabel, removeLabel };
}
