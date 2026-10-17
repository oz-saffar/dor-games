import { ACCENTS, INK, PLAY_COLORS } from '../../lib/palette';

/**
 * Flat SVG art for every scene object. Each is drawn in a local -50..50 box,
 * inside a circle of radius ~46, then scaled to the object's `size`.
 * `c` is the object's main colour.
 */
const BROWN = PLAY_COLORS.brown;
const WHITE = PLAY_COLORS.white;

const starPoints = (outer, inner) => {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
};

const PETALS = [0, 60, 120, 180, 240, 300];
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

const DRAW = {
  sun: (c) => (
    <>
      {RAYS.map((a) => (
        <line key={a} x1="0" y1="-31" x2="0" y2="-45" stroke={c} strokeWidth="7"
          strokeLinecap="round" transform={`rotate(${a})`} />
      ))}
      <circle r="26" fill={c} />
      <circle r="26" fill="none" stroke={ACCENTS.ochre} strokeWidth="3" />
      <circle cx="-9" cy="-4" r="3" fill={INK} />
      <circle cx="9" cy="-4" r="3" fill={INK} />
      <path d="M-9 7 Q0 15 9 7" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  cloud: (c) => (
    <g fill={c} stroke={ACCENTS.sky} strokeWidth="2.5">
      <circle cx="-20" cy="6" r="17" />
      <circle cx="2" cy="-8" r="22" />
      <circle cx="24" cy="6" r="17" />
      <rect x="-37" y="6" width="78" height="17" rx="8" />
      <rect x="-30" y="2" width="62" height="18" stroke="none" />
    </g>
  ),
  balloon: (c) => (
    <>
      <path d="M0 26 Q-8 36 0 46" stroke={INK} strokeWidth="2.5" fill="none" />
      <polygon points="-5,28 5,28 0,21" fill={c} />
      <ellipse cx="0" cy="-8" rx="27" ry="32" fill={c} />
      <ellipse cx="-10" cy="-20" rx="6" ry="10" fill={WHITE} opacity="0.45" />
    </>
  ),
  tree: (c) => (
    <>
      <rect x="-6" y="8" width="12" height="38" rx="3" fill={BROWN} />
      <circle cx="-18" cy="0" r="19" fill={c} />
      <circle cx="18" cy="0" r="19" fill={c} />
      <circle cx="0" cy="-16" r="26" fill={c} />
      <circle cx="-6" cy="-6" r="22" fill={c} />
      <circle cx="-8" cy="-22" r="5" fill={PLAY_COLORS.red} />
      <circle cx="14" cy="-4" r="5" fill={PLAY_COLORS.red} />
    </>
  ),
  flower: (c) => (
    <>
      <path d="M0 -4 L0 46" stroke={PLAY_COLORS.green} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="13" cy="28" rx="12" ry="6" fill={PLAY_COLORS.green} transform="rotate(-25 13 28)" />
      <g transform="translate(0 -17)">
        {PETALS.map((a) => (
          <circle key={a} cx="0" cy="-16" r="12" fill={c} transform={`rotate(${a})`} />
        ))}
        <circle r="11" fill={c === PLAY_COLORS.yellow ? BROWN : PLAY_COLORS.yellow} />
      </g>
    </>
  ),
  house: (c) => (
    <>
      <rect x="14" y="-40" width="12" height="22" fill={BROWN} />
      <rect x="-32" y="-4" width="64" height="46" rx="3" fill={c} />
      <polygon points="-40,-2 0,-42 40,-2" fill={ACCENTS.terracotta} />
      <rect x="-24" y="12" width="14" height="30" rx="2" fill={BROWN} />
      <rect x="6" y="6" width="18" height="18" rx="2" fill={WHITE} stroke={INK} strokeWidth="2" />
      <line x1="15" y1="6" x2="15" y2="24" stroke={INK} strokeWidth="2" />
    </>
  ),
  ball: (c) => (
    <>
      <circle r="34" fill={c} />
      <path d="M-34 0 Q0 -26 34 0" stroke={WHITE} strokeWidth="7" fill="none" />
      <path d="M-30 14 Q0 38 30 14" stroke={WHITE} strokeWidth="7" fill="none" opacity="0.8" />
      <circle cx="-14" cy="-17" r="6" fill={WHITE} opacity="0.5" />
    </>
  ),
  cat: (c) => (
    <>
      <path d="M22 34 Q50 30 40 2" stroke={c} strokeWidth="9" fill="none" strokeLinecap="round" />
      <ellipse cx="0" cy="22" rx="25" ry="22" fill={c} />
      <polygon points="-22,-10 -20,-40 -4,-22" fill={c} />
      <polygon points="4,-22 20,-40 22,-10" fill={c} />
      <circle cx="0" cy="-12" r="22" fill={c} />
      <circle cx="-8" cy="-14" r="3.5" fill={INK} />
      <circle cx="8" cy="-14" r="3.5" fill={INK} />
      <polygon points="-3,-6 3,-6 0,-2" fill={ACCENTS.clay} />
      <line x1="-26" y1="-6" x2="-14" y2="-5" stroke={INK} strokeWidth="1.5" />
      <line x1="26" y1="-6" x2="14" y2="-5" stroke={INK} strokeWidth="1.5" />
    </>
  ),
  fish: (c) => (
    <>
      <polygon points="22,0 46,-20 46,20" fill={c} />
      <ellipse cx="-4" cy="0" rx="30" ry="22" fill={c} />
      <path d="M-4 -20 Q6 -34 14 -18" fill={c} />
      <circle cx="-18" cy="-5" r="6" fill={WHITE} />
      <circle cx="-19" cy="-5" r="3" fill={INK} />
      <path d="M-34 6 Q-30 12 -24 10" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  boat: (c) => (
    <>
      <rect x="-2" y="-42" width="4" height="52" fill={BROWN} />
      <polygon points="6,-40 6,2 38,2" fill={WHITE} stroke={INK} strokeWidth="1.5" />
      <polygon points="-6,-28 -6,2 -28,2" fill={PLAY_COLORS.yellow} stroke={INK} strokeWidth="1.5" />
      <path d="M-42 8 L42 8 L28 34 L-28 34 Z" fill={c} />
      <circle cx="-8" cy="20" r="4" fill={WHITE} />
      <circle cx="8" cy="20" r="4" fill={WHITE} />
    </>
  ),
  car: (c) => (
    <>
      <path d="M-30 0 L-18 -22 L10 -22 L22 0 Z" fill={c} />
      <path d="M-24 -2 L-16 -17 L-3 -17 L-3 -2 Z M1 -2 L1 -17 L9 -17 L17 -2 Z" fill={WHITE} />
      <rect x="-42" y="-2" width="84" height="26" rx="9" fill={c} />
      <circle cx="37" cy="9" r="5" fill={PLAY_COLORS.yellow} />
      <circle cx="-24" cy="26" r="10" fill={INK} />
      <circle cx="24" cy="26" r="10" fill={INK} />
      <circle cx="-24" cy="26" r="4" fill={WHITE} />
      <circle cx="24" cy="26" r="4" fill={WHITE} />
    </>
  ),
  star: (c) => (
    <>
      <polygon points={starPoints(46, 20)} fill={c} stroke={INK} strokeWidth="2" strokeLinejoin="round" opacity="0.95" />
      <circle cx="-7" cy="-2" r="3" fill={INK} />
      <circle cx="7" cy="-2" r="3" fill={INK} />
      <path d="M-6 8 Q0 13 6 8" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  umbrella: (c) => (
    <>
      <path d="M0 -2 L0 42 Q0 48 -6 46" stroke={BROWN} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M-44 0 A44 40 0 0 1 44 0 Q31 -8 22 0 Q11 -8 0 0 Q-11 -8 -22 0 Q-31 -8 -44 0 Z" fill={c} />
      <path d="M-11 -1 Q-14 -24 0 -40 Q14 -24 11 -1 Z" fill={WHITE} opacity="0.7" />
    </>
  ),
};

/** One scene object at its canvas position, size, mirror and growth. */
export function SceneObject({ obj }) {
  const draw = DRAW[obj.kind];
  if (!draw) return null;
  const s = (obj.size * (obj.scale ?? 1)) / 100;
  return (
    <g transform={`translate(${obj.x} ${obj.y}) scale(${obj.flip ? -s : s} ${s})`}
      data-object-id={obj.id} data-kind={obj.kind}>
      {draw(obj.color)}
    </g>
  );
}
