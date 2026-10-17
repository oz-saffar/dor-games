import { motion } from 'framer-motion';

/**
 * Primary call-to-action — a solid accent tile with a wooden bottom lip.
 * Defaults to the active game's accent so overlays theme themselves.
 */
export function PrimaryButton({ children, className = '', type = 'button', style, ...rest }) {
  return (
    <motion.button
      type={type}
      className={
        'min-h-[54px] min-w-[44px] rounded-dor-lg border-none bg-game-accent px-8 py-3.5 ' +
        'font-sans text-lg font-extrabold text-white ' +
        'shadow-[0_4px_0_rgba(74,62,46,0.22)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(74,62,46,0.22)] ' +
        className
      }
      style={style}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export default PrimaryButton;
