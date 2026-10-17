import { motion } from 'framer-motion';
import { INK } from '../../lib/palette';

const CHALK = '#fbf7ee';
const idx = (i) => ({ r: Math.floor(i / 3), c: i % 3 });

/** Wooden board with chalk grid; cells are tap targets. Reads `data-cell` / `data-owner`. */
const Board = ({ board, layout, winLine, turn, wobble, pieces, reduce, onCell }) => {
  const { side, pad, cell } = layout;
  const centre = (i) => {
    const { r, c } = idx(i);
    return [pad + cell * (c + 0.5), pad + cell * (r + 0.5)];
  };
  const [x1, y1] = winLine ? centre(winLine[0]) : [0, 0];
  const [x2, y2] = winLine ? centre(winLine[2]) : [0, 0];
  const grid = [1, 2].map((k) => pad + cell * k);
  const far = pad + cell * 3;

  return (
    <div
      data-testid="board"
      data-turn={turn}
      style={{
        position: 'relative',
        width: side,
        height: side,
        borderRadius: Math.round(side * 0.05),
        background: '#b98a5a',
        border: '1px solid var(--dor-border)',
        boxShadow: '0 3px 0 #8a6340, var(--dor-shadow-card)',
        flexShrink: 0,
      }}
    >
      <svg width={side} height={side} viewBox={`0 0 ${side} ${side}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
        <g stroke={CHALK} strokeWidth={Math.max(4, side * 0.018)} strokeLinecap="round" opacity="0.9">
          {grid.map((g) => (
            <g key={g}>
              <line x1={g} y1={pad + 6} x2={g + 1.5} y2={far - 6} />
              <line x1={pad + 6} y1={g} x2={far - 6} y2={g - 1.5} />
            </g>
          ))}
        </g>
        {winLine && (
          <motion.line
            data-testid="win-line"
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#e0584a"
            strokeWidth={Math.max(8, side * 0.03)}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        )}
      </svg>
      {board.map((owner, i) => {
        const { r, c } = idx(i);
        const kind = owner ?? 'empty';
        const glyph = owner ? pieces[owner] : null;
        return (
          <button
            key={i}
            type="button"
            data-cell={i}
            data-owner={kind}
            data-tap-target
            aria-label={glyph ? `תא ${i + 1} ${glyph}` : `תא ${i + 1} ריק`}
            onPointerDown={() => onCell(i)}
            onClick={(e) => { if (e.detail === 0) onCell(i); }}
            style={{
              position: 'absolute',
              left: pad + c * cell,
              top: pad + r * cell,
              width: cell,
              height: cell,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              touchAction: 'none',
              color: INK,
            }}
          >
            <motion.span
              key={`${i}-${kind}`}
              data-piece-glyph={glyph || undefined}
              initial={glyph && !reduce ? { scaleX: 1.5, scaleY: 0.2, opacity: 0 } : false}
              animate={{ scaleX: 1, scaleY: 1, opacity: 1, x: wobble === i && !reduce ? [0, -6, 6, -4, 4, 0] : 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 11, x: { duration: 0.35 } }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', height: '100%', fontSize: cell * 0.62, lineHeight: 1,
              }}
            >
              {glyph}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
};

export default Board;
