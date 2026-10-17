import { memo } from 'react';

/**
 * The rest of the goofy dinosaur, looming above the canyon: a belly band across
 * the top of the screen, a tail swishing on the left and a big friendly head
 * craning down on the right to watch where its foot lands.
 */
function DinoOverhead({ horizon, scale, reduce }) {
  const s = Math.max(0.55, Math.min(1.1, scale));

  return (
    <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: horizon * 0.9, pointerEvents: 'none', zIndex: 4 }}>
      {/* ── belly / underside band ─────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute', top: -70 * s, left: '-6%', width: '112%', height: 150 * s,
          borderRadius: '0 0 55% 55%',
          background: 'linear-gradient(180deg,#2f5d24 0%,#3f7a2c 52%,#68a445 82%,#8cc25c 100%)',
          boxShadow: '0 16px 34px rgba(40,20,6,0.42), inset 0 -10px 0 rgba(255,255,255,0.12)',
          animation: reduce ? 'none' : 'dsBreathe 4.6s ease-in-out infinite',
          transformOrigin: '50% 0%',
        }}
      />
      {/* belly plates */}
      <svg
        viewBox="0 0 400 90"
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: '4%', width: '92%', height: 78 * s, opacity: 0.55 }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={12 + i * 42} y={30 - Math.abs(i - 4) * 3} width="34" height={44 - Math.abs(i - 4) * 4} rx="16" fill="#a7d16b" opacity="0.55" />
        ))}
      </svg>

      {/* ── tail on the left ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 8 * s, left: -30 * s,
        transformOrigin: '20% 0%',
        animation: reduce ? 'none' : 'dsTail 5.2s ease-in-out infinite',
      }}>
        <svg width={230 * s} height={150 * s} viewBox="0 0 230 150" fill="none">
          <defs>
            <linearGradient id="dsTailGrad" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="#4b8a30" />
              <stop offset="60%" stopColor="#356b23" />
              <stop offset="100%" stopColor="#25501a" />
            </linearGradient>
          </defs>
          <path d="M0 0 Q90 6 150 52 Q198 90 214 132 Q186 138 158 112 Q104 62 0 46 Z" fill="url(#dsTailGrad)" />
          <path d="M0 6 Q84 14 140 56 Q182 88 198 122" stroke="#7cb356" strokeWidth="5" fill="none" opacity="0.5" strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${26 + i * 34} ${8 + i * 12} l10 -13 l7 15 z`} fill="#2b5a1d" opacity="0.9" />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={`sc${i}`} cx={40 + i * 36} cy={30 + i * 16} rx="12" ry="7" fill="#579a37" opacity="0.45" />
          ))}
        </svg>
      </div>

      {/* ── head craning down on the right ─────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 4 * s, right: -18 * s,
        transformOrigin: '75% 0%',
        animation: reduce ? 'none' : 'dsBreathe 4.6s ease-in-out infinite',
      }}>
        <svg width={272 * s} height={236 * s} viewBox="0 0 272 236" fill="none">
          <defs>
            <linearGradient id="dsHeadGrad" x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#5ea23c" />
              <stop offset="45%" stopColor="#3f7a2c" />
              <stop offset="100%" stopColor="#27541b" />
            </linearGradient>
            <linearGradient id="dsSnoutGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6cb046" />
              <stop offset="100%" stopColor="#417f2d" />
            </linearGradient>
            <linearGradient id="dsToothGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2d6b8" />
            </linearGradient>
          </defs>

          {/* neck */}
          <path d="M196 0 L272 0 L272 96 Q236 118 206 96 Q188 60 196 0 Z" fill="url(#dsHeadGrad)" />
          <path d="M214 4 Q210 54 226 92" stroke="#8cc25c" strokeWidth="6" opacity="0.35" fill="none" strokeLinecap="round" />

          {/* skull */}
          <path d="M206 60 Q160 62 118 92 Q78 120 62 152 Q54 172 72 180 L206 180 Q248 172 252 128 Q256 84 206 60 Z" fill="url(#dsHeadGrad)" />
          {/* snout */}
          <path d="M120 92 Q80 118 64 150 Q56 170 74 176 L146 176 Q160 140 152 108 Q140 92 120 92 Z" fill="url(#dsSnoutGrad)" />
          {/* jaw */}
          <path d="M74 176 Q120 200 190 196 Q238 192 246 160 Q230 186 176 186 Q118 188 74 176 Z" fill="#2c5c1e" />
          {/* mouth line + blunt teeth */}
          <path d="M70 172 Q140 190 214 174" stroke="#22491a" strokeWidth="5" fill="none" strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={84 + i * 24} y={166 - (i % 2) * 3} width="15" height={14 + (i % 2) * 4} rx="5" fill="url(#dsToothGrad)" />
          ))}
          {/* nostril */}
          <ellipse cx="86" cy="128" rx="9" ry="7" fill="#1f4415" transform="rotate(-18 86 128)" />
          <ellipse cx="83" cy="125" rx="3" ry="2.4" fill="#7cb356" opacity="0.6" />

          {/* brow ridge */}
          <path d="M136 92 Q168 74 206 84 Q210 96 200 102 Q166 92 140 106 Z" fill="#2f6321" />
          {/* eye */}
          <g style={{ transformOrigin: '176px 118px', transformBox: 'view-box', animation: reduce ? 'none' : 'dsKidBlink 5.4s ease-in-out infinite' }}>
            <ellipse cx="176" cy="118" rx="30" ry="28" fill="#fffdf5" />
            <ellipse cx="176" cy="118" rx="30" ry="28" fill="none" stroke="#26501a" strokeWidth="3" />
            <circle cx="168" cy="122" r="14" fill="#3b2412" />
            <circle cx="168" cy="122" r="6.5" fill="#0b0705" />
            <circle cx="163" cy="115" r="5" fill="#ffffff" />
            <circle cx="175" cy="130" r="2.6" fill="#ffffff" opacity="0.75" />
          </g>
          {/* cheek + scales */}
          <ellipse cx="212" cy="146" rx="20" ry="14" fill="#6cb046" opacity="0.35" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse key={`hs${i}`} cx={150 + (i % 3) * 30} cy={148 + Math.floor(i / 3) * 18} rx="11" ry="6" fill="#579a37" opacity="0.28" />
          ))}
          {/* head spikes */}
          {[0, 1, 2, 3].map((i) => (
            <path key={`hp${i}`} d={`M${196 - i * 26} ${72 + i * 5} l-9 -17 l19 8 z`} fill="#2b5a1d" />
          ))}
          {/* highlight */}
          <ellipse cx="150" cy="104" rx="34" ry="12" fill="#ffffff" opacity="0.12" transform="rotate(-16 150 104)" />
        </svg>
      </div>
    </div>
  );
}

export default memo(DinoOverhead);
