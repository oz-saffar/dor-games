import { motion, useReducedMotion } from 'framer-motion';

/**
 * Lazy route load — branded splash with orbiting ring
 */
export default function LoadingFallback() {
  const reduce = useReducedMotion();
  return (
    <div
      className="fixed inset-0 z-modal flex flex-col items-center justify-center gap-6 overflow-hidden"
      style={{
        background: 'linear-gradient(165deg, #0f1729 0%, #1a2744 40%, #0c1a2e 100%)',
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 30% 20%, rgba(201,76,59,0.35), transparent 50%), radial-gradient(ellipse 70% 55% at 80% 80%, rgba(42,95,98,0.35), transparent 50%)',
        }}
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-5">
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center"
          animate={reduce ? {} : { scale: [1, 1.04, 1] }}
          transition={reduce ? {} : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-0 rounded-full border-[3px] border-white/15"
            aria-hidden
          />
          <motion.div
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-dor-gold border-r-dor-ember"
            animate={reduce ? {} : { rotate: 360 }}
            transition={reduce ? {} : { repeat: Infinity, duration: 0.9, ease: 'linear' }}
            aria-hidden
          />
          <span className="font-display relative text-3xl text-white drop-shadow-[0_0_20px_rgba(201,162,39,0.6)]">
            ד
          </span>
        </motion.div>
        <p className="font-display text-xl tracking-wide text-white/90">טוען משחק…</p>
      </div>
    </div>
  );
}
