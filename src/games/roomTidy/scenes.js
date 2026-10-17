/**
 * Scene registry for מסדרים את הבית.
 *
 * A scene is a background plus two lists — where things can go (`zones`) and
 * what has to be put away (`items`). Everything is a fraction of the scene box,
 * so the same description drives a phone and an iPad.
 *
 * `kind` picks the renderer and nothing else. The engine's drag, hit-testing,
 * scoring and difficulty ladder are shared, which is what makes a second scene
 * cheap.
 */

/** Four rooms in a 2×2 cutaway, with wall thickness showing between them. */
const ROOMS = [
  { id: 'bedroom', label: 'חדר שינה', x: 0.055, y: 0.175, w: 0.42, h: 0.355 },
  { id: 'bathroom', label: 'אמבטיה', x: 0.525, y: 0.175, w: 0.42, h: 0.355 },
  { id: 'kitchen', label: 'מטבח', x: 0.055, y: 0.565, w: 0.42, h: 0.375 },
  { id: 'living', label: 'סלון', x: 0.525, y: 0.565, w: 0.42, h: 0.375 },
];

const zoneById = (id) => ROOMS.find((r) => r.id === id);

/**
 * Resting spot for the n-th item of a room — a 2×2 arrangement that keeps
 * things off the floor line and away from the walls.
 */
function spot(zoneId, index) {
  const z = zoneById(zoneId);
  const col = index % 2;
  const row = Math.floor(index / 2) % 2;
  return {
    hx: z.x + z.w * (col === 0 ? 0.29 : 0.71),
    hy: z.y + z.h * (row === 0 ? 0.33 : 0.71),
  };
}

/**
 * Four portable things per room. Emoji rather than artwork: crisp at any size,
 * instantly readable at four, and no art pipeline to block on. Nothing here is
 * furniture — the rooms draw their own fittings, so there is never a second
 * sofa to be confused about.
 */
const ITEM_SOURCE = [
  ['bedroom', '🧸', 'דובי'],
  ['bedroom', '👕', 'חולצה'],
  ['bedroom', '🧦', 'גרביים'],
  ['bedroom', '🧣', 'צעיף'],

  ['bathroom', '🪥', 'מברשת שיניים'],
  ['bathroom', '🧼', 'סבון'],
  ['bathroom', '🦆', 'ברווז'],
  ['bathroom', '🧴', 'שמפו'],

  ['kitchen', '🍌', 'בננה'],
  ['kitchen', '🥄', 'כפית'],
  ['kitchen', '🍎', 'תפוח'],
  ['kitchen', '🥛', 'חלב'],

  ['living', '📚', 'ספר'],
  ['living', '🪴', 'עציץ'],
  ['living', '🎮', 'שלט'],
  ['living', '🕰️', 'שעון'],
];

const perRoomIndex = {};
const ITEMS = ITEM_SOURCE.map(([homeZone, emoji, label]) => {
  perRoomIndex[homeZone] = (perRoomIndex[homeZone] ?? -1) + 1;
  return {
    id: `${homeZone}-${perRoomIndex[homeZone]}`,
    emoji,
    label,
    homeZone,
    ...spot(homeZone, perRoomIndex[homeZone]),
  };
});

export const DOLLHOUSE = {
  id: 'dollhouse',
  title: 'הבית',
  emoji: '🏠',
  kind: 'flat',
  /** the house may stretch between these ratios to fill the screen it gets */
  aspectRange: [0.78, 1.45],
  zones: ROOMS,
  items: ITEMS,
};

/**
 * Every scene the game knows about. A scene with no items is dropped, which is
 * how Dor's photographed room stays invisible until the photos actually exist —
 * the dollhouse never waits on a photo shoot.
 */
export const ALL_SCENES = [DOLLHOUSE];

export const AVAILABLE_SCENES = ALL_SCENES.filter((s) => s.items.length > 0);

/** Deterministic-enough shuffle; `rng` is injectable so tests can pin it. */
export function shuffle(list, rng = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Choose `count` items for a round, spread across the rooms.
 *
 * Round-robin over shuffled per-room piles rather than a flat shuffle, so a
 * four-item round is four different rooms instead of four things from the
 * bedroom — which would make the game a memory test of one room.
 */
export function pickItems(scene, count, rng = Math.random) {
  const piles = shuffle(scene.zones, rng).map((z) =>
    shuffle(scene.items.filter((it) => it.homeZone === z.id), rng)
  );

  const out = [];
  for (let round = 0; out.length < count; round += 1) {
    let tookAny = false;
    for (const pile of piles) {
      if (out.length >= count) break;
      if (pile.length > round) {
        out.push(pile[round]);
        tookAny = true;
      }
    }
    if (!tookAny) break;
  }
  return out;
}
