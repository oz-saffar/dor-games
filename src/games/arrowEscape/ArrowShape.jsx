import { useEffect, useMemo, useState } from 'react';
import { DIRS } from './arrowBoard';
import { buildPath, headTriangle, sliceArc, slideDistance, toPoints } from './arrowPath';

const STROKE = 0.46;

/** The drawn arrow: a rounded body plus a clear triangular head. */
function ArrowArt({ arrow, board, offset, color }) {
  const path = useMemo(() => buildPath(board, arrow), [board, arrow]);
  const len = arrow.cells.length - 1;
  const body = sliceArc(path, offset, offset + len);
  const headPt = body[body.length - 1];
  const tri = headTriangle(arrow.dir, headPt);
  // A one-cell arrow gets a short shaft of its own, or it reads as a bell.
  const { dr, dc } = DIRS[arrow.dir];
  const tail = len > 0 ? body[0] : [headPt[0] - dc * 0.36, headPt[1] - dr * 0.36];
  const shaft = len > 0 ? body : [tail, headPt];
  return (
    <g pointerEvents="none">
      <polyline
          points={toPoints(shaft)}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      <circle cx={tail[0]} cy={tail[1]} r={STROKE / 2} fill={color} />
      <polygon points={toPoints(tri)} fill={color} stroke={color} strokeWidth={0.06} strokeLinejoin="round" />
    </g>
  );
}

/** A resting arrow. The invisible cell rects are the tap target (whole body). */
export function RestingArrow({ arrow, board, color, state, onTap, onKey }) {
  const { wiggle, flash, hint, movable } = state;
  const anim = wiggle ? 'arWiggle' : flash ? 'arFlash' : hint ? 'arPulse' : 'none';
  return (
    <g
      data-arrow-id={arrow.id}
      data-movable={movable ? 'true' : 'false'}
      data-tap-target
      data-anim={anim}
      role="button"
      tabIndex={0}
      aria-label="חץ"
      onPointerDown={(e) => onTap(arrow.id, e)}
      onClick={(e) => { if (e.detail === 0) onTap(arrow.id, e); }}
      onKeyDown={(e) => onKey(arrow.id, e)}
      style={{
        cursor: 'pointer',
        outline: 'none',
        transformBox: 'fill-box',
        transformOrigin: 'center',
        animation: anim === 'none' ? undefined : `${anim} ${anim === 'arPulse' ? '900ms ease-in-out infinite' : anim === 'arFlash' ? '700ms ease-in-out' : '420ms ease-in-out'}`,
      }}
    >
      {arrow.cells.map((p) => (
        <rect key={`${p.r},${p.c}`} x={p.c} y={p.r} width={1} height={1} fill="transparent" />
      ))}
      <ArrowArt arrow={arrow} board={board} offset={0} color={color} />
    </g>
  );
}

/** An arrow mid-escape: the body window slides along its own path. */
export function LeavingArrow({ arrow, board, color, ms }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.max(0, Math.min(1, (now - t0) / ms));
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms]);

  const total = slideDistance(board, arrow);
  const offset = total * t * t * 0.6 + total * t * 0.4; // gentle ease-in
  return (
    <g data-leaving-id={arrow.id} pointerEvents="none">
      <ArrowArt arrow={arrow} board={board} offset={offset} color={color} />
    </g>
  );
}

export const ARROW_KEYFRAMES = `
@keyframes arWiggle {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-0.09px); }
  40% { transform: translateX(0.09px); }
  60% { transform: translateX(-0.06px); }
  80% { transform: translateX(0.05px); }
}
@keyframes arFlash {
  0%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.25; }
  50% { opacity: 1; }
}
@keyframes arPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.09); }
}
@media (prefers-reduced-motion: reduce) {
  [data-anim='arWiggle'], [data-anim='arPulse'] { animation: none !important; }
}
`;
