import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

export const TICKLES_PER_CELEBRATION = 10;
export const CELEBRATION_MS = 2500;
export const TICKLED_MS = 650;
export const BUNNY_WAVE_MS = 900;
export const FIRST_SPAWN_MS = 350;
export const TOP_RESERVE = 84;
export const BOTTOM_RESERVE = 24;

const LEVELS = {
  [GAME_DIFFICULTY.EASY]: { holes: 4, upMs: 2200, gapMs: 900, maxUp: 2, bunny: 0 },
  [GAME_DIFFICULTY.MEDIUM]: { holes: 6, upMs: 1600, gapMs: 700, maxUp: 3, bunny: 0.2 },
  [GAME_DIFFICULTY.HARD]: { holes: 9, upMs: 1100, gapMs: 550, maxUp: 4, bunny: 0.3 },
};

export const levelFor = (difficulty) => LEVELS[difficulty] || LEVELS[GAME_DIFFICULTY.EASY];

/** Grid shape: medium turns 2x3 into 3x2 when the screen is wide. */
export function gridFor(difficulty, isLandscape) {
  const { holes } = levelFor(difficulty);
  if (holes === 4) return { cols: 2, rows: 2 };
  if (holes === 6) return isLandscape ? { cols: 3, rows: 2 } : { cols: 2, rows: 3 };
  return { cols: 3, rows: 3 };
}

/** Square cell sized from BOTH viewport axes. */
export function cellSizeFor(width, height, cols, rows, isTablet) {
  const availW = width - 32;
  const availH = height - TOP_RESERVE - BOTTOM_RESERVE;
  const max = isTablet ? 300 : 220;
  return Math.max(70, Math.floor(Math.min(availW / cols, availH / rows, max)));
}
