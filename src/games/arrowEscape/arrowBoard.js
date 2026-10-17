/**
 * חצים board model — pure JS, no React.
 *
 * A board is { rows, cols, arrows }. Each arrow is { id, cells, dir } where
 * `cells` runs tail -> head (the head is the LAST cell) and `dir` is one of
 * 'up' | 'down' | 'left' | 'right'. An arrow can leave when the straight ray
 * from its head to the board edge holds no cell of another remaining arrow.
 *
 * Solvable by construction: arrows are INSERTED one at a time and each new
 * arrow's ray must be clear of every arrow already on the board. Removal runs
 * in reverse insertion order: when arrow k leaves, only arrows inserted before
 * it remain, and its ray was clear of exactly those. `arrows` is stored in
 * removal order (last inserted first), which is therefore a valid solution.
 */

export const DIRS = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};
const DIR_NAMES = Object.keys(DIRS);

/** Deterministic RNG (mulberry32). */
export function makeRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (r, c) => `${r},${c}`;

export const head = (arrow) => arrow.cells[arrow.cells.length - 1];

/** Cells strictly beyond the head, out to the board edge. */
export function rayCells(board, arrow) {
  const { dr, dc } = DIRS[arrow.dir];
  const h = head(arrow);
  const out = [];
  let r = h.r + dr;
  let c = h.c + dc;
  while (r >= 0 && r < board.rows && c >= 0 && c < board.cols) {
    out.push({ r, c });
    r += dr;
    c += dc;
  }
  return out;
}

function ownerMap(board) {
  const m = new Map();
  board.arrows.forEach((a) => a.cells.forEach((p) => m.set(key(p.r, p.c), a.id)));
  return m;
}

/** Id of the nearest other arrow in the way, or null. */
export function firstBlocker(board, arrowId) {
  const arrow = board.arrows.find((a) => a.id === arrowId);
  if (!arrow) return null;
  const owners = ownerMap(board);
  for (const p of rayCells(board, arrow)) {
    const o = owners.get(key(p.r, p.c));
    if (o != null && o !== arrowId) return o;
  }
  return null;
}

export const canExit = (board, arrowId) =>
  board.arrows.some((a) => a.id === arrowId) && firstBlocker(board, arrowId) == null;

export const movableArrows = (board) =>
  board.arrows.filter((a) => firstBlocker(board, a.id) == null);

export const removeArrow = (board, arrowId) => ({
  ...board,
  arrows: board.arrows.filter((a) => a.id !== arrowId),
});

/** Greedy colour pick so touching arrows differ where the palette allows. */
export function assignColors(board, palette) {
  const owners = ownerMap(board);
  const colors = {};
  board.arrows.forEach((a, i) => {
    const used = new Set();
    a.cells.forEach(({ r, c }) => {
      Object.values(DIRS).forEach(({ dr, dc }) => {
        const o = owners.get(key(r + dr, c + dc));
        if (o != null && o !== a.id && colors[o] != null) used.add(colors[o]);
      });
    });
    const free = palette.filter((p) => !used.has(p));
    const pool = free.length ? free : palette;
    colors[a.id] = pool[i % pool.length];
  });
  return colors;
}

const inside = (rows, cols, r, c) => r >= 0 && r < rows && c >= 0 && c < cols;

/** Empty (cell, direction) pairs whose ray is clear of everything placed so far. */
function headCandidates(rows, cols, occ, rng) {
  const centre = { r: (rows - 1) / 2, c: (cols - 1) / 2 };
  const cands = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (!occ.has(key(r, c))) {
        for (const d of DIR_NAMES) {
          const { dr, dc } = DIRS[d];
          let clear = true;
          for (let rr = r + dr, cc = c + dc; inside(rows, cols, rr, cc); rr += dr, cc += dc) {
            if (occ.has(key(rr, cc))) { clear = false; break; }
          }
          // central cells first: edge cells stay easy to place late
          const dist = Math.abs(r - centre.r) + Math.abs(c - centre.c);
          if (clear) cands.push({ r, c, d, w: dist + rng() * 1.6 });
        }
      }
    }
  }
  return cands.sort((a, b) => a.w - b.w);
}

/** Grow a body backwards from the head; returns cells head-first. */
function growBody(pick, targetLen, ctx) {
  const { rows, cols, occ, cfg, rng } = ctx;
  const { dr, dc } = DIRS[pick.d];
  const rayKeys = new Set();
  for (let rr = pick.r + dr, cc = pick.c + dc; inside(rows, cols, rr, cc); rr += dr, cc += dc) {
    rayKeys.add(key(rr, cc));
  }
  const body = [{ r: pick.r, c: pick.c }];
  const used = new Set([key(pick.r, pick.c)]);
  while (body.length < targetLen) {
    const tip = body[body.length - 1];
    const straight = { r: tip.r - dr, c: tip.c - dc };
    let options = [straight];
    if (body.length > 1 && cfg.bendy) {
      options = Object.values(DIRS)
        .map((v) => ({ r: tip.r + v.dr, c: tip.c + v.dc }))
        .sort(() => rng() - 0.5);
      if (rng() < 0.45) options.unshift(straight);
    }
    const next = options.find(
      (p) => inside(rows, cols, p.r, p.c) && !occ.has(key(p.r, p.c))
        && !used.has(key(p.r, p.c)) && !rayKeys.has(key(p.r, p.c))
    );
    if (!next) break;
    body.push(next);
    used.add(key(next.r, next.c));
  }
  return body;
}

/** One attempt; returns a board or null if it got stuck. */
function attempt(rows, cols, cfg, rng) {
  const occ = new Set();
  const inserted = [];
  while (occ.size < rows * cols) {
    const cands = headCandidates(rows, cols, occ, rng);
    if (!cands.length) return null;
    const targetLen = cfg.minLen + Math.floor(rng() * (cfg.maxLen - cfg.minLen + 1));
    const body = growBody(cands[0], targetLen, { rows, cols, occ, cfg, rng });
    body.forEach((p) => occ.add(key(p.r, p.c)));
    inserted.push({ cells: body.reverse(), dir: cands[0].d }); // tail -> head
  }
  const arrows = inserted.reverse().map((a, i) => ({ id: `a${i}`, ...a }));
  return { rows, cols, arrows };
}

/** Always-solvable fallback: single cells pointing up, top row leaves first. */
function fallbackBoard(rows, cols) {
  const arrows = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      arrows.push({ id: `a${arrows.length}`, cells: [{ r, c }], dir: 'up' });
    }
  }
  return { rows, cols, arrows };
}

export function generateBoard(cfg, seed = Math.floor(Math.random() * 2 ** 31)) {
  const rng = makeRng(seed);
  const [rows, cols] = cfg.sizes[Math.floor(rng() * cfg.sizes.length)];
  for (let i = 0; i < 200; i += 1) {
    const b = attempt(rows, cols, cfg, rng);
    if (b) return b;
  }
  return fallbackBoard(rows, cols);
}
