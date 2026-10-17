import { motion, useReducedMotion } from 'framer-motion';

/**
 * Credits — same cinematic card language as instructions
 */
export default function CreditsScreen({ onClose }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="fixed inset-0 z-[2100] flex items-center justify-center p-5"
      style={{ backgroundColor: 'rgba(58, 54, 48, 0.42)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.01 : 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-title"
    >
      <div className="w-full max-w-md">
        <motion.div
          data-config-scroll
          className="max-h-[85vh] overflow-y-auto rounded-dor-xl border border-dor-border bg-dor-panel px-8 py-9"
          style={{ boxShadow: '0 4px 0 var(--dor-lip), var(--dor-shadow-card-hover)' }}
          initial={reduce ? false : { scale: 0.94, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        >
          <h2
            id="credits-title"
            className="font-display mb-6 text-center text-3xl text-dor-ink"
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
            className="mt-8 w-full rounded-dor-lg border-none bg-dor-ember py-3.5 font-sans text-lg font-extrabold text-white shadow-[0_4px_0_rgba(74,62,46,0.22)] active:translate-y-[2px]"
          >
            סגור
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
