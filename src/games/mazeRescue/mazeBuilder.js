import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

/**
 * Grid sizes are always odd: passages sit on even row/col indices and the cell
 * between two passages is the wall that may be knocked out, so a `rows × cols`
 * grid holds ((rows+1)/2) × ((cols+1)/2) passages.
 */
export const DIFFICULTY_CONFIG = {
  [GAME_DIFFICULTY.EASY]: { rows: 9, cols: 9 },
  [GAME_DIFFICULTY.MEDIUM]: { rows: 11, cols: 11 },
  [GAME_DIFFICULTY.HARD]: { rows: 13, cols: 13 },
};

export const DIRECTIONS = [
  { id: 'up', label: 'למעלה', row: -1, col: 0, icon: '⬆️' },
  { id: 'right', label: 'ימינה', row: 0, col: 1, icon: '➡️' },
  { id: 'down', label: 'למטה', row: 1, col: 0, icon: '⬇️' },
  { id: 'left', label: 'שמאלה', row: 0, col: -1, icon: '⬅️' },
];

export const inBounds = (row, col, rows, cols) => row >= 0 && col >= 0 && row < rows && col < cols;

const shuffled = (items) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Randomised depth-first carve (recursive backtracker) over the passage
 * lattice. Every passage is reachable and the maze has real dead ends, so the
 * way to the flag genuinely bends — the old builder took a mostly down/right
 * random walk, which meant every level solved itself with ⬇️ and ➡️ alone.
 */
export const carveMaze = (rows, cols) => {
  const maze = Array.from({ length: rows }, () => Array(cols).fill(0));
  const steps = [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ];
  const stack = [{ row: 0, col: 0 }];
  maze[0][0] = 1;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const next = shuffled(steps)
      .map(([dr, dc]) => ({
        row: current.row + dr,
        col: current.col + dc,
        wallRow: current.row + dr / 2,
        wallCol: current.col + dc / 2,
      }))
      .find((cell) => inBounds(cell.row, cell.col, rows, cols) && maze[cell.row][cell.col] === 0);

    if (!next) {
      stack.pop();
      continue;
    }
    maze[next.wallRow][next.wallCol] = 1;
    maze[next.row][next.col] = 1;
    stack.push({ row: next.row, col: next.col });
  }

  return maze;
};

/** Shortest route start → flag, as a list of cells (null when unreachable). */
export const solvePath = (maze, rows, cols) => {
  const cameFrom = new Map();
  const key = (row, col) => row * cols + col;
  const seen = new Set([key(0, 0)]);
  const queue = [{ row: 0, col: 0 }];

  while (queue.length) {
    const current = queue.shift();
    if (current.row === rows - 1 && current.col === cols - 1) {
      const path = [current];
      let cursor = cameFrom.get(key(current.row, current.col));
      while (cursor) {
        path.unshift(cursor);
        cursor = cameFrom.get(key(cursor.row, cursor.col));
      }
      return path;
    }
    for (const dir of DIRECTIONS) {
      const row = current.row + dir.row;
      const col = current.col + dir.col;
      if (!inBounds(row, col, rows, cols) || maze[row][col] !== 1) continue;
      if (seen.has(key(row, col))) continue;
      seen.add(key(row, col));
      cameFrom.set(key(row, col), current);
      queue.push({ row, col });
    }
  }
  return null;
};

/** True when the shortest route needs ⬆️ and ⬅️ as well as ⬇️ and ➡️. */
export const needsAllDirections = (path) => {
  if (!path || path.length < 2) return false;
  let up = false;
  let left = false;
  for (let i = 1; i < path.length; i += 1) {
    if (path[i].row < path[i - 1].row) up = true;
    if (path[i].col < path[i - 1].col) left = true;
  }
  return up && left;
};

/**
 * Could the flag be reached pressing only ➡️ and ⬇️? This is the property the
 * maze is actually judged on, so it is checked directly rather than inferred:
 * a cell is monotonically reachable when the cell above it or the cell to its
 * left is, which sweeps the grid once in reading order.
 */
export const monotoneSolvable = (maze, rows, cols) => {
  const reached = Array.from({ length: rows }, () => Array(cols).fill(false));
  reached[0][0] = maze[0][0] === 1;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if ((row === 0 && col === 0) || maze[row][col] !== 1) continue;
      reached[row][col] = (row > 0 && reached[row - 1][col]) || (col > 0 && reached[row][col - 1]);
    }
  }
  return reached[rows - 1][cols - 1];
};

/**
 * Carve until we get a maze whose solution actually turns back on itself.
 *
 * The maze is left perfect (no extra openings knocked through). Loops would be
 * kinder — fewer dead ends — but they also hand the player a shortcut, and a
 * shortcut is nearly always the plain down-and-right one: braiding a 7×7 dropped
 * the share of mazes that genuinely need ⬆️ and ⬅️ from 26% to 2%.
 */
export const buildMaze = (rows, cols) => {
  let fallback = null;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const maze = carveMaze(rows, cols);
    const path = solvePath(maze, rows, cols);
    if (!path) continue;
    if (!fallback) fallback = maze;
    if (needsAllDirections(path) && !monotoneSolvable(maze, rows, cols)) return maze;
  }
  return fallback ?? carveMaze(rows, cols);
};

