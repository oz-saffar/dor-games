import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

const PUZZLES = [
  {
    id: 'train',
    title: 'רכבת',
    accent: '#0EA5E9',
    boardColor: 'linear-gradient(145deg, #DBEAFE 0%, #BFDBFE 100%)',
    pieces: [
      { id: 'engine', emoji: '🚂', target: { x: 20, y: 62 } },
      { id: 'car1', emoji: '🟦', target: { x: 38, y: 62 } },
      { id: 'car2', emoji: '🟨', target: { x: 56, y: 62 } },
      { id: 'car3', emoji: '🟥', target: { x: 74, y: 62 } },
    ],
  },
  {
    id: 'rocket',
    title: 'טיל',
    accent: '#9333EA',
    boardColor: 'linear-gradient(145deg, #F3E8FF 0%, #E9D5FF 100%)',
    pieces: [
      { id: 'tip', emoji: '🔺', target: { x: 50, y: 26 } },
      { id: 'body', emoji: '🟫', target: { x: 50, y: 45 } },
      { id: 'window', emoji: '🔵', target: { x: 50, y: 58 } },
      { id: 'fire', emoji: '🔥', target: { x: 50, y: 76 } },
    ],
  },
  {
    id: 'flower',
    title: 'פרח',
    accent: '#EC4899',
    boardColor: 'linear-gradient(145deg, #FCE7F3 0%, #FBCFE8 100%)',
    pieces: [
      { id: 'petal1', emoji: '🌸', target: { x: 38, y: 38 } },
      { id: 'petal2', emoji: '🌸', target: { x: 62, y: 38 } },
      { id: 'petal3', emoji: '🌸', target: { x: 50, y: 54 } },
      { id: 'stem', emoji: '🌿', target: { x: 50, y: 74 } },
    ],
  },
];

const PIECE_SIZE = 74;
const SNAP_DISTANCE = 58;
const TRAY_TOP_RATIO = 0.72;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const shuffled = (items) => [...items].sort(() => Math.random() - 0.5);

