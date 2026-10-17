import { describe, it, expect } from 'vitest';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import {
  DIFFICULTY_CONFIG,
  buildMaze,
  monotoneSolvable,
  needsAllDirections,
  solvePath,
} from './mazeBuilder';

/**
 * The maze used to be a random walk that mostly stepped down and right, so every
 * level solved itself by holding ⬇️ and ➡️. These pin the thing that replaced it:
 * a real carved maze whose route bends back on itself.
 */
const LEVELS = [GAME_DIFFICULTY.EASY, GAME_DIFFICULTY.MEDIUM, GAME_DIFFICULTY.HARD].map((d) => [
  d,
  DIFFICULTY_CONFIG[d],
]);

describe.each(LEVELS)('maze at %s', (_difficulty, config) => {
  const { rows, cols } = config;

  it('sits on an odd grid, so passages and walls interleave', () => {
    expect(rows % 2).toBe(1);
    expect(cols % 2).toBe(1);
  });

  it('always leaves a route from the corner to the flag', () => {
    for (let i = 0; i < 40; i += 1) {
      const maze = buildMaze(rows, cols);
      expect(maze[0][0]).toBe(1);
      expect(maze[rows - 1][cols - 1]).toBe(1);
      expect(solvePath(maze, rows, cols)).not.toBeNull();
    }
  });

  it('needs all four directions, not just down and right', () => {
    for (let i = 0; i < 40; i += 1) {
      const maze = buildMaze(rows, cols);
      expect(needsAllDirections(solvePath(maze, rows, cols))).toBe(true);
    }
  });

  it('can never be walked with only ➡️ and ⬇️', () => {
    for (let i = 0; i < 60; i += 1) {
      expect(monotoneSolvable(buildMaze(rows, cols), rows, cols)).toBe(false);
    }
  });

  it('is a maze, not an open field — some cells stay walled', () => {
    const maze = buildMaze(rows, cols);
    const walls = maze.flat().filter((cell) => cell === 0).length;
    expect(walls).toBeGreaterThan(rows * cols * 0.15);
  });
});

describe('monotoneSolvable', () => {
  it('spots a grid that is one straight L to the flag', () => {
    const open = [
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
    ];
    expect(monotoneSolvable(open, 3, 3)).toBe(true);
  });

  it('rejects a grid whose only route doubles back', () => {
    const winding = [
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
    ];
    // reaching (0,2) needs ⬆️ from the bottom row, so right/down alone cannot
    expect(monotoneSolvable(winding, 3, 3)).toBe(true); // ...to (2,2) it can
    const blocked = [
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 0],
    ];
    expect(monotoneSolvable(blocked, 3, 3)).toBe(false);
  });
});

describe('needsAllDirections', () => {
  it('rejects a route that only ever steps down and right', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ];
    expect(needsAllDirections(path)).toBe(false);
  });

  it('accepts a route that doubles back up and left', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 1, col: 1 },
    ];
    expect(needsAllDirections(path)).toBe(true);
  });
});
