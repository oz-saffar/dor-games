import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Confetti from 'react-confetti';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { GAME_DIFFICULTY } from '../lib/gameDifficulties';

const RHYTHM_ACCENT = '#4338ca';

const PADS = [
  { id: 0, color: '#EF4444', glow: '#FCA5A5', tone: 262, label: 'אדום' },
  { id: 1, color: '#22C55E', glow: '#86EFAC', tone: 330, label: 'ירוק' },
  { id: 2, color: '#3B82F6', glow: '#93C5FD', tone: 392, label: 'כחול' },
  { id: 3, color: '#F59E0B', glow: '#FCD34D', tone: 523, label: 'צהוב' },
];

const DIFFICULTY_CONFIG = {
  [GAME_DIFFICULTY.EASY]: { playbackMs: 760, gapMs: 260, maxScore: 5 },
  [GAME_DIFFICULTY.MEDIUM]: { playbackMs: 760, gapMs: 260, maxScore: 10 },
  [GAME_DIFFICULTY.HARD]: { playbackMs: 760, gapMs: 260, maxScore: null },
  [GAME_DIFFICULTY.ENDLESS]: { playbackMs: 760, gapMs: 260, maxScore: null },
};
const FAIL_REPLAY_DELAY_MS = 900;
const INITIAL_STRIKE_DELAY_MS = 900;
const NEXT_STRIKE_DELAY_MS = 1650;

