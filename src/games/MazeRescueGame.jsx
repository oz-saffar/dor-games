import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useViewport } from '../hooks/useViewport';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';
import { GAME_DIFFICULTY } from '../lib/gameDifficulties';
import { DIFFICULTY_CONFIG, DIRECTIONS, buildMaze, inBounds } from './mazeRescue/mazeBuilder';

const MAZE_ACCENT = 'var(--game-accent)';
/** Hedge: the game accent driven down to ink so corridors read as corridors. */
const WALL_COLOR = 'color-mix(in srgb, var(--game-accent) 62%, var(--dor-ink))';

const MazeRescueGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width: vw, height: vh, isLandscape, isTablet } = useViewport();
  const audioContextRef = useRef(null);
  const wallHitTimerRef = useRef(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [score, setScore] = useState(0);
  const [maze, setMaze] = useState([]);
  const [position, setPosition] = useState({ row: 0, col: 0 });
  const [isWallHit, setIsWallHit] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const config = useMemo(
    () => DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG[GAME_DIFFICULTY.EASY],
    [difficulty]
  );
  // Landscape puts the pad beside the maze instead of under it, which is what
  // gives the iPad its big cells; portrait keeps the pad pinned to the bottom.
  const padBeside = isLandscape;
  const padWidth = isTablet ? 300 : 210;
  const padFont = isTablet ? 36 : 28;
  const padButtonStyle = {
    backgroundColor: 'var(--dor-panel-elevated)',
    border: '1px solid var(--dor-border-strong)',
    borderRadius: 'var(--dor-radius-md)',
    minHeight: isTablet ? 88 : 66,
    aspectRatio: '1',
    fontSize: isTablet ? 44 : 34,
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: 'var(--dor-shadow-card)',
    touchAction: 'manipulation',
  };

  /** Largest square cell that fits the space left over once chrome is placed. */
  const cellSize = useMemo(() => {
    const chromeW = padBeside ? padWidth + 72 : 48;
    const chromeH = padBeside ? 128 : 300;
    const byWidth = (vw - chromeW) / config.cols;
    const byHeight = (vh - chromeH) / config.rows;
    const ceiling = isTablet ? 78 : 64;
    return Math.max(20, Math.floor(Math.min(byWidth, byHeight, ceiling)));
  }, [vw, vh, padBeside, padWidth, isTablet, config.cols, config.rows]);

  const goal = useMemo(() => ({ row: config.rows - 1, col: config.cols - 1 }), [config.rows, config.cols]);

  const generateMaze = useCallback(() => {
    setMaze(buildMaze(config.rows, config.cols));
    setPosition({ row: 0, col: 0 });
  }, [config.rows, config.cols]);

  useEffect(() => {
    if (!showInstructions) {
      generateMaze();
    }
  }, [showInstructions, generateMaze]);

  useEffect(
    () => () => {
      if (wallHitTimerRef.current) {
        clearTimeout(wallHitTimerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    },
    []
  );

  const playWallBump = () => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioContextRef.current = new Ctx();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.11);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  };

  const triggerWallHitFeedback = () => {
    playWallBump();
    setIsWallHit(true);
    if (wallHitTimerRef.current) {
      clearTimeout(wallHitTimerRef.current);
    }
    wallHitTimerRef.current = setTimeout(() => {
      setIsWallHit(false);
      wallHitTimerRef.current = null;
    }, 220);
  };

  const tryMove = (dir) => {
    if (!maze.length) return;
    const nextRow = position.row + dir.row;
    const nextCol = position.col + dir.col;
    if (!inBounds(nextRow, nextCol, config.rows, config.cols)) {
      triggerWallHitFeedback();
      return;
    }
    if (maze[nextRow][nextCol] !== 1) {
      triggerWallHitFeedback();
      return;
    }

    const nextPosition = { row: nextRow, col: nextCol };
    setPosition(nextPosition);

    if (nextRow === goal.row && nextCol === goal.col) {
      setScore((prev) => prev + 1);
      soundManager?.playWin();
      setShowCelebration(true);
      if (hasPhotos) {
        setCelebrationPhoto(getRandomPhoto());
      }
      setTimeout(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
        generateMaze();
      }, 2000);
    }
  };

  const dpad = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(3, minmax(0, 1fr))',
        gap: 10,
        width: padBeside ? padWidth : 'min(86vw, 320px)',
        flexShrink: 0,
        direction: 'ltr',
      }}
    >
      <div />
      <button aria-label={DIRECTIONS[0].label} onPointerDown={() => tryMove(DIRECTIONS[0])} onClick={(e) => { if (e.detail === 0) tryMove(DIRECTIONS[0]); }} style={padButtonStyle}>
        ⬆️
      </button>
      <div />
      <button aria-label={DIRECTIONS[3].label} onPointerDown={() => tryMove(DIRECTIONS[3])} onClick={(e) => { if (e.detail === 0) tryMove(DIRECTIONS[3]); }} style={padButtonStyle}>
        ⬅️
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: padFont }}>👧</div>
      <button aria-label={DIRECTIONS[1].label} onPointerDown={() => tryMove(DIRECTIONS[1])} onClick={(e) => { if (e.detail === 0) tryMove(DIRECTIONS[1]); }} style={padButtonStyle}>
        ➡️
      </button>
      <div />
      <button aria-label={DIRECTIONS[2].label} onPointerDown={() => tryMove(DIRECTIONS[2])} onClick={(e) => { if (e.detail === 0) tryMove(DIRECTIONS[2]); }} style={padButtonStyle}>
        ⬇️
      </button>
      <div />
    </div>
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '-webkit-fill-available',
        background: 'var(--game-surface)',
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}
    >
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="⭐" score={score} accentColor={MAZE_ACCENT} />

      {!showInstructions && maze.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: padBeside ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: padBeside ? 'clamp(20px, 5vw, 56px)' : 12,
            width: '100%',
            height: '100%',
            paddingTop: padBeside ? 0 : 44,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {(!padBeside || isTablet) && (
              <>
                <h2 style={{ margin: 0, color: 'var(--dor-ink)', fontSize: 'clamp(26px, 5vw, 44px)', fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1 }}>
                  המבוך
                </h2>
                <p style={{ margin: 0, color: 'var(--dor-ink-muted)', fontSize: 'clamp(15px, 2.4vw, 20px)', fontWeight: 700 }}>
                  מובילים את הדמות אל הדגל
                </p>
              </>
            )}

            <div
              style={{
                backgroundColor: 'var(--game-card)',
                padding: 10,
                borderRadius: 18,
                boxShadow: 'var(--dor-shadow-card)',
                border: '1px solid var(--dor-border)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
                  gridTemplateRows: `repeat(${config.rows}, ${cellSize}px)`,
                  gap: 0,
                  width: 'fit-content',
                  direction: 'ltr',
                  borderRadius: 10,
                  overflow: 'hidden',
                  transform: isWallHit ? 'translateX(3px) scale(1.01)' : 'translateX(0) scale(1)',
                  transition: 'transform 0.12s ease',
                }}
              >
                {maze.map((rowCells, rowIndex) =>
                  rowCells.map((cell, colIndex) => {
                    const isPlayer = position.row === rowIndex && position.col === colIndex;
                    const isGoal = goal.row === rowIndex && goal.col === colIndex;
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        style={{
                          backgroundColor: cell === 1 ? 'var(--game-paper)' : WALL_COLOR,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: Math.round(cellSize * 0.62),
                          lineHeight: 1,
                          minHeight: 0,
                          minWidth: 0,
                        }}
                      >
                        {isPlayer ? (isWallHit ? '💥' : '👧') : isGoal ? '🏁' : ''}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {dpad}
        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="המבוך! 🧭"
          buttonText="בוא נשחק! 🧭"
          onStart={() => setShowInstructions(false)}
          accentColor={MAZE_ACCENT}
        >
          <p>🧒 מזיזים את הדמות עם החצים</p>
          <p>🏁 מגיעים אל הדגל כדי לעבור שלב</p>
          <p>⭐ כל מבוך שנפתר נותן נקודה</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="יש! הצלחתם! 🎉"
        photo={celebrationPhoto}
        accentColor="var(--game-accent)"
        numberOfPieces={200}
      />
    </div>
  );
};

export default MazeRescueGame;
