/**
 * הנחש הרעב — tuning and the pure parts of the simulation.
 *
 * Everything here is expressed in *reference units* (a 700px-ish field) and
 * multiplied by `scaleFor()` at runtime, so the snake feels identical on a
 * phone and on an iPad. The ratios below are deliberately scale-invariant:
 * the turning circle, the body gap and the collision grace are all tied to the
 * head radius, so difficulty can't drift with screen size.
 */
import { ACCENTS, PLAY_COLORS, INK, shade, tint } from '../../lib/palette';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

export const ACCENT = ACCENTS.sage;

/** Head radius in reference units — every other body measure derives from it */
export const HEAD_R = 22;
/** Spacing between body beads, as a fraction of the head radius */
export const GAP_RATIO = 0.42;
export const BEAD_GAP = HEAD_R * GAP_RATIO;

export const START_BEADS = 17;
export const MAX_BEADS = 130;
export const FRUITS_FOR_CELEBRATION = 8;
/** Every Nth fruit is a golden one — worth double growth */
export const GOLDEN_EVERY = 5;

/** How long the snake cannot bite itself after a reset (ms) */
export const IMMUNITY_MS = 1400;
/** No touch for this long and the snake ambles, and the hint comes back (ms) */
export const IDLE_SLOW_MS = 1600;
export const IDLE_SPEED_MUL = 0.55;

/** Band of pixels near the hedge where steering is bent along it */
export const WALL_SOFT = 78;
/**
 * How much of that bend the hedge gets at full depth. This is 1: inside the
 * last third of the band the snake glides along the fence like a bumper rail,
 * because anything less lets it press into the corner until both axes clamp
 * and it stops dead. Full assist only ever removes the component pointing
 * *into* the hedge — the child keeps every other direction, and aiming back
 * inside leaves immediately.
 */
export const WALL_ASSIST = 1;

/**
 * `grace` is how many beads behind the head are ignored by self-collision.
 *
 * On קל it is wider than the snake's whole minimum-radius circle (~21 beads),
 * because a four-year-old parks a finger next to the head and the snake spins:
 * that must not cost anything. Biting on קל takes crossing a *distant* stretch
 * of a long body — a real, visible mistake. קשה is narrower than a single
 * U-turn (~17 beads), so there a loop really does bite.
 */
export const DIFF = {
  [GAME_DIFFICULTY.EASY]: {
    speed: 150, turn: 5.0, grow: 5, grace: 22, fruits: 3,
    speedPerBead: 0.34, maxSpeedBonus: 45, fruitR: 19,
  },
  [GAME_DIFFICULTY.MEDIUM]: {
    speed: 195, turn: 4.2, grow: 6, grace: 14, fruits: 2,
    speedPerBead: 0.46, maxSpeedBonus: 70, fruitR: 17,
  },
  [GAME_DIFFICULTY.HARD]: {
    speed: 245, turn: 3.6, grow: 7, grace: 10, fruits: 2,
    speedPerBead: 0.58, maxSpeedBonus: 95, fruitR: 16,
  },
};

/** Garden palette — fixed hues, so the snake reads the same in twilight */
export const SNAKE_COLORS = {
  body: ACCENTS.moss,
  band: shade(ACCENTS.moss, 0.22),
  sheen: tint(ACCENTS.sage, 0.42),
  outline: shade(ACCENTS.moss, 0.44),
  eye: '#FFFDF8',
  pupil: shade(INK, 0.1),
  tongue: PLAY_COLORS.red,
  halo: tint(ACCENTS.ochre, 0.3),
  shadow: 'rgba(58, 54, 48, 0.17)',
};

export const FRUIT_KINDS = [
  { id: 'apple', fill: PLAY_COLORS.red },
  { id: 'berry', fill: PLAY_COLORS.purple },
  { id: 'pear', fill: PLAY_COLORS.green },
  { id: 'plum', fill: PLAY_COLORS.pink },
];

export const GOLDEN_FRUIT = { id: 'golden', fill: PLAY_COLORS.yellow };

export const TAU = Math.PI * 2;

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];

/**
 * One number that scales the whole game to the field.
 * Uses the area rather than the short edge so a narrow phone still gets a
 * chunky, tappable snake instead of a thread.
 */
export function scaleFor(field) {
  const area = Math.max(1, field.w * field.h);
  return clamp(Math.sqrt(area / (700 * 700 * 0.75)), 0.55, 1.3);
}

/** Shortest signed angle from `a` to `b`, in (-π, π] */
export function angleDelta(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d <= -Math.PI) d += TAU;
  return d;
}

/** Rotate `current` toward `target`, at most `maxStep` radians */
export function turnToward(current, target, maxStep) {
  const d = angleDelta(current, target);
  if (Math.abs(d) <= maxStep) return current + d;
  return current + Math.sign(d) * maxStep;
}

/**
 * Bend the child's heading along the hedge rather than into it.
 *
 * The obvious version — steer back toward the middle — is a trap: a finger held
 * in a corner spins the snake 180°, it retraces the wall it just came down, and
 * it eats itself through no fault of the child. Projecting the finger's
 * direction onto the wall is no better: in a corner the projection flips
 * whenever the second wall's band starts, and the snake judders in place.
 *
 * So the hedge behaves like a bumper rail. Once the finger points into it, the
 * snake keeps gliding the way it is *already* going — full assist, so it never
 * grinds to a halt — rounding corners onto the next wall. The moment the finger
 * points back inside, the assist lets go completely and steering is the child's
 * again.
 */
