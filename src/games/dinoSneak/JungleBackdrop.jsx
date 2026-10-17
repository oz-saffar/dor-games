import { memo } from 'react';

/**
 * Layered jungle clearing backdrop for "דינוזאור מתגנב".
 *
 * Depth layers (far → near):
 *   1. sky gradient + sun bloom + drifting clouds   (cool, hazy, low contrast)
 *   2. far volcano ridge                             (blue-green, blurred)
 *   3. mid jungle canopy + palms                     (mid green)
 *   4. clearing ground + light pools                 (warm green)
 *   5. foreground ferns + swaying grass              (near-black green, in front of the cast)
 *
 * Everything here is decorative: `pointer-events: none`, `aria-hidden`.
 */

/** deterministic pseudo-random so layout never churns between renders */
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const HORIZON = 58; // % from the top of the screen

const CLOUDS = [
  { top: '5%', w: 176, o: 0.5, dur: 104, delay: 0 },
  { top: '12%', w: 116, o: 0.36, dur: 138, delay: -46 },
  { top: '19%', w: 224, o: 0.22, dur: 182, delay: -104 },
  { top: '8%', w: 92, o: 0.28, dur: 122, delay: -78 },
];

const MOTES = Array.from({ length: 16 }, (_, i) => ({
  left: `${4 + rnd(i) * 92}%`,
  bottom: `${20 + rnd(i + 31) * 40}%`,
  size: 3 + rnd(i + 61) * 5,
  dur: 9 + rnd(i + 91) * 13,
  delay: -(rnd(i + 121) * 16),
  o: 0.14 + rnd(i + 151) * 0.28,
}));

