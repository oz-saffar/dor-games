export const GAME_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  /** סיימון — רצף בלי סיום (אותה מהירות כמו קל) */
  ENDLESS: 'endless',
  /** מיון צבעים — שלבים מתקדמים */
  EXPERT: 'expert',
  MASTER: 'master',
};

export const GAME_DIFFICULTY_OPTIONS = [
  { value: GAME_DIFFICULTY.EASY, label: 'קל' },
  { value: GAME_DIFFICULTY.MEDIUM, label: 'בינוני' },
  { value: GAME_DIFFICULTY.HARD, label: 'קשה' },
];

/** סיימון — כולל מצב בלי הגבלת ניצחונות */
export const RHYTHM_TAP_DIFFICULTY_OPTIONS = [
  ...GAME_DIFFICULTY_OPTIONS,
  { value: GAME_DIFFICULTY.ENDLESS, label: 'בלי הגבלה' },
];

/** מיון צבעים — יותר צבעים ומבחנות */
export const WATER_SORT_DIFFICULTY_OPTIONS = [
  ...GAME_DIFFICULTY_OPTIONS,
  { value: GAME_DIFFICULTY.EXPERT, label: 'מומחה' },
  { value: GAME_DIFFICULTY.MASTER, label: 'אדיר' },
];

const VALID_VALUES = new Set([
  ...GAME_DIFFICULTY_OPTIONS.map((option) => option.value),
  GAME_DIFFICULTY.ENDLESS,
  GAME_DIFFICULTY.EXPERT,
  GAME_DIFFICULTY.MASTER,
]);

export const normalizeGameDifficulty = (value, fallback = GAME_DIFFICULTY.EASY) =>
  VALID_VALUES.has(value) ? value : fallback;
