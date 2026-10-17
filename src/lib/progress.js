/**
 * Home-screen progress: recent games, favourites, star chart, stickers.
 * Everything lives under one localStorage key. Nothing is ever taken away:
 * stars and stickers only go up, and there are no streaks.
 */
export const PROGRESS_KEY = 'dor-games-progress';
export const STARS_PER_STICKER = 5;
export const MAX_RECENT = 4;

export const STICKERS = [
  '🐶', '🐱', '🐰', '🐻', '🦁', '🐘', '🦒', '🐵',
  '🦖', '🦕', '🐢', '🐸', '🐧', '🦆', '🐠', '🐙',
  '🚗', '🚒', '🚜', '🚂', '✈️', '🚀', '⛵', '🚁',
];

export const emptyProgress = () => ({ recent: [], favourites: [], stars: 0, stickersSeen: 0 });

const toStrings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const toCount = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

/** Safe parse: any garbage collapses to an empty, well-shaped object. */
export function parseProgress(raw) {
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return emptyProgress();
    return {
      recent: [...new Set(toStrings(o.recent))].slice(0, MAX_RECENT),
      favourites: [...new Set(toStrings(o.favourites))],
      stars: toCount(o.stars),
      stickersSeen: toCount(o.stickersSeen),
    };
  } catch {
    return emptyProgress();
  }
}

export function loadProgress() {
  try {
    return parseProgress(window.localStorage.getItem(PROGRESS_KEY));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p) {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* storage blocked: progress simply will not persist */
  }
  return p;
}

/* ---------- pure reducers ---------- */

export const withRecent = (p, id) => ({
  ...p,
  recent: [id, ...p.recent.filter((x) => x !== id)].slice(0, MAX_RECENT),
});

export const withFavouriteToggled = (p, id) => ({
  ...p,
  favourites: p.favourites.includes(id) ? p.favourites.filter((x) => x !== id) : [...p.favourites, id],
});

export const withStar = (p) => ({ ...p, stars: p.stars + 1 });

export const stickersUnlocked = (stars) =>
  Math.min(STICKERS.length, Math.floor(toCount(stars) / STARS_PER_STICKER));

/** Stars collected toward the next sticker, and the size of the step. */
export function nextStickerProgress(stars) {
  if (stickersUnlocked(stars) >= STICKERS.length) return { done: true, current: STARS_PER_STICKER, total: STARS_PER_STICKER };
  return { done: false, current: toCount(stars) % STARS_PER_STICKER, total: STARS_PER_STICKER };
}

export const hasNewSticker = (p) => stickersUnlocked(p.stars) > p.stickersSeen;

export const withStickersSeen = (p) => ({ ...p, stickersSeen: stickersUnlocked(p.stars) });

/* ---------- persisted actions ---------- */

const update = (fn) => saveProgress(fn(loadProgress()));

export const recordPlayed = (id) => update((p) => withRecent(p, id));
export const toggleFavourite = (id) => update((p) => withFavouriteToggled(p, id));
export const recordStar = () => update(withStar);
export const markStickersSeen = () => update(withStickersSeen);

/* ---------- daily spotlight ---------- */

export const localDateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Same game all day for the same list of ids; changes with the local date. */
export function pickDailySpotlight(ids, date = new Date()) {
  if (!ids.length) return null;
  return ids[hashString(localDateKey(date)) % ids.length];
}
