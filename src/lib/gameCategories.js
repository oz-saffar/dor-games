/** Home-screen categories. The emoji is the signifier; the label is secondary. */
export const GAME_CATEGORIES = [
  { id: 'numbers-letters', emoji: '🔢', label: 'מספרים ואותיות' },
  { id: 'colors-shapes', emoji: '🎨', label: 'צבעים וצורות' },
  { id: 'puzzles', emoji: '🧩', label: 'חידות' },
  { id: 'action', emoji: '⚡', label: 'אקשן' },
  { id: 'pretend', emoji: '🧸', label: 'משחקי דמיון' },
];

export const ALL_TAB = { id: 'all', emoji: '🏠', label: 'הכל' };
export const DEFAULT_CATEGORY_ID = 'pretend';

export const GAME_CATEGORY_BY_ID = {
  numbers: 'numbers-letters',
  'count-with-me': 'numbers-letters',
  'number-trace': 'numbers-letters',
  'dot-to-dot': 'numbers-letters',
  colors: 'colors-shapes',
  shapes: 'colors-shapes',
  'water-sort': 'colors-shapes',
  'color-pop-hunt': 'colors-shapes',
  'shadow-match': 'colors-shapes',
  'color-book': 'colors-shapes',
  memory: 'puzzles',
  'what-doesnt-belong': 'puzzles',
  'maze-rescue': 'puzzles',
  'hide-seek': 'puzzles',
  'photo-puzzle': 'puzzles',
  'arrow-escape': 'puzzles',
  'spot-difference': 'puzzles',
  'four-in-row': 'puzzles',
  'animal-merge': 'puzzles',
  'tic-tac-toe': 'puzzles',
  bubbles: 'action',
  'rhythm-tap': 'action',
  'runner-dash': 'action',
  'dino-sneak': 'action',
  'dino-stomp': 'action',
  'web-sling': 'action',
  'snake-garden': 'action',
  'pop-it': 'action',
  xylophone: 'action',
  'whack-a-mole': 'action',
  'dino-ar': 'action',
  'dino-hunt': 'action',
  animals: 'pretend',
  'monster-drag-chomp': 'pretend',
  'room-tidy': 'pretend',
  'kitchen-sort': 'pretend',
};

/** Unknown ids land in the default category so nothing disappears. */
export const categoryOfGame = (id) => GAME_CATEGORY_BY_ID[id] ?? DEFAULT_CATEGORY_ID;
