import { BAR_FREQS } from './songs';

/** Mallet-struck bar: sine + short higher partial, fast attack, ~1.2s decay. Fully guarded. */
export function createXyloSynth() {
  let ctx = null;
  const getCtx = () => {
    if (ctx) return ctx;
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { ctx = new Ctx(); } catch { ctx = null; }
    return ctx;
  };

  const partial = (ac, type, freq, peak, dur, t0) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  };

  return {
    /** Resume on first gesture. */
    unlock() {
      const ac = getCtx();
      try { if (ac && ac.state === 'suspended') ac.resume()?.catch?.(() => {}); } catch { /* ignore */ }
    },
    play(index) {
      const ac = getCtx();
      const f = BAR_FREQS[index];
      if (!ac || !f) return;
      try {
        if (ac.state === 'suspended') ac.resume()?.catch?.(() => {});
        const t0 = ac.currentTime;
        partial(ac, 'sine', f, 0.38, 1.2, t0);
        partial(ac, 'sine', f * 3.9, 0.12, 0.25, t0);
      } catch { /* sound is garnish */ }
    },
    close() {
      try { ctx?.close?.(); } catch { /* ignore */ }
      ctx = null;
    },
  };
}
