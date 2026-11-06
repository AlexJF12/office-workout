// Dev-only pose contact sheet (not part of the build).
// Run `npm run dev` and open /dev/preview.html:
//   default        every exercise: start pose, end pose, and any extra timer-phase poses
//   ?loop          every exercise at 6 points of its preview loop
//   ?id=<id>       just one exercise (combine with either mode)
import { createRoot } from 'react-dom/client';
import { Figure } from '../src/figure/Figure';
import { frameTimes, loopLength } from '../src/figure/rig';
import { restFrame, workFrame } from '../src/figure/sync';
import { EXERCISES } from '../src/data/exercises';
import '../src/styles.css';

const q = new URLSearchParams(location.search);
const only = q.get('id');
const loop = q.has('loop');
const list = EXERCISES.filter((e) => !only || e.id === only);

const cell = { width: 170, height: 187, background: 'var(--card)', borderRadius: 12, overflow: 'hidden' } as const;
const label = { fontSize: 11, textAlign: 'center', color: 'var(--muted)', marginTop: 2 } as const;

function Still({ e, t, text }: { e: (typeof EXERCISES)[number]; t: number; text: string }) {
  return (
    <div>
      <div style={cell}>
        <Figure anim={e.anim} playing={false} still={t} />
      </div>
      <div style={label}>{text}</div>
    </div>
  );
}

function Row({ e }: { e: (typeof EXERCISES)[number] }) {
  const { arrive } = frameTimes(e.anim.frames);
  let cells: { t: number; text: string }[];
  if (loop) {
    const total = loopLength(e.anim.frames);
    cells = Array.from({ length: 6 }, (_, i) => ({ t: (total * i) / 6, text: `${Math.round((100 * i) / 6)}%` }));
  } else {
    const rest = restFrame(e.anim);
    const work = workFrame(e.anim);
    const seen = new Set([rest, work]);
    cells = [
      { t: arrive[rest], text: 'start' },
      { t: arrive[work], text: 'end' },
    ];
    // other poses the timer visits (e.g. the second head turn, palm down)
    for (const p of e.anim.phasePoses ?? []) {
      const f = typeof p === 'object' ? p.frame : p;
      if (typeof f === 'number' && !seen.has(f)) {
        seen.add(f);
        cells.push({ t: arrive[f], text: `frame ${f}` });
      }
    }
  }
  return (
    <div className="sheet-row" data-id={e.id} style={{ background: 'var(--sky-2)', borderRadius: 16, padding: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)', margin: '0 0 6px 4px' }}>
        {e.name} <span style={{ fontWeight: 500, color: 'var(--muted)' }}>· {e.area}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {cells.map((c, i) => (
          <Still key={i} e={e} t={c.t} text={c.text} />
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 10, display: 'flex', flexWrap: 'wrap', gap: 10, background: 'var(--sky)', height: 'auto' }}>
    {list.map((e) => (
      <Row key={e.id} e={e} />
    ))}
  </div>,
);
