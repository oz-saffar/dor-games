import { PLAY_COLORS } from '../../lib/palette';

export const TOP_RESERVE = 84;
export const FINISH_ROW = 60;
export const AUTO_FINISH_MS = 1800;
export const CELEBRATION_MS = 2800;
export const GALLERY_KEY = 'dor.colorBook.gallery.v1';
export const GALLERY_MAX = 6;

export const SWATCHES = Object.entries(PLAY_COLORS).map(([name, hex]) => ({ name, hex }));

/** Palette swatch size and picture size from BOTH viewport dimensions. */
export function layoutFor(width, height, isTablet) {
  const landscape = width > height;
  const gap = 8;
  const cap = isTablet ? 76 : 60;
  if (landscape) {
    const swatch = Math.max(38, Math.min(cap, Math.floor((height - TOP_RESERVE - 24 - FINISH_ROW - gap * 5) / 5)));
    const paletteW = swatch * 2 + gap * 3;
    const picture = Math.max(120, Math.min(width - paletteW - 56, height - TOP_RESERVE - 16));
    return { landscape, swatch, gap, picture, paletteW };
  }
  const swatch = Math.max(36, Math.min(cap, Math.floor((width - 32 - gap * 6) / 5)));
  const paletteH = swatch * 2 + gap * 3 + 12;
  const picture = Math.max(120, Math.min(width - 16, height - TOP_RESERVE - paletteH - FINISH_ROW - 12));
  return { landscape, swatch, gap, picture, paletteH };
}

export function loadGallery() {
  try {
    const raw = JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]');
    return Array.isArray(raw) ? raw.slice(-GALLERY_MAX) : [];
  } catch {
    return [];
  }
}

export function saveToGallery(entry) {
  const next = [...loadGallery(), entry].slice(-GALLERY_MAX);
  try { localStorage.setItem(GALLERY_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  return next;
}
