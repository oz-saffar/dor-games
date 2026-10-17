import { useRef } from 'react';
import { motion } from 'framer-motion';
import MonsterMunchMenuIcon from '../icons/MonsterMunchMenuIcon';

const LONG_PRESS_MS = 550;
const MOVE_TOLERANCE = 10;

/**
 * One game tile. A tap launches on pointerup; holding ~550ms toggles the
 * favourite heart instead and swallows the launch. Keyboard activation still
 * arrives through onClick with detail === 0.
 */
export default function GameTile({
  game,
  isFavourite,
  featured = false,
  compact = false,
  reduce,
  isLandscape,
  onLaunch,
  onToggleFavourite,
}) {
  const press = useRef({ timer: null, x: 0, y: 0, active: false, long: false });

  const clearTimer = () => {
    clearTimeout(press.current.timer);
    press.current.timer = null;
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const p = press.current;
    clearTimer();
    p.x = e.clientX;
    p.y = e.clientY;
    p.active = true;
    p.long = false;
    p.timer = setTimeout(() => {
      p.timer = null;
      p.long = true;
      onToggleFavourite(game.id);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e) => {
    const p = press.current;
    if (!p.active) return;
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > MOVE_TOLERANCE) {
      clearTimer();
      p.active = false; // a drag or scroll, not a tap
    }
  };

  const handlePointerUp = () => {
    const p = press.current;
    const wasTap = p.active && !p.long;
    clearTimer();
    p.active = false;
    if (wasTap) onLaunch(game.id);
  };

  const handlePointerCancel = () => {
    clearTimer();
    press.current.active = false;
  };

  const handleClick = (e) => {
    if (e.detail === 0) onLaunch(game.id);
  };

  const iconSize = featured ? 'clamp(52px,12vw,72px)' : compact ? 'clamp(28px,7vw,40px)' : 'clamp(38px,9vw,56px)';

  return (
    <motion.div
      className="relative rounded-dor-lg"
      style={{
        boxShadow: `0 4px 0 ${game.accent}, var(--dor-shadow-card)`,
        gridColumn: featured ? 'span 2' : undefined,
      }}
      initial={reduce ? false : { opacity: 0, y: 22, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
    >
      <motion.button
        type="button"
        data-testid={`tile-${game.id}`}
        aria-label={game.title}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        onClick={handleClick}
        whileTap={reduce ? {} : { scale: 0.97, y: 2 }}
        whileHover={reduce ? {} : { y: -2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        className="flex h-full w-full select-none flex-col items-center justify-center rounded-dor-lg border border-dor-border font-sans font-extrabold text-dor-ink"
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          padding: compact ? 'clamp(8px, 2vw, 12px)' : 'clamp(14px, 3vw, 22px)',
          minHeight: compact
            ? 'clamp(64px, 9vh, 88px)'
            : isLandscape
              ? 'clamp(76px, 18vh, 108px)'
              : 'clamp(88px,12vh,128px)',
          background: `linear-gradient(168deg, var(--dor-tile-face-top) 0%, color-mix(in srgb, ${game.accent} 10%, var(--dor-tile-face-bottom)) 100%)`,
        }}
      >
        <span className="mb-1 flex items-center justify-center" style={{ minHeight: iconSize }}>
          {game.id === 'monster-drag-chomp' ? (
            <MonsterMunchMenuIcon size={compact ? 36 : featured ? 72 : 50} />
          ) : (
            <span style={{ fontSize: iconSize, lineHeight: 1 }}>{game.icon}</span>
          )}
        </span>
        <span
          className="leading-tight text-dor-ink"
          style={{ fontSize: compact ? 'clamp(11px,3vw,14px)' : 'clamp(14px,3.8vw,19px)' }}
        >
          {game.title}
        </span>
      </motion.button>

      {featured && (
        <span
          className="pointer-events-none absolute -top-2 start-2 rounded-full border border-dor-border bg-dor-panel px-2 py-0.5 text-base shadow-dor-lip-sm"
          aria-hidden
        >
          ✨
        </span>
      )}
      {isFavourite && (
        <motion.span
          key="heart"
          data-testid={`heart-${game.id}`}
          className="pointer-events-none absolute -end-1.5 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-dor-border bg-dor-panel text-lg text-dor-ember shadow-dor-lip-sm"
          initial={reduce ? false : { scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 14 }}
          aria-hidden
        >
          ♥
        </motion.span>
      )}
    </motion.div>
  );
}
