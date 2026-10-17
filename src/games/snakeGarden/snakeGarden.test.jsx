import { describe, it, expect } from 'vitest';
import {
  BEAD_GAP, DIFF, HEAD_R, MAX_BEADS, START_BEADS,
  angleDelta, assistedAngle, beadRadius, placeBeads, scaleFor, seedPath,
  selfBiteIndex, speedFor, spawnFruitSpot, turnToward,
} from './snakeConfig';
import { FRUIT_KINDS, GOLDEN_FRUIT } from './snakeConfig';
import { burst, drawScene } from './snakeArt';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

const FIELD = { x: 0, y: 0, w: 400, h: 700 };

describe('steering', () => {
  it('turns the short way around the wrap', () => {
    // from 170° to -170° is a 20° hop across π, not a 340° trip back
    const from = (170 * Math.PI) / 180;
    const to = (-170 * Math.PI) / 180;
    expect(angleDelta(from, to)).toBeCloseTo((20 * Math.PI) / 180, 5);
    expect(Math.abs(turnToward(from, to, 1) - from)).toBeCloseTo((20 * Math.PI) / 180, 5);
  });

  it('never turns further than the step allows', () => {
    expect(turnToward(0, Math.PI, 0.1)).toBeCloseTo(0.1, 6);
    expect(turnToward(0, -Math.PI / 2, 0.1)).toBeCloseTo(-0.1, 6);
  });

  it('lands exactly on the target once it is within reach', () => {
    expect(turnToward(0, 0.05, 0.1)).toBeCloseTo(0.05, 6);
  });
});

/**
 * A compact stand-in for the game's frame: the same helpers in the same order.
 * It exists so the hedge's behaviour — the part that was easy to get wrong and
 * impossible to eyeball in a test — stays pinned.
 */
function drive({ cfg, frames, target, field = FIELD, beadCount = 40 }) {
  const scale = 1;
  const headR = HEAD_R * scale;
  const gap = BEAD_GAP * scale;
  const dt = 1 / 60;
  const head = { x: field.x + field.w / 2, y: field.y + field.h / 2 };
  let angle = -Math.PI / 2;
  let path = seedPath(head.x, head.y, angle, beadCount * gap + headR * 4, gap * 0.6);
  let bites = 0;
  let stalled = 0;
  let immune = 0;
  let closest = Infinity;
  let beads = [];

  for (let i = 0; i < frames; i += 1) {
    immune -= 1;
    const aim = typeof target === 'function' ? target(head, i) : target;
    const targetAngle = Math.atan2(aim.y - head.y, aim.x - head.x);
    angle = turnToward(
      angle,
      assistedAngle(head.x, head.y, angle, targetAngle, field, 78),
      cfg.turn * dt,
    );
    const before = { ...head };
    const move = speedFor(cfg, beadCount) * dt;
    head.x += Math.cos(angle) * move;
    head.y += Math.sin(angle) * move;
    const m = headR * 0.85;
    head.x = Math.max(field.x + m, Math.min(field.x + field.w - m, head.x));
    head.y = Math.max(field.y + m, Math.min(field.y + field.h - m, head.y));
    if (Math.hypot(head.x - before.x, head.y - before.y) < move * 0.25) stalled += 1;
    path.push({ x: head.x, y: head.y });
    if (path.length > 900) path = path.slice(300);
    beads = placeBeads(path, beadCount, gap);
    for (let b = 0; b < beads.length; b += 1) beads[b].r = beadRadius(b, beads.length, headR);
    closest = Math.min(closest, Math.hypot(head.x - aim.x, head.y - aim.y));
    // the game shortens the snake and grants immunity on a bite; so does this,
    // or one coil would be counted once per frame
    if (immune <= 0 && selfBiteIndex(head.x, head.y, beads, cfg.grace, headR) >= 0) {
      bites += 1;
      immune = 60 * 1.4;
      beadCount = START_BEADS;
    }
  }
  return { head, angle, bites, stalled, closest };
}

