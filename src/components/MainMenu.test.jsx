import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import MainMenu from './MainMenu';
import { loadProgress, recordPlayed, PROGRESS_KEY } from '../lib/progress';

const config = { visibleGames: ['memory', 'maze-rescue', 'dino-stomp', 'numbers'] };

const setup = () => {
  const onSelectGame = vi.fn();
  render(
    <MainMenu
      onSelectGame={onSelectGame}
      onOpenConfig={() => {}}
      soundManager={{ playStartGame: vi.fn() }}
      config={config}
    />,
  );
  return onSelectGame;
};

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('MainMenu', () => {
  it('launches on a short tap', () => {
    const onSelect = setup();
    const tile = screen.getByTestId('tile-memory');
    fireEvent.pointerDown(tile, { clientX: 5, clientY: 5, button: 0 });
    fireEvent.pointerUp(tile, { clientX: 5, clientY: 5 });
    expect(onSelect).toHaveBeenCalledWith('memory');
  });

  it('long press toggles the favourite and does not launch', () => {
    const onSelect = setup();
    const tile = screen.getByTestId('tile-memory');
    fireEvent.pointerDown(tile, { clientX: 5, clientY: 5, button: 0 });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.pointerUp(tile, { clientX: 5, clientY: 5 });
    expect(onSelect).not.toHaveBeenCalled();
    expect(loadProgress().favourites).toEqual(['memory']);
    expect(screen.getByTestId('favourites-row')).toBeTruthy();
  });

  it('moving more than 10px cancels the long press', () => {
    const onSelect = setup();
    const tile = screen.getByTestId('tile-memory');
    fireEvent.pointerDown(tile, { clientX: 5, clientY: 5, button: 0 });
    fireEvent.pointerMove(tile, { clientX: 5, clientY: 40 });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.pointerUp(tile, { clientX: 5, clientY: 40 });
    expect(loadProgress().favourites).toEqual([]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows recent games and filters by category tab', () => {
    recordPlayed('dino-stomp');
    setup();
    expect(screen.getByTestId('recent-row')).toBeTruthy();
    fireEvent.click(screen.getByTestId('tab-action'));
    expect(screen.queryByTestId('tile-memory')).toBeNull();
    expect(screen.getAllByTestId('tile-dino-stomp').length).toBeGreaterThan(0);
    expect(window.localStorage.getItem('dor-games-home-tab')).toBe('action');
  });

  it('opens the sticker book from earned stars', () => {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ stars: 12 }));
    setup();
    fireEvent.click(screen.getByTestId('sticker-book-button'));
    expect(screen.getAllByTestId('sticker-earned')).toHaveLength(2);
    expect(loadProgress().stickersSeen).toBe(2);
  });
});
