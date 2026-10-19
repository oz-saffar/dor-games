import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ACCENTS, INK, PAPER_LIGHT } from '../../lib/palette';
import { PAD, VB, labelPositions } from './layout';

const DotBoard = ({
  svgRef, picture, dots, k, complete, size, hint, wobbleId, reduce,
  onDown, onMove, onRelease,
}) => {
  const n = dots.length;
  const labels = useMemo(() => labelPositions(dots), [dots]);
  // The reveal fills the picture's real outline, not the polygon through the dots:
  // at five dots a dinosaur is only a pentagon, and finishing should show a dinosaur.
  const polygon = picture.points.map(([x, y]) => `${x},${y}`).join(' ');
  const segments = [];
  for (let i = 1; i < k; i += 1) segments.push([dots[i - 1], dots[i]]);
  if (k === n) segments.push([dots[n - 1], dots[0]]);

  return (
    <svg
      ref={svgRef}
      data-testid="dot-board"
      width={size}
      height={size}
      viewBox={`${-PAD} ${-PAD} ${VB} ${VB}`}
      style={{ touchAction: 'none', overflow: 'visible' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
    >
      <rect x={-PAD} y={-PAD} width={VB} height={VB} fill="transparent" />
      <motion.polygon
        points={polygon}
        fill={picture.color}
        stroke={picture.color}
        strokeWidth={2}
        strokeLinejoin="round"
        initial={false}
        animate={complete ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduce ? 1 : 0.9 }}
        transition={{ duration: reduce ? 0 : 0.6 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      {segments.map(([a, b]) => (
        <motion.line
          key={`${a.n}-${b.n}`}
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={picture.color}
          strokeWidth={2.6}
          strokeLinecap="round"
          opacity={0.9}
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      ))}
      {complete && !reduce && dots.map((d, i) => (
        <motion.text
          key={`sp-${d.n}`}
          x={d.x} y={d.y} fontSize={9} textAnchor="middle" dominantBaseline="central"
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 1, 0], scale: [0.2, 1.3, 0.6] }}
          transition={{ duration: 1.1, delay: i * 0.05 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center', pointerEvents: 'none' }}
        >
          ✨
        </motion.text>
      ))}
      {dots.map((d, i) => {
        const done = d.n <= k;
        const isNext = d.n === k + 1 && !complete;
        const lp = labels[i];
        const r = isNext ? 4.8 : 3.4;
        return (
          <motion.g
            key={d.n}
            data-dot={d.n}
            data-done={done ? 'true' : 'false'}
            {...(isNext ? { 'data-next': 'true' } : {})}
            data-tap-target
            animate={wobbleId === d.n && !reduce ? { x: [0, -1.6, 1.6, -1.2, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ cursor: 'pointer' }}
          >
            <motion.circle
              cx={d.x} cy={d.y} r={r}
              fill={done ? picture.color : PAPER_LIGHT}
              stroke={isNext ? ACCENTS.terracotta : INK}
              strokeWidth={isNext ? 1.6 : 1.2}
              animate={isNext && !reduce
                ? { scale: hint ? [1, 1.35, 0.95, 1.25, 1] : [1, 1.15, 1] }
                : { scale: 1 }}
              transition={isNext && !reduce
                ? { duration: hint ? 0.7 : 1.4, repeat: Infinity }
                : { duration: 0.2 }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
            <text
              x={lp.x} y={lp.y}
              textAnchor="middle" dominantBaseline="central"
              fontFamily="Rubik, sans-serif" fontWeight={700}
              fontSize={isNext ? 10.5 : 9}
              fill={INK} stroke={PAPER_LIGHT} strokeWidth={2.4} paintOrder="stroke"
              style={{ pointerEvents: 'none' }}
            >
              {d.n}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
};

export default DotBoard;
