// Short synthesized chimes for the timer; no audio files needed.

let ctx: AudioContext | null = null;

/** Must be called from a user gesture (iOS won't play audio otherwise). */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

const TONES = {
  go: [880],
  switch: [660, 660],
  finish: [660, 880, 1320],
} as const;

export function beep(kind: keyof typeof TONES) {
  if (!ctx) return;
  const now = ctx.currentTime;
  TONES[kind].forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = now + i * 0.16;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}
