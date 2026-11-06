import { useCallback, useMemo, useState } from 'react';
import type { Exercise } from '../data/exercises';
import { Figure } from '../figure/Figure';
import { phaseTargets, restFrame, type FigureTarget } from '../figure/sync';
import { doseLabel, phasesFor } from '../lib/session';
import { Timer, type TimerStatus } from './Timer';

/** The content of one card. `active` cards animate and get a live timer. */
export function ExerciseCard({ ex, active }: { ex: Exercise; active: boolean }) {
  const phases = useMemo(() => phasesFor(ex.dose), [ex]);
  const targets = useMemo(() => (phases ? phaseTargets(ex.anim, phases) : null), [ex, phases]);
  const [timer, setTimer] = useState<{ status: TimerStatus; phase: number }>({ status: 'idle', phase: 0 });
  const onTimer = useCallback((status: TimerStatus, phase: number) => setTimer({ status, phase }), []);

  // While the timer runs, the figure follows its phases; once it's done, the figure relaxes.
  let target: FigureTarget | null = null;
  if (targets && (timer.status === 'running' || timer.status === 'paused')) target = targets[timer.phase];
  else if (targets && timer.status === 'finished') target = { frame: restFrame(ex.anim), mirror: false };

  return (
    <div className="card-inner">
      <div className="card-figure">
        <Figure
          anim={ex.anim}
          playing={active}
          target={target}
          paused={timer.status === 'paused'}
          holdPreview={ex.dose.kind === 'hold'}
        />
        <span className={`chip area area-${ex.area.toLowerCase().replace(' ', '-')}`}>{ex.area}</span>
        <span className="chip dose">{doseLabel(ex.dose)}</span>
      </div>
      <div className="card-body">
        <h2>{ex.name}</h2>
        <p className="why">{ex.why}</p>
        <ol className="steps">
          {ex.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <p className="sources">
          Recommended by{' '}
          {ex.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ', '}
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.name}
              </a>
            </span>
          ))}
        </p>
      </div>
      <div className="card-foot">
        {phases ? (
          active ? <Timer phases={phases} summary={doseLabel(ex.dose)} onState={onTimer} /> : <div className="timer placeholder" />
        ) : (
          <div className="reps-note">At your own pace, then swipe right.</div>
        )}
      </div>
    </div>
  );
}
