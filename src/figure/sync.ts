// Maps the guided timer's phases onto the figure's keyframes, so the figure
// holds the stretch while the timer says "Hold" and relaxes while it says "Relax".
import type { Phase } from '../lib/session';
import type { Animation } from './Figure';

/** What one timer phase shows: a keyframe index (optionally mirrored for the other side), or the live loop. */
export type PhasePose = number | 'loop' | { frame: number; mirror?: boolean };

export interface FigureTarget {
  frame: number | 'loop';
  mirror: boolean;
}

/** The start pose: where the figure relaxes back to. */
export const restFrame = (anim: Animation) => anim.rest ?? 0;

/** The end pose: where the figure holds the stretch. Defaults to the keyframe (other than the start) held longest. */
export function workFrame(anim: Animation): number {
  if (anim.work !== undefined) return anim.work;
  const rest = restFrame(anim);
  let best = -1;
  anim.frames.forEach((f, i) => {
    if (i !== rest && (best < 0 || f.hold > anim.frames[best].hold)) best = i;
  });
  return best < 0 ? rest : best;
}

/** One figure target per timer phase. */
export function phaseTargets(anim: Animation, phases: Phase[]): FigureTarget[] {
  const explicit = anim.phasePoses;
  const out = phases.map((p, i): FigureTarget => {
    const pp = explicit?.[i];
    if (pp === 'loop') return { frame: 'loop', mirror: false };
    if (typeof pp === 'number') return { frame: pp, mirror: false };
    if (pp) return { frame: pp.frame, mirror: !!pp.mirror };
    if (p.rest) return { frame: restFrame(anim), mirror: false };
    if (p.side === 2 && anim.secondSide !== undefined) return { frame: anim.secondSide, mirror: false };
    return { frame: workFrame(anim), mirror: p.side === 2 };
  });
  // A default rest phase takes the side of the phase after it, so the figure
  // flips to the other side while relaxing rather than mid-stretch.
  for (let i = out.length - 2; i >= 0; i--) {
    if (phases[i].rest && explicit?.[i] === undefined && anim.secondSide === undefined) out[i].mirror = out[i + 1].mirror;
  }
  return out;
}
