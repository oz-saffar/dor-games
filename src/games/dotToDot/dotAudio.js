/** Hebrew feminine counting words, 1..15. */
export const HEBREW_COUNT = [
  'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר',
  'אחת עשרה', 'שתים עשרה', 'שלוש עשרה', 'ארבע עשרה', 'חמש עשרה',
];

/** Major pentatonic steps above the base note: each dot sounds one step higher. */
const STEPS = [0, 2, 4, 7, 9];
const BASE_HZ = 196;
export const noteHz = (index) => {
  const semis = STEPS[index % STEPS.length] + 12 * Math.floor(index / STEPS.length);
  return BASE_HZ * 2 ** (semis / 12);
};

/** Rising note + spoken Hebrew number. Everything is guarded: sound is garnish. */
export function createDotSfx() {
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
    note(index) {
      const ac = getCtx();
      if (!ac) return;
      try {
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        const t0 = ac.currentTime;
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteHz(index), t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
        osc.connect(g);
        g.connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + 0.5);
      } catch {
        /* ignore */
      }
    },
    speak(n) {
      try {
        const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
        const Utter = typeof window !== 'undefined' ? window.SpeechSynthesisUtterance : null;
        const word = HEBREW_COUNT[n - 1];
        if (!synth || !Utter || !word) return;
        synth.cancel?.();
        const u = new Utter(word);
        u.lang = 'he-IL';
        u.rate = 0.85;
        synth.speak(u);
      } catch {
        /* ignore */
      }
    },
    close() {
      try { window.speechSynthesis?.cancel?.(); } catch { /* ignore */ }
      try { ctx?.close?.(); } catch { /* ignore */ }
      ctx = null;
    },
  };
}
