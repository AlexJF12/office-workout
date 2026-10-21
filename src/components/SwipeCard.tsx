import { forwardRef, useImperativeHandle, useRef, useState, type ReactNode } from 'react';

export type SwipeDir = 'left' | 'right';

export interface SwipeHandle {
  /** fly the card off-screen as if swiped (used by the buttons and arrow keys) */
  swipe: (dir: SwipeDir) => void;
}

const THRESHOLD = 0.28; // fraction of card width
const FLICK_SPEED = 0.6; // px per ms
const FLY_MS = 260;

/** A draggable card. Drag past the threshold (or flick) to swipe it away. */
export const SwipeCard = forwardRef<SwipeHandle, { onSwiped: (dir: SwipeDir) => void; children: ReactNode }>(
  function SwipeCard({ onSwiped, children }, ref) {
    const el = useRef<HTMLDivElement>(null);
    const drag = useRef<{ id: number; x0: number; y0: number; t: number; lastX: number; lastT: number; v: number } | null>(null);
    const [dx, setDx] = useState(0);
    const [dy, setDy] = useState(0);
    const [flying, setFlying] = useState<SwipeDir | null>(null);
    const [settling, setSettling] = useState(false);

    const fly = (dir: SwipeDir) => {
      if (flying) return;
      setSettling(true);
      setFlying(dir);
      navigator.vibrate?.(dir === 'right' ? 25 : 10);
      window.setTimeout(() => onSwiped(dir), FLY_MS);
    };

    useImperativeHandle(ref, () => ({ swipe: fly }));

    const onPointerDown = (e: React.PointerEvent) => {
      if (flying || e.button !== 0) return;
      // Let buttons and links inside the card work normally.
      if ((e.target as HTMLElement).closest('button, a')) return;
      drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t: e.timeStamp, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
      el.current?.setPointerCapture(e.pointerId);
      setSettling(false);
    };

    const onPointerMove = (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const dt = e.timeStamp - d.lastT;
      if (dt > 0) d.v = (e.clientX - d.lastX) / dt;
      d.lastX = e.clientX;
      d.lastT = e.timeStamp;
      setDx(e.clientX - d.x0);
      setDy((e.clientY - d.y0) * 0.3);
    };

    const end = (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      drag.current = null;
      const width = el.current?.offsetWidth ?? 320;
      const x = e.clientX - d.x0;
      if (x > width * THRESHOLD || (d.v > FLICK_SPEED && x > 30)) return fly('right');
      if (x < -width * THRESHOLD || (d.v < -FLICK_SPEED && x < -30)) return fly('left');
      setSettling(true);
      setDx(0);
      setDy(0);
    };

    const width = typeof window === 'undefined' ? 400 : window.innerWidth;
    const x = flying ? (flying === 'right' ? 1 : -1) * (width + 200) : dx;
    const rot = x / 18;
    const stamp = Math.max(-1, Math.min(1, x / 120));

    return (
      <div
        ref={el}
        className={`card swipe${settling ? ' settling' : ''}`}
        style={{ transform: `translate(${x}px, ${dy}px) rotate(${rot}deg)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div className="stamp stamp-done" style={{ opacity: Math.max(0, stamp) }}>
          Done
        </div>
        <div className="stamp stamp-skip" style={{ opacity: Math.max(0, -stamp) }}>
          Skip
        </div>
        {children}
      </div>
    );
  },
);
