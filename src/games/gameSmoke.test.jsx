import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, cleanup, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { GAME_COMPONENTS } from '../lib/gameComponents';
import { ALL_GAMES } from '../lib/gamesConfig';
import { GAME_DIFFICULTY } from '../lib/gameDifficulties';

/**
 * Every playable game, mounted for real.
 *
 * This is the net under the visual system: a restyle that breaks a game's
 * render, its instructions overlay or its way out fails here rather than on
 * Dor's iPad. It deliberately asserts only on structure that belongs to every
 * game, so it stays valid as the artwork changes.
 */

const GAME_IDS = Object.keys(GAME_COMPONENTS);

const titleOf = (id) => ALL_GAMES.find((g) => g.id === id)?.title ?? id;

const makeSoundManager = () => ({
  playSound: vi.fn(),
  playCorrect: vi.fn(),
  playSuccess: vi.fn(),
  playWin: vi.fn(),
  playStartGame: vi.fn(),
  playEncouragement: vi.fn(),
  startBgMusic: vi.fn(),
  stopBgMusic: vi.fn(),
  setBgMusicVolume: vi.fn(),
});

/** Games read their size from the window, so pin a phone-ish portrait viewport. */
const setViewport = (w = 390, h = 844) => {
  window.innerWidth = w;
  window.innerHeight = h;
  window.matchMedia = (query) => ({
    matches: query.includes('landscape') ? w > h : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
};

let rafHandles = 0;
beforeEach(() => {
  setViewport();
  // Keep the rAF-driven games ticking without running away with the clock.
  rafHandles = 0;
  vi.stubGlobal('requestAnimationFrame', (cb) => {
    rafHandles += 1;
    const id = rafHandles;
    setTimeout(() => cb(performance.now()), 0);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const mountGame = async (id, extraProps = {}) => {
  const Game = GAME_COMPONENTS[id];
  const onExit = vi.fn();
  const soundManager = makeSoundManager();

  render(
    <Suspense fallback={<div data-testid="loading" />}>
      <Game
        onExit={onExit}
        soundManager={soundManager}
        difficulty={GAME_DIFFICULTY.EASY}
        numPairs={3}
        peopleCount={8}
        pieceCount={12}
        {...extraProps}
      />
    </Suspense>
  );

  // Wait past the lazy() boundary.
  // The first lazy import of a run pays the cold transform, which can outlast
  // waitFor's 1s default.
  await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), {
    timeout: 8000,
  });
  return { onExit, soundManager };
};

describe.each(GAME_IDS)('game smoke: %s', (id) => {
  it(`mounts ${titleOf(id)} without throwing`, async () => {
    await mountGame(id);
    expect(document.body.textContent).not.toBe('');
  });

  it(`offers a way back out of ${titleOf(id)}`, async () => {
    const { onExit } = await mountGame(id);

    const back = await screen.findByRole('button', { name: 'חזרה לתפריט הראשי' });
    expect(back).toBeInTheDocument();

    await act(async () => {
      back.click();
    });
    expect(onExit).toHaveBeenCalled();
  });

  it(`starts ${titleOf(id)} from its opening screen`, async () => {
    await mountGame(id);

    // Most games open on the shared instructions overlay; a couple open on their
    // own picker instead (רשת! picks a hero). Either way there is exactly one
    // obvious thing to press, and pressing it must not blow up.
    const dialog = screen.queryByRole('dialog');
    const start = dialog
      ? dialog.querySelector('button')
      : screen
          .queryAllByRole('button')
          .find((b) => b.getAttribute('aria-label') !== 'חזרה לתפריט הראשי');

    if (!start) return; // a game that drops straight into play is fine

    await act(async () => {
      start.click();
    });

    // The overlay must actually dismiss, and the game must survive a frame.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('the registry itself', () => {
  it('has a component for every non-external game', () => {
    const internal = ALL_GAMES.filter((g) => !g.externalUrl).map((g) => g.id);
    expect(new Set(GAME_IDS)).toEqual(new Set(internal));
  });

  it('gives every game an accent from the Warm Paper & Clay scale', () => {
    const scale = new Set([
      '#8fa98a', '#c97b5a', '#d9a441', '#7e9bb5',
      '#c08b8b', '#6e8b6e', '#9887a8', '#c9b08a',
    ]);
    for (const g of ALL_GAMES) {
      expect(scale, `${g.id} uses ${g.accent}`).toContain(g.accent.toLowerCase());
    }
  });
});
