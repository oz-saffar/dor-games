/**
 * Default config - shared between App and ConfigScreen
 * Keeps localStorage key stable across app versions
 */
import { migrateSoundConfig, DEFAULT_WIN_PHRASES, DEFAULT_LOSE_PHRASES } from './soundPhrases';
import { ALL_GAMES, DEFAULT_HIDDEN_GAMES, DEFAULT_VISIBLE_GAMES } from './gamesConfig';
import { DEFAULT_BACKGROUND_ID } from './backgrounds';
import { GAME_DIFFICULTY, normalizeGameDifficulty } from './gameDifficulties';
import {
  RUNNER_DASH_CHARACTER_DEFAULT,
  normalizeRunnerDashCharacter,
} from './runnerDashCharacter';

export const CONFIG_STORAGE_KEY = 'dor-games-config';
export const GAME_VISIBILITY_SCHEMA_VERSION = 32;

export const MONSTER_DRAG_CHOMP_PEOPLE_MIN = 3;
export const MONSTER_DRAG_CHOMP_PEOPLE_MAX = 15;

export const PHOTO_PUZZLE_PIECES_MIN = 4;
export const PHOTO_PUZZLE_PIECES_MAX = 24;

/** How many pieces פאזל תמונות slices the photo into */
export function normalizePhotoPuzzlePieces(value, fallback = 12) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(
    PHOTO_PUZZLE_PIECES_MIN,
    Math.min(PHOTO_PUZZLE_PIECES_MAX, Math.round(n))
  );
}

/** Integer headcount for מפלצת מעל החברים */
export function normalizeMonsterDragChompPeopleCount(value, fallback = 8) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(
    MONSTER_DRAG_CHOMP_PEOPLE_MIN,
    Math.min(MONSTER_DRAG_CHOMP_PEOPLE_MAX, Math.round(n))
  );
}
const AUTO_SHOW_GAME_IDS_V2 = ['shadow-match', 'rhythm-tap', 'maze-rescue'];
const AUTO_SHOW_GAME_IDS_V3 = ['runner-dash'];
const AUTO_SHOW_GAME_IDS_V4 = ['water-sort'];
const AUTO_SHOW_GAME_IDS_V5 = ['hide-seek'];
const AUTO_SHOW_GAME_IDS_V7 = ['monster-drag-chomp'];
const AUTO_SHOW_GAME_IDS_V11 = ['color-pop-hunt'];
const AUTO_SHOW_GAME_IDS_V15 = ['dino-ar'];
const AUTO_SHOW_GAME_IDS_V16 = ['number-trace'];
const AUTO_SHOW_GAME_IDS_V17 = ['dino-hunt'];
const AUTO_SHOW_GAME_IDS_V18 = ['dino-sneak', 'dino-stomp'];
const AUTO_SHOW_GAME_IDS_V19 = ['photo-puzzle'];
const AUTO_SHOW_GAME_IDS_V20 = ['web-sling'];
/** v21 retires the games Dor stopped playing — hidden, not deleted */
const AUTO_HIDE_GAME_IDS_V21 = DEFAULT_HIDDEN_GAMES;
const AUTO_SHOW_GAME_IDS_V22 = ['snake-garden'];
const AUTO_SHOW_GAME_IDS_V23 = ['room-tidy'];
const AUTO_SHOW_GAME_IDS_V24 = ['arrow-escape'];
const AUTO_SHOW_GAME_IDS_V25 = ['pop-it'];
const AUTO_SHOW_GAME_IDS_V26 = ['spot-difference'];
const AUTO_SHOW_GAME_IDS_V27 = ['animal-merge'];
const AUTO_SHOW_GAME_IDS_V28 = ['four-in-row'];
const AUTO_SHOW_GAME_IDS_V29 = ['kitchen-sort'];
const AUTO_SHOW_GAME_IDS_V30 = ['tic-tac-toe'];
const AUTO_SHOW_GAME_IDS_V31 = ['color-book'];
const AUTO_SHOW_GAME_IDS_V32 = ['xylophone'];

