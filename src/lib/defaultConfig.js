/**
 * Default config - shared between App and ConfigScreen
 * Keeps localStorage key stable across app versions
 */
import { migrateSoundConfig, DEFAULT_WIN_PHRASES, DEFAULT_LOSE_PHRASES } from './soundPhrases';
import { ALL_GAMES, DEFAULT_VISIBLE_GAMES } from './gamesConfig';
import { DEFAULT_BACKGROUND_ID } from './backgrounds';
import { GAME_DIFFICULTY, normalizeGameDifficulty } from './gameDifficulties';
import {
  RUNNER_DASH_CHARACTER_DEFAULT,
  normalizeRunnerDashCharacter,
} from './runnerDashCharacter';

export const CONFIG_STORAGE_KEY = 'dor-games-config';
export const GAME_VISIBILITY_SCHEMA_VERSION = 13;

export const MONSTER_DRAG_CHOMP_PEOPLE_MIN = 3;
export const MONSTER_DRAG_CHOMP_PEOPLE_MAX = 15;

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
const AUTO_SHOW_GAME_IDS_V3 = ['puzzle-drag', 'runner-dash'];
const AUTO_SHOW_GAME_IDS_V4 = ['water-sort'];
const AUTO_SHOW_GAME_IDS_V5 = ['hide-seek'];
const AUTO_SHOW_GAME_IDS_V6 = ['monster-munch'];
const AUTO_SHOW_GAME_IDS_V7 = ['monster-drag-chomp'];
const AUTO_SHOW_GAME_IDS_V8 = ['boy-cried-wolf'];
const AUTO_SHOW_GAME_IDS_V11 = ['color-pop-hunt'];
const AUTO_SHOW_GAME_IDS_V12 = ['football'];
const AUTO_SHOW_GAME_IDS_V13 = ['football-drag'];

export const getDefaultConfig = () => ({
  /** 'light' | 'twilight' — maps to data-theme on <html> */
  themeMode: 'light',
  memoryPairs: 3,
  shadowMatchDifficulty: GAME_DIFFICULTY.EASY,
  rhythmTapDifficulty: GAME_DIFFICULTY.EASY,
  mazeRescueDifficulty: GAME_DIFFICULTY.EASY,
  waterSortDifficulty: GAME_DIFFICULTY.EASY,
  footballDifficulty: GAME_DIFFICULTY.EASY,
  footballDragDifficulty: GAME_DIFFICULTY.EASY,
  /** מרוץ 3D — ברירת מחדל 'קשה' כמו לפני הוספת רמות */
  runnerDashDifficulty: GAME_DIFFICULTY.HARD,
  runnerDashCharacter: RUNNER_DASH_CHARACTER_DEFAULT,
  /** מפלצת מעל החברים — כמה דמויות בשורת המגש */
  monsterDragChompPeopleCount: 8,
  musicEnabled: false,
  feedbackSoundsEnabled: true,
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

  if (visibilityVersion < 8) {
    const toAppend = AUTO_SHOW_GAME_IDS_V6.filter(
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

  if (visibilityVersion < 10) {
    const toAppend = AUTO_SHOW_GAME_IDS_V8.filter(
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

  if (visibilityVersion < 12) {
    const toAppend = AUTO_SHOW_GAME_IDS_V12.filter(
      (id) => validIds.has(id) && !visibleGames.includes(id)
    );
    visibleGames = [...visibleGames, ...toAppend];
  }

  if (visibilityVersion < 13) {
    const toAppend = AUTO_SHOW_GAME_IDS_V13.filter(
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
    footballDifficulty: normalizeGameDifficulty(
      migrated.footballDifficulty,
      defaults.footballDifficulty
    ),
    footballDragDifficulty: normalizeGameDifficulty(
      migrated.footballDragDifficulty,
      defaults.footballDragDifficulty
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
  };
}
