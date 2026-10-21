import { useEffect, useRef, useState } from 'react';
import { totalSeconds, type Phase } from '../lib/session';
import { beep, unlockAudio } from '../lib/sound';

type Status = 'idle' | 'running' | 'paused' | 'finished';

/** Start/pause countdown that walks through each phase, chiming at every change. */
export function Timer({ phases, summary }: { phases: Phase[]; summary: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [elapsed, setElapsed] = useState(0); // seconds into the whole sequence
  const startedAt = useRef(0);
  const base = useRef(0);
  const lastPhase = useRef(0);

  const total = totalSeconds(phases);

  useEffect(() => {
    if (status !== 'running') return;
    startedAt.current = performance.now();
    let raf = 0;
    const tick = () => {
      const e = Math.min(total, base.current + (performance.now() - startedAt.current) / 1000);
      setElapsed(e);
      const idx = phaseIndex(phases, e);
      if (e >= total) {
        beep('finish');
        navigator.vibrate?.([120, 80, 120]);
        setStatus('finished');
        return;
      }
      if (idx !== lastPhase.current) {
        lastPhase.current = idx;
        beep(phases[idx].rest ? 'switch' : 'go');
        navigator.vibrate?.(150);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, phases, total]);

  const start = () => {
    unlockAudio();
    if (status === 'finished' || status === 'idle') {
      base.current = 0;
      lastPhase.current = 0;
      setElapsed(0);
      beep('go');
    }
    setStatus('running');
  };
  const pause = () => {
    base.current = elapsed;
    setStatus('paused');
  };
  const reset = () => {
    base.current = 0;
    lastPhase.current = 0;
    setElapsed(0);
    setStatus('idle');
  };

  const idx = phaseIndex(phases, elapsed);
  const phase = phases[idx];
  const phaseStart = phases.slice(0, idx).reduce((s, p) => s + p.seconds, 0);
  const phaseLeft = Math.max(0, Math.ceil(phase.seconds - (elapsed - phaseStart) - 1e-6));
  const progress = status === 'finished' ? 1 : (elapsed - phaseStart) / phase.seconds;

  const R = 26;
  const C = 2 * Math.PI * R;
  const multi = phases.length > 1;

  return (
    <div className={`timer ${status}${phase.rest && status !== 'finished' ? ' rest' : ''}`}>
      <svg className="timer-ring" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={R} className="ring-bg" />
        <circle
          cx="32"
          cy="32"
          r={R}
          className="ring-fg"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          transform="rotate(-90 32 32)"
        />
        <text x="32" y="33" textAnchor="middle" dominantBaseline="middle" className="ring-text">
          {status === 'finished' ? '✓' : status === 'idle' ? total : phaseLeft}
        </text>
      </svg>
      <div className="timer-info" aria-live="polite">
        <div className="timer-label">
          {status === 'idle' && 'Guided timer'}
          {(status === 'running' || status === 'paused') && phase.label}
          {status === 'finished' && 'Done! Swipe right ✓'}
        </div>
        {status === 'idle' && <div className="timer-sub">{summary}</div>}
        {(status === 'running' || status === 'paused') && multi && (
          <div className="timer-sub">Next: {phases[idx + 1]?.label ?? 'finish'}</div>
        )}
      </div>
      <div className="timer-buttons">
        {status === 'running' ? (
          <button className="btn btn-small" onClick={pause}>
            Pause
          </button>
        ) : (
          <button className="btn btn-small btn-accent" onClick={start}>
            {status === 'paused' ? 'Resume' : status === 'finished' ? 'Again' : 'Start'}
          </button>
        )}
        {(status === 'paused' || status === 'running') && (
          <button className="btn btn-small btn-ghost" onClick={reset} aria-label="Reset timer">
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function phaseIndex(phases: Phase[], elapsed: number): number {
  let t = 0;
  for (let i = 0; i < phases.length; i++) {
    t += phases[i].seconds;
    if (elapsed < t) return i;
  }
  return phases.length - 1;
}
