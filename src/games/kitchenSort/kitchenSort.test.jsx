import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

import KitchenSortGame from './KitchenSortGame';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { MODE, DIFF, generateRound, SHELF_COLORS, TYPES } from './kitchenSortConfig';

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

describe('kitchenSort round generation', () => {
  Object.values(GAME_DIFFICULTY).forEach((diff) => {
    if (!DIFF[diff]) return;
    [MODE.COLOR, MODE.TYPE].forEach((mode) => {
      it(`${diff}/${mode}: counts and one valid shelf per item`, () => {
        for (let n = 0; n < 20; n += 1) {
          const r = generateRound(diff, mode);
          expect(r.shelves).toHaveLength(DIFF[diff].shelves);
          expect(r.items).toHaveLength(DIFF[diff].items);
          expect(new Set(r.items.map((i) => i.id)).size).toBe(r.items.length);
          const ids = r.shelves.map((s) => s.id);
          expect(new Set(ids).size).toBe(ids.length);
          r.items.forEach((it) => {
            expect(ids.filter((id) => id === it.shelfId)).toHaveLength(1);
            if (mode === MODE.COLOR) expect(SHELF_COLORS).toContain(it.shelfId);
            else expect(TYPES[it.shelfId].kinds).toContain(it.kind);
          });
          ids.forEach((id) => {
            expect(r.items.filter((i) => i.shelfId === id)).toHaveLength(r.perShelf);
          });
        }
      });
    });
  });
});

const itemEls = () => [...document.querySelectorAll('[data-item]')];
const shelfEl = (id) => document.querySelector(`[data-shelf="${id}"]`);
const placed = () => itemEls().filter((el) => el.dataset.placed === 'true').length;

const tap = async (el) => {
  await act(async () => {
    fireEvent.pointerDown(el);
    fireEvent.pointerUp(el);
  });
};

describe('מסדרים מטבח', () => {
  it('tap-item-then-tap-shelf places; wrong shelf does not; sorting all celebrates', async () => {
    const soundManager = makeSound();
    render(<KitchenSortGame onExit={() => {}} soundManager={soundManager} difficulty={GAME_DIFFICULTY.EASY} />);
    await act(async () => { screen.getByRole('button', { name: 'בואו נתחיל' }).click(); });

    expect(itemEls()).toHaveLength(6);
    const first = itemEls()[0];
    const wrongId = [...document.querySelectorAll('[data-shelf]')]
      .map((s) => s.dataset.shelf).find((id) => id !== first.dataset.targetShelf);

    await tap(first);
    await act(async () => { fireEvent.pointerDown(shelfEl(wrongId)); });
    expect(placed()).toBe(0);

    await tap(first);
    await act(async () => { fireEvent.pointerDown(shelfEl(first.dataset.targetShelf)); });
    expect(first.dataset.placed).toBe('true');
    expect(placed()).toBe(1);

    for (const el of itemEls().filter((e) => e.dataset.placed === 'false')) {
      await tap(el);
      await act(async () => { fireEvent.pointerDown(shelfEl(el.dataset.targetShelf)); });
    }
    expect(placed()).toBe(6);
    await waitFor(() => expect(soundManager.playWin).toHaveBeenCalledTimes(1), { timeout: 4000 });
    expect(screen.getByRole('status')).toBeInTheDocument();
  }, 10000);
});
