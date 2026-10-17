import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

import PopItGame from './PopItGame';
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

const bubbleEls = () => [...document.querySelectorAll('[data-bubble]')];
const poppedCount = () => bubbleEls().filter((el) => el.dataset.popped === 'true').length;

describe('פופ-איט', () => {
  it('pops once, ignores re-taps, celebrates, then refills', async () => {
    const soundManager = makeSound();
    render(<PopItGame onExit={() => {}} soundManager={soundManager} difficulty={GAME_DIFFICULTY.EASY} />);
    await act(async () => {
      screen.getByRole('button', { name: 'בואו נתחיל' }).click();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const total = bubbleEls().length;
    expect(total).toBe(16);
    expect(bubbleEls().every((el) => el.hasAttribute('data-tap-target'))).toBe(true);
    expect(poppedCount()).toBe(0);

    const first = bubbleEls()[0];
    await act(async () => { fireEvent.pointerDown(first); });
    expect(first.dataset.popped).toBe('true');
    expect(poppedCount()).toBe(1);

    await act(async () => { fireEvent.pointerDown(first); });
    expect(poppedCount()).toBe(1);

    await act(async () => {
      bubbleEls().forEach((el) => fireEvent.pointerDown(el));
    });
    await waitFor(() => expect(soundManager.playWin).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => expect(poppedCount()).toBe(0), { timeout: 5000 });
    expect(bubbleEls()).toHaveLength(total);
  }, 10000);
});
