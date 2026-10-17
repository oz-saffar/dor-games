/**
 * Tiny WebAudio voices for חצים. Everything is guarded: jsdom and some
 * locked-down webviews have no AudioContext, and a missing sound must never
 * break a tap.
 */
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0];

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

  const tone = (freq, { start = 0, dur = 0.22, type = 'sine', gain = 0.12 } = {}) => {
    const ac = getCtx();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const t0 = ac.currentTime + start;
      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = type;
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
    /** Soft two-note chime, climbing the pentatonic scale as the board empties. */
    chime() {
      const f = PENTATONIC[step % PENTATONIC.length];
      step += 1;
      tone(f, { dur: 0.28 });
      tone(f * 1.5, { start: 0.07, dur: 0.3, gain: 0.07 });
    },
    /** Low, friendly thud: "not that way". */
    bump() {
      tone(130, { dur: 0.18, type: 'triangle', gain: 0.16 });
    },
    close() {
      try { ctx?.close?.(); } catch { /* ignore */ }
      ctx = null;
    },
  };
}
