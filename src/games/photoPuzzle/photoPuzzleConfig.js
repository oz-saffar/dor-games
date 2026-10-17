/** Photo Puzzle — constants, grid maths and the no-photo fallback artwork. */

/** Accent colour for this game (cyan). */
export const ACCENT = 'var(--game-accent)';

/** ms the seam-dissolve plays before the celebration overlay appears. */
export const DISSOLVE_MS = 780;
/** ms the celebration overlay stays up before the next round auto-starts. */
export const CELEBRATION_MS = 3100;
/** ms a wrongly-dropped piece spends drifting back to the tray. */
export const WOBBLE_MS = 520;
/** ms the success sweep + sparkles live on a freshly locked piece. */
export const LOCK_MS = 900;

export const MIN_PIECES = 4;
export const MAX_PIECES = 24;

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Piece counts we can actually lay out, as [major, minor] — major is the longer
 * side of the grid. Anything in 4..24 that is not a key snaps DOWN to the
 * nearest key, so 13 pieces quietly becomes 12 rather than an ugly 13×1 strip.
 */
const GRIDS = {
  4: [2, 2],
  6: [3, 2],
  8: [4, 2],
  9: [3, 3],
  10: [5, 2],
  12: [4, 3],
  14: [7, 2],
  15: [5, 3],
  16: [4, 4],
  18: [6, 3],
  20: [5, 4],
  21: [7, 3],
  24: [6, 4],
};

const GRID_KEYS = Object.keys(GRIDS)
  .map(Number)
  .sort((a, b) => a - b);

/** Snap an arbitrary 4..24 request down to a count we have a real grid for. */
export function snapPieceCount(count) {
  const n = clamp(Math.round(Number(count) || MIN_PIECES), MIN_PIECES, MAX_PIECES);
  let best = GRID_KEYS[0];
  for (const k of GRID_KEYS) {
    if (k <= n) best = k;
  }
  return best;
}

/**
 * Map a piece count onto a near-square grid, transposed for the orientation so
 * pieces stay chunky: wide screens get more columns, tall screens more rows.
 */
export function gridFor(count, landscape = true) {
  const total = snapPieceCount(count);
  const [major, minor] = GRIDS[total];
  const cols = landscape ? major : minor;
  const rows = landscape ? minor : major;
  return { cols, rows, total: cols * rows };
}

/* ── Fallback artwork ─────────────────────────────────────────────────────
 * When Dor's photos are missing (they only exist on the production server) we
 * still need something worth assembling. These are plain CSS background
 * shorthands built from percentage-positioned gradients, so they slice with the
 * exact same backgroundSize / backgroundPosition trick a real photo does — the
 * puzzle plays identically, it is just a picture made of light instead.
 */
const PALETTES = [
  ['#0e7490', '#22d3ee', '#a5f3fc', '#fde68a', '#fb7185'],
  ['#4c1d95', '#a78bfa', '#f0abfc', '#fef08a', '#34d399'],
  ['#065f46', '#34d399', '#bbf7d0', '#fdba74', '#60a5fa'],
  ['#9a3412', '#fb923c', '#fed7aa', '#a7f3d0', '#818cf8'],
  ['#1e3a8a', '#60a5fa', '#bfdbfe', '#fcd34d', '#f472b6'],
  ['#831843', '#f472b6', '#fbcfe8', '#fde047', '#5eead4'],
];

const blob = (color, x, y, r) =>
  `radial-gradient(circle at ${x}% ${y}%, ${color} 0%, ${color} ${r * 0.45}%, transparent ${r}%)`;

/** Build one colourful, seamless fallback "picture" as a CSS background value. */
export function makeFallbackArt() {
  const [deep, mid, light, warm, pop] = pick(PALETTES);
  const layers = [
    blob(pop, rand(12, 34), rand(14, 34), rand(30, 44)),
    blob(warm, rand(64, 88), rand(12, 32), rand(26, 40)),
    blob(light, rand(20, 46), rand(62, 86), rand(30, 46)),
    blob(mid, rand(58, 84), rand(58, 84), rand(32, 48)),
    blob(light, rand(40, 60), rand(40, 60), rand(22, 34)),
    `linear-gradient(${Math.round(rand(120, 240))}deg, ${deep} 0%, ${mid} 55%, ${deep} 100%)`,
  ];
  return layers.join(', ');
}

/**
 * Scatter tray slots along the tray strip. Pieces are laid out in a loose grid
 * so nothing is fully buried, with a little jitter so it reads as a pile of
 * pieces rather than a menu.
 */
export function trayRowsFor(count, trayW, pieceW) {
  const perRow = Math.max(1, Math.min(count, Math.floor(trayW / (pieceW * 0.92))));
  return { perRow, rows: Math.ceil(count / perRow) };
}

/**
 * How much to shrink tray pieces so a big pile (24 slices) does not bury itself.
 * Pieces grow back to full size the moment they are picked up.
 */
export function trayScaleFor(count, tray, pieceH) {
  const { rows } = trayRowsFor(count, tray.w, pieceH);
  const needed = pieceH * (1 + 0.74 * (rows - 1));
  return clamp((tray.h - 12) / needed, 0.5, 1);
}

export function trayLayout(count, tray, pieceW, pieceH) {
  const { perRow, rows } = trayRowsFor(count, tray.w, pieceW);
  const stepX = tray.w / perRow;
  const stepY = rows > 1 ? Math.min(pieceH * 0.72, tray.h / rows) : 0;
  const startY = tray.y + tray.h / 2 - (stepY * (rows - 1)) / 2;

  const spots = [];
  for (let i = 0; i < count; i += 1) {
    const r = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - r * perRow);
    const c = i - r * perRow;
    const rowW = stepX * inRow;
    const rowX = tray.x + (tray.w - rowW) / 2;
    spots.push({
      x: rowX + stepX * (c + 0.5) + rand(-6, 6),
      y: startY + stepY * r + rand(-5, 5),
      tilt: rand(-7, 7),
    });
  }
  return spots;
}

/** Fisher–Yates, non-mutating. */
export function shuffle(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
