import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

import TicTacToeGame from './TicTacToeGame';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

const makeSound = () => ({
  playWin: vi.fn(), playCorrect: vi.fn(), playEncouragement: vi.fn(),
  startBgMusic: vi.fn(), stopBgMusic: vi.fn(),
});

beforeEach(() => {
  try { window.localStorage.clear(); } catch { /* ignore */ }
  window.innerWidth = 414;
  window.innerHeight = 896;
  window.matchMedia = (q) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const cell = (i) => document.querySelector(`[data-cell="${i}"]`);
const owned = (who) => [...document.querySelectorAll(`[data-cell][data-owner="${who}"]`)];
const turnOf = () => document.querySelector('[data-turn]').dataset.turn;

const start = async (props = {}) => {
  const soundManager = makeSound();
  render(<TicTacToeGame onExit={() => {}} soundManager={soundManager} difficulty={GAME_DIFFICULTY.EASY} {...props} />);
  await act(async () => { screen.getByRole('button', { name: 'בואו נתחיל' }).click(); });
  await act(async () => { fireEvent.pointerDown(document.querySelector('[data-piece="rocket"]')); });
  return soundManager;
};

describe('איקס עיגול', () => {
  it('mounts, starts, and remembers the picked piece', async () => {
    await start();
    expect(document.querySelector('[data-piece]')).toBeNull();
    expect(document.querySelectorAll('[data-cell]')).toHaveLength(9);
    expect([...document.querySelectorAll('[data-cell]')].every((el) => el.hasAttribute('data-tap-target'))).toBe(true);
    expect(turnOf()).toBe('dor');
    expect(window.localStorage.getItem('dor-tic-tac-toe-piece')).toBe('rocket');
  });

  it('places a piece, ignores taps while the bot thinks, then the bot replies', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    await start();
    await act(async () => { fireEvent.pointerDown(cell(4)); });
    expect(cell(4).dataset.owner).toBe('dor');
    expect(cell(4).textContent).toBe('🚀');
    expect(turnOf()).toBe('bot');

    await act(async () => { fireEvent.pointerDown(cell(0)); });
    expect(owned('dor')).toHaveLength(1);

    await waitFor(() => expect(owned('bot')).toHaveLength(1), { timeout: 3000 });
    expect(owned('bot')[0].textContent).toBe('🐙');
    expect(turnOf()).toBe('dor');
  });

  it('an occupied cell does not change anything', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    await start();
    await act(async () => { fireEvent.pointerDown(cell(4)); });
    await waitFor(() => expect(turnOf()).toBe('dor'), { timeout: 3000 });
    await act(async () => { fireEvent.pointerDown(cell(4)); });
    expect(owned('dor')).toHaveLength(1);
    expect(turnOf()).toBe('dor');
  });

  it('celebrates a Dor win, plays the win sound, then resets', async () => {
    // random 0.99: the easy bot always takes the last open cell (8, 7, ...)
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const soundManager = await start();
    for (const i of [0, 1, 2]) {
      await act(async () => { fireEvent.pointerDown(cell(i)); });
      if (i < 2) await waitFor(() => expect(turnOf()).toBe('dor'), { timeout: 3000 });
    }
    await waitFor(() => expect(soundManager.playWin).toHaveBeenCalledTimes(1));
    expect(turnOf()).toBe('over');
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="win-line"]')).not.toBeNull();

    await waitFor(() => expect(owned('dor')).toHaveLength(0), { timeout: 6000 });
    expect(turnOf()).toBe('dor');
  }, 20000);
});
