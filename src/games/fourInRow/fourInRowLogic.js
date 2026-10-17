import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

export const ROWS = 5;
export const COLS = 6;
export const EMPTY = null;
export const DOR = 'dor';
export const BOT = 'bot';

/** board[r][c], r = 0 is the top row. Cells are null | 'dor' | 'bot'. */
export const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));

export const cloneBoard = (board) => board.map((row) => row.slice());

/** Row a disc dropped in column c would land on, or -1 when the column is full. */
export function dropRow(board, c) {
  if (c < 0 || c >= COLS) return -1;
  for (let r = ROWS - 1; r >= 0; r -= 1) {
    if (board[r][c] === EMPTY) return r;
  }
  return -1;
}

/** New board with `who` dropped in column c (same board when the column is full). */
export function applyMove(board, c, who) {
  const r = dropRow(board, c);
  if (r < 0) return board;
  const next = cloneBoard(board);
  next[r][c] = who;
  return next;
}

export const isFull = (board) => board[0].every((cell) => cell !== EMPTY);

export const openColumns = (board) => {
  const out = [];
  for (let c = 0; c < COLS; c += 1) if (board[0][c] === EMPTY) out.push(c);
  return out;
};

const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];

/** The 4 winning cells `[[r, c], ...]` of the first line found, or null. */
export function winnerLine(board) {
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const who = board[r][c];
      if (who === EMPTY) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const cells = [[r, c]];
        for (let k = 1; k < 4; k += 1) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || board[rr][cc] !== who) break;
          cells.push([rr, cc]);
        }
        if (cells.length === 4) return cells;
      }
    }
  }
  return null;
}

/** Who owns the winning line, or null. */
export function winnerOf(board) {
  const line = winnerLine(board);
  return line ? board[line[0][0]][line[0][1]] : null;
}

/** A column where `who` would win right now, or -1. */
export function winningColumn(board, who) {
  for (const c of openColumns(board)) {
    if (winnerOf(applyMove(board, c, who)) === who) return c;
  }
  return -1;
}

/** Per-difficulty chance of noticing "I can win" and "Dor is about to win". */
const SKILL = {
  [GAME_DIFFICULTY.EASY]: { win: 0.3, block: 0.3, centre: false },
  [GAME_DIFFICULTY.MEDIUM]: { win: 1, block: 0.5, centre: false },
  [GAME_DIFFICULTY.HARD]: { win: 1, block: 1, centre: true },
};

const pick = (list, rng) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

/**
 * A gentle opponent. Never looks ahead: it only ever notices a one-move win
 * for itself or for Dor, and on easy it usually doesn't.
 */
export function chooseMove(board, difficulty = GAME_DIFFICULTY.EASY, rng = Math.random) {
  const open = openColumns(board);
  if (open.length === 0) return -1;
  const skill = SKILL[difficulty] || SKILL[GAME_DIFFICULTY.EASY];

  const win = winningColumn(board, BOT);
  if (win >= 0 && rng() < skill.win) return win;

  const block = winningColumn(board, DOR);
  if (block >= 0 && rng() < skill.block) return block;

  if (skill.centre) {
    const middle = open.filter((c) => c === 2 || c === 3);
    if (middle.length > 0) return pick(middle, rng);
  }
  return pick(open, rng);
}
