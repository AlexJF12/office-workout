/* Exercise library. Same data as the session player, laid out to read
   rather than to follow along. Motion is limited to the one staggered
   entrance the design system already defines — plus the stick figures,
   which are the point of the page. */
(() => {
  'use strict';

  const library = document.querySelector('[data-role="library"]');
  const summary = document.querySelector('[data-role="summary"]');

  const clock = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const totalOf = r => r.moves.reduce((n, m) => n + m.work + m.rest, 0);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* joint groups, named the way a person would say them */
  const PART = {
    head: 'head', neck: 'neck', spine: 'back', shoulders: 'shoulders',
    arms: 'arms', forearms: 'forearms', hands: 'wrists',
    hips: 'hips', thighs: 'thighs', shins: 'calves', feet: 'ankles'
  };
  const words = groups => (groups || []).map(g => PART[g] || g);
  // the tag stays short enough to sit on one line; the label reads aloud
  const partTag = groups => words(groups).join(' · ') || 'whole body';
  const partSentence = groups => {
    const w = words(groups);
    return w.length < 2 ? (w[0] || 'whole body') : `${w.slice(0, -1).join(', ')} and ${w[w.length - 1]}`;
  };

  // the figure is the only place the moving parts are named, so its
  // label has to carry that for anyone who cannot see the animation
  const figure = name => {
    const spec = window.ANIMATIONS?.[name];
    if (!spec) return '';
    return `<svg class="fig" data-move="${esc(name)}" role="img"
      aria-label="${esc(`Stick figure demonstrating ${name}. The ${partSentence(spec.highlight)} move.`)}"></svg>`;
  };

  const moveCount = WORKOUTS.reduce((n, r) => n + r.moves.length, 0);
  const grandTotal = WORKOUTS.reduce((n, r) => n + totalOf(r), 0);
  summary.textContent =
    `${moveCount} exercises across ${WORKOUTS.length} routines — ${clock(grandTotal)} of movement in total, ` +
    `none of it needing more than a chair and a desk. The highlighted limbs are the ones that move.`;

  library.innerHTML = WORKOUTS.map(r => `
    <article class="group" data-stagger>
      <header class="group__head">
        <h2 class="group__name">${esc(r.name)}</h2>
        <span class="routine__len">${clock(totalOf(r))}</span>
        <p class="group__blurb">${esc(r.blurb)}</p>
      </header>

      <ol class="moves">
        ${r.moves.map((m, i) => `
          <li class="move">
            <span class="move__n" aria-hidden="true">${i + 1}</span>
            <div class="move__body">
              <h3 class="move__name">${esc(m.name)}</h3>
              <p class="move__text">${esc(m.text)}</p>
              <p class="move__meta">
                <span class="tag tag--work">${m.work}s</span>
                ${m.rest > 0 && r.moves[i + 1] ? `<span class="tag tag--rest">${m.rest}s rest</span>` : ''}
                <span class="tag tag--part">${esc(partTag((window.ANIMATIONS?.[m.name] || {}).highlight))}</span>
              </p>
            </div>
            ${figure(m.name)}
          </li>`).join('')}
      </ol>

      <a class="btn btn--primary btn--wide" href="index.html?start=${encodeURIComponent(r.id)}">
        <span class="btn__label">Start ${esc(r.name)}</span>
      </a>
    </article>`).join('');

  // the design system owns the curve; this only fixes the order
  document.querySelectorAll('[data-stagger]').forEach((el, i) => el.style.setProperty('--i', i));

  library.querySelectorAll('.fig').forEach(svg => {
    const spec = window.ANIMATIONS[svg.dataset.move];
    if (spec) Figure.create(svg, spec);
  });
})();
