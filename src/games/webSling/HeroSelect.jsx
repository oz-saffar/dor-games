import { motion, useReducedMotion } from 'framer-motion';
import { HEROES } from './webSlingConfig';
import { spriteSrc } from './spriteUtils';

/**
 * Opening screen — pick a hero, which also starts the round.
 * One tap total, so a four-year-old is never stuck on a menu.
 */
const HeroSelect = ({ onPick, accentColor }) => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-modal flex items-center justify-center p-5"
      style={{
        backgroundColor: 'rgba(8, 12, 22, 0.66)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.01 : 0.28 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ws-hero-select-title"
    >
      <div className="dor-modal-rim w-full max-w-[460px]">
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="rounded-[calc(var(--dor-radius-xl)-2px)] bg-dor-panel-elevated px-6 py-7 text-center"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -20px 50px -30px rgba(201,76,59,0.08)',
            maxHeight: '92dvh',
            overflowY: 'auto',
          }}
          initial={reduce ? false : { opacity: 0, scale: 0.9, y: 22 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        >
          <h2
            id="ws-hero-select-title"
            className="font-display mb-3 text-dor-ink"
            style={{
              fontSize: 'clamp(26px, 7vw, 34px)',
              fontWeight: 400,
              backgroundImage: `linear-gradient(120deg, ${accentColor} 0%, var(--dor-ink) 55%, ${accentColor} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
            }}
          >
            רשת! 🕸️
          </h2>

          <div
            className="mb-5 text-right font-sans text-dor-ink-muted"
            style={{ fontSize: 'clamp(15px, 4vw, 17px)', lineHeight: 1.6, direction: 'rtl' }}
          >
            <p style={{ marginBottom: 8 }}>👆 <strong>לחץ על הנבל</strong> — הגיבור יורה רשת!</p>
            <p style={{ marginBottom: 8 }}>🦹 הנבלים מציצים מהגגות ומהשמיים.</p>
            <p>🕷️ <strong>בחר את הגיבור שלך</strong> ומתחילים!</p>
          </div>

          <div className="grid grid-cols-3 gap-3" style={{ direction: 'rtl' }}>
            {HEROES.map((hero) => (
              <button
                key={hero.id}
                type="button"
                onClick={() => onPick(hero.id)}
                className="rounded-2xl px-2 py-3 transition-transform active:scale-95"
                style={{
                  background: `linear-gradient(180deg, ${hero.glow}22 0%, transparent 70%)`,
                  border: `2.5px solid ${hero.glow}`,
                  boxShadow: `0 4px 0 ${hero.suitB}`,
                  cursor: 'pointer',
                }}
              >
                <img
                  src={spriteSrc(hero.id)}
                  alt=""
                  aria-hidden="true"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 92,
                    objectFit: 'contain',
                  }}
                />
                <div
                  className="font-display mt-1 text-dor-ink"
                  style={{ fontSize: 'clamp(13px, 3.4vw, 16px)', fontWeight: 700 }}
                >
                  {hero.name}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HeroSelect;
