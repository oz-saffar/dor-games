import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

import SpotDifferenceGame from './SpotDifferenceGame';
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

const targets = () => [...document.querySelectorAll('[data-diff-id][data-picture="a"]')];
const foundCount = () => targets().filter((el) => el.dataset.found === 'true').length;

const start = async () => {
  await act(async () => {
    screen.getByRole('button', { name: 'בואו נתחיל' }).click();
  });
};

describe('מצא את ההבדלים', () => {
  it('starts with three unfound differences on easy', async () => {
    render(<SpotDifferenceGame onExit={() => {}} soundManager={makeSound()} difficulty={GAME_DIFFICULTY.EASY} />);
    await start();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(targets()).toHaveLength(3);
    expect(targets().every((el) => el.hasAttribute('data-tap-target') && el.dataset.found === 'false')).toBe(true);
    expect(document.querySelectorAll('[data-picture="b"][data-diff-id]')).toHaveLength(3);
  });

  it('a miss does not count, tapping a difference marks it found on both pictures', async () => {
    const soundManager = makeSound();
    render(<SpotDifferenceGame onExit={() => {}} soundManager={soundManager} difficulty={GAME_DIFFICULTY.MEDIUM} />);
    await start();
    expect(targets()).toHaveLength(4);

    await act(async () => {
      fireEvent.pointerDown(document.querySelector('svg[data-picture="a"]'));
    });
    expect(foundCount()).toBe(0);
    expect(soundManager.playCorrect).not.toHaveBeenCalled();

    const id = targets()[0].dataset.diffId;
    // tap it on the SECOND picture
    await act(async () => {
      fireEvent.pointerDown(document.querySelector(`[data-diff-id="${id}"][data-picture="b"]`));
    });
    expect(foundCount()).toBe(1);
    expect(document.querySelectorAll(`[data-diff-id="${id}"][data-found="true"]`)).toHaveLength(2);
    expect(document.querySelectorAll('[data-ring]')).toHaveLength(2);
    expect(soundManager.playCorrect).toHaveBeenCalledTimes(1);

    // finding the same one again does nothing
    await act(async () => {
      fireEvent.pointerDown(targets()[0]);
    });
    expect(soundManager.playCorrect).toHaveBeenCalledTimes(1);
    expect(soundManager.playWin).not.toHaveBeenCalled();
  });

  it('finding all of them celebrates and plays the win sound', async () => {
    const soundManager = makeSound();
    render(<SpotDifferenceGame onExit={() => {}} soundManager={soundManager} difficulty={GAME_DIFFICULTY.HARD} />);
    await start();
    const ids = targets().map((el) => el.dataset.diffId);
    expect(ids).toHaveLength(5);

    for (const id of ids) {
      await act(async () => {
        fireEvent.pointerDown(document.querySelector(`[data-diff-id="${id}"]`));
      });
    }
    expect(soundManager.playWin).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toBeInTheDocument();

    // a tap during the celebration skips ahead to a fresh, unfound picture
    await act(async () => {
      fireEvent.pointerDown(document.querySelector('.fixed'));
    });
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    expect(foundCount()).toBe(0);
  });

  it('Escape exits', async () => {
    const onExit = vi.fn();
    render(<SpotDifferenceGame onExit={onExit} soundManager={makeSound()} />);
    fireEvent.keyDown(window, { code: 'Escape' });
    expect(onExit).toHaveBeenCalled();
  });
});
