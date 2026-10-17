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
import {
  DOR, BOT, applyMove, chooseMove, dropRow, emptyBoard, isFull, winnerLine,
} from './fourInRowLogic';
import {
  BOT_THINK_MS, CELEBRATION_MS, OPP_LANDSCAPE, OPP_PORTRAIT, RESET_MS, TOP_RESERVE, BOTTOM_RESERVE, layoutFor,
} from './fourInRowConfig';
import { createClackSfx } from './fourInRowAudio';
import Board from './Board';
import Opponent from './Opponent';

const EMPTY_SET = new Set();

const FourInRowGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width, height, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [showInstructions, setShowInstructions] = useState(true);
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState(DOR);
  const [winCells, setWinCells] = useState(EMPTY_SET);
  const [wins, setWins] = useState(0);
  const [wobbleCol, setWobbleCol] = useState(null);
  const [mood, setMood] = useState('idle');
  const [caption, setCaption] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [photo, setPhoto] = useState(null);

  const boardRef = useRef(board);
  const turnRef = useRef(DOR);
  const timersRef = useRef([]);
  const resetTimerRef = useRef(null);
  const [sfx] = useState(createClackSfx);

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
    setWinCells(EMPTY_SET);
    setMood('idle');
    setCaption(null);
    setCelebrating(false);
    setPhoto(null);
    setTurnBoth(DOR);
  }, [setTurnBoth]);

  /** Commit a move; returns true when the game ended. */
  const place = useCallback((c, who) => {
    const next = applyMove(boardRef.current, c, who);
    boardRef.current = next;
    setBoard(next);
    sfx.clack(who === DOR ? 1 : 1.25);
    const line = winnerLine(next);
    if (line) {
      setWinCells(new Set(line.map(([r, cc]) => `${r}-${cc}`)));
      setTurnBoth('over');
      if (who === DOR) {
        soundManager?.playWin?.();
        setPhoto(hasPhotos ? getRandomPhoto() : null);
        setWins((n) => n + 1);
        setCelebrating(true);
        resetTimerRef.current = schedule(freshBoard, CELEBRATION_MS);
      } else {
        setMood('giggle');
        setCaption('הי-הי! שוב נשחק? 😄');
        resetTimerRef.current = schedule(freshBoard, RESET_MS);
      }
      return true;
    }
    if (isFull(next)) {
      setTurnBoth('over');
      setMood('giggle');
      setCaption('הי-הי! שוב נשחק? 😄');
      resetTimerRef.current = schedule(freshBoard, RESET_MS);
      return true;
    }
    return false;
  }, [sfx, soundManager, hasPhotos, getRandomPhoto, schedule, freshBoard, setTurnBoth]);

  const handleColumn = useCallback((c) => {
    if (turnRef.current !== DOR) return;
    if (dropRow(boardRef.current, c) < 0) {
      setWobbleCol(c);
      schedule(() => setWobbleCol((cur) => (cur === c ? null : cur)), 400);
      return;
    }
    if (place(c, DOR)) return;
    setTurnBoth(BOT);
    setMood('thinking');
    schedule(() => {
      const move = chooseMove(boardRef.current, difficulty, Math.random);
      setMood('idle');
      if (move < 0) return;
      if (!place(move, BOT)) setTurnBoth(DOR);
    }, BOT_THINK_MS);
  }, [difficulty, place, schedule, setTurnBoth]);

  // ── render ──────────────────────────────────────────────────────────────
  const layout = layoutFor(width, height, isTablet);
  const oppSize = layout.landscape ? Math.min(OPP_LANDSCAPE - 30, 110) : OPP_PORTRAIT - 30;

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
          winSet={winCells}
          turn={turn}
          wobbleCol={wobbleCol}
          reduce={reduce}
          onColumn={handleColumn}
        />
      </div>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🔴" score={wins} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="ארבע בשורה 🔴"
          buttonText="בואו נתחיל"
          onStart={() => setShowInstructions(false)}
        >
          <p style={{ marginBottom: 12 }}>👆 <strong>לוחצים על עמודה</strong> והדיסק האדום נופל.</p>
          <p style={{ marginBottom: 12 }}>🟡 החבר הצהוב משחק אחריך.</p>
          <p style={{ marginBottom: 12 }}>✨ ארבעה אדומים בשורה - ניצחת!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={celebrating}
        successText="ניצחת! 🎉"
        subtitle={wins === 1 ? 'ניצחון אחד! 🔴' : `${wins} ניצחונות! 🔴`}
        photo={photo}
        numberOfPieces={180}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default FourInRowGame;
