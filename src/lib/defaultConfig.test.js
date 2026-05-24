import { describe, it, expect } from 'vitest';
import {
  getDefaultConfig,
  mergeConfigWithDefaults,
  normalizeMonsterDragChompPeopleCount,
} from './defaultConfig';
import { RUNNER_DASH_CHARACTER, RUNNER_DASH_CHARACTER_DEFAULT } from './runnerDashCharacter';

describe('getDefaultConfig', () => {
  it('returns expected structure with all keys', () => {
    const config = getDefaultConfig();
    expect(config).toHaveProperty('memoryPairs');
    expect(config).toHaveProperty('musicEnabled');
    expect(config).toHaveProperty('feedbackSoundsEnabled');
    expect(config).toHaveProperty('winPhrases');
    expect(config).toHaveProperty('losePhrases');
    expect(config).toHaveProperty('visibleGames');
    expect(config).toHaveProperty('backgroundId');
    expect(config).toHaveProperty('themeMode');
    expect(config.themeMode).toBe('light');
    expect(config.runnerDashCharacter).toBe(RUNNER_DASH_CHARACTER_DEFAULT);
    expect(config).toHaveProperty('monsterDragChompPeopleCount');
    expect(config.monsterDragChompPeopleCount).toBe(8);
  });

  it('returns memoryPairs as 3', () => {
    expect(getDefaultConfig().memoryPairs).toBe(3);
  });

  it('returns musicEnabled as false', () => {
    expect(getDefaultConfig().musicEnabled).toBe(false);
  });

  it('returns feedbackSoundsEnabled as true', () => {
    expect(getDefaultConfig().feedbackSoundsEnabled).toBe(true);
  });

  it('returns visibleGames as array', () => {
    const { visibleGames } = getDefaultConfig();
    expect(Array.isArray(visibleGames)).toBe(true);
    expect(visibleGames.length).toBeGreaterThan(0);
  });
});

describe('mergeConfigWithDefaults', () => {
  it('merges valid saved config with defaults', () => {
    const saved = { memoryPairs: 6, musicEnabled: true };
    const merged = mergeConfigWithDefaults(saved);
    expect(merged.memoryPairs).toBe(6);
    expect(merged.musicEnabled).toBe(true);
  });

  it('filters out invalid game IDs from visibleGames', () => {
    const saved = { visibleGames: ['bubbles', 'colors', 'invalid-game', 'memory'] };
    const merged = mergeConfigWithDefaults(saved);
    expect(merged.visibleGames).toContain('bubbles');
    expect(merged.visibleGames).toContain('colors');
    expect(merged.visibleGames).toContain('memory');
    expect(merged.visibleGames).not.toContain('invalid-game');
  });

  it('drops removed game ids such as tiny-kitchen', () => {
    const merged = mergeConfigWithDefaults({
      visibleGames: ['memory', 'tiny-kitchen', 'bubbles'],
    });
    expect(merged.visibleGames).toContain('memory');
    expect(merged.visibleGames).toContain('bubbles');
    expect(merged.visibleGames).not.toContain('tiny-kitchen');
  });

  it('uses defaults when visibleGames is empty after filtering', () => {
    const saved = { visibleGames: ['nonexistent1', 'nonexistent2'] };
    const merged = mergeConfigWithDefaults(saved);
    expect(merged.visibleGames.length).toBeGreaterThan(0);
    expect(merged.visibleGames).toEqual(expect.any(Array));
  });

  it('handles empty saved config', () => {
    const merged = mergeConfigWithDefaults({});
    expect(merged.memoryPairs).toBe(3);
    expect(merged.visibleGames).toBeDefined();
    expect(merged.monsterDragChompPeopleCount).toBe(8);
  });

  it('clamps monster drag chomp people count', () => {
    expect(mergeConfigWithDefaults({ monsterDragChompPeopleCount: 99 }).monsterDragChompPeopleCount).toBe(15);
    expect(mergeConfigWithDefaults({ monsterDragChompPeopleCount: 1 }).monsterDragChompPeopleCount).toBe(3);
    expect(normalizeMonsterDragChompPeopleCount('12', 8)).toBe(12);
    expect(normalizeMonsterDragChompPeopleCount(NaN, 8)).toBe(8);
  });

  it('normalizes invalid runnerDashCharacter to default', () => {
    const merged = mergeConfigWithDefaults({ runnerDashCharacter: 'not-a-character' });
    expect(merged.runnerDashCharacter).toBe(RUNNER_DASH_CHARACTER_DEFAULT);
  });

  it('migrates legacy runnerDashCharacter values', () => {
    expect(mergeConfigWithDefaults({ runnerDashCharacter: 'spiderman' }).runnerDashCharacter).toBe(
      RUNNER_DASH_CHARACTER.SPIDEY
    );
    expect(mergeConfigWithDefaults({ runnerDashCharacter: 'paw-patrol-chase' }).runnerDashCharacter).toBe(
      RUNNER_DASH_CHARACTER.SPIN
    );
    expect(mergeConfigWithDefaults({ runnerDashCharacter: 'marshall' }).runnerDashCharacter).toBe(
      RUNNER_DASH_CHARACTER.SPIN
    );
    expect(mergeConfigWithDefaults({ runnerDashCharacter: 'ryder' }).runnerDashCharacter).toBe(
      RUNNER_DASH_CHARACTER.GHOST_SPIDER
    );
  });
});