const randomPadId = () => Math.floor(Math.random() * PADS.length);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const RhythmTapGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const reduceMotion = useReducedMotion();
  const audioContextRef = useRef(null);
  const playTokenRef = useRef(0);
  const activePadTimerRef = useRef(null);
  const roundStartTimerRef = useRef(null);
  const initialStartTimerRef = useRef(null);
  const levelEndTimerRef = useRef(null);
  const sequenceRef = useRef([]);
  const playerIndexRef = useRef(0);
  const acceptingInputRef = useRef(false);

  const [showInstructions, setShowInstructions] = useState(true);
  const [score, setScore] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [activePad, setActivePad] = useState(null);
  const [isPlayback, setIsPlayback] = useState(false);
  const [isTransitioningRound, setIsTransitioningRound] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showStrikeFireworks, setShowStrikeFireworks] = useState(false);

  const config = useMemo(
    () => DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG[GAME_DIFFICULTY.EASY],
    [difficulty]
  );

  const playPadTone = (padId, duration = 220) => {
    const pad = PADS.find((item) => item.id === padId);
    if (!pad) return;

    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioContextRef.current = new Ctx();
    }

    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.frequency.value = pad.tone;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration / 1000);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
  };

  const flashPad = useCallback((padId, duration = 120) => {
    if (activePadTimerRef.current) {
      clearTimeout(activePadTimerRef.current);
      activePadTimerRef.current = null;
    }
    setActivePad(padId);
    activePadTimerRef.current = setTimeout(() => {
      setActivePad(null);
      activePadTimerRef.current = null;
    }, duration);
  }, []);

  const playbackSequence = useCallback(async (nextSequence) => {
    const token = ++playTokenRef.current;
    setIsPlayback(true);
    setIsTransitioningRound(false);
    playerIndexRef.current = 0;
    acceptingInputRef.current = false;
    if (activePadTimerRef.current) {
      clearTimeout(activePadTimerRef.current);
      activePadTimerRef.current = null;
    }
    setActivePad(null);

    for (const padId of nextSequence) {
      if (token !== playTokenRef.current) return;
      setActivePad(padId);
      playPadTone(padId, Math.max(180, config.playbackMs - 120));
      await wait(config.playbackMs);
      setActivePad(null);
      await wait(config.gapMs);
    }

    if (token === playTokenRef.current) {
      setIsPlayback(false);
      acceptingInputRef.current = true;
    }
  }, [config.gapMs, config.playbackMs]);

  const startRoundWithDelay = useCallback(
    (nextSequence, delayMs = 280, { celebrate = false } = {}) => {
      playTokenRef.current += 1;
      setIsPlayback(false);
      setIsTransitioningRound(true);
      setShowStrikeFireworks(celebrate);
      acceptingInputRef.current = false;
      playerIndexRef.current = 0;

      if (roundStartTimerRef.current) {
        clearTimeout(roundStartTimerRef.current);
      }

      roundStartTimerRef.current = setTimeout(() => {
        roundStartTimerRef.current = null;
        sequenceRef.current = nextSequence;
        setSequence(nextSequence);
        setShowStrikeFireworks(false);
        playbackSequence(nextSequence);
      }, delayMs);
    },
    [playbackSequence]
  );

  const buildInitialSequence = useCallback(() => {
    const initial = [randomPadId()];
    sequenceRef.current = initial;
    playerIndexRef.current = 0;
    acceptingInputRef.current = false;
    startRoundWithDelay(initial, 300);
  }, [startRoundWithDelay]);

  useEffect(() => {
    if (showInstructions) return;
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        audioContextRef.current = new Ctx();
      }
    }
    audioContextRef.current?.resume?.().catch(() => {});
    if (initialStartTimerRef.current) {
      clearTimeout(initialStartTimerRef.current);
    }
    initialStartTimerRef.current = setTimeout(() => {
      initialStartTimerRef.current = null;
      buildInitialSequence();
    }, INITIAL_STRIKE_DELAY_MS);
  }, [showInstructions, buildInitialSequence]);

  useEffect(
    () => () => {
      playTokenRef.current += 1;
      if (activePadTimerRef.current) {
        clearTimeout(activePadTimerRef.current);
      }
      if (roundStartTimerRef.current) {
        clearTimeout(roundStartTimerRef.current);
      }
      if (initialStartTimerRef.current) {
        clearTimeout(initialStartTimerRef.current);
      }
      if (levelEndTimerRef.current) {
        clearTimeout(levelEndTimerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    },
    []
  );

  const handlePadTap = useCallback((padId) => {
    if (
      showInstructions ||
      isPlayback ||
      isTransitioningRound ||
      sequenceRef.current.length === 0 ||
      !acceptingInputRef.current
    ) {
      return;
    }

    flashPad(padId, config.playbackMs);
    playPadTone(padId, Math.max(180, config.playbackMs - 120));

    const expectedPadId = sequenceRef.current[playerIndexRef.current];
    if (expectedPadId !== padId) {
      soundManager?.playEncouragement();
      setIsTransitioningRound(true);
      acceptingInputRef.current = false;
      playerIndexRef.current = 0;
      setShowStrikeFireworks(false);
      startRoundWithDelay([...sequenceRef.current], FAIL_REPLAY_DELAY_MS);
      return;
    }

    const nextIndex = playerIndexRef.current + 1;
    playerIndexRef.current = nextIndex;
    if (nextIndex < sequenceRef.current.length) {
      return;
    }

    const nextScore = score + 1;
    setScore(nextScore);
    setIsTransitioningRound(true);
    acceptingInputRef.current = false;

    if (config.maxScore && nextScore >= config.maxScore) {
      setShowStrikeFireworks(false);
      setShowLevelComplete(true);
      soundManager?.playWin();
      if (levelEndTimerRef.current) {
        clearTimeout(levelEndTimerRef.current);
      }
      levelEndTimerRef.current = setTimeout(() => {
        setShowLevelComplete(false);
        setScore(0);
        buildInitialSequence();
      }, 2000);
      return;
    }

    // Classic Simon behavior: always add exactly one step after every success.
    const nextSequence = [...sequenceRef.current, randomPadId()];
    sequenceRef.current = nextSequence;
    playerIndexRef.current = 0;
    startRoundWithDelay(nextSequence, NEXT_STRIKE_DELAY_MS, { celebrate: true });
  }, [
    buildInitialSequence,
    config.maxScore,
    flashPad,
    isPlayback,
    isTransitioningRound,
    score,
    showInstructions,
    startRoundWithDelay,
    soundManager,
    config.playbackMs,
  ]);

  const handleRestartStrike = () => {
    if (!window.confirm('להתחיל רצף חדש מההתחלה?')) return;
    if (levelEndTimerRef.current) {
      clearTimeout(levelEndTimerRef.current);
      levelEndTimerRef.current = null;
    }
    setShowLevelComplete(false);
    setScore(0);
    setShowStrikeFireworks(false);
    buildInitialSequence();
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '-webkit-fill-available',
        background: 'radial-gradient(circle at top, #312E81 0%, #111827 65%)',
        position: 'fixed',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {showStrikeFireworks && !reduceMotion && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle
          numberOfPieces={220}
          gravity={0.22}
          tweenDuration={100}
        />
      )}

      <GameBackButton onExit={onExit} />

      <button
        onClick={handleRestartStrike}
        style={{
          position: 'fixed',
          top: 'calc(12px + env(safe-area-inset-top))',
          left: '50%',
          transform: 'translateX(-50%)',
          border: 'none',
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.9)',
          color: '#312E81',
          minHeight: 34,
          padding: '6px 12px',
          fontSize: 14,
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        התחלה מחדש
      </button>

      <GameScoreBadge icon="⭐" score={score} accentColor={RHYTHM_ACCENT} />

      {!showInstructions && (
        <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: 'clamp(30px, 6vw, 44px)', fontFamily: 'var(--font-display)', fontWeight: 400, textAlign: 'center', textShadow: '0 2px 14px rgba(0,0,0,0.35)' }}>
            סיימון
          </h2>
          <p style={{ margin: 0, color: '#C7D2FE', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
            {isPlayback ? 'תקשיבו ותסתכלו...' : `התור שלכם! זכרו ${sequence.length || 1} צעדים`}
          </p>

          <button
            onClick={() => playbackSequence(sequence)}
            disabled={isPlayback || isTransitioningRound || sequence.length === 0}
            aria-label="הפעל שוב את הרצף"
            title="השמע שוב"
            style={{
              border: 'none',
              borderRadius: '50%',
              backgroundColor: isPlayback || isTransitioningRound ? '#6366F180' : 'white',
              color: isPlayback || isTransitioningRound ? 'white' : '#312E81',
              minHeight: 52,
              minWidth: 52,
              width: 52,
              height: 52,
              padding: 0,
              fontSize: 26,
              fontWeight: 'bold',
              cursor: isPlayback || isTransitioningRound ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
            }}
          >
            🔁
          </button>

          <div
            style={{
              width: 'min(90vw, 420px)',
              aspectRatio: '1 / 1',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}
          >
            {PADS.map((pad) => {
              const isActive = activePad === pad.id;
              return (
                <button
                  key={pad.id}
                  onPointerDown={() => handlePadTap(pad.id)}
                  style={{
                    border: 'none',
                    borderRadius: 28,
                    backgroundColor: pad.color,
                    boxShadow: isActive
                      ? `0 0 0 8px ${pad.glow}, 0 12px 26px rgba(0,0,0,0.3)`
                      : '0 10px 22px rgba(0,0,0,0.35)',
                    transform: isActive ? 'scale(1.04)' : 'scale(1)',
                    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                    cursor: isPlayback ? 'default' : 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  disabled={isPlayback || isTransitioningRound}
                  aria-label={pad.label}
                />
              );
            })}
          </div>
        </div>
      )}

      <GameCelebrationOverlay
        show={showLevelComplete}
        successText="כל הכבוד! 🎉"
        accentColor="#15803d"
        numberOfPieces={reduceMotion ? 0 : 180}
      />

      {showInstructions && (
        <GameInstructionsOverlay
          title="סיימון! 🎵"
          buttonText="בוא נשחק! 🎵"
          onStart={() => setShowInstructions(false)}
          accentColor={RHYTHM_ACCENT}
        >
          <p>🎶 המשחק משמיע רצף צבעים</p>
          <p>👆 מקישים באותו סדר בדיוק</p>
          <p>⭐ סיבוב נכון מוסיף נקודה ורצף חדש</p>
        </GameInstructionsOverlay>
      )}

    </div>
  );
};

export default RhythmTapGame;
