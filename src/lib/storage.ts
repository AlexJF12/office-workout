import type { HistoryEntry, Session } from './session';

// Everything lives in this browser's localStorage. Reads and writes are
// wrapped so private mode or blocked storage just means "no history".

const SESSION_KEY = 'office-workout.session.v1';
const HISTORY_KEY = 'office-workout.history.v1';
const MAX_HISTORY = 365;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable; the app still works for this visit
  }
}

export function loadSession(validIds: Set<string>): Session | null {
  const s = read<Session>(SESSION_KEY);
  // Drop sessions from an older exercise list rather than showing broken cards.
  if (!s || !Array.isArray(s.order) || !Array.isArray(s.results) || !s.order.every((id) => validIds.has(id))) return null;
  return s;
}

export const saveSession = (s: Session | null) => write(SESSION_KEY, s);

export function loadHistory(): HistoryEntry[] {
  const h = read<HistoryEntry[]>(HISTORY_KEY);
  return Array.isArray(h) ? h : [];
}

export function addHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...loadHistory().filter((h) => h.id !== entry.id)].slice(0, MAX_HISTORY);
  write(HISTORY_KEY, next);
  return next;
}

export function clearHistory() {
  write(HISTORY_KEY, null);
}
