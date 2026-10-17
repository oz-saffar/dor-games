import { motion } from 'framer-motion';
import { PLAY_COLORS, INK } from '../../lib/palette';

/**
 * The friendly opponent: a round yellow face that never frowns. `mood` is
 * 'idle' | 'thinking' | 'giggle'.
 */
const Opponent = ({ mood = 'idle', size = 80, reduce = false, caption = null }) => {
  const giggle = mood === 'giggle';
  const thinking = mood === 'thinking';
  const wiggle = !reduce && giggle ? { rotate: [0, -10, 10, -8, 8, 0], y: [0, -8, 0, -6, 0] } : { rotate: 0, y: 0 };
  const pupilX = thinking ? 3 : 0;

  return (
    <div
      data-testid="opponent"
      data-mood={mood}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none' }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        animate={wiggle}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="44" fill={PLAY_COLORS.yellow} stroke={INK} strokeOpacity="0.25" strokeWidth="2" />
        <circle cx="26" cy="60" r="7" fill={PLAY_COLORS.red} opacity="0.25" />
        <circle cx="74" cy="60" r="7" fill={PLAY_COLORS.red} opacity="0.25" />
        {giggle ? (
          <>
            <path d="M30 42 Q37 34 44 42" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M56 42 Q63 34 70 42" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="37" cy="42" r="6" fill="#fff" />
            <circle cx="63" cy="42" r="6" fill="#fff" />
            <circle cx={37 + pupilX} cy="43" r="3.2" fill={INK} />
            <circle cx={63 + pupilX} cy="43" r="3.2" fill={INK} />
          </>
        )}
        {giggle ? (
          <path d="M30 58 Q50 84 70 58 Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        ) : (
          <path d="M33 60 Q50 76 67 60" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
      </motion.svg>
      {caption && (
        <div
          style={{
            padding: '3px 10px',
            borderRadius: 14,
            background: 'var(--dor-surface, #fffdf8)',
            border: '1px solid var(--dor-border)',
            boxShadow: '0 2px 0 var(--dor-lip)',
            fontFamily: "'Varela Round', 'Rubik', sans-serif",
            fontSize: 'clamp(14px, 3.6vw, 20px)',
            color: 'var(--dor-ink, #3a3630)',
            whiteSpace: 'nowrap',
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
};

export default Opponent;
