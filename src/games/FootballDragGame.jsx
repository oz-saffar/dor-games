import { useState, useEffect, useRef, useCallback } from 'react';
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
  [GAME_DIFFICULTY.EASY]:   { goalWidth: 200, goalSpeed: 1,   ballSize: 80 },
  [GAME_DIFFICULTY.MEDIUM]: { goalWidth: 140, goalSpeed: 2,   ballSize: 60 },
  [GAME_DIFFICULTY.HARD]:   { goalWidth: 90,  goalSpeed: 3.5, ballSize: 45 },
};

const GOAL_HEIGHT = 70;
const ACCENT = '#15803d';

const FootballDragGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const isLandscape = useIsLandscape();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();
  const cfg = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG[GAME_DIFFICULTY.EASY];

  const [score, setScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);

  // Ball state
  const [ballPos, setBallPos] = useState({ x: 0, y: 0 });
  const [ballVisible, setBallVisible] = useState(true);

  // Goal oscillation state (x position of goal left edge)
  const [goalX, setGoalX] = useState(0);
  const goalDirRef = useRef(1);
  const goalXRef = useRef(0);

  // Miss indicator
  const [showMiss, setShowMiss] = useState(false);

  // Drag state (all in refs for perf during drag)
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragCurrent = useRef({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const ballSizeRef = useRef(cfg.ballSize);
  ballSizeRef.current = cfg.ballSize;

  // Place ball in centre-ish area
  const resetBall = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setBallPos({
      x: w / 2 - cfg.ballSize / 2,
      y: h * 0.78,
    });
    setDragOffset({ x: 0, y: 0 });
    setBallVisible(true);
    dragging.current = false;
  }, [cfg.ballSize]);

  // Initialise ball position on mount / difficulty change
  useEffect(() => {
    resetBall();
  }, [resetBall]);

  // Initialise goal to centre
  useEffect(() => {
    const x = window.innerWidth / 2 - cfg.goalWidth / 2;
    setGoalX(x);
    goalXRef.current = x;
  }, [cfg.goalWidth]);

  // Animate goal left-right
  useEffect(() => {
    if (showInstructions) return;
    const id = setInterval(() => {
      const w = window.innerWidth;
      const minX = 10;
      const maxX = w - cfg.goalWidth - 10;
      let nx = goalXRef.current + goalDirRef.current * cfg.goalSpeed;
      if (nx <= minX) { nx = minX; goalDirRef.current = 1; }
      if (nx >= maxX) { nx = maxX; goalDirRef.current = -1; }
      goalXRef.current = nx;
      setGoalX(nx);
    }, 16);
    return () => clearInterval(id);
  }, [showInstructions, cfg.goalWidth, cfg.goalSpeed]);

  // ESC to exit
  useEffect(() => {
    const handler = (e) => { if (e.code === 'Escape') onExit(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onExit]);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const startDrag = useCallback((clientX, clientY) => {
    dragging.current = true;
    dragStart.current = { x: clientX, y: clientY };
    dragCurrent.current = { x: clientX, y: clientY };
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const moveDrag = useCallback((clientX, clientY) => {
    if (!dragging.current) return;
    dragCurrent.current = { x: clientX, y: clientY };
    setDragOffset({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y,
    });
  }, []);

  const endDrag = useCallback((currentScore) => {
    if (!dragging.current) return;
    dragging.current = false;

    const dx = dragCurrent.current.x - dragStart.current.x;
    const dy = dragCurrent.current.y - dragStart.current.y;

    // Require meaningful drag (> 20px total distance)
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) {
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    // Compute where the ball lands after flick
    // We project the drag vector: ball flies in the same direction
    const scale = 3;
    const landX = ballPos.x + dx * scale + ballSizeRef.current / 2;
    const landY = ballPos.y + dy * scale;

    // Goal row sits at ~28% from top (below back button + score badge)
    const goalTop = window.innerHeight * 0.28 - GOAL_HEIGHT;
    const goalBottom = goalTop + GOAL_HEIGHT * 1.5;
    const gLeft = goalXRef.current;
    const gRight = gLeft + cfg.goalWidth;

    const inGoal =
      landX >= gLeft &&
      landX <= gRight &&
      landY <= goalBottom;

    if (inGoal) {
      // GOAL!
      const newScore = currentScore + 1;
      setScore(newScore);
      setBallVisible(false);
      soundManager?.playCorrect();
      if (newScore % 5 === 0) {
        soundManager?.playWin();
        if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          setCelebrationPhoto(null);
          resetBall();
        }, 3000);
      } else {
        setTimeout(() => resetBall(), 600);
      }
    } else {
      // Miss
      soundManager?.playEncouragement?.();
      setShowMiss(true);
      setDragOffset({ x: 0, y: 0 });
      setTimeout(() => setShowMiss(false), 1200);
    }
  }, [ballPos, cfg.goalWidth, soundManager, hasPhotos, getRandomPhoto, resetBall]);

  // Touch events
  const onTouchStart = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  };
  const onTouchEnd = (e) => {
    e.preventDefault();
    endDrag(score);
  };

  // Mouse events
  const onMouseDown = (e) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };
  const onMouseMove = useCallback((e) => moveDrag(e.clientX, e.clientY), [moveDrag]);
  const onMouseUp = useCallback(() => endDrag(score), [endDrag, score]);

  useEffect(() => {
    if (!dragging.current) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  // ── Derived geometry ──────────────────────────────────────────────────────
  const goalTop = window.innerHeight * 0.28 - GOAL_HEIGHT;

  return (
    <div
      className="relative h-[100dvh] min-h-[100vh] w-screen overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, #14532d 0%, #166534 30%, #15803d 65%, #4ade80 100%)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="⚽" score={score} accentColor={ACCENT} />

      {/* Pitch line */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: 5,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.25)',
          pointerEvents: 'none',
        }}
      />

      {/* Goal */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: goalTop,
          left: goalX,
          width: cfg.goalWidth,
          height: GOAL_HEIGHT,
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {/* Net background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 2px, transparent 2px, transparent 14px),' +
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 2px, transparent 2px, transparent 14px)',
            borderRadius: '4px 4px 0 0',
          }}
        />
        {/* Frame */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '4px solid #f5f5f0',
            borderBottom: 'none',
            borderRadius: '6px 6px 0 0',
            boxShadow: '0 0 12px rgba(255,255,255,0.5)',
          }}
        />
        {/* Crossbar label */}
        <div
          style={{
            position: 'absolute',
            top: -28,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          🥅
        </div>
      </div>

      {/* Ball */}
      {ballVisible && (
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          aria-label="drag ball to goal"
          role="button"
          tabIndex={0}
          style={{
            position: 'absolute',
            left: ballPos.x + dragOffset.x,
            top: ballPos.y + dragOffset.y,
            width: cfg.ballSize,
            height: cfg.ballSize,
            fontSize: cfg.ballSize * 0.85,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: dragging.current ? 'grabbing' : 'grab',
            zIndex: 20,
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',
            transition: dragging.current ? 'none' : 'transform 0.15s',
            transform: dragging.current ? 'scale(1.1)' : 'scale(1)',
            touchAction: 'none',
            WebkitTouchCallout: 'none',
          }}
        >
          ⚽
        </div>
      )}

      {/* Drag hint arrow (only when not dragging, before first goal) */}
      {!dragging.current && ballVisible && score === 0 && !showInstructions && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: ballPos.x + cfg.ballSize / 2 - 16,
            top: ballPos.y - 40,
            fontSize: 28,
            pointerEvents: 'none',
            animation: 'dorBounce 1s ease-in-out infinite',
          }}
        >
          👆
        </div>
      )}

      {/* Miss indicator */}
      {showMiss && (
        <div
          aria-live="polite"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: isLandscape ? 48 : 56,
            fontWeight: 900,
            color: '#fde68a',
            textShadow: '0 4px 16px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 30,
            animation: 'dorFadeOut 1.2s ease forwards',
          }}
        >
          🌟 כמעט!
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes dorBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes dorFadeOut {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -60%) scale(1.1); }
        }
      `}</style>

      {showInstructions && (
        <GameInstructionsOverlay
          title="כדורגל גרירה! 🥅"
          buttonText="בוא נשחק! ⚽"
          onStart={() => setShowInstructions(false)}
          accentColor={ACCENT}
        >
          <p style={{ marginBottom: '12px' }}>⚽ <strong>גרור את הכדור לשער</strong></p>
          <p style={{ marginBottom: '12px' }}>🥅 <strong>השער זז</strong> — תכוון טוב!</p>
          <p style={{ marginBottom: '12px' }}>🎉 <strong>כל 5 שערים</strong> — ניצחון!</p>
          <p>🏠 <strong>חזרה</strong> — כפתור אדום למעלה</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="גוול! ⚽🥅"
        subtitle={`${score} שערים! 🎉`}
        photo={celebrationPhoto}
        accentColor={ACCENT}
        numberOfPieces={220}
      />
    </div>
  );
};

export default FootballDragGame;
