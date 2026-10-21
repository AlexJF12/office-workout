import type { Animation } from '../figure/Figure';
import { FLOOR, pose, type Keyframe, type PoseInput } from '../figure/rig';

export type Area = 'Neck' | 'Shoulders' | 'Upper back' | 'Back' | 'Wrists' | 'Hips' | 'Legs';

export type Dose =
  /** hold for `seconds`, once or on each side */
  | { kind: 'hold'; seconds: number; sides: 1 | 2 }
  /** a rep count; with `holdSeconds` the timer guides each rep */
  | { kind: 'reps'; reps: number; holdSeconds?: number; perSide?: boolean }
  /** custom timed sequence */
  | { kind: 'phases'; phases: { label: string; seconds: number }[] };

export interface Source {
  name: string;
  url: string;
}

export interface Exercise {
  id: string;
  name: string;
  area: Area;
  why: string;
  steps: string[];
  dose: Dose;
  sources: Source[];
  anim: Animation;
}

// ---------- sources ----------

const SRC = {
  mayoHS: {
    name: 'Mayo Clinic Health System',
    url: 'https://www.mayoclinichealthsystem.org/hometown-health/speaking-of-health/dont-just-sit-there-exercises-for-the-office',
  },
  mayo: {
    name: 'Mayo Clinic: Office stretches',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/office-stretches/art-20046041',
  },
  hingeStretch: {
    name: 'Hinge Health (physical therapists)',
    url: 'https://www.hingehealth.com/resources/articles/sitting-stretches/',
  },
  hingeDesk: {
    name: 'Hinge Health: desk exercises',
    url: 'https://www.hingehealth.com/resources/articles/exercises-to-do-at-your-desk/',
  },
  hingeScap: {
    name: 'Hinge Health: scapular squeezes',
    url: 'https://www.hingehealth.com/resources/articles/scapular-squeezes/',
  },
  ucd: {
    name: 'UC Davis Campus Rec',
    url: 'https://campusrecreation.ucdavis.edu/news/desk-stretches-home-or-office',
  },
  ewm: {
    name: 'EW Motion Therapy (PT clinic)',
    url: 'https://www.ewmotiontherapy.com/blog/exercises-for-people-who-sit',
  },
  luna: {
    name: 'Luna Physical Therapy',
    url: 'https://www.getluna.com/blog/stretches-for-desk-workers',
  },
  aom: {
    name: 'Art of Manliness: undo the damage of sitting',
    url: 'https://www.artofmanliness.com/strength/fitness/undo-the-damage-of-sitting/',
  },
  vcu: {
    name: 'VCU Work-Life',
    url: 'https://blogs.vcu.edu/hr-worklife/?p=2709',
  },
  trx: {
    name: 'TRX Training',
    url: 'https://www.trxtraining.com/blogs/news/best-exercises-for-desk-workers',
  },
  froedtert: {
    name: 'Froedtert Workforce Health',
    url: 'https://www.froedtert.com/sites/default/files/upload/docs/workforce-health/tips/strength-training-anywhere-office-home.pdf',
  },
  chatelaine: {
    name: 'Chatelaine (personal trainer)',
    url: 'https://chatelaine.com/health/fitness/how-to-get-fit-at-your-desk/',
  },
  westmoreland: {
    name: 'Westmoreland County wellness',
    url: 'https://www.westmorelandcountypa.gov/DocumentCenter/View/19846/Step-Up-to-Wellness-Move-and-Stretch-at-your-Desk',
  },
  benenden: {
    name: 'Benenden Health',
    url: 'https://www.benenden.co.uk/be-healthy/work/5-exercises-at-your-desk/',
  },
} satisfies Record<string, Source>;

// ---------- reusable poses ----------

const STAND_Y = FLOOR - 5 - 88;

/** Seated, side view, on a chair whose backrest is at x=74. */
const SIT: PoseInput = {
  x: 86,
  y: 161,
  torso: -2,
  legL: { a: 90, b: 90 },
  legR: { a: 90, b: 90 },
  armL: { ik: ['kneeL', -18, -8], bend: -1 },
  armR: { ik: ['kneeR', -18, -8], bend: -1 },
};
const CHAIR = { kind: 'chair', x: 74 } as const;

