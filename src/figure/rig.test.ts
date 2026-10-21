import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../data/exercises';
import { LEN, loopLength, pose, sample, solve, solveIK } from './rig';

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('rig', () => {
  it('IK keeps bone lengths and reaches reachable targets', () => {
    const [mid, end] = solveIK([0, 0], [30, 40], 32, 30, 1);
    expect(dist([0, 0], mid)).toBeCloseTo(32);
    expect(dist(mid, end)).toBeCloseTo(30);
    expect(dist(end, [30, 40])).toBeLessThan(0.01);
  });

  it('the default standing pose puts the feet on the floor', () => {
    const s = solve(pose(), 'side');
    expect(s.legR.end[1]).toBeCloseTo(205);
  });
});

describe('exercises', () => {
  it('has 20 unique exercises with steps and sources', () => {
    expect(EXERCISES).toHaveLength(20);
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(20);
    for (const e of EXERCISES) {
      expect(e.steps.length).toBeGreaterThan(0);
      expect(e.sources.length).toBeGreaterThan(0);
    }
  });

  it('every animation solves to finite, in-frame, correctly sized limbs', () => {
    for (const e of EXERCISES) {
      const total = loopLength(e.anim.frames);
      for (let t = 0; t < total; t += 0.25) {
        const s = solve(sample(e.anim.frames, t), e.anim.view);
        for (const c of [s.armL, s.armR]) {
          expect(dist(c.mid, c.end), `${e.id} forearm`).toBeCloseTo(LEN.forearm, 3);
          for (const p of [c.root, c.mid, c.end, c.tip]) {
            expect(Number.isFinite(p[0]) && Number.isFinite(p[1]), e.id).toBe(true);
            expect(p[0], `${e.id} x`).toBeGreaterThan(-5);
            expect(p[0], `${e.id} x`).toBeLessThan(205);
            expect(p[1], `${e.id} y`).toBeLessThan(215);
          }
        }
        expect(s.head[1] - LEN.headR, `${e.id} head`).toBeGreaterThan(0);
      }
    }
  });
});
