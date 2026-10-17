import { memo } from 'react';
import { motion } from 'framer-motion';
import { SLAM_MS, PULL_MS } from './stompConfig';

const SVG_W = 300;
const SVG_H = 560;
const SOLE_Y = 548; // y of the ground-contact point inside the viewBox

/* pre-computed scale rows down the leg — cheap way to a lot of texture */
const SCALES = [];
for (let row = 0; row < 11; row += 1) {
  const y = 16 + row * 34;
  const half = 52 - row * 2.4;
  for (let c = -1; c <= 1; c += 1) {
    SCALES.push({
      x: 150 + c * half * (c === 0 ? 0 : 0.62),
      y: y + (c === 0 ? 14 : 0),
      rx: 13 - row * 0.35,
      ry: 7.5 - row * 0.2,
    });
  }
}

const TOES = [
  { cx: 62, rot: -14, s: 0.94 },
  { cx: 150, rot: 0, s: 1.06 },
  { cx: 238, rot: 14, s: 0.94 },
];

function Toe({ cx, rot, s, stuck, i }) {
  return (
    <g
      style={{
        transformBox: 'view-box',
        transformOrigin: `${cx}px 452px`,
        animation: stuck ? `dsFootToe ${240 + i * 40}ms ease-in-out ${i * 60}ms infinite alternate` : 'none',
      }}
    >
      <g transform={`translate(${cx} 500) rotate(${rot}) scale(${s})`}>
        <path d="M-34 -74 Q-41 -28 -36 -4 Q-31 20 0 20 Q31 20 36 -4 Q41 -28 34 -74 Z" fill="url(#dsToeGrad)" />
        <path d="M-34 -74 Q-38 -40 -35 -14 Q-24 -22 -8 -22 Q-18 -46 -16 -74 Z" fill="#ffffff" opacity="0.1" />
        <path d="M-30 -6 Q0 8 30 -6 Q28 16 0 16 Q-28 16 -30 -6 Z" fill="#2c5416" opacity="0.5" />
        <path d="M-26 -52 Q0 -44 26 -52" stroke="#28511a" strokeWidth="3.4" fill="none" opacity="0.45" strokeLinecap="round" />
        <path d="M-28 -34 Q0 -26 28 -34" stroke="#28511a" strokeWidth="3.4" fill="none" opacity="0.35" strokeLinecap="round" />
        <ellipse cx="0" cy="2" rx="19" ry="11" fill="#7fbb56" opacity="0.28" />
        {/* claw */}
        <path d="M-19 10 Q-10 42 0 48 Q10 42 19 10 Q0 22 -19 10 Z" fill="url(#dsClawGrad)" />
        <path d="M-11 16 Q-6 36 0 42 Q1 28 -5 18 Z" fill="#ffffff" opacity="0.55" />
        <path d="M-19 10 Q0 22 19 10" stroke="#6b5a33" strokeWidth="2" fill="none" opacity="0.5" />
      </g>
    </g>
  );
}

