import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-confetti', () => ({ default: () => null }));

import DotToDotGame from './DotToDotGame';
import { PICTURES, DOT_COUNTS, MIN_GAP, dotsFor } from './pictures';
import { PAD, VB, HIT_PX, labelPositions, LABEL_DOT_CLEARANCE, LABEL_LABEL_CLEARANCE } from './layout';
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
  window.speechSynthesis = { speak: vi.fn(), cancel: vi.fn() };
  window.SpeechSynthesisUtterance = function Utter(text) { this.text = text; };
});
afterEach(() => cleanup());

const dotEl = (n) => document.querySelector(`[data-dot="${n}"]`);

describe('resampling', () => {
  it('gives exactly n dots per difficulty for every picture', () => {
    expect(PICTURES.length).toBeGreaterThanOrEqual(6);
    Object.entries(DOT_COUNTS).forEach(([, n]) => {
      PICTURES.forEach((p) => {
        const dots = dotsFor(p, n);
        expect(dots).toHaveLength(n);
        expect(dots.map((d) => d.n)).toEqual(Array.from({ length: n }, (_, i) => i + 1));
        dots.forEach((d) => {
          expect(d.x).toBeGreaterThanOrEqual(0);
          expect(d.x).toBeLessThanOrEqual(100);
          expect(d.y).toBeGreaterThanOrEqual(0);
          expect(d.y).toBeLessThanOrEqual(100);
        });
      });
    });
  });
});

describe('dot spacing', () => {
  const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  Object.entries(DOT_COUNTS).forEach(([level, n]) => {
    PICTURES.forEach((p) => {
      it(`${p.id} / ${level}: dots are apart, corners kept, labels clear`, () => {
        const dots = dotsFor(p, n);
        for (let i = 0; i < n; i += 1) {
          for (let j = i + 1; j < n; j += 1) expect(near(dots[i], dots[j])).toBeGreaterThanOrEqual(MIN_GAP);
        }
        p.corners.forEach((ci) => {
          const [x, y] = p.points[ci];
          expect(dots.some((d) => Math.abs(d.x - x) < 0.11 && Math.abs(d.y - y) < 0.11)).toBe(true);
        });
        const labels = labelPositions(dots);
        labels.forEach((l, i) => {
          dots.forEach((d) => expect(near(l, d)).toBeGreaterThanOrEqual(LABEL_DOT_CLEARANCE));
          labels.slice(i + 1).forEach((o) => expect(near(l, o)).toBeGreaterThanOrEqual(LABEL_LABEL_CLEARANCE));
        });
      });
    });
  });
});

describe('מחברים נקודות', () => {
  it('connects only the next dot, then celebrates when the picture closes', async () => {
    const soundManager = makeSound();
    render(<DotToDotGame onExit={() => {}} soundManager={soundManager} difficulty={GAME_DIFFICULTY.EASY} />);
    await act(async () => { screen.getByRole('button', { name: 'בואו נתחיל' }).click(); });

    expect(document.querySelectorAll('[data-dot]')).toHaveLength(5);
    expect(dotEl(1).dataset.next).toBe('true');
    expect(dotEl(1).hasAttribute('data-tap-target')).toBe(true);
    expect(document.querySelector('[data-picture]').dataset.picture).toBeTruthy();

    await act(async () => { fireEvent.pointerDown(dotEl(3)); });
    expect(dotEl(3).dataset.done).toBe('false');
    expect(dotEl(1).dataset.done).toBe('false');
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();

    await act(async () => { fireEvent.pointerDown(dotEl(1)); });
    expect(dotEl(1).dataset.done).toBe('true');
    expect(dotEl(2).dataset.next).toBe('true');
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);

    for (let i = 2; i <= 5; i += 1) {
      await act(async () => { fireEvent.pointerDown(dotEl(i)); });
    }
    await waitFor(() => expect(soundManager.playWin).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(screen.getByRole('status')).toBeInTheDocument();
  }, 10000);

  it('connects on a tap within the radius of the next dot even if another dot is the target', async () => {
    render(<DotToDotGame onExit={() => {}} soundManager={makeSound()} difficulty={GAME_DIFFICULTY.EASY} />);
    await act(async () => { screen.getByRole('button', { name: 'בואו נתחיל' }).click(); });
    const svg = screen.getByTestId('dot-board');
    const size = 400;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: size, height: size, right: size, bottom: size });
    const dots = dotsFor(PICTURES.find((p) => p.id === document.querySelector('[data-picture]').dataset.picture), 5);
    const toPx = (d) => ({ clientX: ((d.x + PAD) * size) / VB, clientY: ((d.y + PAD) * size) / VB });
    const nudge = (HIT_PX * 0.5);
    // Target is dot 3's element, but the pointer is on dot 1.
    await act(async () => { fireEvent.pointerDown(dotEl(3), toPx(dots[0])); });
    expect(dotEl(1).dataset.done).toBe('true');
    // Just inside the radius of dot 2, targeting dot 4.
    const p2 = toPx(dots[1]);
    await act(async () => { fireEvent.pointerDown(dotEl(4), { clientX: p2.clientX + nudge, clientY: p2.clientY }); });
    expect(dotEl(2).dataset.done).toBe('true');
    // Far from dot 3: nothing connects.
    await act(async () => { fireEvent.pointerDown(dotEl(5), { clientX: 2, clientY: 2 }); });
    expect(dotEl(3).dataset.done).toBe('false');
  });
});
