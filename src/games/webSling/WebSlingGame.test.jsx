import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import WebSlingGame from './WebSlingGame';
import { citySkyline, villainPool, VILLAINS } from './webSlingConfig';

const VIEW_W = 420;
const VIEW_H = 820;

/** Manual rAF clock — the game's whole simulation is driven from one rAF loop. */
let rafQueue = [];
let clock = 0;

const flushFrames = (frames, dtMs = 16) => {
  for (let i = 0; i < frames; i += 1) {
    clock += dtMs;
    const cbs = rafQueue;
    rafQueue = [];
    act(() => {
      cbs.forEach((cb) => cb(clock));
    });
  }
};

/** Pop-up villains are the only groups carrying a clip-path. */
const popVillainNodes = () =>
  Array.from(document.querySelectorAll('g[clip-path^="url(#wsClip"]'));

/**
 * Only villains that can still be webbed — a wrapped one lingers as a cocoon.
 * Gliders count too: waiting on pop-ups alone made the 8-catch test flaky, since
 * once Green Goblin joins the pool an unlucky run of glide-bys starved the budget.
 */
const catchableNodes = () =>
  Array.from(document.querySelectorAll('g[data-villain]')).filter(
    (n) => n.getAttribute('data-state') !== 'wrapped',
  );

/**
 * Recover screen-space centre from what the game rendered. Characters with a
 * cut-out sprite draw an <image>; the two still waiting on clean source art
 * fall back to the drawn SVG, which carries its size in a scale() transform.
 */
const DRAWN_H = 126;
const readVillain = (node) => {
  const outer = node.querySelector('g[transform^="translate("]');
  const m = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(outer.getAttribute('transform'));
  const x = Number(m[1]);
  const y = Number(m[2]);

  const img = node.querySelector('image');
  let h;
  if (img) {
    h = Number(img.getAttribute('height'));
  } else {
    const scaled = node.querySelector('g[transform^="scale("]');
    h = Number(/scale\(([-\d.]+)/.exec(scaled.getAttribute('transform'))[1]) * DRAWN_H;
  }
  return { x, y, h, cy: y - h * 0.5 };
};

/** Waits for a villain to finish rising, taps it, and returns its position. */
const catchOneVillain = () => {
  let nodes = [];
  // 48ms steps (the game clamps dt at 100ms): the same game time as 16ms frames
  // for a third of the renders, which is what made this helper slow enough to
  // time out on a loaded machine.
  for (let i = 0; i < 200 && nodes.length === 0; i += 1) {
    flushFrames(1, 48);
    nodes = catchableNodes();
  }
  if (nodes.length === 0) throw new Error('no villain appeared');

  flushFrames(12, 48); // riseMs = 420 on easy
  nodes = catchableNodes();
  if (nodes.length === 0) throw new Error('villain vanished before the tap');

  const target = readVillain(nodes[0]);
  const container = document.querySelector('.h-\\[100dvh\\]');
  act(() => {
    container.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: target.x,
        clientY: target.cy,
      }),
    );
  });
  return target;
};

