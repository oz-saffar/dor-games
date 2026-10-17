/** Synthesized wooden "clack": a short noise tick plus a low sine knock. Fully guarded. */
export function createClackSfx() {
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
    clack(pitch = 1) {
      const ac = getCtx();
      if (!ac) return;
      try {
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        const t0 = ac.currentTime;

        const len = Math.floor(ac.sampleRate * 0.03);
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const noise = ac.createBufferSource();
        noise.buffer = buf;
        const ng = ac.createGain();
        ng.gain.setValueAtTime(0.22, t0);
        ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);
        noise.connect(ng);
        ng.connect(ac.destination);
        noise.start(t0);

        const osc = ac.createOscillator();
        const og = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260 * pitch, t0);
        osc.frequency.exponentialRampToValueAtTime(130 * pitch, t0 + 0.08);
        og.gain.setValueAtTime(0.0001, t0);
        og.gain.exponentialRampToValueAtTime(0.3, t0 + 0.004);
        og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
        osc.connect(og);
        og.connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + 0.14);
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
