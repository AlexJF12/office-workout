import { useMemo } from 'react';
import type { Exercise } from '../data/exercises';
import { Figure } from '../figure/Figure';
import { doseLabel, phasesFor } from '../lib/session';
import { Timer } from './Timer';

/** The content of one card. `active` cards animate and get a live timer. */
export function ExerciseCard({ ex, active }: { ex: Exercise; active: boolean }) {
  const phases = useMemo(() => phasesFor(ex.dose), [ex]);
  return (
    <div className="card-inner">
      <div className="card-figure">
        <Figure anim={ex.anim} playing={active} />
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
          active ? <Timer phases={phases} summary={doseLabel(ex.dose)} /> : <div className="timer placeholder" />
        ) : (
          <div className="reps-note">
            <strong>{doseLabel(ex.dose)}</strong> at your own pace, then swipe right.
          </div>
        )}
      </div>
    </div>
  );
}
