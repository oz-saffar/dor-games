import { motion } from 'framer-motion';

/**
 * One silicone bubble. Raised = bright highlight top-left; popped = the shading
 * flips (dark inside top-left, light rim bottom-right) and the dome squashes.
 */
const Bubble = ({ id, color, size, popped, wobble, reduce, onTap }) => {
  const raised = {
    background: `radial-gradient(circle at 34% 28%, color-mix(in srgb, ${color} 55%, white) 0%, ${color} 48%, color-mix(in srgb, ${color} 80%, black) 100%)`,
    boxShadow: `0 ${Math.round(size * 0.06)}px 0 color-mix(in srgb, ${color} 65%, black), 0 ${Math.round(size * 0.1)}px ${Math.round(size * 0.12)}px rgba(60,40,20,0.25)`,
  };
  const dented = {
    background: `radial-gradient(circle at 66% 72%, color-mix(in srgb, ${color} 70%, white) 0%, ${color} 40%, color-mix(in srgb, ${color} 62%, black) 100%)`,
    boxShadow: `inset 0 ${Math.round(size * 0.07)}px ${Math.round(size * 0.1)}px rgba(40,25,10,0.45), 0 1px 0 rgba(255,255,255,0.5)`,
  };

  let animate = { scale: 1 };
  if (popped) animate = reduce ? { scale: 0.92 } : { scale: [1, 0.78, 0.94, 0.9] };
  else if (wobble) animate = { scale: 1 };

  return (
    <motion.button
      type="button"
      data-bubble={id}
      data-popped={popped ? 'true' : 'false'}
      data-tap-target
      aria-label={popped ? 'בועה שפוצצה' : 'בועה'}
      onPointerDown={(e) => { e.preventDefault?.(); onTap(id); }}
      onClick={(e) => { if (e.detail === 0) onTap(id); }}
      animate={wobble && popped && !reduce ? { rotate: [0, -6, 6, -3, 0], scale: 0.9 } : animate}
      transition={{ duration: popped ? 0.22 : 0.3 }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        touchAction: 'none',
        WebkitTapHighlightColor: 'transparent',
        ...(popped ? dented : raised),
      }}
    />
  );
};

export default Bubble;
