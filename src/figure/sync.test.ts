import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../data/exercises';
import { phasesFor } from '../lib/session';
import { phaseTargets, restFrame, workFrame } from './sync';

describe('timer → figure sync', () => {
  for (const e of EXERCISES) {
    const phases = phasesFor(e.dose);
    if (!phases) continue;
    it(`${e.id}: every timer phase maps to a real pose`, () => {
      if (e.anim.phasePoses) expect(e.anim.phasePoses).toHaveLength(phases.length);
      const targets = phaseTargets(e.anim, phases);
      expect(targets).toHaveLength(phases.length);
      for (const t of targets) {
        if (t.frame !== 'loop') expect(e.anim.frames[t.frame]).toBeDefined();
      }
    });
  }

  it('holds the stretch on Hold and relaxes on Relax', () => {
    const e = EXERCISES.find((x) => x.id === 'overhead-reach')!;
    const [hold, relax] = phaseTargets(e.anim, phasesFor(e.dose)!);
    expect(hold.frame).toBe(workFrame(e.anim));
    expect(relax.frame).toBe(restFrame(e.anim));
    expect(hold.frame).not.toBe(relax.frame);
  });

  it('mirrors the second side of a two-sided hold, flipping during the switch', () => {
    const e = EXERCISES.find((x) => x.id === 'doorway-chest-stretch')!;
    const t = phaseTargets(e.anim, phasesFor(e.dose)!);
    expect(t.map((x) => x.mirror)).toEqual([false, true, true]);
    expect(t[1].frame).toBe(restFrame(e.anim));
  });
});
