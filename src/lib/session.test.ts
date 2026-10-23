import { describe, expect, it } from 'vitest';
import { isFinished, newSession, SESSION_GOAL, phasesFor, record, streak, toHistory, totalSeconds, undo, type HistoryEntry } from './session';

const ids = ['a', 'b', 'c'];

describe('session', () => {
  it('shuffles every exercise exactly once', () => {
    const s = newSession(ids);
    expect([...s.order].sort()).toEqual(ids);
  });

  it('records swipes in order, supports undo, and finishes', () => {
    let s = newSession(ids, 0, () => 0.5);
    s = record(s, 'done');
    s = record(s, 'skipped');
    expect(undo(s).results).toHaveLength(1);
    s = record(s, 'done');
    expect(isFinished(s)).toBe(true);
    expect(record(s, 'done')).toBe(s);
    const h = toHistory(s, 10);
    expect(h.done).toEqual([s.order[0], s.order[2]]);
    expect(h.skipped).toEqual([s.order[1]]);
  });
});

describe('session goal', () => {
  const many = Array.from({ length: 20 }, (_, i) => `e${i}`);

  it(`ends after ${SESSION_GOAL} done, however many were skipped`, () => {
    let s = newSession(many);
    for (let i = 0; i < 3; i++) s = record(s, 'skipped');
    for (let i = 0; i < SESSION_GOAL - 1; i++) s = record(s, 'done');
    expect(isFinished(s)).toBe(false);
    s = record(s, 'done');
    expect(isFinished(s)).toBe(true);
    expect(toHistory(s).done).toHaveLength(SESSION_GOAL);
  });

  it('ends when the deck runs out from skipping', () => {
    let s = newSession(many);
    for (let i = 0; i < many.length; i++) s = record(s, 'skipped');
    expect(isFinished(s)).toBe(true);
  });
});

describe('streak', () => {
  const at = (y: number, m: number, d: number, done = 1): HistoryEntry => {
    const t = new Date(y, m, d, 10).getTime();
    return { id: String(t), startedAt: t, finishedAt: t, done: Array(done).fill('x'), skipped: [] };
  };
  const now = new Date(2026, 9, 21, 15).getTime();

  it('counts consecutive days ending today', () => {
    expect(streak([at(2026, 9, 21), at(2026, 9, 20), at(2026, 9, 19), at(2026, 9, 17)], now)).toBe(3);
  });
  it('keeps the streak alive if today has no session yet', () => {
    expect(streak([at(2026, 9, 20), at(2026, 9, 19)], now)).toBe(2);
  });
  it('ignores sessions where everything was skipped', () => {
    expect(streak([at(2026, 9, 21, 0)], now)).toBe(0);
  });
  it('crosses month boundaries', () => {
    expect(streak([at(2026, 10, 1), at(2026, 9, 31)], new Date(2026, 10, 1, 12).getTime())).toBe(2);
  });
});

describe('timer phases', () => {
  it('adds a switch break between sides', () => {
    const p = phasesFor({ kind: 'hold', seconds: 30, sides: 2 })!;
    expect(p.map((x) => x.seconds)).toEqual([30, 5, 30]);
    expect(p[1].rest).toBe(true);
  });
  it('guides held reps with a short relax between them', () => {
    const p = phasesFor({ kind: 'reps', reps: 3, holdSeconds: 5 })!;
    expect(p).toHaveLength(5);
    expect(totalSeconds(p)).toBe(19);
  });
  it('has no timer for plain reps', () => {
    expect(phasesFor({ kind: 'reps', reps: 10 })).toBeNull();
  });
});