const GRASS_BLADES = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i / 26) * 104 - 2 + rnd(i + 7) * 2}%`,
  h: 26 + rnd(i + 41) * 44,
  w: 7 + rnd(i + 71) * 7,
  dur: 3.2 + rnd(i + 101) * 2.6,
  delay: -(rnd(i + 131) * 4),
  tilt: rnd(i + 161) * 16 - 8,
  shade: ['#052e16', '#064e2b', '#0b3f22'][i % 3],
}));

function Cloud({ top, w, o, dur, delay, reduced }) {
  return (
    <svg
      viewBox="0 0 120 48"
      width={w}
      height={w * 0.4}
      style={{
        position: 'absolute',
        top,
        left: '-25%',
        opacity: o,
        filter: 'blur(1.5px)',
        animation: reduced ? 'none' : `dsCloud ${dur}s linear ${delay}s infinite`,
      }}
    >
      <path
        d="M18,44 Q0,44 2,32 Q4,20 18,20 Q22,4 42,6 Q56,-2 68,8 Q86,4 92,18 Q116,18 116,32 Q116,44 100,44 Z"
        fill="rgba(255,255,255,0.9)"
      />
      <path
        d="M18,44 Q0,44 2,32 Q6,28 20,30 Q40,26 62,32 Q86,28 104,34 Q116,36 116,40 Q112,44 100,44 Z"
        fill="rgba(186,230,253,0.55)"
      />
    </svg>
  );
}

/** Distant ridge line with a friendly (non-threatening) volcano. */
function FarRidge({ reduced }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: `${100 - HORIZON}%`,
        height: '30%',
        filter: 'blur(1.2px)',
        opacity: 0.82,
      }}
    >
      <svg
        viewBox="0 0 1200 320"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="dsRidgeFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#155e75" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="dsRidgeMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f7a5a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="dsVolcano" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4b6a72" />
            <stop offset="100%" stopColor="#1d3b3f" />
          </linearGradient>
          <radialGradient id="dsLava" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="55%" stopColor="#f97316" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* farthest jagged ridge */}
        <path
          d="M0,320 L0,206 L110,132 L196,178 L296,104 L420,186 L520,146 L648,214 L760,156 L868,74 L968,158 L1082,116 L1200,182 L1200,320 Z"
          fill="url(#dsRidgeFar)"
        />

        {/* volcano */}
        <g>
          <path d="M760,320 L862,88 L878,88 L980,320 Z" fill="url(#dsVolcano)" />
          <path d="M846,120 L862,88 L878,88 L894,120 Q870,132 846,120 Z" fill="#5d7f86" opacity="0.9" />
          <path d="M849,110 Q870,120 891,110 Q878,150 870,196 Q862,150 849,110 Z" fill="#f97316" opacity="0.55" />
          <ellipse cx="870" cy="100" rx="34" ry="16" fill="url(#dsLava)" opacity="0.8" />
          <circle cx="870" cy="62" r="16" fill="rgba(226,232,240,0.35)" />
          <circle cx="886" cy="40" r="12" fill="rgba(226,232,240,0.26)" />
          <circle cx="858" cy="26" r="9" fill="rgba(226,232,240,0.18)" />
        </g>

        {/* rolling green hills in front of the ridge */}
        <path
          d="M0,320 L0,256 Q150,196 302,246 Q432,290 562,242 Q702,190 842,246 Q980,296 1082,240 Q1150,210 1200,238 L1200,320 Z"
          fill="url(#dsRidgeMid)"
        />
      </svg>
      {!reduced && (
        <div
          style={{
            position: 'absolute',
            left: '71%',
            top: '8%',
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,146,60,0.5) 0%, transparent 70%)',
            animation: 'dsSmoke 6.5s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}

/** Small hand-drawn palm, used a few times along the tree line. */
function Palm({ left, scale, tone, delay, reduced }) {
  return (
    <svg
      viewBox="0 0 120 150"
      width={120 * scale}
      height={150 * scale}
      style={{
        position: 'absolute',
        left,
        bottom: 0,
        transformOrigin: '60px 150px',
        animation: reduced ? 'none' : `dsPalmSway 5.4s ease-in-out ${delay}s infinite`,
      }}
    >
      <path d="M56,150 Q52,100 58,58 L68,58 Q70,104 66,150 Z" fill={tone.trunk} />
      <path d="M58,132 L68,130 M57,116 L68,114 M57,100 L69,98 M58,84 L69,82" stroke={tone.trunkLine} strokeWidth="2.4" strokeLinecap="round" />
      <g fill={tone.leafA}>
        <path d="M62,58 Q28,44 6,60 Q30,40 62,52 Z" />
        <path d="M62,58 Q96,42 116,60 Q92,38 62,52 Z" />
      </g>
      <g fill={tone.leafB}>
        <path d="M62,56 Q34,26 22,4 Q52,22 66,50 Z" />
        <path d="M62,56 Q92,30 106,10 Q78,26 66,50 Z" />
        <path d="M62,54 Q60,24 64,2 Q74,26 70,52 Z" />
      </g>
      <circle cx="58" cy="58" r="5" fill={tone.nut} />
      <circle cx="69" cy="61" r="4.4" fill={tone.nut} />
    </svg>
  );
}

function JungleBackdropBase({ reduced = false }) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* ── sun bloom ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '18%',
          width: '46vmax',
          height: '46vmax',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,246,190,0.85) 0%, rgba(253,224,132,0.4) 26%, rgba(253,186,116,0.14) 48%, transparent 70%)',
          filter: 'blur(6px)',
        }}
      />

      {/* ── clouds ────────────────────────────────────────────────── */}
      {CLOUDS.map((c, i) => (
        <Cloud key={i} {...c} reduced={reduced} />
      ))}

      {/* ── far ridge + volcano ───────────────────────────────────── */}
      <FarRidge reduced={reduced} />

      {/* ── mid jungle canopy ─────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: '-4%',
          right: '-4%',
          bottom: `${100 - HORIZON - 1}%`,
          height: 'clamp(96px, 19vh, 190px)',
          filter: 'blur(0.4px)',
          backgroundRepeat: 'repeat-x, repeat-x, no-repeat',
          backgroundPosition: '0 0, 34px 8px, 0 100%',
          backgroundSize: '104px 100%, 72px 100%, 100% 46%',
          backgroundImage: `
            radial-gradient(circle 50px at 50% 54%, #1d7a45 99%, transparent 100%),
            radial-gradient(circle 36px at 50% 70%, #166534 99%, transparent 100%),
            linear-gradient(180deg, #14532d 0%, #0f3d22 100%)
          `,
        }}
      />
      {/* canopy warm rim-light */}
      <div
        style={{
          position: 'absolute',
          left: '-4%',
          right: '-4%',
          bottom: `${100 - HORIZON - 1}%`,
          height: 'clamp(96px, 19vh, 190px)',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: '0 -6px',
          backgroundSize: '104px 100%',
          backgroundImage: 'radial-gradient(circle 50px at 50% 54%, rgba(190,242,100,0.32) 99%, transparent 100%)',
          mixBlendMode: 'screen',
          opacity: 0.7,
        }}
      />

      {/* palms poking above the canopy */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${100 - HORIZON - 2}%`, height: 'clamp(120px, 24vh, 230px)' }}>
        <Palm
          left="4%"
          scale={0.8}
          delay={0}
          reduced={reduced}
          tone={{ trunk: '#6b4f2a', trunkLine: '#4b3618', leafA: '#166534', leafB: '#22a04e', nut: '#a16207' }}
        />
        <Palm
          left="31%"
          scale={0.58}
          delay={-1.8}
          reduced={reduced}
          tone={{ trunk: '#5c4424', trunkLine: '#3f2d13', leafA: '#14532d', leafB: '#1c8b43', nut: '#854d0e' }}
        />
        <Palm
          left="63%"
          scale={0.68}
          delay={-3.1}
          reduced={reduced}
          tone={{ trunk: '#6b4f2a', trunkLine: '#4b3618', leafA: '#15603a', leafB: '#25a856', nut: '#a16207' }}
        />
      </div>

      {/* ── clearing ground ───────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${100 - HORIZON}%`,
          background:
            'linear-gradient(180deg, #2f7d3f 0%, #3f9a4c 16%, #4bab55 38%, #3d8f47 66%, #2c6b36 100%)',
        }}
      />
      {/* horizon haze so the canopy melts into the ground */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `${100 - HORIZON - 3}%`,
          height: '9%',
          background: 'linear-gradient(180deg, rgba(20,83,45,0.65) 0%, transparent 100%)',
        }}
      />
      {/* sunlight pools on the clearing floor */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${100 - HORIZON}%`,
          background: `
            radial-gradient(ellipse 40% 26% at 26% 34%, rgba(254,240,138,0.24) 0%, transparent 70%),
            radial-gradient(ellipse 34% 22% at 74% 52%, rgba(254,240,138,0.18) 0%, transparent 72%),
            radial-gradient(ellipse 60% 40% at 50% 106%, rgba(6,40,18,0.55) 0%, transparent 70%)
          `,
        }}
      />
      {/* scattered ground tufts (mid depth) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `${(100 - HORIZON) * 0.42}%`,
          height: 26,
          opacity: 0.5,
          backgroundRepeat: 'repeat-x',
          backgroundSize: '58px 100%',
          backgroundImage: 'radial-gradient(circle 11px at 50% 100%, #256b35 99%, transparent 100%)',
        }}
      />

      {/* ── floating pollen / dust motes ──────────────────────────── */}
      {!reduced &&
        MOTES.map((m, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: m.left,
              bottom: m.bottom,
              width: m.size,
              height: m.size,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(254,240,138,0.5) 60%, transparent 100%)',
              opacity: m.o,
              animation: `dsMote ${m.dur}s ease-in-out ${m.delay}s infinite`,
            }}
          />
        ))}

      {/* ── foreground grass band (drawn in front of the cast) ────── */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 'clamp(70px, 13vh, 128px)', zIndex: 30 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: '0 100%, 26px 100%',
            backgroundSize: '76px 78%, 54px 62%',
            backgroundImage: `
              radial-gradient(ellipse 40px 46px at 50% 100%, #0b3f22 99%, transparent 100%),
              radial-gradient(ellipse 28px 34px at 50% 100%, #052e16 99%, transparent 100%)
            `,
          }}
        />
        {GRASS_BLADES.map((g, i) => (
          <div
            key={i}
            style={{
              '--ds-tilt': `${g.tilt}deg`,
              position: 'absolute',
              left: g.left,
              bottom: 0,
              width: g.w,
              height: g.h,
              borderRadius: `${g.w}px ${g.w}px 2px 2px`,
              background: g.shade,
              transformOrigin: '50% 100%',
              transform: `rotate(${g.tilt}deg)`,
              animation: reduced ? 'none' : `dsBlade ${g.dur}s ease-in-out ${g.delay}s infinite`,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 0%, rgba(2,26,12,0.5) 72%, rgba(2,26,12,0.75) 100%)',
          }}
        />
      </div>

      {/* big foreground fern fronds, left + right */}
      <svg
        viewBox="0 0 200 200"
        width="clamp(120px, 26vw, 260px)"
        height="clamp(120px, 26vw, 260px)"
        style={{
          position: 'absolute',
          left: '-5%',
          bottom: '-4%',
          zIndex: 31,
          transformOrigin: '20px 190px',
          animation: reduced ? 'none' : 'dsFern 7.5s ease-in-out infinite',
        }}
      >
        <g fill="#04240f">
          <path d="M14,196 Q34,132 96,96 Q54,146 42,196 Z" />
          <path d="M14,196 Q22,120 62,58 Q34,130 32,196 Z" opacity="0.92" />
          <path d="M16,196 Q56,150 132,140 Q70,158 46,196 Z" opacity="0.86" />
        </g>
        <g stroke="#0b4a24" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75">
          <path d="M16,194 Q40,140 94,100" />
          <path d="M16,194 Q24,124 62,62" />
        </g>
      </svg>
      <svg
        viewBox="0 0 200 200"
        width="clamp(110px, 24vw, 240px)"
        height="clamp(110px, 24vw, 240px)"
        style={{
          position: 'absolute',
          right: '-6%',
          bottom: '-6%',
          zIndex: 31,
          transformOrigin: '180px 190px',
          animation: reduced ? 'none' : 'dsFern 8.8s ease-in-out -3s infinite',
        }}
      >
        <g fill="#04240f">
          <path d="M186,196 Q166,132 104,96 Q146,146 158,196 Z" />
          <path d="M186,196 Q178,120 138,58 Q166,130 168,196 Z" opacity="0.92" />
          <path d="M184,196 Q144,150 68,140 Q130,158 154,196 Z" opacity="0.86" />
        </g>
        <g stroke="#0b4a24" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75">
          <path d="M184,194 Q160,140 106,100" />
          <path d="M184,194 Q176,124 138,62" />
        </g>
      </svg>

      <style>{`
        @keyframes dsCloud {
          0%   { transform: translateX(0); }
          100% { transform: translateX(160vw); }
        }
        @keyframes dsSmoke {
          0%,100% { transform: translate(0,0) scale(1);   opacity: 0.55; }
          50%     { transform: translate(6px,-10px) scale(1.22); opacity: 0.9; }
        }
        @keyframes dsMote {
          0%,100% { transform: translate(0,0); }
          33%     { transform: translate(14px,-22px); }
          66%     { transform: translate(-10px,-38px); }
        }
        @keyframes dsBlade {
          0%,100% { transform: rotate(var(--ds-tilt, 0deg)) skewX(0deg); }
          50%     { transform: rotate(var(--ds-tilt, 0deg)) skewX(7deg); }
        }
        @keyframes dsPalmSway {
          0%,100% { transform: rotate(-1.6deg); }
          50%     { transform: rotate(2deg); }
        }
        @keyframes dsFern {
          0%,100% { transform: rotate(-1.4deg); }
          50%     { transform: rotate(1.8deg); }
        }
      `}</style>
    </div>
  );
}

export default memo(JungleBackdropBase);