export const getDefaultConfig = () => ({
  /** 'light' | 'twilight' — maps to data-theme on <html> */
  themeMode: 'light',
  memoryPairs: 3,
  shadowMatchDifficulty: GAME_DIFFICULTY.EASY,
  rhythmTapDifficulty: GAME_DIFFICULTY.EASY,
  mazeRescueDifficulty: GAME_DIFFICULTY.EASY,
  waterSortDifficulty: GAME_DIFFICULTY.EASY,
  /** חבילת הדינוזאורים */
  dinoSneakDifficulty: GAME_DIFFICULTY.EASY,
  dinoStompDifficulty: GAME_DIFFICULTY.EASY,
  /** רשת! — צוות ספיידי נגד הנבלים */
  webSlingDifficulty: GAME_DIFFICULTY.EASY,
  /** הנחש הרעב */
  snakeGardenDifficulty: GAME_DIFFICULTY.EASY,
  /** מסדרים את הבית */
  roomTidyDifficulty: GAME_DIFFICULTY.EASY,
  arrowEscapeDifficulty: GAME_DIFFICULTY.EASY,
  popItDifficulty: GAME_DIFFICULTY.EASY,
  spotDifferenceDifficulty: GAME_DIFFICULTY.EASY,
  animalMergeDifficulty: GAME_DIFFICULTY.EASY,
  fourInRowDifficulty: GAME_DIFFICULTY.EASY,
  kitchenSortDifficulty: GAME_DIFFICULTY.EASY,
  ticTacToeDifficulty: GAME_DIFFICULTY.EASY,
  colorBookDifficulty: GAME_DIFFICULTY.EASY,
  xylophoneDifficulty: GAME_DIFFICULTY.EASY,
  /** מרוץ 3D — ברירת מחדל 'קשה' כמו לפני הוספת רמות */
  runnerDashDifficulty: GAME_DIFFICULTY.HARD,
  runnerDashCharacter: RUNNER_DASH_CHARACTER_DEFAULT,
  /** מפלצת מעל החברים — כמה דמויות בשורת המגש */
  monsterDragChompPeopleCount: 8,
  /** פאזל תמונות — לכמה חלקים לחתוך את התמונה */
  photoPuzzlePieces: 12,
  musicEnabled: false,
  feedbackSoundsEnabled: true,
  /** קולות עידוד אחרי טעות — כבוי כברירת מחדל */
  encouragementSoundsEnabled: false,
  winPhrases: DEFAULT_WIN_PHRASES,
  losePhrases: DEFAULT_LOSE_PHRASES,
  visibleGames: [...DEFAULT_VISIBLE_GAMES],
  visibilityVersion: GAME_VISIBILITY_SCHEMA_VERSION,
  backgroundId: DEFAULT_BACKGROUND_ID,
});

/**
 * Merge saved config with defaults; filters invalid game IDs
 */
