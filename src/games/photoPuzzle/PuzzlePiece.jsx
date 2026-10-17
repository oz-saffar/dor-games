import { memo, useMemo } from 'react';

const SPARKLES = 7;

/**
 * One slice of the picture.
 *
 * Outer div owns the *position* (translate3d only, so dragging never fights an
 * animation); the inner div owns the *look* — scale, tilt, wobble, lock pop.
 * The slice itself is pure CSS: same background image on every piece, offset by
 * its cell. No canvas, no cropping, and placed neighbours line up seamlessly.
 */
const PuzzlePiece = memo(function PuzzlePiece({
  piece, x, y, w, h, boardImage, boardW, boardH,
  state, tilt = 0, trayScale = 1, wobble = false, locking = false,
  accent, reduce, floatDelay = 0, seamOpacity = 1, onPointerDown,
}) {
  const dragging = state === 'drag';
  const placed = state === 'placed';

  const sparkles = useMemo(
    () => Array.from({ length: SPARKLES }, (_, i) => {
      const a = (i / SPARKLES) * Math.PI * 2 + Math.random();
      const d = 26 + Math.random() * 26;
      return {
        id: i,
        dx: `${Math.cos(a) * d}px`,
        dy: `${Math.sin(a) * d}px`,
        rot: `${Math.round(-180 + Math.random() * 360)}deg`,
        left: `${18 + Math.random() * 64}%`,
        top: `${18 + Math.random() * 64}%`,
        size: 6 + Math.random() * 7,
      };
    }),
    [],
  );

  const visual = dragging
    ? `scale(1.12) rotate(${tilt * 0.25}deg)`
    : placed
      ? 'scale(1)'
      : `scale(${trayScale}) rotate(${tilt}deg)`;

  const animation = wobble
    ? 'ppWobble 520ms cubic-bezier(0.25,0.9,0.3,1)'
    : locking
      ? 'ppLockPop 420ms cubic-bezier(0.3,1.4,0.5,1)'
      : !placed && !dragging && !reduce
        ? 'ppTrayFloat 3.4s ease-in-out infinite'
        : 'none';

  return (
    <div
      onPointerDown={placed ? undefined : (e) => onPointerDown(e, piece)}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        transform: `translate3d(${Math.round(x - w / 2)}px, ${Math.round(y - h / 2)}px, 0)`,
        // the wobble lives on the inner div, so a rejected piece still *drifts* home
        transition: dragging ? 'none' : 'transform 300ms cubic-bezier(0.25,1.35,0.45,1)',
        zIndex: dragging ? 90 : placed ? 20 : 55,
        touchAction: 'none',
        cursor: placed ? 'default' : 'grab',
        willChange: 'transform',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: visual,
          transformOrigin: '50% 50%',
          '--pp-s': placed || dragging ? 1 : trayScale,
          '--pp-r': placed || dragging ? '0deg' : `${tilt}deg`,
          animation,
          animationDelay: `${floatDelay}ms`,
          transition: dragging ? 'transform 120ms ease-out' : 'transform 200ms ease-out',
        }}
      >
        {/* the photo slice */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: boardImage,
            backgroundSize: `${boardW}px ${boardH}px`,
            backgroundPosition: `${-piece.c * w}px ${-piece.r * h}px`,
            backgroundRepeat: 'no-repeat',
            borderRadius: placed ? 0 : 10,
            boxShadow: dragging
              ? '0 22px 34px rgba(8,25,40,0.48), 0 0 0 3px rgba(255,255,255,0.95)'
              : placed
                ? 'none'
                : '0 6px 12px rgba(8,25,40,0.32), 0 0 0 3px rgba(255,255,255,0.92)',
            overflow: 'hidden',
          }}
        >
          {/* soft inner seam so unplaced pieces read as separate tiles */}
          {!placed && (
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 10,
              boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.35), inset 0 -6px 12px rgba(0,0,0,0.22)',
              pointerEvents: 'none',
            }} />
          )}
          {placed && seamOpacity > 0 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: seamOpacity,
              transition: 'opacity 700ms ease-out',
              boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.30), inset 0 0 10px ${accent}33`,
              pointerEvents: 'none',
            }} />
          )}
          {/* success sweep */}
          {locking && !reduce && (
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '55%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.92), transparent)',
              animation: 'ppSweep 620ms ease-out forwards',
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {locking && !reduce && (
          <>
            <div style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 14,
              border: `3px solid ${accent}`,
              animation: 'ppLockRing 560ms ease-out forwards',
              pointerEvents: 'none',
            }} />
            {sparkles.map((s) => (
              <div
                key={s.id}
                style={{
                  position: 'absolute',
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #ffffff 0%, #a5f3fc 60%, transparent 72%)',
                  '--dx': s.dx,
                  '--dy': s.dy,
                  '--rot': s.rot,
                  animation: 'ppSparkle 780ms ease-out forwards',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
});

export default PuzzlePiece;
