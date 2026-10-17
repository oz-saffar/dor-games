import { motion, useReducedMotion } from 'framer-motion';

/**
 * Lazy route load — warm paper splash with a quiet orbiting ring.
 */
export default function LoadingFallback() {
  const reduce = useReducedMotion();
  return (
    <div
      className="fixed inset-0 z-modal flex flex-col items-center justify-center gap-6 overflow-hidden"
      style={{
        background: 'linear-gradient(165deg, var(--dor-shell-start) 0%, var(--dor-shell-end) 100%)',
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex flex-col items-center gap-5">
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center"
          animate={reduce ? {} : { scale: [1, 1.04, 1] }}
          transition={reduce ? {} : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 rounded-full border-[3px] border-dor-border" aria-hidden />
          <motion.div
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-dor-ochre border-r-dor-terracotta"
            animate={reduce ? {} : { rotate: 360 }}
            transition={reduce ? {} : { repeat: Infinity, duration: 1.1, ease: 'linear' }}
            aria-hidden
          />
          <span className="font-display relative text-3xl text-dor-ink">ד</span>
        </motion.div>
        <p className="font-display text-xl tracking-wide text-dor-ink-muted">טוען משחק…</p>
      </div>
    </div>
  );
}