describe('the hedge', () => {
  const easy = DIFF[GAME_DIFFICULTY.EASY];

  it('leaves a heading in open ground alone', () => {
    expect(assistedAngle(200, 350, 0.4, 1.2, FIELD, 78)).toBeCloseTo(1.2, 6);
  });

  it('hands control straight back the moment the finger points inside', () => {
    // hard against the left edge, but aiming right — the hedge must not meddle
    expect(assistedAngle(6, 350, Math.PI, 0.2, FIELD, 78)).toBeCloseTo(0.2, 6);
  });

  it('bends a heading aimed at the wall into a glide along it', () => {
    // pinned to the left edge, driving further left, already travelling up
    const bent = assistedAngle(6, 350, -Math.PI / 2, Math.PI, FIELD, 78);
    expect(Math.cos(bent)).toBeGreaterThan(-0.35); // no longer driving into the hedge
    expect(Math.sin(bent)).toBeLessThan(0);        // still going the way it was
  });

  it('keeps gliding the way it already is, rather than flipping', () => {
    const up = assistedAngle(6, 350, -Math.PI / 2, Math.PI, FIELD, 78);
    const down = assistedAngle(6, 350, Math.PI / 2, Math.PI, FIELD, 78);
    expect(Math.sign(Math.sin(up))).toBe(-1);
    expect(Math.sign(Math.sin(down))).toBe(1);
  });

  // The bug this game shipped a fix for: a finger parked outside the corner
  // used to spin the snake 180°, walk it back down its own trail and eat it.
  it('never freezes or eats itself when a finger is parked outside a corner', () => {
    const run = drive({
      cfg: easy,
      frames: 60 * 12,
      target: { x: FIELD.x - 400, y: FIELD.y - 400 },
    });
    expect(run.stalled).toBeLessThan(60);
    expect(run.bites).toBeLessThanOrEqual(3);
  });

  it('keeps the snake inside the garden however hard it is pushed out', () => {
    for (const corner of [
      { x: -900, y: -900 }, { x: 1900, y: -900 },
      { x: -900, y: 1900 }, { x: 1900, y: 1900 },
    ]) {
      const run = drive({ cfg: easy, frames: 60 * 6, target: corner });
      expect(run.head.x).toBeGreaterThanOrEqual(FIELD.x);
      expect(run.head.x).toBeLessThanOrEqual(FIELD.x + FIELD.w);
      expect(run.head.y).toBeGreaterThanOrEqual(FIELD.y);
      expect(run.head.y).toBeLessThanOrEqual(FIELD.y + FIELD.h);
    }
  });
});

describe('chasing fruit', () => {
  it('gets a straight run at a fruit in a couple of seconds', () => {
    const cfg = DIFF[GAME_DIFFICULTY.EASY];
    const fruit = { x: FIELD.x + 60, y: FIELD.y + 90 };
    const run = drive({ cfg, frames: 60 * 4, target: fruit, beadCount: START_BEADS });
    expect(run.closest).toBeLessThan(HEAD_R);
    expect(run.bites).toBe(0);
  });

  it('lets a fresh snake spin on the spot without eating itself, on קל', () => {
    // a four-year-old parks a finger next to the head; a full circle must be free
    const cfg = DIFF[GAME_DIFFICULTY.EASY];
    const circle = (head, i) => ({
      x: head.x + Math.cos(i * 0.06) * HEAD_R * 2.2,
      y: head.y + Math.sin(i * 0.06) * HEAD_R * 2.2,
    });
    const oneLoop = Math.ceil((60 * 2 * Math.PI) / cfg.turn);
    const run = drive({ cfg, frames: oneLoop, target: circle, beadCount: START_BEADS });
    expect(run.bites).toBe(0);
  });
});

describe('the body', () => {
  it('drops beads at an even arc length along the path', () => {
    const path = seedPath(200, 600, -Math.PI / 2, 400, 2);
    const beads = placeBeads(path, 10, 12);
    expect(beads).toHaveLength(10);
    for (let i = 1; i < beads.length; i += 1) {
      const d = Math.hypot(beads[i].x - beads[i - 1].x, beads[i].y - beads[i - 1].y);
      expect(d).toBeCloseTo(12, 4);
    }
  });

  it('returns only what the path can cover, so a growing snake grows into it', () => {
    const path = seedPath(200, 600, -Math.PI / 2, 60, 2);
    expect(placeBeads(path, 40, 12).length).toBeLessThan(40);
  });

  it('tapers from the shoulders to a pointed tail', () => {
    const n = 30;
    const radii = Array.from({ length: n }, (_, i) => beadRadius(i, n, HEAD_R));
    for (let i = 1; i < n; i += 1) expect(radii[i]).toBeLessThan(radii[i - 1]);
    expect(radii[0]).toBeLessThan(HEAD_R);
    expect(radii[n - 1]).toBeGreaterThan(0);
  });
});

