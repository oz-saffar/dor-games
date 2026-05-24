import { useState, useEffect, useCallback } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useIsLandscape } from '../hooks/useOrientation';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';
import { GAME_DIFFICULTY } from '../lib/gameDifficulties';

const DIFFICULTY_CONFIG = {
  [GAME_DIFFICULTY.EASY]:   { speed: 1.5, maxBalls: 4, spawnMs: 2000, minSize: 100, maxSize: 130 },
  [GAME_DIFFICULTY.MEDIUM]: { speed: 2.5, maxBalls: 6, spawnMs: 1300, minSize: 75,  maxSize: 100 },
  [GAME_DIFFICULTY.HARD]:   { speed: 3.5, maxBalls: 8, spawnMs: 800,  minSize: 55,  maxSize: 75  },
};

const FootballGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const isLandscape = useIsLandscape();
  const [balls, setBalls] = useState([]);
  const [score, setScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);

  const { getRandomPhoto, hasPhotos } = useDorPhotos();
  const cfg = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG[GAME_DIFFICULTY.EASY];

  const generateBall = useCallback(() => {
    const w = window.innerWidth;
    const size = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
    return {
      id: Date.now() + Math.random(),
      x: Math.random() * Math.max(50, w - size - 20),
      y: isLandscape ? -size - 20 : -size - 10,
      size,
      speed: cfg.speed + Math.random() * 0.8,
    };
  }, [cfg, isLandscape]);

  useEffect(() => {
    if (showInstructions) return;
    const interval = setInterval(() => {
      setBalls(prev => prev.length < cfg.maxBalls ? [...prev, generateBall()] : prev);
    }, cfg.spawnMs);
    return () => clearInterval(interval);
  }, [showInstructions, generateBall, cfg.maxBalls, cfg.spawnMs]);

  useEffect(() => {
    if (showInstructions) return;
    const interval = setInterval(() => {
      setBalls(prev =>
        prev
          .map(b => ({ ...b, y: b.y + b.speed }))
          .filter(b => b.y < window.innerHeight + 120)
      );
    }, 20);
    return () => clearInterval(interval);
  }, [showInstructions]);

  const kickBall = useCallback((id, currentScore) => {
    setBalls(prev => prev.filter(b => b.id !== id));
    const newScore = currentScore + 1;
    setScore(newScore);
    soundManager?.playCorrect();

    if (newScore % 5 === 0) {
      setShowCelebration(true);
      soundManager?.playWin();
      if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
      setTimeout(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
      }, 3000);
    }
  }, [soundManager, hasPhotos, getRandomPhoto]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onExit]);

  return (
    <div
      className="relative h-[100dvh] min-h-[100vh] w-screen overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #14532d 0%, #166534 30%, #15803d 65%, #4ade80 100%)',
      }}
    >
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="⚽" score={score} accentColor="#16a34a" />

      {/* Pitch centre circle decoration */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: 6,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.25)',
          pointerEvents: 'none',
        }}
      />

      {balls.map(ball => (
        <button
          key={ball.id}
          onClick={() => kickBall(ball.id, score)}
          aria-label="kick ball"
          style={{
            position: 'absolute',
            left: ball.x,
            top: ball.y,
            width: ball.size,
            height: ball.size,
            borderRadius: '50%',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: ball.size * 0.85,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.45))',
            transition: 'transform 0.08s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          ⚽
        </button>
      ))}

      {showInstructions && (
        <GameInstructionsOverlay
          title="כדורגל! ⚽"
          buttonText="בוא נשחק! ⚽"
          onStart={() => setShowInstructions(false)}
          accentColor="#16a34a"
        >
          <p style={{ marginBottom: '12px' }}>⚽ <strong>כדורי כדורגל נופלים!</strong></p>
          <p style={{ marginBottom: '12px' }}>👆 <strong>לחץ על הכדורים</strong> כדי לבעוט!</p>
          <p style={{ marginBottom: '12px' }}>🥅 <strong>כל 5 בעיטות</strong> — ניצחון!</p>
          <p>🏠 <strong>חזרה</strong> — כפתור אדום למעלה</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="גוול! ⚽🥅"
        subtitle={`${score} שערים! 🎉`}
        photo={celebrationPhoto}
        accentColor="#16a34a"
        numberOfPieces={200}
      />
    </div>
  );
};

export default FootballGame;
