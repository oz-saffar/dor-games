/**
 * Warm Paper & Clay — the Montessori accent scale.
 *
 * Games draw with inline styles and SVG, where `var(--dor-*)` is awkward, so the
 * scale is mirrored here as plain hex. Prefer `var(--game-accent)` / `var(--game-surface)`
 * for anything that should follow the active game and the light/dark theme; reach for
 * these literals only for art that needs a fixed colour.
 */

/** Muted nature accents — the only hues a game surface should be built from */
export const ACCENTS = {
  sage: '#8FA98A',
  terracotta: '#C97B5A',
  ochre: '#D9A441',
  sky: '#7E9BB5',
  clay: '#C08B8B',
  moss: '#6E8B6E',
  plum: '#9887A8',
  sand: '#C9B08A',
};

/** Neutrals — mirror `--dor-*` in index.css (light theme) */
export const PAPER = '#F7F3EC';
export const PAPER_LIGHT = '#FFFDF8';
export const INK = '#3A3630';
export const INK_MUTED = '#7A7266';
export const INK_SUBTLE = '#A79D8E';
export const BORDER = '#E6DED1';
export const BORDER_STRONG = '#D6CBB9';

/**
 * Saturated-but-separable variants, for games where colour *is* the mechanic
 * (matching, sorting, hunting). Muted enough to sit in the system, far enough
 * apart to stay tellable by a four-year-old.
 */
export const PLAY_COLORS = {
  red: '#C4614B',
  orange: '#D98A45',
  yellow: '#D9B441',
  green: '#6E9A63',
  teal: '#5B9A96',
  blue: '#6A8FBA',
  purple: '#9179AE',
  pink: '#C57F9B',
  brown: '#A3805C',
  white: '#F5F0E6',
};

const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));

function parseHex(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]) {
  return '#' + [r, g, b].map((n) => clamp255(n).toString(16).padStart(2, '0')).join('');
}

/** Blend two hex colours; `t` 0 = a, 1 = b */
export function mix(a, b, t) {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

/** Wash a colour toward paper — `amount` 0 = untouched, 1 = paper */
export function tint(color, amount = 0.5) {
  return mix(color, PAPER_LIGHT, amount);
}

/** Deepen a colour toward ink — `amount` 0 = untouched, 1 = ink */
export function shade(color, amount = 0.5) {
  return mix(color, INK, amount);
}

/** Translucent version of a hex colour, for soft glows and overlays */
export function alpha(color, a) {
  const [r, g, b] = parseHex(color);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * The standard full-bleed game background: cream paper barely warmed by the
 * game's accent. Games should normally use `var(--game-surface)` instead, which
 * is the same recipe expressed in CSS so it follows the twilight theme.
 */
export function surfaceFor(accent) {
  return `linear-gradient(168deg, ${PAPER_LIGHT} 0%, ${tint(accent, 0.88)} 45%, ${tint(accent, 0.78)} 100%)`;
}
