import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

const playSpy = vi.hoisted(() => vi.fn());
vi.mock('./xylophoneAudio', () => ({
  createXyloSynth: () => ({ play: playSpy, unlock: () => {}, close: () => {} }),
}));

import XylophoneGame from './XylophoneGame';
import { SONGS, BAR_COUNT, notesFor } from './songs';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

const makeSound = () => ({
  playWin: vi.fn(), playCorrect: vi.fn(), playEncouragement: vi.fn(),
  startBgMusic: vi.fn(), stopBgMusic: vi.fn(),
});

beforeEach(() => {
  playSpy.mockClear();
  window.innerWidth = 414;
  window.innerHeight = 896;
  window.matchMedia = (q) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  });
});
afterEach(() => cleanup());

const bar = (i) => document.querySelector(`[data-bar="${i}"]`);
const next = () => document.querySelector('[data-next="true"]');

const start = async (soundManager) => {
  render(<XylophoneGame onExit={() => {}} soundManager={soundManager} difficulty={GAME_DIFFICULTY.EASY} />);
  await act(async () => { screen.getByRole('button', { name: 'בואו נתחיל' }).click(); });
};

describe('songs', () => {
  it('only use bar indices 0..7 and difficulty trims them', () => {
    SONGS.forEach((s) => {
      expect(s.notes.length).toBeGreaterThan(7);
      s.notes.forEach((n) => {
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(BAR_COUNT);
      });
      expect(notesFor(s, 'easy')).toHaveLength(7);
      expect(notesFor(s, 'medium').length).toBe(Math.ceil(s.notes.length / 2));
      expect(notesFor(s, 'hard')).toEqual(s.notes);
    });
  });
});

describe('קסילופון', () => {
  it('renders 8 tappable bars and plays on tap, including chords', async () => {
    await start(makeSound());
    for (let i = 0; i < BAR_COUNT; i += 1) {
      expect(bar(i)).toBeTruthy();
      expect(bar(i).hasAttribute('data-tap-target')).toBe(true);
    }
    await act(async () => {
      fireEvent.pointerDown(bar(2), { pointerId: 1 });
      fireEvent.pointerDown(bar(4), { pointerId: 2 });
    });
    expect(playSpy).toHaveBeenCalledWith(2);
    expect(playSpy).toHaveBeenCalledWith(4);
  });

  it('play-along advances only on the glowing bar, then celebrates', async () => {
    const sound = makeSound();
    await start(sound);
    expect(next()).toBeNull();
    await act(async () => { fireEvent.pointerDown(document.querySelector('[data-mode-toggle]')); });

    const seq = notesFor(SONGS[0], 'easy');
    expect(Number(next().dataset.bar)).toBe(seq[0]);

    const wrong = [0, 4].find((i) => i !== seq[0]);
    await act(async () => { fireEvent.pointerDown(bar(wrong), { pointerId: 1 }); });
    expect(playSpy).toHaveBeenCalledWith(wrong);
    expect(Number(next().dataset.bar)).toBe(seq[0]);

    for (let k = 0; k < seq.length; k += 1) {
      await act(async () => { fireEvent.pointerDown(bar(seq[k]), { pointerId: 1 }); });
    }
    await waitFor(() => expect(sound.playWin).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
