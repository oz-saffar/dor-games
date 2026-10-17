import { describe, it, expect } from 'vitest';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { DOLLHOUSE, pickItems, shuffle } from './scenes';
import {
  EXACT_REACH,
  FLOOR,
  diffFor,
  isCorrectDrop,
  projectFloor,
  pxToScene,
  sceneGeometry,
  sceneToPx,
  tileSizeFor,
  trayLayout,
  unprojectFloor,
  zoneAt,
} from './roomTidyConfig';

const EASY = diffFor(GAME_DIFFICULTY.EASY);
const MEDIUM = diffFor(GAME_DIFFICULTY.MEDIUM);
const HARD = diffFor(GAME_DIFFICULTY.HARD);

const zoneOf = (item) => DOLLHOUSE.zones.find((z) => z.id === item.homeZone);

/** A deterministic rng, so a failure is always reproducible. */
const seeded = (seed) => () => {
  let x = Math.sin(seed++) * 43758.5453;
  return x - Math.floor(x);
};

describe('scene data', () => {
  it('gives every item a room that exists', () => {
    const ids = new Set(DOLLHOUSE.zones.map((z) => z.id));
    for (const item of DOLLHOUSE.items) {
      expect(ids, `${item.id} (${item.label})`).toContain(item.homeZone);
    }
  });

  it('keeps every room inside the scene box', () => {
    for (const z of DOLLHOUSE.zones) {
      expect(z.x).toBeGreaterThanOrEqual(0);
      expect(z.y).toBeGreaterThanOrEqual(0);
      expect(z.x + z.w).toBeLessThanOrEqual(1);
      expect(z.y + z.h).toBeLessThanOrEqual(1);
    }
  });

  it('never overlaps two rooms', () => {
    const { zones } = DOLLHOUSE;
    for (let i = 0; i < zones.length; i += 1) {
      for (let j = i + 1; j < zones.length; j += 1) {
        const a = zones[i];
        const b = zones[j];
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x
          || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart, `${a.id} overlaps ${b.id}`).toBe(true);
      }
    }
  });

  it("puts every item's resting spot inside its own room", () => {
    for (const item of DOLLHOUSE.items) {
      const z = zoneOf(item);
      expect(item.hx, item.id).toBeGreaterThan(z.x);
      expect(item.hx, item.id).toBeLessThan(z.x + z.w);
      expect(item.hy, item.id).toBeGreaterThan(z.y);
      expect(item.hy, item.id).toBeLessThan(z.y + z.h);
    }
  });

  it('gives every item a distinct id and a Hebrew label', () => {
    const ids = DOLLHOUSE.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of DOLLHOUSE.items) {
      expect(item.label.trim().length, item.id).toBeGreaterThan(0);
    }
  });
});

describe('pickItems', () => {
  it('deals the requested number of distinct items', () => {
    for (const cfg of [EASY, MEDIUM, HARD]) {
      const picked = pickItems(DOLLHOUSE, cfg.items, seeded(7));
      expect(picked).toHaveLength(cfg.items);
      expect(new Set(picked.map((i) => i.id)).size).toBe(cfg.items);
    }
  });

  it('spreads a short round across different rooms', () => {
    // four items must be four rooms — otherwise קל becomes a quiz on one room
    for (let seed = 1; seed <= 25; seed += 1) {
      const picked = pickItems(DOLLHOUSE, 4, seeded(seed));
      expect(new Set(picked.map((i) => i.homeZone)).size).toBe(4);
    }
  });

  it('never deals more than the scene holds', () => {
    const picked = pickItems(DOLLHOUSE, 999, seeded(3));
    expect(picked).toHaveLength(DOLLHOUSE.items.length);
  });
});

