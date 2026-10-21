import { forwardRef, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { commitDistance, swipeResult, type SwipeDir } from '../lib/swipe';

export type { SwipeDir };

export interface SwipeHandle {
  /** fly the card off-screen as if swiped (used by the buttons and arrow keys) */
  swipe: (dir: SwipeDir) => void;
}

const FLY_MS = 260;

/**
 * A draggable card. It only counts as a swipe if it's past the commit line when
 * you let go; drag it back toward the middle and it snaps home without counting.
 */
export const SwipeCard = forwardRef<SwipeHandle, { onSwiped: (dir: SwipeDir) => void; children: ReactNode }>(
  function SwipeCard({ onSwiped, children }, ref) {
    const el = useRef<HTMLDivElement>(null);
    const drag = useRef<{ id: number; x0: number; y0: number; dx: number } | null>(null);
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

    const snapBack = () => {
      drag.current = null;
      setSettling(true);
      setDx(0);
      setDy(0);
    };

    const onPointerDown = (e: React.PointerEvent) => {
      if (flying || e.button !== 0) return;
      // Let buttons and links inside the card work normally.
      if ((e.target as HTMLElement).closest('button, a')) return;
      drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0 };
      el.current?.setPointerCapture(e.pointerId);
      setSettling(false);
    };

    const onPointerMove = (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      d.dx = e.clientX - d.x0;
      setDx(d.dx);
      setDy((e.clientY - d.y0) * 0.3);
    };

    const onPointerUp = (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const dir = swipeResult(d.dx, el.current?.offsetWidth ?? 320);
      drag.current = null;
      if (dir) fly(dir);
      else snapBack();
    };

    // The browser took the gesture over (e.g. scrolling): never count it.
    const onPointerCancel = (e: React.PointerEvent) => {
      if (drag.current?.id === e.pointerId) snapBack();
    };

    const width = typeof window === 'undefined' ? 400 : window.innerWidth;
    const x = flying ? (flying === 'right' ? 1 : -1) * (width + 200) : dx;
    const rot = x / 18;
    // The stamp reaches full strength exactly at the commit line, so what you see is what letting go will do.
    const need = commitDistance(el.current?.offsetWidth ?? 320);
    const stamp = flying ? (flying === 'right' ? 1 : -1) : Math.max(-1, Math.min(1, x / need));
    const armed = Math.abs(stamp) >= 1;

    return (
      <div
        ref={el}
        className={`card swipe${settling ? ' settling' : ''}`}
        style={{ transform: `translate(${x}px, ${dy}px) rotate(${rot}deg)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div className={`stamp stamp-done${armed && stamp > 0 ? ' armed' : ''}`} style={{ opacity: Math.max(0, stamp) ** 2 }}>
          Done
        </div>
        <div className={`stamp stamp-skip${armed && stamp < 0 ? ' armed' : ''}`} style={{ opacity: Math.max(0, -stamp) ** 2 }}>
          Skip
        </div>
        {children}
      </div>
    );
  },
);
