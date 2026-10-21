// Dev-only: renders every exercise at several points of its loop, for tuning poses.
// Run `npm run dev` and open /dev/preview.html (add ?id=<exercise-id> for one exercise).
import { createRoot } from 'react-dom/client';
import { Figure } from '../src/figure/Figure';
import { loopLength } from '../src/figure/rig';
import { EXERCISES } from '../src/data/exercises';
import '../src/styles.css';

const only = new URLSearchParams(location.search).get('id');
const list = EXERCISES.filter((e) => !only || e.id === only);
const STEPS = 6;

createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 8, background: 'var(--bg)' }}>
    {list.map((e) => {
      const total = loopLength(e.anim.frames);
      return (
        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 110, fontSize: 11 }}>{e.name}</div>
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} style={{ width: 150, height: 165, background: 'var(--card)', border: '1px solid #ddd' }}>
              <Figure anim={e.anim} playing={false} still={(total * i) / STEPS} />
            </div>
          ))}
        </div>
      );
    })}
  </div>,
);
