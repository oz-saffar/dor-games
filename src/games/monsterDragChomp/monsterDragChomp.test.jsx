import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import MonsterDragChompGame from './MonsterDragChompGame';

/**
 * The game plays in two directions and the toggle is the only way between them,
 * so what is pinned here is that the flip actually swaps both halves — the
 * dragged eater and the crowd on the tray — and keeps the settings headcount.
 */

const makeSoundManager = () => ({
  playCorrect: vi.fn(),
  playWin: vi.fn(),
  playEncouragement: vi.fn(),
  startBgMusic: vi.fn(),
  stopBgMusic: vi.fn(),
});

beforeEach(() => {
  window.innerWidth = 390;
  window.innerHeight = 844;
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
});

afterEach(cleanup);

const startGame = (props = {}) => {
  render(
    <MonsterDragChompGame
      onExit={vi.fn()}
      soundManager={makeSoundManager()}
      peopleCount={5}
      {...props}
    />
  );
  const dialog = screen.getByRole('dialog');
  act(() => {
    dialog.querySelector('button').click();
  });
};

const tapToggle = () => {
  const toggle = screen.getByRole('button', { name: /להחליף ל:/ });
  act(() => {
    fireEvent.pointerDown(toggle);
  });
};

describe('מפלצת מעל החברים — direction toggle', () => {
  it('opens with the monster eating the friends', () => {
    startGame();
    expect(screen.getByLabelText('מפלצת לגרירה')).toBeInTheDocument();
    expect(screen.getAllByLabelText('חבר')).toHaveLength(5);
  });

  it('flips to a kid eating monsters, and back', () => {
    startGame();

    tapToggle();
    expect(screen.getByLabelText('ילד לגרירה')).toBeInTheDocument();
    expect(screen.getAllByLabelText('מפלצת')).toHaveLength(5);
    expect(screen.queryByLabelText('חבר')).not.toBeInTheDocument();

    tapToggle();
    expect(screen.getByLabelText('מפלצת לגרירה')).toBeInTheDocument();
    expect(screen.getAllByLabelText('חבר')).toHaveLength(5);
  });

  it('keeps the settings headcount across a flip', () => {
    startGame({ peopleCount: 11 });
    expect(screen.getAllByLabelText('חבר')).toHaveLength(11);

    tapToggle();
    expect(screen.getAllByLabelText('מפלצת')).toHaveLength(11);
  });
});
