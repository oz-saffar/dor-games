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
  BOTTOM_RESERVE, CELEBRATION_MS, FLIP_MS, TOP_RESERVE, bubblesFor, cellSizeFor, shapeFor,
} from './popItConfig';
import { createPopSfx } from './popAudio';
import Bubble from './Bubble';

const PopItGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width, height, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [showInstructions, setShowInstructions] = useState(true);
  const [rounds, setRounds] = useState(0);
  const [popped, setPopped] = useState(() => new Set());
  const [wobbleId, setWobbleId] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [photo, setPhoto] = useState(null);

  const bubbles = useMemo(() => bubblesFor(difficulty), [difficulty]);
  const shape = useMemo(() => shapeFor(difficulty), [difficulty]);
  const rows = shape.length;
  const cols = Math.max(...shape.map((l) => l.length));

  const poppedRef = useRef(new Set());
  const celebratingRef = useRef(false);
  const timersRef = useRef([]);
  const nextTimerRef = useRef(null);
  const [sfx] = useState(createPopSfx);

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

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    sfx.close();
  }, [sfx]);

  // ── popping ─────────────────────────────────────────────────────────────
  const handlePop = useCallback((id) => {
    if (celebratingRef.current) return;
    if (poppedRef.current.has(id)) {
      setWobbleId(id);
      schedule(() => setWobbleId((cur) => (cur === id ? null : cur)), 350);
      return;
    }
    const next = new Set(poppedRef.current);
    next.add(id);
    poppedRef.current = next;
    setPopped(next);
    sfx.pop();
    try { navigator.vibrate?.(12); } catch { /* no haptics */ }
  }, [schedule, sfx]);

  // ── board complete ──────────────────────────────────────────────────────
  const nextRound = useCallback(() => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      timersRef.current = timersRef.current.filter((t) => t !== nextTimerRef.current);
      nextTimerRef.current = null;
    }
    celebratingRef.current = false;
    setCelebrating(false);
    setPhoto(null);
    setFlipping(true);
    const half = reduce ? 0 : FLIP_MS / 2;
    schedule(() => {
      poppedRef.current = new Set();
      setPopped(new Set());
    }, half);
    schedule(() => setFlipping(false), reduce ? 0 : FLIP_MS);
  }, [reduce, schedule]);

  useEffect(() => {
    if (showInstructions || celebrating || flipping) return;
    if (popped.size < bubbles.length) return;
    celebratingRef.current = true;
    setCelebrating(true);
    soundManager?.playWin?.();
    setPhoto(hasPhotos ? getRandomPhoto() : null);
    setRounds((n) => n + 1);
    nextTimerRef.current = schedule(nextRound, CELEBRATION_MS);
  }, [popped, bubbles.length, showInstructions, celebrating, flipping, hasPhotos, getRandomPhoto, soundManager, schedule, nextRound]);

  // ── render ──────────────────────────────────────────────────────────────
  const cell = cellSizeFor(width, height, rows, cols, isTablet);
  const size = Math.round(cell * 0.86);
  const slabPad = Math.round(cell * 0.25);
  const slabW = cell * cols + slabPad * 2;
  const slabH = cell * rows + slabPad * 2;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'var(--game-surface)', touchAction: 'none', userSelect: 'none' }}
      onPointerDown={() => { if (celebratingRef.current) nextRound(); }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: TOP_RESERVE, paddingBottom: BOTTOM_RESERVE, perspective: 1200 }}
      >
        <motion.div
          data-testid="pop-slab"
          animate={flipping && !reduce ? { rotateY: [0, 90, -90, 0] } : { rotateY: 0 }}
          transition={{ duration: FLIP_MS / 1000, ease: 'easeInOut' }}
          style={{
            position: 'relative',
            width: slabW,
            height: slabH,
            borderRadius: Math.round(cell * 0.4),
            background: 'color-mix(in srgb, var(--game-accent) 30%, white)',
            border: '1px solid var(--dor-border)',
            boxShadow: 'var(--dor-shadow-card), 0 3px 0 var(--dor-lip)',
          }}
        >
          {bubbles.map((b) => (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                left: slabPad + b.c * cell + (cell - size) / 2,
                top: slabPad + b.r * cell + (cell - size) / 2,
              }}
            >
              <Bubble
                id={b.id}
                color={b.color}
                size={size}
                popped={popped.has(b.id)}
                wobble={wobbleId === b.id}
                reduce={reduce}
                onTap={handlePop}
              />
            </div>
          ))}
        </motion.div>
      </div>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🫧" score={rounds} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="פופ-איט 🫧"
          buttonText="בואו נתחיל"
          onStart={() => setShowInstructions(false)}
        >
          <p style={{ marginBottom: 12 }}>👆 <strong>לוחצים על הבועות</strong> כדי לפוצץ אותן.</p>
          <p style={{ marginBottom: 12 }}>✨ מפוצצים את כולן והלוח מתהפך!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={celebrating}
        successText="פוצצת את הכול! 🎉"
        subtitle={rounds === 1 ? 'לוח אחד! 🫧' : `${rounds} לוחות! 🫧`}
        photo={photo}
        numberOfPieces={180}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default PopItGame;
