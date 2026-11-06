import { useEffect, useRef, useState } from 'react';
import {
  ease,
  FLOOR,
  frameTimes,
  LEN,
  lerpSolved,
  loopLength,
  sample,
  solve,
  type Chain,
  type Keyframe,
  type Pose,
  type Solved,
  type Vec,
  type View,
} from './rig';
import { Prop, type PropSpec } from './Props';
import { restFrame, workFrame, type FigureTarget, type PhasePose } from './sync';
import './figure.css';

export type BodyPart =
  | 'neck'
  /** the line across the shoulders (front view) */
  | 'shoulders'
  | 'upperTorso'
  | 'lowerTorso'
  | 'upperArmL'
  | 'forearmL'
  | 'upperArmR'
  | 'forearmR'
  | 'thighL'
  | 'shinL'
  | 'thighR'
  | 'shinR';

export interface Animation {
  view: View;
  frames: Keyframe[];
  props?: PropSpec[];
  /** segments drawn in the accent colour to show where you should feel it */
  focus?: BodyPart[];
  /** optional motion hint, an SVG path in figure coordinates */
  hint?: string;
  /** keyframe of the start pose (default 0) */
  rest?: number;
  /** keyframe of the end / stretch pose (default: the keyframe held longest) */
  work?: number;
  /** one entry per guided-timer phase, when the defaults (hold → work, relax → rest) aren't right */
  phasePoses?: PhasePose[];
  /** keyframe for the timer's second-side holds, instead of mirroring the whole scene (for sides that alternate every rep) */
  secondSide?: number;
  /** draw hands bigger, for moves where the hand position is the point */
  handScale?: number;
  /** a fixed close-up [x, y, width, height] instead of the automatic full-body framing */
  zoom?: [number, number, number, number];
}

const pt = (v: Vec) => `${v[0].toFixed(1)} ${v[1].toFixed(1)}`;

interface Props {
  anim: Animation;
  playing: boolean;
  /** time (s) to show when not playing */
  still?: number;
  /** follow the guided timer: settle into this keyframe (or run the loop) */
  target?: FigureTarget | null;
  /** freeze where it is (timer paused) */
  paused?: boolean;
  /** with no target: ease into the stretch once and hold it, instead of looping */
  holdPreview?: boolean;
}

/** Seconds to blend from what's on screen into a new motion. */
const BLEND = 0.45;

/**
 * One step of a motion, after waiting `delay` seconds. Either a stretch of the
 * keyframe loop (from loop time `start`, for `dur` seconds), or, when that
 * stretch would pass through another held pose, a direct blend between two keyframes.
 */
type Leg = { delay: number; dur: number } & ({ start: number } | { blend: [number, number] });

interface Mode {
  t0: number;
  /** what was on screen when this mode began, blended out over BLEND seconds */
  from: Solved | null;
  legs: Leg[];
  /** after the legs: hold `frame`, or carry on looping from frame 0 */
  then: { hold: number } | 'loop';
}

/** Keyframes held at least this long are poses in their own right (e.g. "turned left"). */
const HELD = 1;

/** Move from keyframe `a` to keyframe `b`: forward along the loop, unless that passes through another held pose. */
function leg(frames: Keyframe[], a: number, b: number, delay = 0): Leg {
  const { arrive, depart, total } = frameTimes(frames);
  if (a === b) return { start: arrive[b], dur: 0, delay };
  const n = frames.length;
  for (let i = (a + 1) % n; i !== b; i = (i + 1) % n) {
    if (frames[i].hold >= HELD) return { blend: [a, b], dur: 0.9, delay };
  }
  const start = depart[a];
  let end = arrive[b];
  if (end <= start) end += total;
  return { start, dur: end - start, delay };
}

/** A barely-there breath so a held pose doesn't look frozen. */
const breathe = (p: Pose, t: number): Pose => ({ ...p, tlen: p.tlen * (1 + 0.016 * Math.sin((t * 2 * Math.PI) / 3.6)) });

