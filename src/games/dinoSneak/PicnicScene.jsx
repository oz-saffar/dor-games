import { memo } from 'react';

/**
 * The picnic spread the kids are sitting around: checkered blanket, basket,
 * watermelon slice, sandwich and two juice cups. Purely decorative.
 */
function PicnicSceneBase({ width = 300, reduced = false }) {
  const h = width * 0.46;
  return (
    <div aria-hidden style={{ position: 'relative', width, height: h }}>
      <svg viewBox="0 0 300 138" width={width} height={h} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="dspBlanket" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#fecaca" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <pattern id="dspCheck" width="26" height="26" patternUnits="userSpaceOnUse">
            <rect width="26" height="26" fill="none" />
            <rect x="0" y="0" width="13" height="13" fill="rgba(255,255,255,0.55)" />
            <rect x="13" y="13" width="13" height="13" fill="rgba(255,255,255,0.55)" />
          </pattern>
          <linearGradient id="dspBasket" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9a05b" />
            <stop offset="100%" stopColor="#92601f" />
          </linearGradient>
        </defs>

        {/* blanket */}
        <ellipse cx="150" cy="96" rx="146" ry="38" fill="rgba(4,32,14,0.28)" />
        <path
          d="M18,92 Q150,58 284,92 Q286,116 268,122 Q150,140 34,122 Q14,116 18,92 Z"
          fill="url(#dspBlanket)"
        />
        <path
          d="M18,92 Q150,58 284,92 Q286,116 268,122 Q150,140 34,122 Q14,116 18,92 Z"
          fill="url(#dspCheck)"
          opacity="0.5"
        />
        {/* blanket fringe */}
        <g stroke="#fecaca" strokeWidth="2.4" strokeLinecap="round">
          <path d="M40,126 L38,133" /><path d="M70,130 L69,137" /><path d="M104,133 L104,140" />
          <path d="M140,135 L140,142" /><path d="M176,134 L177,141" /><path d="M212,131 L214,138" />
          <path d="M244,127 L247,134" />
        </g>

        {/* basket */}
        <g>
          <path d="M28,60 Q52,54 76,60 L70,92 Q52,97 34,92 Z" fill="url(#dspBasket)" />
          <g stroke="#6b4410" strokeWidth="1.8" opacity="0.6" fill="none">
            <path d="M30,70 Q52,66 74,70" /><path d="M31,79 Q52,75 73,79" /><path d="M33,87 Q52,84 71,87" />
            <path d="M44,58 L41,93" /><path d="M60,58 L62,93" />
          </g>
          <path d="M30,60 Q52,36 74,60" stroke="#92601f" strokeWidth="5" fill="none" strokeLinecap="round" />
          <rect x="24" y="55" width="56" height="9" rx="4.5" fill="#b97c2c" />
          {/* baguette + apple poking out */}
          <ellipse cx="66" cy="50" rx="7" ry="13" fill="#e2a94b" transform="rotate(24 66 50)" />
          <circle cx="42" cy="50" r="8" fill="#ef4444" />
          <path d="M42,42 Q44,36 49,36" stroke="#166534" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>

        {/* watermelon slice */}
        <g className="dsp-melon">
          <path d="M112,94 Q134,64 156,94 Z" fill="#ef4444" />
          <path d="M112,94 Q134,66 156,94 Z" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinejoin="round" />
          <g fill="#1c1917">
            <ellipse cx="128" cy="86" rx="2" ry="3" /><ellipse cx="140" cy="86" rx="2" ry="3" />
            <ellipse cx="134" cy="77" rx="2" ry="3" />
          </g>
        </g>

        {/* sandwich */}
        <g>
          <path d="M176,96 L206,96 L192,72 Z" fill="#fbbf24" />
          <path d="M180,90 L202,90 L192,74 Z" fill="#fef3c7" />
          <path d="M178,93 Q192,88 204,93" stroke="#65a30d" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        {/* juice cups */}
        <g>
          <path d="M224,74 L246,74 L242,96 L228,96 Z" fill="rgba(255,255,255,0.85)" />
          <path d="M226,80 L244,80 L241,95 L229,95 Z" fill="#fb923c" />
          <rect x="232" y="52" width="3" height="24" rx="1.5" fill="#f43f5e" transform="rotate(12 233 64)" />
          <path d="M254,78 L272,78 L269,96 L257,96 Z" fill="rgba(255,255,255,0.85)" />
          <path d="M256,83 L270,83 L268,95 L258,95 Z" fill="#a855f7" />
          <rect x="261" y="58" width="3" height="22" rx="1.5" fill="#22d3ee" transform="rotate(-10 262 69)" />
        </g>
      </svg>

      {/* lazy flies buzzing over the food — tiny bit of idle life */}
      {!reduced && (
        <>
          <span className="dsp-fly dsp-fly-1" />
          <span className="dsp-fly dsp-fly-2" />
        </>
      )}

      <style>{`
        .dsp-fly {
          position: absolute;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #1c1917;
          opacity: .5;
        }
        .dsp-fly-1 { left: 42%; top: 34%; animation: dspFly 4.2s ease-in-out infinite; }
        .dsp-fly-2 { left: 66%; top: 44%; animation: dspFly 5.6s ease-in-out -2s infinite; }
        @keyframes dspFly {
          0%,100% { transform: translate(0,0); }
          25%     { transform: translate(16px,-12px); }
          50%     { transform: translate(-9px,-20px); }
          75%     { transform: translate(-18px,-4px); }
        }
      `}</style>
    </div>
  );
}

export default memo(PicnicSceneBase);
