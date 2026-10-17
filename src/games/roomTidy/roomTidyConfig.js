/**
 * מסדרים את הבית — pure layout, hit-test and projection maths.
 *
 * Deliberately free of React so it can be unit-tested directly, the same split
 * `snakeConfig.js` and `mazeBuilder.js` use.
 *
 * Scene coordinates are **fractions** of the scene box (0–1 on both axes), never
 * pixels, so one scene description serves the 414×896 phone and the 1194×834
 * iPad without a second layout.
 */
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { ACCENTS } from '../../lib/palette';

export const ACCENT = ACCENTS.sand;

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * How close "close enough" is in קשה, measured in fractions of the scene's
 * *height* so the reach is a circle on screen rather than an ellipse.
 */
export const EXACT_REACH = 0.12;

export const CELEBRATION_MS = 3600;
export const LOCK_MS = 420;
export const WOBBLE_MS = 420;

/**
 * The difficulty ladder. It is only ever three numbers plus a hint mode, which
 * is what lets one scene description serve all three.
 */
export const DIFF = {
  [GAME_DIFFICULTY.EASY]: { items: 4, zonePad: 0.035, exact: false, hints: 'all' },
  [GAME_DIFFICULTY.MEDIUM]: { items: 6, zonePad: 0, exact: false, hints: 'active' },
  [GAME_DIFFICULTY.HARD]: { items: 8, zonePad: 0, exact: true, hints: 'none' },
};

export const diffFor = (difficulty) => DIFF[difficulty] ?? DIFF[GAME_DIFFICULTY.EASY];

// ── hit testing ────────────────────────────────────────────────────────────

/** Is (u, v) inside a zone rect, optionally inflated by `pad`? */
export function inZone(u, v, zone, pad = 0) {
  return (
    u >= zone.x - pad
    && u <= zone.x + zone.w + pad
    && v >= zone.y - pad
    && v <= zone.y + zone.h + pad
  );
}

/** The zone under a point, or null. Later zones win where they overlap. */
export function zoneAt(u, v, zones, pad = 0) {
  for (let i = zones.length - 1; i >= 0; i -= 1) {
    if (inZone(u, v, zones[i], pad)) return zones[i];
  }
  return null;
}

/**
 * Does dropping `item` at (u, v) count as correct at this difficulty?
 *
 * קל/בינוני accept anywhere in the right room — a four-year-old knows a
 * toothbrush lives in the bathroom long before they can hit a 40px target.
 * קשה wants the exact spot, `aspect` (scene w/h) keeping the reach circular.
 */
export function isCorrectDrop(u, v, item, zones, cfg, aspect = 1) {
  const zone = zones.find((z) => z.id === item.homeZone);
  if (!zone) return false;
  if (cfg.exact) {
    return Math.hypot((u - item.hx) * aspect, v - item.hy) <= EXACT_REACH;
  }
  return inZone(u, v, zone, cfg.zonePad);
}

// ── screen geometry ────────────────────────────────────────────────────────

const PAD = 12;
const TOP_INSET = 96;

/**
 * Board and tray rectangles in container pixels.
 *
 * The scene keeps its own aspect ratio and is centred in whatever is left after
 * the tray — never stretched to fill, the same rule פאזל תמונות follows for a
 * photograph.
 */
export function sceneGeometry(size, aspectRange, isTablet = false) {
  const { w, h } = size;
  if (w < 40 || h < 40) return null;

  const trayH = clamp(h * 0.24, 92, isTablet ? 216 : 168);
  const availW = w - PAD * 2;
  const availH = h - TOP_INSET - trayH - PAD * 2;
  if (availH < 40) return null;

  // The house takes the shape of the space it is given, within limits, rather
  // than forcing one ratio everywhere: a fixed 4:3 left a third of the iPhone
  // screen empty above and below it, while the iPad wants something wider.
  const [lo, hi] = aspectRange;
  const aspect = clamp(availW / availH, lo, hi);

  const sceneW = Math.floor(Math.min(availW, availH * aspect));
  const sceneH = Math.floor(sceneW / aspect);

  return {
    w,
    h,
    scene: {
      x: Math.round((w - sceneW) / 2),
      y: Math.round(TOP_INSET + Math.max(0, (availH - sceneH) / 2)),
      w: sceneW,
      h: sceneH,
    },
    tray: { x: PAD, y: h - trayH - PAD, w: availW, h: trayH },
  };
}

