import { TOP_TIER } from './mergeConfig';

/** A board is a flat array, row-major; a cell is a tier number or null. */

export const emptyBoard = (rows, cols) => Array(rows * cols).fill(null);

export function hasMerge(board) {
  const seen = new Set();
  for (const t of board) {
    if (t == null || t >= TOP_TIER) continue;
    if (seen.has(t)) return true;
    seen.add(t);
  }
  return false;
}

export function canMerge(board, from, to) {
  return from !== to && board[from] != null && board[from] === board[to] && board[from] < TOP_TIER;
}

/** Drag `from` onto `to`: `to` becomes the next animal, `from` is emptied. */
export function merge(board, from, to) {
  if (!canMerge(board, from, to)) return board;
  const next = board.slice();
  next[to] = board[to] + 1;
  next[from] = null;
  return next;
}

export function hasWon(board, goal) {
  return board.some((t) => t != null && t >= goal);
}

const pick = (arr, rng) => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];

/**
 * Add one animal, always leaving a legal merge. A baby (sometimes a chick) goes
 * in a random empty cell; if that leaves no pair, a copy of an existing animal
 * goes there instead. A full board with no pair gets one tile quietly swapped
 * for a copy of another. Returns a new board.
 */
export function spawn(board, rng = Math.random) {
  const next = board.slice();
  const empties = [];
  const mergeable = [];
  next.forEach((t, i) => {
    if (t == null) empties.push(i);
    else if (t < TOP_TIER) mergeable.push(i);
  });

  if (empties.length === 0) {
    if (!hasMerge(next) && mergeable.length >= 2) {
      const a = pick(mergeable, rng);
      const rest = mergeable.filter((i) => i !== a);
      next[a] = next[pick(rest, rng)];
    }
    return next;
  }

  const cell = pick(empties, rng);
  next[cell] = rng() < 0.2 ? 1 : 0;
  if (!hasMerge(next)) {
    const others = mergeable.filter((i) => i !== cell);
    if (others.length) next[cell] = next[pick(others, rng)];
  }
  return next;
}

/** A fresh round: `count` animals, guaranteed to hold a pair. */
export function newBoard(rows, cols, count, rng = Math.random) {
  let board = emptyBoard(rows, cols);
  for (let i = 0; i < count; i += 1) board = spawn(board, rng);
  if (!hasMerge(board)) board = spawn(board, rng);
  return board;
}

/** Cheapest legal pair (lowest tier first) — the greedy player and a hint. */
export function bestPair(board) {
  let best = null;
  for (let a = 0; a < board.length; a += 1) {
    if (board[a] == null) continue;
    for (let b = a + 1; b < board.length; b += 1) {
      if (canMerge(board, a, b) && (best == null || board[a] < board[best[0]])) best = [a, b];
    }
  }
  return best;
}

/** One full move: merge, then spawn. */
export function play(board, from, to, rng = Math.random) {
  return spawn(merge(board, from, to), rng);
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
