/**
 * Default win/lose phrases and migration helpers
 */

export const DEFAULT_WIN_PHRASES = [
  { id: 'w1', text: 'כל הכבוד', audioKey: 'correct' },
  { id: 'w2', text: 'יש!', audioKey: 'winYish' },
  { id: 'w3', text: 'דור האלוף!', audioKey: 'winDorHaaluf' },
  { id: 'w4', text: 'דור התותח!', audioKey: 'winDorHatoch' },
  { id: 'w5', text: 'דור כל הכבוד!', audioKey: 'winDorKolHakavod' },
];

export const DEFAULT_LOSE_PHRASES = [
  { id: 'l1', text: 'תמשיך לנסות', audioKey: 'encTamshich' },
  { id: 'l2', text: 'תנסה שוב', audioKey: 'encTansaShuv' },
  { id: 'l4', text: 'בילבול', audioKey: 'encBilbul' },
];

/** Convert legacy enabledWinSounds/enabledLoseSounds to phrase format */
export function migrateSoundConfig(config) {
  const result = { ...config };
  if (config.enabledWinSounds && !config.winPhrases) {
    const keyToPhrase = Object.fromEntries(
      [...DEFAULT_WIN_PHRASES].map((p) => [p.audioKey, p])
    );
    result.winPhrases = config.enabledWinSounds
      .map((k) => keyToPhrase[k])
      .filter(Boolean);
    if (result.winPhrases.length === 0) result.winPhrases = DEFAULT_WIN_PHRASES;
  }
  if (config.enabledLoseSounds && !config.losePhrases) {
    const keyToPhrase = Object.fromEntries(
      [...DEFAULT_LOSE_PHRASES].map((p) => [p.audioKey, p])
    );
    result.losePhrases = config.enabledLoseSounds
      .map((k) => keyToPhrase[k])
      .filter(Boolean);
    if (result.losePhrases.length === 0) result.losePhrases = DEFAULT_LOSE_PHRASES;
  }
  return result;
}

export function createPhraseId() {
  return 'p' + Date.now() + Math.random().toString(36).slice(2, 6);
}
