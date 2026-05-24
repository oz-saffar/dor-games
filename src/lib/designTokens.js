/**
 * Shared design tokens — align with CSS variables in index.css (:root).
 * Target: iPhone portrait/landscape + safe areas.
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
};

export const BACK_BUTTON = {
  position: 'fixed',
  top: SAFE_INSET,
  right: '12px',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.38)',
  borderRadius: '999px',
  padding: '10px 20px',
  fontSize: '15px',
  fontWeight: 800,
  fontFamily: 'var(--font-ui)',
  letterSpacing: '0.02em',
  cursor: 'pointer',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: 48,
  minHeight: 48,
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%), linear-gradient(165deg, #e05a48 0%, var(--dor-ember) 45%, #8f2d22 100%)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  boxShadow:
    '0 0 0 1px rgba(0,0,0,0.12), 0 5px 0 var(--dor-ember-dark), 0 12px 36px var(--dor-glow-ember), inset 0 1px 0 rgba(255,255,255,0.45)',
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
  padding: '10px 18px',
  borderRadius: '999px',
  fontSize: 'clamp(15px, 4vw, 17px)',
  fontWeight: 800,
  fontFamily: 'var(--font-ui)',
  letterSpacing: '0.03em',
  backgroundColor: 'var(--dor-glass)',
  color: 'var(--dor-ink)',
  border: '1px solid rgba(255,255,255,0.55)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  boxShadow:
    '0 0 0 1px rgba(0,0,0,0.06), 0 10px 28px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.65)',
};

export const INSTRUCTIONS_OVERLAY = {
  maxWidth: 420,
  padding: 28,
  titleSize: 'clamp(26px, 6vw, 38px)',
  bodySize: '17px',
  bodyLineHeight: 1.65,
  buttonBorderRadius: 'var(--dor-radius-lg)',
};

export const CELEBRATION_OVERLAY = {
  padding: '28px 32px',
  successTextSize: 'clamp(40px, 9vw, 52px)',
  photoMaxHeight: '38vh',
};
