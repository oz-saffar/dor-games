/** Configurable avatar for מרוץ 3D — images in /public/assets/runner-dash/ */

function withBase(filename) {
  const b = import.meta.env.BASE_URL || '/';
  const prefix = b.endsWith('/') ? b : `${b}/`;
  return `${prefix}assets/runner-dash/${filename}`;
}

export const RUNNER_DASH_CHARACTER = {
  GHOST_SPIDER: 'ghost-spider',
  SPIDEY: 'spidey',
  SPIN: 'spin',
};

export const RUNNER_DASH_CHARACTER_DEFAULT = RUNNER_DASH_CHARACTER.SPIDEY;

const VALID = new Set(Object.values(RUNNER_DASH_CHARACTER));

/** Older saved configs */
const LEGACY_RUNNER_CHARACTER = {
  runner: RUNNER_DASH_CHARACTER.GHOST_SPIDER,
  spiderman: RUNNER_DASH_CHARACTER.SPIDEY,
  'paw-patrol-chase': RUNNER_DASH_CHARACTER.SPIN,
  marshall: RUNNER_DASH_CHARACTER.SPIN,
  ryder: RUNNER_DASH_CHARACTER.GHOST_SPIDER,
};

const IMAGE_FILE = {
  [RUNNER_DASH_CHARACTER.GHOST_SPIDER]: 'ghost-spider.png',
  [RUNNER_DASH_CHARACTER.SPIDEY]: 'spidey.png',
  [RUNNER_DASH_CHARACTER.SPIN]: 'spin.png',
};

/** Hebrew labels for settings + in-game picker (order: left→right like team art) */
export const RUNNER_DASH_CHARACTER_OPTIONS = [
  { value: RUNNER_DASH_CHARACTER.GHOST_SPIDER, label: 'גוסט ספיידי' },
  { value: RUNNER_DASH_CHARACTER.SPIDEY, label: 'ספיידי' },
  { value: RUNNER_DASH_CHARACTER.SPIN, label: 'ספין' },
];

/** Short Hebrew names for img alt text */
export const RUNNER_DASH_CHARACTER_ALT_HE = {
  [RUNNER_DASH_CHARACTER.GHOST_SPIDER]: 'גוסט ספיידי',
  [RUNNER_DASH_CHARACTER.SPIDEY]: 'ספיידי',
  [RUNNER_DASH_CHARACTER.SPIN]: 'ספין',
};

export function normalizeRunnerDashCharacter(value) {
  if (VALID.has(value)) return value;
  if (LEGACY_RUNNER_CHARACTER[value]) return LEGACY_RUNNER_CHARACTER[value];
  return RUNNER_DASH_CHARACTER_DEFAULT;
}

export function getRunnerDashCharacterImageSrc(characterId) {
  const id = normalizeRunnerDashCharacter(characterId);
  const file = IMAGE_FILE[id] ?? IMAGE_FILE[RUNNER_DASH_CHARACTER_DEFAULT];
  return withBase(file);
}

export function getRunnerDashCharacterAltHe(characterId) {
  const id = normalizeRunnerDashCharacter(characterId);
  return (
    RUNNER_DASH_CHARACTER_ALT_HE[id] ?? RUNNER_DASH_CHARACTER_ALT_HE[RUNNER_DASH_CHARACTER.SPIDEY]
  );
}
