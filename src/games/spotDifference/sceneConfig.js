import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { PLAY_COLORS } from '../../lib/palette';

/** The picture is a 100 x 80 canvas, whatever size it is drawn at. */
export const SCENE_W = 100;
export const SCENE_H = 80;
export const SCENE_ASPECT = SCENE_W / SCENE_H;

/** Five hues that are never confusable with each other (a colour change swaps between them). */
export const COLOR_SET = [
  PLAY_COLORS.red,
  PLAY_COLORS.yellow,
  PLAY_COLORS.green,
  PLAY_COLORS.blue,
  PLAY_COLORS.purple,
];

/**
 * Per-kind facts the generator needs.
 *  zone       sky objects sit in the top band, ground objects below it; swaps stay in-zone
 *  tintable   has a main body colour a colour-change difference can alter
 *  asymmetric looks different when mirrored, so a flip difference is visible
 *  dup        may appear twice in one scene
 *  fixed      colour for objects that are not tintable
 */
export const KINDS = {
  sun: { zone: 'sky', fixed: PLAY_COLORS.yellow },
  cloud: { zone: 'sky', dup: true, fixed: PLAY_COLORS.white },
  balloon: { zone: 'sky', tintable: true },
  tree: { zone: 'ground', dup: true, fixed: PLAY_COLORS.green },
  flower: { zone: 'ground', tintable: true, dup: true },
  house: { zone: 'ground', tintable: true, asymmetric: true },
  ball: { zone: 'ground', tintable: true },
  cat: { zone: 'ground', asymmetric: true, fixed: PLAY_COLORS.orange },
  fish: { zone: 'ground', tintable: true, asymmetric: true },
  boat: { zone: 'ground', tintable: true, asymmetric: true },
  car: { zone: 'ground', tintable: true, asymmetric: true },
  star: { zone: 'ground', tintable: true, dup: true },
  umbrella: { zone: 'ground', tintable: true },
};

export const THEMES = {
  garden: ['sun', 'cloud', 'balloon', 'tree', 'flower', 'house', 'ball', 'cat'],
  beach: ['sun', 'cloud', 'balloon', 'boat', 'fish', 'ball', 'umbrella', 'star', 'cat'],
  room: ['sun', 'cloud', 'balloon', 'ball', 'cat', 'car', 'flower', 'star', 'house'],
  farm: ['sun', 'cloud', 'balloon', 'tree', 'house', 'cat', 'flower', 'ball', 'car'],
};
export const THEME_IDS = Object.keys(THEMES);

/** Placement bands (canvas units) */
export const SKY_MAX_Y = 30;
export const GROUND_TOP = 26;
export const EDGE = 2;
/** Gap kept between two objects' circles */
export const GAP = 1.5;

/** Differences per difficulty: how many, how much bigger a 'bigger' object grows, which kinds. */
export const DIFFICULTY = {
  [GAME_DIFFICULTY.EASY]: {
    count: 3, grow: 1.5, kinds: ['missing', 'color', 'swap', 'bigger'],
  },
  [GAME_DIFFICULTY.MEDIUM]: {
    count: 4, grow: 1.4, kinds: ['missing', 'color', 'swap', 'flip', 'bigger'],
  },
  [GAME_DIFFICULTY.HARD]: {
    count: 5, grow: 1.3, kinds: ['missing', 'color', 'swap', 'flip', 'bigger'],
  },
};
export const diffConfigFor = (difficulty) =>
  DIFFICULTY[difficulty] ?? DIFFICULTY[GAME_DIFFICULTY.EASY];

export const HINT_DELAY_MS = 10000;
export const CELEBRATION_MS = 2500;
/** Minimum on-screen touch radius for a difference, px */
export const MIN_HIT_PX = 44;
/** Room kept clear at the top for the back button and score badge. */
export const TOP_RESERVE = 84;
export const BOTTOM_RESERVE = 20;
export const PICTURE_GAP = 12;

/** Biggest picture width, px. Phones are limited by the viewport terms, not this cap. */
const maxPicture = (isTablet) => (isTablet ? 760 : 560);

/** Size of one picture so BOTH fit fully: stacked in portrait, side by side in landscape. */
export function pictureSizeFor(width, height, isLandscape, isTablet) {
  const availH = height - TOP_RESERVE - BOTTOM_RESERVE;
  let w;
  if (isLandscape) {
    const availW = (width - 32 - PICTURE_GAP) / 2;
    w = Math.min(availW, availH * SCENE_ASPECT);
  } else {
    const availW = width - 24;
    w = Math.min(availW, ((availH - PICTURE_GAP) / 2) * SCENE_ASPECT);
  }
  w = Math.max(120, Math.floor(Math.min(w, maxPicture(isTablet))));
  return { w, h: Math.round(w / SCENE_ASPECT) };
}

/** Hint pulse, as a style block (CSS so it needs no JS frame loop). */
export const PICTURE_KEYFRAMES = `
@keyframes sd-pulse { 0%,100% { transform: scale(0.92); opacity: .35 } 50% { transform: scale(1.12); opacity: 1 } }
.sd-pulse { transform-box: fill-box; transform-origin: center; animation: sd-pulse 1.1s ease-in-out infinite }
@media (prefers-reduced-motion: reduce) { .sd-pulse { animation: none; opacity: .8 } }
`;
