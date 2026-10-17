import { ROWS, COLS } from './fourInRowLogic';

export const BOT_THINK_MS = 700;
export const RESET_MS = 2000;
export const CELEBRATION_MS = 3000;
export const TOP_RESERVE = 72;
export const BOTTOM_RESERVE = 20;
/** Height of the opponent strip above the board in portrait; width of it beside the board in landscape. */
export const OPP_PORTRAIT = 96;
export const OPP_LANDSCAPE = 150;

/**
 * Layout from BOTH viewport axes. Cell size is the largest that lets the whole
 * frame (board plus opponent) fit; phones are capped lower than tablets.
 */
export function layoutFor(width, height, isTablet) {
  const landscape = width > height;
  const pad = 0.4; // frame thickness, in cells (both sides together = pad)
  const availW = width - 24 - (landscape ? OPP_LANDSCAPE + 16 : 0);
  const availH = height - TOP_RESERVE - BOTTOM_RESERVE - (landscape ? 0 : OPP_PORTRAIT + 8);
  const fit = Math.min(availW / (COLS + pad), availH / (ROWS + pad));
  const cap = isTablet ? 150 : 110;
  const cell = Math.max(36, Math.floor(Math.min(fit, cap)));
  const framePad = Math.round(cell * pad / 2);
  return {
    landscape,
    cell,
    framePad,
    boardW: cell * COLS + framePad * 2,
    boardH: cell * ROWS + framePad * 2,
  };
}
