// A tiny 2D skeleton. Poses are described with joint angles (or IK targets),
// solved into points, then drawn by Figure.tsx.
//
// Angle convention for limbs: 0° points straight down, +90° points to screen
// right, 180° points up. In the side view the figure faces screen right, so
// +90° on an arm means "reach forward". In the front view the screen-left
// limbs are mirrored, so positive angles always mean "away from the body".

export type Vec = [number, number];
export type View = 'front' | 'side';

export const FLOOR = 210;

export const LEN = {
  lowerTorso: 26,
  upperTorso: 30,
  neck: 11,
  headR: 12,
  upperArm: 32,
  forearm: 30,
  hand: 9,
  thigh: 44,
  shin: 44,
  foot: 15,
  shoulderHalf: 15,
  hipHalf: 8,
};

/** Named body points an IK target can be relative to. */
export type Anchor =
  | 'pelvis'
  | 'chest'
  | 'head'
  | 'kneeL'
  | 'kneeR'
  | 'ankleL'
  | 'ankleR'
  | 'elbowR'
  | 'handR';

export interface Limb {
  /** upper segment angle (arms: relative to torso, legs: absolute) */
  a?: number;
  /** middle joint flex (elbow / knee) */
  b?: number;
  /** hand / foot angle relative to the lower segment */
  c?: number;
  /** IK target: absolute point, or [anchor, dx, dy] */
  ik?: Vec | [Anchor, number, number];
  /** while animating between two different IK targets: the second target and the blend */
  ikTo?: Vec | [Anchor, number, number];
  ikT?: number;
  /** which way the middle joint bends when solving IK */
  bend?: 1 | -1;
  /** foreshortening of the upper segment (front view thighs etc.) */
  s?: number;
}

export interface Pose {
  x: number;
  y: number;
  /** lower torso lean, + toward screen right */
  torso: number;
  /** upper torso bend relative to lower torso */
  chest: number;
  /** torso length multiplier (front view forward lean) */
  tlen: number;
  /** front view trunk rotation, -1..1 (narrows the shoulders, turns the head) */
  twist: number;
  neck: number;
  head: number;
  /** face direction in front view, -1..1 */
  turn: number;
  /** shoulder offset in the torso frame: [forward, up] */
  sh: Vec;
  armL: Limb;
  armR: Limb;
  legL: Limb;
  legR: Limb;
}

export type PoseInput = Partial<Omit<Pose, 'armL' | 'armR' | 'legL' | 'legR'>> & {
  armL?: Limb;
  armR?: Limb;
  legL?: Limb;
  legR?: Limb;
};

export const BASE_POSE: Pose = {
  x: 100,
  y: FLOOR - 5 - LEN.thigh - LEN.shin,
  torso: 0,
  chest: 0,
  tlen: 1,
  twist: 0,
  neck: 0,
  head: 0,
  turn: 0,
  sh: [0, 0],
  armL: { a: 6, b: 8, c: 0 },
  armR: { a: 6, b: 8, c: 0 },
  legL: { a: 0, b: 0, c: 0 },
  legR: { a: 0, b: 0, c: 0 },
};

export function pose(...parts: PoseInput[]): Pose {
  const out: Pose = { ...BASE_POSE };
  for (const p of parts) {
    for (const [k, v] of Object.entries(p) as [keyof Pose, unknown][]) {
      if (k === 'armL' || k === 'armR' || k === 'legL' || k === 'legR') {
        const limb = v as Limb;
        // An IK limb replaces angle-driven limbs (and vice versa) rather than merging.
        out[k] = limb.ik ? { ...limb } : { ...(out[k].ik ? {} : out[k]), ...limb };
      } else {
        (out as unknown as Record<string, unknown>)[k] = v;
      }
    }
  }
  return out;
}

// ---------- math ----------

const RAD = Math.PI / 180;
/** Direction for a "down = 0°" angle. */
export const dir = (deg: number): Vec => [Math.sin(deg * RAD), Math.cos(deg * RAD)];
/** Direction for an "up = 0°" angle (torso, neck). */
const up = (deg: number): Vec => [Math.sin(deg * RAD), -Math.cos(deg * RAD)];
const add = (a: Vec, b: Vec, k = 1): Vec => [a[0] + b[0] * k, a[1] + b[1] * k];
const angleOf = (v: Vec) => Math.atan2(v[0], v[1]) / RAD;

