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
import { DOR, BOT, chooseMove, emptyBoard, isFull, winnerLine } from './ticTacToeLogic';
import {
  BOT_THINK_MS, CELEBRATION_MS, OPP_LANDSCAPE, OPP_PORTRAIT, PIECES, RESET_MS,
  BOTTOM_RESERVE, TOP_RESERVE, layoutFor, readPiece, savePiece,
} from './ticTacToeConfig';
import { createStampSfx } from './ticTacToeAudio';
import Board from './Board';
import Picker from './Picker';
import Opponent from '../fourInRow/Opponent';

const TicTacToeGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width, height, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [showInstructions, setShowInstructions] = useState(true);
  const [pieceKey, setPieceKey] = useState(readPiece);
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState(DOR);
  const [winLine, setWinLine] = useState(null);
  const [wins, setWins] = useState(0);
  const [wobble, setWobble] = useState(null);
  const [mood, setMood] = useState('idle');
  const [caption, setCaption] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [photo, setPhoto] = useState(null);

  const boardRef = useRef(board);
  const turnRef = useRef(DOR);
  const timersRef = useRef([]);
  const resetTimerRef = useRef(null);
  const [sfx] = useState(createStampSfx);

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

  const setTurnBoth = useCallback((t) => { turnRef.current = t; setTurn(t); }, []);

  const freshBoard = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      timersRef.current = timersRef.current.filter((t) => t !== resetTimerRef.current);
      resetTimerRef.current = null;
    }
    const b = emptyBoard();
    boardRef.current = b;
    setBoard(b);
    setWinLine(null);
    setMood('idle');
    setCaption(null);
    setCelebrating(false);
    setPhoto(null);
    setTurnBoth(DOR);
  }, [setTurnBoth]);

  const friendlyEnd = useCallback(() => {
    setTurnBoth('over');
    setMood('giggle');
    setCaption('עוד פעם? 😄');
    resetTimerRef.current = schedule(freshBoard, RESET_MS);
  }, [schedule, freshBoard, setTurnBoth]);

  /** Commit a move; returns true when the game ended. */
  const place = useCallback((i, who) => {
    const next = boardRef.current.slice();
    next[i] = who;
    boardRef.current = next;
    setBoard(next);
    sfx.stamp(who === DOR ? 1 : 1.3);
    const line = winnerLine(next);
    if (line) {
      setWinLine(line);
      if (who === DOR) {
        setTurnBoth('over');
        soundManager?.playWin?.();
        setPhoto(hasPhotos ? getRandomPhoto() : null);
        setWins((n) => n + 1);
        setCelebrating(true);
        resetTimerRef.current = schedule(freshBoard, CELEBRATION_MS);
      } else {
        friendlyEnd();
      }
      return true;
    }
    if (isFull(next)) {
      friendlyEnd();
      return true;
    }
    return false;
  }, [sfx, soundManager, hasPhotos, getRandomPhoto, schedule, freshBoard, friendlyEnd, setTurnBoth]);

  const handleCell = useCallback((i) => {
    if (turnRef.current !== DOR) return;
    if (boardRef.current[i] !== null) {
      setWobble(i);
      schedule(() => setWobble((cur) => (cur === i ? null : cur)), 400);
      return;
    }
    if (place(i, DOR)) return;
    setTurnBoth(BOT);
    setMood('thinking');
    schedule(() => {
      const move = chooseMove(boardRef.current, difficulty, Math.random);
      setMood('idle');
      if (move < 0) return;
      if (!place(move, BOT)) setTurnBoth(DOR);
    }, BOT_THINK_MS);
  }, [difficulty, place, schedule, setTurnBoth]);

  const pick = useCallback((key) => { savePiece(key); setPieceKey(key); }, []);

  // ── render ──────────────────────────────────────────────────────────────
  const layout = layoutFor(width, height, isTablet);
  const oppSize = layout.landscape ? Math.min(OPP_LANDSCAPE - 30, 110) : OPP_PORTRAIT - 30;
  const pieces = PIECES[pieceKey || 'dino'];
  const pickerSize = Math.max(110, Math.min(isTablet ? 260 : 150, (width - 80) / 2, height * 0.35));

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'var(--game-surface)', touchAction: 'none', userSelect: 'none' }}
      onPointerDown={() => { if (celebrating) freshBoard(); }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          paddingTop: TOP_RESERVE,
          paddingBottom: BOTTOM_RESERVE,
          flexDirection: layout.landscape ? 'row' : 'column',
          gap: layout.landscape ? 16 : 8,
        }}
      >
        <Opponent mood={mood} size={oppSize} reduce={reduce} caption={caption} />
        <Board
          board={board}
          layout={layout}
          winLine={winLine}
          turn={turn}
          wobble={wobble}
          pieces={pieces}
          reduce={reduce}
          onCell={handleCell}
        />
      </div>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon={pieces.dor} score={wins} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="איקס עיגול"
          buttonText="בואו נתחיל"
          onStart={() => setShowInstructions(false)}
        >
          <p style={{ marginBottom: 12 }}>👆 <strong>לוחצים על משבצת</strong> וחותמים עליה.</p>
          <p style={{ marginBottom: 12 }}>😄 החבר משחק אחריך.</p>
          <p style={{ marginBottom: 12 }}>✨ שלושה שלך בשורה - ניצחת!</p>
        </GameInstructionsOverlay>
      )}

      {!showInstructions && !pieceKey && <Picker onPick={pick} size={pickerSize} />}

      <GameCelebrationOverlay
        show={celebrating}
        successText="ניצחת! 🎉"
        subtitle={wins === 1 ? `ניצחון אחד! ${pieces.dor}` : `${wins} ניצחונות! ${pieces.dor}`}
        photo={photo}
        numberOfPieces={180}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default TicTacToeGame;
