import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useViewport } from '../../hooks/useViewport';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../../components/game';
import {
  assignColors, canExit, firstBlocker, generateBoard, movableArrows, removeArrow,
} from './arrowBoard';
import {
  ARROW_COLORS, CELEBRATION_MS, FLASH_MS, HINT_DELAY_MS, SLIDE_BASE_MS,
  SLIDE_MS_PER_CELL, TOP_RESERVE, WIGGLE_MS, cellSizeFor, diffFor,
} from './arrowConfig';
import { createSfx } from './arrowAudio';
import { slideDistance } from './arrowPath';
import { ARROW_KEYFRAMES, LeavingArrow, RestingArrow } from './ArrowShape';

/** Margin round the grid, in cells */
const BOARD_PAD = 0.22;

const freshBoard = (difficulty) => {
  const board = generateBoard(diffFor(difficulty));
  return { board, colors: assignColors(board, ARROW_COLORS) };
};

const ArrowEscapeGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width, height, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [showInstructions, setShowInstructions] = useState(true);
  const [rounds, setRounds] = useState(0);
  const [{ board, colors }, setGame] = useState(() => freshBoard(difficulty));
  const [leaving, setLeaving] = useState([]);
  const [wiggleId, setWiggleId] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [hintId, setHintId] = useState(null);
  const [activity, setActivity] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [popping, setPopping] = useState(false);
  const [photo, setPhoto] = useState(null);

  const boardRef = useRef(board);
  const timersRef = useRef([]);
  const [sfx] = useState(createSfx);
  const nextTimerRef = useRef(null);
  const celebratingRef = useRef(false);

  useEffect(() => { boardRef.current = board; }, [board]);

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.code === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      sfx.close();
    };
  }, [sfx]);

  // ── taps ────────────────────────────────────────────────────────────────
  const handleTap = useCallback((id) => {
    if (celebratingRef.current) return;
    const current = boardRef.current;
    const arrow = current.arrows.find((a) => a.id === id);
    if (!arrow) return; // already sliding out: a tap on a moving arrow is ignored
    setActivity((n) => n + 1);
    setHintId(null);

    if (canExit(current, id)) {
      sfx.chime();
      const ms = reduce ? 160 : SLIDE_BASE_MS + SLIDE_MS_PER_CELL * slideDistance(current, arrow);
      const next = removeArrow(current, id);
      boardRef.current = next;
      setGame((g) => ({ ...g, board: next }));
      setLeaving((l) => [...l, { arrow, ms, board: current }]);
      schedule(() => setLeaving((l) => l.filter((x) => x.arrow.id !== id)), ms);
      return;
    }

    sfx.bump();
    const blocker = firstBlocker(current, id);
    setWiggleId(id);
    setFlashId(blocker);
    schedule(() => setWiggleId((cur) => (cur === id ? null : cur)), WIGGLE_MS);
    schedule(() => setFlashId((cur) => (cur === blocker ? null : cur)), FLASH_MS);
  }, [reduce, schedule, sfx]);

  const handleKey = useCallback((id, e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTap(id);
    }
  }, [handleTap]);

  const onTapEvent = useCallback((id, e) => {
    if (e.type === 'pointerdown') e.preventDefault?.();
    handleTap(id);
  }, [handleTap]);

  // ── hint: after a quiet spell, pulse one arrow that can move ────────────
  useEffect(() => {
    if (showInstructions || celebrating || board.arrows.length === 0) return undefined;
    const id = setTimeout(() => {
      const m = movableArrows(boardRef.current);
      if (m.length) setHintId(m[Math.floor(Math.random() * m.length)].id);
    }, HINT_DELAY_MS);
    return () => clearTimeout(id);
  }, [showInstructions, celebrating, board, activity]);

  // ── board cleared ───────────────────────────────────────────────────────
  const nextBoard = useCallback(() => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      timersRef.current = timersRef.current.filter((t) => t !== nextTimerRef.current);
      nextTimerRef.current = null;
    }
    celebratingRef.current = false;
    setCelebrating(false);
    setPopping(false);
    setPhoto(null);
    setHintId(null);
    setGame(freshBoard(difficulty));
  }, [difficulty]);

  useEffect(() => {
    if (showInstructions || celebrating) return;
    if (board.arrows.length > 0 || leaving.length > 0) return;
    celebratingRef.current = true;
    setCelebrating(true);
    setPopping(true);
    soundManager?.playWin?.();
    setPhoto(hasPhotos ? getRandomPhoto() : null);
    setRounds((n) => n + 1);
    nextTimerRef.current = schedule(nextBoard, CELEBRATION_MS);
  }, [board, leaving, showInstructions, celebrating, hasPhotos, getRandomPhoto, soundManager, schedule, nextBoard]);

  // ── render ──────────────────────────────────────────────────────────────
  const cell = cellSizeFor(width, height, board.rows, board.cols, isTablet);
  const boardW = cell * board.cols;
  const boardH = cell * board.rows;
  const movableIds = useMemo(() => new Set(movableArrows(board).map((a) => a.id)), [board]);
  const dots = useMemo(() => {
    const out = [];
    for (let r = 0; r < board.rows; r += 1) {
      for (let c = 0; c < board.cols; c += 1) out.push(`${r},${c}`);
    }
    return out;
  }, [board.rows, board.cols]);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'var(--game-surface)', touchAction: 'none', userSelect: 'none' }}
      onPointerDown={() => { if (celebratingRef.current) nextBoard(); }}
    >
      <style>{ARROW_KEYFRAMES}</style>

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: TOP_RESERVE, paddingBottom: 28 }}
      >
        <motion.div
          animate={popping && !reduce ? { scale: [1, 1.14, 0.96, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{
            width: boardW,
            height: boardH,
            borderRadius: Math.round(cell * 0.28),
            overflow: 'hidden',
            background: 'color-mix(in srgb, var(--game-surface) 50%, white)',
            border: '1px solid var(--dor-border)',
            boxShadow: 'var(--dor-shadow-card), 0 3px 0 var(--dor-lip)',
          }}
        >
          <svg
            width={boardW}
            height={boardH}
            // A quarter-cell margin keeps the hint pulse and edge heads off the rim.
            viewBox={`${-BOARD_PAD} ${-BOARD_PAD} ${board.cols + 2 * BOARD_PAD} ${board.rows + 2 * BOARD_PAD}`}
            style={{ display: 'block' }}
            aria-label="לוח חצים"
          >
            {dots.map((k) => {
              const [r, c] = k.split(',').map(Number);
              return (
                <circle key={k} cx={c + 0.5} cy={r + 0.5} r={0.05}
                  fill="var(--game-accent)" opacity={0.3} />
              );
            })}
            {board.arrows.map((a) => (
              <RestingArrow
                key={a.id}
                arrow={a}
                board={board}
                color={colors[a.id]}
                onTap={onTapEvent}
                onKey={handleKey}
                state={{
                  movable: movableIds.has(a.id),
                  wiggle: wiggleId === a.id,
                  flash: flashId === a.id,
                  hint: hintId === a.id,
                }}
              />
            ))}
            {leaving.map((l) => (
              <LeavingArrow key={l.arrow.id} arrow={l.arrow} board={l.board}
                color={colors[l.arrow.id]} ms={l.ms} />
            ))}
          </svg>
        </motion.div>
      </div>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="➡️" score={rounds} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="חצים ➡️"
          buttonText="בואו נתחיל"
          onStart={() => setShowInstructions(false)}
        >
          <p style={{ marginBottom: 12 }}>👆 <strong>לוחצים על חץ</strong> והוא עף החוצה.</p>
          <p style={{ marginBottom: 12 }}>🚧 אם משהו חוסם אותו, הוא מנענע ואפשר לנסות חץ אחר.</p>
          <p style={{ marginBottom: 12 }}>✨ מוציאים את כל החצים מהלוח!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={celebrating}
        successText="הלוח ריק! 🎉"
        subtitle={rounds === 1 ? 'לוח אחד! ➡️' : `${rounds} לוחות! ➡️`}
        photo={photo}
        numberOfPieces={180}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default ArrowEscapeGame;
