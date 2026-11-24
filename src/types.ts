export interface Label {
    id: string;
    name: string;
    color: string;
}

/** Day key (`year-monthIndex-day`) -> label ids */
export type Assignments = Record<string, string[]>;

export type SyncState = 'local' | 'loading' | 'saving' | 'saved' | 'load-error' | 'save-error';
