/* ============================================================
   Desk Reset — app + motion orchestration

   Motion principles applied here:
   · The ring is driven per animation frame, not per second, so the
     sweep is continuous instead of ticking in 1s jumps.
   · Every content change is a coordinated out-then-in pair, never a
     hard swap and never two things moving in opposite directions.
   · Screen swaps run both screens at once with a short overlap, so
     the eye is handed from one to the next.
   · Anything decorative is skipped entirely under reduced motion;
     state still changes, it just arrives instantly.
   ============================================================ */
(() => {
  'use strict';

  const EASE_OUT  = 'cubic-bezier(.22, 1, .36, 1)';
  const EASE_IN   = 'cubic-bezier(.55, 0, 1, .45)';
  const EASE_EMPH = 'cubic-bezier(.2, 0, 0, 1)';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduced.matches;

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const role = (name, root = document) => root.querySelector(`[data-role="${name}"]`);

  const stage   = $('#stage');
  const screens = Object.fromEntries($$('.screen').map(el => [el.dataset.screen, el]));
  const barSub  = role('bar-sub');
  const backBtn = $('[data-action="back"]');

  const ui = {
    routines: role('routines'),
    progress: role('progress'),
    step:     role('step'),
    dial:     role('dial'),
    sweep:    $('.dial__sweep'),
    phase:    role('phase'),
    time:     role('time'),
    countin:  role('countin'),
    cue:      role('cue'),
    name:     role('name'),
    text:     role('text'),
    next:     role('next'),
    toggle:   role('toggle-label'),
    live:     role('live'),
    doneCount: role('done-count'),
    doneTime:  role('done-time')
  };

  /* ── promise helper: resolve when a WAAPI animation ends ─── */
  const play = (el, frames, opts) => {
    if (still()) return Promise.resolve();
    const a = el.animate(frames, { fill: 'both', ...opts });
    // cancel on settle so the element returns to its CSS-declared state;
    // chained calls re-animate in the same microtask, so nothing flashes
    return a.finished.catch(() => {}).then(() => { try { a.cancel(); } catch (_) {} });
  };
  const wait = ms => new Promise(r => setTimeout(r, still() ? 0 : ms));

  /* ── entrance stagger: CSS owns the curve, JS owns the order ─ */
  function stagger(root) {
    $$('[data-stagger], .routine', root).forEach((el, i) => el.style.setProperty('--i', i));
  }

  /* ── screen transitions ───────────────────────────────────
     Both screens animate together over an overlapping window:
     the outgoing one leaves faster than the incoming arrives,
     which reads as a hand-off rather than a crossfade.       */
  let current = 'home';
  let swapping = false;

  async function goTo(name, dir = 'forward', instant = false) {
    if (swapping || name === current) return;
    const from = screens[current], to = screens[name];
    swapping = true;

    to.hidden = false;
    stagger(to);
    // restart CSS entrance animations on the incoming screen
    $$('[data-stagger], .routine', to).forEach(el => {
      el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    });

    backBtn.hidden = (name === 'home');
    setBarSub(name === 'home' ? 'Move a little. Often.'
            : name === 'done' ? 'That is the hard part done.'
            : (state.routine?.blurb ?? ''));

    if (still() || instant) {
      from.hidden = true; current = name; swapping = false; return;
    }

    stage.classList.add('is-swapping');
    const d = dir === 'back' ? -1 : 1;

    const out = from.animate([
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: `translate3d(${-5 * d}%, 0, 0) scale(.985)` }
    ], { duration: 220, easing: EASE_IN, fill: 'both' });

    const into = to.animate([
      { opacity: 0, transform: `translate3d(${7 * d}%, 0, 0)` },
      { opacity: 1, transform: 'none' }
    ], { duration: 420, delay: 90, easing: EASE_OUT, fill: 'both' });

    await Promise.allSettled([out.finished, into.finished]);
    out.cancel(); into.cancel();

    from.hidden = true;
    stage.classList.remove('is-swapping');
    current = name;
    swapping = false;
  }

  function setBarSub(text) {
    if (barSub.textContent === text) return;
    if (still()) { barSub.textContent = text; return; }
    barSub.classList.add('is-swapping');
    setTimeout(() => { barSub.textContent = text; barSub.classList.remove('is-swapping'); }, 200);
  }

  /* ── home list ────────────────────────────────────────── */
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const totalOf = r => r.moves.reduce((n, m) => n + m.work + m.rest, 0);

  function buildHome() {
    ui.routines.innerHTML = '';
    WORKOUTS.forEach(r => {
      const li = document.createElement('li');
      li.innerHTML = `
        <button class="routine" type="button" data-routine="${r.id}">
          <span>
            <span class="routine__name">${r.name}</span>
            <span class="routine__meta">${r.blurb}</span>
          </span>
          <span class="routine__len">${fmt(totalOf(r))}</span>
        </button>`;
      ui.routines.append(li);
    });
    stagger(screens.home);
  }

  /* ── session state ────────────────────────────────────── */
  const state = {
    routine: null,
    segments: [],
    total: 0,       // ms of the whole routine, cached for the progress bar
    i: 0,
    remaining: 0,   // ms left in the current segment
    endAt: 0,       // performance.now() target while running
    running: false,
    raf: 0,
    shownSecond: -1
  };

  function buildSegments(routine) {
    const segs = [];
    routine.moves.forEach((m, idx) => {
      segs.push({ kind: 'work', move: m, idx, duration: m.work * 1000 });
      const nextMove = routine.moves[idx + 1];
      if (m.rest > 0 && nextMove) {
        segs.push({ kind: 'rest', move: m, next: nextMove, idx, duration: m.rest * 1000 });
      }
    });
    return segs;
  }

  async function startRoutine(id, { instant = false } = {}) {
    const routine = WORKOUTS.find(r => r.id === id);
    if (!routine) return;
    state.routine = routine;
    state.segments = buildSegments(routine);
    state.total = state.segments.reduce((n, s) => n + s.duration, 0);
    state.i = 0;
    state.running = false;

    applySegment(state.segments[0], { animate: false });
    setProgress(0);
    await goTo('session', 'forward', instant);
    await countIn();
    resume();
  }

  /* ── the 3-2-1 ──────────────────────────────────────────
     Each numeral scales down as it fades, so the sequence has
     direction; the ring wipes to full underneath it.        */
  async function countIn() {
    ui.phase.textContent = 'Get ready';
    if (still()) { ui.countin.hidden = true; setPhase(state.segments[state.i]); return; }

    ui.time.style.opacity = '0';
    ui.countin.hidden = false;
    setSweep(0);

    for (const n of [3, 2, 1]) {
      ui.countin.textContent = n;
      await play(ui.countin, [
        { opacity: 0, transform: 'scale(1.5)' },
        { opacity: 1, transform: 'scale(1)', offset: .35 },
        { opacity: 0, transform: 'scale(.85)' }
      ], { duration: 620, easing: EASE_EMPH });
      setSweep((4 - n) / 3);
    }

    ui.countin.hidden = true;
    ui.time.style.opacity = '';
    setPhase(state.segments[state.i]);
    play(ui.time, [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }],
         { duration: 320, easing: EASE_OUT });
  }

  /* ── per-segment paint ────────────────────────────────── */
  function applySegment(seg, { animate = true } = {}) {
    state.remaining = seg.duration;
    state.shownSecond = -1;

    const isRest = seg.kind === 'rest';
    const session = screens.session;
    session.style.setProperty('--accent', isRest ? 'var(--rest)' : 'var(--work)');
    ui.dial.classList.toggle('is-resting', isRest);

    ui.step.textContent = `Exercise ${seg.idx + 1} of ${state.routine.moves.length}`;
    if (ui.countin.hidden) setPhase(seg);

    const heading = isRest ? 'Rest' : seg.move.name;
    const body    = isRest ? 'Shake it out. Loosen the shoulders.' : seg.move.text;
    const upNext  = isRest ? `Next · ${seg.next.name}` : nextLabel(seg);

    const paint = () => {
      ui.name.textContent = heading;
      ui.text.textContent = body;
      ui.next.textContent = upNext;
    };

    if (!animate || still()) { paint(); }
    else {
      // out, swap, in — the incoming copy travels a little further
      // than the outgoing one so the change reads as forward motion
      play(ui.cue, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate3d(0,-10px,0)' }],
           { duration: 160, easing: EASE_IN })
        .then(() => {
          paint();
          return play(ui.cue, [{ opacity: 0, transform: 'translate3d(0,16px,0)' }, { opacity: 1, transform: 'none' }],
                      { duration: 340, easing: EASE_OUT });
        });
    }

    renderTime(true);
    setSweep(1);
    announce(isRest ? `Rest. Next, ${seg.next.name}` : seg.move.name);
  }

  // the phase word crossfades rather than cutting, so work -> rest
  // reads as one change together with the ring's colour shift
  function setPhase(seg) {
    const word = seg.kind === 'rest' ? 'Rest' : 'Work';
    if (ui.phase.textContent === word) return;
    if (still()) { ui.phase.textContent = word; return; }
    ui.phase.classList.add('is-swapping');
    setTimeout(() => { ui.phase.textContent = word; ui.phase.classList.remove('is-swapping'); }, 200);
  }

  function nextLabel(seg) {
    const n = state.segments[state.segments.indexOf(seg) + 1];
    if (!n) return 'Last one.';
    return n.kind === 'rest' ? `Then · ${n.next.name}` : `Next · ${n.move.name}`;
  }

  const announce = msg => { ui.live.textContent = msg; };

  /* ── ring + digits ────────────────────────────────────── */
  function setSweep(fraction) {
    ui.sweep.style.strokeDashoffset = String(1 - Math.max(0, Math.min(1, fraction)));
  }

  function renderTime(force = false) {
    const secs = Math.max(0, Math.ceil(state.remaining / 1000));
    if (!force && secs === state.shownSecond) return;
    const changed = state.shownSecond !== -1 && secs !== state.shownSecond;
    state.shownSecond = secs;
    ui.time.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

    if (!changed || still() || !state.running) return;
    if (secs > 0 && secs <= 3) {
      // final three: a firmer beat so the change is felt, not just read
      play(ui.time, [{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }],
           { duration: 420, easing: 'cubic-bezier(.34,1.4,.64,1)' });
    } else {
      // ordinary ticks: a whisper of a roll, enough to feel alive
      play(ui.time, [{ opacity: .45, transform: 'translate3d(0,3px,0)' }, { opacity: 1, transform: 'none' }],
           { duration: 220, easing: EASE_OUT });
    }
  }

  /* ── clock ────────────────────────────────────────────── */
  function frame() {
    if (!state.running) return;
    state.remaining = state.endAt - performance.now();

    const seg = state.segments[state.i];
    setSweep(Math.max(0, state.remaining) / seg.duration);
    renderTime();
    setProgress(elapsedFraction());

    if (state.remaining <= 0) { advance(1); return; }
    state.raf = requestAnimationFrame(frame);
  }

  function elapsedFraction() {
    let before = 0;
    for (let n = 0; n < state.i; n++) before += state.segments[n].duration;
    const seg = state.segments[state.i];
    return (before + (seg.duration - Math.max(0, state.remaining))) / state.total;
  }

  function setProgress(f) {
    ui.progress.style.transform = `scaleX(${Math.max(0, Math.min(1, f))})`;
  }

  function resume() {
    if (state.running) return;
    state.running = true;
    state.endAt = performance.now() + state.remaining;
    ui.dial.classList.remove('is-paused');
    screens.session.classList.remove('is-paused-state');
    ui.toggle.textContent = 'Pause';
    state.raf = requestAnimationFrame(frame);
  }

  function pause() {
    if (!state.running) return;
    state.running = false;
    cancelAnimationFrame(state.raf);
    state.remaining = Math.max(0, state.endAt - performance.now());
    ui.dial.classList.add('is-paused');
    screens.session.classList.add('is-paused-state');
    ui.toggle.textContent = 'Resume';
    announce('Paused');
  }

  function advance(delta) {
    cancelAnimationFrame(state.raf);
    const target = state.i + delta;

    if (target >= state.segments.length) return finish();
    if (target < 0) { applySegment(state.segments[0]); restart(); return; }

    state.i = target;
    applySegment(state.segments[target]);
    restart();
  }

  function restart() {
    setProgress(elapsedFraction());
    if (state.running) {
      state.endAt = performance.now() + state.remaining;
      state.raf = requestAnimationFrame(frame);
    } else {
      renderTime(true);
      setSweep(1);
    }
  }

  async function finish() {
    state.running = false;
    cancelAnimationFrame(state.raf);
    setProgress(1);
    ui.doneCount.textContent = state.routine.moves.length;
    ui.doneTime.textContent = fmt(totalOf(state.routine));
    await goTo('done');
  }

  function quit() {
    state.running = false;
    cancelAnimationFrame(state.raf);
    goTo('home', 'back');
  }

  /* ── input ────────────────────────────────────────────── */
  document.addEventListener('click', e => {
    const routineBtn = e.target.closest('[data-routine]');
    if (routineBtn) return startRoutine(routineBtn.dataset.routine);

    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    if (action === 'toggle') state.running ? pause() : resume();
    if (action === 'next')   advance(1);
    if (action === 'prev')   advance(-1);
    if (action === 'back' || action === 'home') quit();
    if (action === 'again')  startRoutine(state.routine.id);
  });

  document.addEventListener('keydown', e => {
    if (current !== 'session') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); state.running ? pause() : resume(); }
    if (e.key === 'ArrowRight') advance(1);
    if (e.key === 'ArrowLeft')  advance(-1);
    if (e.key === 'Escape')     quit();
  });

  // a backgrounded tab should not silently burn through the timer
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  buildHome();

  // workouts.html links straight into a routine; skip the home entrance
  // animation in that case so the app does not flash a screen it is
  // already leaving
  const deepLink = new URLSearchParams(location.search).get('start');
  if (deepLink && WORKOUTS.some(r => r.id === deepLink)) startRoutine(deepLink, { instant: true });
})();
