import { describe, it, expect } from 'vitest';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import {
  BOT, DOR, LINES, chooseMove, emptyBoard, isFull, winnerLine, winnerOf, winningCell,
} from './ticTacToeLogic';

const seeded = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const boardWith = (dor, bot) => {
  const b = emptyBoard();
  dor.forEach((i) => { b[i] = DOR; });
  bot.forEach((i) => { b[i] = BOT; });
  return b;
};

describe('winnerLine', () => {
  it('detects all 8 lines for either player', () => {
    expect(LINES).toHaveLength(8);
    for (const line of LINES) {
      for (const who of [DOR, BOT]) {
        const b = emptyBoard();
        line.forEach((i) => { b[i] = who; });
        expect(winnerLine(b)).toEqual(line);
        expect(winnerOf(b)).toBe(who);
      }
    }
  });
  it('is null on an empty or mixed board', () => {
    expect(winnerLine(emptyBoard())).toBeNull();
    expect(winnerLine(boardWith([0, 1, 5], [2, 3, 4]))).toBeNull();
  });
  it('isFull', () => {
    expect(isFull(emptyBoard())).toBe(false);
    expect(isFull(boardWith([0, 1, 5, 6, 7], [2, 3, 4, 8]))).toBe(true);
  });
});

describe('chooseMove', () => {
  it('returns -1 on a full board', () => {
    expect(chooseMove(boardWith([0, 1, 5, 6, 7], [2, 3, 4, 8]), 'hard', Math.random)).toBe(-1);
  });
  it('medium and hard always take a win', () => {
    const w = boardWith([0, 1], [3, 4]); // bot wins at 5
    for (const d of [GAME_DIFFICULTY.MEDIUM, GAME_DIFFICULTY.HARD]) {
      for (let s = 1; s < 30; s += 1) expect(chooseMove(w, d, seeded(s))).toBe(5);
    }
  });
  it('easy takes a win only sometimes', () => {
    const w = boardWith([0, 1], [3, 4]);
    let hits = 0;
    for (let s = 1; s <= 300; s += 1) if (chooseMove(w, GAME_DIFFICULTY.EASY, seeded(s)) === 5) hits += 1;
    expect(hits).toBeGreaterThan(40);
    expect(hits).toBeLessThan(200);
  });
  it('hard always blocks', () => {
    const b = boardWith([0, 1], [4]); // Dor threatens 2; bot has no win
    for (let s = 1; s < 40; s += 1) expect(chooseMove(b, GAME_DIFFICULTY.HARD, seeded(s))).toBe(2);
  });
  it('medium blocks about half the time', () => {
    const b = boardWith([0, 1], [4]);
    let blocks = 0;
    for (let s = 1; s <= 400; s += 1) if (chooseMove(b, GAME_DIFFICULTY.MEDIUM, seeded(s)) === 2) blocks += 1;
    expect(blocks).toBeGreaterThan(160);
    expect(blocks).toBeLessThan(300);
  });
  it('hard prefers centre then corners', () => {
    expect(chooseMove(emptyBoard(), GAME_DIFFICULTY.HARD, seeded(1))).toBe(4);
    const b = boardWith([4], []);
    expect([0, 2, 6, 8]).toContain(chooseMove(b, GAME_DIFFICULTY.HARD, seeded(2)));
  });
  it('only picks open cells', () => {
    const b = boardWith([0, 4], [1]);
    for (let s = 1; s < 50; s += 1) expect(b[chooseMove(b, GAME_DIFFICULTY.EASY, seeded(s))]).toBeNull();
  });
});

describe('easy bot vs a simple scripted player', () => {
  const play = (seed, difficulty) => {
    const rng = seeded(seed);
    let b = emptyBoard();
    const order = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    for (;;) {
      const mine = winningCell(b, DOR);
      const cell = mine >= 0 ? mine : order.find((i) => b[i] === null);
      b = b.slice(); b[cell] = DOR;
      if (winnerOf(b)) return DOR;
      if (isFull(b)) return null;
      b[chooseMove(b, difficulty, rng)] = BOT;
      if (winnerOf(b)) return BOT;
    }
  };
  it('loses most games', () => {
    let dorWins = 0;
    for (let s = 1; s <= 200; s += 1) if (play(s, GAME_DIFFICULTY.EASY) === DOR) dorWins += 1;
    expect(dorWins).toBeGreaterThan(100);
  });
  it('hard can still be beaten by a fork', () => {
    // Dor: 0, bot centre, Dor 8, bot (corner) ... a fork exists against greedy block play
    const b = boardWith([0, 8], [4]);
    // bot hard has no threat to block: it takes a corner (2 or 6); Dor then forks via the other corner
    const m = chooseMove(b, GAME_DIFFICULTY.HARD, seeded(3));
    expect([2, 6]).toContain(m);
  });
});
