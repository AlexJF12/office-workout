import { useEffect, useRef } from 'react';
import { EXERCISE_BY_ID } from '../data/lookup';
import { currentId, doneCount, position, SESSION_GOAL, type Result, type Session } from '../lib/session';
import { ExerciseCard } from './ExerciseCard';
import { Icon } from './Icon';
import { SwipeCard, type SwipeDir, type SwipeHandle } from './SwipeCard';

interface Props {
  session: Session;
  onResult: (r: Result) => void;
  onUndo: () => void;
  onEnd: () => void;
}

export function Deck({ session, onResult, onUndo, onEnd }: Props) {
  const top = useRef<SwipeHandle>(null);
  const id = currentId(session);
  const nextId = session.order[position(session) + 1];
  const done = doneCount(session);
  const skipped = position(session) - done;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') top.current?.swipe('right');
      else if (e.key === 'ArrowLeft') top.current?.swipe('left');
      else if ((e.metaKey || e.ctrlKey) && e.key === 'z') onUndo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onUndo]);

  const swiped = (dir: SwipeDir) => onResult(dir === 'right' ? 'done' : 'skipped');

  return (
    <div className="screen deck-screen">
      <div className="band deck-band" aria-hidden="true" />
      <header className="deck-header">
        <button className="icon-btn" onClick={onEnd} aria-label="End session">
          <Icon name="close" />
        </button>
        <div className="progress" aria-label={`${done} of ${SESSION_GOAL} moves done`}>
          <div className="progress-text">
            <span className="progress-done">
              <Icon name="check" size={14} /> {done} / {SESSION_GOAL} done
            </span>
            {skipped > 0 && <span className="progress-skipped">{skipped} skipped</span>}
          </div>
          <div className="progress-bar">
            {Array.from({ length: SESSION_GOAL }, (_, i) => (
              <span key={i} className={i < done ? 'done' : i === done ? 'current' : ''} />
            ))}
          </div>
        </div>
      </header>

      <main className="stack">
        {nextId && (
          <div className="card behind" aria-hidden="true">
            <ExerciseCard ex={EXERCISE_BY_ID[nextId]} active={false} />
          </div>
        )}
        {id && (
          <SwipeCard key={id} ref={top} onSwiped={swiped}>
            <ExerciseCard ex={EXERCISE_BY_ID[id]} active />
          </SwipeCard>
        )}
      </main>

      <footer className="actions">
        <button className="action skip" onClick={() => top.current?.swipe('left')} aria-label="Skip">
          <Icon name="close" size={28} />
          <span>Skip</span>
        </button>
        <button className="action undo" onClick={onUndo} disabled={!session.results.length} aria-label="Undo last swipe">
          <Icon name="undo" size={20} />
        </button>
        <button className="action done" onClick={() => top.current?.swipe('right')} aria-label="Did it">
          <Icon name="check" size={30} />
          <span>Did it</span>
        </button>
      </footer>
    </div>
  );
}
