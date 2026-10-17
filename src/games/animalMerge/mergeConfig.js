import { ACCENTS, PLAY_COLORS } from '../../lib/palette';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

export const CELEBRATION_MS = 2500;
export const TOP_RESERVE = 84;
export const GOAL_RESERVE = 78;
export const BOTTOM_RESERVE = 24;
export const TAP_SLOP = 10;

/** The evolution ladder, smallest to biggest. */
export const LADDER = [
  { emoji: '🐣', name: 'אפרוח בביצה', color: ACCENTS.ochre },
  { emoji: '🐥', name: 'אפרוח', color: PLAY_COLORS.yellow },
  { emoji: '🐔', name: 'תרנגולת', color: PLAY_COLORS.orange },
  { emoji: '🐑', name: 'כבשה', color: ACCENTS.sky },
  { emoji: '🐷', name: 'חזרזיר', color: PLAY_COLORS.pink },
  { emoji: '🐴', name: 'סוס', color: PLAY_COLORS.brown },
  { emoji: '🐘', name: 'פיל', color: ACCENTS.plum },
  { emoji: '🐳', name: 'לוויתן', color: PLAY_COLORS.teal },
];
export const TOP_TIER = LADDER.length - 1;

const LEVELS = {
  [GAME_DIFFICULTY.EASY]: { rows: 3, cols: 3, goal: 3, start: 4 },
  [GAME_DIFFICULTY.MEDIUM]: { rows: 4, cols: 3, goal: 4, start: 5 },
  [GAME_DIFFICULTY.HARD]: { rows: 4, cols: 4, goal: 5, start: 6 },
};

export function levelFor(difficulty) {
  return LEVELS[difficulty] || LEVELS[GAME_DIFFICULTY.EASY];
}

/** Cell size so the board fits both width and height beside the chrome and goal card. */
export function cellSizeFor(width, height, rows, cols, isTablet) {
  const availW = width - 32;
  const availH = height - TOP_RESERVE - GOAL_RESERVE - BOTTOM_RESERVE;
  const fit = Math.min(availW / cols, availH / rows);
  return Math.max(48, Math.floor(Math.min(fit, isTablet ? 160 : 130)));
}
