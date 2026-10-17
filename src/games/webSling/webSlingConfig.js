import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

/** Accent colour — Spidey red. */
export const ACCENT = 'var(--game-accent)';

/** Endless — there is no win state, the score just keeps climbing. */
export const COMBO_TARGET = 3;

/** On-screen height of each character, before the per-viewport scale. */
export const HERO_H = 150;
export const VILLAIN_H = 132;

/** Where the web leaves the hero, as a fraction of the sprite box (origin = feet centre). */
export const HERO_HAND = {
  spidey: { fx: 0.34, fy: -0.64 },
  'ghost-spider': { fx: 0.3, fy: -0.6 },
  spin: { fx: 0.36, fy: -0.62 },
};

/* ── Web-shot timing (ms) ────────────────────────────────────────────────── */
export const FIRE_MS = 170;    // web line travels out to the villain
export const WRAP_MS = 280;    // cocoon spins shut
export const HOLD_MS = 900;    // wrapped villain wobbles before dropping away
export const MISS_MS = 420;    // web splats on a wall and slides off
export const RETRACT_MS = 260; // hero pulls the line back in

/* ── Team Spidey ─────────────────────────────────────────────────────────── */
export const HEROES = [
  {
    id: 'spidey',
    name: 'ספיידי',
    emoji: '🕷️',
    suitA: '#e3132c',      // red panels
    suitB: '#b00d21',      // red shadow
    suitC: '#1f4fd8',      // blue panels
    suitD: '#1536a3',      // blue shadow
    web: '#7a0f1c',        // web-line tracery on the suit
    eye: '#ffffff',
    eyeRim: '#0b1020',
    webColor: '#fdfdff',
    glow: '#ff5a6a',
  },
  {
    id: 'ghost-spider',
    name: 'רוח־עכביש',
    emoji: '🕸️',
    suitA: '#f7f9ff',
    suitB: '#cfd8ec',
    suitC: '#141a2e',
    suitD: '#0a0e1c',
    web: '#93a2c4',
    eye: '#ffffff',
    eyeRim: '#0b1020',
    hood: '#ff5fa8',       // pink hood lining
    trim: '#22d3ee',       // teal accents
    webColor: '#eafbff',
    glow: '#ff7ab8',
  },
  {
    id: 'spin',
    name: 'ספין',
    emoji: '⚡',
    suitA: '#12131c',
    suitB: '#05060c',
    suitC: '#e3132c',
    suitD: '#a10c1e',
    web: '#e3132c',
    eye: '#ffffff',
    eyeRim: '#e3132c',
    webColor: '#fff0f2',
    glow: '#ff4d5f',
  },
];

export const HERO_BY_ID = Object.fromEntries(HEROES.map((h) => [h.id, h]));

/* ── The villains ────────────────────────────────────────────────────────── */
export const VILLAINS = {
  rhino: {
    id: 'rhino', name: 'רינו', behavior: 'pop',
    hit: 62, size: 1.05, popMul: 1.0, cheer: 'תפסת את רינו!',
  },
  ock: {
    id: 'ock', name: 'דוק אוק', behavior: 'pop',
    hit: 58, size: 1.0, popMul: 0.92, cheer: 'דוק אוק ברשת!',
  },
  goblin: {
    id: 'goblin', name: 'הגובלין הירוק', behavior: 'fly',
    hit: 60, size: 0.95, popMul: 1.0, cheer: 'הגובלין נתפס!',
  },
  zola: {
    id: 'zola', name: 'זולה', behavior: 'pop',
    hit: 70, size: 1.18, popMul: 1.25, cheer: 'זולה כבוי!',
  },
};

/** Which villains are in play at a given score — the roster grows as Dor wins. */
export function villainPool(score) {
  if (score < 4) return ['rhino', 'ock'];
  if (score < 9) return ['rhino', 'ock', 'goblin'];
  return ['rhino', 'ock', 'goblin', 'zola'];
}

/* ── Difficulty ──────────────────────────────────────────────────────────── */
export const DIFF = {
  [GAME_DIFFICULTY.EASY]: {
    spawnMs: [820, 1350], visibleMs: [2100, 3000], maxActive: 2,
    hitBonus: 30, flySpeed: [46, 66], riseMs: 420,
  },
  [GAME_DIFFICULTY.MEDIUM]: {
    spawnMs: [560, 950], visibleMs: [1350, 2000], maxActive: 3,
    hitBonus: 16, flySpeed: [78, 108], riseMs: 320,
  },
  [GAME_DIFFICULTY.HARD]: {
    spawnMs: [380, 700], visibleMs: [900, 1450], maxActive: 4,
    hitBonus: 6, flySpeed: [120, 165], riseMs: 240,
  },
};

/* ── Maths helpers ───────────────────────────────────────────────────────── */
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Deterministic pseudo-random so the skyline is stable across re-renders. */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Lays out the Manhattan skyline plus the rooftop ledges villains pop up from.
 * Buildings are generated once per size so the backdrop and the hit-slots agree.
 */
export function citySkyline(w, h, landscape) {
  const horizon = h * (landscape ? 0.52 : 0.58);
  const rnd = seeded(1337);

  const far = [];
  let x = -30;
  while (x < w + 30) {
    const bw = 34 + rnd() * 46;
    const bh = 40 + rnd() * (landscape ? 90 : 130);
    far.push({ x, w: bw, top: horizon - bh, h: bh, tone: 0 });
    x += bw + 4 + rnd() * 10;
  }

  const near = [];
  const slots = [];
  x = -40;
  // Widths track the viewport: fixed pixel widths gave a phone only three
  // roofs, so villains kept reappearing in the same handful of spots.
  const minW = Math.max(46, w * 0.115);
  const spanW = Math.max(34, w * 0.1);
  while (x < w + 40) {
    const bw = minW + rnd() * spanW;
    const bh = 90 + rnd() * (landscape ? 130 : 190);
    const top = horizon - bh + 46;
    const b = { x, w: bw, top, h: h - top, tone: 1, seed: Math.floor(rnd() * 9999) };
    near.push(b);

    // Perches villains pop up from. Wide roofs get two so the same handful of
    // spots doesn't repeat every round; narrow ones get a single centred perch.
    // Skip rather than clamp: clamping would collapse two perches on the same
    // edge building onto one x, quietly costing us a distinct spawn position.
    const addSlot = (cx, span) => {
      if (cx < 46 || cx > w - 46) return;
      slots.push({ x: cx, y: top, ledge: top, w: span });
    };
    if (bw > minW + spanW * 0.6) {
      addSlot(x + bw * 0.27, bw * 0.46);
      addSlot(x + bw * 0.73, bw * 0.46);
    } else {
      addSlot(x + bw / 2, bw);
    }
    x += bw + 6 + rnd() * 14;
  }

  const baseScale = clamp(Math.min(w, h) / 720, 0.52, 1.15);
  return { horizon, far, near, slots, w, h, baseScale, landscape };
}

