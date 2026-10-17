import { memo } from 'react';

/** deterministic pseudo-random */
const rnd = (i) => {
  const x = Math.sin(i * 91.7 + 47.3) * 43758.5453;
  return x - Math.floor(x);
};

const GLYPHS = ['⭐', '💛', '✨', '💫', '🌟', '💚', '⭐', '💗'];

const BURST = Array.from({ length: 13 }, (_, i) => {
  const a = (i / 13) * Math.PI * 2 + rnd(i) * 0.5;
  const dist = 66 + rnd(i + 20) * 76;
  return {
    dx: Math.cos(a) * dist,
    dy: Math.sin(a) * dist - 34,
    rot: rnd(i + 40) * 520 - 260,
    size: 16 + rnd(i + 60) * 20,
    delay: rnd(i + 80) * 0.09,
    glyph: GLYPHS[i % GLYPHS.length],
  };
});

/** Comic "poof" — the kid bounces off in a puff of stars and hearts. */
function PoofBurstBase({ x, y, scale = 1 }) {
  return (
    <div aria-hidden style={{ position: 'absolute', left: x, bottom: y, width: 0, height: 0, zIndex: 26, pointerEvents: 'none' }}>
      <div className="dse-ring" />
      {BURST.map((p, i) => (
        <span
          key={i}
          className="dse-bit"
          style={{
            '--dx': `${p.dx * scale}px`,
            '--dy': `${p.dy * scale}px`,
            '--rot': `${p.rot}deg`,
            fontSize: p.size * scale,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.glyph}
        </span>
      ))}
      <style>{`
        .dse-ring {
          position: absolute; left: 0; top: 0;
          width: 20px; height: 20px; margin: -10px 0 0 -10px;
          border-radius: 50%;
          border: 5px solid rgba(255,255,255,0.9);
          animation: dseRing .58s cubic-bezier(.2,.8,.3,1) forwards;
        }
        .dse-bit {
          position: absolute; left: 0; top: 0;
          line-height: 1;
          transform: translate(-50%,-50%);
          animation: dseBit .82s cubic-bezier(.15,.7,.3,1) forwards;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,.35));
        }
        @keyframes dseRing {
          0%   { transform: scale(.2); opacity: .95; border-width: 7px; }
          100% { transform: scale(6.5); opacity: 0; border-width: 1px; }
        }
        @keyframes dseBit {
          0%   { transform: translate(-50%,-50%) scale(.2) rotate(0deg); opacity: 0; }
          18%  { opacity: 1; }
          60%  { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.15) rotate(var(--rot)); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx) * 1.15), calc(-50% + var(--dy) * 1.15 + 46px)) scale(.5) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/** Big Hebrew word that pops in the middle of the screen. */
function HebrewPopupBase({ text, tone = 'win' }) {
  const win = tone === 'win';
  return (
    <div
      aria-live="polite"
      style={{
        position: 'absolute',
        top: '34%',
        left: '50%',
        transform: 'translateX(-50%)',
        direction: 'rtl',
        whiteSpace: 'nowrap',
        fontSize: 'clamp(38px, 11vw, 76px)',
        fontWeight: 900,
        letterSpacing: '-0.5px',
        color: win ? '#fde047' : '#fff7ed',
        textShadow: win
          ? '0 0 34px rgba(250,204,21,0.95), 0 5px 0 #b45309, 0 8px 24px rgba(0,0,0,0.55)'
          : '0 0 22px rgba(74,222,128,0.7), 0 4px 0 #14532d, 0 8px 22px rgba(0,0,0,0.5)',
        zIndex: 70,
        pointerEvents: 'none',
        animation: win ? 'dsePopWin .9s cubic-bezier(.34,1.56,.64,1) both' : 'dsePopSoft 1.35s ease both',
      }}
    >
      {text}
      <style>{`
        @keyframes dsePopWin {
          0%   { opacity: 0; transform: translateX(-50%) scale(.3) rotate(-9deg); }
          45%  { opacity: 1; transform: translateX(-50%) scale(1.16) rotate(3deg); }
          70%  { transform: translateX(-50%) scale(1) rotate(0deg); }
          100% { opacity: 1; transform: translateX(-50%) scale(1) rotate(0deg); }
        }
        @keyframes dsePopSoft {
          0%   { opacity: 0; transform: translateX(-50%) translateY(14px) scale(.7); }
          22%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.05); }
          72%  { opacity: 1; transform: translateX(-50%) translateY(-6px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-26px) scale(1.02); }
        }
      `}</style>
    </div>
  );
}

/** Little reward sparkle ring when the child freezes in time. */
function FreezeSparkleBase() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 24 }}>
      {Array.from({ length: 7 }, (_, i) => (
        <span
          key={i}
          className="dse-spark"
          style={{
            left: `${18 + i * 11}%`,
            top: `${12 + (i % 3) * 22}%`,
            animationDelay: `${i * 0.055}s`,
            fontSize: 15 + (i % 3) * 7,
          }}
        >
          ✨
        </span>
      ))}
      <style>{`
        .dse-spark {
          position: absolute;
          line-height: 1;
          opacity: 0;
          animation: dseSpark .78s ease-out forwards;
        }
        @keyframes dseSpark {
          0%   { opacity: 0; transform: scale(.3) rotate(-30deg); }
          35%  { opacity: 1; transform: scale(1.15) rotate(8deg); }
          100% { opacity: 0; transform: scale(.6) translateY(-22px) rotate(24deg); }
        }
      `}</style>
    </div>
  );
}

export const PoofBurst = memo(PoofBurstBase);
export const HebrewPopup = memo(HebrewPopupBase);
export const FreezeSparkle = memo(FreezeSparkleBase);
