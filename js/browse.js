/* Exercise library. Same data as the session player, laid out to read
   rather than to follow along. Motion is limited to the one staggered
   entrance the design system already defines — a reference page should
   settle quickly and then hold still. */
(() => {
  'use strict';

  const library = document.querySelector('[data-role="library"]');
  const summary = document.querySelector('[data-role="summary"]');

  const clock = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const totalOf = r => r.moves.reduce((n, m) => n + m.work + m.rest, 0);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const moveCount = WORKOUTS.reduce((n, r) => n + r.moves.length, 0);
  const grandTotal = WORKOUTS.reduce((n, r) => n + totalOf(r), 0);
  summary.textContent =
    `${moveCount} exercises across ${WORKOUTS.length} routines — ${clock(grandTotal)} of movement in total, ` +
    `none of it needing more than a chair and a desk.`;

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
              </p>
            </div>
          </li>`).join('')}
      </ol>

      <a class="btn btn--primary btn--wide" href="index.html?start=${encodeURIComponent(r.id)}">
        <span class="btn__label">Start ${esc(r.name)}</span>
      </a>
    </article>`).join('');

  // the design system owns the curve; this only fixes the order
  document.querySelectorAll('[data-stagger]').forEach((el, i) => el.style.setProperty('--i', i));
})();
