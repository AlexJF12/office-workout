import { useEffect, useRef, useState } from 'react';
import { FLOOR, LEN, sample, solve, type Chain, type Keyframe, type Vec, type View } from './rig';
import { Prop, type PropSpec } from './Props';
import './figure.css';

export type BodyPart =
  | 'neck'
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
}

const pt = (v: Vec) => `${v[0].toFixed(1)} ${v[1].toFixed(1)}`;

interface Props {
  anim: Animation;
  playing: boolean;
  /** time (s) to show when paused */
  still?: number;
}

export function Figure({ anim, playing, still }: Props) {
  const [time, setTime] = useState(still ?? defaultStill(anim));
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      setTime(still ?? defaultStill(anim));
      return;
    }
    let raf = 0;
    start.current = null;
    const tick = (now: number) => {
      if (start.current === null) start.current = now;
      setTime((now - start.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, anim, still]);

  const s = solve(sample(anim.frames, time), anim.view);
  const focus = new Set<string>(anim.focus ?? []);
  const side = anim.view === 'side';
  const cls = (part: string, far = false) => `seg${focus.has(part) ? ' focus' : ''}${far ? ' far' : ''}`;

  const arm = (c: Chain, k: 'L' | 'R', far: boolean) => (
    <g key={`arm${k}`}>
      <line className={cls(`upperArm${k}`, far)} x1={c.root[0]} y1={c.root[1]} x2={c.mid[0]} y2={c.mid[1]} strokeWidth={9} />
      <line className={cls(`forearm${k}`, far)} x1={c.mid[0]} y1={c.mid[1]} x2={c.end[0]} y2={c.end[1]} strokeWidth={8} />
      <line className={cls('hand', far)} x1={c.end[0]} y1={c.end[1]} x2={c.tip[0]} y2={c.tip[1]} strokeWidth={7} />
    </g>
  );
  const leg = (c: Chain, k: 'L' | 'R', far: boolean) => (
    <g key={`leg${k}`}>
      <line className={cls(`thigh${k}`, far)} x1={c.root[0]} y1={c.root[1]} x2={c.mid[0]} y2={c.mid[1]} strokeWidth={12} />
      <line className={cls(`shin${k}`, far)} x1={c.mid[0]} y1={c.mid[1]} x2={c.end[0]} y2={c.end[1]} strokeWidth={10} />
      <line className={cls('foot', far)} x1={c.end[0]} y1={c.end[1]} x2={c.tip[0]} y2={c.tip[1]} strokeWidth={8} />
    </g>
  );

  // In front view the wide chest stroke would hide the neck, so stop it short of the shoulders.
  const chestTop: Vec = side ? s.shoulders : [s.shoulders[0] + (s.waist[0] - s.shoulders[0]) * 0.3, s.shoulders[1] + (s.waist[1] - s.shoulders[1]) * 0.3];
  const torso = (
    <g key="torso">
      <line className={cls('lowerTorso')} x1={s.pelvis[0]} y1={s.pelvis[1]} x2={s.waist[0]} y2={s.waist[1]} strokeWidth={side ? 17 : 22} />
      <line className={cls('upperTorso')} x1={s.waist[0]} y1={s.waist[1]} x2={chestTop[0]} y2={chestTop[1]} strokeWidth={side ? 19 : 26} />
      <line className={cls('neck')} x1={s.shoulders[0]} y1={s.shoulders[1]} x2={s.neckTop[0]} y2={s.neckTop[1]} strokeWidth={8} />
    </g>
  );

  const head = <Head key="head" at={s.head} angle={s.headAngle} turn={s.turn} side={side} />;

  const layers = side
    ? [arm(s.armL, 'L', true), leg(s.legL, 'L', true), torso, head, leg(s.legR, 'R', false), arm(s.armR, 'R', false)]
    : [leg(s.legL, 'L', false), leg(s.legR, 'R', false), torso, head, arm(s.armL, 'L', false), arm(s.armR, 'R', false)];

  return (
    <svg viewBox="0 0 200 220" className="figure" aria-hidden="true">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="arrowhead" />
        </marker>
      </defs>
      <line className="floor" x1={8} y1={FLOOR} x2={192} y2={FLOOR} />
      {anim.props?.map((p, i) => <Prop key={i} spec={p} />)}
      {anim.hint && <path className="hint" d={anim.hint} />}
      {layers}
    </svg>
  );
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
      <circle className="seg head" r={LEN.headR} />
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
