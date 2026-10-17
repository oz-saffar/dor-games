import { DIRS, head, rayCells } from './arrowBoard';

/**
 * Path geometry in cell units (cell centres at +0.5). An arrow's body is a
 * window of fixed arc length sliding along `path`: the cells it covers now,
 * continued straight off the board in the head direction. Sliding the window
 * makes the tail follow exactly the cells the head passed through.
 */
export function buildPath(board, arrow) {
  const pts = arrow.cells.map((p) => [p.c + 0.5, p.r + 0.5]);
  const { dr, dc } = DIRS[arrow.dir];
  const h = head(arrow);
  const extra = rayCells(board, arrow).length + arrow.cells.length + 3;
  for (let i = 1; i <= extra; i += 1) pts.push([h.c + 0.5 + dc * i, h.r + 0.5 + dr * i]);
  return pts;
}

/** Arc distance the window must travel for the whole arrow to clear the board. */
export function slideDistance(board, arrow) {
  return rayCells(board, arrow).length + 0.5 + arrow.cells.length;
}

/** Points of `path` between arc positions a and b (unit-length segments). */
export function sliceArc(path, a, b) {
  const out = [];
  const point = (s) => {
    const i = Math.min(Math.floor(s), path.length - 2);
    const t = s - i;
    return [
      path[i][0] + (path[i + 1][0] - path[i][0]) * t,
      path[i][1] + (path[i + 1][1] - path[i][1]) * t,
    ];
  };
  out.push(point(a));
  for (let i = Math.floor(a) + 1; i < b; i += 1) out.push(path[i]);
  if (b > a) out.push(point(b));
  return out;
}

/** Triangle (cell units) with its tip pointing along `dir` from head centre. */
export function headTriangle(dir, [x, y]) {
  const { dr, dc } = DIRS[dir];
  // Tip and base stay inside the head's own cell, so an arrow on the edge
  // is never clipped and neighbouring heads never touch.
  const tip = [x + dc * 0.4, y + dr * 0.4];
  const bx = x - dc * 0.1;
  const by = y - dr * 0.1;
  const w = 0.34;
  return [tip, [bx - dr * w, by + dc * w], [bx + dr * w, by - dc * w]];
}

export const toPoints = (pts) => pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ');
