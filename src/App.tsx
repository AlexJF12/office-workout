import { useState } from 'react';
import { Deck } from './components/Deck';
import { History, Home, Summary } from './components/Screens';
import { EXERCISE_IDS } from './data/lookup';
import { isFinished, newSession, record, toHistory, undo, type HistoryEntry, type Result, type Session } from './lib/session';
import { addHistory, clearHistory, loadHistory, loadSession, saveSession } from './lib/storage';

type Screen = 'home' | 'deck' | 'summary' | 'history';

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession(new Set(EXERCISE_IDS)));
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [screen, setScreen] = useState<Screen>('home');
  const [summary, setSummary] = useState<HistoryEntry | null>(null);

  const update = (s: Session | null) => {
    setSession(s);
    saveSession(s);
  };

  const finish = (s: Session) => {
    const entry = toHistory(s);
    setHistory(addHistory(entry));
    update(null);
    setSummary(entry);
    setScreen('summary');
  };

  const start = () => {
    update(newSession(EXERCISE_IDS));
    setScreen('deck');
  };

  const onResult = (r: Result) => {
    if (!session) return;
    const next = record(session, r);
    if (isFinished(next)) finish(next);
    else update(next);
  };

  if (screen === 'deck' && session) {
    return <Deck session={session} onResult={onResult} onUndo={() => update(undo(session))} onEnd={() => setScreen('home')} />;
  }
  if (screen === 'summary' && summary) {
    return <Summary entry={summary} onAgain={start} onHome={() => setScreen('home')} />;
  }
  if (screen === 'history') {
    return (
      <History
        history={history}
        onBack={() => setScreen('home')}
        onClear={() => {
          clearHistory();
          setHistory([]);
        }}
      />
    );
  }
  return (
    <Home
      history={history}
      resumable={session && session.results.length > 0 ? session : null}
      onStart={start}
      onResume={() => setScreen('deck')}
      onFinish={() => session && finish(session)}
      onHistory={() => setScreen('history')}
    />
  );
}
