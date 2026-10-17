import { motion } from 'framer-motion';
import { PLAY_COLORS } from '../../lib/palette';
import { COLS } from './fourInRowLogic';

const DISC = { dor: PLAY_COLORS.red, bot: PLAY_COLORS.yellow };

const Disc = ({ owner, size, row, cell, lit, reduce }) => (
  <motion.div
    data-disc={owner}
    initial={reduce ? false : { y: -(row + 1) * cell - size }}
    animate={{ y: 0, scale: lit && !reduce ? [1, 1.14, 1] : 1 }}
    transition={{
      y: { type: 'spring', stiffness: 380, damping: 12, mass: 0.9 },
      scale: lit ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.15 },
    }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${DISC[owner]} 70%, white), ${DISC[owner]} 62%)`,
      border: `${Math.max(2, Math.round(size * 0.07))}px solid color-mix(in srgb, ${DISC[owner]} 70%, black)`,
      boxShadow: lit
        ? `0 0 0 ${Math.round(size * 0.1)}px #fff, 0 0 ${Math.round(size * 0.4)}px ${DISC[owner]}`
        : '0 3px 0 rgba(58,54,48,0.28)',
      boxSizing: 'border-box',
    }}
  />
);

const Board = ({ board, layout, winSet, turn, wobbleCol, reduce, onColumn }) => {
  const { cell, framePad, boardW, boardH } = layout;
  const size = Math.round(cell * 0.82);

  return (
    <div
      data-testid="four-board"
      data-turn={turn}
      dir="ltr"
      style={{
        position: 'relative',
        width: boardW,
        height: boardH,
        borderRadius: Math.round(cell * 0.3),
        background: 'color-mix(in srgb, var(--game-accent) 40%, #b88a5a)',
        border: '1px solid var(--dor-border)',
        boxShadow: 'var(--dor-shadow-card), 0 3px 0 var(--dor-lip)',
        touchAction: 'none',
      }}
    >
      {board.map((row, r) => row.map((owner, c) => (
        <div
          key={`${r}-${c}`}
          data-cell={`${r}-${c}`}
          data-owner={owner || 'empty'}
          style={{
            position: 'absolute',
            left: framePad + c * cell,
            top: framePad + r * cell,
            width: cell,
            height: cell,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'var(--game-surface)',
              boxShadow: 'inset 0 3px 5px rgba(58,54,48,0.35)',
            }}
          />
          {owner && (
            <Disc
              owner={owner}
              size={size}
              row={r}
              cell={cell}
              lit={winSet.has(`${r}-${c}`)}
              reduce={reduce}
            />
          )}
        </div>
      )))}
      {Array.from({ length: COLS }, (_, c) => (
        <motion.button
          key={c}
          type="button"
          data-column={c}
          data-tap-target
          aria-label={`עמודה ${c + 1}`}
          animate={wobbleCol === c && !reduce ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
          onPointerDown={(e) => { e.preventDefault(); onColumn(c); }}
          onClick={(e) => { if (e.detail === 0) onColumn(c); }}
          style={{
            position: 'absolute',
            left: framePad + c * cell,
            top: 0,
            width: cell,
            height: boardH,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            zIndex: 2,
            WebkitTapHighlightColor: 'transparent',
          }}
        />
      ))}
    </div>
  );
};

export default Board;
