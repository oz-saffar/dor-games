/** Synthesized pop: a short noise burst plus a falling sine. Fully guarded. */
export function createPopSfx() {
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
    pop() {
      const ac = getCtx();
      if (!ac) return;
      try {
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        const t0 = ac.currentTime;
        const rate = 0.85 + Math.random() * 0.4;

        const len = Math.floor(ac.sampleRate * 0.04);
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const noise = ac.createBufferSource();
        noise.buffer = buf;
        const ng = ac.createGain();
        ng.gain.setValueAtTime(0.18, t0);
        ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
        noise.connect(ng);
        ng.connect(ac.destination);
        noise.start(t0);

        const osc = ac.createOscillator();
        const og = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520 * rate, t0);
        osc.frequency.exponentialRampToValueAtTime(140 * rate, t0 + 0.09);
        og.gain.setValueAtTime(0.0001, t0);
        og.gain.exponentialRampToValueAtTime(0.28, t0 + 0.005);
        og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
        osc.connect(og);
        og.connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + 0.13);
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
