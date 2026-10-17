import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

export const DOR = 'dor';
export const BOT = 'bot';
export const EMPTY = null;

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const emptyBoard = () => Array(9).fill(EMPTY);

/** The 3 winning cell indexes of the first complete line, or null. */
export function winnerLine(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] !== EMPTY && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

export const winnerOf = (board) => {
  const line = winnerLine(board);
  return line ? board[line[0]] : null;
};

export const isFull = (board) => board.every((cell) => cell !== EMPTY);

export const openCells = (board) => board.reduce((out, cell, i) => (cell === EMPTY ? [...out, i] : out), []);

/** A cell where `who` would complete a line right now, or -1. */
export function winningCell(board, who) {
  for (const [a, b, c] of LINES) {
    const trio = [a, b, c];
    const mine = trio.filter((i) => board[i] === who).length;
    const empty = trio.filter((i) => board[i] === EMPTY);
    if (mine === 2 && empty.length === 1) return empty[0];
  }
  return -1;
}

/** Per-difficulty chance of noticing "I can win" and "Dor is about to win". */
const SKILL = {
  [GAME_DIFFICULTY.EASY]: { win: 0.3, block: 0, prefer: false },
  [GAME_DIFFICULTY.MEDIUM]: { win: 1, block: 0.5, prefer: false },
  [GAME_DIFFICULTY.HARD]: { win: 1, block: 1, prefer: true },
};

const pick = (list, rng) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

/**
 * A gentle opponent. It only ever looks one move ahead, never plans forks,
 * so Dor can still win by setting up two threats at once.
 */
export function chooseMove(board, difficulty = GAME_DIFFICULTY.EASY, rng = Math.random) {
  const open = openCells(board);
  if (open.length === 0) return -1;
  const skill = SKILL[difficulty] || SKILL[GAME_DIFFICULTY.EASY];

  const win = winningCell(board, BOT);
  if (win >= 0 && rng() < skill.win) return win;

  const block = winningCell(board, DOR);
  if (block >= 0 && rng() < skill.block) return block;

  if (skill.prefer) {
    if (open.includes(4)) return 4;
    const corners = open.filter((i) => i === 0 || i === 2 || i === 6 || i === 8);
    if (corners.length > 0) return pick(corners, rng);
  }
  return pick(open, rng);
}