export function mergeConfigWithDefaults(saved) {
  const defaults = getDefaultConfig();
  const migrated = migrateSoundConfig({ ...defaults, ...saved });
  const validIds = new Set(ALL_GAMES.map((g) => g.id));

  const savedVisible = migrated.visibleGames ?? defaults.visibleGames;
  const mergedIds = Array.isArray(savedVisible)
    ? savedVisible.filter((id) => validIds.has(id))
    : defaults.visibleGames;
  let visibleGames = mergedIds.length > 0 ? mergedIds : defaults.visibleGames;

  // One-time migration for users with older saved visibility state:
  // make newly-added games visible by default on first run after update.
  const visibilityVersion = Number(migrated.visibilityVersion ?? 1);
  if (visibilityVersion < 2) {
    const toAppend = AUTO_SHOW_GAME_IDS_V2.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 3) {
    const toAppend = AUTO_SHOW_GAME_IDS_V3.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 4) {
    const toAppend = AUTO_SHOW_GAME_IDS_V4.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 7) {
    const toAppend = AUTO_SHOW_GAME_IDS_V5.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 9) {
    const toAppend = AUTO_SHOW_GAME_IDS_V7.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 11) {
    const toAppend = AUTO_SHOW_GAME_IDS_V11.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 15) {
    const toAppend = AUTO_SHOW_GAME_IDS_V15.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 16) {
    const toAppend = AUTO_SHOW_GAME_IDS_V16.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 17) {
    const toAppend = AUTO_SHOW_GAME_IDS_V17.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 18) {
    const toAppend = AUTO_SHOW_GAME_IDS_V18.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 19) {
    const toAppend = AUTO_SHOW_GAME_IDS_V19.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 20) {
    const toAppend = AUTO_SHOW_GAME_IDS_V20.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  // v21 retires games Dor outgrew: hide them once, but leave later manual
  // re-enables alone (this block only runs for pre-v21 saved state).
  if (visibilityVersion < 21) {
    const toHide = new Set(AUTO_HIDE_GAME_IDS_V21);
    const kept = visibleGames.filter((id) => !toHide.has(id));
    visibleGames = kept.length > 0 ? kept : defaults.visibleGames;
  }

  if (visibilityVersion < 22) {
    const toAppend = AUTO_SHOW_GAME_IDS_V22.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 23) {
    const toAppend = AUTO_SHOW_GAME_IDS_V23.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 24) {
    const toAppend = AUTO_SHOW_GAME_IDS_V24.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 25) {
    const toAppend = AUTO_SHOW_GAME_IDS_V25.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 26) {
    const toAppend = AUTO_SHOW_GAME_IDS_V26.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 27) {
    const toAppend = AUTO_SHOW_GAME_IDS_V27.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 28) {
    const toAppend = AUTO_SHOW_GAME_IDS_V28.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 29) {
    const toAppend = AUTO_SHOW_GAME_IDS_V29.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 30) {
    const toAppend = AUTO_SHOW_GAME_IDS_V30.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 31) {
    const toAppend = AUTO_SHOW_GAME_IDS_V31.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 32) {
    const toAppend = AUTO_SHOW_GAME_IDS_V32.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  const themeMode = migrated.themeMode === 'twilight' ? 'twilight' : 'light';

  return {
    ...migrated,
    themeMode,
    visibleGames,
    visibilityVersion: GAME_VISIBILITY_SCHEMA_VERSION,
    shadowMatchDifficulty: normalizeGameDifficulty(
      migrated.shadowMatchDifficulty,
      defaults.shadowMatchDifficulty
    ),
    rhythmTapDifficulty: normalizeGameDifficulty(
      migrated.rhythmTapDifficulty,
      defaults.rhythmTapDifficulty
    ),
    mazeRescueDifficulty: normalizeGameDifficulty(
      migrated.mazeRescueDifficulty,
      defaults.mazeRescueDifficulty
    ),
    waterSortDifficulty: normalizeGameDifficulty(
      migrated.waterSortDifficulty,
      defaults.waterSortDifficulty
    ),
    dinoSneakDifficulty: normalizeGameDifficulty(
      migrated.dinoSneakDifficulty,
      defaults.dinoSneakDifficulty
    ),
    dinoStompDifficulty: normalizeGameDifficulty(
      migrated.dinoStompDifficulty,
      defaults.dinoStompDifficulty
    ),
    webSlingDifficulty: normalizeGameDifficulty(
      migrated.webSlingDifficulty,
      defaults.webSlingDifficulty
    ),
    snakeGardenDifficulty: normalizeGameDifficulty(
      migrated.snakeGardenDifficulty,
      defaults.snakeGardenDifficulty
    ),
    roomTidyDifficulty: normalizeGameDifficulty(
      migrated.roomTidyDifficulty,
      defaults.roomTidyDifficulty
    ),
    arrowEscapeDifficulty: normalizeGameDifficulty(
      migrated.arrowEscapeDifficulty,
      defaults.arrowEscapeDifficulty
    ),
    popItDifficulty: normalizeGameDifficulty(
      migrated.popItDifficulty,
      defaults.popItDifficulty
    ),
    spotDifferenceDifficulty: normalizeGameDifficulty(
      migrated.spotDifferenceDifficulty,
      defaults.spotDifferenceDifficulty
    ),
    animalMergeDifficulty: normalizeGameDifficulty(
      migrated.animalMergeDifficulty,
      defaults.animalMergeDifficulty
    ),
    fourInRowDifficulty: normalizeGameDifficulty(
      migrated.fourInRowDifficulty,
      defaults.fourInRowDifficulty
    ),
    kitchenSortDifficulty: normalizeGameDifficulty(
      migrated.kitchenSortDifficulty,
      defaults.kitchenSortDifficulty
    ),
    ticTacToeDifficulty: normalizeGameDifficulty(
      migrated.ticTacToeDifficulty,
      defaults.ticTacToeDifficulty
    ),
    colorBookDifficulty: normalizeGameDifficulty(
      migrated.colorBookDifficulty,
      defaults.colorBookDifficulty
    ),
    xylophoneDifficulty: normalizeGameDifficulty(
      migrated.xylophoneDifficulty,
      defaults.xylophoneDifficulty
    ),
    runnerDashDifficulty: normalizeGameDifficulty(
      migrated.runnerDashDifficulty,
      defaults.runnerDashDifficulty
    ),
    runnerDashCharacter: normalizeRunnerDashCharacter(
      migrated.runnerDashCharacter ?? defaults.runnerDashCharacter
    ),
    monsterDragChompPeopleCount: normalizeMonsterDragChompPeopleCount(
      migrated.monsterDragChompPeopleCount,
      defaults.monsterDragChompPeopleCount
    ),
    photoPuzzlePieces: normalizePhotoPuzzlePieces(
      migrated.photoPuzzlePieces,
      defaults.photoPuzzlePieces
    ),
  };
}
