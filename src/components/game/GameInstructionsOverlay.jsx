import { motion, useReducedMotion } from 'framer-motion';
import { INSTRUCTIONS_OVERLAY } from '../../lib/designTokens';
import { PrimaryButton } from '../ui/PrimaryButton';

/**
 * Instructions — a sheet of warm paper resting on a dimmed table.
 */
export default function GameInstructionsOverlay({
  title,
  children,
  buttonText,
  onStart,
  accentColor = 'var(--game-accent)',
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-modal flex items-center justify-center p-5"
      style={{ backgroundColor: INSTRUCTIONS_OVERLAY.scrim }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.01 : 0.24 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-instructions-title"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] rounded-dor-xl border border-dor-border bg-dor-panel px-8 py-9 text-center"
        style={{ boxShadow: '0 4px 0 var(--dor-lip), var(--dor-shadow-card-hover)' }}
        initial={reduce ? false : { opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        {/* Accent seam — the card's one spot of colour */}
        <div
          className="mx-auto mb-6 h-1.5 w-14 rounded-full"
          style={{ backgroundColor: accentColor }}
          aria-hidden
        />
        <h2
          id="game-instructions-title"
          className="font-display mb-5 text-dor-ink"
          style={{ fontSize: INSTRUCTIONS_OVERLAY.titleSize, fontWeight: 400 }}
        >
          {title}
        </h2>
        <div
          className="mb-8 text-right font-sans text-dor-ink-muted"
          style={{
            fontSize: INSTRUCTIONS_OVERLAY.bodySize,
            lineHeight: INSTRUCTIONS_OVERLAY.bodyLineHeight,
          }}
        >
          {children}
        </div>
        <PrimaryButton
          onClick={onStart}
          className="w-full max-w-xs"
          style={{ backgroundColor: accentColor }}
        >
          {buttonText}
        </PrimaryButton>
      </motion.div>
    </motion.div>
  );
}
