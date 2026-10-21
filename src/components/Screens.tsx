import { useState } from 'react';
import { EXERCISES } from '../data/exercises';
import { EXERCISE_BY_ID } from '../data/lookup';
import { Figure } from '../figure/Figure';
import { streak, type HistoryEntry, type Session } from '../lib/session';
import { Icon } from './Icon';

const HERO = EXERCISES.find((e) => e.id === 'wall-angels')!.anim;

export function Home({
  history,
  resumable,
  onStart,
  onResume,
  onFinish,
  onHistory,
}: {
  history: HistoryEntry[];
  resumable: Session | null;
  onStart: () => void;
  onResume: () => void;
  onFinish: () => void;
  onHistory: () => void;
}) {
  const days = streak(history);
  const moves = history.reduce((n, h) => n + h.done.length, 0);
  return (
    <div className="screen home">
      <div className="home-hero">
        <div className="hero-figure">
          <Figure anim={HERO} playing />
        </div>
        <h1>Office Workout</h1>
        <p className="lede">
          {EXERCISES.length} quick stretches and moves that physical therapists recommend for people who sit all day.
          Swipe right when you’ve done one, left to skip.
        </p>
      </div>

      <div className="stats">
        <div className="stat">
          <strong>
            <Icon name="flame" size={18} /> {days}
          </strong>
          <span>day streak</span>
        </div>
        <div className="stat">
          <strong>{history.length}</strong>
          <span>sessions</span>
        </div>
        <div className="stat">
          <strong>{moves}</strong>
          <span>moves done</span>
        </div>
      </div>

      <div className="home-actions">
        {resumable ? (
          <>
            <button className="btn btn-big btn-accent" onClick={onResume}>
              Resume · card {resumable.results.length + 1} of {resumable.order.length}
            </button>
            <button className="btn btn-big btn-ghost" onClick={onFinish}>
              Finish &amp; save ({resumable.results.filter((r) => r.result === 'done').length} done)
            </button>
            <button className="btn btn-link" onClick={onStart}>
              Discard and start a fresh shuffle
            </button>
          </>
        ) : (
          <button className="btn btn-big btn-accent" onClick={onStart}>
            Start session
          </button>
        )}
        <button className="btn btn-link" onClick={onHistory}>
          <Icon name="history" size={18} /> History
        </button>
      </div>

      <p className="fineprint">
        Move gently and stay pain-free: you should feel a stretch, not pain. This isn’t medical advice; if something
        hurts, stop and check with a physical therapist.
      </p>
    </div>
  );
}

export function Summary({ entry, onAgain, onHome }: { entry: HistoryEntry; onAgain: () => void; onHome: () => void }) {
  const n = entry.done.length;
  const total = n + entry.skipped.length;
  const headline = n === 0 ? 'Maybe next time' : n >= total * 0.75 ? 'Great session!' : 'Nice work!';
  return (
    <div className="screen summary">
      <div className="summary-head">
        <div className="big-count">
          <span>{n}</span>
          <small>/ {total}</small>
        </div>
        <h1>{headline}</h1>
        <p className="lede">
          You did {n} {n === 1 ? 'move' : 'moves'}
          {entry.skipped.length ? ` and skipped ${entry.skipped.length}` : ''}.
        </p>
      </div>
      <ExerciseList entry={entry} />
      <div className="home-actions">
        <button className="btn btn-big btn-accent" onClick={onAgain}>
          New session
        </button>
        <button className="btn btn-big btn-ghost" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}

function ExerciseList({ entry }: { entry: HistoryEntry }) {
  return (
    <ul className="ex-list">
      {entry.done.map((id) => (
        <li key={id} className="done">
          <Icon name="check" size={16} /> {EXERCISE_BY_ID[id]?.name ?? id}
        </li>
      ))}
      {entry.skipped.map((id) => (
        <li key={id} className="skipped">
          <Icon name="close" size={16} /> {EXERCISE_BY_ID[id]?.name ?? id}
        </li>
      ))}
    </ul>
  );
}

export function History({ history, onBack, onClear }: { history: HistoryEntry[]; onBack: () => void; onClear: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="screen history">
      <header className="bar">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <Icon name="back" />
        </button>
        <h1>History</h1>
        <span className="streak-pill">
          <Icon name="flame" size={16} /> {streak(history)} day streak
        </span>
      </header>
      {history.length === 0 ? (
        <p className="empty">No sessions yet. Finish one and it will show up here.</p>
      ) : (
        <ul className="sessions">
          {history.map((h) => {
            const d = new Date(h.finishedAt);
            const isOpen = open === h.id;
            return (
              <li key={h.id}>
                <button className="session-row" onClick={() => setOpen(isOpen ? null : h.id)} aria-expanded={isOpen}>
                  <span className="session-date">
                    {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    <small>{d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</small>
                  </span>
                  <span className="session-count">
                    <strong>{h.done.length}</strong> done
                    {h.skipped.length > 0 && <small> · {h.skipped.length} skipped</small>}
                  </span>
                </button>
                {isOpen && <ExerciseList entry={h} />}
              </li>
            );
          })}
        </ul>
      )}
      {history.length > 0 && (
        <div className="clear">
          {confirming ? (
            <>
              <span>Delete all history on this device?</span>
              <button className="btn btn-small btn-danger" onClick={onClear}>
                Delete
              </button>
              <button className="btn btn-small btn-ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn btn-link" onClick={() => setConfirming(true)}>
              Clear history
            </button>
          )}
        </div>
      )}
    </div>
  );
}