/** Seated, front view. */
const SIT_FRONT: PoseInput = {
  x: 100,
  y: 152,
  legL: { a: 12, b: 12, s: 0.22 },
  legR: { a: 12, b: 12, s: 0.22 },
  armL: { ik: ['kneeL', -1, -6], bend: -1 },
  armR: { ik: ['kneeR', 1, -6], bend: 1 },
};
const CHAIR_FRONT = { kind: 'chairFront', x: 100 } as const;

const STAND_FRONT: PoseInput = {
  y: STAND_Y,
  legL: { a: 4 },
  legR: { a: 4 },
};

/** Hand resting on the top of a chair back at x=128. */
const HOLD_CHAIR = { kind: 'chair', x: 128 } as const;

const kf = (p: PoseInput[] | PoseInput, move: number, hold: number): Keyframe => ({
  pose: Array.isArray(p) ? pose(...p) : pose(p),
  move,
  hold,
});

/** Straight-body incline plank from ankles at (ax, FLOOR-5), leaning `phi` degrees from vertical. */
function plank(phi: number, ax: number): PoseInput {
  const r = (phi * Math.PI) / 180;
  return {
    x: ax + 88 * Math.sin(r),
    y: FLOOR - 5 - 88 * Math.cos(r),
    torso: phi,
    neck: -6,
    legL: { a: -phi, b: 0, c: 12 },
    legR: { a: -phi, b: 0, c: 12 },
  };
}

// ---------- the 20 exercises ----------

