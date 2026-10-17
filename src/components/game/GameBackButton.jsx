import { motion, useReducedMotion } from 'framer-motion';
import { BACK_BUTTON, BACK_BUTTON_ICON_SIZE } from '../../lib/designTokens';

/**
 * Standard back button — home icon, fixed top-right (RTL)
 */
export default function GameBackButton({ onExit }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      onClick={onExit}
      style={BACK_BUTTON}
      aria-label="חזרה לתפריט הראשי"
      whileTap={reduce ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <span style={{ fontSize: BACK_BUTTON_ICON_SIZE }} aria-hidden>🏠</span>
      <span>חזרה</span>
    </motion.button>
  );
}
