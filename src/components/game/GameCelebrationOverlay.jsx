import { useContext, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { ActiveGameContext } from '../../lib/ActiveGameContext';
import { recordStar } from '../../lib/progress';
import { motion, useReducedMotion } from 'framer-motion';
import { CELEBRATION_OVERLAY } from '../../lib/designTokens';

/** Muted confetti drawn from the Warm Paper & Clay scale */
const CONFETTI_COLORS = ['#8fa98a', '#c97b5a', '#d9a441', '#7e9bb5', '#c08b8b', '#9887a8'];

/**
 * Celebration — confetti over a warm paper card.
 */
export default function GameCelebrationOverlay({
  show,
  successText = 'כל הכבוד! 🎉',
  subtitle,
  photo,
  accentColor = 'var(--game-accent)',
  numberOfPieces = 220,
  /** Called when the photo fails to load (e.g. missing file on server); parent can swap URL */
  onPhotoError,
}) {
  const reduce = useReducedMotion();
  const pieces = reduce ? 0 : numberOfPieces;
  const activeGameId = useContext(ActiveGameContext);
  const wasShown = useRef(false);

  // Every finished round earns a star: count the false -> true transition of `show`.
  useEffect(() => {
    if (show && !wasShown.current && activeGameId) recordStar();
    wasShown.current = show;
  }, [show, activeGameId]);

  if (!show) return null;

  return (
    <>
      {pieces > 0 && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={pieces}
          colors={CONFETTI_COLORS}
        />
      )}
      <div
        className="fixed inset-0 z-overlay flex items-center justify-center p-6"
        style={{ backgroundColor: CELEBRATION_OVERLAY.scrim }}
        role="status"
        aria-live="polite"
        aria-label={successText}
      >
        <motion.div
          className="relative flex max-h-[80vh] max-w-[92vw] flex-col items-center gap-4 overflow-hidden rounded-dor-xl border border-dor-border bg-dor-panel text-center"
          style={{
            padding: CELEBRATION_OVERLAY.padding,
            boxShadow: '0 4px 0 var(--dor-lip), var(--dor-shadow-card-hover)',
          }}
          initial={reduce ? false : { opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        >
          <p
            className="font-display m-0 font-normal leading-[1.1]"
            style={{
              fontSize: CELEBRATION_OVERLAY.successTextSize,
              color: accentColor,
            }}
          >
            {successText}
          </p>
          {photo && (
            <img
              key={photo}
              src={photo}
              alt="Dor"
              className="max-w-full rounded-dor-lg border border-dor-border object-cover shadow-dor-card"
              style={{ maxHeight: CELEBRATION_OVERLAY.photoMaxHeight }}
              onError={() => onPhotoError?.()}
            />
          )}
          {subtitle && (
            <p className="m-0 font-sans text-xl font-bold text-dor-ink-muted">{subtitle}</p>
          )}
        </motion.div>
      </div>
    </>
  );
}