describe('biting yourself', () => {
  const headR = 20;
  const beads = Array.from({ length: 40 }, (_, i) => ({ x: 100, y: 100 + i * 8, r: 14 }));

  it('ignores the beads inside the grace window', () => {
    // sitting right on bead 2 — that is the neck, not a bite
    expect(selfBiteIndex(100, 116, beads, 12, headR)).toBe(-1);
  });

  it('catches the head overlapping the body past the grace window', () => {
    const target = beads[20];
    const hit = selfBiteIndex(target.x, target.y, beads, 12, headR);
    // the first overlapping bead wins, and a fat head overlaps a few of them
    expect(hit).toBeGreaterThanOrEqual(12);
    expect(hit).toBeLessThanOrEqual(20);
  });

  it('wants a real overlap, not a graze', () => {
    const target = beads[20];
    expect(selfBiteIndex(target.x + headR + target.r, target.y, beads, 12, headR)).toBe(-1);
  });

  it('gives קל a wider grace than a full tight turn, and קשה a narrower one', () => {
    // a tight turn brings the head back onto its body this many beads back
    const loopBeads = (cfg) => (2 * (cfg.speed / cfg.turn) + 1.1 * HEAD_R) / BEAD_GAP;
    expect(DIFF[GAME_DIFFICULTY.EASY].grace).toBeGreaterThan(loopBeads(DIFF[GAME_DIFFICULTY.EASY]));
    expect(DIFF[GAME_DIFFICULTY.HARD].grace).toBeLessThan(loopBeads(DIFF[GAME_DIFFICULTY.HARD]));
  });
});

describe('pace', () => {
  it('speeds up as the snake grows, but stops short of a runaway', () => {
    const cfg = DIFF[GAME_DIFFICULTY.EASY];
    expect(speedFor(cfg, START_BEADS)).toBe(cfg.speed);
    expect(speedFor(cfg, START_BEADS + 20)).toBeGreaterThan(cfg.speed);
    expect(speedFor(cfg, MAX_BEADS)).toBeLessThanOrEqual(cfg.speed + cfg.maxSpeedBonus);
    // the cap is a backstop, not something a real run can outgrow
    expect(speedFor(cfg, MAX_BEADS * 4)).toBe(cfg.speed + cfg.maxSpeedBonus);
  });

  it('scales the same game onto a phone and onto a tablet', () => {
    const phone = scaleFor({ x: 0, y: 0, w: 366, h: 700 });
    const tablet = scaleFor({ x: 0, y: 0, w: 800, h: 1000 });
    expect(phone).toBeLessThan(tablet);
    expect(phone).toBeGreaterThan(0.5);
    expect(tablet).toBeLessThanOrEqual(1.3);
  });
});

describe('fruit', () => {
  it('always lands inside the hedge', () => {
    for (let i = 0; i < 60; i += 1) {
      const spot = spawnFruitSpot(FIELD, [], 90, 30);
      expect(spot.x).toBeGreaterThanOrEqual(FIELD.x + 30);
      expect(spot.x).toBeLessThanOrEqual(FIELD.x + FIELD.w - 30);
      expect(spot.y).toBeGreaterThanOrEqual(FIELD.y + 30);
      expect(spot.y).toBeLessThanOrEqual(FIELD.y + FIELD.h - 30);
    }
  });

  it('keeps its distance from the snake', () => {
    const body = Array.from({ length: 30 }, (_, i) => ({ x: 200, y: 100 + i * 8 }));
    for (let i = 0; i < 40; i += 1) {
      const spot = spawnFruitSpot(FIELD, body, 90, 30);
      const nearest = Math.min(...body.map((b) => Math.hypot(spot.x - b.x, spot.y - b.y)));
      expect(nearest).toBeGreaterThan(40);
    }
  });

  it('still returns a spot when the garden is packed', () => {
    const everywhere = [];
    for (let x = 0; x <= FIELD.w; x += 20) {
      for (let y = 0; y <= FIELD.h; y += 20) everywhere.push({ x, y });
    }
    const spot = spawnFruitSpot(FIELD, everywhere, 500, 30);
    expect(Number.isFinite(spot.x)).toBe(true);
    expect(Number.isFinite(spot.y)).toBe(true);
  });
});