function LegSvg({ state, reduce }) {
  const stuck = state === 'stuck' || state === 'pull';
  const impact = state === 'impact';

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} fill="none" aria-hidden>
      <defs>
        <linearGradient id="dsLegGrad" x1="0.08" y1="0" x2="0.95" y2="0.2">
          <stop offset="0%" stopColor="#79bb4f" />
          <stop offset="26%" stopColor="#57993a" />
          <stop offset="62%" stopColor="#3d7529" />
          <stop offset="100%" stopColor="#25501a" />
        </linearGradient>
        <linearGradient id="dsFootGrad" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#6cb046" />
          <stop offset="55%" stopColor="#437f2d" />
          <stop offset="100%" stopColor="#28551c" />
        </linearGradient>
        <linearGradient id="dsToeGrad" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#74b84c" />
          <stop offset="60%" stopColor="#3f7c2b" />
          <stop offset="100%" stopColor="#2a5a1c" />
        </linearGradient>
        <linearGradient id="dsClawGrad" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#fdf6e3" />
          <stop offset="55%" stopColor="#e2cfa0" />
          <stop offset="100%" stopColor="#9c8250" />
        </linearGradient>
        <radialGradient id="dsLegShine" cx="0.3" cy="0.25" r="0.6">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g style={{ transformBox: 'view-box', transformOrigin: '150px 470px', animation: impact && !reduce ? 'dsFootSquash 260ms ease-out' : 'none' }}>
        {/* ── upper leg ─────────────────────────────────────────────── */}
        <path d="M84 -10 L216 -10 Q224 120 222 214 Q220 268 204 300 L96 300 Q80 268 78 214 Q76 120 84 -10 Z" fill="url(#dsLegGrad)" />
        {/* thigh muscle shading */}
        <path d="M96 -10 Q88 130 96 268 Q112 292 150 292 Q126 250 124 140 Q123 60 132 -10 Z" fill="#ffffff" opacity="0.09" />
        <path d="M206 -10 Q214 130 202 286 Q186 296 166 296 Q192 240 194 140 Q195 60 188 -10 Z" fill="#12360d" opacity="0.22" />
        {/* back scutes */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={`sp${i}`} d={`M80 ${28 + i * 46} l-17 -11 l17 -13 z`} fill="#2b5a1d" />
        ))}
        {/* scale texture */}
        <g opacity="0.3">
          {SCALES.map((s, i) => (
            <ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill={i % 3 === 0 ? '#8fce62' : '#2f6321'} />
          ))}
        </g>

        {/* ── knee ──────────────────────────────────────────────────── */}
        <ellipse cx="150" cy="304" rx="70" ry="42" fill="url(#dsLegGrad)" />
        <ellipse cx="132" cy="292" rx="40" ry="22" fill="#ffffff" opacity="0.13" />
        <path d="M92 322 Q150 344 208 320" stroke="#26501a" strokeWidth="5" fill="none" opacity="0.45" strokeLinecap="round" />
        <path d="M100 334 Q150 352 200 332" stroke="#26501a" strokeWidth="4" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* ── shin ──────────────────────────────────────────────────── */}
        <path d="M96 292 L204 292 Q200 358 194 404 Q182 428 150 428 Q118 428 106 404 Q100 358 96 292 Z" fill="url(#dsLegGrad)" />
        <path d="M112 300 Q108 360 116 410" stroke="#8fce62" strokeWidth="7" fill="none" opacity="0.28" strokeLinecap="round" />
        <path d="M188 300 Q192 360 184 410" stroke="#12360d" strokeWidth="8" fill="none" opacity="0.22" strokeLinecap="round" />
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={`sh${i}`} cx={150} cy={318 + i * 26} rx={30 - i * 2} ry="9" fill="#2f6321" opacity="0.22" />
        ))}

        {/* ── ankle ─────────────────────────────────────────────────── */}
        <ellipse cx="150" cy="416" rx="54" ry="27" fill="url(#dsFootGrad)" />
        <path d="M104 408 Q150 430 196 406" stroke="#26501a" strokeWidth="4.5" fill="none" opacity="0.4" strokeLinecap="round" />

        {/* ── foot ──────────────────────────────────────────────────── */}
        <ellipse cx="150" cy="524" rx="128" ry="26" fill="#1c3d13" opacity="0.35" />
        <path d="M100 402 L200 402 Q240 432 250 474 Q256 506 232 514 L68 514 Q44 506 50 474 Q60 432 100 402 Z" fill="url(#dsFootGrad)" />
        <path d="M104 408 Q78 440 68 480 Q62 504 82 508 L120 508 Q96 470 118 414 Z" fill="#ffffff" opacity="0.1" />
        <path d="M196 408 Q226 440 236 480 Q242 504 222 508 L188 508 Q212 470 190 414 Z" fill="#12360d" opacity="0.2" />
        {/* dorsum wrinkles */}
        <path d="M92 452 Q150 470 208 452" stroke="#26501a" strokeWidth="4" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M84 474 Q150 494 216 474" stroke="#26501a" strokeWidth="4" fill="none" opacity="0.28" strokeLinecap="round" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <ellipse key={`fs${i}`} cx={72 + i * 26} cy={492 - Math.abs(i - 3) * 6} rx="11" ry="6.5" fill="#7fbb56" opacity="0.22" />
        ))}
        {/* dew claw at the back */}
        <g transform="translate(28 470) rotate(-26)">
          <path d="M-15 -26 Q-20 0 -13 12 Q0 20 12 10 Q18 -4 14 -26 Z" fill="url(#dsToeGrad)" />
          <path d="M-9 8 Q-2 28 4 30 Q10 24 12 8 Q2 16 -9 8 Z" fill="url(#dsClawGrad)" />
        </g>

        {TOES.map((t, i) => (
          <Toe key={i} {...t} stuck={stuck} i={i} />
        ))}

        <ellipse cx="118" cy="150" rx="46" ry="120" fill="url(#dsLegShine)" />
        {/* dirt smudges once it has been in the ground */}
        {stuck && (
          <g opacity="0.55">
            <ellipse cx="96" cy="500" rx="26" ry="10" fill="#6b4423" />
            <ellipse cx="186" cy="504" rx="22" ry="9" fill="#6b4423" />
            <ellipse cx="146" cy="512" rx="30" ry="8" fill="#5a3418" />
          </g>
        )}
      </g>

      {/* ── comic strain marks while stuck ──────────────────────────── */}
      {stuck && !reduce && (
        <g>
          {[[36, 400, -30], [264, 396, 30], [50, 344, -18], [250, 340, 18]].map(([x, y, r], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
              <g style={{ transformBox: 'fill-box', transformOrigin: '50% 50%', animation: `dsStrain 380ms ease-in-out ${i * 70}ms infinite` }}>
                <path d="M0 0 q10 -12 0 -26" stroke="#fde68a" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M12 4 q12 -14 0 -30" stroke="#fde68a" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
              </g>
            </g>
          ))}
          {[[92, 356, '-14px'], [212, 348, '16px']].map(([x, y, sx], i) => (
            <g key={`sw${i}`} transform={`translate(${x} ${y})`}>
              <g style={{ ['--sx']: sx, transformBox: 'fill-box', transformOrigin: '50% 50%', animation: `dsSweat 900ms ease-out ${i * 260}ms infinite` }}>
                <path d="M0 0 Q9 12 0 18 Q-9 12 0 0 Z" fill="#7dd3fc" opacity="0.9" />
              </g>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

/**
 * Growing shadow that warns which lane the foot is about to hit.
 * `w` is the true width of the hit window, so what the child sees is what lands.
 */
export function TelegraphShadow({ x, y, w, ms }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', left: x - w / 2, top: y - w * 0.19,
        width: w, height: w * 0.38, pointerEvents: 'none', zIndex: 8,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(ellipse,rgba(20,8,2,0.62) 0%,rgba(20,8,2,0.34) 55%,transparent 78%)',
        animation: `dsTeleGrow ${ms}ms cubic-bezier(0.4,0,0.6,1) forwards`,
      }} />
      <div style={{
        position: 'absolute', inset: '8%', borderRadius: '50%',
        border: '4px dashed rgba(253,224,71,0.9)',
        animation: `dsTeleRing ${ms}ms linear forwards`,
      }} />
    </div>
  );
}

/**
 * The colossal leg. `x`/`y` are the ground-contact point in container pixels.
 */
function StompFoot({ x, y, scale, state, telegraphMs, reduce }) {
  const w = SVG_W * scale;
  const h = SVG_H * scale;

  const transition =
    state === 'slam'
      ? { duration: SLAM_MS / 1000, ease: [0.5, 0, 0.9, 1] }
      : state === 'telegraph'
        ? { duration: Math.max(0.09, telegraphMs / 1000), ease: 'easeOut' }
        : state === 'pull'
          ? { duration: PULL_MS / 1000, ease: [0.35, 0, 0.2, 1] }
          : { duration: 0.34, ease: 'easeInOut' };

  const idle = state === 'idle';
  const stuck = state === 'stuck' || state === 'pull';

  return (
    <motion.div
      aria-hidden
      style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, zIndex: 26 }}
      animate={{ x, y }}
      transition={transition}
      initial={false}
    >
      <div style={{
        position: 'absolute', left: -w / 2, top: -SOLE_Y * scale, width: w, height: h,
        transformOrigin: '50% 100%',
        filter: 'drop-shadow(0 22px 26px rgba(40,18,4,0.45))',
        animation: reduce
          ? 'none'
          : idle
            ? 'dsFootSway 4.4s ease-in-out infinite'
            : stuck
              ? 'dsFootWobble 420ms ease-in-out infinite'
              : 'none',
      }}>
        <LegSvg state={state} reduce={reduce} />
      </div>
    </motion.div>
  );
}

export default memo(StompFoot);
