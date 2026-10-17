import { memo } from 'react';
import TrailTrack from './TrailTrack';

/**
 * Readable-state HUD:
 *   • a coloured rim vignette — green while sneaking, amber while frozen,
 *     with a pulsing red rim on top while a kid is turning around
 *   • a short status pill so the child always knows what the game wants
 *   • the dotted footprint progress trail along the bottom
 */
function SneakHudBase({ moving, warning, status, clipRef, markerRef, accent, reduced = false }) {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 22,
          pointerEvents: 'none',
          boxShadow: moving
            ? 'inset 0 0 0 5px rgba(34,197,94,0.85), inset 0 0 110px 26px rgba(34,197,94,0.42)'
            : 'inset 0 0 0 5px rgba(245,158,11,0.85), inset 0 0 110px 26px rgba(245,158,11,0.38)',
          transition: 'box-shadow 0.2s ease',
        }}
      />

      {warning && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 23,
            pointerEvents: 'none',
            boxShadow: 'inset 0 0 0 9px rgba(239,68,68,0.9), inset 0 0 130px 34px rgba(239,68,68,0.34)',
            animation: reduced ? 'none' : 'dsWarnPulse 0.5s ease-in-out infinite',
          }}
        />
      )}

      <div
        aria-live="polite"
        style={{
          position: 'absolute',
          top: 'calc(14px + env(safe-area-inset-top, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          pointerEvents: 'none',
          direction: 'rtl',
          padding: '8px 18px',
          borderRadius: 999,
          background: status.bg,
          color: 'white',
          fontSize: 'clamp(13px, 3.6vw, 17px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          border: '2px solid rgba(255,255,255,0.4)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
          transition: 'background 0.18s ease',
        }}
      >
        {status.text}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          zIndex: 55,
          pointerEvents: 'none',
        }}
      >
        <TrailTrack clipRef={clipRef} markerRef={markerRef} accent={accent} />
      </div>

      <style>{`
        @keyframes dsWarnPulse {
          0%,100% { opacity: .55; }
          50%     { opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default memo(SneakHudBase);
