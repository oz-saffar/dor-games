import { motion, useReducedMotion } from 'framer-motion';

const vb = { w: 420, h: 500 };

/**
 * The kid-eats-monsters counterpart to `MonsterIllustration` — same viewBox and
 * the same hinged-jaw trick, so the drag/mouth maths in `MonsterDragChompGame`
 * is identical whichever way round the game is playing.
 */
export default function KidIllustration({ mouthPhase = 'idle', rejectKey = 0, className = '' }) {
  const reduce = useReducedMotion();
  const chew = mouthPhase === 'chew';
  const reject = mouthPhase === 'reject';

  const jawRotate = chew && !reduce ? [0, 12, -4, 9, -2, 0] : reject && !reduce ? [0, -6, 5, -4, 0] : 0;
  const jawTransition = chew
    ? { duration: 0.55, ease: 'easeInOut' }
    : reject
      ? { duration: 0.45, ease: 'easeOut' }
      : { type: 'spring', stiffness: 120, damping: 14 };

  return (
    <svg
      className={className}
      viewBox={`0 0 ${vb.w} ${vb.h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="kdSkin" cx="38%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#ffe6c9" />
          <stop offset="58%" stopColor="#fbc999" />
          <stop offset="100%" stopColor="#dd9c6c" />
        </radialGradient>
        <linearGradient id="kdShirt" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="kdHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7c4a25" />
          <stop offset="100%" stopColor="#3f2415" />
        </linearGradient>
        <linearGradient id="kdTongue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient id="kdTooth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffefb" />
          <stop offset="100%" stopColor="#e7e5e4" />
        </linearGradient>
        <filter id="kdSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="210" cy="476" rx="126" ry="20" fill="#1e1b4b" opacity="0.14" />

      <motion.g
        key={`kid-shake-${rejectKey}`}
        style={{ transformOrigin: '50% 60%', transformBox: 'view-box' }}
        animate={reject && !reduce ? { rotate: [0, -3.5, 3.5, -2.5, 2.5, 0] } : { rotate: 0 }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
      >
        <motion.g
          animate={reduce ? {} : { y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        >
          {/* shirt + arms */}
          <path
            d="M104 472v-42c0-54 48-86 106-86s106 32 106 86v42z"
            fill="url(#kdShirt)"
            stroke="#075985"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M118 396c-18 12-28 34-30 60 14 6 28 6 40 0-6-20-6-40-10-60z"
            fill="#0284c7"
            stroke="#075985"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M302 396c18 12 28 34 30 60-14 6-28 6-40 0 6-20 6-40 10-60z"
            fill="#0284c7"
            stroke="#075985"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="184" y="312" width="52" height="66" rx="20" fill="#e8ab7a" />

          {/* ears */}
          <ellipse cx="78" cy="216" rx="20" ry="28" fill="url(#kdSkin)" stroke="#c98a5e" strokeWidth="2.5" />
          <ellipse cx="342" cy="216" rx="20" ry="28" fill="url(#kdSkin)" stroke="#c98a5e" strokeWidth="2.5" />

          {/* head */}
          <ellipse
            cx="210"
            cy="204"
            rx="134"
            ry="146"
            fill="url(#kdSkin)"
            stroke="#c98a5e"
            strokeWidth="3"
            filter="url(#kdSoft)"
          />

          {/* hair cap + tuft */}
          <path
            d="M78 198c4-100 62-152 132-152s128 52 132 152c-26-50-64-74-132-74S104 148 78 198z"
            fill="url(#kdHair)"
            stroke="#31190e"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M198 48c8-28 30-40 54-32-20 8-30 20-32 36z" fill="url(#kdHair)" />

          {/* eyes */}
          <ellipse cx="152" cy="178" rx="30" ry="34" fill="#fffdf8" stroke="#c98a5e" strokeWidth="2.5" />
          <ellipse cx="268" cy="178" rx="30" ry="34" fill="#fffdf8" stroke="#c98a5e" strokeWidth="2.5" />
          <ellipse cx="157" cy="184" rx="14" ry="17" fill="#3f2a1d" />
          <ellipse cx="263" cy="184" rx="14" ry="17" fill="#3f2a1d" />
          <ellipse cx="163" cy="174" rx="6" ry="7" fill="#fff" opacity="0.95" />
          <ellipse cx="269" cy="174" rx="6" ry="7" fill="#fff" opacity="0.95" />
          <path
            d="M124 134c16-10 38-10 54 0M242 134c16-10 38-10 54 0"
            stroke="#5b3a22"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* cheeks + nose */}
          <ellipse cx="106" cy="252" rx="26" ry="18" fill="#fda4af" opacity="0.55" />
          <ellipse cx="314" cy="252" rx="26" ry="18" fill="#fda4af" opacity="0.55" />
          <path d="M196 234c6 10 22 10 28 0" stroke="#c98a5e" strokeWidth="4" strokeLinecap="round" fill="none" />

          {/* upper teeth */}
          <path
            d="M142 258h136v13c-8 9-23 15-38 16h-62c-15-1-28-7-36-16v-13z"
            fill="url(#kdTooth)"
            stroke="#a8a29e"
            strokeWidth="1.5"
          />
          <path d="M170 258v14M198 258v14M226 258v14M252 258v14" stroke="#d6d3d1" strokeWidth="2" opacity="0.7" />

          {/* hinged lower jaw */}
          <motion.g
            style={{ transformOrigin: '50% 0%', transformBox: 'fill-box' }}
            animate={{ rotate: jawRotate }}
            transition={jawTransition}
          >
            <path
              d="M142 274c6 44 34 74 68 74s62-30 68-74c-22 10-44 15-68 15s-46-5-68-15z"
              fill="#7f1d1d"
              opacity="0.9"
            />
            <path
              d="M162 292c8 26 24 42 48 42s40-16 48-42c-15 7-31 11-48 11s-33-4-48-11z"
              fill="url(#kdTongue)"
              stroke="#be123c"
              strokeWidth="2"
            />
            <path
              d="M142 274h136v11c-10 12-32 18-68 18s-58-6-68-18v-11z"
              fill="url(#kdTooth)"
              stroke="#a8a29e"
              strokeWidth="1.5"
            />
            <path d="M170 274v11M198 274v11M226 274v11M252 274v11" stroke="#d6d3d1" strokeWidth="2" opacity="0.65" />
          </motion.g>
        </motion.g>
      </motion.g>
    </svg>
  );
}
