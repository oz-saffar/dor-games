/** Soft WebAudio "stamp": a low rounded thump plus a brief papery tick. Fully guarded. */
export function createStampSfx() {
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
    stamp(pitch = 1) {
      const ac = getCtx();
      if (!ac) return;
      try {
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        const t0 = ac.currentTime;
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(190 * pitch, t0);
        osc.frequency.exponentialRampToValueAtTime(80 * pitch, t0 + 0.14);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.32, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
        osc.connect(g);
        g.connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + 0.2);

        const len = Math.floor(ac.sampleRate * 0.02);
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const noise = ac.createBufferSource();
        noise.buffer = buf;
        const ng = ac.createGain();
        ng.gain.setValueAtTime(0.1, t0);
        ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
        noise.connect(ng);
        ng.connect(ac.destination);
        noise.start(t0);
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
