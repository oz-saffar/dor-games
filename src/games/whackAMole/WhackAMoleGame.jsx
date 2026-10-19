import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useViewport } from '../../hooks/useViewport';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import {
  GameBackButton, GameScoreBadge, GameInstructionsOverlay, GameCelebrationOverlay,
} from '../../components/game';
import {
  BOTTOM_RESERVE, BUNNY_WAVE_MS, CELEBRATION_MS, FIRST_SPAWN_MS, TICKLED_MS, TICKLES_PER_CELEBRATION,
  TOP_RESERVE, cellSizeFor, gridFor, levelFor,
} from './whackConfig';
import { createWhackSfx } from './whackAudio';
import Hole from './Hole';

const WhackAMoleGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width, height, isTablet, isLandscape } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const level = useMemo(() => levelFor(difficulty), [difficulty]);
  const { cols, rows } = useMemo(() => gridFor(difficulty, isLandscape), [difficulty, isLandscape]);

  const [showInstructions, setShowInstructions] = useState(true);
  const [score, setScore] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [holes, setHoles] = useState(() => Array(level.holes).fill(null));

  const holesRef = useRef(holes);
  const clockRef = useRef(0);
  const scoreRef = useRef(0);
  const timersRef = useRef([]);
  const [sfx] = useState(createWhackSfx);

  const publish = useCallback((next) => {
    holesRef.current = next;
    setHoles(next);
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

  // ── spawn / duck loop (paused while an overlay is up) ───────────────────
  const running = !showInstructions && !celebrating;
  useEffect(() => {
    if (!running) return undefined;
    let raf = 0;
    let nextSpawn = null;
    publish(Array(level.holes).fill(null));

    const tick = (t) => {
      clockRef.current = t;
      if (nextSpawn === null) nextSpawn = t + FIRST_SPAWN_MS;
      let cur = holesRef.current;
      let changed = false;
      cur.forEach((c, i) => {
        if (c && t >= c.downAt) {
          if (!changed) cur = [...cur];
          cur[i] = null;
          changed = true;
        }
      });
      const upCount = cur.filter(Boolean).length;
      if (t >= nextSpawn && upCount < level.maxUp) {
        const free = cur.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
        if (free.length) {
          const i = free[Math.floor(Math.random() * free.length)];
          const bunny = Math.random() < level.bunny;
          if (!changed) cur = [...cur];
          const jitter = 0.85 + Math.random() * 0.3;
          cur[i] = {
            kind: bunny ? 'bunny' : 'mole', downAt: t + level.upMs * jitter,
            tickled: false, wave: false, hat: Math.random() < 0.3,
          };
          changed = true;
        }
        nextSpawn = t + level.gapMs * (0.7 + Math.random() * 0.6);
      }
      if (changed) publish(cur);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, level, publish]);

  // ── tapping ─────────────────────────────────────────────────────────────
  const celebrate = useCallback(() => {
    setCelebrating(true);
    soundManager?.playWin?.();
    setPhoto(hasPhotos ? getRandomPhoto() : null);
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((x) => x !== id);
      setCelebrating(false);
      setPhoto(null);
    }, CELEBRATION_MS);
    timersRef.current.push(id);
  }, [soundManager, hasPhotos, getRandomPhoto]);

  const handleTap = useCallback((i) => {
    const c = holesRef.current[i];
    if (!c || celebrating || showInstructions) return;
    const next = [...holesRef.current];
    if (c.kind === 'bunny') {
      if (c.wave) return;
      next[i] = { ...c, wave: true, downAt: Math.max(c.downAt, clockRef.current + BUNNY_WAVE_MS) };
      publish(next);
      sfx.squeak();
      return;
    }
    if (c.tickled) return;
    next[i] = { ...c, tickled: true, downAt: clockRef.current + TICKLED_MS };
    publish(next);
    sfx.boop();
    try { navigator.vibrate?.(10); } catch { /* no haptics */ }
    scoreRef.current += 1;
    setScore(scoreRef.current);
    if (scoreRef.current % TICKLES_PER_CELEBRATION === 0) celebrate();
  }, [celebrating, showInstructions, publish, sfx, celebrate]);

  // ── render ──────────────────────────────────────────────────────────────
  const cell = cellSizeFor(width, height, cols, rows, isTablet);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'var(--game-surface)', touchAction: 'none', userSelect: 'none' }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: TOP_RESERVE, paddingBottom: BOTTOM_RESERVE }}
      >
        <div
          dir="ltr"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
            gridAutoRows: `${cell}px`,
          }}
        >
          {holes.map((critter, i) => (
            <Hole key={i} index={i} size={cell} critter={critter} reduce={reduce} onTap={handleTap} />
          ))}
        </div>
      </div>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🐹" score={score} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="הכה בחפרפרת 🐹"
          buttonText="בואו נתחיל"
          onStart={() => setShowInstructions(false)}
        >
          <p style={{ marginBottom: 12 }}>👆 <strong>לוחצים על החפרפרת</strong> כשהיא מציצה מהחור.</p>
          <p style={{ marginBottom: 12 }}>😆 מדגדגים אותה והיא צוחקת! הארנב רק אומר שלום 🐰</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={celebrating}
        successText="דגדגת המון! 🎉"
        subtitle={`${score} 🐹`}
        photo={photo}
        numberOfPieces={180}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default WhackAMoleGame;
