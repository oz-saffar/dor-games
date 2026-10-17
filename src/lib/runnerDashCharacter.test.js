import { describe, it, expect } from 'vitest';
import {
  RUNNER_DASH_CHARACTER,
  RUNNER_DASH_CHARACTER_DEFAULT,
  normalizeRunnerDashCharacter,
  getRunnerDashCharacterImageSrc,
  getRunnerDashCharacterAltHe,
} from './runnerDashCharacter';

describe('runnerDashCharacter', () => {
  it('normalizes unknown values to default', () => {
    expect(normalizeRunnerDashCharacter(undefined)).toBe(RUNNER_DASH_CHARACTER_DEFAULT);
    expect(normalizeRunnerDashCharacter('')).toBe(RUNNER_DASH_CHARACTER_DEFAULT);
    expect(normalizeRunnerDashCharacter('x')).toBe(RUNNER_DASH_CHARACTER_DEFAULT);
  });

  it('preserves valid ids', () => {
    expect(normalizeRunnerDashCharacter(RUNNER_DASH_CHARACTER.GHOST_SPIDER)).toBe(
      RUNNER_DASH_CHARACTER.GHOST_SPIDER
    );
    expect(normalizeRunnerDashCharacter(RUNNER_DASH_CHARACTER.SPIDEY)).toBe(RUNNER_DASH_CHARACTER.SPIDEY);
    expect(normalizeRunnerDashCharacter(RUNNER_DASH_CHARACTER.SPIN)).toBe(RUNNER_DASH_CHARACTER.SPIN);
  });

  it('migrates legacy character ids', () => {
    expect(normalizeRunnerDashCharacter('runner')).toBe(RUNNER_DASH_CHARACTER.GHOST_SPIDER);
    expect(normalizeRunnerDashCharacter('spiderman')).toBe(RUNNER_DASH_CHARACTER.SPIDEY);
    expect(normalizeRunnerDashCharacter('paw-patrol-chase')).toBe(RUNNER_DASH_CHARACTER.SPIN);
    expect(normalizeRunnerDashCharacter('marshall')).toBe(RUNNER_DASH_CHARACTER.SPIN);
    expect(normalizeRunnerDashCharacter('ryder')).toBe(RUNNER_DASH_CHARACTER.GHOST_SPIDER);
  });

  it('returns image URL per character', () => {
    expect(getRunnerDashCharacterImageSrc(RUNNER_DASH_CHARACTER.GHOST_SPIDER)).toMatch(
      /ghost-spider\.png$/
    );
    expect(getRunnerDashCharacterImageSrc(RUNNER_DASH_CHARACTER.SPIDEY)).toMatch(/spidey\.png$/);
    expect(getRunnerDashCharacterImageSrc(RUNNER_DASH_CHARACTER.SPIN)).toMatch(/spin\.png$/);
  });

  it('returns Hebrew alt text', () => {
    expect(getRunnerDashCharacterAltHe(RUNNER_DASH_CHARACTER.GHOST_SPIDER)).toBe('גוסט ספיידי');
    expect(getRunnerDashCharacterAltHe(RUNNER_DASH_CHARACTER.SPIDEY)).toBe('ספיידי');
    expect(getRunnerDashCharacterAltHe(RUNNER_DASH_CHARACTER.SPIN)).toBe('ספין');
  });
});
