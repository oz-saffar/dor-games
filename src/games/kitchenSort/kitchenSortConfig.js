/**
 * מסדרים מטבח — pure round generation and layout. No React, so it is unit-tested directly.
 */
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { PLAY_COLORS } from '../../lib/palette';
import { clamp } from '../roomTidy/roomTidyConfig';

export { clamp };
export const MODE = { COLOR: 'color', TYPE: 'type' };

export const SETTLE_MS = 380;
export const WOBBLE_MS = 420;
export const DOORS_MS = 600;
export const NEXT_ROUND_MS = 2500;

export const DIFF = {
  [GAME_DIFFICULTY.EASY]: { shelves: 2, items: 6 },
  [GAME_DIFFICULTY.MEDIUM]: { shelves: 3, items: 9 },
  [GAME_DIFFICULTY.HARD]: { shelves: 4, items: 12 },
};
export const diffFor = (d) => DIFF[d] ?? DIFF[GAME_DIFFICULTY.EASY];

/** Colours that stay tellable apart; white is left out (it vanishes on paper). */
export const SHELF_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
export const COLOR_NAMES = {
  red: 'אדום', blue: 'כחול', green: 'ירוק', yellow: 'צהוב', purple: 'סגול', orange: 'כתום',
};
/** Kinds that look right in any colour. */
export const COLOR_KINDS = ['cup', 'mug', 'bowl', 'plate', 'sock', 'shirt'];

export const TYPES = {
  cups: { label: 'כוסות', kinds: ['cup', 'mug'], ghost: 'cup' },
  plates: { label: 'צלחות', kinds: ['plate', 'bowl'], ghost: 'plate' },
  cutlery: { label: 'סכו״ם', kinds: ['spoon', 'fork'], ghost: 'spoon' },
  fruit: { label: 'פירות', kinds: ['apple', 'banana'], ghost: 'apple' },
  clothes: { label: 'בגדים', kinds: ['sock', 'shirt'], ghost: 'sock' },
};
const TYPE_IDS = Object.keys(TYPES);
const FRUIT_COLORS = { apple: PLAY_COLORS.red, banana: PLAY_COLORS.yellow };

export const KIND_LABELS = {
  cup: 'כוס', mug: 'ספל', bowl: 'קערה', plate: 'צלחת', spoon: 'כף',
  fork: 'מזלג', apple: 'תפוח', banana: 'בננה', sock: 'גרב', shirt: 'חולצה',
};

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * One round: `shelves` (each with a picture label) and `items`, every item
 * carrying exactly one valid `shelfId`. Items are dealt evenly across shelves.
 */
export function generateRound(difficulty, mode, rng = Math.random) {
  const { shelves: n, items: total } = diffFor(difficulty);
  const per = Math.floor(total / n);
  const ids = shuffle(mode === MODE.COLOR ? SHELF_COLORS : TYPE_IDS, rng).slice(0, n);
  const pick = (list) => list[Math.floor(rng() * list.length)];

  const shelves = ids.map((id) => (mode === MODE.COLOR
    ? { id, mode, color: PLAY_COLORS[id], name: COLOR_NAMES[id] }
    : { id, mode, ghost: TYPES[id].ghost, name: TYPES[id].label }));

  const items = [];
  ids.forEach((shelfId) => {
    for (let k = 0; k < per; k += 1) {
      let kind;
      let color;
      if (mode === MODE.COLOR) {
        kind = pick(COLOR_KINDS);
        color = PLAY_COLORS[shelfId];
      } else {
        kind = pick(TYPES[shelfId].kinds);
        color = FRUIT_COLORS[kind] ?? PLAY_COLORS[pick(SHELF_COLORS)];
      }
      items.push({ kind, color, shelfId, label: KIND_LABELS[kind] });
    }
  });
  const dealt = shuffle(items, rng).map((it, i) => ({ ...it, id: `it${i}`, trayIndex: i }));
  return { mode, shelves, items: dealt, perShelf: per };
}

// ── layout ─────────────────────────────────────────────────────────────────
const PAD = 12;
const TOP = 84;

/** Cabinet, shelves and tray rectangles in container pixels. */
export function kitchenGeometry(w, h, isTablet, shelfCount, itemCount) {
  if (w < 120 || h < 200) return null;
  const landscape = w > h;
  let cab;
  let tray;
  if (landscape) {
    const trayW = clamp(w * 0.34, 200, 460);
    cab = { x: PAD, y: TOP, w: w - PAD * 3 - trayW, h: h - TOP - PAD };
    tray = { x: w - PAD - trayW, y: TOP, w: trayW, h: h - TOP - PAD };
  } else {
    const trayH = clamp(h * (itemCount > 9 ? 0.3 : 0.26), 120, isTablet ? 380 : 236);
    cab = { x: PAD, y: TOP, w: w - PAD * 2, h: h - TOP - PAD * 2 - trayH };
    tray = { x: PAD, y: h - PAD - trayH, w: w - PAD * 2, h: trayH };
  }
  if (cab.h < 80) return null;

  const frame = 10;
  const gap = 8;
  const shelfH = (cab.h - frame * 2 - gap * (shelfCount - 1)) / shelfCount;
  const labelW = clamp(shelfH * 0.8, 56, Math.min(120, cab.w * 0.25));
  const shelves = Array.from({ length: shelfCount }, (_, i) => ({
    x: cab.x + frame,
    y: cab.y + frame + i * (shelfH + gap),
    w: cab.w - frame * 2,
    h: shelfH,
    labelW,
  }));
  return { w, h, cab, tray, shelves, landscape };
}

/** Centre of slot `index` on a shelf, plus the size a settled item is drawn at. */
export function slotPosition(shelf, index, perShelf) {
  const areaW = shelf.w - shelf.labelW;
  const spacing = areaW / perShelf;
  return {
    x: shelf.x + shelf.labelW + spacing * (index + 0.5),
    y: shelf.y + shelf.h * 0.5,
    size: Math.max(28, Math.min(shelf.h * 0.78, spacing * 0.92)),
  };
}

/** Index of the shelf whose rectangle (inflated by `pad`) holds the point, or -1. */
export function shelfIndexAt(x, y, shelves, pad = 8) {
  return shelves.findIndex((s) => (
    x >= s.x - pad && x <= s.x + s.w + pad && y >= s.y - pad && y <= s.y + s.h + pad
  ));
}
