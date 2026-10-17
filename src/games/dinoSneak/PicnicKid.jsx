import { memo } from 'react';

/**
 * A kid sitting cross-legged at the picnic, seen from behind.
 *
 * The head is a real 3D flip: two stacked SVG faces (back-of-head / face) inside a
 * `preserve-3d` wrapper, so "turning around" is one `rotateY` animation whose duration is
 * the difficulty's warning window.
 *
 * states: calm | warn | shrug | laugh | poof
 */

const KID_VARIANTS = [
  {
    skin: '#fcd3a4', skinDark: '#e8b482',
    hair: '#7c2d12', hairLight: '#9a3d1b',
    shirtA: '#fb7185', shirtB: '#e11d48', shirtTrim: '#fecdd3',
    pants: '#1e3a8a', shoes: '#0f172a', style: 'ponytail',
  },
  {
    skin: '#d99a63', skinDark: '#bd7f4c',
    hair: '#1f2937', hairLight: '#374151',
    shirtA: '#5eead4', shirtB: '#0d9488', shirtTrim: '#ccfbf1',
    pants: '#78350f', shoes: '#292524', style: 'curly',
  },
  {
    skin: '#fde3c4', skinDark: '#eec59d',
    hair: '#f59e0b', hairLight: '#fbbf24',
    shirtA: '#c4b5fd', shirtB: '#6d28d9', shirtTrim: '#ede9fe',
    pants: '#0c4a6e', shoes: '#1e293b', style: 'cap',
  },
];

/* ── back of the head ─────────────────────────────────────────────── */
function HeadBack({ v }) {
  return (
    <svg viewBox="0 0 52 52" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
      {/* neck */}
      <rect x="21" y="38" width="10" height="12" rx="4" fill={v.skinDark} />
      {/* skull */}
      <circle cx="26" cy="24" r="20" fill={v.hair} />
      {/* hair volume */}
      <circle cx="20" cy="19" r="14" fill={v.hairLight} opacity="0.55" />
      <circle cx="33" cy="17" r="10" fill={v.hairLight} opacity="0.4" />
      {/* nape */}
      <path d="M9,30 Q26,44 43,30 Q40,45 26,46 Q12,45 9,30 Z" fill={v.hair} />
      <g stroke={v.hairLight} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" fill="none">
        <path d="M14,16 Q20,10 28,10" />
        <path d="M18,12 Q26,7 35,12" />
        <path d="M33,14 Q39,18 41,26" />
      </g>
      {/* ears */}
      <ellipse cx="5.5" cy="27" rx="4.2" ry="5.4" fill={v.skin} />
      <ellipse cx="46.5" cy="27" rx="4.2" ry="5.4" fill={v.skin} />
      {v.style === 'ponytail' && (
        <g>
          <ellipse cx="26" cy="47" rx="8" ry="10" fill={v.hair} />
          <ellipse cx="26" cy="50" rx="5" ry="7" fill={v.hairLight} opacity="0.5" />
          <rect x="20" y="38" width="12" height="5" rx="2.5" fill="#f472b6" />
        </g>
      )}
      {v.style === 'curly' && (
        <g fill={v.hairLight} opacity="0.75">
          <circle cx="12" cy="14" r="6" />
          <circle cx="26" cy="7" r="7" />
          <circle cx="39" cy="15" r="6" />
          <circle cx="44" cy="27" r="5" />
          <circle cx="8" cy="26" r="5" />
        </g>
      )}
      {v.style === 'cap' && (
        <g>
          <path d="M5,22 Q6,3 26,3 Q46,3 47,22 Q26,15 5,22 Z" fill="#0ea5e9" />
          <path d="M5,21 Q0,25 3,29 Q14,26 24,25 Q13,22 5,21 Z" fill="#0284c7" />
          <circle cx="26" cy="5" r="3.4" fill="#38bdf8" />
        </g>
      )}
    </svg>
  );
}