describe('hit testing', () => {
  const aspect = 1.2; // a representative rendered ratio; the game passes the real one

  it("accepts an item dropped on its own exact spot at every difficulty", () => {
    for (const item of DOLLHOUSE.items) {
      for (const cfg of [EASY, MEDIUM, HARD]) {
        expect(
          isCorrectDrop(item.hx, item.hy, item, DOLLHOUSE.zones, cfg, aspect),
          item.id
        ).toBe(true);
      }
    }
  });

  it('rejects an item dropped in the wrong room at every difficulty', () => {
    for (const item of DOLLHOUSE.items) {
      const other = DOLLHOUSE.zones.find((z) => z.id !== item.homeZone);
      const u = other.x + other.w / 2;
      const v = other.y + other.h / 2;
      for (const cfg of [EASY, MEDIUM, HARD]) {
        expect(
          isCorrectDrop(u, v, item, DOLLHOUSE.zones, cfg, aspect),
          `${item.id} accepted into ${other.id}`
        ).toBe(false);
      }
    }
  });

  it('is strictly stricter on קשה than on קל', () => {
    // the corner of the right room furthest from the item's spot: still the
    // right room, so קל takes it; nowhere near the spot, so קשה does not
    for (const item of DOLLHOUSE.items) {
      const z = zoneOf(item);
      const u = z.x + z.w * (item.hx < z.x + z.w / 2 ? 0.97 : 0.03);
      const v = z.y + z.h * (item.hy < z.y + z.h / 2 ? 0.97 : 0.03);

      expect(isCorrectDrop(u, v, item, DOLLHOUSE.zones, EASY, aspect), item.id).toBe(true);
      expect(isCorrectDrop(u, v, item, DOLLHOUSE.zones, MEDIUM, aspect), item.id).toBe(true);
      expect(isCorrectDrop(u, v, item, DOLLHOUSE.zones, HARD, aspect), item.id).toBe(false);
    }
  });

  it('gives קל a forgiving margin outside the room that בינוני does not', () => {
    const item = DOLLHOUSE.items[0];
    const z = zoneOf(item);
    const justOutside = { u: z.x + z.w / 2, v: z.y - EASY.zonePad * 0.5 };

    expect(isCorrectDrop(justOutside.u, justOutside.v, item, DOLLHOUSE.zones, EASY, aspect)).toBe(true);
    expect(isCorrectDrop(justOutside.u, justOutside.v, item, DOLLHOUSE.zones, MEDIUM, aspect)).toBe(false);
  });

  it('keeps the קשה reach circular on screen, not elliptical', () => {
    const item = DOLLHOUSE.items[0];
    // straight down is measured in scene-height units...
    expect(
      isCorrectDrop(item.hx, item.hy + EXACT_REACH * 0.9, item, DOLLHOUSE.zones, HARD, 1)
    ).toBe(true);
    // ...and sideways must be divided by the aspect to cover the same pixels
    expect(
      isCorrectDrop(item.hx + EXACT_REACH * 0.9, item.hy, item, DOLLHOUSE.zones, HARD, 2)
    ).toBe(false);
  });

  it('finds the zone under a point, and nothing in the walls between them', () => {
    const z = DOLLHOUSE.zones[0];
    expect(zoneAt(z.x + z.w / 2, z.y + z.h / 2, DOLLHOUSE.zones)?.id).toBe(z.id);
    // the gap between the two upstairs rooms is wall, not a room
    expect(zoneAt(0.5, 0.3, DOLLHOUSE.zones)).toBeNull();
  });
});

