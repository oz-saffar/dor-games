import {
  COLOR_SET, EDGE, GAP, GROUND_TOP, KINDS, SCENE_H, SCENE_W, SKY_MAX_Y, THEMES, THEME_IDS,
  diffConfigFor,
} from './sceneConfig';

/** Seedable RNG (mulberry32): same seed, same scene. */
export function createRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rng, lo, hi) => lo + rng() * (hi - lo);
const intBetween = (rng, lo, hi) => Math.floor(between(rng, lo, hi + 1));
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
function shuffled(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Collision radius of an object: it is drawn inside a circle of this size. */
export const radiusOf = (o) => (o.size * (o.scale ?? 1)) / 2;

const fits = (x, y, r, others) =>
  x - r >= EDGE && x + r <= SCENE_W - EDGE && y - r >= EDGE && y + r <= SCENE_H - EDGE
  && others.every((o) => Math.hypot(o.x - x, o.y - y) >= r + radiusOf(o) + GAP);

function placeOne(rng, zone, objects) {
  const size = zone === 'sky' ? between(rng, 20, 25) : between(rng, 18, 22);
  const r = size / 2;
  for (let i = 0; i < 120; i += 1) {
    const x = between(rng, EDGE + r, SCENE_W - EDGE - r);
    const y = zone === 'sky'
      ? between(rng, EDGE + r, SKY_MAX_Y)
      : between(rng, GROUND_TOP + r, SCENE_H - EDGE - r);
    if (fits(x, y, r, objects)) return { x, y, size };
  }
  return null;
}

function buildOnce(rng, themeId) {
  const kinds = THEMES[themeId];
  const objects = [];
  const used = {};
  const wantSky = intBetween(rng, 2, 3);
  const wantGround = intBetween(rng, 4, 6);
  const zones = [...Array(wantSky).fill('sky'), ...Array(wantGround).fill('ground')];
  for (const zone of zones) {
    const options = kinds.filter((k) => {
      const meta = KINDS[k];
      return meta.zone === zone && (meta.dup ? (used[k] ?? 0) < 2 : !used[k]);
    });
    if (options.length === 0) continue;
    // Prefer kinds not yet used so a scene is varied.
    const fresh = options.filter((k) => !used[k]);
    const kind = pick(rng, fresh.length ? fresh : options);
    const spot = placeOne(rng, zone, objects);
    if (!spot) continue;
    const meta = KINDS[kind];
    used[kind] = (used[kind] ?? 0) + 1;
    objects.push({
      id: `o${objects.length}`,
      kind,
      zone,
      x: Math.round(spot.x * 10) / 10,
      y: Math.round(spot.y * 10) / 10,
      size: Math.round(spot.size * 10) / 10,
      color: meta.tintable ? pick(rng, COLOR_SET) : meta.fixed,
      flip: false,
      scale: 1,
    });
  }
  return { theme: themeId, objects };
}

/** A scene of 6-9 non-overlapping objects on a random theme. */
export function buildScene(rng) {
  const themeId = pick(rng, THEME_IDS);
  let best = null;
  for (let i = 0; i < 40; i += 1) {
    const scene = buildOnce(rng, themeId);
    if (scene.objects.length >= 6) return scene;
    if (!best || scene.objects.length > best.objects.length) best = scene;
  }
  return best;
}

/** Which difference kinds can be applied to this object, and the data to apply. */
function optionsFor(rng, scene, obj, cfg) {
  const out = [];
  const meta = KINDS[obj.kind];
  const others = scene.objects.filter((o) => o.id !== obj.id);
  if (cfg.kinds.includes('missing')) out.push({ kind: 'missing', r: radiusOf(obj) });
  if (cfg.kinds.includes('color') && meta.tintable) {
    const color = pick(rng, COLOR_SET.filter((c) => c !== obj.color));
    out.push({ kind: 'color', r: radiusOf(obj), patch: { color } });
  }
  if (cfg.kinds.includes('swap')) {
    const present = scene.objects.map((o) => o.kind);
    const targets = THEMES[scene.theme].filter(
      (k) => k !== obj.kind && KINDS[k].zone === obj.zone,
    );
    const fresh = targets.filter((k) => !present.includes(k));
    const pool = fresh.length ? fresh : targets;
    if (pool.length) {
      const kind = pick(rng, pool);
      const t = KINDS[kind];
      out.push({
        kind: 'swap',
        r: radiusOf(obj),
        patch: { kind, color: t.tintable ? pick(rng, COLOR_SET) : t.fixed, flip: false },
      });
    }
  }
  if (cfg.kinds.includes('flip') && meta.asymmetric) {
    out.push({ kind: 'flip', r: radiusOf(obj), patch: { flip: !obj.flip } });
  }
  if (cfg.kinds.includes('bigger')) {
    const grown = { ...obj, scale: cfg.grow };
    if (fits(obj.x, obj.y, radiusOf(grown), others)) {
      out.push({ kind: 'bigger', r: radiusOf(grown), patch: { scale: cfg.grow } });
    }
  }
  return out;
}

/**
 * Alter a copy of the scene in `n` places.
 * Returns { altered, differences: [{ id, kind, objectId, cx, cy, r }] }.
 * Differences sit on distinct objects, their regions never overlap, and kinds
 * are spread out (least-used kind first).
 */
export function makeDifferences(scene, n, rng, difficulty) {
  const cfg = diffConfigFor(difficulty);
  const altered = scene.objects.map((o) => ({ ...o }));
  const differences = [];
  const usedKinds = {};
  const order = shuffled(rng, scene.objects);
  const rarity = (kind) => usedKinds[kind] ?? 0;

  while (differences.length < n) {
    let chosen = null;
    for (const obj of order) {
      if (differences.some((d) => d.objectId === obj.id)) continue;
      const opts = optionsFor(rng, scene, obj, cfg).filter((o) =>
        differences.every((d) => Math.hypot(d.cx - obj.x, d.cy - obj.y) >= d.r + o.r + 1));
      if (!opts.length) continue;
      const least = Math.min(...opts.map((o) => rarity(o.kind)));
      const opt = pick(rng, opts.filter((o) => rarity(o.kind) === least));
      if (!chosen || rarity(opt.kind) < rarity(chosen.opt.kind)) chosen = { obj, opt };
      if (rarity(opt.kind) === 0) break;
    }
    if (!chosen) break;
    const { obj, opt } = chosen;
    usedKinds[opt.kind] = rarity(opt.kind) + 1;
    differences.push({
      id: `d${differences.length}`,
      kind: opt.kind,
      objectId: obj.id,
      cx: obj.x,
      cy: obj.y,
      r: opt.r,
    });
    const idx = altered.findIndex((o) => o.id === obj.id);
    if (opt.kind === 'missing') altered.splice(idx, 1);
    else altered[idx] = { ...altered[idx], ...opt.patch };
  }
  return { altered: { ...scene, objects: altered }, differences };
}

/** A whole round: scene, its altered twin and the difference list. */
export function generateRound(seed, difficulty) {
  const rng = createRng(seed);
  const cfg = diffConfigFor(difficulty);
  const scene = buildScene(rng);
  const { altered, differences } = makeDifferences(scene, cfg.count, rng, difficulty);
  return { seed, scene, altered, differences };
}