/** Scene fraction → container pixels. */
export const sceneToPx = (u, v, scene) => ({
  x: scene.x + u * scene.w,
  y: scene.y + v * scene.h,
});

/** Container pixels → scene fraction. */
export const pxToScene = (x, y, scene) => ({
  u: (x - scene.x) / scene.w,
  v: (y - scene.y) / scene.h,
});

/**
 * Lay `count` tiles out along the tray, wrapping into rows when they will not
 * fit on one. Returns tile centres in container pixels.
 */
export function trayLayout(count, tray, tileW, tileH) {
  if (count <= 0) return [];
  const perRow = Math.max(1, Math.min(count, Math.floor((tray.w - 8) / (tileW + 10))));
  const rows = Math.ceil(count / perRow);
  const rowH = Math.min(tileH + 10, (tray.h - 8) / rows);
  const top = tray.y + (tray.h - rows * rowH) / 2 + rowH / 2;

  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const col = i - row * perRow;
    const spacing = Math.min(tileW + 10, (tray.w - 8) / inRow);
    const rowW = inRow * spacing;
    return {
      x: tray.x + (tray.w - rowW) / 2 + spacing * (col + 0.5),
      y: top + row * rowH,
    };
  });
}

/**
 * The largest tile that still lets every item sit inside the tray.
 *
 * It walks down from the cap asking the tray layout's own question — how many fit
 * per row, so how many rows — because sizing the tile independently is what let
 * eight tiles wrap onto two rows taller than the tray itself.
 */
export function tileSizeFor(count, tray, isTablet) {
  const cap = isTablet ? 136 : 78;
  for (let size = cap; size > 40; size -= 2) {
    const perRow = Math.max(1, Math.floor((tray.w - 8) / (size + 10)));
    const rows = Math.ceil(count / perRow);
    if (rows * (size + 10) <= tray.h - 8) return size;
  }
  return 40;
}

// ── floor projection (the 3D room scene) ───────────────────────────────────

/**
 * A fixed-camera perspective floor, the same trick מרוץ 3D uses for its road
 * (`RunnerDashGame.jsx` projectWorldToScreen): a horizon line, a power curve for
 * depth, and a width that interpolates from far to near.
 *
 * `u` runs left→right, `v` runs far→near, both 0–1. There is no 3D library and
 * no camera to rotate — a moving camera would look lovely and would wreck
 * dragging.
 */
export const FLOOR = {
  /** where the back wall meets the floor, as a fraction of scene height */
  horizon: 0.42,
  /** how much of the scene height the floor occupies below that */
  depth: 0.58,
  /** half-width of the floor at the back wall / at the near edge */
  farHalf: 0.29,
  nearHalf: 0.5,
  /** billboard scale at the back wall / at the near edge */
  farScale: 0.52,
  nearScale: 1.16,
  /** curvature of the depth ramp — >1 bunches the far half up near the horizon */
  curve: 1.6,
};

const halfWidthAt = (v, f) => lerp(f.farHalf, f.nearHalf, v);

/** Floor coords → scene fractions plus the billboard scale at that depth. */
export function projectFloor(u, v, f = FLOOR) {
  const t = clamp(v, 0, 1);
  return {
    u: 0.5 + (clamp(u, 0, 1) - 0.5) * 2 * halfWidthAt(t, f),
    v: f.horizon + t ** f.curve * f.depth,
    scale: lerp(f.farScale, f.nearScale, t),
  };
}

/** Scene fractions → floor coords. Exact inverse of `projectFloor`. */
export function unprojectFloor(su, sv, f = FLOOR) {
  const ramp = clamp((sv - f.horizon) / f.depth, 0, 1);
  const v = ramp ** (1 / f.curve);
  const half = halfWidthAt(v, f);
  return { u: clamp(0.5 + (su - 0.5) / (2 * half), 0, 1), v };
}
