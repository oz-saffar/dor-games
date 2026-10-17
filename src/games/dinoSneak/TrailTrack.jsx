import { memo } from 'react';

/**
 * Progress track: a dotted trail of dino footprints from the jungle edge to the picnic.
 *
 * The rAF loop writes straight to the DOM through `clipRef` / `markerRef` (clip-path + left)
 * so moving the dino never re-renders the React tree.
 */

const PRINTS = 13;

function Footprint({ lit }) {
  return (
    <svg viewBox="0 0 26 30" width="100%" height="100%" style={{ display: 'block' }}>
      <ellipse cx="13" cy="20" rx="7.5" ry="8" fill={lit ? '#bbf7d0' : 'rgba(255,255,255,0.22)'} />
      <ellipse cx="5.5" cy="10" rx="3.4" ry="4.6" fill={lit ? '#86efac' : 'rgba(255,255,255,0.2)'} transform="rotate(-18 5.5 10)" />
      <ellipse cx="13" cy="6.5" rx="3.6" ry="4.8" fill={lit ? '#86efac' : 'rgba(255,255,255,0.2)'} />
      <ellipse cx="20.5" cy="10" rx="3.4" ry="4.6" fill={lit ? '#86efac' : 'rgba(255,255,255,0.2)'} transform="rotate(18 20.5 10)" />
      {lit && <ellipse cx="11" cy="18" rx="3" ry="3" fill="rgba(255,255,255,0.55)" />}
    </svg>
  );
}

function Row({ lit }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px' }}>
      {Array.from({ length: PRINTS }, (_, i) => (
        <div
          key={i}
          style={{
            width: 15,
            height: 17,
            flexShrink: 0,
            transform: `translateY(${i % 2 === 0 ? -5 : 5}px) rotate(${i % 2 === 0 ? -8 : 8}deg)`,
            filter: lit ? 'drop-shadow(0 0 6px rgba(74,222,128,0.85))' : 'none',
          }}
        >
          <Footprint lit={lit} />
        </div>
      ))}
    </div>
  );
}

function TrailTrackBase({ clipRef, markerRef, accent = '#16a34a' }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        height: 44,
        borderRadius: 22,
        direction: 'ltr',
        background: 'linear-gradient(180deg, rgba(6,26,14,0.62) 0%, rgba(6,26,14,0.44) 100%)',
        border: '2px solid rgba(255,255,255,0.16)',
        boxShadow: '0 8px 22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        overflow: 'visible',
      }}
    >
      {/* dim trail */}
      <div style={{ position: 'absolute', inset: '0 34px 0 34px' }}>
        <Row lit={false} />
        {/* lit trail, revealed by clip-path */}
        <div ref={clipRef} style={{ position: 'absolute', inset: 0, clipPath: 'inset(0 100% 0 0)', willChange: 'clip-path' }}>
          <Row lit />
        </div>
        {/* travelling marker */}
        <div
          ref={markerRef}
          style={{
            position: 'absolute',
            top: '50%',
            left: '0%',
            width: 30,
            height: 30,
            marginTop: -15,
            marginLeft: -15,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontSize: 17,
            lineHeight: 1,
            background: `radial-gradient(circle at 35% 30%, #86efac, ${accent})`,
            boxShadow: `0 0 0 2px rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.4), 0 0 16px ${accent}`,
            willChange: 'left',
            zIndex: 2,
          }}
        >
          🦖
        </div>
      </div>

      {/* start cap */}
      <div style={{ position: 'absolute', left: 4, top: '50%', marginTop: -13, width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center', fontSize: 15 }}>
        🌿
      </div>
      {/* goal cap */}
      <div
        style={{
          position: 'absolute',
          right: 4,
          top: '50%',
          marginTop: -14,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(253,224,71,0.25)',
          border: '2px solid rgba(253,224,71,0.7)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 15,
          animation: 'dstGoal 1.9s ease-in-out infinite',
        }}
      >
        🧺
      </div>

      <style>{`
        @keyframes dstGoal {
          0%,100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(253,224,71,0.5); }
          50%     { transform: scale(1.12); box-shadow: 0 0 0 7px rgba(253,224,71,0); }
        }
      `}</style>
    </div>
  );
}

export default memo(TrailTrackBase);
