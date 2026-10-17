import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useViewport } from '../../hooks/useViewport';
import { PLAY_COLORS } from '../../lib/palette';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import {
  GameBackButton, GameScoreBadge, GameInstructionsOverlay, GameCelebrationOverlay,
} from '../../components/game';
import { BAR_COUNT, BAR_COLOR_KEYS, SONGS, notesFor } from './songs';
import { createXyloSynth } from './xylophoneAudio';
import XyloBar from './XyloBar';

const TOP_RESERVE = 76;
const BOTTOM_RESERVE = 120;
export const CELEBRATION_MS = 4000;

const XylophoneGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width, height, isLandscape, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [showInstructions, setShowInstructions] = useState(true);
  const [playAlong, setPlayAlong] = useState(false);
  const [pos, setPos] = useState(0);
  const [songIdx, setSongIdx] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [dipped, setDipped] = useState({});
  const [floaters, setFloaters] = useState([]);

  const seq = useMemo(() => notesFor(SONGS[songIdx], difficulty), [songIdx, difficulty]);
  const seqRef = useRef(seq);
  useEffect(() => { seqRef.current = seq; }, [seq]);
  const posRef = useRef(0);
  const playAlongRef = useRef(false);
  const celebratingRef = useRef(false);
  const lastBarRef = useRef(new Map());
  const timersRef = useRef([]);
  const idRef = useRef(0);
  const [synth] = useState(createXyloSynth);

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
    const up = (e) => lastBarRef.current.delete(e.pointerId);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    synth.close();
  }, [synth]);

  const finishSong = useCallback(() => {
    celebratingRef.current = true;
    setCelebrating(true);
    soundManager?.playWin?.();
    setPhoto(hasPhotos ? getRandomPhoto() : null);
    setRounds((n) => n + 1);
    schedule(() => {
      celebratingRef.current = false;
      setCelebrating(false);
      setPhoto(null);
      posRef.current = 0;
      setPos(0);
      setSongIdx((i) => (i + 1) % SONGS.length);
    }, CELEBRATION_MS);
  }, [soundManager, hasPhotos, getRandomPhoto, schedule]);

  const strike = useCallback((index, pointerId) => {
    synth.play(index);
    try { navigator.vibrate?.(8); } catch { /* no haptics */ }
    lastBarRef.current.set(pointerId, index);
    const id = (idRef.current += 1);
    setDipped((d) => ({ ...d, [index]: true }));
    setFloaters((f) => [...f.slice(-12), { id, bar: index }]);
    schedule(() => setDipped((d) => ({ ...d, [index]: false })), 130);
    schedule(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1000);
    if (playAlongRef.current && !celebratingRef.current && seqRef.current[posRef.current] === index) {
      posRef.current += 1;
      setPos(posRef.current);
      if (posRef.current >= seqRef.current.length) finishSong();
    }
  }, [synth, schedule, finishSong]);

  const handleDown = useCallback((index, pointerId) => {
    synth.unlock();
    strike(index, pointerId);
  }, [synth, strike]);

  const handleMove = (e) => {
    if (!lastBarRef.current.has(e.pointerId) || typeof document.elementFromPoint !== 'function') return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-bar]');
    if (!el) return;
    const idx = Number(el.dataset.bar);
    if (idx !== lastBarRef.current.get(e.pointerId)) strike(idx, e.pointerId);
  };

  const toggleMode = () => {
    const next = !playAlongRef.current;
    playAlongRef.current = next;
    posRef.current = 0;
    setPos(0);
    setPlayAlong(next);
  };

  // ── layout: size from both width and height ────────────────────────────
  const availW = width - 24;
  const availH = height - TOP_RESERVE - BOTTOM_RESERVE;
  const gap = isTablet ? 12 : 8;
  const thickness = Math.floor(((isLandscape ? availW : availH) - gap * (BAR_COUNT - 1)) / BAR_COUNT);
  const maxLen = isLandscape ? availH : availW;
  const lenAt = (i) => Math.round(maxLen * (1 - i * 0.065));
  const dots = playAlong ? seq.slice(pos, pos + 10) : [];

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'var(--game-surface)', touchAction: 'none', userSelect: 'none' }}
      onPointerMove={handleMove}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: TOP_RESERVE, paddingBottom: BOTTOM_RESERVE }}
      >
        <div
          data-testid="xylo-bars"
          style={{
            display: 'flex', direction: 'ltr', gap, alignItems: 'center', justifyContent: 'center',
            flexDirection: isLandscape ? 'row' : 'column',
          }}
        >
          {Array.from({ length: BAR_COUNT }, (_, i) => (
            <XyloBar
              key={i}
              index={i}
              color={PLAY_COLORS[BAR_COLOR_KEYS[i]]}
              length={lenAt(i)}
              thickness={thickness}
              vertical={isLandscape}
              dipped={!!dipped[i]}
              isNext={playAlong && !celebrating && seq[pos] === i}
              reduce={reduce}
              onStrike={handleDown}
              notes={floaters.filter((f) => f.bar === i).map((f) => f.id)}
            />
          ))}
        </div>
      </div>

      <div
        className="absolute left-0 right-0 flex flex-col items-center justify-center"
        style={{ bottom: 12, gap: 8, height: BOTTOM_RESERVE - 12 }}
      >
        {playAlong && (
          <div data-testid="song-dots" style={{ display: 'flex', gap: 6, direction: 'ltr' }}>
            {dots.map((n, k) => (
              <span
                key={pos + k}
                style={{
                  width: k === 0 ? 26 : 18,
                  height: k === 0 ? 26 : 18,
                  borderRadius: '50%',
                  background: PLAY_COLORS[BAR_COLOR_KEYS[n]],
                  opacity: k === 0 ? 1 : 0.7,
                  border: k === 0 ? '3px solid var(--dor-ink)' : '1px solid var(--dor-border)',
                }}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          data-mode-toggle
          data-tap-target
          aria-pressed={playAlong}
          onPointerDown={toggleMode}
          onClick={(e) => { if (e.detail === 0) toggleMode(); }}
          style={{
            minWidth: 150,
            height: 56,
            padding: '0 22px',
            borderRadius: 28,
            fontSize: 22,
            fontWeight: 600,
            color: playAlong ? '#fff' : 'var(--dor-ink)',
            background: playAlong ? 'var(--game-accent)' : 'var(--dor-card, #fff)',
            border: '1px solid var(--dor-border)',
            boxShadow: 'var(--dor-shadow-card), 0 3px 0 var(--dor-lip)',
          }}
        >
          🎵 {playAlong ? SONGS[songIdx].title : 'לנגן שיר'}
        </button>
      </div>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🎵" score={rounds} />

      {showInstructions && (
        <GameInstructionsOverlay title="קסילופון 🎶" buttonText="בואו נתחיל" onStart={() => setShowInstructions(false)}>
          <p style={{ marginBottom: 12 }}>👆 <strong>לוחצים על הקלידים</strong> ושומעים צלילים.</p>
          <p style={{ marginBottom: 12 }}>👉 מחליקים עם האצבע על כמה קלידים ברצף!</p>
          <p style={{ marginBottom: 12 }}>🎵 לוחצים על הכפתור ומנגנים שיר: הקליד שזוהר הוא הבא.</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={celebrating}
        successText="ניגנת שיר שלם! 🎉"
        subtitle={rounds === 1 ? 'שיר אחד! 🎵' : `${rounds} שירים! 🎵`}
        photo={photo}
        numberOfPieces={180}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default XylophoneGame;
