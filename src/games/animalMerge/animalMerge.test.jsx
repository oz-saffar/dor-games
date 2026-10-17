import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

import AnimalMergeGame from './AnimalMergeGame';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

const makeSound = () => ({
  playWin: vi.fn(), playCorrect: vi.fn(), playEncouragement: vi.fn(),
  startBgMusic: vi.fn(), stopBgMusic: vi.fn(),
});

beforeEach(() => {
  window.innerWidth = 414;
  window.innerHeight = 896;
  window.matchMedia = (q) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  });
});
afterEach(() => cleanup());

const tiles = () => [...document.querySelectorAll('[data-tile]')];
const filled = () => tiles().filter((el) => el.dataset.tier !== 'empty');
const tap = async (el) => {
  await act(async () => { fireEvent.pointerDown(el); });
  await act(async () => { fireEvent.pointerUp(el); });
};
const findPair = () => {
  const list = filled();
  let best = null;
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      if (list[i].dataset.tier === list[j].dataset.tier
        && (!best || Number(list[i].dataset.tier) < Number(best[0].dataset.tier))) best = [list[i], list[j]];
    }
  }
  return best;
};

const start = async (difficulty = GAME_DIFFICULTY.EASY) => {
  const soundManager = makeSound();
  render(<AnimalMergeGame onExit={() => {}} soundManager={soundManager} difficulty={difficulty} />);
  await act(async () => { screen.getByRole('button', { name: 'בואו נתחיל' }).click(); });
  return soundManager;
};

describe('מיזוג חיות', () => {
  it('mounts with a goal and a playable board', async () => {
    await start();
    expect(document.querySelector('[data-goal-tier]').dataset.goalTier).toBe('3');
    expect(tiles()).toHaveLength(9);
    expect(filled().every((el) => el.hasAttribute('data-tap-target'))).toBe(true);
    expect(findPair()).not.toBeNull();
  });

  it('tap then tap merges two matching animals', async () => {
    await start();
    const [a, b] = findPair();
    const tier = Number(a.dataset.tier);
    const bId = b.dataset.tile;
    const aId = a.dataset.tile;
    await tap(a);
    await tap(b);
    const after = (id) => document.querySelector(`[data-tile="${id}"]`);
    expect(after(bId).dataset.tier).toBe(String(tier + 1));
    expect(after(aId)).not.toBeNull();
    expect(filled().length).toBe(4);
  });

  it('playing greedily reaches the goal, celebrates and calls playWin', async () => {
    const soundManager = await start();
    for (let i = 0; i < 200 && !soundManager.playWin.mock.calls.length; i += 1) {
      const pair = findPair();
      expect(pair).not.toBeNull();
      await tap(pair[0]);
      await tap(pair[1]);
    }
    expect(soundManager.playWin).toHaveBeenCalledTimes(1);
    expect(soundManager.playCorrect).toHaveBeenCalled();
    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), { timeout: 5000 });
    expect(findPair()).not.toBeNull();
  }, 20000);
});
