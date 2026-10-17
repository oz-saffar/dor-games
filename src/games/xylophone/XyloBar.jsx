import { memo } from 'react';
import { motion } from 'framer-motion';

/** One wooden bar. Owns its own pointer events; `vertical` = landscape layout. */
const XyloBar = ({ index, color, length, thickness, vertical, dipped, isNext, reduce, onStrike, notes }) => {
  const peg = Math.max(8, Math.round(thickness * 0.16));
  const pegStyle = (pos) => ({
    position: 'absolute',
    width: peg,
    height: peg,
    borderRadius: '50%',
    background: 'rgba(60,40,25,0.45)',
    ...(vertical
      ? { left: '50%', top: `${pos}%`, transform: 'translate(-50%,-50%)' }
      : { top: '50%', left: `${pos}%`, transform: 'translate(-50%,-50%)' }),
  });

  return (
    <motion.div
      role="button"
      aria-label={`קליד ${index + 1}`}
      data-bar={index}
      data-tap-target
      data-next={isNext ? 'true' : undefined}
      onPointerDown={(e) => {
        try {
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        } catch { /* synthetic events */ }
        onStrike(index, e.pointerId, true);
      }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onStrike(index, 'kbd', true); }}
      tabIndex={0}
      animate={{ scale: dipped && !reduce ? 0.95 : isNext && !reduce ? [1, 1.04, 1] : 1 }}
      transition={isNext && !dipped ? { duration: 1, repeat: Infinity } : { duration: 0.08 }}
      style={{
        position: 'relative',
        width: vertical ? thickness : length,
        height: vertical ? length : thickness,
        borderRadius: Math.round(thickness * 0.28),
        background: color,
        border: '1px solid var(--dor-border)',
        boxShadow: isNext
          ? `0 0 0 5px #fff, 0 0 0 9px ${color}, 0 3px 0 var(--dor-lip)`
          : 'var(--dor-shadow-card), 0 3px 0 var(--dor-lip)',
        touchAction: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <span style={pegStyle(14)} />
      <span style={pegStyle(86)} />
      {notes.map((n) => (
        <motion.span
          key={n}
          aria-hidden="true"
          initial={{ opacity: 1, y: 0 }}
          animate={reduce ? { opacity: 0 } : { opacity: 0, y: -90 }}
          transition={{ duration: 0.9 }}
          style={{
            position: 'absolute', left: '50%', top: '30%', fontSize: Math.max(22, thickness * 0.5),
            color: '#fff', pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          ♪
        </motion.span>
      ))}
    </motion.div>
  );
};

export default memo(XyloBar);
