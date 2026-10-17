import { describe, it, expect } from 'vitest';
import {
  migrateSoundConfig,
  createPhraseId,
  DEFAULT_WIN_PHRASES,
  DEFAULT_LOSE_PHRASES,
} from './soundPhrases';

describe('migrateSoundConfig', () => {
  it('converts enabledWinSounds to winPhrases', () => {
    const config = {
      enabledWinSounds: ['correct', 'winYish'],
      winPhrases: undefined,
    };
    const result = migrateSoundConfig(config);
    expect(result.winPhrases).toBeDefined();
    expect(Array.isArray(result.winPhrases)).toBe(true);
    expect(result.winPhrases.length).toBe(2);
  });

  it('converts enabledLoseSounds to losePhrases', () => {
    const config = {
      enabledLoseSounds: ['encTamshich', 'encTansaShuv'],
      losePhrases: undefined,
    };
    const result = migrateSoundConfig(config);
    expect(result.losePhrases).toBeDefined();
    expect(Array.isArray(result.losePhrases)).toBe(true);
  });

  it('uses DEFAULT_WIN_PHRASES when enabledWinSounds maps to empty', () => {
    const config = {
      enabledWinSounds: ['unknown-key'],
      winPhrases: undefined,
    };
    const result = migrateSoundConfig(config);
    expect(result.winPhrases).toEqual(DEFAULT_WIN_PHRASES);
  });

  it('leaves existing winPhrases unchanged', () => {
    const existing = [{ id: 'custom', text: 'Custom', audioKey: null }];
    const config = { winPhrases: existing };
    const result = migrateSoundConfig(config);
    expect(result.winPhrases).toBe(existing);
  });
});

describe('createPhraseId', () => {
  it('returns a string', () => {
    expect(typeof createPhraseId()).toBe('string');
  });

  it('returns unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(createPhraseId());
    }
    expect(ids.size).toBe(100);
  });

  it('returns id starting with p', () => {
    expect(createPhraseId().startsWith('p')).toBe(true);
  });
});