export default function PuzzleDragGame({ onExit, soundManager }) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [score, setScore] = useState(0);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [pieces, setPieces] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const [activePieceId, setActivePieceId] = useState(null);

  const boardRef = useRef(null);
  const activeDragRef = useRef(null);
  const previousPuzzleRef = useRef(null);
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const currentPuzzle = PUZZLES[currentPuzzleIndex];

  const getTargetPoint = useCallback((piece) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    return {
      x: rect.left + (piece.target.x / 100) * rect.width,
      y: rect.top + (piece.target.y / 100) * rect.height,
    };
  }, []);

  const spawnPiecePositions = useCallback((puzzle) => {
    const total = puzzle.pieces.length;
    const randomOrder = shuffled(puzzle.pieces);
    const trayTop = window.innerHeight * TRAY_TOP_RATIO;
    const usableWidth = Math.max(window.innerWidth - 56, PIECE_SIZE + 24);
    const gap = total > 1 ? usableWidth / (total - 1) : usableWidth;

    return randomOrder.map((piece, index) => {
      const centeredX = 28 + index * gap;
      const x = clamp(centeredX + (Math.random() * 24 - 12), PIECE_SIZE * 0.5 + 12, window.innerWidth - PIECE_SIZE * 0.5 - 12);
      const y = clamp(trayTop + (Math.random() * 40 - 20), trayTop - 10, window.innerHeight - PIECE_SIZE * 0.5 - 24);
      return {
        ...piece,
        x,
        y,
        placed: false,
      };
    });
  }, []);

  const prepareRound = useCallback((puzzleIndex) => {
    const nextPuzzle = PUZZLES[puzzleIndex];
    setPieces(spawnPiecePositions(nextPuzzle));
    setActivePieceId(null);
  }, [spawnPiecePositions]);

  const chooseNextPuzzleIndex = useCallback(() => {
    if (PUZZLES.length === 1) return 0;
    const candidates = PUZZLES.map((_, index) => index).filter((index) => index !== previousPuzzleRef.current);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, []);

  const moveToNextPuzzle = useCallback(() => {
    const nextIndex = chooseNextPuzzleIndex();
    previousPuzzleRef.current = nextIndex;
    setCurrentPuzzleIndex(nextIndex);
    prepareRound(nextIndex);
  }, [chooseNextPuzzleIndex, prepareRound]);

  useEffect(() => {
    if (!showInstructions) {
      previousPuzzleRef.current = currentPuzzleIndex;
      prepareRound(currentPuzzleIndex);
    }
  }, [showInstructions, currentPuzzleIndex, prepareRound]);

  const handlePiecePointerDown = (event, piece) => {
    if (piece.placed) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setActivePieceId(piece.id);
    activeDragRef.current = {
      pointerId: event.pointerId,
      pieceId: piece.id,
      offsetX: event.clientX - piece.x,
      offsetY: event.clientY - piece.y,
    };
  };

  const handleStagePointerMove = (event) => {
    const drag = activeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextX = clamp(event.clientX - drag.offsetX, PIECE_SIZE * 0.5 + 8, window.innerWidth - PIECE_SIZE * 0.5 - 8);
    const nextY = clamp(event.clientY - drag.offsetY, PIECE_SIZE * 0.5 + 8, window.innerHeight - PIECE_SIZE * 0.5 - 8);
    setPieces((prev) =>
      prev.map((piece) =>
        piece.id === drag.pieceId
          ? {
              ...piece,
              x: nextX,
              y: nextY,
            }
          : piece
      )
    );
  };

  const completeDrag = useCallback((event) => {
    const drag = activeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setPieces((prev) => {
      let didSnap = false;
      const updated = prev.map((piece) => {
        if (piece.id !== drag.pieceId || piece.placed) return piece;
        const targetPoint = getTargetPoint(piece);
        const distance = Math.hypot(piece.x - targetPoint.x, piece.y - targetPoint.y);
        if (distance <= SNAP_DISTANCE) {
          didSnap = true;
          return {
            ...piece,
            x: targetPoint.x,
            y: targetPoint.y,
            placed: true,
          };
        }
        return piece;
      });

      if (didSnap) {
        soundManager?.playWin();
        const allPlaced = updated.every((piece) => piece.placed);
        if (allPlaced) {
          setScore((value) => value + 1);
          if (hasPhotos) {
            setCelebrationPhoto(getRandomPhoto());
          }
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            setCelebrationPhoto(null);
            moveToNextPuzzle();
          }, 1600);
        }
      }
      return updated;
    });

    activeDragRef.current = null;
    setActivePieceId(null);
  }, [getRandomPhoto, getTargetPoint, hasPhotos, moveToNextPuzzle, soundManager]);

  const onStagePointerUp = (event) => completeDrag(event);
  const onStagePointerCancel = (event) => completeDrag(event);

  const instructionBody = useMemo(() => (
    <>
      <p>✋ גוררים כל חלק למקום שלו בתמונה.</p>
      <p>🎯 משחררים ליד הצל - והוא ננעל למקום.</p>
      <p>⭐ מסיימים פאזל ומקבלים נקודה.</p>
    </>
  ), []);

  return (
    <div
      onPointerMove={handleStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerCancel={onStagePointerCancel}
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '-webkit-fill-available',
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        background: 'linear-gradient(145deg, #fef3c7 0%, #fecaca 45%, #bfdbfe 100%)',
      }}
    >
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🧩" score={score} accentColor={currentPuzzle.accent} />

      {!showInstructions && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 'calc(16px + env(safe-area-inset-top))',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.92)',
              border: '3px solid rgba(255,255,255,0.9)',
              borderRadius: 18,
              padding: '8px 16px',
              fontSize: 'clamp(20px, 5vw, 32px)',
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              color: 'var(--dor-ink)',
              zIndex: 70,
              boxShadow: '0 6px 16px rgba(0,0,0,0.16)',
            }}
          >
            מרכיבים: {currentPuzzle.title}
          </div>

          <div
            ref={boardRef}
            style={{
              position: 'fixed',
              left: '50%',
              top: 'calc(80px + env(safe-area-inset-top))',
              transform: 'translateX(-50%)',
              width: 'min(92vw, 520px)',
              height: 'min(50vh, 420px)',
              borderRadius: 28,
              border: '4px solid rgba(255,255,255,0.95)',
              background: currentPuzzle.boardColor,
              boxShadow: '0 12px 24px rgba(0,0,0,0.16)',
            }}
          >
            {currentPuzzle.pieces.map((piece) => (
              <div
                key={`slot-${piece.id}`}
                style={{
                  position: 'absolute',
                  left: `${piece.target.x}%`,
                  top: `${piece.target.y}%`,
                  width: PIECE_SIZE,
                  height: PIECE_SIZE,
                  borderRadius: 18,
                  transform: 'translate(-50%, -50%)',
                  border: '3px dashed rgba(15, 23, 42, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 38,
                  opacity: 0.55,
                  backgroundColor: 'rgba(255,255,255,0.45)',
                }}
              >
                {piece.emoji}
              </div>
            ))}
          </div>

          <div
            style={{
              position: 'fixed',
              bottom: 'calc(8px + env(safe-area-inset-bottom))',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(96vw, 640px)',
              height: '34vh',
              minHeight: 200,
              borderRadius: 22,
              background: 'rgba(255,255,255,0.25)',
              border: '2px solid rgba(255,255,255,0.55)',
              zIndex: 20,
            }}
          />

          {pieces.map((piece) => (
            <button
              key={piece.id}
              onPointerDown={(event) => handlePiecePointerDown(event, piece)}
              style={{
                position: 'fixed',
                left: piece.x,
                top: piece.y,
                width: PIECE_SIZE,
                height: PIECE_SIZE,
                transform: `translate(-50%, -50%) scale(${activePieceId === piece.id ? 1.08 : 1})`,
                borderRadius: 18,
                border: piece.placed ? '3px solid #22C55E' : '3px solid rgba(255,255,255,0.9)',
                backgroundColor: piece.placed ? 'rgba(240,253,244,0.95)' : '#FFFFFF',
                cursor: piece.placed ? 'default' : 'grab',
                fontSize: 42,
                boxShadow: piece.placed
                  ? '0 6px 14px rgba(34,197,94,0.35)'
                  : '0 10px 18px rgba(0,0,0,0.22)',
                zIndex: piece.placed ? 40 : activePieceId === piece.id ? 90 : 60,
                touchAction: 'none',
                transition: piece.placed ? 'all 0.14s ease-out' : 'transform 0.1s ease',
                opacity: piece.placed ? 0.96 : 1,
              }}
            >
              {piece.emoji}
            </button>
          ))}
        </>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="פאזל גרירה אמיתי! 🧩"
          buttonText="נתחיל לגרור! ✋"
          onStart={() => setShowInstructions(false)}
          accentColor="#F97316"
        >
          {instructionBody}
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="וואו! הפאזל הושלם! 🎉"
        photo={celebrationPhoto}
        accentColor={currentPuzzle.accent}
        numberOfPieces={180}
      />
    </div>
  );
}