export function assistedAngle(x, y, currentAngle, targetAngle, field, soft = WALL_SOFT) {
  let nx = 0;
  let ny = 0;
  const left = x - field.x;
  const right = field.x + field.w - x;
  const top = y - field.y;
  const bottom = field.y + field.h - y;
  if (left < soft) nx += (soft - left) / soft;
  if (right < soft) nx -= (soft - right) / soft;
  if (top < soft) ny += (soft - top) / soft;
  if (bottom < soft) ny -= (soft - bottom) / soft;

  // ramps to a full slide before the head's own clamp margin, so the snake
  // glides along the fence instead of grinding into it
  const depth = clamp(Math.hypot(nx, ny) * 1.6, 0, 1);
  if (depth <= 0.001) return targetAngle;

  const len = Math.hypot(nx, ny) || 1;
  const ux = nx / len;
  const uy = ny / len;
  const dx = Math.cos(targetAngle);
  const dy = Math.sin(targetAngle);
  if (dx * ux + dy * uy >= 0) return targetAngle; // aiming back inside — let go

  // the two ways along the fence; keep the one the snake is already taking,
  // with the finger breaking the tie when it is running straight at the wall
  const tx = -uy;
  const ty = ux;
  const along = (Math.cos(currentAngle) * tx + Math.sin(currentAngle) * ty) * 2
    + (dx * tx + dy * ty);
  const slide = along >= 0 ? Math.atan2(ty, tx) : Math.atan2(-ty, -tx);
  return targetAngle + angleDelta(targetAngle, slide) * (depth * WALL_ASSIST);
}

/** Head-to-tail taper: thick through the shoulders, pointed at the tip */
export function beadRadius(i, n, headR) {
  if (n <= 1) return headR * 0.8;
  const t = i / (n - 1);
  return headR * 0.88 * (0.34 + 0.66 * Math.pow(1 - t, 0.7));
}

/** How fast the snake travels once it has `beads` segments (reference units/s) */
export function speedFor(cfg, beads) {
  const over = Math.max(0, beads - START_BEADS);
  return cfg.speed + Math.min(cfg.maxSpeedBonus, over * cfg.speedPerBead);
}

/**
 * Walk the head's path backwards, dropping a bead every `gap` pixels of arc
 * length. Sampling by distance (not by frame) keeps the body evenly beaded
 * whatever the framerate does.
 */
export function placeBeads(path, count, gap) {
  const out = [];
  if (path.length === 0 || count <= 0 || gap <= 0) return out;

  let i = path.length - 1;
  let cur = path[i];
  let acc = 0;
  let target = gap;

  while (out.length < count && i > 0) {
    const prev = path[i - 1];
    const seg = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    if (seg > 1e-6) {
      while (acc + seg >= target && out.length < count) {
        const t = (target - acc) / seg;
        out.push({ x: cur.x + (prev.x - cur.x) * t, y: cur.y + (prev.y - cur.y) * t });
        target += gap;
      }
      acc += seg;
    }
    i -= 1;
    cur = prev;
  }
  return out;
}

/** A straight tail behind the head, so a new snake starts at full length */
export function seedPath(x, y, angle, length, step) {
  const pts = [];
  const n = Math.max(2, Math.ceil(length / step));
  for (let i = n; i >= 0; i -= 1) {
    pts.push({ x: x - Math.cos(angle) * step * i, y: y - Math.sin(angle) * step * i });
  }
  return pts;
}

/**
 * First body bead the head is actually overlapping, or -1.
 * `grace` beads behind the head are exempt — a snake cannot bite its own neck,
 * and neither can a four-year-old's scribble.
 */
export function selfBiteIndex(hx, hy, beads, grace, headR) {
  for (let i = grace; i < beads.length; i += 1) {
    const b = beads[i];
    const reach = (headR + b.r) * 0.55;
    const dx = hx - b.x;
    const dy = hy - b.y;
    if (dx * dx + dy * dy < reach * reach) return i;
  }
  return -1;
}

/**
 * A spot for the next fruit: inside the hedge, and as far from the body and
 * the other fruit as a handful of tries can manage.
 */
export function spawnFruitSpot(field, avoid, minDist, pad, rng = Math.random) {
  let best = { x: field.x + field.w / 2, y: field.y + field.h / 2 };
  let bestDist = -1;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const x = field.x + pad + rng() * Math.max(1, field.w - pad * 2);
    const y = field.y + pad + rng() * Math.max(1, field.h - pad * 2);
    let d = Infinity;
    for (const a of avoid) {
      const dist = Math.hypot(x - a.x, y - a.y);
      if (dist < d) d = dist;
    }
    if (d >= minDist) return { x, y };
    if (d > bestDist) {
      bestDist = d;
      best = { x, y };
    }
  }
  return best;
}

export const EAT_WORDS = ['יַם!', 'טעים!', 'עוד!', 'אָה!'];
export const GOLDEN_WORDS = ['וואו!', 'זהב!'];
