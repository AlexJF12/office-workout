import type { Dose } from '../data/exercises';

export type Result = 'done' | 'skipped';

export interface Session {
  id: string;
  startedAt: number;
  /** exercise ids in the shuffled order for this session */
  order: string[];
  results: { id: string; result: Result }[];
}

export interface HistoryEntry {
  id: string;
  startedAt: number;
  finishedAt: number;
  done: string[];
  skipped: string[];
}

export function shuffle<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newSession(ids: readonly string[], now = Date.now(), rand: () => number = Math.random): Session {
  return { id: `${now.toString(36)}-${Math.floor(rand() * 1e6).toString(36)}`, startedAt: now, order: shuffle(ids, rand), results: [] };
}

/** A session ends once this many moves are done (or the deck runs out from skipping). */
export const SESSION_GOAL = 5;

export const position = (s: Session) => s.results.length;
export const doneCount = (s: Session) => s.results.filter((r) => r.result === 'done').length;
export const isFinished = (s: Session) => doneCount(s) >= SESSION_GOAL || s.results.length >= s.order.length;
export const currentId = (s: Session): string | undefined => s.order[s.results.length];

export function record(s: Session, result: Result): Session {
  const id = currentId(s);
  if (!id) return s;
  return { ...s, results: [...s.results, { id, result }] };
}

export function undo(s: Session): Session {
  return s.results.length ? { ...s, results: s.results.slice(0, -1) } : s;
}

export function toHistory(s: Session, now = Date.now()): HistoryEntry {
  return {
    id: s.id,
    startedAt: s.startedAt,
    finishedAt: now,
    done: s.results.filter((r) => r.result === 'done').map((r) => r.id),
    skipped: s.results.filter((r) => r.result === 'skipped').map((r) => r.id),
  };
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * Consecutive days (ending today, or yesterday if nothing yet today) with at
 * least one exercise done.
 */
export function streak(history: HistoryEntry[], now = Date.now()): number {
  const active = new Set(history.filter((h) => h.done.length > 0).map((h) => dayKey(h.finishedAt)));
  const day = new Date(now);
  day.setHours(12, 0, 0, 0);
  if (!active.has(dayKey(day.getTime()))) day.setDate(day.getDate() - 1);
  let n = 0;
  while (active.has(dayKey(day.getTime()))) {
    n++;
    day.setDate(day.getDate() - 1);
  }
  return n;
}

// ---------- timer ----------

export interface Phase {
  label: string;
  seconds: number;
  /** a short relax/switch gap rather than work */
  rest?: boolean;
}

const SWITCH_SECONDS = 5;
const REP_REST_SECONDS = 2;

/** The timer sequence for a dose, or null if the exercise isn't timed. */
export function phasesFor(dose: Dose): Phase[] | null {
  switch (dose.kind) {
    case 'hold':
      if (dose.sides === 1) return [{ label: 'Hold', seconds: dose.seconds }];
      return [
        { label: 'First side', seconds: dose.seconds },
        { label: 'Switch sides', seconds: SWITCH_SECONDS, rest: true },
        { label: 'Second side', seconds: dose.seconds },
      ];
    case 'phases':
      return dose.phases.map((p) => ({ ...p }));
    case 'reps': {
      if (!dose.holdSeconds) return null;
      const out: Phase[] = [];
      for (let i = 1; i <= dose.reps; i++) {
        out.push({ label: `Hold · rep ${i}/${dose.reps}`, seconds: dose.holdSeconds });
        if (i < dose.reps) out.push({ label: 'Relax', seconds: REP_REST_SECONDS, rest: true });
      }
      return out;
    }
  }
}

export function totalSeconds(phases: Phase[]): number {
  return phases.reduce((s, p) => s + p.seconds, 0);
}

/** Short human label for a dose, e.g. "30s each side" or "10 reps · 5s hold". */
export function doseLabel(dose: Dose): string {
  switch (dose.kind) {
    case 'hold':
      return dose.sides === 2 ? `${dose.seconds}s each side` : `${dose.seconds}s hold`;
    case 'phases':
      return `${totalSeconds(dose.phases)}s guided`;
    case 'reps':
      if (dose.holdSeconds) return `${dose.reps} reps · ${dose.holdSeconds}s hold`;
      return dose.perSide ? `${dose.reps} reps each side` : `${dose.reps} reps`;
  }
}
