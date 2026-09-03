# office-workout

Static website to display workouts to do in the office. No build step, no
dependencies — open `index.html` or serve the folder.

```
index.html        the player — three screens (home / session / done)
workouts.html     the catalogue — every routine and exercise, described
css/styles.css    design tokens + the motion system, shared by both pages
js/workouts.js    routine data — edit this to change the exercises
js/app.js         session clock, screen orchestration, animation timing
js/browse.js      builds the catalogue page from the same data
```

Both pages read `js/workouts.js`, so adding an exercise there makes it show
up in the player and the catalogue at once. `workouts.html` links into a
routine with `index.html?start=<routine id>`, which starts it immediately and
skips the home entrance animation.

## Motion

Animation is treated as one system rather than per-element decoration. The
rules the code follows:

- **One easing family, four durations.** `--dur-1`…`--dur-4` and
  `--ease-out / -in / -emph / -spring` are declared once in `:root`; nothing
  hard-codes a duration or a curve.
- **Transform and opacity only.** Nothing animates a property that forces
  layout. The progress bar is a `scaleX`, the ring is a `stroke-dashoffset`,
  the screens translate.
- **The ring is driven per animation frame**, not per second, so the sweep is
  continuous instead of ticking in one-second jumps.
- **Content changes are out-then-in pairs.** The outgoing copy leaves faster
  and travels less than the incoming copy arrives, so a change reads as
  forward motion rather than a crossfade.
- **Screens overlap during a swap.** The stage locks both screens into
  absolute position first, so nothing reflows mid-animation.
- **Entrances stagger from one variable.** JS sets `--i` per element; CSS owns
  the curve.
- **`prefers-reduced-motion` is honoured everywhere.** Movement is removed —
  including the count-in and the ambient background — but every moving element
  also changes colour or opacity, so no state becomes unreadable.

## Controls

Space or `K` pause/resume · ←/→ previous/skip · Esc leaves the session.
