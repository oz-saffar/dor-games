import { motion, useReducedMotion } from 'framer-motion';
import { INSTRUCTIONS_OVERLAY } from '../../lib/designTokens';
import { PrimaryButton } from '../ui/PrimaryButton';

/**
 * Instructions — frosted backdrop + gradient-rim “console card”
 */
export default function GameInstructionsOverlay({
  title,
  children,
  buttonText,
  onStart,
  accentColor = 'var(--dor-ember)',
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-modal flex items-center justify-center p-5"
      style={{
        backgroundColor: 'rgba(8, 12, 22, 0.62)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.01 : 0.28 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-instructions-title"
    >
      <div className="dor-modal-rim w-full max-w-[440px]">
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="rounded-[calc(var(--dor-radius-xl)-2px)] bg-dor-panel-elevated px-8 py-8 text-center"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -20px 50px -30px rgba(201,76,59,0.08)',
          }}
          initial={reduce ? false : { opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        >
          <h2
            id="game-instructions-title"
            className="font-display mb-5 text-dor-ink"
            style={{
              fontSize: INSTRUCTIONS_OVERLAY.titleSize,
              fontWeight: 400,
              backgroundImage: `linear-gradient(120deg, ${accentColor} 0%, var(--dor-ink) 55%, ${accentColor} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.08))',
            }}
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
            style={{
              backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 40%)',
              backgroundColor: accentColor,
              boxShadow: '0 3px 0 rgba(0,0,0,0.22)',
            }}
          >
            {buttonText}
          </PrimaryButton>
        </motion.div>
      </div>
    </motion.div>
  );
}
