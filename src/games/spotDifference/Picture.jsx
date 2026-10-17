import { motion } from 'framer-motion';
import { SceneArt, HINT_COLOR, RING_COLOR } from './SceneBackground';
import { ringPath } from './ringPath';
import { MIN_HIT_PX, SCENE_H, SCENE_W } from './sceneConfig';

/** Svg-space point under a pointer event, or null when the svg has no layout (jsdom). */
function pointOf(e) {
  const svg = e.currentTarget.ownerSVGElement ?? e.currentTarget;
  const rect = svg.getBoundingClientRect?.();
  if (!rect || !rect.width || e.clientX == null) return null;
  return {
    x: ((e.clientX - rect.left) / rect.width) * SCENE_W,
    y: ((e.clientY - rect.top) / rect.height) * SCENE_H,
  };
}

/**
 * One of the two pictures. Every difference gets a generous transparent hit
 * circle (at least MIN_HIT_PX on screen), a ring once found, and a pulse when hinted.
 */
export default function Picture({
  scene, differences, found, hintId, width, height, reduce, label, side, ripples, onFind, onMiss,
}) {
  const unit = width / SCENE_W;
  const hitMin = MIN_HIT_PX / unit;

  const handleHit = (diff, e) => {
    e.stopPropagation();
    if (e.type === 'pointerdown') e.preventDefault?.();
    else if (e.detail !== 0) return; // a real click already fired on pointerdown
    const pt = pointOf(e);
    let target = diff;
    if (pt) {
      // Neighbouring hit circles can overlap on a phone: the closest centre wins.
      let best = null;
      for (const d of differences) {
        if (found.includes(d.id)) continue;
        const dd = Math.hypot(d.cx - pt.x, d.cy - pt.y);
        if (dd <= Math.max(d.r, hitMin) && (!best || dd < best.dd)) best = { d, dd };
      }
      target = best ? best.d : null;
    }
    if (target) onFind(target.id);
  };

  return (
    <div
      style={{
        width,
        height,
        borderRadius: Math.round(Math.min(width, 520) * 0.04),
        overflow: 'hidden',
        background: 'var(--game-surface)',
        border: '2px solid var(--game-accent)',
        boxShadow: 'var(--dor-shadow-card), 0 3px 0 var(--dor-lip)',
        flex: 'none',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ display: 'block', touchAction: 'none' }}
        aria-label={label}
        data-picture={side}
        onPointerDown={(e) => {
          const pt = pointOf(e);
          if (pt) onMiss(side, pt);
          else onMiss(side, null);
        }}
      >
        <SceneArt scene={scene} />

        <g style={{ pointerEvents: 'none' }}>
          {ripples.filter((rp) => rp.side === side).map((rp) => (
            <motion.circle
              key={rp.key}
              cx={rp.x}
              cy={rp.y}
              r={2}
              fill="none"
              stroke="#FFFDF8"
              strokeWidth="0.9"
              initial={{ r: 1.5, opacity: 0.85 }}
              animate={reduce ? { opacity: 0 } : { r: 7, opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          ))}
          {differences.map((d) => {
            const ring = ringPath(d.cx, d.cy, d.r + 3, d.id);
            if (found.includes(d.id)) {
              return (
                <g key={`ring-${d.id}`} data-ring={d.id}>
                  <path d={ring} fill="none" stroke="#FFFDF8" strokeWidth="3.2" strokeLinecap="round" opacity="0.75" />
                  <motion.path
                    d={ring}
                    fill="none"
                    stroke={RING_COLOR}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                </g>
              );
            }
            if (hintId === d.id) {
              return (
                <circle
                  key={`hint-${d.id}`}
                  className={reduce ? undefined : 'sd-pulse'}
                  data-hint={d.id}
                  cx={d.cx}
                  cy={d.cy}
                  r={d.r + 2}
                  fill={HINT_COLOR}
                  fillOpacity="0.25"
                  stroke={HINT_COLOR}
                  strokeWidth="1.4"
                  strokeDasharray="3 2"
                  opacity={reduce ? 0.8 : undefined}
                />
              );
            }
            return null;
          })}
        </g>

        {differences.map((d) => (
          <circle
            key={`hit-${d.id}`}
            role="button"
            tabIndex={0}
            aria-label="הבדל"
            data-tap-target
            data-diff-id={d.id}
            data-found={found.includes(d.id) ? 'true' : 'false'}
            data-picture={side}
            cx={d.cx}
            cy={d.cy}
            r={Math.max(d.r, hitMin)}
            fill="transparent"
            style={{ cursor: 'pointer', outline: 'none' }}
            onPointerDown={(e) => handleHit(d, e)}
            onClick={(e) => handleHit(d, e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onFind(d.id);
              }
            }}
          />
        ))}
      </svg>
    </div>
  );
}
