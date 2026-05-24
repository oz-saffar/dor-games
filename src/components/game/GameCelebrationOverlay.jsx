import Confetti from 'react-confetti';
import { motion, useReducedMotion } from 'framer-motion';
import { CELEBRATION_OVERLAY } from '../../lib/designTokens';

/**
 * Celebration — confetti + rim-lit trophy card + radial bloom
 */
export default function GameCelebrationOverlay({
  show,
  successText = 'כל הכבוד! 🎉',
  subtitle,
  photo,
  accentColor = 'var(--dor-teal)',
  numberOfPieces = 320,
  /** Called when the photo fails to load (e.g. missing file on server); parent can swap URL */
  onPhotoError,
}) {
  const reduce = useReducedMotion();
  const pieces = reduce ? 0 : numberOfPieces;

  if (!show) return null;

  return (
    <>
      {pieces > 0 && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={pieces}
        />
      )}
      <div
        className="fixed inset-0 z-overlay flex items-center justify-center p-6"
        style={{
          backgroundColor: 'rgba(6, 10, 20, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        role="status"
        aria-live="polite"
        aria-label={successText}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(201,76,59,0.35)_0%,transparent_55%)]"
          aria-hidden
        />
        <div className="dor-modal-rim relative max-w-[92vw]">
          <motion.div
            className="flex max-h-[80vh] flex-col items-center gap-4 overflow-hidden rounded-[calc(var(--dor-radius-xl)-2px)] bg-dor-panel-elevated text-center"
            style={{
              padding: CELEBRATION_OVERLAY.padding,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -24px 60px -40px rgba(201,76,59,0.12)',
            }}
            initial={reduce ? false : { opacity: 0, scale: 0.82, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <p
              className="font-display m-0 font-normal leading-[1.05]"
              style={{
                fontSize: CELEBRATION_OVERLAY.successTextSize,
                backgroundImage: `linear-gradient(100deg, ${accentColor} 0%, var(--dor-gold-bright) 40%, ${accentColor} 85%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.12))',
              }}
            >
              {successText}
            </p>
            {photo && (
              <img
                key={photo}
                src={photo}
                alt="Dor"
                className="max-w-full rounded-dor-lg object-cover shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)] ring-2 ring-white/40"
                style={{ maxHeight: CELEBRATION_OVERLAY.photoMaxHeight }}
                onError={() => onPhotoError?.()}
              />
            )}
            {subtitle && (
              <p className="m-0 font-sans text-xl font-bold text-dor-ink-muted">{subtitle}</p>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
