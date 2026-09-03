/* Routine data. Durations are seconds. `rest` is the pause that
   follows the move; the last entry's rest is ignored. */
window.WORKOUTS = [
  {
    id: 'reset',
    name: 'Quick Reset',
    blurb: 'Neck, shoulders, wrists — the meeting-to-meeting fix.',
    moves: [
      { name: 'Neck rolls',        text: 'Chin to chest, roll slowly ear to ear. Never roll backwards.', work: 30, rest: 5 },
      { name: 'Shoulder rolls',    text: 'Big, slow circles backwards. Let the arms hang heavy.',        work: 30, rest: 5 },
      { name: 'Wrist circles',     text: 'Fists loose, circle each way. Then spread the fingers wide.',  work: 30, rest: 5 },
      { name: 'Seated twist',      text: 'Sit tall, rotate to one side, hold, then the other.',          work: 40, rest: 5 },
      { name: 'Chest opener',      text: 'Hands behind the head, draw the elbows back and breathe in.',  work: 30, rest: 5 },
      { name: 'Upper-back stretch',text: 'Interlace fingers, push the hands forward, round the back.',   work: 30, rest: 0 }
    ]
  },
  {
    id: 'mobility',
    name: 'Desk Mobility',
    blurb: 'For hips and a lower back that have been sitting too long.',
    moves: [
      { name: 'Standing side bend', text: 'Reach one arm overhead, lean away. Keep the hips square.',     work: 40, rest: 8 },
      { name: 'Cat–cow at the desk',text: 'Hands on the desk edge. Arch, then round, with the breath.',   work: 40, rest: 8 },
      { name: 'Hip flexor lunge',   text: 'Step back into a shallow lunge, tuck the tailbone under.',     work: 45, rest: 10 },
      { name: 'Figure-four sit',    text: 'Ankle on the opposite knee, hinge forward from the hips.',     work: 45, rest: 10 },
      { name: 'Calf raises',        text: 'Rise onto the toes, pause at the top, lower slowly.',          work: 40, rest: 8 },
      { name: 'Hamstring reach',    text: 'One heel forward, hinge at the hips, chest tall.',             work: 45, rest: 8 },
      { name: 'Ankle circles',      text: 'Lift one foot, circle the ankle both directions. Swap.',       work: 30, rest: 8 },
      { name: 'Standing forward fold', text: 'Soft knees, hang, and let the head go heavy.',              work: 40, rest: 0 }
    ]
  },
  {
    id: 'energy',
    name: 'Energy Boost',
    blurb: 'Gets the blood moving. Quiet enough for an open-plan floor.',
    moves: [
      { name: 'Chair squats',     text: 'Stand, sit, but never fully land. Chest up, weight in the heels.', work: 40, rest: 15 },
      { name: 'Desk push-ups',    text: 'Hands on the desk edge, body in one line, elbows back not out.',   work: 40, rest: 15 },
      { name: 'Glute squeezes',   text: 'Standing tall, squeeze for three, release for one.',              work: 35, rest: 15 },
      { name: 'Calf raise pulses',text: 'Small, fast pulses at the top of the raise.',                     work: 35, rest: 15 },
      { name: 'Tricep desk dips', text: 'Hands behind you on a stable desk, dip to ninety degrees.',       work: 35, rest: 15 },
      { name: 'Wall sit',         text: 'Back flat to the wall, thighs parallel. Breathe, do not hold it.', work: 45, rest: 15 },
      { name: 'Standing march',   text: 'Drive the knees up, arms swinging. Keep it light on the floor.',  work: 45, rest: 0 }
    ]
  }
];
