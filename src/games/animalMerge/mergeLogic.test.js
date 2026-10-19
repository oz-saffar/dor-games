import { describe, it, expect } from 'vitest';
import {
  bestPair, hasMerge, hasWon, merge, mulberry32, newBoard, play, spawn,
} from './mergeLogic';
import { levelFor } from './mergeConfig';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

const LEVELS = [GAME_DIFFICULTY.EASY, GAME_DIFFICULTY.MEDIUM, GAME_DIFFICULTY.HARD];

describe('mergeLogic', () => {
  it('merge produces the next tier and empties the source', () => {
    expect(merge([2, 2, null, 0], 0, 1)).toEqual([null, 3, null, 0]);
    expect(merge([2, 1], 0, 1)).toEqual([2, 1]);
  });

  it('never leaves a board without a merge, over thousands of seeded games', () => {
    for (const d of LEVELS) {
      const { rows, cols, start, goal } = levelFor(d);
      for (let seed = 1; seed <= 1000; seed += 1) {
        const rng = mulberry32(seed);
        let board = newBoard(rows, cols, start, rng);
        expect(hasMerge(board)).toBe(true);
        for (let i = 0; i < 40 && !hasWon(board, goal); i += 1) {
          const pair = bestPair(board);
          expect(pair).not.toBeNull();
          board = play(board, pair[0], pair[1], rng);
          expect(hasMerge(board)).toBe(true);
        }
      }
    }
    // 3000 full games: comfortably under a second alone, but a loaded parallel
    // run has pushed it past the 5s default.
  }, 30000);

  it('spawns into a full pairless board by duplicating a tile', () => {
    expect(hasMerge(spawn([0, 1, 2, 3], mulberry32(1)))).toBe(true);
  });

  it('a greedy player reaches the goal within a bounded number of moves', () => {
    for (const d of LEVELS) {
      const { rows, cols, start, goal } = levelFor(d);
      for (let seed = 1; seed <= 300; seed += 1) {
        const rng = mulberry32(seed * 7);
        let board = newBoard(rows, cols, start, rng);
        let moves = 0;
        while (!hasWon(board, goal) && moves < 400) {
          const [a, b] = bestPair(board);
          board = play(board, a, b, rng);
          moves += 1;
        }
        expect(hasWon(board, goal)).toBe(true);
      }
    }
  });
});
