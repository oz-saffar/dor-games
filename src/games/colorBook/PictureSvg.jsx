import { memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { INK, PAPER, VIEW, regionsFor } from './pictures';

const SPREAD_R = 300;

/**
 * One picture: fillable regions underneath, the dark outline on top
 * (pointer-events none). `fills` maps region id -> colour. `spreads` maps a
 * region id to { prev, color, cx, cy, key }, an ink-spread still in progress.
 * Without `onRegion` it is a static, non-interactive thumbnail.
 */
function PictureSvg({
  picture, difficulty, fills, size, spreads, onRegion, onSpreadDone, label,
}) {
  const svgRef = useRef(null);
  const regions = regionsFor(picture, difficulty);
  const interactive = typeof onRegion === 'function';

  const handleDown = (e, id) => {
    const rect = svgRef.current?.getBoundingClientRect?.();
    let cx = VIEW / 2;
    let cy = VIEW / 2;
    if (rect && rect.width > 0) {
      cx = ((e.clientX - rect.left) / rect.width) * VIEW;
      cy = ((e.clientY - rect.top) / rect.height) * VIEW;
    }
    onRegion(id, cx, cy);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      width={size}
      height={size}
      role={interactive ? 'group' : 'img'}
      aria-label={label || picture.title}
      style={{ display: 'block', touchAction: 'none', pointerEvents: interactive ? 'auto' : 'none' }}
    >
      <g>
        {regions.map((region) => {
          const spread = spreads?.[region.id];
          const color = fills[region.id];
          const base = spread ? spread.prev : color;
          return (
            <g key={region.id}>
              <path
                d={region.d}
                data-region={interactive ? region.id : undefined}
                data-filled={interactive ? String(Boolean(color)) : undefined}
                data-color={interactive ? color || '' : undefined}
                data-tap-target={interactive ? '' : undefined}
                fill={base || PAPER}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
                onPointerDown={interactive ? (e) => handleDown(e, region.id) : undefined}
                onClick={interactive ? (e) => { if (e.detail === 0) onRegion(region.id, VIEW / 2, VIEW / 2); } : undefined}
              />
              {spread && (
                <>
                  <clipPath id={`cb-${picture.id}-${region.id}-${spread.key}`}>
                    <motion.circle
                      cx={spread.cx}
                      cy={spread.cy}
                      initial={{ r: 0 }}
                      animate={{ r: SPREAD_R }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      onAnimationComplete={() => onSpreadDone?.(region.id, spread.key)}
                    />
                  </clipPath>
                  <path
                    d={region.d}
                    fill={spread.color}
                    clipPath={`url(#cb-${picture.id}-${region.id}-${spread.key})`}
                    style={{ pointerEvents: 'none' }}
                  />
                </>
              )}
            </g>
          );
        })}
      </g>
      <g
        fill="none"
        stroke={INK}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      >
        {regions.map((region) => <path key={region.id} d={region.d} />)}
      </g>
    </svg>
  );
}

export default memo(PictureSvg);
