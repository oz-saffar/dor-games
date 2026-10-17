import { useMemo } from 'react';
import { seeded } from './webSlingConfig';

/** Lit / dark window grid for one near building. */
function Windows({ b }) {
  const rects = useMemo(() => {
    const rnd = seeded(b.seed);
    const out = [];
    const cols = Math.max(2, Math.floor((b.w - 16) / 20));
    const gap = (b.w - 12) / cols;
    const rows = Math.floor((b.h - 30) / 26);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const roll = rnd();
        if (roll < 0.28) continue;
        out.push({
          x: b.x + 6 + c * gap + gap * 0.18,
          y: b.top + 18 + r * 26,
          w: gap * 0.58,
          h: 13,
          lit: roll > 0.55,
          warm: roll > 0.82,
        });
      }
    }
    return out;
  }, [b]);

  return (
    <g>
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          rx={2}
          fill={r.lit ? (r.warm ? '#ffd166' : '#bcd2e2') : '#2a2738'}
          opacity={r.lit ? 0.92 : 0.55}
        />
      ))}
    </g>
  );
}

/**
 * Sunset Manhattan in the show's flat comic style: bold shapes, halftone dots,
 * a hazy far skyline and a dark near skyline the villains hide behind.
 */
const CityBackdrop = ({ geom, reduce }) => {
  const { w, h, horizon, far, near } = geom;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      style={{ position: 'absolute', inset: 0, display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        {/* sky runs top → horizon so the sunset band lands on the skyline */}
        <linearGradient id="wsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b2740" />
          <stop offset="24%" stopColor="#453a5c" />
          <stop offset="48%" stopColor="#7a5a72" />
          <stop offset="68%" stopColor="#b5757a" />
          <stop offset="84%" stopColor="#d99a6f" />
          <stop offset="100%" stopColor="#e8cfa8" />
        </linearGradient>
        {/* below the horizon it is dusk haze, not more sunset */}
        <linearGradient id="wsGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a4a5e" />
          <stop offset="45%" stopColor="#3a3244" />
          <stop offset="100%" stopColor="#241f2e" />
        </linearGradient>
        <radialGradient id="wsSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d0" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#dca87f" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c98b6a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wsFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5f5170" />
          <stop offset="100%" stopColor="#7d6478" />
        </linearGradient>
        <linearGradient id="wsNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#333048" />
          <stop offset="100%" stopColor="#1f1d2c" />
        </linearGradient>
        <linearGradient id="wsRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#413d55" />
          <stop offset="100%" stopColor="#262336" />
        </linearGradient>
        <pattern id="wsDots" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#ffffff" opacity="0.16" />
        </pattern>
      </defs>

      <rect x="0" y="0" width={w} height={horizon} fill="url(#wsSky)" />
      <rect x="0" y={horizon} width={w} height={h - horizon} fill="url(#wsGround)" />
      <circle cx={w * 0.5} cy={horizon - 10} r={Math.min(w, h) * 0.34} fill="url(#wsSun)" />
      <rect x="0" y={horizon - h * 0.3} width={w} height={h * 0.3} fill="url(#wsDots)" />

      {/* clouds */}
      <g opacity="0.5" fill="#ffd9c2">
        <ellipse cx={w * 0.2} cy={horizon - 168} rx={72} ry={17} />
        <ellipse cx={w * 0.26} cy={horizon - 176} rx={48} ry={14} />
        <ellipse cx={w * 0.78} cy={horizon - 214} rx={88} ry={19} />
        <ellipse cx={w * 0.7} cy={horizon - 206} rx={52} ry={14} />
      </g>

      {/* far skyline — hazy, no detail */}
      <g opacity="0.72">
        {far.map((b, i) => (
          <rect key={i} x={b.x} y={b.top} width={b.w} height={b.h + 40} fill="url(#wsFar)" />
        ))}
      </g>

      {/* near skyline — the ledges villains pop from */}
      <g>
        {near.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.top} width={b.w} height={b.h} fill="url(#wsNear)" />
            <Windows b={b} />
            {/* parapet cap */}
            <rect x={b.x - 4} y={b.top - 9} width={b.w + 8} height={11} rx={3} fill="#39407e" />
            <rect x={b.x - 4} y={b.top - 9} width={b.w + 8} height={4} rx={2} fill="#5a63ab" />
            {/* water tower on some roofs */}
            {b.w > 110 && (
              <g transform={`translate(${b.x + b.w - 30}, ${b.top - 44})`}>
                <rect x="-13" y="0" width="26" height="30" rx="4" fill="#2b2140" />
                <path d="M-16 2 L0 -14 L16 2 Z" fill="#3d2f57" />
                <rect x="-11" y="30" width="4" height="10" fill="#241b36" />
                <rect x="7" y="30" width="4" height="10" fill="#241b36" />
              </g>
            )}
          </g>
        ))}
      </g>

      {/* foreground rooftop the hero stands on */}
      <g>
        <rect x="0" y={h - 96} width={w} height={96} fill="url(#wsRoof)" />
        <rect x="0" y={h - 100} width={w} height={9} rx={3} fill="#4a5296" />
        <rect x="0" y={h - 100} width={w} height={3.5} fill="#6f79c6" />
        <rect x="0" y={h - 60} width={w} height={60} fill="url(#wsDots)" opacity="0.4" />
      </g>

      {/* floodlight beams */}
      {!reduce && (
        <g opacity="0.09">
          <path d={`M${w * 0.12} ${h} L${w * 0.02} ${horizon - 120} L${w * 0.26} ${horizon - 120} Z`} fill="#ffe9a8" />
          <path d={`M${w * 0.88} ${h} L${w * 0.74} ${horizon - 150} L${w * 0.99} ${horizon - 150} Z`} fill="#ffe9a8" />
        </g>
      )}
    </svg>
  );
};

export default CityBackdrop;
