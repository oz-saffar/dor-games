import { motion, useReducedMotion } from 'framer-motion';

/**
 * Credits — same cinematic card language as instructions
 */
export default function CreditsScreen({ onClose }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="fixed inset-0 z-[2100] flex items-center justify-center p-5"
      style={{
        backgroundColor: 'rgba(8, 12, 22, 0.65)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.01 : 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-title"
    >
      <div className="dor-modal-rim w-full max-w-md">
        <motion.div
          data-config-scroll
          className="max-h-[85vh] overflow-y-auto rounded-[calc(var(--dor-radius-xl)-2px)] bg-dor-panel-elevated px-8 py-9"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
          }}
          initial={reduce ? false : { scale: 0.88, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        >
          <h2
            id="credits-title"
            className="font-display mb-6 bg-gradient-to-l from-dor-ember via-dor-gold to-dor-teal bg-clip-text text-center text-3xl text-transparent"
            style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            תודות
          </h2>
          <div className="space-y-4 text-right font-sans text-base leading-relaxed text-dor-ink-muted">
            <p className="text-dor-ink">
              <strong className="text-dor-ember">משחקי דור</strong> — אוסף משחקים חינוכיים ומהנים.
            </p>
            <p>נבנה באהבה עבור דור ומשפחתו.</p>
            <p className="text-sm text-dor-ink-subtle">
              צלילים, עיצוב וממשק מתעדכנים מעת לעת. תודה לכל מי שתורם רעיונות ובדיקות.
            </p>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={reduce ? {} : { scale: 0.97 }}
            className="mt-8 w-full rounded-dor-lg border border-white/30 py-3.5 font-sans text-lg font-extrabold text-white shadow-[0_6px_0_var(--dor-ember-dark),0_0_40px_-8px_var(--dor-glow-ember)]"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%), linear-gradient(165deg, #e05a48 0%, var(--dor-ember) 50%, #8f2d22 100%)',
            }}
          >
            סגור
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