function solvedAt(mode: Mode, anim: Animation, clock: number): Solved {
  const { frames, view } = anim;
  let t = clock - mode.t0;
  const at = (l: Leg, u: number): Solved =>
    'start' in l
      ? solve(sample(frames, l.start + u), view)
      : lerpSolved(solve(frames[l.blend[0]].pose, view), solve(frames[l.blend[1]].pose, view), ease(l.dur ? u / l.dur : 1));
  for (const l of mode.legs) {
    if (t < l.delay) return at(l, 0);
    t -= l.delay;
    if (t < l.dur) return at(l, t);
    t -= l.dur;
  }
  if (mode.then === 'loop') return solve(sample(frames, frameTimes(frames).arrive[0] + t), view);
  return solve(breathe(frames[mode.then.hold].pose, t), view);
}

export function Figure({ anim, playing, still, target, paused = false, holdPreview = false }: Props) {
  const [, setTick] = useState(0);
  const clock = useRef(0);
  const mode = useRef<Mode | null>(null);
  /** the keyframe the figure is settled at (or heading to), if any */
  const at = useRef<number | null>(null);
  const shown = useRef<Solved | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const tFrame = target ? target.frame : null;
  const planned = useRef<unknown[] | null>(null);

  // Pick a new motion whenever what we should be showing changes.
  useEffect(() => {
    // Only re-plan on a real change (effects can run twice for the same inputs).
    const key = [playing, anim, tFrame, holdPreview];
    if (planned.current && key.every((v, i) => v === planned.current![i])) return;
    planned.current = key;
    if (!playing) {
      mode.current = null;
      at.current = null;
      return;
    }
    const frames = anim.frames;
    const from = shown.current;
    const now = clock.current;
    const rest = restFrame(anim);
    const work = workFrame(anim);
    const prev = at.current;
    let m: Mode;
    if (tFrame === 'loop') {
      m = { t0: now, from, legs: [], then: 'loop' };
      at.current = null;
    } else if (tFrame !== null) {
      m = { t0: now, from, legs: [leg(frames, prev ?? rest, tFrame)], then: { hold: tFrame } };
      at.current = tFrame;
    } else if (holdPreview) {
      // Ease into the stretch once and hold it; after a reset, relax first.
      const legs = prev === null ? [leg(frames, rest, work, 0.4)] : [leg(frames, prev, rest), leg(frames, rest, work, 0.8)];
      m = { t0: now, from, legs, then: { hold: work } };
      at.current = work;
    } else {
      m = { t0: now, from, legs: prev === null ? [] : [leg(frames, prev, 0)], then: 'loop' };
      at.current = null;
    }
    mode.current = m;
  }, [playing, anim, tFrame, holdPreview]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      if (last !== null && !pausedRef.current) clock.current += Math.min(0.1, (now - last) / 1000);
      last = now;
      setTick((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  let s: Solved;
  const m = mode.current;
  if (playing && m) {
    s = solvedAt(m, anim, clock.current);
    const t = clock.current - m.t0;
    if (m.from && t < BLEND) s = lerpSolved(m.from, s, ease(t / BLEND));
  } else if (playing) {
    // First paint, before a motion is picked: the start pose.
    s = solve(anim.frames[restFrame(anim)].pose, anim.view);
  } else {
    s = solve(sample(anim.frames, still ?? defaultStill(anim)), anim.view);
  }
  shown.current = s;

  const mirror = !!target?.mirror;
  const box = viewBoxFor(anim);
  // Flip around the middle of what's on screen, so a close-up stays in frame.
  const [bx, , bw] = box.split(' ').map(Number);
  const mirrorX = bx + bw / 2;
  const focus = new Set<string>(anim.focus ?? []);
  const side = anim.view === 'side';
  const cls = (part: string, far = false) => `seg${focus.has(part) ? ' focus' : ''}${far ? ' far' : ''}`;

  const hs = anim.handScale ?? 1;
  const arm = (c: Chain, k: 'L' | 'R', far: boolean) => {
    const tip: Vec = [c.end[0] + (c.tip[0] - c.end[0]) * hs, c.end[1] + (c.tip[1] - c.end[1]) * hs];
    return (
      <g key={`arm${k}`}>
        <line className={cls(`upperArm${k}`, far)} x1={c.root[0]} y1={c.root[1]} x2={c.mid[0]} y2={c.mid[1]} strokeWidth={9} />
        <line className={cls(`forearm${k}`, far)} x1={c.mid[0]} y1={c.mid[1]} x2={c.end[0]} y2={c.end[1]} strokeWidth={8} />
        <line className={cls('hand', far)} x1={c.end[0]} y1={c.end[1]} x2={tip[0]} y2={tip[1]} strokeWidth={7 * Math.sqrt(hs)} />
      </g>
    );
  };
  const leg_ = (c: Chain, k: 'L' | 'R', far: boolean) => (
    <g key={`leg${k}`}>
      {/* A thigh pointing at the viewer (seated, front view) is drawn short and thick, like it's coming toward you. */}
      <line
        className={cls(`thigh${k}`, far)}
        x1={c.root[0]}
        y1={c.root[1]}
        x2={c.mid[0]}
        y2={c.mid[1]}
        strokeWidth={!side && Math.hypot(c.mid[0] - c.root[0], c.mid[1] - c.root[1]) < LEN.thigh * 0.6 ? 16 : 12}
      />
      <line className={cls(`shin${k}`, far)} x1={c.mid[0]} y1={c.mid[1]} x2={c.end[0]} y2={c.end[1]} strokeWidth={10} />
      <line className={cls('foot', far)} x1={c.end[0]} y1={c.end[1]} x2={c.tip[0]} y2={c.tip[1]} strokeWidth={8} />
    </g>
  );

  // In front view the wide chest stroke would hide the neck, so stop it short of the shoulders.
  const chestTop: Vec = side ? s.shoulders : [s.shoulders[0] + (s.waist[0] - s.shoulders[0]) * 0.3, s.shoulders[1] + (s.waist[1] - s.shoulders[1]) * 0.3];
  // A turned trunk looks narrower from the front.
  const narrow = side ? 1 : 1 - 0.25 * Math.abs(s.twist);
  const torso = (
    <g key="torso">
      <line className={cls('lowerTorso')} x1={s.pelvis[0]} y1={s.pelvis[1]} x2={s.waist[0]} y2={s.waist[1]} strokeWidth={side ? 17 : 22 * narrow} />
      <line className={cls('upperTorso')} x1={s.waist[0]} y1={s.waist[1]} x2={chestTop[0]} y2={chestTop[1]} strokeWidth={side ? 19 : 26 * narrow} />
      {/* Front view: a line through the shoulders so the arms (and neck) visibly hang off something. */}
      {!side && (
        <polyline
          className={cls('shoulders')}
          points={`${pt(s.armL.root)} ${pt(s.shoulders)} ${pt(s.armR.root)}`}
          strokeWidth={10}
          strokeLinejoin="round"
        />
      )}
      <line className={cls('neck')} x1={s.shoulders[0]} y1={s.shoulders[1]} x2={s.neckTop[0]} y2={s.neckTop[1]} strokeWidth={8} />
    </g>
  );

  const head = <Head key="head" at={s.head} angle={s.headAngle} turn={s.turn} side={side} />;

  let layers;
  if (side) {
    layers = [arm(s.armL, 'L', true), leg_(s.legL, 'L', true), torso, head, leg_(s.legR, 'R', false), arm(s.armR, 'R', false)];
  } else {
    // Front view. When the trunk turns, the arm on the side turning away goes pale and behind it.
    const backArm = s.twist > 0.3 ? 'R' : s.twist < -0.3 ? 'L' : null;
    const behind = backArm ? [arm(backArm === 'R' ? s.armR : s.armL, backArm, true)] : [];
    // A hand holding the other arm is drawn last so it isn't hidden under that arm.
    const front = (['L', 'R'] as const).filter((k) => k !== backArm);
    if (helperArm(anim) === 'L') front.reverse();
    layers = [
      ...behind,
      leg_(s.legL, 'L', false),
      leg_(s.legR, 'R', false),
      torso,
      head,
      ...front.map((k) => arm(k === 'L' ? s.armL : s.armR, k, false)),
    ];
  }

  return (
    <svg viewBox={box} className="figure" aria-hidden="true">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="arrowhead" />
        </marker>
      </defs>
      <line className="floor" x1={8} y1={FLOOR} x2={192} y2={FLOOR} />
      {/* Switching sides flips the whole scene, like turning the card over. */}
      <g className={`scene${mirror ? ' mirrored' : ''}`} style={{ transformOrigin: `${mirrorX}px 0` }}>
        {anim.props?.map((p, i) => <Prop key={i} spec={p} />)}
        {anim.hint && <path className="hint" d={anim.hint} />}
        {layers}
      </g>
    </svg>
  );
}

/** 'L' if the left arm ever holds the right arm (e.g. drawing an arm across the chest). */
function helperArm(anim: Animation): 'L' | null {
  return anim.frames.some((f) => {
    const ik = f.pose.armL.ik;
    return !!ik && (ik[0] === 'elbowR' || ik[0] === 'handR');
  })
    ? 'L'
    : null;
}

// ---------- framing ----------

const W = 200;
const H = 220;
const PAD = 8;
const boxes = new WeakMap<Animation, string>();

/**
 * The figure's own viewBox: the standard 200×220 stage, zoomed out just enough
 * that every frame of the motion (either way round) stays inside with PAD to spare.
 * Zooming keeps the floor at the bottom and the stage centred, so mirroring still fits.
 */
export function viewBoxFor(anim: Animation): string {
  const hit = boxes.get(anim);
  if (hit) return hit;
  if (anim.zoom) {
    const z = anim.zoom.join(' ');
    boxes.set(anim, z);
    return z;
  }
  let top = Infinity;
  let half = 0;
  const grow = (p: Vec, r: number) => {
    top = Math.min(top, p[1] - r);
    half = Math.max(half, Math.abs(p[0] - W / 2) + r);
  };
  const total = loopLength(anim.frames);
  const steps = Math.max(1, Math.ceil(total / 0.04));
  for (let i = 0; i <= steps; i++) {
    const s = solve(sample(anim.frames, (total * i) / steps), anim.view);
    for (const c of [s.armL, s.armR]) for (const p of [c.root, c.mid, c.end, c.tip]) grow(p, 5);
    for (const c of [s.legL, s.legR]) for (const p of [c.root, c.mid, c.end, c.tip]) grow(p, 6);
    for (const p of [s.pelvis, s.waist, s.shoulders]) grow(p, 13);
    grow(s.head, LEN.headR + 4); // + nose, + breathing
  }
  const k = Math.max(1, (H - top + PAD) / H, (half + PAD) / (W / 2));
  const box = [W / 2 - (W / 2) * k, H - H * k, W * k, H * k].map((v) => +v.toFixed(2)).join(' ');
  boxes.set(anim, box);
  return box;
}

function Head({ at, angle, turn, side }: { at: Vec; angle: number; turn: number; side: boolean }) {
  const t = Math.max(-1, Math.min(1, turn));
  // Front view: eyes slide toward the turn and the far eye disappears; a nose
  // pokes out past the outline once the head is turned, like a profile.
  const eyes: number[] = side
    ? [7]
    : [-1, 1]
        .filter((sgn) => Math.abs(t) < 0.6 || Math.sign(t) === sgn)
        .map((sgn) => sgn * 4.5 * (1 - Math.abs(t) * 0.4) + t * 5);
  const nose = side ? 1 : Math.abs(t) > 0.15 ? Math.sign(t) : 0;
  const noseX = side ? 10.5 : t * 10.5;
  return (
    <g transform={`translate(${pt(at)}) rotate(${angle.toFixed(1)})`}>
      {/* a head turned toward profile looks a little narrower */}
      <ellipse className="seg head" rx={LEN.headR * (side ? 1 : 1 - 0.12 * Math.abs(t))} ry={LEN.headR} />
      {eyes.map((x, i) => (
        <circle key={i} className="eye" cx={x} cy={-1.5} r={1.6} />
      ))}
      {nose !== 0 && (
        <path className="seg head" d={`M${noseX} -1 L${noseX + nose * 3.5} 3 L${noseX} 4 Z`} />
      )}
    </g>
  );
}

/** A representative frame for still cards: the first "hold" pose. */
function defaultStill(anim: Animation): number {
  const f = anim.frames;
  if (f.length < 2) return 0;
  return f[0].move + f[0].hold + f[1].move + f[1].hold / 2;
}
