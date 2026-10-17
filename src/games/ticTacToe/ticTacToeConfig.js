export const BOT_THINK_MS = 600;
export const RESET_MS = 2000;
export const CELEBRATION_MS = 3200;
export const TOP_RESERVE = 72;
export const BOTTOM_RESERVE = 20;
export const OPP_PORTRAIT = 96;
export const OPP_LANDSCAPE = 150;
export const STORAGE_KEY = 'dor-tic-tac-toe-piece';

export const PIECES = {
  dino: { dor: '🦖', bot: '⭐', label: 'דינוזאור' },
  rocket: { dor: '🚀', bot: '🐙', label: 'חללית' },
};

/** Board side from BOTH viewport axes, leaving room for the opponent and the corner chrome. */
export function layoutFor(width, height, isTablet) {
  const landscape = width > height;
  const availW = width - 24 - (landscape ? OPP_LANDSCAPE + 16 : 0);
  const availH = height - TOP_RESERVE - BOTTOM_RESERVE - (landscape ? 0 : OPP_PORTRAIT + 8);
  const cap = isTablet ? 640 : 420;
  const side = Math.max(210, Math.floor(Math.min(availW, availH, cap)));
  const pad = Math.round(side * 0.04);
  return { landscape, side, pad, cell: (side - pad * 2) / 3 };
}

export function readPiece() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && PIECES[v] ? v : null;
  } catch {
    return null;
  }
}

export function savePiece(key) {
  try { window.localStorage.setItem(STORAGE_KEY, key); } catch { /* private mode */ }
}
