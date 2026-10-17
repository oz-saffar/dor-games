import { beforeEach, describe, expect, it } from 'vitest';
import {
  PROGRESS_KEY,
  STICKERS,
  STARS_PER_STICKER,
  emptyProgress,
  hasNewSticker,
  loadProgress,
  markStickersSeen,
  nextStickerProgress,
  parseProgress,
  pickDailySpotlight,
  recordPlayed,
  recordStar,
  stickersUnlocked,
  toggleFavourite,
  withRecent,
} from './progress';
import { categoryOfGame, DEFAULT_CATEGORY_ID } from './gameCategories';

beforeEach(() => window.localStorage.clear());

describe('parseProgress', () => {
  it('survives garbage', () => {
    expect(parseProgress('not json')).toEqual(emptyProgress());
    expect(parseProgress(null)).toEqual(emptyProgress());
    expect(parseProgress('{"stars":"x","recent":5}')).toEqual(emptyProgress());
  });
});

describe('recent', () => {
  it('keeps 4 distinct, most recent first', () => {
    ['a', 'b', 'c', 'd', 'e'].forEach(recordPlayed);
    recordPlayed('c');
    expect(loadProgress().recent).toEqual(['c', 'e', 'd', 'b']);
  });
  it('is pure', () => {
    const p = emptyProgress();
    withRecent(p, 'a');
    expect(p.recent).toEqual([]);
  });
});

describe('favourites', () => {
  it('toggles on and off and persists', () => {
    toggleFavourite('memory');
    expect(JSON.parse(window.localStorage.getItem(PROGRESS_KEY)).favourites).toEqual(['memory']);
    toggleFavourite('memory');
    expect(loadProgress().favourites).toEqual([]);
  });
});

describe('stars and stickers', () => {
  it('unlocks one sticker per N stars and never past the list', () => {
    expect(stickersUnlocked(STARS_PER_STICKER - 1)).toBe(0);
    expect(stickersUnlocked(STARS_PER_STICKER)).toBe(1);
    expect(stickersUnlocked(STARS_PER_STICKER * 2 + 1)).toBe(2);
    expect(stickersUnlocked(1e6)).toBe(STICKERS.length);
  });
  it('reports progress toward the next sticker', () => {
    expect(nextStickerProgress(7)).toEqual({ done: false, current: 2, total: 5 });
    expect(nextStickerProgress(1e6).done).toBe(true);
  });
  it('flags a new sticker until the book is opened', () => {
    for (let i = 0; i < STARS_PER_STICKER; i += 1) recordStar();
    expect(hasNewSticker(loadProgress())).toBe(true);
    markStickersSeen();
    expect(hasNewSticker(loadProgress())).toBe(false);
    expect(loadProgress().stars).toBe(STARS_PER_STICKER);
  });
});

describe('daily spotlight', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  it('is stable within a day and always a member', () => {
    const morning = new Date(2026, 5, 3, 7, 0);
    const night = new Date(2026, 5, 3, 22, 30);
    expect(pickDailySpotlight(ids, morning)).toBe(pickDailySpotlight(ids, night));
    expect(ids).toContain(pickDailySpotlight(ids, morning));
  });
  it('varies across days', () => {
    const picks = new Set();
    for (let d = 1; d <= 20; d += 1) picks.add(pickDailySpotlight(ids, new Date(2026, 5, d)));
    expect(picks.size).toBeGreaterThan(1);
  });
  it('handles an empty list', () => {
    expect(pickDailySpotlight([])).toBeNull();
  });
});

describe('categories', () => {
  it('sends unknown ids to the default', () => {
    expect(categoryOfGame('arrow-escape')).toBe('puzzles');
    expect(categoryOfGame('who-knows')).toBe(DEFAULT_CATEGORY_ID);
  });
});
