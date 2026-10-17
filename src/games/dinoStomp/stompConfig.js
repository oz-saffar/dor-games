import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

/** Accent colour for this game (amber / canyon rock). */
export const ACCENT = 'var(--game-accent)';

export const CATCHES_FOR_CELEBRATION = 5;
export const COMBO_TARGET = 3;

/* ── Stomp timing (ms) ───────────────────────────────────────────────────── */
export const SLAM_MS = 120;   // telegraph → ground contact
export const IMPACT_MS = 250; // foot planted after a hit
export const PULL_MS = 340;   // yanking the foot back out of the ground
export const SQUISH_MS = 300; // kid flattened
export const BOUNCE_MS = 950; // kid springs away giggling

/* ── Difficulty ──────────────────────────────────────────────────────────── */
export const DIFF = {
  [GAME_DIFFICULTY.EASY]: {
    lanes: 3, kidSpeed: [55, 80], spawnMs: [900, 1500],
    hitPad: 46, telegraphMs: 170, stuckMs: 450, maxKids: 4,
  },
  [GAME_DIFFICULTY.MEDIUM]: {
    lanes: 4, kidSpeed: [95, 135], spawnMs: [650, 1100],
    hitPad: 32, telegraphMs: 200, stuckMs: 700, maxKids: 6,
  },
  [GAME_DIFFICULTY.HARD]: {
    lanes: 4, kidSpeed: [150, 210], spawnMs: [420, 800],
    hitPad: 22, telegraphMs: 230, stuckMs: 950, maxKids: 8,
  },
};

/* ── Kid looks ───────────────────────────────────────────────────────────── */
export const KID_VARIANTS = [
  {
    key: 'coral', shirtA: '#fda4af', shirtB: '#e11d48', sleeve: '#9f1239', stripe: '#fff1f2',
    pants: '#1e40af', pantsB: '#1e3a8a', shoe: '#0f172a', skin: '#fcd3a4', skinB: '#e0a874',
    hair: '#4a2c17', hairB: '#7c4a21', style: 'mop',
  },
  {
    key: 'teal', shirtA: '#5eead4', shirtB: '#0d9488', sleeve: '#115e59', stripe: '#ecfeff',
    pants: '#7c2d12', pantsB: '#9a3412', shoe: '#292524', skin: '#f3c08b', skinB: '#d19a5e',
    hair: '#1c1917', hairB: '#44403c', style: 'curls',
  },
  {
    key: 'amber', shirtA: '#fde68a', shirtB: '#d97706', sleeve: '#92400e', stripe: '#fffbeb',
    pants: '#14532d', pantsB: '#166534', shoe: '#1e293b', skin: '#e9b07c', skinB: '#c98d59',
    hair: '#78350f', hairB: '#a16207', style: 'ponytail',
  },
  {
    key: 'violet', shirtA: '#c4b5fd', shirtB: '#6d28d9', sleeve: '#4c1d95', stripe: '#f5f3ff',
    pants: '#0c4a6e', pantsB: '#075985', shoe: '#0f172a', skin: '#f7d3ae', skinB: '#dcae83',
    hair: '#3b0764', hairB: '#6b21a8', style: 'spiky',
  },
  {
    key: 'sky', shirtA: '#93c5fd', shirtB: '#0284c7', sleeve: '#075985', stripe: '#f0f9ff',
    pants: '#7f1d1d', pantsB: '#991b1b', shoe: '#111827', skin: '#f0c39a', skinB: '#cf9a68',
    hair: '#b45309', hairB: '#f59e0b', style: 'bob',
  },
  {
    key: 'lime', shirtA: '#bef264', shirtB: '#4d7c0f', sleeve: '#3f6212', stripe: '#f7fee7',
    pants: '#3730a3', pantsB: '#312e81', shoe: '#1f2937', skin: '#d9a06d', skinB: '#b47f4e',
    hair: '#171717', hairB: '#404040', style: 'buzz',
  },
];

/* ── Maths helpers ───────────────────────────────────────────────────────── */
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * Horizontal lanes on the canyon floor, stacked with a mild vertical perspective:
 * lane 0 is the furthest (higher up, smaller, hazier), the last lane is nearest.
 */
export function laneGeometry(lanes, w, h, landscape) {
  const top = h * (landscape ? 0.34 : 0.42);
  const bottom = h * (landscape ? 0.97 : 0.95);
  const span = bottom - top;
  const curve = (t) => top + span * Math.pow(t, 1.3);
  const baseScale = clamp(span / (lanes * 130), 0.4, 1.05);

  const bands = [];
  for (let i = 0; i < lanes; i += 1) {
    const t = (i + 0.5) / lanes;
    bands.push({
      i,
      t,
      y: curve(t),
      top: curve(i / lanes),
      bottom: curve((i + 1) / lanes),
      scale: baseScale * (0.62 + 0.38 * t),
      haze: 0.34 * (1 - t),
    });
  }
  return { top, bottom, w, h, baseScale, lanes, bands };
}

/** Map a pointer y (container-relative px) onto a lane index. */
export function laneAt(geom, y) {
  const { bands } = geom;
  for (let i = 0; i < bands.length; i += 1) {
    if (y <= bands[i].bottom) return i;
  }
  return bands.length - 1;
}
