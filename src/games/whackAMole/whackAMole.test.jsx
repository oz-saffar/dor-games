import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

import WhackAMoleGame from './WhackAMoleGame';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

const makeSound = () => ({
  playWin: vi.fn(), playCorrect: vi.fn(), playEncouragement: vi.fn(),
  startBgMusic: vi.fn(), stopBgMusic: vi.fn(),
});

// Manual rAF clock
let cbs = [];
let now = 0;
const frame = (ms) => {
  now += ms;
  const run = cbs;
  cbs = [];
  run.forEach(([, fn]) => fn(now));
};
const advance = async (ms) => {
  await act(async () => {
    for (let t = 0; t < ms; t += 50) frame(50);
  });
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  cbs = [];
  now = 0;
  let id = 0;
  vi.stubGlobal('requestAnimationFrame', (fn) => { id += 1; cbs.push([id, fn]); return id; });
  vi.stubGlobal('cancelAnimationFrame', (h) => { cbs = cbs.filter(([i]) => i !== h); });
  window.innerWidth = 414;
  window.innerHeight = 896;
  window.matchMedia = (q) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const start = async (props = {}) => {
  const soundManager = makeSound();
  render(<WhackAMoleGame onExit={vi.fn()} soundManager={soundManager} difficulty={GAME_DIFFICULTY.EASY} {...props} />);
  await act(async () => { screen.getByRole('button', { name: 'בואו נתחיל' }).click(); });
  return { soundManager };
};
const up = (kind) => [...document.querySelectorAll(`[data-mole="up"]${kind ? `[data-critter="${kind}"]` : ''}`)];
const badge = (n) => expect(document.body.textContent).toMatch(new RegExp(`🐹\\s*${n}(?!\\d)`));

describe('הכה בחפרפרת', () => {
  it('has 4 holes on easy and a mole appears within a bounded time', async () => {
    await start();
    expect(document.querySelectorAll('[data-hole]')).toHaveLength(4);
    expect(up()).toHaveLength(0);
    await advance(1500);
    expect(up().length).toBeGreaterThan(0);
    expect(up().length).toBeLessThanOrEqual(2);
    expect(up().every((el) => el.dataset.critter === 'mole')).toBe(true);
  });

  it('tapping a mole scores once; tapping a bunny does not', async () => {
    await start({ difficulty: GAME_DIFFICULTY.HARD });
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    await advance(1000);
    const mole = up('mole')[0];
    expect(mole).toBeTruthy();
    await act(async () => { fireEvent.pointerDown(mole); });
    badge(1);
    await act(async () => { fireEvent.pointerDown(mole); });
    badge(1);

    rnd.mockReturnValue(0);
    await advance(3000);
    const bunny = up('bunny')[0];
    expect(bunny).toBeTruthy();
    await act(async () => { fireEvent.pointerDown(bunny); });
    badge(1);
    rnd.mockRestore();
  });

  it('10 tickles celebrate and call playWin', async () => {
    const { soundManager } = await start();
    let tickled = 0;
    for (let n = 0; n < 300 && tickled < 10; n += 1) {
      const m = up('mole').find((el) => !el.dataset.tickled);
      if (m) {
        await act(async () => { fireEvent.pointerDown(m); });
        tickled += 1;
      }
      await advance(100);
    }
    expect(soundManager.playWin).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(2600); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('unmount cancels the frame loop and timers', async () => {
    await start();
    await advance(500);
    cleanup();
    expect(cbs).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
