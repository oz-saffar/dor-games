import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useViewport } from '../../hooks/useViewport';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../../components/game';
import { PICTURES, dotCountFor, dotsFor } from './pictures';
import { createDotSfx } from './dotAudio';
import DotBoard from './DotBoard';
import { HIT_PX, PAD, VB } from './layout';

const CHROME_SIDE = 110; // back button / score badge sit in the top corners
const CHROME_TOP = 92;
const EDGE = 12;
const IDLE_MS = 6000;
const LINE_MS = 450;
const CELEBRATION_MS = 2500;

const DotToDotGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width, height } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [showInstructions, setShowInstructions] = useState(true);
  const [rounds, setRounds] = useState(0);
  const [picIndex, setPicIndex] = useState(() => Math.floor(Math.random() * PICTURES.length));
  const [k, setK] = useState(0);
  const [complete, setComplete] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [wobbleId, setWobbleId] = useState(null);
  const [hint, setHint] = useState(false);
  const [photo, setPhoto] = useState(null);

  const picture = PICTURES[picIndex % PICTURES.length];
  const n = dotCountFor(difficulty);
  const dots = useMemo(() => dotsFor(picture, n), [picture, n]);

  const kRef = useRef(0);
  const lockedRef = useRef(false);
  const pressedRef = useRef(false);
  const svgRef = useRef(null);
  const timersRef = useRef([]);
  const [sfx] = useState(createDotSfx);

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

  // ── idle nudge: the next dot bounces harder after a quiet spell ──────────
  useEffect(() => {
    setHint(false);
    if (showInstructions || complete) return undefined;
    const id = setTimeout(() => setHint(true), IDLE_MS);
    return () => clearTimeout(id);
  }, [k, picIndex, showInstructions, complete]);

  // ── connecting ───────────────────────────────────────────────────────────
  const connect = useCallback((num) => {
    if (lockedRef.current || num !== kRef.current + 1) return false;
    kRef.current = num;
    setK(num);
    sfx.note(num - 1);
    sfx.speak(num);
    try { navigator.vibrate?.(10); } catch { /* no haptics */ }
    if (num === n) {
      lockedRef.current = true;
      schedule(() => {
        setComplete(true);
        setCelebrating(true);
        setPhoto(hasPhotos ? getRandomPhoto() : null);
        setRounds((r) => r + 1);
        soundManager?.playWin?.();
        schedule(() => {
          setCelebrating(false);
          setPhoto(null);
          setComplete(false);
          kRef.current = 0;
          setK(0);
          setPicIndex((i) => (i + 1) % PICTURES.length);
          lockedRef.current = false;
        }, CELEBRATION_MS);
      }, reduce ? 0 : LINE_MS);
    }
    return true;
  }, [n, reduce, schedule, sfx, soundManager, hasPhotos, getRandomPhoto]);

  // Hit-test once on the board: the NEXT dot wins if the pointer is within its radius,
  // even when another dot overlaps it.
  const nextHit = useCallback((e) => {
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    if (!rect || !rect.width || !Number.isFinite(e.clientX)) return null;
    // The SVG letterboxes its square viewBox (wider than tall in landscape), so the
    // scale is set by the shorter side and the content is centred along the longer one.
    const scale = Math.min(rect.width, rect.height || rect.width) / VB;
    const ox = rect.left + (rect.width - VB * scale) / 2;
    const oy = rect.top + ((rect.height || rect.width) - VB * scale) / 2;
    const px = (e.clientX - ox) / scale - PAD;
    const py = (e.clientY - oy) / scale - PAD;
    const next = dots[kRef.current];
    if (!next) return undefined;
    // A child taps the big number as often as the dot itself: anything inside the
    // next dot's group counts.
    const touched = e.target?.closest?.('[data-dot]');
    if (touched && Number(touched.dataset.dot) === next.n) return next.n;
    // On the iPad the board is ~800px, so a fixed 28px ring would shrink relative to
    // the dots; take the larger of 28px and ~6 board units.
    const radius = Math.max(HIT_PX / scale, 6);
    if (Math.hypot(px - next.x, py - next.y) <= radius) return next.n;
    return undefined;
  }, [dots]);

  const handleDown = useCallback((e) => {
    if (lockedRef.current || showInstructions) return;
    pressedRef.current = true;
    const hit = nextHit(e);
    if (hit && connect(hit)) return;
    // No usable coordinates (or a miss): fall back to the dot element that was touched.
    const num = Number(e.target?.closest?.('[data-dot]')?.dataset.dot);
    if (!num) return;
    if (hit === null && connect(num)) return;
    if (num > kRef.current) {
      setWobbleId(num);
      schedule(() => setWobbleId((cur) => (cur === num ? null : cur)), 350);
    }
  }, [connect, nextHit, schedule, showInstructions]);

  const handleMove = useCallback((e) => {
    if (!pressedRef.current || lockedRef.current) return;
    const hit = nextHit(e);
    if (hit) connect(hit);
  }, [connect, nextHit]);

  const handleRelease = useCallback(() => { pressedRef.current = false; }, []);

  useEffect(() => {
    window.addEventListener('pointerup', handleRelease);
    return () => window.removeEventListener('pointerup', handleRelease);
  }, [handleRelease]);

  // As big as fits. In landscape the corner chrome sits beside the square, not over it.
  const fullSize = Math.min(width, height - EDGE * 2);
  const size = Math.max(160, (width - fullSize) / 2 >= CHROME_SIDE
    ? fullSize
    : Math.min(width, height - CHROME_TOP - EDGE));

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      data-picture={picture.id}
      style={{ background: 'var(--game-surface)', touchAction: 'none', userSelect: 'none' }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: size === fullSize ? EDGE : CHROME_TOP, paddingBottom: EDGE }}
      >
        <DotBoard
          svgRef={svgRef}
          picture={picture}
          dots={dots}
          k={k}
          complete={complete}
          size={size}
          hint={hint}
          wobbleId={wobbleId}
          reduce={reduce}
          onDown={handleDown}
          onMove={handleMove}
          onRelease={handleRelease}
        />
      </div>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🔢" score={rounds} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="מחברים נקודות 🔢"
          buttonText="בואו נתחיל"
          onStart={() => setShowInstructions(false)}
        >
          <p style={{ marginBottom: 12 }}>👆 <strong>לוחצים על המספר הבא</strong> לפי הסדר: 1, 2, 3…</p>
          <p style={{ marginBottom: 12 }}>✨ מחברים הכול וחושפים תמונה!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={celebrating}
        successText={`${picture.title}! ${picture.emoji}`}
        subtitle={rounds === 1 ? 'תמונה אחת! 🔢' : `${rounds} תמונות! 🔢`}
        photo={photo}
        numberOfPieces={180}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default DotToDotGame;
