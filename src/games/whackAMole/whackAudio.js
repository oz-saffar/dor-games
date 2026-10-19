/** Cute synthesized boop + giggle. Fully guarded: no AudioContext = silence. */
export function createWhackSfx() {
  let ctx = null;
  const getCtx = () => {
    if (ctx) return ctx;
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { ctx = new Ctx(); } catch { ctx = null; }
    return ctx;
  };

  const tone = (ac, t, f0, f1, dur, vol, type = 'sine') => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  };

  const run = (fn) => {
    const ac = getCtx();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      fn(ac, ac.currentTime);
    } catch { /* sound is garnish */ }
  };

  return {
    boop() {
      run((ac, t) => {
        tone(ac, t, 260, 440, 0.12, 0.3);
        const base = 700 + Math.random() * 150;
        [0.1, 0.19, 0.28].forEach((d, i) => tone(ac, t + d, base + i * 60, base * 1.25, 0.07, 0.12, 'triangle'));
      });
    },
    squeak() {
      run((ac, t) => tone(ac, t, 900, 1300, 0.1, 0.12, 'triangle'));
    },
    close() {
      try { ctx?.close?.(); } catch { /* ignore */ }
      ctx = null;
    },
  };
}