describe('screen geometry', () => {
  const CASES = [
    { name: 'iPhone 11 portrait', w: 414, h: 896, tablet: false },
    { name: 'iPad 11" landscape', w: 1194, h: 834, tablet: true },
    { name: 'iPad 11" portrait', w: 834, h: 1194, tablet: true },
  ];

  for (const c of CASES) {
    it(`fits the house and the tray on ${c.name}`, () => {
      const g = sceneGeometry({ w: c.w, h: c.h }, DOLLHOUSE.aspectRange, c.tablet);
      expect(g).not.toBeNull();

      // the house stays within its declared shape range — never wildly stretched
      const ratio = g.scene.w / g.scene.h;
      expect(ratio).toBeGreaterThanOrEqual(DOLLHOUSE.aspectRange[0] - 0.02);
      expect(ratio).toBeLessThanOrEqual(DOLLHOUSE.aspectRange[1] + 0.02);

      // and it actually uses the room it is given rather than floating in space
      const availH = c.h - 96 - g.tray.h - 24;
      expect(g.scene.h).toBeGreaterThan(availH * 0.7);

      // everything stays on screen
      expect(g.scene.x).toBeGreaterThanOrEqual(0);
      expect(g.scene.y).toBeGreaterThanOrEqual(0);
      expect(g.scene.x + g.scene.w).toBeLessThanOrEqual(c.w);
      expect(g.tray.y + g.tray.h).toBeLessThanOrEqual(c.h);

      // and the tray never sits on top of the house
      expect(g.scene.y + g.scene.h).toBeLessThanOrEqual(g.tray.y);
    });

    it(`lays every tile inside the tray on ${c.name}`, () => {
      const g = sceneGeometry({ w: c.w, h: c.h }, DOLLHOUSE.aspectRange, c.tablet);
      const count = HARD.items;
      const tile = tileSizeFor(count, g.tray, c.tablet);
      const spots = trayLayout(count, g.tray, tile, tile);

      expect(spots).toHaveLength(count);
      for (const s of spots) {
        expect(s.x - tile / 2).toBeGreaterThanOrEqual(g.tray.x - 1);
        expect(s.x + tile / 2).toBeLessThanOrEqual(g.tray.x + g.tray.w + 1);
        expect(s.y - tile / 2).toBeGreaterThanOrEqual(g.tray.y - 1);
        expect(s.y + tile / 2).toBeLessThanOrEqual(g.tray.y + g.tray.h + 1);
      }
    });
  }

  it('returns null rather than a broken layout on a collapsed container', () => {
    expect(sceneGeometry({ w: 0, h: 0 }, DOLLHOUSE.aspectRange)).toBeNull();
    expect(sceneGeometry({ w: 400, h: 60 }, DOLLHOUSE.aspectRange)).toBeNull();
  });

  it('round-trips scene fractions through pixels', () => {
    const g = sceneGeometry({ w: 414, h: 896 }, DOLLHOUSE.aspectRange, false);
    for (const [u, v] of [[0, 0], [0.5, 0.5], [1, 1], [0.23, 0.77]]) {
      const px = sceneToPx(u, v, g.scene);
      const back = pxToScene(px.x, px.y, g.scene);
      expect(back.u).toBeCloseTo(u, 6);
      expect(back.v).toBeCloseTo(v, 6);
    }
  });
});

describe('floor projection (the 3D room)', () => {
  it('is an exact inverse of itself', () => {
    for (let i = 0; i <= 10; i += 1) {
      for (let j = 0; j <= 10; j += 1) {
        const u = i / 10;
        const v = j / 10;
        const p = projectFloor(u, v);
        const back = unprojectFloor(p.u, p.v);
        expect(back.u, `u at (${u}, ${v})`).toBeCloseTo(u, 6);
        expect(back.v, `v at (${u}, ${v})`).toBeCloseTo(v, 6);
      }
    }
  });

  it('draws nearer things bigger', () => {
    let prev = -Infinity;
    for (let j = 0; j <= 20; j += 1) {
      const { scale } = projectFloor(0.5, j / 20);
      expect(scale).toBeGreaterThan(prev);
      prev = scale;
    }
  });

  it('narrows the floor toward the back wall', () => {
    const near = projectFloor(1, 1);
    const far = projectFloor(1, 0);
    expect(far.u - 0.5).toBeLessThan(near.u - 0.5);
    expect(far.v).toBeCloseTo(FLOOR.horizon, 6);
  });

  it('keeps the whole floor inside the scene box', () => {
    for (const u of [0, 0.5, 1]) {
      for (const v of [0, 0.5, 1]) {
        const p = projectFloor(u, v);
        expect(p.u).toBeGreaterThanOrEqual(0);
        expect(p.u).toBeLessThanOrEqual(1);
        expect(p.v).toBeGreaterThanOrEqual(0);
        expect(p.v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('clamps a finger dragged off the floor instead of returning nonsense', () => {
    const above = unprojectFloor(0.5, 0);
    const below = unprojectFloor(0.5, 1);
    expect(Number.isFinite(above.v)).toBe(true);
    expect(above.v).toBe(0);
    expect(below.v).toBe(1);
  });
});

describe('shuffle', () => {
  it('keeps every element exactly once', () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(list, seeded(11));
    expect(out).toHaveLength(list.length);
    expect([...out].sort((a, b) => a - b)).toEqual(list);
  });

  it('does not mutate its input', () => {
    const list = [1, 2, 3, 4];
    shuffle(list, seeded(2));
    expect(list).toEqual([1, 2, 3, 4]);
  });
});