/**
 * jsdom has no 2D context, so the smoke test never runs a single line of the
 * painting code. This stub does — it is the only thing standing between a typo
 * in the artwork and a blank garden on Dor's iPad.
 */
function stubContext() {
  const calls = { fill: 0, stroke: 0, arc: 0, clearRect: 0 };
  const noop = (name) => (...args) => {
    if (name in calls) calls[name] += 1;
    for (const a of args) {
      if (typeof a === 'number' && !Number.isFinite(a)) {
        throw new Error(`${name}() got a non-finite argument: ${args.join(', ')}`);
      }
    }
  };
  const ctx = { calls };
  for (const name of [
    'clearRect', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'ellipse',
    'quadraticCurveTo', 'fill', 'stroke', 'save', 'restore', 'translate',
    'rotate', 'scale', 'setLineDash', 'setTransform', 'fillText',
  ]) ctx[name] = noop(name);
  return ctx;
}

function sceneState({ immune = false } = {}) {
  const headR = 18;
  const gap = 7.7;
  const beads = Array.from({ length: 60 }, (_, i) => ({
    x: 180 + Math.sin(i / 6) * 60,
    y: 300 + i * gap,
    r: beadRadius(i, 60, headR),
  }));
  const now = 5000;
  const S = {
    head: { x: 180, y: 292 },
    angle: -Math.PI / 2,
    headR,
    gap,
    dist: 1234,
    scale: 0.83,
    beads,
    fruits: [
      { x: 90, y: 180, r: 16, kind: FRUIT_KINDS[0], phase: 0.4, born: now - 900 },
      { x: 300, y: 520, r: 16, kind: GOLDEN_FRUIT, phase: 2.1, born: now - 100 },
    ],
    sparkles: [],
    pointer: { x: 260, y: 160 },
    pointerActive: true,
    immuneUntil: immune ? now + 500 : 0,
  };
  burst(S, 90, 180, 12, ['#d9a441', '#8fa98a'], now);
  return { S, now };
}

describe('painting the garden', () => {
  it('draws a whole frame without throwing', () => {
    const ctx = stubContext();
    const { S, now } = sceneState();
    expect(() => drawScene(ctx, S, { w: 390, h: 844 }, now)).not.toThrow();
    expect(ctx.calls.clearRect).toBe(1);
    expect(ctx.calls.arc).toBeGreaterThan(60); // body, head, eyes, fruit
    expect(ctx.calls.fill).toBeGreaterThan(60);
  });

  it('draws the immunity halo after a bite', () => {
    const plain = stubContext();
    const glowing = stubContext();
    const a = sceneState();
    const b = sceneState({ immune: true });
    drawScene(plain, a.S, { w: 390, h: 844 }, a.now);
    drawScene(glowing, b.S, { w: 390, h: 844 }, b.now);
    expect(glowing.calls.fill).toBeGreaterThan(plain.calls.fill);
  });

  it('survives the first frame, before the snake has a body', () => {
    const ctx = stubContext();
    const { S, now } = sceneState();
    S.beads = [];
    S.fruits = [];
    S.sparkles = [];
    S.pointerActive = false;
    expect(() => drawScene(ctx, S, { w: 390, h: 844 }, now)).not.toThrow();
  });

  it('keeps a lid on the sparkle pool however much fruit is eaten', () => {
    const S = { sparkles: [] };
    for (let i = 0; i < 40; i += 1) burst(S, 100, 100, 20, ['#fff'], i * 100);
    expect(S.sparkles.length).toBeLessThanOrEqual(160);
  });
});
