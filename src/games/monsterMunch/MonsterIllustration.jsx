import { motion, useReducedMotion } from 'framer-motion';

const vb = { w: 420, h: 500 };

/**
 * Layered “picture book” monster — gradients, hinged lower jaw, no emoji styling.
 */
export default function MonsterIllustration({
  mouthPhase = 'idle',
  rejectKey = 0,
  className = '',
}) {
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
        <radialGradient id="mmFur" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#d4c4ff" />
          <stop offset="45%" stopColor="#9b7bed" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
        <radialGradient id="mmFurShade" cx="60%" cy="70%" r="50%">
          <stop offset="0%" stopColor="#4c1d95" stopOpacity="0" />
          <stop offset="100%" stopColor="#312e81" stopOpacity="0.45" />
        </radialGradient>
        <linearGradient id="mmBelly" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#faf5ff" />
          <stop offset="100%" stopColor="#ddd6fe" />
        </linearGradient>
        <linearGradient id="mmTongue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient id="mmTooth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffefb" />
          <stop offset="100%" stopColor="#e7e5e4" />
        </linearGradient>
        <filter id="mmSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="210" cy="472" rx="138" ry="22" fill="#1e1b4b" opacity="0.14" />

      <motion.g
        key={`shake-${rejectKey}`}
        style={{ transformOrigin: '210px 300px', transformBox: 'fill-box' }}
        animate={reject && !reduce ? { rotate: [0, -3.5, 3.5, -2.5, 2.5, 0] } : { rotate: 0 }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
      >
      <motion.g
        animate={
          reduce
            ? {}
            : {
                y: [0, -4, 0],
              }
        }
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
      >
        <path
          d="M86 292c-18-48-12-102 18-148 32-50 88-72 152-62 92 14 154 88 146 178-4 48-28 92-62 118-40 32-96 44-152 28-56-16-96-54-102-114z"
          fill="url(#mmFur)"
          stroke="#4338ca"
          strokeWidth="3"
          strokeLinejoin="round"
          filter="url(#mmSoft)"
        />
        <path
          d="M86 292c-18-48-12-102 18-148 32-50 88-72 152-62 92 14 154 88 146 178-4 48-28 92-62 118-40 32-96 44-152 28-56-16-96-54-102-114z"
          fill="url(#mmFurShade)"
        />
        <ellipse cx="210" cy="318" rx="108" ry="92" fill="url(#mmBelly)" opacity="0.92" />
        <ellipse cx="210" cy="318" rx="108" ry="92" stroke="#c4b5fd" strokeWidth="2" opacity="0.5" />

        <path
          d="M52 228c12-62 58-108 118-120 6-18 22-42 40-52-4 24 4 48 14 64-46 10-84 40-108 78-18 30-28 64-30 98-12-18-20-42-34-68z"
          fill="#7c3aed"
          opacity="0.9"
          stroke="#5b21b6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M368 228c-12-62-58-108-118-120-6-18-22-42-40-52 4 24-4 48-14 64 46 10 84 40 108 78 18 30 28 64 30 98 12-18 20-42 34-68z"
          fill="#7c3aed"
          opacity="0.9"
          stroke="#5b21b6"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <g>
          <ellipse cx="132" cy="168" rx="52" ry="58" fill="#faf5ff" stroke="#6d28d9" strokeWidth="2.5" />
          <ellipse cx="288" cy="168" rx="52" ry="58" fill="#faf5ff" stroke="#6d28d9" strokeWidth="2.5" />
          <ellipse cx="138" cy="176" rx="22" ry="26" fill="#312e81" />
          <ellipse cx="282" cy="176" rx="22" ry="26" fill="#312e81" />
          <ellipse cx="146" cy="162" rx="9" ry="10" fill="#fff" opacity="0.95" />
          <ellipse cx="274" cy="162" rx="9" ry="10" fill="#fff" opacity="0.95" />
          <ellipse cx="128" cy="196" rx="18" ry="14" fill="#fda4af" opacity="0.55" />
          <ellipse cx="292" cy="196" rx="18" ry="14" fill="#fda4af" opacity="0.55" />
        </g>

        <path
          d="M158 218c18 22 46 34 52 34s34-12 52-34"
          stroke="#4c1d95"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.35"
        />

        <path
          d="M138 212h144v14c-8 10-24 16-40 18h-64c-16-2-32-8-40-18v-14z"
          fill="url(#mmTooth)"
          stroke="#a8a29e"
          strokeWidth="1.5"
        />
        <path d="M158 212v14M188 212v14M218 212v14M248 212v14" stroke="#d6d3d1" strokeWidth="2" opacity="0.7" />

        <motion.g
          style={{ transformOrigin: '210px 248px', transformBox: 'fill-box' }}
          animate={{ rotate: jawRotate }}
          transition={jawTransition}
        >
          <path
            d="M138 248c4 48 36 82 72 82s68-34 72-82c-24 12-48 18-72 18s-48-6-72-18z"
            fill="#4c1d95"
            opacity="0.25"
          />
          <path
            d="M138 248c4 48 36 82 72 82s68-34 72-82c-24 12-48 18-72 18s-48-6-72-18z"
            fill="url(#mmTongue)"
            stroke="#be123c"
            strokeWidth="2"
          />
          <path
            d="M148 252h124c-10 28-28 48-62 48s-52-20-62-48z"
            fill="#881337"
            opacity="0.2"
          />
          <path
            d="M138 248h144v12c-10 14-34 22-72 22s-62-8-72-22v-12z"
            fill="url(#mmTooth)"
            stroke="#a8a29e"
            strokeWidth="1.5"
          />
          <path d="M158 248v12M188 248v12M218 248v12M248 248v12" stroke="#d6d3d1" strokeWidth="2" opacity="0.65" />
        </motion.g>
      </motion.g>
      </motion.g>
    </svg>
  );
}
