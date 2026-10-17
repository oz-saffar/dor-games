import { describe, it, expect } from 'vitest';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import {
  ROWS, COLS, emptyBoard, dropRow, applyMove, winnerLine, winnerOf, isFull, chooseMove, winningColumn,
} from './fourInRowLogic';

const mulberry = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const put = (board, cells, who) => {
  const b = board.map((r) => r.slice());
  cells.forEach(([r, c]) => { b[r][c] = who; });
  return b;
};

describe('board basics', () => {
  it('is 5 rows by 6 columns', () => {
    const b = emptyBoard();
    expect(b).toHaveLength(ROWS);
    expect(b[0]).toHaveLength(COLS);
    expect(ROWS).toBe(5);
    expect(COLS).toBe(6);
  });

  it('drops to the bottom, stacks, and reports a full column', () => {
    let b = emptyBoard();
    expect(dropRow(b, 2)).toBe(4);
    for (let i = 0; i < ROWS; i += 1) b = applyMove(b, 2, 'dor');
    expect(b[0][2]).toBe('dor');
    expect(dropRow(b, 2)).toBe(-1);
    expect(applyMove(b, 2, 'bot')).toBe(b);
    expect(dropRow(b, 3)).toBe(4);
  });

  it('detects a full board', () => {
    const b = emptyBoard();
    expect(isFull(b)).toBe(false);
    expect(isFull(b.map((row) => row.map(() => 'bot')))).toBe(true);
  });
});

describe('winnerLine', () => {
  it('finds horizontal, vertical and both diagonals', () => {
    const horiz = put(emptyBoard(), [[4, 1], [4, 2], [4, 3], [4, 4]], 'dor');
    expect(winnerLine(horiz)).toHaveLength(4);
    expect(winnerOf(horiz)).toBe('dor');

    const vert = put(emptyBoard(), [[1, 5], [2, 5], [3, 5], [4, 5]], 'bot');
    expect(winnerLine(vert)).toEqual([[1, 5], [2, 5], [3, 5], [4, 5]]);
    expect(winnerOf(vert)).toBe('bot');

    const down = put(emptyBoard(), [[0, 0], [1, 1], [2, 2], [3, 3]], 'dor');
    expect(winnerLine(down)).toEqual([[0, 0], [1, 1], [2, 2], [3, 3]]);

    const up = put(emptyBoard(), [[4, 1], [3, 2], [2, 3], [1, 4]], 'dor');
    expect(winnerLine(up)).toEqual([[1, 4], [2, 3], [3, 2], [4, 1]]);
    expect(winnerOf(up)).toBe('dor');
  });

  it('returns null for three in a row and for mixed owners', () => {
    expect(winnerLine(put(emptyBoard(), [[4, 0], [4, 1], [4, 2]], 'dor'))).toBeNull();
    const mixed = put(put(emptyBoard(), [[4, 0], [4, 1]], 'dor'), [[4, 2], [4, 3]], 'bot');
    expect(winnerLine(mixed)).toBeNull();
  });
});

describe('chooseMove', () => {
  const threeBot = () => put(emptyBoard(), [[4, 0], [4, 1], [4, 2]], 'bot');
  const threeDor = () => put(emptyBoard(), [[4, 0], [4, 1], [4, 2]], 'dor');

  it('always plays a legal column', () => {
    const b = emptyBoard();
    for (let i = 0; i < ROWS; i += 1) b[i][0] = i % 2 ? 'dor' : 'bot';
    for (const d of [GAME_DIFFICULTY.EASY, GAME_DIFFICULTY.MEDIUM, GAME_DIFFICULTY.HARD]) {
      for (let s = 0; s < 30; s += 1) {
        const c = chooseMove(b, d, mulberry(s));
        expect(dropRow(b, c)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('medium and hard take their own win', () => {
    for (let s = 0; s < 30; s += 1) {
      expect(chooseMove(threeBot(), GAME_DIFFICULTY.MEDIUM, mulberry(s))).toBe(3);
      expect(chooseMove(threeBot(), GAME_DIFFICULTY.HARD, mulberry(s))).toBe(3);
    }
  });

  it('hard always blocks Dor', () => {
    expect(winningColumn(threeDor(), 'dor')).toBe(3);
    for (let s = 0; s < 50; s += 1) {
      expect(chooseMove(threeDor(), GAME_DIFFICULTY.HARD, mulberry(s))).toBe(3);
    }
  });

  it('medium blocks only about half the time', () => {
    let blocks = 0;
    for (let s = 0; s < 400; s += 1) {
      if (chooseMove(threeDor(), GAME_DIFFICULTY.MEDIUM, mulberry(s)) === 3) blocks += 1;
    }
    expect(blocks).toBeGreaterThan(150);
    expect(blocks).toBeLessThan(290);
  });

  it('easy usually misses a win', () => {
    let wins = 0;
    for (let s = 0; s < 400; s += 1) {
      if (chooseMove(threeBot(), GAME_DIFFICULTY.EASY, mulberry(s)) === 3) wins += 1;
    }
    expect(wins).toBeLessThan(200);
  });
});

describe('easy bot is beatable', () => {
  /** A simple child-like player: win now, block if obvious, else stack on the best column. */
  const scripted = (board) => {
    const w = winningColumn(board, 'dor');
    if (w >= 0) return w;
    const b = winningColumn(board, 'bot');
    if (b >= 0) return b;
    for (const c of [2, 3, 1, 4, 0, 5]) if (dropRow(board, c) >= 0) return c;
    return -1;
  };

  const play = (seed, difficulty) => {
    const rng = mulberry(seed);
    let board = emptyBoard();
    for (let turn = 0; turn < ROWS * COLS; turn += 1) {
      const who = turn % 2 === 0 ? 'dor' : 'bot';
      const c = who === 'dor' ? scripted(board) : chooseMove(board, difficulty, rng);
      board = applyMove(board, c, who);
      const w = winnerOf(board);
      if (w) return w;
    }
    return 'draw';
  };

  it('loses to a simple player in most seeded games', () => {
    let dorWins = 0;
    const games = 300;
    for (let s = 1; s <= games; s += 1) if (play(s, GAME_DIFFICULTY.EASY) === 'dor') dorWins += 1;
    expect(dorWins / games).toBeGreaterThan(0.75);
  });
});
