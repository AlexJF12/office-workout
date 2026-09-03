/* ============================================================
   One animation per exercise, keyed by the move's name.

   Each entry is:
     highlight  the joint groups that move — these are drawn in the
                accent colour, everything else stays muted, which is
                what makes "what moves" readable at a glance
     duration   seconds for one full out-and-back cycle
     prop       optional desk / chair / wall the move leans on
     frames     poses; the rig interpolates between them and back

   Angle convention (see figure.js): 0 = down, 90 = right, 180 = up.
   Most side-view poses face right.
   ============================================================ */
window.ANIMATIONS = {

  /* ── Quick Reset ─────────────────────────────────────────── */
  'Neck rolls': {
    highlight: ['head', 'neck'], duration: 4,
    frames: [{ headTilt: -26 }, { headTilt: 0 }, { headTilt: 26 }]
  },

  'Shoulder rolls': {
    highlight: ['shoulders', 'arms'], duration: 3,
    frames: [
      { shrugY: 2, armL: -6, armR: 6 },
      { shrugY: -7, armL: -14, armR: 14 },
      { shrugY: 0, armL: -4, armR: 4 }
    ]
  },

  'Wrist circles': {
    highlight: ['forearms', 'hands'], duration: 2.2,
    frames: [
      { armR: 35, elbowR: 55, wristR: -45, armL: 31, elbowL: 55, wristL: 45 },
      { armR: 35, elbowR: 55, wristR: 45, armL: 31, elbowL: 55, wristL: -45 }
    ]
  },

  'Seated twist': {
    highlight: ['spine', 'shoulders', 'arms'], duration: 4.5, prop: 'chair',
    frames: [
      { y: 26, hipR: 84, kneeR: -84, hipL: 82, kneeL: -82,
        headTilt: -18, armR: -70, elbowR: -25, armL: 35, elbowL: 15 },
      { y: 26, hipR: 84, kneeR: -84, hipL: 82, kneeL: -82,
        headTilt: 0, armR: -14, elbowR: -8, armL: 14, elbowL: 8 },
      { y: 26, hipR: 84, kneeR: -84, hipL: 82, kneeL: -82,
        headTilt: 18, armR: -35, elbowR: -15, armL: 70, elbowL: 25 }
    ]
  },

  'Chest opener': {
    highlight: ['arms', 'shoulders', 'spine'], duration: 3.4,
    frames: [
      { armR: 100, elbowR: -228, armL: -100, elbowL: 228 },
      { armR: 118, elbowR: -246, armL: -118, elbowL: 246, spine: 4 }
    ]
  },

  'Upper-back stretch': {
    highlight: ['spine', 'shoulders', 'arms'], duration: 3.6,
    frames: [
      { lean: 4, spine: -6, armR: 66, elbowR: -22, armL: 62, elbowL: -22 },
      { lean: 10, spine: -28, armR: 64, elbowR: -24, armL: 60, elbowL: -24, headTilt: 20 }
    ]
  },

  /* ── Desk Mobility ───────────────────────────────────────── */
  'Standing side bend': {
    highlight: ['spine', 'arms', 'hips'], duration: 4,
    frames: [
      { lean: 0, spine: 0, armR: 178, armL: -8 },
      { lean: -22, spine: 14, armR: 196, armL: -6, headTilt: -6 }
    ]
  },

  'Cat–cow at the desk': {
    highlight: ['spine'], duration: 4.4, prop: 'desk',
    frames: [
      { x: -22, lean: 52, spine: -20, armR: 41, elbowR: 4, armL: 38, elbowL: 4, headTilt: -18 },
      { x: -22, lean: 52, spine: 22, armR: 41, elbowR: 4, armL: 38, elbowL: 4, headTilt: 24 }
    ]
  },

  'Hip flexor lunge': {
    highlight: ['hips', 'thighs'], duration: 3.8,
    frames: [
      { y: 2, lean: -4, hipR: 20, kneeR: -40, hipL: -26, kneeL: 45, ankleL: -32,
        armR: 12, armL: -12 },
      { y: 6, lean: -6, hipR: 26, kneeR: -52, hipL: -30, kneeL: 55, ankleL: -40,
        armR: 14, armL: -14 }
    ]
  },

  'Figure-four sit': {
    highlight: ['hips', 'thighs', 'spine'], duration: 4.2, prop: 'chair',
    frames: [
      { y: 26, lean: 4, hipR: 84, kneeR: -84, hipL: 60, kneeL: 64, ankleL: -60,
        armR: 44, elbowR: -30, armL: 40, elbowL: -30 },
      { y: 26, lean: 26, spine: 10, hipR: 84, kneeR: -84, hipL: 60, kneeL: 64, ankleL: -60,
        armR: 44, elbowR: -30, armL: 40, elbowL: -30, headTilt: 10 }
    ]
  },

  'Calf raises': {
    highlight: ['shins', 'feet'], duration: 2.6,
    frames: [
      { y: 0, ankleR: 0, ankleL: 0 },
      { y: -7, ankleR: -52, ankleL: -52, armR: 10, armL: -10 }
    ]
  },

  'Hamstring reach': {
    highlight: ['hips', 'thighs', 'spine'], duration: 4,
    frames: [
      { y: 3, lean: 16, spine: -4, hipR: 24, kneeR: -2, ankleR: 34, hipL: -10, kneeL: -8,
        armR: 26, elbowR: -8, armL: 22, elbowL: -8 },
      { y: 3, lean: 44, spine: -12, hipR: 28, kneeR: -2, ankleR: 40, hipL: -12, kneeL: -10,
        armR: 30, elbowR: -10, armL: 26, elbowL: -10, headTilt: 10 }
    ]
  },

  'Ankle circles': {
    highlight: ['feet'], duration: 2.8,
    frames: [
      { hipR: 22, kneeR: -46, ankleR: -46, armR: 10, armL: -10 },
      { hipR: 22, kneeR: -46, ankleR: 0, armR: 10, armL: -10 },
      { hipR: 22, kneeR: -46, ankleR: 46, armR: 10, armL: -10 }
    ]
  },

  'Standing forward fold': {
    highlight: ['spine', 'thighs'], duration: 4.4,
    frames: [
      { lean: 10, spine: -4, kneeR: -6, kneeL: -6, armR: 8, armL: -8 },
      { lean: 72, spine: -16, kneeR: -12, kneeL: -12, armR: 22, armL: 18, headTilt: 14 }
    ]
  },

  /* ── Energy Boost ────────────────────────────────────────── */
  'Chair squats': {
    highlight: ['thighs', 'shins', 'hips'], duration: 3, prop: 'chair',
    frames: [
      { y: 0, lean: 4, hipR: 2, kneeR: -4, hipL: 0, kneeL: -4, armR: 40, armL: 36 },
      { y: 16, lean: 26, hipR: 40, kneeR: -80, hipL: 38, kneeL: -78, ankleR: 24, ankleL: 24,
        armR: 46, elbowR: -20, armL: 42, elbowL: -20 }
    ]
  },

  'Desk push-ups': {
    highlight: ['arms', 'shoulders'], duration: 2.8, prop: 'desk',
    frames: [
      { y: 3, lean: 42, armR: 14, elbowR: 18, armL: 11, elbowL: 18,
        hipR: -16, kneeR: -4, hipL: -18, kneeL: -4, ankleR: 35, ankleL: 35 },
      { y: 3, lean: 48, armR: 30, elbowR: -34, armL: 27, elbowL: -34,
        hipR: -16, kneeR: -4, hipL: -18, kneeL: -4, ankleR: 35, ankleL: 35 }
    ]
  },

  'Glute squeezes': {
    highlight: ['hips'], duration: 2.4,
    frames: [
      { pelvis: 0, lean: 2, spine: 6, hipR: 4, hipL: 2, armR: 10, armL: -10 },
      { pelvis: -18, lean: -6, spine: -8, hipR: -5, hipL: -7, armR: 10, armL: -10 }
    ]
  },

  'Calf raise pulses': {
    highlight: ['shins', 'feet'], duration: 0.9,
    frames: [
      { y: -3, ankleR: -22, ankleL: -22, armR: 10, armL: -10 },
      { y: -7, ankleR: -52, ankleL: -52, armR: 10, armL: -10 }
    ]
  },

  'Tricep desk dips': {
    highlight: ['arms', 'shoulders'], duration: 2.8, prop: 'deskBehind',
    frames: [
      { y: 22, lean: -10, armR: -38, elbowR: 0, wristR: 38, armL: -42, elbowL: 0, wristL: 42,
        hipR: 64, kneeR: -30, hipL: 62, kneeL: -28 },
      { y: 28, lean: -12, armR: -20, elbowR: -60, wristR: 80, armL: -24, elbowL: -60, wristL: 84,
        hipR: 74, kneeR: -40, hipL: 72, kneeL: -38 }
    ]
  },

  'Wall sit': {
    highlight: ['thighs'], duration: 2.2, prop: 'wall',
    frames: [
      { x: -10, y: 26, lean: 0, hipR: 80, kneeR: -84, hipL: 78, kneeL: -82,
        armR: 58, elbowR: 14, armL: 54, elbowL: 14 },
      { x: -10, y: 27.5, lean: 0, hipR: 82, kneeR: -86, hipL: 80, kneeL: -84,
        armR: 60, elbowR: 14, armL: 56, elbowL: 14 }
    ]
  },

  'Standing march': {
    highlight: ['thighs', 'shins', 'arms'], duration: 1.6,
    frames: [
      { hipR: 48, kneeR: -74, hipL: -10, kneeL: -4, ankleL: -8,
        armR: -34, elbowR: -44, armL: 40, elbowL: -40 },
      { hipL: 48, kneeL: -74, hipR: -10, kneeR: -4, ankleR: -8,
        armL: -34, elbowL: -44, armR: 40, elbowR: -40 }
    ]
  }
};
