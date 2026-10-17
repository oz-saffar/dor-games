import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

import FourInRowGame from './FourInRowGame';
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
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const col = (c) => document.querySelector(`[data-column="${c}"]`);
const owned = (who) => [...document.querySelectorAll(`[data-cell][data-owner="${who}"]`)];
const turnOf = () => document.querySelector('[data-turn]').dataset.turn;

const start = async (props = {}) => {
  const soundManager = makeSound();
  render(<FourInRowGame onExit={() => {}} soundManager={soundManager} difficulty={GAME_DIFFICULTY.EASY} {...props} />);
  await act(async () => { screen.getByRole('button', { name: 'בואו נתחיל' }).click(); });
  return soundManager;
};

describe('ארבע בשורה', () => {
  it('mounts a 6x5 board with tap-target columns', async () => {
    await start();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-cell]')).toHaveLength(30);
    expect(document.querySelectorAll('[data-column]')).toHaveLength(6);
    expect([...document.querySelectorAll('[data-column]')].every((el) => el.hasAttribute('data-tap-target'))).toBe(true);
    expect(turnOf()).toBe('dor');
  });

  it('drops a disc, ignores taps while the bot thinks, then the bot replies', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    await start();
    await act(async () => { fireEvent.pointerDown(col(2)); });
    expect(owned('dor')).toHaveLength(1);
    expect(document.querySelector('[data-cell="4-2"]').dataset.owner).toBe('dor');
    expect(turnOf()).toBe('bot');

    await act(async () => { fireEvent.pointerDown(col(3)); });
    expect(owned('dor')).toHaveLength(1);

    await waitFor(() => expect(owned('bot')).toHaveLength(1), { timeout: 3000 });
    expect(turnOf()).toBe('dor');
  });

  it('a full column does nothing but wobble', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    await start();
    // the bot also stacks column 5, so Dor and the bot fill it between them
    for (let i = 0; i < 5; i += 1) {
      await act(async () => { fireEvent.pointerDown(col(5)); });
      await waitFor(() => expect(turnOf()).toBe('dor'), { timeout: 3000 });
    }
    const before = document.querySelectorAll('[data-disc]').length;
    expect(document.querySelector('[data-cell="0-5"]').dataset.owner).not.toBe('empty');
    await act(async () => { fireEvent.pointerDown(col(5)); });
    expect(document.querySelectorAll('[data-disc]').length).toBe(before);
    expect(turnOf()).toBe('dor');
  }, 20000);

  it('celebrates a Dor win, plays the win sound, then resets', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // easy bot just stacks column 5
    const soundManager = await start();
    for (let i = 0; i < 4; i += 1) {
      await act(async () => { fireEvent.pointerDown(col(0)); });
      if (i < 3) await waitFor(() => expect(turnOf()).toBe('dor'), { timeout: 3000 });
    }
    await waitFor(() => expect(soundManager.playWin).toHaveBeenCalledTimes(1));
    expect(turnOf()).toBe('over');
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-disc="dor"]').length).toBe(4);

    await waitFor(() => expect(owned('dor')).toHaveLength(0), { timeout: 5000 });
    expect(turnOf()).toBe('dor');
  }, 20000);
});
