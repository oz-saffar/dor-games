import { PLAY_COLORS } from '../../lib/palette';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

export const CELEBRATION_MS = 2500;
export const FLIP_MS = 700;
export const TOP_RESERVE = 84;
export const BOTTOM_RESERVE = 28;

/** Rainbow bands, top to bottom. */
export const BAND_COLORS = [
  PLAY_COLORS.red, PLAY_COLORS.orange, PLAY_COLORS.yellow,
  PLAY_COLORS.green, PLAY_COLORS.blue, PLAY_COLORS.purple,
];

/** '#' = bubble, '.' = empty silicone */
const SHAPES = {
  [GAME_DIFFICULTY.EASY]: ['####', '####', '####', '####'],
  [GAME_DIFFICULTY.MEDIUM]: ['.#.#.', '#####', '#####', '.###.', '..#..'],
  [GAME_DIFFICULTY.HARD]: ['######', '######', '######', '######', '######', '######'],
};

export function shapeFor(difficulty) {
  return SHAPES[difficulty] || SHAPES[GAME_DIFFICULTY.EASY];
}

/** Bubble list with a rainbow colour per row. */
export function bubblesFor(difficulty) {
  const rows = shapeFor(difficulty);
  const out = [];
  rows.forEach((line, r) => {
    [...line].forEach((ch, c) => {
      if (ch === '#') {
        out.push({ id: `${r}-${c}`, r, c, color: BAND_COLORS[Math.floor((r * BAND_COLORS.length) / rows.length)] });
      }
    });
  });
  return out;
}

/** Cell size so the slab fits both width and height. */
export function cellSizeFor(width, height, rows, cols, isTablet) {
  const availW = width - 32;
  const availH = height - TOP_RESERVE - BOTTOM_RESERVE;
  const pad = 0.5; // slab margin in cells (total)
  const fit = Math.min(availW / (cols + pad), availH / (rows + pad));
  return Math.max(40, Math.floor(Math.min(fit, isTablet ? 150 : 110)));
}
