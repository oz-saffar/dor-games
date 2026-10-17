import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { PLAY_COLORS } from '../../lib/palette';

/** Tunables for חצים. Board generation reads `sizes`, `minLen`, `maxLen`, `bendy`. */
export const ARROW_DIFFICULTY = {
  [GAME_DIFFICULTY.EASY]: { sizes: [[4, 4]], minLen: 1, maxLen: 2, bendy: false },
  [GAME_DIFFICULTY.MEDIUM]: { sizes: [[5, 5]], minLen: 2, maxLen: 4, bendy: true },
  [GAME_DIFFICULTY.HARD]: { sizes: [[6, 6], [7, 7]], minLen: 3, maxLen: 6, bendy: true },
};

export const diffFor = (difficulty) =>
  ARROW_DIFFICULTY[difficulty] ?? ARROW_DIFFICULTY[GAME_DIFFICULTY.EASY];

/** Hues that stay tellable apart (no white: it vanishes on paper). */
export const ARROW_COLORS = [
  PLAY_COLORS.red,
  PLAY_COLORS.blue,
  PLAY_COLORS.green,
  PLAY_COLORS.orange,
  PLAY_COLORS.purple,
  PLAY_COLORS.teal,
  PLAY_COLORS.pink,
  PLAY_COLORS.yellow,
  PLAY_COLORS.brown,
];

export const HINT_DELAY_MS = 8000;
export const CELEBRATION_MS = 2500;
export const WIGGLE_MS = 420;
export const FLASH_MS = 700;
/** Time per cell travelled while an arrow slides out. */
export const SLIDE_MS_PER_CELL = 70;
export const SLIDE_BASE_MS = 150;

/** Biggest cell, px. Phones are limited by the viewport term, not this cap. */
const maxCell = (isTablet) => (isTablet ? 130 : 100);
/** Room kept clear at the top for the back button and score badge. */
export const TOP_RESERVE = 84;

/** Cell size from BOTH viewport axes so the whole board fits and stays centred. */
export function cellSizeFor(width, height, rows, cols, isTablet) {
  const availW = width - 32;
  const availH = height - TOP_RESERVE - 28;
  return Math.max(24, Math.floor(Math.min(availW / cols, availH / rows, maxCell(isTablet))));
}
