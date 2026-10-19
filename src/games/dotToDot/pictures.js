import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { PLAY_COLORS } from '../../lib/palette';

/**
 * Hidden pictures as closed outlines in a 100x100 space (the last point joins
 * back to the first). `dotsFor` resamples an outline to exactly n dots, evenly
 * spaced along its length, so any picture works at any difficulty.
 */
export const DOT_COUNTS = {
  [GAME_DIFFICULTY.EASY]: 5,
  [GAME_DIFFICULTY.MEDIUM]: 10,
  [GAME_DIFFICULTY.HARD]: 15,
};

export const dotCountFor = (difficulty) => DOT_COUNTS[difficulty] ?? DOT_COUNTS[GAME_DIFFICULTY.EASY];

/** Dots are drawn about 4.8 units across; keep neighbours at least 2.2 radii apart. */
export const DOT_RADIUS = 4.8;
export const MIN_GAP = 10.6;

/** Points along the outline every `step` units, remembering which are real vertices. */
function sampleOutline(pts, step = 0.5) {
  const out = [];
  const vertexAt = [];
  let s = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    vertexAt.push(out.length);
    const steps = Math.max(1, Math.floor(len / step));
    for (let j = 0; j < steps; j += 1) {
      const t = j / steps;
      out.push({ x: p[0] + (q[0] - p[0]) * t, y: p[1] + (q[1] - p[1]) * t, s: s + len * t, vertex: j === 0 });
    }
    s += len;
  });
  return { out, vertexAt };
}

/**
 * Exactly n dots on the outline. The picture's own corners are always dots; the
 * rest are added one at a time at the spot farthest from every dot so far, which
 * keeps neighbours apart (no overlaps, no cut corners) and still follows the shape.
 */
export function dotsFor(picture, n) {
  const { out, vertexAt } = sampleOutline(picture.points);
  const chosen = picture.corners.slice(0, n).map((ci) => out[vertexAt[ci]]);
  const minDist = (c) => Math.min(...chosen.map((d) => Math.hypot(c.x - d.x, c.y - d.y)));
  while (chosen.length < n) {
    let best = null;
    let bestScore = -1;
    out.forEach((c) => {
      if (chosen.includes(c)) return;
      const score = minDist(c) + (c.vertex ? 0.4 : 0);
      if (score > bestScore) { bestScore = score; best = c; }
    });
    chosen.push(best);
  }
  return [...chosen]
    .sort((p, q) => p.s - q.s)
    .map((c, i) => ({ n: i + 1, x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10 }));
}

export const PICTURES = [
  {
    id: 'star',
    title: 'כוכב',
    emoji: '⭐',
    color: PLAY_COLORS.yellow,
    corners: [0, 2, 4, 6, 8],
    points: [[50, 4], [61.8, 35.8], [95.7, 37.2], [69, 58.2], [78.2, 90.8], [50, 72], [21.8, 90.8], [31, 58.2], [4.3, 37.2], [38.2, 35.8]],
  },
  {
    id: 'fish',
    title: 'דג',
    emoji: '🐟',
    color: PLAY_COLORS.blue,
    corners: [0, 2, 5, 7, 10],
    points: [[8, 50], [22, 34], [42, 26], [62, 30], [78, 44], [94, 30], [88, 50], [94, 70], [78, 56], [62, 70], [42, 74], [22, 66]],
  },
  {
    id: 'house',
    title: 'בית',
    emoji: '🏠',
    color: PLAY_COLORS.orange,
    // Roof and walls only: a door notch collapses to one dot at low counts and the
    // bottom edge turns into a V that reads as a star.
    corners: [0, 1, 2, 3, 4],
    points: [[50, 10], [86, 44], [86, 90], [14, 90], [14, 44]],
  },
  {
    id: 'dinosaur',
    title: 'דינוזאור',
    emoji: '🦕',
    color: PLAY_COLORS.green,
    corners: [0, 3, 6, 12, 17],
    points: [[6, 72], [24, 66], [40, 56], [56, 48], [66, 36], [70, 16], [80, 10], [92, 16], [90, 28], [80, 34], [78, 48], [84, 66], [80, 90], [66, 90], [62, 72], [40, 76], [34, 90], [20, 90], [20, 76]],
  },
  {
    id: 'heart',
    title: 'לב',
    emoji: '❤️',
    color: PLAY_COLORS.pink,
    corners: [0, 4, 7, 10],
    points: [[50, 88], [24, 62], [8, 42], [8, 26], [24, 12], [38, 14], [46, 24], [50, 32], [54, 24], [62, 14], [76, 12], [92, 26], [92, 42], [76, 62]],
  },
  {
    id: 'boat',
    title: 'סירה',
    emoji: '⛵',
    color: PLAY_COLORS.teal,
    corners: [0, 4, 5, 6, 7],
    points: [[50, 6], [80, 48], [54, 48], [54, 60], [96, 60], [84, 86], [16, 86], [4, 60], [46, 60], [46, 48], [20, 48]],
  },
];

export const pictureById = (id) => PICTURES.find((p) => p.id === id);
