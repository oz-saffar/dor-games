import { motion } from 'framer-motion';
import { LADDER } from './mergeConfig';
import { shade, tint } from '../../lib/palette';

/** One board cell: a clay tile with a big animal, or an empty hollow. */
const Tile = ({ idx, r, c, tier, size, selected, drag, fx, reduce, onDown }) => {
  const inner = size - 8;
  const filled = tier != null;
  const hue = filled ? LADDER[tier].color : null;

  let animate = { x: 0, y: 0, scale: 1, rotate: 0 };
  let transition = reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 22 };
  if (drag) {
    animate = { x: drag.dx, y: drag.dy, scale: 1.12, rotate: 0 };
    transition = { duration: 0 };
  } else if (fx && !reduce) {
    if (fx.kind === 'merge') animate = { x: 0, y: 0, scale: [0.6, 1.25, 1], rotate: 0 };
    else if (fx.kind === 'spawn') animate = { x: 0, y: 0, scale: [0, 1.15, 1], rotate: 0 };
    else if (fx.kind === 'wobble') animate = { x: 0, y: 0, scale: 1, rotate: [0, -8, 8, -5, 0] };
    transition = { duration: fx.kind === 'wobble' ? 0.45 : 0.4 };
  } else if (selected && !reduce) {
    animate = { x: 0, y: 0, scale: 1.08, rotate: 0 };
  }

  return (
    <div
      data-tile={`${r}-${c}`}
      data-tier={filled ? tier : 'empty'}
      {...(filled ? { 'data-tap-target': true } : {})}
      onPointerDown={filled ? (e) => onDown(e, idx) : undefined}
      aria-label={filled ? LADDER[tier].name : undefined}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: drag ? 5 : selected ? 2 : 1,
        touchAction: 'none',
        cursor: filled ? 'grab' : 'default',
      }}
    >
      <motion.div
        key={fx ? `${fx.kind}-${fx.n}` : 'idle'}
        initial={false}
        animate={animate}
        transition={transition}
        style={{
          width: inner,
          height: inner,
          borderRadius: Math.round(inner * 0.28),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(inner * 0.58),
          lineHeight: 1,
          background: filled ? tint(hue, 0.55) : 'color-mix(in srgb, var(--game-accent) 12%, transparent)',
          border: filled
            ? `${selected ? 3 : 1}px solid ${selected ? 'var(--game-accent)' : shade(hue, 0.15)}`
            : '1px dashed var(--dor-border)',
          boxShadow: filled ? `var(--dor-shadow-card), 0 3px 0 ${shade(hue, 0.25)}` : 'none',
        }}
      >
        {filled ? LADDER[tier].emoji : null}
      </motion.div>
    </div>
  );
};

export default Tile;
