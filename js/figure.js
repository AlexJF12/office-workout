/* ============================================================
   Stick figure rig.

   A figure is a set of joint angles, not a drawing. `solve()` runs
   forward kinematics over those angles to get joint positions, and
   the renderer turns positions into SVG segments. An exercise is
   therefore authored as two or three poses; the rig fills in
   everything between them.

   Angles are degrees measured from straight down, positive turning
   toward the right of the screen:  0 = down, 90 = right, 180 = up.

   Screen-left limbs are drawn faded, which reads as the far side of
   the body and keeps side-view poses legible when both limbs
   overlap.
   ============================================================ */
(() => {
  'use strict';

  const RIG = {
    hipX: 60, hipY: 92,
    torso: 38, neck: 6, headR: 9,
    shoulderW: 22, hipW: 14,
    upperArm: 19, foreArm: 17, hand: 6,
    thigh: 26, shin: 26, foot: 8,
    ground: 145
  };

  const NEUTRAL = {
    x: 0, y: 0,            // whole-body offset
    lean: 0,               // torso pitch, + tips toward the right
    spine: 0,              // spine curvature, + rounds toward the right
    pelvis: 0,             // pelvis tilt
    headTilt: 0,
    shrugX: 0, shrugY: 0,  // shoulder girdle travel
    armL: -8, armR: 8,     // upper arm, absolute
    elbowL: 0, elbowR: 0,  // forearm, relative to the upper arm
    wristL: 0, wristR: 0,  // hand, relative to the forearm
    hipL: 0, hipR: 0,      // thigh, absolute
    kneeL: 0, kneeR: 0,    // shin, relative to the thigh
    ankleL: 0, ankleR: 0   // foot, relative to the shin
  };

  const KEYS = Object.keys(NEUTRAL);
  const RAD = Math.PI / 180;
  const at = (o, deg, len) => [o[0] + Math.sin(deg * RAD) * len, o[1] + Math.cos(deg * RAD) * len];

  const pose = (o = {}) => ({ ...NEUTRAL, ...o });

  function solve(p) {
    const hip = [RIG.hipX + p.x, RIG.hipY + p.y];

    const sc0 = at(hip, 180 - p.lean, RIG.torso);
    const sc = [sc0[0] + p.shrugX, sc0[1] + p.shrugY];

    // unit vector across the shoulders, perpendicular to the torso
    const px = Math.cos(p.lean * RAD), py = Math.sin(p.lean * RAD);
    const hw = RIG.shoulderW / 2;
    const shR = [sc[0] + px * hw, sc[1] + py * hw];
    const shL = [sc[0] - px * hw, sc[1] - py * hw];

    const headDeg = 180 - p.lean - p.headTilt;
    const neckTop = at(sc, headDeg, RIG.neck);
    const head = at(sc, headDeg, RIG.neck + RIG.headR);

    const arm = (sh, a, e, w) => {
      const elbow = at(sh, a, RIG.upperArm);
      const wrist = at(elbow, a + e, RIG.foreArm);
      return { elbow, wrist, tip: at(wrist, a + e + w, RIG.hand) };
    };
    const aR = arm(shR, p.armR, p.elbowR, p.wristR);
    const aL = arm(shL, p.armL, p.elbowL, p.wristL);

    const qx = Math.cos(p.pelvis * RAD), qy = Math.sin(p.pelvis * RAD);
    const pw = RIG.hipW / 2;
    const hpR = [hip[0] + qx * pw, hip[1] + qy * pw];
    const hpL = [hip[0] - qx * pw, hip[1] - qy * pw];

    const leg = (h, a, k, n) => {
      const knee = at(h, a, RIG.thigh);
      const ankle = at(knee, a + k, RIG.shin);
      return { knee, ankle, toe: at(ankle, a + k + n + 90, RIG.foot) };
    };
    const lR = leg(hpR, p.hipR, p.kneeR, p.ankleR);
    const lL = leg(hpL, p.hipL, p.kneeL, p.ankleL);

    // spine drawn as a curve so rounding and arching are visible
    const mid = [(hip[0] + sc[0]) / 2, (hip[1] + sc[1]) / 2];
    const ctrl = [mid[0] + px * p.spine, mid[1] + py * p.spine];

    return { hip, sc, shR, shL, neckTop, head, aR, aL, hpR, hpL, lR, lL, ctrl };
  }

  /* segment list — order is paint order, `far` limbs sit behind */
  function segments(j) {
    const L = (group, a, b, far) => ({ group, far, d: `M${a[0]} ${a[1]}L${b[0]} ${b[1]}` });
    return [
      L('arms',     j.shL, j.aL.elbow, true),
      L('forearms', j.aL.elbow, j.aL.wrist, true),
      L('hands',    j.aL.wrist, j.aL.tip, true),
      L('thighs',   j.hpL, j.lL.knee, true),
      L('shins',    j.lL.knee, j.lL.ankle, true),
      L('feet',     j.lL.ankle, j.lL.toe, true),

      { group: 'spine', d: `M${j.hip[0]} ${j.hip[1]}Q${j.ctrl[0]} ${j.ctrl[1]} ${j.sc[0]} ${j.sc[1]}` },
      L('hips',      j.hpL, j.hpR),
      L('shoulders', j.shL, j.shR),
      L('neck',      j.sc, j.neckTop),

      L('arms',     j.shR, j.aR.elbow),
      L('forearms', j.aR.elbow, j.aR.wrist),
      L('hands',    j.aR.wrist, j.aR.tip),
      L('thighs',   j.hpR, j.lR.knee),
      L('shins',    j.lR.knee, j.lR.ankle),
      L('feet',     j.lR.ankle, j.lR.toe)
    ];
  }

  const PROPS = {
    desk:       'M90 106H118',              // in front, hands on the edge
    deskBehind: 'M24 104H56',               // behind, hands on the edge
    chair:      'M40 122H84M40 122V100',    // seat, and a back behind the figure
    wall:       'M39 26V145'
  };

  /* ── one shared clock for every figure on the page ───────── */
  const live = new Set();
  let ticking = false;

  function loop(now) {
    live.forEach(f => f.render(now));
    if (live.size) requestAnimationFrame(loop);
    else ticking = false;
  }
  function wake() {
    if (ticking || !live.size) return;
    ticking = true;
    requestAnimationFrame(loop);
  }

  const observer = ('IntersectionObserver' in window)
    ? new IntersectionObserver(entries => {
        entries.forEach(e => {
          const fig = e.target.__figure;
          if (!fig) return;
          if (e.isIntersecting) { live.add(fig); wake(); } else { live.delete(fig); }
        });
      }, { rootMargin: '120px' })
    : null;

  const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  function blend(a, b, t) {
    const out = {};
    for (const k of KEYS) out[k] = lerp(a[k], b[k], t);
    return out;
  }

  /* ── a figure ────────────────────────────────────────────── */
  class Figure {
    constructor(svg, spec) {
      this.spec = spec;
      this.frames = spec.frames.map(pose);
      this.duration = (spec.duration || 3) * 1000;
      this.hot = new Set(spec.highlight || []);
      this.svg = svg;
      this.build();

      if (still()) {
        // no movement: show the end of the range over a ghost of the
        // start, so the travel is still readable as a shape
        this.ghost();
        this.paint(this.frames[Math.min(1, this.frames.length - 1)]);
        return;
      }
      svg.__figure = this;
      if (observer) observer.observe(svg);
      else { live.add(this); wake(); }
    }

    build() {
      const ns = 'http://www.w3.org/2000/svg';
      const el = n => document.createElementNS(ns, n);
      this.svg.setAttribute('viewBox', '0 0 120 160');

      const ground = el('path');
      ground.setAttribute('class', 'fig__ground');
      ground.setAttribute('d', `M12 ${RIG.ground}H108`);
      this.svg.append(ground);

      if (this.spec.prop && PROPS[this.spec.prop]) {
        const prop = el('path');
        prop.setAttribute('class', 'fig__prop');
        prop.setAttribute('d', PROPS[this.spec.prop]);
        this.svg.append(prop);
      }

      this.ghostGroup = el('g');
      this.ghostGroup.setAttribute('class', 'fig__ghost');
      this.svg.append(this.ghostGroup);

      this.head = el('circle');
      this.head.setAttribute('r', RIG.headR);
      this.paths = segments(solve(this.frames[0])).map(seg => {
        const path = el('path');
        path.setAttribute('class',
          `fig__bone${seg.far ? ' is-far' : ''}${this.hot.has(seg.group) ? ' is-hot' : ''}`);
        this.svg.append(path);
        return path;
      });
      this.head.setAttribute('class', `fig__head${this.hot.has('head') ? ' is-hot' : ''}`);
      this.svg.append(this.head);
    }

    ghost() {
      const j = solve(this.frames[0]);
      const ns = 'http://www.w3.org/2000/svg';
      segments(j).forEach(seg => {
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', seg.d);
        path.setAttribute('class', 'fig__bone');
        this.ghostGroup.append(path);
      });
      const h = document.createElementNS(ns, 'circle');
      h.setAttribute('r', RIG.headR);
      h.setAttribute('cx', j.head[0]); h.setAttribute('cy', j.head[1]);
      h.setAttribute('class', 'fig__head');
      this.ghostGroup.append(h);
    }

    paint(p) {
      const j = solve(p);
      segments(j).forEach((seg, i) => this.paths[i].setAttribute('d', seg.d));
      this.head.setAttribute('cx', j.head[0]);
      this.head.setAttribute('cy', j.head[1]);
    }

    render(now) {
      if (this.t0 === undefined) this.t0 = now;
      // the cycle runs through the poses and back again, so the loop
      // never jumps: a rep out is a rep back
      const legs = (this.frames.length - 1) * 2;
      const phase = ((now - this.t0) / this.duration % 1) * legs;
      let i = Math.floor(phase);
      const t = easeInOut(phase - i);
      const fwd = i < this.frames.length - 1;
      const a = fwd ? i : legs - i;
      const b = fwd ? i + 1 : legs - i - 1;
      this.paint(blend(this.frames[a], this.frames[b], t));
    }
  }

  window.Figure = {
    create(svg, spec) { return new Figure(svg, spec); },
    pose, solve, RIG
  };
})();
