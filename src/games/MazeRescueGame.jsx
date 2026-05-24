import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';
import { GAME_DIFFICULTY } from '../lib/gameDifficulties';

const MAZE_ACCENT = '#166534';

const DIFFICULTY_CONFIG = {
  [GAME_DIFFICULTY.EASY]: { rows: 5, cols: 5, extraOpenRatio: 0.2 },
  [GAME_DIFFICULTY.MEDIUM]: { rows: 7, cols: 7, extraOpenRatio: 0.14 },
  [GAME_DIFFICULTY.HARD]: { rows: 9, cols: 9, extraOpenRatio: 0.1 },
};

const DIRECTIONS = [
  { id: 'up', label: 'למעלה', row: -1, col: 0, icon: '⬆️' },
  { id: 'right', label: 'ימינה', row: 0, col: 1, icon: '➡️' },
  { id: 'down', label: 'למטה', row: 1, col: 0, icon: '⬇️' },
  { id: 'left', label: 'שמאלה', row: 0, col: -1, icon: '⬅️' },
];

const inBounds = (row, col, rows, cols) => row >= 0 && col >= 0 && row < rows && col < cols;

const buildMaze = (rows, cols, extraOpenRatio) => {
  const maze = Array.from({ length: rows }, () => Array(cols).fill(0));
  const path = [{ row: 0, col: 0 }];
  let current = { row: 0, col: 0 };
  maze[0][0] = 1;

  while (current.row !== rows - 1 || current.col !== cols - 1) {
    const moves = [];
    if (current.row < rows - 1) moves.push({ row: current.row + 1, col: current.col });
    if (current.col < cols - 1) moves.push({ row: current.row, col: current.col + 1 });
    if (current.row > 0 && Math.random() > 0.75) moves.push({ row: current.row - 1, col: current.col });
    if (current.col > 0 && Math.random() > 0.75) moves.push({ row: current.row, col: current.col - 1 });
    const next = moves[Math.floor(Math.random() * moves.length)];
    current = next;
    maze[current.row][current.col] = 1;
    path.push(current);
  }

  const targetExtra = Math.floor(rows * cols * extraOpenRatio);
  let opened = 0;
  while (opened < targetExtra) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (maze[row][col] === 0) {
      maze[row][col] = 1;
      opened += 1;
    }
  }

  maze[rows - 1][cols - 1] = 1;
  return maze;
};

const MazeRescueGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const CELL_SIZE_BY_DIFFICULTY = {
    [GAME_DIFFICULTY.EASY]: 'clamp(48px, 14vw, 64px)',
    [GAME_DIFFICULTY.MEDIUM]: 'clamp(30px, 9vw, 40px)',
    [GAME_DIFFICULTY.HARD]: 'clamp(24px, 7.2vw, 34px)',
  };
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
  const cellSize = CELL_SIZE_BY_DIFFICULTY[difficulty] ?? CELL_SIZE_BY_DIFFICULTY[GAME_DIFFICULTY.EASY];

  const goal = useMemo(() => ({ row: config.rows - 1, col: config.cols - 1 }), [config.rows, config.cols]);

  const generateMaze = useCallback(() => {
    setMaze(buildMaze(config.rows, config.cols, config.extraOpenRatio));
    setPosition({ row: 0, col: 0 });
  }, [config.rows, config.cols, config.extraOpenRatio]);

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

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '-webkit-fill-available',
        background: 'linear-gradient(145deg, #14532d 0%, #15803d 50%, #4ade80 100%)',
        position: 'fixed',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="⭐" score={score} accentColor={MAZE_ACCENT} />

      {!showInstructions && maze.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: 700,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
            paddingTop: 'calc(10px + env(safe-area-inset-top))',
            paddingBottom: 'calc(210px + env(safe-area-inset-bottom))',
          }}
        >
          <h2 style={{ margin: 0, color: 'white', fontSize: 'clamp(28px, 6vw, 42px)', fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            המבוך
          </h2>
          <p style={{ margin: 0, color: '#DCFCE7', fontSize: 18, fontWeight: 'bold' }}>מובילים את הדמות אל הדגל</p>

          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.16)',
              padding: 10,
              borderRadius: 18,
              boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${config.cols}, ${cellSize})`,
                gridTemplateRows: `repeat(${config.rows}, ${cellSize})`,
                gap: 4,
                width: 'fit-content',
                direction: 'ltr',
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
                        backgroundColor: cell === 1 ? '#F0FDF4' : '#166534',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(18px, 4vw, 26px)',
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
          <div style={{ flex: 1 }} />
          <div
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 'calc(16px + env(safe-area-inset-bottom))',
              transform: 'translateX(-50%)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(3, minmax(0, 1fr))',
              gap: 10,
              width: 'min(86vw, 320px)',
              direction: 'ltr',
              zIndex: 110,
            }}
          >
            <div />
            <button onClick={() => tryMove(DIRECTIONS[0])} style={controlButtonStyle}>
              ⬆️
            </button>
            <div />
            <button onClick={() => tryMove(DIRECTIONS[3])} style={controlButtonStyle}>
              ⬅️
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👧</div>
            <button onClick={() => tryMove(DIRECTIONS[1])} style={controlButtonStyle}>
              ➡️
            </button>
            <div />
            <button onClick={() => tryMove(DIRECTIONS[2])} style={controlButtonStyle}>
              ⬇️
            </button>
            <div />
          </div>
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
        accentColor="#15803d"
        numberOfPieces={200}
      />
    </div>
  );
};

const controlButtonStyle = {
  backgroundColor: 'var(--dor-panel-elevated)',
  border: '1px solid var(--dor-border-strong)',
  borderRadius: 'var(--dor-radius-md)',
  minHeight: 66,
  fontSize: 34,
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: 'var(--dor-shadow-card)',
};

export default MazeRescueGame;
