const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

/** Happy rising two-note chime; pitch climbs with the new tier. Fully guarded. */
export function createMergeSfx() {
  let ctx = null;
  const getCtx = () => {
    if (ctx) return ctx;
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { ctx = new Ctx(); } catch { ctx = null; }
    return ctx;
  };
  return {
    chime(tier = 1) {
      const ac = getCtx();
      if (!ac) return;
      try {
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        const base = SCALE[Math.max(0, Math.min(SCALE.length - 1, tier))];
        [base, base * 1.25].forEach((f, i) => {
          const t0 = ac.currentTime + i * 0.09;
          const osc = ac.createOscillator();
          const g = ac.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t0);
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
          osc.connect(g);
          g.connect(ac.destination);
          osc.start(t0);
          osc.stop(t0 + 0.32);
        });
      } catch {
        /* sound is garnish */
      }
    },
    close() {
      try { ctx?.close?.(); } catch { /* ignore */ }
      ctx = null;
    },
  };
}