/** Two-bone IK. Returns the middle joint and the (possibly clamped) end point. */
export function solveIK(root: Vec, target: Vec, l1: number, l2: number, bend: 1 | -1): [Vec, Vec] {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const raw = Math.hypot(dx, dy) || 0.0001;
  const d = Math.min(Math.max(raw, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const base = angleOf([dx, dy]);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const alpha = Math.acos(Math.min(1, Math.max(-1, cosA))) / RAD;
  const mid = add(root, dir(base + bend * alpha), l1);
  const end = add(mid, dir(angleOf([target[0] - mid[0], target[1] - mid[1]])), l2);
  return [mid, end];
}

// ---------- solving ----------

export interface Chain {
  root: Vec;
  mid: Vec;
  end: Vec;
  tip: Vec;
}

export interface Solved {
  pelvis: Vec;
  waist: Vec;
  shoulders: Vec;
  neckTop: Vec;
  head: Vec;
  headAngle: number;
  turn: number;
  armL: Chain;
  armR: Chain;
  legL: Chain;
  legR: Chain;
}

export function solve(p: Pose, view: View): Solved {
  const pelvis: Vec = [p.x, p.y];
  const lowerAng = p.torso;
  const upperAng = p.torso + p.chest;
  const waist = add(pelvis, up(lowerAng), LEN.lowerTorso * p.tlen);
  const shoulders = add(waist, up(upperAng), LEN.upperTorso * p.tlen);
  const neckAng = upperAng + p.neck;
  const neckTop = add(shoulders, up(neckAng), LEN.neck);
  const headAngle = neckAng + p.head;
  const head = add(neckTop, up(headAngle), LEN.headR - 2);

  const anchors: Partial<Record<Anchor, Vec>> = { pelvis, chest: shoulders, head };
  const point = (ik: NonNullable<Limb['ik']>): Vec =>
    typeof ik[0] === 'string'
      ? add(anchors[ik[0] as Anchor] ?? pelvis, [ik[1] as number, ik[2] as number])
      : (ik as Vec);
  const target = (l: Limb): Vec => {
    const a = point(l.ik!);
    if (!l.ikTo) return a;
    const b = point(l.ikTo);
    const t = l.ikT ?? 0;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };

  // Hip and shoulder sockets.
  const front = view === 'front';
  const hipOff = front ? LEN.hipHalf : 0;
  const hipL: Vec = [pelvis[0] - hipOff, pelvis[1]];
  const hipR: Vec = [pelvis[0] + hipOff, pelvis[1]];
  const shHalf = front ? LEN.shoulderHalf * (1 - 0.4 * Math.abs(p.twist)) : 0;
  // Shoulder offset expressed in the upper-torso frame.
  // Perpendicular to the spine: "forward" in side view, "across the chest" in front view.
  const fwd = dir(90 - upperAng);
  const upv = up(upperAng);
  const shoulderBase = add(add(shoulders, fwd, p.sh[0]), upv, p.sh[1]);
  const shL = add(shoulderBase, fwd, -shHalf + p.twist * 3);
  const shR = add(shoulderBase, fwd, shHalf + p.twist * 3);

  const leg = (l: Limb, hip: Vec, mirror: boolean): Chain => {
    const m = mirror ? -1 : 1;
    let knee: Vec;
    let ankle: Vec;
    let shinAng: number;
    if (l.ik) {
      [knee, ankle] = solveIK(hip, target(l), LEN.thigh * (l.s ?? 1), LEN.shin, (l.bend ?? 1) as 1 | -1);
      shinAng = angleOf([ankle[0] - knee[0], ankle[1] - knee[1]]);
    } else {
      const thighAng = m * (l.a ?? 0);
      knee = add(hip, dir(thighAng), LEN.thigh * (l.s ?? 1));
      shinAng = thighAng - m * (l.b ?? 0);
      ankle = add(knee, dir(shinAng), LEN.shin);
    }
    const footAng = front ? shinAng + m * 70 : shinAng + 90 + (l.c ?? 0);
    const tip = add(ankle, dir(footAng), front ? 6 : LEN.foot);
    return { root: hip, mid: knee, end: ankle, tip };
  };

  const legL = leg(p.legL, hipL, front);
  const legR = leg(p.legR, hipR, false);
  anchors.kneeL = legL.mid;
  anchors.kneeR = legR.mid;
  anchors.ankleL = legL.end;
  anchors.ankleR = legR.end;

  // Arms hang along the torso at 0°, so their base angle follows the torso.
  const armBase = -upperAng;
  const arm = (l: Limb, sh: Vec, mirror: boolean): Chain => {
    const m = mirror ? -1 : 1;
    let elbow: Vec;
    let wrist: Vec;
    let foreAng: number;
    if (l.ik) {
      [elbow, wrist] = solveIK(sh, target(l), LEN.upperArm * (l.s ?? 1), LEN.forearm, (l.bend ?? 1) as 1 | -1);
      foreAng = angleOf([wrist[0] - elbow[0], wrist[1] - elbow[1]]);
    } else {
      const upperAngA = armBase + m * (l.a ?? 0);
      elbow = add(sh, dir(upperAngA), LEN.upperArm * (l.s ?? 1));
      foreAng = upperAngA + m * (l.b ?? 0);
      wrist = add(elbow, dir(foreAng), LEN.forearm);
    }
    const tip = add(wrist, dir(foreAng + m * (l.c ?? 0)), LEN.hand);
    return { root: sh, mid: elbow, end: wrist, tip };
  };

  const armR = arm(p.armR, shR, false);
  anchors.elbowR = armR.mid;
  anchors.handR = armR.tip;
  const armL = arm(p.armL, shL, front);

  return { pelvis, waist, shoulders, neckTop, head, headAngle, turn: p.turn + p.twist, armL, armR, legL, legR };
}

// ---------- animation ----------

export interface Keyframe {
  pose: Pose;
  /** seconds to move into this pose from the previous one */
  move: number;
  /** seconds to hold once there */
  hold: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

function lerpLimb(a: Limb, b: Limb, t: number): Limb {
  if (a.ik || b.ik) {
    // Blend the two resolved targets inside solve(), so moving a hand from
    // one body part to another (or from angles to a target) stays smooth.
    return {
      ik: a.ik ?? b.ik,
      ikTo: b.ik ?? a.ik,
      ikT: t,
      bend: t < 0.5 ? (a.bend ?? b.bend) : (b.bend ?? a.bend),
      c: lerp(a.c ?? 0, b.c ?? 0, t),
      s: lerp(a.s ?? 1, b.s ?? 1, t),
    };
  }
  return {
    a: lerp(a.a ?? 0, b.a ?? 0, t),
    b: lerp(a.b ?? 0, b.b ?? 0, t),
    c: lerp(a.c ?? 0, b.c ?? 0, t),
    s: lerp(a.s ?? 1, b.s ?? 1, t),
  };
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    torso: lerp(a.torso, b.torso, t),
    chest: lerp(a.chest, b.chest, t),
    tlen: lerp(a.tlen, b.tlen, t),
    twist: lerp(a.twist, b.twist, t),
    neck: lerp(a.neck, b.neck, t),
    head: lerp(a.head, b.head, t),
    turn: lerp(a.turn, b.turn, t),
    sh: [lerp(a.sh[0], b.sh[0], t), lerp(a.sh[1], b.sh[1], t)],
    armL: lerpLimb(a.armL, b.armL, t),
    armR: lerpLimb(a.armR, b.armR, t),
    legL: lerpLimb(a.legL, b.legL, t),
    legR: lerpLimb(a.legR, b.legR, t),
  };
}

export function loopLength(frames: Keyframe[]): number {
  return frames.reduce((s, f) => s + f.move + f.hold, 0);
}

/** Pose at time `time` (seconds) in a looping keyframe sequence. */
export function sample(frames: Keyframe[], time: number): Pose {
  if (frames.length === 1) return frames[0].pose;
  const total = loopLength(frames);
  let t = ((time % total) + total) % total;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const prev = frames[(i - 1 + frames.length) % frames.length];
    if (t < f.move) return lerpPose(prev.pose, f.pose, ease(t / f.move));
    t -= f.move;
    if (t < f.hold) return f.pose;
    t -= f.hold;
  }
  return frames[0].pose;
}
