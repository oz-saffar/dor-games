/**
 * Shared design tokens — align with CSS variables in index.css (:root).
 * Target: iPhone portrait/landscape + safe areas.
 *
 * Warm Paper & Clay: raised surfaces are a warm panel + 1px border + a soft
 * shadow + a 3px bottom "lip". No glow, no glass, no gradient rims.
 */

export const SAFE_INSET = 'calc(12px + env(safe-area-inset-top, 0))';
export const SAFE_INSET_BOTTOM = 'calc(12px + env(safe-area-inset-bottom, 0))';
export const SAFE_INSET_LEFT = 'calc(12px + env(safe-area-inset-left, 0))';
export const SAFE_INSET_RIGHT = 'calc(12px + env(safe-area-inset-right, 0))';

/** Semantic colors (mirror var(--dor-*)) for inline styles where Tailwind is awkward */
export const colors = {
  ink: 'var(--dor-ink)',
  inkMuted: 'var(--dor-ink-muted)',
  ember: 'var(--dor-ember)',
  emberDark: 'var(--dor-ember-dark)',
  panel: 'var(--dor-panel)',
  panelElevated: 'var(--dor-panel-elevated)',
  border: 'var(--dor-border)',
  borderStrong: 'var(--dor-border-strong)',
  accent: 'var(--game-accent)',
  card: 'var(--game-card)',
  cardStrong: 'var(--game-card-strong)',
  edge: 'var(--game-edge)',
};

/** The one raised-surface recipe every panel in the app is built from */
export const SOFT_SURFACE = {
  backgroundColor: 'var(--dor-panel)',
  border: '1px solid var(--dor-border)',
  boxShadow: '0 3px 0 var(--dor-lip), var(--dor-shadow-card)',
};

export const BACK_BUTTON = {
  position: 'fixed',
  top: SAFE_INSET,
  right: '12px',
  color: 'var(--dor-ink)',
  backgroundColor: 'var(--dor-panel)',
  border: '1px solid var(--dor-border-strong)',
  borderRadius: '999px',
  padding: '11px 20px',
  fontSize: '15px',
  fontWeight: 700,
  fontFamily: 'var(--font-ui)',
  letterSpacing: '0.01em',
  cursor: 'pointer',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: 48,
  minHeight: 48,
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  boxShadow: '0 3px 0 var(--dor-lip), var(--dor-shadow-card)',
};

export const BACK_BUTTON_ICON_SIZE = '20px';

export const SCORE_BADGE = {
  position: 'absolute',
  top: SAFE_INSET,
  left: '12px',
  padding: '8px 16px',
  borderRadius: 'var(--dor-radius-md)',
  fontSize: '18px',
  fontWeight: 700,
  zIndex: 100,
};

export const SCORE_BADGE_CONTENT = {
  padding: '11px 18px',
  borderRadius: '999px',
  fontSize: 'clamp(15px, 4vw, 17px)',
  fontWeight: 800,
  fontFamily: 'var(--font-ui)',
  letterSpacing: '0.02em',
  backgroundColor: 'var(--dor-panel)',
  color: 'var(--dor-ink)',
  border: '1px solid var(--dor-border-strong)',
  boxShadow: '0 3px 0 var(--dor-lip), var(--dor-shadow-card)',
};

export const INSTRUCTIONS_OVERLAY = {
  maxWidth: 440,
  padding: 28,
  titleSize: 'clamp(26px, 6vw, 36px)',
  bodySize: '17px',
  bodyLineHeight: 1.7,
  buttonBorderRadius: 'var(--dor-radius-lg)',
  /* Warm, lightly-dimmed scrim — the card should read as paper on a table */
  scrim: 'rgba(58, 54, 48, 0.42)',
};

export const CELEBRATION_OVERLAY = {
  padding: '28px 32px',
  successTextSize: 'clamp(38px, 8.5vw, 50px)',
  photoMaxHeight: '38vh',
  scrim: 'rgba(58, 54, 48, 0.38)',
};
