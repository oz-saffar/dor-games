import { motion, useReducedMotion } from 'framer-motion';

export function PrimaryButton({ children, className = '', type = 'button', style, ...props }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type={type}
      whileTap={reduce ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      className={
        'min-h-[52px] min-w-[44px] rounded-dor-lg border border-white/35 bg-dor-ember px-8 py-3.5 font-sans text-lg font-extrabold text-white ' +
        'bg-gradient-to-b from-white/25 via-transparent to-black/10 ' +
        'shadow-[0_3px_0_var(--dor-ember-dark),inset_0_1px_0_rgba(255,255,255,0.4)] ' +
        'active:translate-y-px active:shadow-[0_2px_0_var(--dor-ember-dark)] ' +
        className
      }
      style={style}
      {...props}
    >
      {children}
    </motion.button>
  );
}
