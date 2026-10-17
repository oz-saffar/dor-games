import { useCallback, useEffect, useRef, useState } from 'react';
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
import Picture from './Picture';
import { generateRound } from './sceneBuilder';
import {
  BOTTOM_RESERVE, CELEBRATION_MS, HINT_DELAY_MS, PICTURE_GAP, PICTURE_KEYFRAMES, TOP_RESERVE,
  pictureSizeFor,
} from './sceneConfig';
import { createSfx } from './spotAudio';

const freshRound = (difficulty) =>
  generateRound(Math.floor(Math.random() * 2147483646) + 1, difficulty);

const SpotDifferenceGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width, height, isLandscape, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [showInstructions, setShowInstructions] = useState(true);
  const [rounds, setRounds] = useState(0);
  const [round, setRound] = useState(() => freshRound(difficulty));
  const [found, setFound] = useState([]);
  const [hintId, setHintId] = useState(null);
  const [activity, setActivity] = useState(0);
  const [ripples, setRipples] = useState([]);
  const [celebrating, setCelebrating] = useState(false);
  const [photo, setPhoto] = useState(null);

  const roundRef = useRef(round);
  const foundRef = useRef([]);
  const celebratingRef = useRef(false);
  const timersRef = useRef([]);
  const nextTimerRef = useRef(null);
  const rippleKey = useRef(0);
  const [sfx] = useState(createSfx);

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

  // ── new round ───────────────────────────────────────────────────────────
  const nextRound = useCallback(() => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      timersRef.current = timersRef.current.filter((t) => t !== nextTimerRef.current);
      nextTimerRef.current = null;
    }
    const next = freshRound(difficulty);
    roundRef.current = next;
    foundRef.current = [];
    celebratingRef.current = false;
    setRound(next);
    setFound([]);
    setHintId(null);
    setRipples([]);
    setPhoto(null);
    setCelebrating(false);
  }, [difficulty]);

  // ── finding ─────────────────────────────────────────────────────────────
  const handleFind = useCallback((id) => {
    if (celebratingRef.current || foundRef.current.includes(id)) return;
    const { differences } = roundRef.current;
    if (!differences.some((d) => d.id === id)) return;
    foundRef.current = [...foundRef.current, id];
    setFound(foundRef.current);
    setHintId(null);
    setActivity((n) => n + 1);
    sfx.chime();
    soundManager?.playCorrect?.();

    if (foundRef.current.length >= differences.length) {
      celebratingRef.current = true;
      setCelebrating(true);
      soundManager?.playWin?.();
      setPhoto(hasPhotos ? getRandomPhoto() : null);
      setRounds((n) => n + 1);
      nextTimerRef.current = schedule(nextRound, CELEBRATION_MS);
    }
  }, [getRandomPhoto, hasPhotos, nextRound, schedule, sfx, soundManager]);

  // A miss costs nothing: just a soft ripple under the finger.
  const handleMiss = useCallback((side, pt) => {
    if (celebratingRef.current) return;
    setActivity((n) => n + 1);
    if (!pt) return;
    rippleKey.current += 1;
    const key = rippleKey.current;
    setRipples((r) => [...r, { key, side, x: pt.x, y: pt.y }]);
    schedule(() => setRipples((r) => r.filter((x) => x.key !== key)), 650);
  }, [schedule]);

  // ── hint: after a quiet spell, pulse one difference that is still hidden ─
  useEffect(() => {
    if (showInstructions || celebrating) return undefined;
    const id = setTimeout(() => {
      const left = roundRef.current.differences.filter((d) => !foundRef.current.includes(d.id));
      if (left.length) setHintId(left[Math.floor(Math.random() * left.length)].id);
    }, HINT_DELAY_MS);
    return () => clearTimeout(id);
  }, [showInstructions, celebrating, round, activity]);

  // ── render ──────────────────────────────────────────────────────────────
  const { w, h } = pictureSizeFor(width, height, isLandscape, isTablet);
  const total = round.differences.length;
  const shared = {
    differences: round.differences, found, hintId, width: w, height: h, reduce, ripples,
    onFind: handleFind, onMiss: handleMiss,
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'var(--game-surface)', touchAction: 'none', userSelect: 'none' }}
      onPointerDown={() => { if (celebratingRef.current) nextRound(); }}
    >
      <style>{PICTURE_KEYFRAMES}</style>

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          paddingTop: TOP_RESERVE,
          paddingBottom: BOTTOM_RESERVE,
          gap: PICTURE_GAP,
          flexDirection: isLandscape ? 'row' : 'column',
        }}
      >
        <Picture {...shared} scene={round.scene} side="a" label="תמונה ראשונה" />
        <Picture {...shared} scene={round.altered} side="b" label="תמונה שנייה" />
      </div>

      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{ top: 22, gap: 8, pointerEvents: 'none' }}
        aria-label={`${found.length} מתוך ${total}`}
      >
        {round.differences.map((d) => {
          const done = found.includes(d.id);
          return (
            <span
              key={d.id}
              data-progress-dot={done ? 'full' : 'empty'}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: '3px solid var(--game-accent)',
                background: done ? 'var(--game-accent)' : 'transparent',
                boxShadow: done ? '0 2px 0 var(--dor-lip)' : 'none',
                transition: reduce ? 'none' : 'background 0.25s, transform 0.25s',
                transform: done ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          );
        })}
      </div>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🔍" score={rounds} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="מצא את ההבדלים 🔍"
          buttonText="בואו נתחיל"
          onStart={() => setShowInstructions(false)}
        >
          <p style={{ marginBottom: 12 }}>👀 שתי תמונות כמעט אותו דבר.</p>
          <p style={{ marginBottom: 12 }}>👆 <strong>לוחצים על מה ששונה</strong> ומקיפים אותו בעיגול.</p>
          <p style={{ marginBottom: 12 }}>⭕ ממלאים את כל העיגולים למעלה!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={celebrating}
        successText="מצאתם הכול! 🎉"
        subtitle={rounds === 1 ? 'תמונה אחת! 🔍' : `${rounds} תמונות! 🔍`}
        photo={photo}
        numberOfPieces={180}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default SpotDifferenceGame;
