import { INK, shade, tint } from '../../lib/palette';

/**
 * Flat drawings on a 100×100 box. `color` is the body colour; edges and
 * highlights are derived from it so any hue stays readable.
 */
const DRAW = {
  cup: (c, d) => (
    <>
      <path d="M26 30 H70 L64 78 Q63 84 57 84 H39 Q33 84 32 78 Z" fill={c} stroke={d} strokeWidth="3" strokeLinejoin="round" />
      <path d="M69 40 Q88 40 86 55 Q84 68 66 66" fill="none" stroke={d} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="48" cy="30" rx="22" ry="5" fill={tint(c, 0.45)} stroke={d} strokeWidth="3" />
    </>
  ),
  mug: (c, d) => (
    <>
      <rect x="22" y="26" width="46" height="56" rx="9" fill={c} stroke={d} strokeWidth="3" />
      <path d="M67 38 Q90 38 88 56 Q86 72 66 70" fill="none" stroke={d} strokeWidth="6" strokeLinecap="round" />
      <rect x="29" y="34" width="8" height="30" rx="4" fill={tint(c, 0.5)} />
    </>
  ),
  bowl: (c, d) => (
    <>
      <path d="M10 42 H90 Q88 82 50 84 Q12 82 10 42 Z" fill={c} stroke={d} strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="50" cy="42" rx="40" ry="8" fill={tint(c, 0.4)} stroke={d} strokeWidth="3" />
    </>
  ),
  plate: (c, d) => (
    <>
      <ellipse cx="50" cy="56" rx="42" ry="22" fill={c} stroke={d} strokeWidth="3" />
      <ellipse cx="50" cy="54" rx="28" ry="13" fill={tint(c, 0.4)} stroke={d} strokeWidth="2" />
    </>
  ),
  spoon: (c, d) => (
    <>
      <rect x="45" y="44" width="10" height="46" rx="5" fill={c} stroke={d} strokeWidth="3" />
      <ellipse cx="50" cy="26" rx="16" ry="21" fill={c} stroke={d} strokeWidth="3" />
      <ellipse cx="45" cy="20" rx="4" ry="8" fill={tint(c, 0.55)} />
    </>
  ),
  fork: (c, d) => (
    <>
      <rect x="45" y="44" width="10" height="46" rx="5" fill={c} stroke={d} strokeWidth="3" />
      <path d="M31 10 V34 Q31 46 50 46 Q69 46 69 34 V10" fill="none" stroke={d} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 10 V34 Q31 46 50 46 Q69 46 69 34 V10 M50 14 V44" fill="none" stroke={c} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  apple: (c, d) => (
    <>
      <path d="M50 28 Q22 20 16 50 Q14 84 40 88 Q50 90 50 88 Q50 90 60 88 Q86 84 84 50 Q78 20 50 28 Z" fill={c} stroke={d} strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 28 Q50 16 56 10" fill="none" stroke="#6b5640" strokeWidth="4" strokeLinecap="round" />
      <path d="M54 18 Q68 8 78 18 Q66 28 54 18 Z" fill="#6E9A63" stroke="#4f7347" strokeWidth="2" />
      <ellipse cx="31" cy="50" rx="5" ry="10" fill={tint(c, 0.5)} />
    </>
  ),
  banana: (c, d) => (
    <>
      <path d="M18 30 Q22 78 62 84 Q82 86 88 70 Q70 74 56 62 Q38 46 34 22 Z" fill={c} stroke={d} strokeWidth="3" strokeLinejoin="round" />
      <path d="M18 30 L22 14 L36 18 L34 22" fill="#8a7350" stroke={d} strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 40 Q40 66 62 74" fill="none" stroke={tint(c, 0.5)} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  sock: (c, d) => (
    <>
      <path d="M32 10 H60 V50 Q60 56 66 58 L84 66 Q92 72 90 80 Q86 90 74 88 L36 78 Q28 74 28 64 Z" fill={c} stroke={d} strokeWidth="3" strokeLinejoin="round" />
      <rect x="30" y="10" width="30" height="14" rx="3" fill={tint(c, 0.45)} stroke={d} strokeWidth="3" />
      <path d="M72 76 Q82 78 84 72" fill="none" stroke={tint(c, 0.5)} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  shirt: (c, d) => (
    <>
      <path d="M34 14 L10 28 L20 46 L30 40 V86 H70 V40 L80 46 L90 28 L66 14 Q50 28 34 14 Z" fill={c} stroke={d} strokeWidth="3" strokeLinejoin="round" />
      <path d="M34 14 Q50 28 66 14" fill="none" stroke={tint(c, 0.5)} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
};

export const ITEM_KINDS = Object.keys(DRAW);

export function ItemIcon({ kind, color = '#C4614B', size = '100%', ghost = false, title }) {
  const draw = DRAW[kind] ?? DRAW.cup;
  const body = ghost ? INK : color;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      style={{ display: 'block', overflow: 'visible', opacity: ghost ? 0.3 : 1, pointerEvents: 'none' }}
    >
      {draw(body, ghost ? INK : shade(color, 0.35))}
    </svg>
  );
}

/** The picture on a shelf label: a colour swatch, or a ghost silhouette of the type. */
export function ShelfLabelPicture({ shelf, size }) {
  if (shelf.mode === 'color') {
    return (
      <span
        role="img"
        aria-label={shelf.name}
        style={{
          display: 'block', width: size * 0.7, height: size * 0.7, borderRadius: '50%',
          background: shelf.color, border: `3px solid ${shade(shelf.color, 0.3)}`,
          boxShadow: '0 3px 0 rgba(58,54,48,0.18)',
        }}
      />
    );
  }
  return <ItemIcon kind={shelf.ghost} ghost size={size * 0.78} title={shelf.name} />;
}
