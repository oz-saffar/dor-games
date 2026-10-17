/** Soft synthesized kitchen sounds: a clink for a placed item, a thunk for closing doors. */
export function createKitchenSfx() {
  let ctx = null;
  const getCtx = () => {
    if (ctx) return ctx;
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { ctx = new Ctx(); } catch { ctx = null; }
    return ctx;
  };

  const tone = (ac, { type, from, to, dur, peak, delay = 0 }) => {
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  };

  const run = (fn) => {
    const ac = getCtx();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      fn(ac);
    } catch { /* sound is garnish */ }
  };

  return {
    clink() {
      run((ac) => {
        const r = 0.94 + Math.random() * 0.14;
        tone(ac, { type: 'sine', from: 1180 * r, to: 1000 * r, dur: 0.16, peak: 0.16 });
        tone(ac, { type: 'triangle', from: 2360 * r, dur: 0.09, peak: 0.05, delay: 0.01 });
        tone(ac, { type: 'sine', from: 260, to: 150, dur: 0.07, peak: 0.12 });
      });
    },
    thunk() {
      run((ac) => {
        tone(ac, { type: 'sine', from: 150, to: 52, dur: 0.22, peak: 0.34 });
        tone(ac, { type: 'triangle', from: 320, to: 110, dur: 0.08, peak: 0.1 });
      });
    },
    close() {
      try { ctx?.close?.(); } catch { /* ignore */ }
      ctx = null;
    },
  };
}
