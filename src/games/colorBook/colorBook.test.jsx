import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

import ColorBookGame from './ColorBookGame';
import { PICTURES, REGION_COUNTS, regionsFor } from './pictures';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { PLAY_COLORS } from '../../lib/palette';

const makeSound = () => ({
  playWin: vi.fn(), playCorrect: vi.fn(), playEncouragement: vi.fn(),
  startBgMusic: vi.fn(), stopBgMusic: vi.fn(),
});

beforeEach(() => {
  window.innerWidth = 414;
  window.innerHeight = 896;
  try { localStorage.clear(); } catch { /* ignore */ }
  window.matchMedia = (q) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  });
});
afterEach(() => cleanup());

const regionEls = () => [...document.querySelectorAll('[data-region]')];

describe('צובעים pictures', () => {
  it('has at least 6 pictures with unique region ids', () => {
    expect(PICTURES.length).toBeGreaterThanOrEqual(6);
    PICTURES.forEach((p) => {
      const ids = p.regions.map((region) => region.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('has 5 / 8 / 12 regions for easy / medium / hard', () => {
    PICTURES.forEach((p) => {
      expect(regionsFor(p, GAME_DIFFICULTY.EASY)).toHaveLength(REGION_COUNTS.easy);
      expect(regionsFor(p, GAME_DIFFICULTY.MEDIUM)).toHaveLength(REGION_COUNTS.medium);
      expect(regionsFor(p, GAME_DIFFICULTY.HARD)).toHaveLength(REGION_COUNTS.hard);
    });
  });
});

describe('צובעים', () => {
  it('fills regions, celebrates when all are coloured, then shows the picker', async () => {
    const soundManager = makeSound();
    render(<ColorBookGame onExit={() => {}} soundManager={soundManager} difficulty={GAME_DIFFICULTY.EASY} />);
    await act(async () => {
      screen.getByRole('button', { name: 'בואו נתחיל' }).click();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    expect(regionEls()).toHaveLength(REGION_COUNTS.easy);
    expect(regionEls().every((el) => el.hasAttribute('data-tap-target'))).toBe(true);
    expect(regionEls().every((el) => el.dataset.filled === 'false')).toBe(true);
    expect(document.querySelectorAll('[data-swatch]').length).toBeGreaterThanOrEqual(8);

    await act(async () => { fireEvent.pointerDown(document.querySelector('[data-swatch="blue"]')); });
    const first = regionEls()[0];
    await act(async () => { fireEvent.pointerDown(first); });
    expect(first.dataset.filled).toBe('true');
    expect(first.dataset.color).toBe(PLAY_COLORS.blue);

    await act(async () => { fireEvent.pointerDown(document.querySelector('[data-swatch="red"]')); });
    await act(async () => { fireEvent.pointerDown(first); });
    expect(first.dataset.color).toBe(PLAY_COLORS.red);

    await act(async () => {
      regionEls().forEach((el) => fireEvent.pointerDown(el));
    });
    expect(screen.getByRole('button', { name: /סיימתי/ })).toBeInTheDocument();

    await waitFor(() => expect(soundManager.playWin).toHaveBeenCalledTimes(1), { timeout: 4000 });
    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('picker')).toBeInTheDocument(), { timeout: 5000 });
    expect(document.querySelectorAll('[data-picture]')).toHaveLength(PICTURES.length);
    expect(document.querySelectorAll('[data-gallery-item]')).toHaveLength(1);

    await act(async () => { fireEvent.pointerDown(document.querySelector('[data-picture="car"]')); });
    expect(regionEls()).toHaveLength(REGION_COUNTS.easy);
    expect(regionEls().every((el) => el.dataset.filled === 'false')).toBe(true);
  }, 15000);
});