describe('WebSlingGame', () => {
  beforeEach(() => {
    rafQueue = [];
    clock = 0;

    vi.stubGlobal('requestAnimationFrame', (cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('matchMedia', (query) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }));

    // jsdom has no layout — give the game a portrait phone viewport.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: VIEW_W, bottom: VIEW_H,
      width: VIEW_W, height: VIEW_H, toJSON: () => {},
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const mountAndPickHero = (heroName = 'ספיידי') => {
    const soundManager = {
      playCorrect: vi.fn(),
      playWin: vi.fn(),
      playEncouragement: vi.fn(),
    };
    render(<WebSlingGame onExit={() => {}} soundManager={soundManager} difficulty="easy" />);
    act(() => {
      screen.getByRole('button', { name: new RegExp(heroName) }).click();
    });
    return soundManager;
  };

  it('opens on the hero picker with all three heroes', () => {
    render(<WebSlingGame onExit={() => {}} soundManager={{}} difficulty="easy" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ספיידי/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /רוח־עכביש/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ספין/ })).toBeInTheDocument();
  });

  it('starts the round once a hero is picked', () => {
    mountAndPickHero();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // score badge starts at zero
    expect(screen.getByText(/🕸️ 0/)).toBeInTheDocument();
  });

  it('spawns villains onto the rooftops', () => {
    mountAndPickHero();
    let seen = 0;
    for (let i = 0; i < 220 && seen === 0; i += 1) {
      flushFrames(1);
      seen = popVillainNodes().length;
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('scores a catch when the villain is tapped', () => {
    const soundManager = mountAndPickHero();

    let nodes = [];
    for (let i = 0; i < 260 && nodes.length === 0; i += 1) {
      flushFrames(1);
      nodes = popVillainNodes();
    }
    expect(nodes.length).toBeGreaterThan(0);

    // let it finish rising out from behind the parapet (riseMs = 420 on easy)
    flushFrames(34);
    nodes = popVillainNodes();
    expect(nodes.length).toBeGreaterThan(0);

    const target = readVillain(nodes[0]);
    const container = document.querySelector('.h-\\[100dvh\\]');

    act(() => {
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          clientX: target.x,
          clientY: target.cy,
        }),
      );
    });

    expect(screen.getByText(/🕸️ 1/)).toBeInTheDocument();
    expect(soundManager.playCorrect).not.toHaveBeenCalled();
    expect(soundManager.playWin).not.toHaveBeenCalled();
  });

  it('never ends the round — no win overlay past five catches', () => {
    const soundManager = mountAndPickHero();

    for (let n = 0; n < 7; n += 1) {
      catchOneVillain();
    }

    expect(screen.getByText(/🕸️ 7/)).toBeInTheDocument();
    // the celebration overlay used to fire at 5 and pause play
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(soundManager.playWin).not.toHaveBeenCalled();

    // and play continues: villains keep coming after the old win threshold
    catchOneVillain();
    expect(screen.getByText(/🕸️ 8/)).toBeInTheDocument();
    // eight full catches at up to 400 rendered frames each
  }, 60000);

  it('shoots a web but does not score when the tap misses', () => {
    const soundManager = mountAndPickHero();
    flushFrames(40);

    const container = document.querySelector('.h-\\[100dvh\\]');
    act(() => {
      container.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientX: 4, clientY: 4 }),
      );
    });

    expect(screen.getByText(/🕸️ 0/)).toBeInTheDocument();
    expect(soundManager.playEncouragement).not.toHaveBeenCalled();
  });

  it('exits through the back button', () => {
    const onExit = vi.fn();
    render(<WebSlingGame onExit={onExit} soundManager={{}} difficulty="easy" />);
    act(() => {
      screen.getByRole('button', { name: /ספיידי/ }).click();
    });
    const back = screen.getByRole('button', { name: 'חזרה לתפריט הראשי' });
    act(() => back.click());
    expect(onExit).toHaveBeenCalled();
  });
});

describe('webSling geometry and roster', () => {
  it('lays rooftop slots inside the viewport', () => {
    const g = citySkyline(VIEW_W, VIEW_H, false);
    expect(g.slots.length).toBeGreaterThan(1);
    for (const s of g.slots) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(VIEW_W);
      expect(s.ledge).toBeGreaterThan(0);
      expect(s.ledge).toBeLessThan(VIEW_H);
    }
  });

  it('is deterministic for a given viewport', () => {
    const a = citySkyline(VIEW_W, VIEW_H, false);
    const b = citySkyline(VIEW_W, VIEW_H, false);
    expect(a.slots).toEqual(b.slots);
  });

  it('grows the villain roster as the score climbs', () => {
    expect(villainPool(0)).toEqual(['rhino', 'ock']);
    expect(villainPool(5)).toContain('goblin');
    expect(villainPool(12)).toContain('zola');
    for (const pool of [villainPool(0), villainPool(5), villainPool(12)]) {
      for (const id of pool) expect(VILLAINS[id]).toBeDefined();
    }
  });

  it('offers plenty of distinct rooftop perches', () => {
    const g = citySkyline(VIEW_W, VIEW_H, false);
    // villains felt repetitive when there were only two or three spots
    expect(g.slots.length).toBeGreaterThanOrEqual(5);
    const xs = new Set(g.slots.map((s) => Math.round(s.x)));
    expect(xs.size).toBe(g.slots.length);
  });
});
