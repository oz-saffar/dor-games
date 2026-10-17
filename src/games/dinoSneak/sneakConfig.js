import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

export const ACCENT = 'var(--game-accent)';
export const CATCHES_FOR_CELEBRATION = 5;
export const KID_COUNT = 3;

/** how long a kid stays turned-around-then-shrugging after a successful freeze */
export const SHRUG_MS = 900;
/** how long the "caught you!" laughing beat lasts */
export const BUSTED_MS = 1700;

/**
 * `moveSpeed`  — percent of the track covered per 60fps frame while the finger is down
 * `warningMs`  — time between the "!" telegraph and the kid's head finishing its turn
 * `turnIntervalMs` — random [min, max] quiet stretch before the next telegraph
 * `penaltyPct` — track percent lost when caught moving
 *
 * EASY is deliberately over-generous: ~7.5s of holding crosses the whole track, the first
 * quiet stretch alone is over 5s, and being caught costs almost nothing — a 4-year-old
 * scores inside the first ten seconds even if they never let go.
 */
export const DIFF = {
  [GAME_DIFFICULTY.EASY]:   { warningMs: 1800, moveSpeed: 0.22, turnIntervalMs: [3000, 4600], penaltyPct: 8 },
  [GAME_DIFFICULTY.MEDIUM]: { warningMs: 1000, moveSpeed: 0.18, turnIntervalMs: [1800, 3200], penaltyPct: 20 },
  [GAME_DIFFICULTY.HARD]:   { warningMs: 650,  moveSpeed: 0.24, turnIntervalMs: [1200, 2400], penaltyPct: 30 },
};

export const STATUS = {
  calm:   { text: 'מתגנב… 🦶', bg: 'rgba(22,163,74,0.92)' },
  frozen: { text: 'קפוא! 🗿', bg: 'rgba(217,119,6,0.94)' },
  warn:   { text: 'עצור! ✋', bg: 'rgba(220,38,38,0.94)' },
  busted: { text: 'חחח! 😄', bg: 'rgba(190,24,93,0.94)' },
  chomp:  { text: 'תפסתי! 🦖', bg: 'rgba(202,138,4,0.95)' },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Lays the scene out from the real viewport so the dino always has a decent walk and its
 * snout lands exactly on the nearest kid at 100% progress, on any screen size.
 */
export function layout(vw, vh) {
  const picnicW = Math.round(clamp(vw * 0.38, 140, 250));
  const dinoW = Math.round(clamp(Math.min(vw * 0.34, vh * 0.34), 110, 200));
  const kidSize = clamp(picnicW / 300, 0.46, 0.8);
  // `space-around` puts the leftmost kid's centre one sixth into the picnic box
  const leadKidX = vw * 0.98 - picnicW + picnicW / 6;
  const start = ((dinoW * 0.25) / vw) * 100;
  const end = clamp(((leadKidX - 6 - 0.43 * dinoW) / vw) * 100, start + 18, 78);
  return { picnicW, dinoW, dinoSize: dinoW / 224, kidSize, start, end };
}
