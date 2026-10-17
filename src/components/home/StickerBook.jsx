import { motion } from 'framer-motion';
import { STICKERS, STARS_PER_STICKER, stickersUnlocked, nextStickerProgress } from '../../lib/progress';

/** Full-screen sticker page: earned stickers, friendly locked silhouettes, progress to the next. */
export default function StickerBook({ stars, onClose, reduce }) {
  const unlocked = stickersUnlocked(stars);
  const { done, current, total } = nextStickerProgress(stars);

  return (
    <motion.div
      className="fixed inset-0 z-modal flex flex-col items-center overflow-y-auto bg-dor-parchment px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(16px+env(safe-area-inset-top))]"
      role="dialog"
      aria-label="ספר מדבקות"
      data-testid="sticker-book"
      initial={reduce ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex w-full max-w-[960px] flex-col items-center gap-4">
        <h2 className="font-display m-0 text-[clamp(26px,7vw,40px)] text-dor-ink">📒 ⭐ {stars}</h2>

        <div
          className="flex w-full items-center gap-1.5 rounded-full border border-dor-border bg-dor-panel p-2 shadow-dor-lip-sm"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={current}
        >
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className="flex-1 text-center text-[clamp(20px,5vw,30px)] leading-none"
              style={{ opacity: done || i < current ? 1 : 0.25, filter: done || i < current ? 'none' : 'grayscale(1)' }}
            >
              ⭐
            </span>
          ))}
          <span className="text-[clamp(22px,5.5vw,32px)] leading-none">{done ? '🎉' : '🎁'}</span>
        </div>

        <div
          className="grid w-full gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(72px,18vw,104px), 1fr))' }}
        >
          {STICKERS.map((emoji, i) => {
            const earned = i < unlocked;
            return (
              <div
                key={emoji}
                data-testid={earned ? 'sticker-earned' : 'sticker-locked'}
                className="flex aspect-square items-center justify-center rounded-dor-lg border border-dor-border bg-dor-panel shadow-dor-lip-sm"
              >
                <span
                  className="text-[clamp(36px,9vw,60px)] leading-none"
                  style={earned ? undefined : { filter: 'grayscale(1) brightness(0.35)', opacity: 0.28 }}
                  aria-hidden
                >
                  {emoji}
                </span>
              </div>
            );
          })}
        </div>

        <p className="m-0 font-sans text-sm text-dor-ink-muted">
          ⭐ × {STARS_PER_STICKER} = {STICKERS[Math.min(unlocked, STICKERS.length - 1)]}
        </p>

        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          className="flex min-h-[64px] min-w-[160px] items-center justify-center rounded-dor-lg border border-dor-border-strong bg-dor-panel text-3xl font-extrabold text-dor-ink shadow-dor-lip"
        >
          ✖️
        </button>
      </div>
    </motion.div>
  );
}
