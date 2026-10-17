/**
 * Tiny WebAudio chime for מצא את ההבדלים. Guarded: jsdom and some locked-down
 * webviews have no AudioContext, and a missing sound must never break a tap.
 */
const NOTES = [523.25, 659.25, 783.99, 987.77, 1046.5];

export function createSfx() {
  let ctx = null;

  const getCtx = () => {
    if (ctx) return ctx;
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      ctx = new Ctx();
    } catch {
      ctx = null;
    }
    return ctx;
  };

  const tone = (freq, { start = 0, dur = 0.3, gain = 0.12 } = {}) => {
    const ac = getCtx();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const t0 = ac.currentTime + start;
      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(amp);
      amp.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    } catch {
      /* sound is garnish */
    }
  };

  let step = 0;
  return {
    /** Bright two-note chime that climbs a little with every difference found. */
    chime() {
      const f = NOTES[step % NOTES.length];
      step += 1;
      tone(f);
      tone(f * 1.5, { start: 0.08, dur: 0.35, gain: 0.07 });
    },
    close() {
      try { ctx?.close?.(); } catch { /* ignore */ }
      ctx = null;
    },
  };
}
