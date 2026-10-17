import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

import ArrowEscapeGame from './ArrowEscapeGame';
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

const arrowEls = () => [...document.querySelectorAll('[data-arrow-id]')];

describe('חצים', () => {
  it('starts, rejects a blocked arrow without failing, and clears a board', async () => {
    const soundManager = makeSound();
    render(<ArrowEscapeGame onExit={() => {}} soundManager={soundManager} difficulty={GAME_DIFFICULTY.EASY} />);

    await act(async () => {
      screen.getByRole('button', { name: 'בואו נתחיל' }).click();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const total = arrowEls().length;
    expect(total).toBeGreaterThan(0);
    expect(arrowEls().every((el) => el.hasAttribute('data-tap-target'))).toBe(true);

    // a blocked arrow just wiggles: nothing is removed, nothing ends
    const blocked = arrowEls().find((el) => el.dataset.movable === 'false');
    if (blocked) {
      fireEvent.pointerDown(blocked);
      expect(arrowEls()).toHaveLength(total);
    }

    // clear the board by always tapping a movable arrow
    for (let guard = 0; guard < 60 && arrowEls().length > 0; guard += 1) {
      const next = arrowEls().find((el) => el.dataset.movable === 'true');
      expect(next).toBeTruthy();
      await act(async () => {
        fireEvent.pointerDown(next);
      });
    }
    expect(arrowEls()).toHaveLength(0);

    await waitFor(() => expect(soundManager.playWin).toHaveBeenCalledTimes(1), { timeout: 4000 });
    expect(screen.getByRole('status')).toBeInTheDocument();

    // a tap during the celebration skips ahead to a fresh board
    await act(async () => {
      fireEvent.pointerDown(document.querySelector('[aria-label="לוח חצים"]'));
    });
    await waitFor(() => expect(arrowEls().length).toBeGreaterThan(0));
  });
});
