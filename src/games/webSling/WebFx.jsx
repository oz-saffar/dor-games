/** Web-line, cocoon and splat effects. All drawn in screen space inside one SVG. */

/** The web shooting out from the hero's glove to the villain. */
export const WebLine = ({ x1, y1, x2, y2, color = '#fdfdff', ms = 170, reduce }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.max(1, Math.hypot(dx, dy));
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;

  // barbs along the line, giving the strand its webby silhouette
  const barbs = [];
  for (let d = 14; d < len - 6; d += 16) {
    barbs.push(d);
  }

  return (
    <g transform={`translate(${x1} ${y1}) rotate(${deg})`} style={{ pointerEvents: 'none' }}>
      <g
        style={
          reduce
            ? undefined
            : {
                animation: `wsShoot ${ms}ms cubic-bezier(0.2,0.8,0.3,1) forwards`,
                transformOrigin: '0px 0px',
              }
        }
      >
        <line x1="0" y1="0" x2={len} y2="0" stroke={color} strokeWidth="7" strokeLinecap="round" opacity="0.35" />
        <line x1="0" y1="0" x2={len} y2="0" stroke={color} strokeWidth="3.6" strokeLinecap="round" />
        {barbs.map((d) => (
          <g key={d} stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.9">
            <line x1={d} y1="-5" x2={d + 5} y2="0" />
            <line x1={d} y1="5" x2={d + 5} y2="0" />
          </g>
        ))}
        <circle cx={len} cy="0" r="9" fill={color} opacity="0.9" />
      </g>
    </g>
  );
};

/** Villain wrapped up in webbing — eyes still peeking out, no one gets hurt. */
export const Cocoon = ({ scale = 1, reduce }) => (
  <g
    style={
      reduce ? undefined : { animation: 'wsWrap 280ms cubic-bezier(0.3,1.4,0.5,1) forwards', transformOrigin: 'center' }
    }
    transform={`scale(${scale})`}
  >
    <ellipse cx="0" cy="-58" rx="52" ry="66" fill="#f4f7ff" stroke="#c9d4ea" strokeWidth="3" />
    <g stroke="#c4d0e8" strokeWidth="2.6" fill="none" opacity="0.95">
      <path d="M-50 -80 q50 -14 100 0" transform="translate(-50,0)" />
      <path d="M-46 -92 q46 16 92 0" />
      <path d="M-50 -74 q50 18 100 0" />
      <path d="M-52 -56 q52 18 104 0" />
      <path d="M-50 -38 q50 18 100 0" />
      <path d="M-44 -20 q44 16 88 0" />
      <path d="M0 -124 L0 8" />
      <path d="M-30 -118 L-30 -2" />
      <path d="M30 -118 L30 -2" />
    </g>
    {/* dizzy eyes peeking through */}
    <g>
      <circle cx="-15" cy="-62" r="9" fill="#ffffff" stroke="#0b1020" strokeWidth="2.4" />
      <circle cx="15" cy="-62" r="9" fill="#ffffff" stroke="#0b1020" strokeWidth="2.4" />
      <path d="M-20 -67 l10 10 M-10 -67 l-10 10" stroke="#0b1020" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M10 -67 l10 10 M20 -67 l-10 10" stroke="#0b1020" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M-9 -42 q9 8 18 0" stroke="#0b1020" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
    {/* spinning stars */}
    {!reduce && (
      <g style={{ animation: 'wsStars 900ms linear infinite', transformOrigin: '0px -96px' }}>
        <text x="-34" y="-96" fontSize="20" textAnchor="middle">⭐</text>
        <text x="34" y="-96" fontSize="16" textAnchor="middle">✨</text>
      </g>
    )}
  </g>
);

/** Web splat when a shot lands on brick instead of a bad guy. */
export const Splat = ({ color = '#fdfdff', reduce }) => (
  <g
    style={reduce ? undefined : { animation: 'wsSplat 420ms ease-out forwards', transformOrigin: 'center' }}
    opacity="0.9"
  >
    <path
      d="M0 -26 q18 -6 24 10 q10 16 -6 26 q-14 14 -28 2 q-18 -8 -12 -24 q4 -14 22 -14Z"
      fill={color}
      opacity="0.92"
    />
    <g stroke={color} strokeWidth="3" strokeLinecap="round">
      <path d="M-22 -18 L-34 -28" />
      <path d="M24 -20 L36 -30" />
      <path d="M-24 18 L-36 30" />
      <path d="M22 20 L34 32" />
    </g>
    <g fill="#0b1020" opacity="0.12">
      <circle cx="-6" cy="-4" r="7" />
      <circle cx="8" cy="6" r="5" />
    </g>
  </g>
);

/** Comic "!" bubble that warns a villain is about to duck back down. */
export const AlertBubble = ({ reduce }) => (
  <g style={reduce ? undefined : { animation: 'wsAlert 620ms ease-in-out infinite' }}>
    <circle cx="0" cy="0" r="16" fill="#ffe066" stroke="#0b1020" strokeWidth="3" />
    <path d="M-5 14 L0 24 L6 13Z" fill="#ffe066" stroke="#0b1020" strokeWidth="3" strokeLinejoin="round" />
    <path d="M0 -8 L0 3" stroke="#0b1020" strokeWidth="4" strokeLinecap="round" />
    <circle cx="0" cy="8" r="2.4" fill="#0b1020" />
  </g>
);

export const WEB_KEYFRAMES = `
@keyframes wsShoot {
  0%   { transform: scaleX(0); opacity: 0.6; }
  70%  { transform: scaleX(1.04); opacity: 1; }
  100% { transform: scaleX(1); opacity: 1; }
}
@keyframes wsWrap {
  0%   { transform: scale(0.35) rotate(-14deg); opacity: 0; }
  60%  { transform: scale(1.12) rotate(4deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes wsStars {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes wsSplat {
  0%   { transform: scale(0.2); opacity: 0; }
  40%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1) translateY(10px); opacity: 0; }
}
@keyframes wsAlert {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-6px) scale(1.12); }
}
@keyframes wsPopup {
  0%   { transform: translate(-50%, 0) scale(0.5) rotate(-8deg); opacity: 0; }
  30%  { transform: translate(-50%, -18px) scale(1.15) rotate(3deg); opacity: 1; }
  100% { transform: translate(-50%, -64px) scale(1) rotate(0deg); opacity: 0; }
}
@keyframes wsComboGlow {
  0%, 100% { box-shadow: 0 0 0 rgba(255,224,102,0); }
  50%      { box-shadow: 0 0 22px rgba(255,224,102,0.85); }
}
@keyframes wsHeroBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
}
@keyframes wsSenseRing {
  0%   { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(2.1); opacity: 0; }
}
`;
