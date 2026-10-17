import SPRITES from './sprites.json';

/** Local-space height the hand-drawn fallback villains occupy (anchor at their feet). */
export const DRAWN_H = 126;

export const hasSprite = (id) => Boolean(SPRITES[id]);
export const spriteAspect = (id) => (SPRITES[id] ? SPRITES[id].w / SPRITES[id].h : 0.8);
export const spriteSrc = (id) => SPRITES[id]?.src ?? null;
export const spriteFor = (id) => SPRITES[id] ?? null;

/** Warms every sprite so the first pop-up isn't a blank frame while the PNG loads. */
export function preloadSprites() {
  if (typeof Image === 'undefined') return;
  for (const s of Object.values(SPRITES)) {
    const img = new Image();
    img.src = s.src;
  }
}