/* ── the face ─────────────────────────────────────────────────────── */
function HeadFront({ v, laughing }) {
  return (
    <svg viewBox="0 0 52 52" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
      <rect x="21" y="38" width="10" height="12" rx="4" fill={v.skinDark} />
      <circle cx="26" cy="24" r="20" fill={v.skin} />
      <ellipse cx="26" cy="32" rx="15" ry="11" fill={v.skinDark} opacity="0.18" />
      {/* hair cap */}
      <path d="M6,24 Q4,4 26,4 Q48,4 46,24 Q42,13 26,13 Q10,13 6,24 Z" fill={v.hair} />
      <path d="M10,20 Q16,10 26,10 Q22,14 18,22 Z" fill={v.hairLight} opacity="0.6" />
      {/* ears */}
      <ellipse cx="5.5" cy="27" rx="4.2" ry="5.4" fill={v.skin} />
      <ellipse cx="46.5" cy="27" rx="4.2" ry="5.4" fill={v.skin} />
      {/* brows */}
      <path d="M13,20 Q18,16 23,19" stroke={v.hair} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M29,19 Q34,16 39,20" stroke={v.hair} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      {/* eyes */}
      {laughing ? (
        <g stroke="#0f172a" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M13,27 Q18,22 23,27" />
          <path d="M29,27 Q34,22 39,27" />
        </g>
      ) : (
        <g>
          <ellipse cx="18" cy="26" rx="5.4" ry="6" fill="#ffffff" />
          <ellipse cx="34" cy="26" rx="5.4" ry="6" fill="#ffffff" />
          <circle cx="18.6" cy="27" r="3.1" fill="#0f172a" />
          <circle cx="34.6" cy="27" r="3.1" fill="#0f172a" />
          <circle cx="19.8" cy="25.4" r="1.2" fill="#ffffff" />
          <circle cx="35.8" cy="25.4" r="1.2" fill="#ffffff" />
        </g>
      )}
      {/* blush */}
      <ellipse cx="10" cy="32" rx="4.6" ry="3" fill="#fb7185" opacity="0.5" />
      <ellipse cx="42" cy="32" rx="4.6" ry="3" fill="#fb7185" opacity="0.5" />
      {/* nose */}
      <path d="M26,28 Q28,31 25,32" stroke={v.skinDark} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* mouth */}
      {laughing ? (
        <g>
          <path d="M17,34 Q26,46 35,34 Q26,38 17,34 Z" fill="#7f1d1d" />
          <path d="M20,39 Q26,45 32,39 Q26,41 20,39 Z" fill="#fb7185" />
          <rect x="19" y="34" width="14" height="2.6" rx="1.3" fill="#ffffff" />
        </g>
      ) : (
        <g>
          <path d="M19,34 Q26,42 33,34 Q26,37 19,34 Z" fill="#9f1239" />
          <rect x="20.5" y="34" width="11" height="2.2" rx="1.1" fill="#ffffff" />
        </g>
      )}
    </svg>
  );
}

