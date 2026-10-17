import { describe, it, expect } from 'vitest';
import {
  assignColors, canExit, firstBlocker, generateBoard, head, movableArrows, removeArrow,
} from './arrowBoard';
import { ARROW_COLORS, ARROW_DIFFICULTY } from './arrowConfig';

const SEEDS = Array.from({ length: 120 }, (_, i) => i + 1);

describe.each(Object.keys(ARROW_DIFFICULTY))('arrow boards: %s', (level) => {
  const cfg = ARROW_DIFFICULTY[level];

  it('covers every cell exactly once with contiguous arrows', () => {
    SEEDS.forEach((seed) => {
      const b = generateBoard(cfg, seed);
      const seen = new Set();
      b.arrows.forEach((a) => {
        expect(a.cells.length).toBeGreaterThanOrEqual(1);
        expect(a.cells.length).toBeLessThanOrEqual(cfg.maxLen);
        a.cells.forEach((p, i) => {
          const k = `${p.r},${p.c}`;
          expect(seen.has(k)).toBe(false);
          seen.add(k);
          if (i > 0) {
            const q = a.cells[i - 1];
            expect(Math.abs(p.r - q.r) + Math.abs(p.c - q.c)).toBe(1);
          }
        });
      });
      expect(seen.size).toBe(b.rows * b.cols);
    });
  });

  it('is cleared by a greedy solver', () => {
    SEEDS.forEach((seed) => {
      let b = generateBoard(cfg, seed);
      while (b.arrows.length) {
        const m = movableArrows(b);
        expect(m.length).toBeGreaterThan(0);
        b = removeArrow(b, m[0].id);
      }
      expect(b.arrows).toHaveLength(0);
    });
  });

  it('is deterministic for a seed', () => {
    expect(generateBoard(cfg, 7)).toEqual(generateBoard(cfg, 7));
  });
});

describe('easy / medium shape', () => {
  it('easy is 4x4 with only straight arrows', () => {
    SEEDS.forEach((seed) => {
      const b = generateBoard(ARROW_DIFFICULTY.easy, seed);
      expect([b.rows, b.cols]).toEqual([4, 4]);
      b.arrows.forEach((a) => {
        expect(new Set(a.cells.map((p) => p.r)).size === 1
          || new Set(a.cells.map((p) => p.c)).size === 1).toBe(true);
      });
    });
  });

  it('medium produces some bent snakes', () => {
    const bent = SEEDS.some((seed) => generateBoard(ARROW_DIFFICULTY.medium, seed).arrows.some(
      (a) => new Set(a.cells.map((p) => p.r)).size > 1 && new Set(a.cells.map((p) => p.c)).size > 1
    ));
    expect(bent).toBe(true);
  });
});

describe('exit rules', () => {
  const board = {
    rows: 2,
    cols: 3,
    arrows: [
      { id: 'x', cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }], dir: 'right' },
      { id: 'y', cells: [{ r: 0, c: 2 }], dir: 'up' },
      { id: 'z', cells: [{ r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }], dir: 'right' },
    ],
  };
  it('reports blockers', () => {
    expect(firstBlocker(board, 'x')).toBe('y');
    expect(canExit(board, 'x')).toBe(false);
    expect(canExit(board, 'y')).toBe(true);
    expect(movableArrows(board).map((a) => a.id)).toEqual(['y', 'z']);
    expect(head(board.arrows[0])).toEqual({ r: 0, c: 1 });
  });
  it('assigns colours, differing between neighbours', () => {
    const colors = assignColors(board, ARROW_COLORS);
    expect(colors.x).not.toBe(colors.y);
    expect(colors.x).not.toBe(colors.z);
  });
});
