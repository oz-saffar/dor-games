import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../hooks/useDorPhotos';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

const ACCENT = '#c026d3';

const COLOR_DEFS = [
  { key: 'red', hex: '#EF4444', label: 'אדום' },
  { key: 'orange', hex: '#F97316', label: 'כתום' },
  { key: 'yellow', hex: '#EAB308', label: 'צהוב' },
  { key: 'green', hex: '#22C55E', label: 'ירוק' },
  { key: 'blue', hex: '#3B82F6', label: 'כחול' },
  { key: 'purple', hex: '#A855F7', label: 'סגול' },
];

const SLOT_POSITIONS = [
  { x: 10, y: 52 },
  { x: 26, y: 28 },
  { x: 44, y: 58 },
  { x: 58, y: 22 },
  { x: 78, y: 48 },
  { x: 90, y: 68 },
  { x: 18, y: 78 },
  { x: 52, y: 38 },
  { x: 70, y: 72 },
  { x: 34, y: 18 },
];

const shuffle = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const colorByKey = (key) => COLOR_DEFS.find((c) => c.key === key);

function buildRound(score) {
  const paletteSize = Math.min(6, 3 + Math.floor(score / 4));
  const palette = shuffle(COLOR_DEFS).slice(0, Math.max(3, paletteSize));
  const target = palette[Math.floor(Math.random() * palette.length)];

  const totalBlobs = Math.min(10, 6 + Math.floor(score / 3));
  const correctCount = Math.max(2, Math.min(totalBlobs - 2, 2 + Math.floor(score / 5)));
  const wrongCount = totalBlobs - correctCount;

  const blobs = [];
  let id = 0;
  for (let i = 0; i < correctCount; i += 1) {
    blobs.push({ id: `c-${id}`, colorKey: target.key, popped: false });
    id += 1;
  }
  const distractorPool = palette.filter((c) => c.key !== target.key);
  for (let i = 0; i < wrongCount; i += 1) {
    const pick = distractorPool[Math.floor(Math.random() * distractorPool.length)];
    blobs.push({ id: `w-${id}`, colorKey: pick.key, popped: false });
    id += 1;
  }

  const slots = shuffle(SLOT_POSITIONS).slice(0, blobs.length);
  shuffle(blobs).forEach((blob, i) => {
    blob.leftPct = slots[i].x;
    blob.topPct = slots[i].y;
  });

  return {
    targetKey: target.key,
    targetLabel: target.label,
    targetHex: target.hex,
    blobs,
  };
}

/**
 * מסיבת נקודות — לוחצים רק על הבועות בצבע המטרה (בלי גרירה)
 */
export default function ColorPopHuntGame({ onExit, soundManager }) {
  const reduceMotion = useReducedMotion();
  const [showInstructions, setShowInstructions] = useState(true);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const startFirstRound = useCallback(() => {
    setRound(buildRound(0));
  }, []);

  const handleStart = () => {
    setShowInstructions(false);
    setScore(0);
    startFirstRound();
  };

  const handleBlobTap = (blob) => {
    if (!round || blob.popped) return;

    if (blob.colorKey !== round.targetKey) {
      soundManager?.playEncouragement();
      return;
    }

    soundManager?.playCorrect();

    const nextBlobs = round.blobs.map((b) =>
      b.id === blob.id ? { ...b, popped: true } : b
    );
    const stillNeed = nextBlobs.some((b) => !b.popped && b.colorKey === round.targetKey);

    if (stillNeed) {
      setRound({ ...round, blobs: nextBlobs });
      return;
    }

    setRound({ ...round, blobs: nextBlobs });
    setScore((s) => s + 1);
    soundManager?.playWin();
    setShowCelebration(true);
    if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
    setTimeout(() => {
      setShowCelebration(false);
      setCelebrationPhoto(null);
      setScore((s) => {
        setRound(buildRound(s));
        return s;
      });
    }, 1400);
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
        background: 'radial-gradient(ellipse 100% 90% at 50% 10%, #fce7f3 0%, #f9a8d4 45%, #db2777 100%)',
      }}
    >
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🎯" score={score} accentColor={ACCENT} />

      {!showInstructions && round && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            paddingTop: 'calc(56px + env(safe-area-inset-top))',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: '#831843',
                textShadow: '0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              לוחצים רק על
            </p>
            <div
              style={{
                marginTop: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 22px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 8px 28px rgba(131,24,67,0.25)',
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: `linear-gradient(145deg, ${round.targetHex} 0%, ${round.targetHex}cc 100%)`,
                  boxShadow: `0 0 0 4px #fff, 0 4px 14px ${round.targetHex}66`,
                }}
              />
              <span
                style={{
                  fontSize: 'clamp(26px, 7vw, 36px)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  color: '#500724',
                }}
              >
                {round.targetLabel}
              </span>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 520,
              height: 'min(58vh, 420px)',
              margin: '0 auto',
              borderRadius: 28,
              background: 'rgba(255,255,255,0.22)',
              border: '2px solid rgba(255,255,255,0.45)',
              boxShadow: 'inset 0 2px 24px rgba(255,255,255,0.35)',
            }}
          >
            {round.blobs.map((blob) => {
              const def = colorByKey(blob.colorKey);
              if (!def || blob.popped) return null;
              const floatDur = 2.4 + (blob.id.charCodeAt(0) % 5) * 0.15;
              return (
                <motion.button
                  key={blob.id}
                  type="button"
                  aria-label={`בועה ${def.label}`}
                  onClick={() => handleBlobTap(blob)}
                  initial={false}
                  animate={
                    reduceMotion
                      ? {}
                      : {
                          y: [0, -6, 0],
                          rotate: [-2, 2, -2],
                        }
                  }
                  transition={
                    reduceMotion
                      ? {}
                      : {
                          duration: floatDur,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }
                  }
                  style={{
                    position: 'absolute',
                    left: `${blob.leftPct}%`,
                    top: `${blob.topPct}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 'clamp(52px, 16vw, 76px)',
                    height: 'clamp(52px, 16vw, 76px)',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    background: `radial-gradient(circle at 30% 28%, #ffffffaa 0%, ${def.hex} 42%, ${def.hex}dd 100%)`,
                    boxShadow: `0 10px 22px rgba(0,0,0,0.2), inset 0 -6px 14px rgba(0,0,0,0.12)`,
                  }}
                />
              );
            })}
          </div>

          <p
            style={{
              textAlign: 'center',
              marginTop: 14,
              fontSize: 17,
              fontWeight: 700,
              color: '#9d174d',
            }}
          >
            כל הבועות הנכונות נעלמות — ואז סיבוב חדש!
          </p>
        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="תופסים את הצבע! 🎯"
          buttonText="יאללה לוחצים! 👆"
          onStart={handleStart}
          accentColor={ACCENT}
        >
          <p>🎨 למעלה מופיע צבע — רק הוא המטרה.</p>
          <p>👆 לוחצים על הבועות באותו צבע (בלי לגרור).</p>
          <p>✨ כשאין יותר בועות של המטרה — נקודה וסיבוב חדש!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="יופי! תפסת את כולן! 🎉"
        photo={celebrationPhoto}
        accentColor={ACCENT}
        numberOfPieces={160}
      />
    </div>
  );
}
