import { memo } from 'react';

/* Kid is drawn facing right inside a 72 × 104 box, feet planted on y = 104. */
const W = 72;
const H = 104;

function Hair({ v }) {
  const { hair, hairB, style } = v;
  switch (style) {
    case 'curls':
      return (
        <g>
          {[[24, 18, 8], [33, 12, 9], [43, 12, 8], [51, 19, 7], [21, 27, 6]].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill={i % 2 ? hairB : hair} />
          ))}
        </g>
      );
    case 'ponytail':
      return (
        <g>
          <path d="M21 26 Q24 9 38 8 Q52 8 53 22 Q45 15 34 17 Q26 19 21 26 Z" fill={hair} />
          <path d="M20 24 Q10 26 8 36 Q6 46 13 50 Q10 40 15 33 Q19 28 20 24 Z" fill={hairB} />
          <circle cx="19" cy="26" r="3" fill="#f472b6" />
        </g>
      );
    case 'spiky':
      return (
        <g fill={hair}>
          <path d="M21 27 Q22 12 37 9 Q52 8 53 23 Q46 16 34 18 Q25 20 21 27 Z" />
          <path d="M24 13 l2 -9 l6 7 z" />
          <path d="M34 9 l3 -10 l5 9 z" />
          <path d="M44 11 l6 -8 l1 10 z" />
        </g>
      );
    case 'bob':
      return (
        <g>
          <path d="M19 30 Q18 10 37 9 Q55 9 54 30 Q54 36 50 36 Q52 20 37 19 Q22 20 23 36 Q19 36 19 30 Z" fill={hair} />
          <path d="M24 14 Q34 8 46 13" stroke={hairB} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'buzz':
      return <path d="M22 26 Q24 13 37 12 Q51 12 52 25 Q44 19 36 19 Q27 19 22 26 Z" fill={hair} opacity="0.95" />;
    default: // mop
      return (
        <g>
          <path d="M20 28 Q19 10 37 9 Q55 9 54 27 Q49 17 42 20 Q36 12 30 20 Q24 20 20 28 Z" fill={hair} />
          <path d="M25 16 Q33 11 41 14" stroke={hairB} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

function Leg({ v, back, anim }) {
  const delay = back ? 'calc(var(--step) / -2)' : '0ms';
  const tint = back ? 0.82 : 1;
  return (
    <g
      style={{
        transformBox: 'view-box',
        transformOrigin: '36px 66px',
        animation: anim ? `dsKidLeg var(--step) linear ${delay} infinite` : 'none',
      }}
      opacity={tint}
    >
      <rect x="29.5" y="61" width="13" height="25" rx="6.5" fill={back ? v.pantsB : v.pants} />
      <rect x="31" y="62" width="4" height="20" rx="2" fill="#ffffff" opacity="0.16" />
      <g
        style={{
          transformBox: 'view-box',
          transformOrigin: '36px 84px',
          animation: anim ? `dsKidShin var(--step) linear ${delay} infinite` : 'none',
        }}
      >
        <rect x="31" y="82" width="10.5" height="16" rx="5" fill={v.skin} />
        <rect x="31" y="82" width="10.5" height="5" rx="2.5" fill={v.skinB} opacity="0.5" />
        <path d="M27 95 h13 a5 5 0 0 1 5 5 v2 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-3 a4 4 0 0 1 4 -4 z" fill={v.shoe} />
        <rect x="23" y="101" width="22" height="3" rx="1.5" fill="#ffffff" opacity="0.35" />
      </g>
    </g>
  );
}

function Arm({ v, back, anim }) {
  const delay = back ? '0ms' : 'calc(var(--step) / -2)';
  return (
    <g
      style={{
        transformBox: 'view-box',
        transformOrigin: '36px 48px',
        animation: anim ? `dsKidArm var(--step) linear ${delay} infinite` : 'none',
      }}
      opacity={back ? 0.85 : 1}
    >
      <rect x="32.5" y="45" width="9.5" height="17" rx="4.75" fill={back ? v.sleeve : v.shirtB} />
      <rect x="32.5" y="58" width="8.5" height="14" rx="4.25" fill={v.skin} />
      <circle cx="36.8" cy="72" r="5" fill={v.skin} />
      <circle cx="35" cy="70.5" r="1.6" fill="#ffffff" opacity="0.35" />
    </g>
  );
}

function KidSvg({ v, anim, reduce }) {
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
      <defs>
        <linearGradient id={`dsShirt-${v.key}`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor={v.shirtA} />
          <stop offset="100%" stopColor={v.shirtB} />
        </linearGradient>
        <radialGradient id={`dsFace-${v.key}`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0%" stopColor="#fff3e2" />
          <stop offset="55%" stopColor={v.skin} />
          <stop offset="100%" stopColor={v.skinB} />
        </radialGradient>
      </defs>

      <g style={{ transformBox: 'view-box', transformOrigin: '36px 100px', animation: anim ? 'dsKidBob calc(var(--step) / 2) ease-in-out infinite' : 'none' }}>
        <Arm v={v} back anim={anim} />
        <Leg v={v} back anim={anim} />

        {/* torso */}
        <path d="M26 45 Q36 40 46 45 L48.5 65 Q36 71 23.5 65 Z" fill={`url(#dsShirt-${v.key})`} />
        <path d="M25 56 Q36 61 47.5 56 L47.8 60 Q36 65 24.6 60 Z" fill={v.stripe} opacity="0.75" />
        <path d="M30 42.5 Q36 47 42 42.5 Q36 45.5 30 42.5 Z" fill={v.sleeve} />
        <ellipse cx="36" cy="66" rx="12" ry="3.2" fill="#000000" opacity="0.12" />

        <Leg v={v} anim={anim} />
        <Arm v={v} anim={anim} />

        {/* head */}
        <rect x="32.5" y="36" width="7" height="8" rx="3" fill={v.skinB} />
        <ellipse cx="36.5" cy="26" rx="15.5" ry="15" fill={`url(#dsFace-${v.key})`} />
        <ellipse cx="23.5" cy="28" rx="3.4" ry="4.2" fill={v.skinB} />
        <Hair v={v} />
        {/* eyes */}
        <g style={{ transformBox: 'view-box', transformOrigin: '42px 25px', animation: reduce ? 'none' : 'dsKidBlink 4.8s ease-in-out infinite' }}>
          <ellipse cx="38" cy="25.5" rx="3.6" ry="4.1" fill="#ffffff" />
          <ellipse cx="46.4" cy="25.5" rx="3.6" ry="4.1" fill="#ffffff" />
          <circle cx="39.2" cy="26.2" r="2.1" fill="#221306" />
          <circle cx="47.4" cy="26.2" r="2.1" fill="#221306" />
          <circle cx="38.4" cy="24.9" r="0.95" fill="#ffffff" />
          <circle cx="46.6" cy="24.9" r="0.95" fill="#ffffff" />
        </g>
        <path d="M34.6 19.6 Q38 17.4 41.4 19.6" stroke={v.hair} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M43.6 19.6 Q47 17.4 50.2 19.8" stroke={v.hair} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* open, delighted mouth */}
        <path d="M38 32.5 Q43.5 39.5 49 31.5 Q43.5 35 38 32.5 Z" fill="#8c2f2f" />
        <path d="M40.5 34.6 Q43.6 37.6 46.6 34.2 Q43.6 36 40.5 34.6 Z" fill="#f472b6" />
        <ellipse cx="33.8" cy="31.4" rx="3.4" ry="2.3" fill="#fb7185" opacity="0.45" />
        <ellipse cx="49.6" cy="30.4" rx="3" ry="2.1" fill="#fb7185" opacity="0.4" />
        <ellipse cx="31" cy="19" rx="6" ry="4" fill="#ffffff" opacity="0.18" />
      </g>
    </svg>
  );
}

const STARS = [0, 1, 2, 3, 4, 5];

function RunningKid({ variant, state, dir, stepMs, reduce }) {
  const running = state === 'run' && !reduce;
  const anim = running;

  const stateStyle =
    state === 'squish'
      ? { animation: 'dsKidSquish 300ms cubic-bezier(0.2,0.9,0.3,1) forwards' }
      : state === 'bounce'
        ? { animation: 'dsKidBounce 950ms cubic-bezier(0.22,0.8,0.3,1) forwards' }
        : {};

  return (
    <div style={{ position: 'absolute', left: -W / 2, top: -H, width: W, height: H, ['--step']: `${stepMs}ms` }}>
      {/* trailing dust */}
      {running && [0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute', bottom: 2, left: dir < 0 ? W - 18 : 10,
            width: 11 + i * 3, height: 11 + i * 3, borderRadius: '50%',
            background: 'rgba(228,190,146,0.85)', filter: 'blur(1px)',
            transform: dir < 0 ? 'scaleX(-1)' : 'none',
            animation: `dsKidDust ${620 + i * 120}ms ease-out ${-i * 210}ms infinite`,
          }}
        />
      ))}

      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 100%', ...stateStyle }}>
        <div style={{ transform: dir < 0 ? 'scaleX(-1)' : 'none', transformOrigin: '50% 100%' }}>
          <KidSvg v={variant} anim={anim} reduce={reduce} />
        </div>
      </div>

      {/* seeing-stars flourish while bouncing away giggling */}
      {state === 'bounce' && !reduce && (
        <div style={{ position: 'absolute', left: W / 2, top: H * 0.34, width: 0, height: 0 }}>
          {STARS.map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute', left: -9, top: -9, width: 18, height: 18,
                ['--spin']: `${i * 60 + 20}deg`,
                animation: `dsKidStar 900ms ease-out ${i * 55}ms forwards`,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M9 0 l2.4 5.6 L18 6.4 l-4.6 4.1 1.3 6.3 L9 13.6 3.3 16.8 4.6 10.5 0 6.4 l6.6 -0.8 z" fill="#fde047" stroke="#f59e0b" strokeWidth="1" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(RunningKid);