export const EXERCISES: Exercise[] = [
  {
    id: 'chin-tucks',
    name: 'Chin Tucks',
    area: 'Neck',
    why: 'Undoes "tech neck", the forward-head posture that hours at a screen pull you into.',
    steps: [
      'Sit tall with your eyes level.',
      'Glide your head straight back, making a double chin. Don’t nod down.',
      'Hold, then relax forward.',
    ],
    dose: { kind: 'reps', reps: 10, holdSeconds: 5 },
    sources: [SRC.ucd, SRC.ewm],
    anim: {
      view: 'side',
      props: [CHAIR],
      focus: ['neck'],
      hint: 'M126 74 h-16',
      frames: [kf([SIT, { neck: 48, head: -44 }], 0.9, 0.6), kf([SIT, { neck: -16, head: 16 }], 0.9, 1.6)],
    },
  },
  {
    id: 'ear-to-shoulder',
    name: 'Ear-to-Shoulder Stretch',
    area: 'Neck',
    why: 'Releases the upper trapezius, the muscle that knots up when your shoulders creep toward your ears.',
    steps: [
      'Sit tall and hold the edge of your seat with one hand.',
      'Tilt your other ear toward its shoulder.',
      'Keep your shoulders down. For more stretch, rest your free hand on your head, but don’t pull.',
    ],
    dose: { kind: 'hold', seconds: 30, sides: 2 },
    sources: [SRC.mayoHS, SRC.ewm, SRC.hingeStretch],
    anim: {
      view: 'front',
      props: [CHAIR_FRONT],
      focus: ['neck'],
      frames: [
        kf([SIT_FRONT, { armL: { a: 8, b: 4 } }], 1, 0.6),
        kf([SIT_FRONT, { neck: 40, head: 14, armL: { a: 8, b: 4 } }], 1.2, 2),
      ],
    },
  },
  {
    id: 'head-turns',
    name: 'Head Turns',
    area: 'Neck',
    why: 'Restores neck rotation that stiffens when you stare at one monitor all day.',
    steps: [
      'Sit tall with your shoulders relaxed.',
      'Slowly turn to look over one shoulder until you feel a gentle stretch.',
      'Hold, come back to center, then turn the other way.',
    ],
    dose: { kind: 'hold', seconds: 15, sides: 2 },
    sources: [SRC.mayoHS, SRC.hingeStretch],
    anim: {
      view: 'front',
      props: [CHAIR_FRONT],
      focus: ['neck'],
      hint: 'M80 58 Q100 48 120 58',
      frames: [
        kf([SIT_FRONT], 0.8, 0.4),
        kf([SIT_FRONT, { turn: 0.95 }], 1, 1.4),
        kf([SIT_FRONT], 1, 0.4),
        kf([SIT_FRONT, { turn: -0.95 }], 1, 1.4),
      ],
    },
  },
  {
    id: 'shoulder-rolls',
    name: 'Shoulder Rolls',
    area: 'Shoulders',
    why: 'Loosens tight shoulders and gets blood moving through the upper back and neck.',
    steps: [
      'Sit tall and let your arms hang.',
      'Lift your shoulders up toward your ears, squeeze them back, then let them drop down.',
      'Make slow, big circles, rolling backward.',
    ],
    dose: { kind: 'reps', reps: 10 },
    sources: [SRC.mayo, SRC.vcu],
    anim: {
      view: 'side',
      props: [CHAIR],
      focus: ['upperTorso', 'neck'],
      hint: 'M104 86 A14 14 0 1 0 98 108',
      frames: [
        kf([SIT, { sh: [3, 0], armR: { a: 4, b: 12 }, armL: { a: 4, b: 12 } }], 0.5, 0),
        kf([SIT, { sh: [3, 8], armR: { a: 4, b: 12 }, armL: { a: 4, b: 12 } }], 0.5, 0.1),
        kf([SIT, { sh: [-5, 5], chest: -3, armR: { a: 4, b: 12 }, armL: { a: 4, b: 12 } }], 0.5, 0),
        kf([SIT, { sh: [-4, -2], armR: { a: 4, b: 12 }, armL: { a: 4, b: 12 } }], 0.5, 0),
      ],
    },
  },
  {
    id: 'shoulder-blade-squeeze',
    name: 'Shoulder Blade Squeeze',
    area: 'Upper back',
    why: 'Wakes up the upper-back muscles that fight rounded, hunched shoulders.',
    steps: [
      'Sit tall, elbows bent at your sides.',
      'Squeeze your shoulder blades down and together, as if pinching a pencil between them.',
      'Hold, then relax. Keep your shoulders away from your ears.',
    ],
    dose: { kind: 'reps', reps: 10, holdSeconds: 5 },
    sources: [SRC.hingeScap, SRC.chatelaine],
    anim: {
      view: 'side',
      props: [CHAIR],
      focus: ['upperTorso'],
      frames: [
        kf([SIT, { chest: 6, armR: { a: 12, b: 80 }, armL: { a: 12, b: 80 } }], 0.9, 0.5),
        kf([SIT, { chest: -6, neck: -3, sh: [-5, -1], armR: { a: -28, b: 86 }, armL: { a: -28, b: 86 } }], 0.9, 1.6),
      ],
    },
  },
  {
    id: 'wall-angels',
    name: 'Wall Angels',
    area: 'Upper back',
    why: 'Opens the chest and trains the muscles that pull your shoulders back into good posture.',
    steps: [
      'Stand with your head, upper back and bottom against a wall.',
      'Raise your arms into a “goalpost”, backs of your hands touching the wall.',
      'Slowly slide your arms up as high as you can while keeping contact, then back down.',
    ],
    dose: { kind: 'reps', reps: 10 },
    sources: [SRC.aom],
    anim: {
      view: 'front',
      props: [{ kind: 'wallFront' }],
      focus: ['upperTorso', 'upperArmL', 'upperArmR'],
      frames: [
        kf([STAND_FRONT, { armL: { a: 92, b: 88 }, armR: { a: 92, b: 88 } }], 1.6, 0.4),
        kf([STAND_FRONT, { armL: { a: 158, b: 14 }, armR: { a: 158, b: 14 } }], 1.6, 0.4),
      ],
    },
  },
  {
    id: 'doorway-chest-stretch',
    name: 'Doorway Chest Stretch',
    area: 'Shoulders',
    why: 'Stretches the chest muscles that shorten when you type and pull your shoulders forward.',
    steps: [
      'Stand in a doorway and place your forearm on the frame, elbow at shoulder height.',
      'Step forward with the same-side foot until you feel a stretch across your chest.',
      'Keep your chest tall and breathe. Hold, then switch arms.',
    ],
    dose: { kind: 'hold', seconds: 30, sides: 2 },
    sources: [SRC.hingeStretch, SRC.ewm],
    anim: {
      view: 'side',
      props: [{ kind: 'door', x: 66 }],
      focus: ['upperTorso', 'upperArmR'],
      frames: [
        kf(
          {
            x: 96,
            y: STAND_Y + 2,
            armR: { ik: [70, 32], bend: 1 },
            armL: { ik: [72, 33], bend: 1 },
            legR: { ik: [118, FLOOR - 5], bend: 1 },
            legL: { ik: [86, FLOOR - 5], bend: 1 },
          },
          1,
          0.5,
        ),
        kf(
          {
            x: 110,
            y: STAND_Y + 5,
            torso: 6,
            armR: { ik: [70, 32], bend: 1 },
            armL: { ik: [72, 33], bend: 1 },
            legR: { ik: [118, FLOOR - 5], bend: 1 },
            legL: { ik: [86, FLOOR - 5], bend: 1 },
          },
          1.2,
          2,
        ),
      ],
    },
  },
  {
    id: 'cross-body-shoulder',
    name: 'Cross-Body Shoulder Stretch',
    area: 'Shoulders',
    why: 'Eases tension in the back of the shoulder from mousing and reaching.',
    steps: [
      'Bring one arm straight across your chest.',
      'With your other hand, gently draw it closer, just above the elbow.',
      'Keep the shoulder down and relaxed. Hold, then switch.',
    ],
    dose: { kind: 'hold', seconds: 30, sides: 2 },
    sources: [SRC.hingeStretch],
    anim: {
      view: 'front',
      focus: ['upperArmR'],
      frames: [
        kf([STAND_FRONT, { armR: { a: -60, b: 30 }, armL: { ik: ['elbowR', 6, 5], bend: -1 } }], 1, 0.5),
        kf([STAND_FRONT, { armR: { a: -96, b: 4 }, armL: { ik: ['elbowR', 4, 5], bend: -1 } }], 1, 2),
      ],
    },
  },
  {
    id: 'seated-back-extension',
    name: 'Chair Back Extension',
    area: 'Upper back',
    why: 'Reverses the slump by bending your upper back the other way, over the chair back.',
    steps: [
      'Sit tall against your chair, hands behind your head.',
      'Gently arch your upper back over the top of the chair, looking slightly up.',
      'Hold, then return upright. Move from between the shoulder blades, not your neck.',
    ],
    dose: { kind: 'reps', reps: 10, holdSeconds: 3 },
    sources: [SRC.ucd, SRC.hingeDesk],
    anim: {
      view: 'side',
      props: [{ kind: 'chair', x: 74, back: 132 }],
      focus: ['upperTorso'],
      frames: [
        kf([SIT, { chest: 6, armR: { ik: ['head', -7, 2], bend: 1 }, armL: { ik: ['head', -7, 2], bend: 1 } }], 1, 0.5),
        kf(
          [SIT, { torso: -6, chest: -26, neck: -8, armR: { ik: ['head', -7, 2], bend: 1 }, armL: { ik: ['head', -7, 2], bend: 1 } }],
          1.2,
          1.4,
        ),
      ],
    },
  },
  {
    id: 'seated-twist',
    name: 'Seated Spinal Twist',
    area: 'Back',
    why: 'Mobilizes the mid-back and eases the stiffness that builds when you sit still for hours.',
    steps: [
      'Sit tall with both feet flat.',
      'Turn your torso, one hand on the opposite knee and the other on the chair back.',
      'Grow tall as you breathe and turn a little further each exhale. Hold, then switch.',
    ],
    dose: { kind: 'hold', seconds: 30, sides: 2 },
    sources: [SRC.luna, SRC.mayoHS],
    anim: {
      view: 'front',
      props: [CHAIR_FRONT],
      focus: ['upperTorso', 'lowerTorso'],
      frames: [
        kf([SIT_FRONT], 1, 0.4),
        kf(
          [SIT_FRONT, { twist: 0.85, turn: 0.15, armL: { ik: ['kneeR', -2, -6], bend: 1 }, armR: { ik: ['pelvis', 30, -26], bend: 1 } }],
          1.2,
          2,
        ),
      ],
    },
  },
  {
    id: 'standing-side-bend',
    name: 'Standing Side Bend',
    area: 'Back',
    why: 'Stretches the sides of your trunk and opens the ribs so you can breathe deeper.',
    steps: [
      'Stand tall, feet hip-width apart.',
      'Reach one arm overhead and slide the other hand down your thigh.',
      'Lean gently away from the raised arm. Hold, then switch.',
    ],
    dose: { kind: 'hold', seconds: 20, sides: 2 },
    sources: [SRC.hingeStretch, SRC.vcu],
    anim: {
      view: 'front',
      focus: ['lowerTorso', 'upperArmL'],
      frames: [
        kf([STAND_FRONT, { armL: { a: 160, b: 14 }, armR: { a: 6, b: 2 } }], 1, 0.4),
        kf([STAND_FRONT, { torso: 6, chest: 16, neck: 6, armL: { a: 168, b: 10 }, armR: { a: 2, b: 0 } }], 1.2, 2),
      ],
    },
  },
  {
    id: 'standing-back-extension',
    name: 'Standing Back Extension',
    area: 'Back',
    why: 'Counters hours of being folded forward and relieves a stiff lower back.',
    steps: [
      'Stand with your feet hip-width apart and your hands on your lower back.',
      'Gently lean back, pushing your hips slightly forward and looking a little up.',
      'Return to standing. Keep it comfortable and pain-free.',
    ],
    dose: { kind: 'reps', reps: 10 },
    sources: [SRC.hingeStretch],
    anim: {
      view: 'side',
      focus: ['lowerTorso'],
      frames: [
        kf({ armR: { ik: ['pelvis', -10, -14], bend: -1 }, armL: { ik: ['pelvis', -10, -14], bend: -1 } }, 1, 0.5),
        kf(
          { x: 104, torso: -8, chest: -16, neck: -10, armR: { ik: ['pelvis', -10, -14], bend: -1 }, armL: { ik: ['pelvis', -10, -14], bend: -1 } },
          1.1,
          1,
        ),
      ],
    },
  },
  {
    id: 'wrist-forearm-stretch',
    name: 'Wrist & Forearm Stretch',
    area: 'Wrists',
    why: 'Relieves forearms and wrists overworked by typing and mousing.',
    steps: [
      'Hold one arm straight out, palm facing away like a “stop” sign, and gently pull the fingers back.',
      'Then turn the palm down and gently bend the wrist down.',
      'Hold each position, then switch arms.',
    ],
    dose: {
      kind: 'phases',
      phases: [
        { label: 'Arm 1 · palm out', seconds: 15 },
        { label: 'Arm 1 · palm down', seconds: 15 },
        { label: 'Arm 2 · palm out', seconds: 15 },
        { label: 'Arm 2 · palm down', seconds: 15 },
      ],
    },
    sources: [SRC.mayoHS, SRC.hingeStretch],
    anim: {
      view: 'side',
      props: [CHAIR],
      focus: ['forearmR'],
      frames: [
        kf([SIT, { armR: { a: 86, b: 0, c: 0 }, armL: { ik: ['handR', -2, -2], bend: -1 } }], 0.8, 0.3),
        kf([SIT, { armR: { a: 86, b: 0, c: -80 }, armL: { ik: ['handR', 0, 0], bend: -1 } }], 0.9, 1.6),
        kf([SIT, { armR: { a: 86, b: 0, c: 0 }, armL: { ik: ['handR', -2, -2], bend: -1 } }], 0.9, 0.3),
        kf([SIT, { armR: { a: 86, b: 0, c: 80 }, armL: { ik: ['handR', 0, 0], bend: -1 } }], 0.9, 1.6),
      ],
    },
  },
  {
    id: 'desk-push-ups',
    name: 'Desk Push-Ups',
    area: 'Shoulders',
    why: 'Strengthens chest, shoulders and arms without leaving your desk.',
    steps: [
      'Place your hands on the edge of a sturdy desk (not a rolling one), shoulder-width apart.',
      'Walk your feet back until your body is in a straight line.',
      'Lower your chest toward the desk, then press back up.',
    ],
    dose: { kind: 'reps', reps: 10 },
    sources: [SRC.mayoHS, SRC.chatelaine],
    anim: {
      view: 'side',
      props: [{ kind: 'desk', x: 140 }],
      focus: ['upperTorso', 'upperArmR'],
      frames: [
        kf([plank(39, 14), { armR: { ik: [150, 130], bend: -1 }, armL: { ik: [152, 130], bend: -1 } }], 0.9, 0.3),
        kf([plank(50, 14), { armR: { ik: [150, 130], bend: -1 }, armL: { ik: [152, 130], bend: -1 } }], 0.9, 0.3),
      ],
    },
  },
  {
    id: 'hip-flexor-stretch',
    name: 'Standing Hip Flexor Stretch',
    area: 'Hips',
    why: 'Sitting keeps your hip flexors short; this lengthens them and takes pressure off your lower back.',
    steps: [
      'Stand in a split stance, one foot well behind you.',
      'Tuck your pelvis under and squeeze the glute of the back leg.',
      'Shift forward until you feel a stretch at the front of the back hip. Keep your chest tall. Switch.',
    ],
    dose: { kind: 'hold', seconds: 30, sides: 2 },
    sources: [SRC.ucd, SRC.hingeStretch, SRC.aom],
    anim: {
      view: 'side',
      focus: ['thighR'],
      frames: [
        kf(
          {
            x: 96,
            y: STAND_Y + 4,
            legL: { ik: [130, FLOOR - 5], bend: 1 },
            legR: { ik: [62, FLOOR - 9], bend: 1, c: -40 },
            armR: { ik: ['pelvis', 6, -16], bend: 1 },
            armL: { ik: ['pelvis', 6, -16], bend: 1 },
          },
          1,
          0.5,
        ),
        kf(
          {
            x: 104,
            y: STAND_Y + 12,
            torso: -4,
            legL: { ik: [130, FLOOR - 5], bend: 1 },
            legR: { ik: [62, FLOOR - 9], bend: 1, c: -40 },
            armR: { ik: ['pelvis', 6, -16], bend: 1 },
            armL: { ik: ['pelvis', 6, -16], bend: 1 },
          },
          1.2,
          2,
        ),
      ],
    },
  },
  {
    id: 'seated-figure-four',
    name: 'Seated Figure-4 Stretch',
    area: 'Hips',
    why: 'Stretches the glutes and deep hip rotators that get compressed when you sit.',
    steps: [
      'Sit tall and cross one ankle over the opposite knee.',
      'Keeping your back straight, hinge forward from your hips.',
      'Stop when you feel a stretch in the hip and glute of the crossed leg. Hold, then switch.',
    ],
    dose: { kind: 'hold', seconds: 30, sides: 2 },
    sources: [SRC.trx, SRC.hingeDesk],
    anim: {
      view: 'front',
      props: [CHAIR_FRONT],
      focus: ['thighR'],
      frames: [
        kf(
          [SIT_FRONT, { legR: { a: 76, b: 166, s: 0.55 }, armR: { ik: ['kneeR', -4, -6], bend: -1 }, armL: { ik: ['ankleR', 4, -6], bend: 1 } }],
          1,
          0.5,
        ),
        kf(
          [
            SIT_FRONT,
            { tlen: 0.8, neck: 0, legR: { a: 76, b: 166, s: 0.55 }, armR: { ik: ['kneeR', -4, -6], bend: -1 }, armL: { ik: ['ankleR', 4, -6], bend: 1 } },
          ],
          1.2,
          2,
        ),
      ],
    },
  },
  {
    id: 'chair-squats',
    name: 'Chair Squats',
    area: 'Legs',
    why: 'Fires up glutes and thighs, the muscles that switch off when you sit, and gets your blood pumping.',
    steps: [
      'Sit at the front of your chair, feet hip-width apart.',
      'Lean forward and stand up, driving through your heels.',
      'Slowly sit back down until you just tap the seat.',
    ],
    dose: { kind: 'reps', reps: 10 },
    sources: [SRC.froedtert, SRC.mayoHS],
    anim: {
      view: 'side',
      props: [CHAIR],
      focus: ['thighR'],
      frames: [
        kf(
          {
            x: 90,
            y: 161,
            torso: 10,
            legL: { ik: [118, FLOOR - 5], bend: 1 },
            legR: { ik: [120, FLOOR - 5], bend: 1 },
            armR: { a: 40, b: 30 },
            armL: { a: 40, b: 30 },
          },
          0.8,
          0.4,
        ),
        kf(
          {
            x: 104,
            y: 146,
            torso: 34,
            legL: { ik: [118, FLOOR - 5], bend: 1 },
            legR: { ik: [120, FLOOR - 5], bend: 1 },
            armR: { a: 80, b: 8 },
            armL: { a: 80, b: 8 },
          },
          0.6,
          0,
        ),
        kf(
          {
            x: 116,
            y: STAND_Y,
            torso: 2,
            legL: { ik: [118, FLOOR - 5], bend: 1 },
            legR: { ik: [120, FLOOR - 5], bend: 1 },
            armR: { a: 84, b: 4 },
            armL: { a: 84, b: 4 },
          },
          0.6,
          0.4,
        ),
        kf(
          {
            x: 104,
            y: 146,
            torso: 34,
            legL: { ik: [118, FLOOR - 5], bend: 1 },
            legR: { ik: [120, FLOOR - 5], bend: 1 },
            armR: { a: 80, b: 8 },
            armL: { a: 80, b: 8 },
          },
          0.7,
          0,
        ),
      ],
    },
  },
  {
    id: 'standing-quad-stretch',
    name: 'Standing Quad Stretch',
    area: 'Legs',
    why: 'Lengthens the front of the thighs, which stay shortened while you sit.',
    steps: [
      'Stand tall, holding a chair or desk for balance.',
      'Bend one knee and grab that ankle behind you.',
      'Keep your knees together and gently pull your heel toward your glute. Hold, then switch.',
    ],
    dose: { kind: 'hold', seconds: 30, sides: 2 },
    sources: [SRC.mayoHS],
    anim: {
      view: 'side',
      props: [HOLD_CHAIR],
      focus: ['thighR'],
      frames: [
        kf({ legR: { a: -6, b: 70 }, armR: { ik: ['ankleR', 0, 0], bend: 1 }, armL: { ik: [128, 108], bend: -1 } }, 1, 0.3),
        kf({ legR: { a: -4, b: 156, c: 30 }, armR: { ik: ['ankleR', 2, 2], bend: 1 }, armL: { ik: [128, 108], bend: -1 } }, 1.2, 2),
      ],
    },
  },
  {
    id: 'seated-hamstring-stretch',
    name: 'Seated Hamstring Stretch',
    area: 'Legs',
    why: 'Loosens tight hamstrings that tug on your pelvis and lower back.',
    steps: [
      'Scoot to the front edge of your chair.',
      'Straighten one leg in front, heel on the floor, toes up.',
      'Keep your back straight and hinge forward from your hips until you feel the back of the thigh. Switch.',
    ],
    dose: { kind: 'hold', seconds: 30, sides: 2 },
    sources: [SRC.westmoreland, SRC.mayo],
    anim: {
      view: 'side',
      props: [CHAIR],
      focus: ['thighR'],
      frames: [
        kf(
          [SIT, { x: 92, legR: { a: 60, b: 0, c: 25 }, legL: { a: 90, b: 90 }, armR: { ik: ['kneeR', -14, -8], bend: -1 }, armL: { ik: ['kneeL', -14, -8], bend: -1 } }],
          1,
          0.5,
        ),
        kf(
          [
            SIT,
            { x: 92, torso: 32, neck: -6, legR: { a: 60, b: 0, c: 25 }, legL: { a: 90, b: 90 }, armR: { ik: ['kneeR', 12, 2], bend: -1 }, armL: { ik: ['kneeL', 4, -6], bend: -1 } },
          ],
          1.2,
          2,
        ),
      ],
    },
  },
  {
    id: 'calf-raises',
    name: 'Calf Raises',
    area: 'Legs',
    why: 'Your calves pump blood back up from your legs, so this fights the sluggish circulation of sitting.',
    steps: [
      'Stand tall, holding a chair or desk for balance.',
      'Rise up onto the balls of your feet as high as you can.',
      'Lower slowly back down.',
    ],
    dose: { kind: 'reps', reps: 15 },
    sources: [SRC.benenden, SRC.mayoHS],
    anim: {
      view: 'side',
      props: [HOLD_CHAIR],
      focus: ['shinR'],
      frames: [
        kf({ armR: { ik: [127, 108], bend: -1 }, armL: { ik: [129, 108], bend: -1 } }, 0.8, 0.2),
        kf(
          {
            y: STAND_Y - 11,
            legL: { a: 0, b: 0, c: -47 },
            legR: { a: 0, b: 0, c: -47 },
            armR: { ik: [127, 108], bend: -1 },
            armL: { ik: [129, 108], bend: -1 },
          },
          0.8,
          0.5,
        ),
      ],
    },
  },
];