/* ── seated body, seen from behind ───────────────────────────────── */
function KidBody({ v }) {
  return (
    <svg viewBox="0 0 84 80" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`dskShirt${v.shirtB.slice(1)}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={v.shirtA} />
          <stop offset="100%" stopColor={v.shirtB} />
        </linearGradient>
      </defs>
      <ellipse cx="42" cy="76" rx="30" ry="6" fill="rgba(4,32,14,0.32)" />
      {/* crossed legs */}
      <path d="M14,58 Q28,48 42,54 Q56,48 70,58 Q72,70 56,72 L28,72 Q12,70 14,58 Z" fill={v.pants} />
      <path d="M20,62 Q42,56 64,62" stroke="#00000033" strokeWidth="2.4" fill="none" />
      <ellipse cx="20" cy="70" rx="10" ry="6" fill={v.shoes} />
      <ellipse cx="64" cy="70" rx="10" ry="6" fill={v.shoes} />
      <ellipse cx="19" cy="68" rx="6" ry="3" fill="#ffffff" opacity="0.25" />
      {/* torso */}
      <path
        d="M24,20 Q26,8 42,8 Q58,8 60,20 L64,52 Q64,60 54,60 L30,60 Q20,60 20,52 Z"
        fill={`url(#dskShirt${v.shirtB.slice(1)})`}
      />
      {/* shirt trim + stripe */}
      <path d="M20,44 Q42,38 64,44 L64,50 Q42,44 20,50 Z" fill={v.shirtTrim} opacity="0.55" />
      <path d="M24,20 Q42,14 60,20 L60,26 Q42,20 24,26 Z" fill="#ffffff" opacity="0.22" />
      {/* collar */}
      <path d="M32,10 Q42,18 52,10 Q42,6 32,10 Z" fill={v.shirtTrim} />
      {/* arms */}
      <g className="dsk-arm-l">
        <path d="M24,22 Q12,32 12,46 Q12,54 20,54 Q26,54 26,46 Q26,34 32,26 Z" fill={`url(#dskShirt${v.shirtB.slice(1)})`} />
        <circle cx="18" cy="54" r="7" fill={v.skin} />
      </g>
      <g className="dsk-arm-r">
        <path d="M60,22 Q72,32 72,46 Q72,54 64,54 Q58,54 58,46 Q58,34 52,26 Z" fill={`url(#dskShirt${v.shirtB.slice(1)})`} />
        <circle cx="66" cy="54" r="7" fill={v.skin} />
      </g>
    </svg>
  );
}

function PicnicKidBase({
  variant = 0,
  state = 'calm',
  turnMs = 1000,
  turnKey = 0,
  size = 1,
  idleDelay = 0,
  reduced = false,
}) {
  const v = KID_VARIANTS[variant % KID_VARIANTS.length];
  const laughing = state === 'laugh';
  const bubble = state === 'warn' ? '!' : laughing ? 'חחח!' : null;

  return (
    <div
      className="dsk"
      data-state={state}
      data-reduced={reduced ? '1' : '0'}
      aria-hidden
      style={{
        '--dsk-turn': `${turnMs}ms`,
        '--dsk-idle-delay': `${idleDelay}s`,
        position: 'relative',
        width: 84 * size,
        height: 122 * size,
      }}
    >
      {bubble && (
        <div className={`dsk-bubble ${laughing ? 'dsk-bubble-laugh' : 'dsk-bubble-warn'}`} style={{ fontSize: 22 * size }}>
          <span>{bubble}</span>
          <i />
        </div>
      )}

      <div className="dsk-sway" style={{ position: 'absolute', inset: 0 }}>
        {/* head — 3D flip */}
        <div style={{ position: 'absolute', left: 16 * size, top: 0, width: 52 * size, height: 52 * size, perspective: 340 }}>
          <div key={turnKey} className="dsk-head" style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
              <HeadBack v={v} />
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <HeadFront v={v} laughing={laughing} />
            </div>
          </div>
        </div>

        {/* body */}
        <div className="dsk-body" style={{ position: 'absolute', left: 0, bottom: 0, width: 84 * size, height: 80 * size }}>
          <KidBody v={v} />
        </div>
      </div>

      <style>{`
        .dsk svg g { transform-box: fill-box; }
        .dsk .dsk-sway { transform-origin: 50% 100%; animation: dskIdle 3.6s ease-in-out var(--dsk-idle-delay) infinite; }
        .dsk .dsk-head { transform: rotateY(0deg); }
        .dsk[data-state="calm"] .dsk-head { transition: transform .45s ease; }
        .dsk .dsk-arm-l, .dsk .dsk-arm-r { transform-origin: 50% 8%; }

        .dsk[data-state="warn"]  .dsk-head { animation: dskTurn var(--dsk-turn) ease-in-out forwards; }
        .dsk[data-state="warn"]  .dsk-sway { animation: dskAlerted .5s ease-out; }
        .dsk[data-state="warn"]  .dsk-arm-r { animation: dskFidget .55s ease-in-out infinite; }

        .dsk[data-state="shrug"] .dsk-head { animation: dskTurnBack .48s ease-in-out forwards; }
        .dsk[data-state="shrug"] .dsk-arm-l { animation: dskShrugArm .48s ease-in-out; }
        .dsk[data-state="shrug"] .dsk-arm-r { animation: dskShrugArm .48s ease-in-out; }

        .dsk[data-state="laugh"] .dsk-head { transform: rotateY(180deg); }
        .dsk[data-state="laugh"] .dsk-sway { animation: dskLaugh .34s ease-in-out infinite; }
        .dsk[data-state="laugh"] .dsk-arm-l { animation: dskPoint .34s ease-in-out infinite; }

        .dsk[data-state="poof"] { animation: dskPoof .55s cubic-bezier(.3,1.4,.6,1) forwards; }

        .dsk .dsk-bubble {
          position: absolute;
          left: 50%;
          top: -30%;
          transform: translateX(-50%);
          min-width: 2.2em;
          padding: .18em .55em .24em;
          border-radius: 999px;
          background: #ffffff;
          color: #0f172a;
          font-weight: 900;
          line-height: 1.15;
          text-align: center;
          direction: rtl;
          white-space: nowrap;
          box-shadow: 0 6px 18px rgba(0,0,0,.35);
          z-index: 4;
        }
        .dsk .dsk-bubble i {
          position: absolute;
          left: 50%;
          bottom: -6px;
          width: 14px; height: 14px;
          margin-left: -7px;
          background: #ffffff;
          transform: rotate(45deg);
          border-radius: 3px;
        }
        .dsk .dsk-bubble-warn  { color: #b91c1c; animation: dskBubblePop .38s cubic-bezier(.34,1.7,.5,1) both, dskBubblePulse .5s ease-in-out .38s infinite; }
        .dsk .dsk-bubble-laugh { color: #15803d; animation: dskBubblePop .3s cubic-bezier(.34,1.7,.5,1) both, dskBubbleBounce .38s ease-in-out .3s infinite; }

        @keyframes dskIdle {
          0%,100% { transform: rotate(-1.2deg) translateY(0); }
          50%     { transform: rotate(1.2deg) translateY(-2px); }
        }
        @keyframes dskAlerted {
          0%   { transform: translateY(0) scale(1); }
          40%  { transform: translateY(-6px) scale(1.05); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes dskTurn {
          0%   { transform: rotateY(0deg); }
          14%  { transform: rotateY(-16deg); }
          100% { transform: rotateY(180deg); }
        }
        @keyframes dskTurnBack {
          0%   { transform: rotateY(180deg); }
          100% { transform: rotateY(0deg); }
        }
        @keyframes dskFidget {
          0%,100% { transform: rotate(0deg); }
          50%     { transform: rotate(-12deg); }
        }
        @keyframes dskShrugArm {
          0%,100% { transform: rotate(0deg) translateY(0); }
          50%     { transform: rotate(-22deg) translateY(-7px); }
        }
        @keyframes dskLaugh {
          0%,100% { transform: translateY(0) rotate(-3deg) scale(1); }
          50%     { transform: translateY(-9px) rotate(3deg) scale(1.05); }
        }
        @keyframes dskPoint {
          0%,100% { transform: rotate(-46deg); }
          50%     { transform: rotate(-64deg); }
        }
        @keyframes dskPoof {
          0%   { transform: scale(1) rotate(0deg);      opacity: 1; }
          45%  { transform: scale(1.28) rotate(-10deg); opacity: 1; }
          100% { transform: scale(.35) rotate(26deg) translateY(-40px); opacity: 0; }
        }
        @keyframes dskBubblePop {
          0%   { transform: translateX(-50%) scale(0);   }
          100% { transform: translateX(-50%) scale(1);   }
        }
        @keyframes dskBubblePulse {
          0%,100% { transform: translateX(-50%) scale(1); }
          50%     { transform: translateX(-50%) scale(1.22); }
        }
        @keyframes dskBubbleBounce {
          0%,100% { transform: translateX(-50%) translateY(0) rotate(-4deg); }
          50%     { transform: translateX(-50%) translateY(-7px) rotate(4deg); }
        }

        .dsk[data-reduced="1"] .dsk-sway,
        .dsk[data-reduced="1"] .dsk-arm-l,
        .dsk[data-reduced="1"] .dsk-arm-r { animation: none !important; }
      `}</style>
    </div>
  );
}

export default memo(PicnicKidBase);
