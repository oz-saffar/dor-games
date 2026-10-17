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
  BOTTOM_RESERVE, CELEBRATION_MS, GOAL_RESERVE, LADDER, TAP_SLOP, TOP_RESERVE,
  cellSizeFor, levelFor,
} from './mergeConfig';
import { canMerge, hasWon, merge, newBoard, spawn } from './mergeLogic';
import { createMergeSfx } from './mergeAudio';
import Tile from './Tile';

const AnimalMergeGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width, height, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();
  const { rows, cols, goal, start } = levelFor(difficulty);

  const [showInstructions, setShowInstructions] = useState(true);
  const [rounds, setRounds] = useState(0);
  const [board, setBoard] = useState(() => newBoard(rows, cols, start));
  const [selected, setSelected] = useState(null);
  const [drag, setDrag] = useState(null);
  const [fx, setFx] = useState({});
  const [celebrating, setCelebrating] = useState(false);
  const [photo, setPhoto] = useState(null);

  const boardRef = useRef(board);
  const boardEl = useRef(null);
  const dragRef = useRef(null);
  const celebratingRef = useRef(false);
  const maxTierRef = useRef(Math.max(...board.filter((t) => t != null)));
  const timerRef = useRef(null);
  const fxCount = useRef(0);
  const [sfx] = useState(createMergeSfx);

  useEffect(() => {
    const h = (e) => { if (e.code === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    sfx.close();
  }, [sfx]);

  const startRound = useCallback(() => {
    timerRef.current = null;
    celebratingRef.current = false;
    const fresh = newBoard(rows, cols, start);
    boardRef.current = fresh;
    maxTierRef.current = Math.max(...fresh.filter((t) => t != null));
    setBoard(fresh);
    setSelected(null);
    setFx({});
    setCelebrating(false);
    setPhoto(null);
  }, [rows, cols, start]);

  const markFx = useCallback((entries) => {
    const next = {};
    entries.forEach(([idx, kind]) => { fxCount.current += 1; next[idx] = { kind, n: fxCount.current }; });
    setFx(next);
  }, []);

  const doMerge = useCallback((from, to) => {
    const merged = merge(boardRef.current, from, to);
    if (merged === boardRef.current) return;
    const tier = merged[to];
    sfx.chime(tier);
    if (tier > maxTierRef.current) {
      maxTierRef.current = tier;
      soundManager?.playCorrect?.();
    }
    try { navigator.vibrate?.(15); } catch { /* no haptics */ }
    setSelected(null);

    if (hasWon(merged, goal)) {
      boardRef.current = merged;
      setBoard(merged);
      markFx([[to, 'merge']]);
      celebratingRef.current = true;
      setCelebrating(true);
      soundManager?.playWin?.();
      setPhoto(hasPhotos ? getRandomPhoto() : null);
      setRounds((n) => n + 1);
      timerRef.current = setTimeout(startRound, CELEBRATION_MS);
      return;
    }
    const next = spawn(merged);
    boardRef.current = next;
    setBoard(next);
    const entries = [[to, 'merge']];
    next.forEach((t, i) => { if (t !== merged[i]) entries.push([i, 'spawn']); });
    markFx(entries);
  }, [goal, hasPhotos, getRandomPhoto, markFx, sfx, soundManager, startRound]);

  const cellAt = (x, y) => {
    const rect = boardEl.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const c = Math.floor(((x - rect.left) / rect.width) * cols);
    const r = Math.floor(((y - rect.top) / rect.height) * rows);
    if (c < 0 || c >= cols || r < 0 || r >= rows) return null;
    return r * cols + c;
  };

  const handleDown = (e, idx) => {
    if (celebratingRef.current || showInstructions) return;
    if (selected != null && selected !== idx && canMerge(boardRef.current, selected, idx)) {
      doMerge(selected, idx);
      return;
    }
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* synthetic event */ }
    dragRef.current = { idx, sx: e.clientX, sy: e.clientY, moved: false, wasSelected: selected === idx };
    setSelected(idx);
  };

  const handleMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
    d.moved = true;
    setDrag({ idx: d.idx, dx, dy });
  };

  const endDrag = (e) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    setDrag(null);
    if (!d.moved) {
      if (d.wasSelected) setSelected(null);
      return;
    }
    setSelected(null);
    const target = cellAt(e.clientX, e.clientY);
    if (target != null && canMerge(boardRef.current, d.idx, target)) doMerge(d.idx, target);
    else markFx([[d.idx, 'wobble']]);
  };

  const cell = cellSizeFor(width, height, rows, cols, isTablet);
  const goalEmoji = LADDER[goal].emoji;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      data-goal-tier={goal}
      style={{ background: 'var(--game-surface)', touchAction: 'none', userSelect: 'none' }}
      onPointerMove={handleMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="absolute inset-0 flex flex-col items-center"
        style={{ paddingTop: TOP_RESERVE, paddingBottom: BOTTOM_RESERVE }}
      >
        <div
          data-testid="goal-card"
          style={{
            height: GOAL_RESERVE - 14,
            marginBottom: 14,
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 24,
            background: 'var(--dor-surface, #FFFDF8)',
            border: '1px solid var(--dor-border)',
            boxShadow: 'var(--dor-shadow-card), 0 3px 0 var(--dor-lip)',
            color: 'var(--game-accent)',
            fontFamily: 'Varela Round, Rubik, sans-serif',
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          <span>המטרה:</span>
          <span style={{ fontSize: 40, lineHeight: 1 }}>{goalEmoji}</span>
        </div>

        <div
          ref={boardEl}
          dir="ltr"
          data-testid="merge-board"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
            gridTemplateRows: `repeat(${rows}, ${cell}px)`,
            padding: 0,
            borderRadius: Math.round(cell * 0.3),
          }}
        >
          {board.map((tier, idx) => (
            <Tile
              key={idx}
              idx={idx}
              r={Math.floor(idx / cols)}
              c={idx % cols}
              tier={tier}
              size={cell}
              selected={selected === idx}
              drag={drag && drag.idx === idx ? drag : null}
              fx={fx[idx]}
              reduce={reduce}
              onDown={handleDown}
            />
          ))}
        </div>
      </div>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🐾" score={rounds} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="מיזוג חיות 🐣"
          buttonText="בואו נתחיל"
          onStart={() => setShowInstructions(false)}
        >
          <p style={{ marginBottom: 12 }}>👆 <strong>גוררים חיה</strong> על חיה זהה, או לוחצים על אחת ואז על השנייה.</p>
          <p style={{ marginBottom: 12 }}>✨ שתי חיות זהות הופכות לחיה גדולה יותר!</p>
          <p style={{ marginBottom: 12 }}>{goalEmoji} מגיעים לחיה שבכרטיס המטרה ומנצחים.</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={celebrating}
        successText={`יצרת ${goalEmoji}! 🎉`}
        subtitle={rounds === 1 ? 'סיבוב אחד! 🐾' : `${rounds} סיבובים! 🐾`}
        photo={photo}
        numberOfPieces={180}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default AnimalMergeGame;
