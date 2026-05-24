import { useCallback, useEffect, useRef, useState } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { GAME_DIFFICULTY } from '../lib/gameDifficulties';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

const TUBE_CAPACITY = 4;
/** סדר ראשון — נשמר לרמות קל/בינוני/קשה כמו קודם; אחר כך צבעים נוספים לרמות מתקדמות */
const PALETTE = [
  '#EF4444',
  '#F59E0B',
  '#3B82F6',
  '#10B981',
  '#A855F7',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#EAB308',
  '#14B8A6',
];

const DIFFICULTY_CONFIG = {
  [GAME_DIFFICULTY.EASY]: { colorCount: 4, emptyCount: 4, scrambleMoves: 36 },
  [GAME_DIFFICULTY.MEDIUM]: { colorCount: 5, emptyCount: 2, scrambleMoves: 80 },
  [GAME_DIFFICULTY.HARD]: { colorCount: 6, emptyCount: 1, scrambleMoves: 130 },
  [GAME_DIFFICULTY.EXPERT]: { colorCount: 7, emptyCount: 2, scrambleMoves: 175 },
  [GAME_DIFFICULTY.MASTER]: { colorCount: 9, emptyCount: 2, scrambleMoves: 240 },
};

const getTop = (tube) => tube[tube.length - 1];

const canPour = (source, target) => {
  if (!source || !target || source.length === 0 || source === target) return false;
  if (target.length >= TUBE_CAPACITY) return false;
  if (target.length === 0) return true;
  return getTop(source) === getTop(target);
};

const applySinglePour = (tubes, fromIndex, toIndex) => {
  const next = tubes.map((tube) => [...tube]);
  const topColor = next[fromIndex].pop();
  next[toIndex].push(topColor);
  return next;
};

const isSolved = (tubes) =>
  tubes.every((tube) => {
    if (tube.length === 0) return true;
    if (tube.length !== TUBE_CAPACITY) return false;
    return tube.every((c) => c === tube[0]);
  });

const createSolvedBoard = (colorCount, emptyCount) => {
  const source = Array.from({ length: colorCount }, (_, colorIndex) =>
    Array.from({ length: TUBE_CAPACITY }, () => PALETTE[colorIndex])
  );
  const empties = Array.from({ length: emptyCount }, () => []);
  return [...source, ...empties];
};

const listMoves = (tubes, lastMove) => {
  const moves = [];
  for (let from = 0; from < tubes.length; from += 1) {
    for (let to = 0; to < tubes.length; to += 1) {
      if (from === to) continue;
      if (!canPour(tubes[from], tubes[to])) continue;
      if (lastMove && lastMove.from === to && lastMove.to === from) continue;
      moves.push({ from, to });
    }
  }
  return moves;
};

const createLevel = (difficulty) => {
  const config = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG[GAME_DIFFICULTY.EASY];
  const base = createSolvedBoard(config.colorCount, config.emptyCount);
  let tubes = base;
  let lastMove = null;

  for (let i = 0; i < config.scrambleMoves; i += 1) {
    const options = listMoves(tubes, lastMove);
    if (options.length === 0) break;
    const move = options[Math.floor(Math.random() * options.length)];
    tubes = applySinglePour(tubes, move.from, move.to);
    lastMove = move;
  }

  if (isSolved(tubes)) {
    const options = listMoves(tubes, null);
    if (options.length > 0) {
      const move = options[Math.floor(Math.random() * options.length)];
      tubes = applySinglePour(tubes, move.from, move.to);
    }
  }
  return tubes;
};

export default function WaterSortGame({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [score, setScore] = useState(0);
  const [selectedTube, setSelectedTube] = useState(null);
  const [tubes, setTubes] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const [pourAnim, setPourAnim] = useState(null);
  const tubeRefs = useRef({});
  const animTimerRef = useRef(null);
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const clearAnimTimer = () => {
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
  };

  const startLevel = useCallback(() => {
    clearAnimTimer();
    setSelectedTube(null);
    setPourAnim(null);
    setTubes(createLevel(difficulty));
  }, [difficulty]);

  useEffect(() => {
    if (!showInstructions) startLevel();
    return () => clearAnimTimer();
  }, [showInstructions, startLevel]);

  const runPourAnimation = (fromIndex, toIndex, color, onDone) => {
    const fromEl = tubeRefs.current[fromIndex];
    const toEl = tubeRefs.current[toIndex];
    if (!fromEl || !toEl) {
      onDone();
      return;
    }
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const startX = fromRect.left + fromRect.width / 2;
    const startY = fromRect.top + 22;
    const endX = toRect.left + toRect.width / 2;
    const endY = toRect.top + 22;

    setPourAnim({
      color,
      startX,
      startY,
      endX,
      endY,
      active: false,
    });

    requestAnimationFrame(() => {
      setPourAnim((prev) => (prev ? { ...prev, active: true } : prev));
    });

    animTimerRef.current = setTimeout(() => {
      setPourAnim(null);
      onDone();
    }, 210);
  };

  const tryMove = (tubeIndex) => {
    if (pourAnim) return;
    if (selectedTube == null) {
      if (tubes[tubeIndex]?.length) setSelectedTube(tubeIndex);
      return;
    }
    if (selectedTube === tubeIndex) {
      setSelectedTube(null);
      return;
    }

    const source = tubes[selectedTube];
    const target = tubes[tubeIndex];
    if (!canPour(source, target)) {
      soundManager?.playEncouragement();
      setSelectedTube(null);
      return;
    }

    const topColor = getTop(source);
    runPourAnimation(selectedTube, tubeIndex, topColor, () => {
      const next = applySinglePour(tubes, selectedTube, tubeIndex);
      setTubes(next);
      setSelectedTube(null);
      if (isSolved(next)) {
        soundManager?.playWin();
        setScore((prev) => prev + 1);
        if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          setCelebrationPhoto(null);
          startLevel();
        }, 1700);
      }
    });
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '-webkit-fill-available',
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #e0f2fe 0%, #99d9f5 40%, #38bdf8 100%)',
      }}
    >
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🧪" score={score} accentColor="#0E7490" />

      {!showInstructions && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 'calc(52px + env(safe-area-inset-top))',
              left: 0,
              right: 0,
              bottom: 'calc(14px + env(safe-area-inset-bottom))',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '14px 10px 24px',
            }}
          >
            <div
              style={{
                width: 'min(820px, 100%)',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))',
                gap: 12,
                alignItems: 'end',
              }}
            >
              {tubes.map((tube, index) => {
                const selected = selectedTube === index;
                const legal = selectedTube != null && selectedTube !== index
                  ? canPour(tubes[selectedTube], tube)
                  : false;
                return (
                  <button
                    key={`tube-${index}`}
                    ref={(el) => {
                      tubeRefs.current[index] = el;
                    }}
                    onClick={() => tryMove(index)}
                    style={{
                      border: selected
                        ? '4px solid #1D4ED8'
                        : legal
                          ? '4px solid #16A34A'
                          : '3px solid rgba(14,116,144,0.38)',
                      borderTop: '8px solid rgba(255,255,255,0.95)',
                      borderRadius: '20px 20px 30px 30px',
                      height: 250,
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.76) 100%)',
                      overflow: 'hidden',
                      boxShadow: selected
                        ? '0 10px 22px rgba(29,78,216,0.3)'
                        : '0 6px 14px rgba(0,0,0,0.16)',
                      position: 'relative',
                      transform: selected ? 'translateY(-8px)' : 'translateY(0)',
                      transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 8,
                        right: 8,
                        bottom: 8,
                        top: 24,
                        borderRadius: '10px 10px 20px 20px',
                        overflow: 'hidden',
                        background: 'linear-gradient(180deg, rgba(226,232,240,0.7) 0%, rgba(241,245,249,0.85) 100%)',
                      }}
                    >
                      {Array.from({ length: TUBE_CAPACITY }).map((_, layerIndex) => {
                        const color = tube[layerIndex];
                        if (!color) return null;
                        return (
                          <div
                            key={`${index}-${layerIndex}`}
                            style={{
                              position: 'absolute',
                              left: 0,
                              right: 0,
                              bottom: `${(layerIndex * 100) / TUBE_CAPACITY}%`,
                              height: `${100 / TUBE_CAPACITY}%`,
                              background: `linear-gradient(180deg, ${color} 0%, ${color}DD 100%)`,
                              transition: 'all 0.18s ease',
                            }}
                          />
                        );
                      })}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.18) 100%)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ width: 'min(820px, 100%)', margin: '16px auto 0', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={startLevel}
                style={{
                  border: 'none',
                  borderRadius: 14,
                  padding: '10px 16px',
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#0F172A',
                  background: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
                }}
              >
                סבב חדש 🔄
              </button>
            </div>
          </div>
        </>
      )}

      {pourAnim && (
        <div
          style={{
            position: 'fixed',
            left: pourAnim.active ? pourAnim.endX : pourAnim.startX,
            top: pourAnim.active ? pourAnim.endY : pourAnim.startY,
            width: 22,
            height: 22,
            borderRadius: 999,
            transform: 'translate(-50%, -50%)',
            background: pourAnim.color,
            boxShadow: `0 0 0 6px ${pourAnim.color}33, 0 8px 16px rgba(0,0,0,0.2)`,
            transition: 'left 0.2s ease, top 0.2s ease',
            zIndex: 130,
            pointerEvents: 'none',
          }}
        />
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="מיון צבעים! 🧪"
          buttonText="נתחיל למיין! 💧"
          onStart={() => setShowInstructions(false)}
          accentColor="#0E7490"
        >
          <p>👆 בוחרים מבחנה ואז מבחנה אחרת לשפיכה.</p>
          <p>🔝 נשפך רק הצבע העליון, ונשפך לראש המבחנה החדשה (LIFO).</p>
          <p>💧 מותר לשפוך רק לריקה או לאותו צבע למעלה.</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="נהדר! מיינת את כל הצבעים! 🎉"
        photo={celebrationPhoto}
        accentColor="#0E7490"
        numberOfPieces={170}
      />
    </div>
  );
}
