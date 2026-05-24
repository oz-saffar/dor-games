import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useIsLandscape } from '../hooks/useOrientation';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

/** Distinct archetypes — same `typeId` always looks identical (fair matching). */
const FRIEND_TYPE_IDS = [
  'striped',
  'cap-teal',
  'checkered',
  'splitshirt',
  'beret',
  'hoodie-aqua',
  'vneck-lime',
  'vert-stripes',
  'polkadot',
  'overalls',
];

const MIN_DIST_PCT = 8.5;
const MAX_TRIES = 120;

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/** Wider horizontal margin; taller vertical band so feet-anchored figures (translate -100% Y) stay inside overflow:hidden scene. */
function packPositions(count, marginX = 5, yMin = 26, yMax = 96) {
  const positions = [];
  for (let n = 0; n < count; n += 1) {
    let placed = false;
    for (let t = 0; t < MAX_TRIES && !placed; t += 1) {
      const x = marginX + Math.random() * (100 - 2 * marginX);
      const y = yMin + Math.random() * (yMax - yMin);
      const candidate = { x, y };
      if (positions.every((p) => dist(p, candidate) >= MIN_DIST_PCT)) {
        positions.push(candidate);
        placed = true;
      }
    }
    if (!placed) {
      const xSpan = 100 - 2 * marginX;
      const ySpan = yMax - yMin;
      positions.push({
        x: marginX + ((n * 13) % xSpan),
        y: yMin + ((n * 19) % ySpan),
      });
    }
  }
  return positions;
}

/**
 * Next crowd layout + target. Updates `lastTargetRef` so the new target ≠ previous (when possible).
 */
function buildNextRound(isLandscape, lastTargetRef) {
  const decoyCount = isLandscape ? 44 : 38;
  const total = decoyCount + 1;

  const avoidPool = FRIEND_TYPE_IDS.filter((id) => id !== lastTargetRef.current);
  const targetTypeId = rand(avoidPool.length ? avoidPool : FRIEND_TYPE_IDS);
  lastTargetRef.current = targetTypeId;

  const decoyTypes = FRIEND_TYPE_IDS.filter((id) => id !== targetTypeId);
  const positions = packPositions(total);
  const targetSlot = Math.floor(Math.random() * total);

  const figures = positions.map((pos, i) => {
    const scale = 0.78 + Math.random() * 0.38;
    const rot = (Math.random() - 0.5) * 14;
    const typeId = i === targetSlot ? targetTypeId : rand(decoyTypes);
    return {
      id: `f-${i}`,
      typeId,
      pos,
      scale,
      rot,
    };
  });

  return { figures, roundKey: Date.now(), targetTypeId };
}

/**
 * One crowd member — outfit fixed per typeId so preview matches scene copies.
 */
function FriendFigure({ typeId, scale }) {
  const s = scale;

  const head = (skin, w = 14, h = 14, mb = -4) => (
    <div
      aria-hidden
      style={{
        width: w * s,
        height: h * s,
        borderRadius: '50%',
        background: skin,
        marginBottom: mb * s,
        zIndex: 1,
        boxShadow: `inset 0 -${2 * s}px 0 rgba(0,0,0,0.08), 0 ${1 * s}px 0 rgba(0,0,0,0.12)`,
      }}
    />
  );

  const legs = (left, right, w = 7, h = 9) => (
    <div className="flex gap-[3px]" style={{ marginTop: -1 * s }}>
      <div
        style={{
          width: w * s,
          height: h * s,
          borderRadius: `0 0 ${3 * s}px ${3 * s}px`,
          background: left,
        }}
      />
      <div
        style={{
          width: w * s,
          height: h * s,
          borderRadius: `0 0 ${3 * s}px ${3 * s}px`,
          background: right,
        }}
      />
    </div>
  );

  const wrap = (inner) => (
    <div className="flex flex-col items-center" style={{ width: 38 * s }}>
      {inner}
    </div>
  );

  switch (typeId) {
    case 'striped':
      return wrap(
        <>
          <div
            style={{
              width: 22 * s,
              height: 10 * s,
              borderRadius: `${10 * s}px ${10 * s}px 2px 2px`,
              background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)',
              marginBottom: -2 * s,
            }}
          />
          {head('#fbbf24', 8, 8, -3)}
          <div
            style={{
              width: 16 * s,
              height: 18 * s,
              borderRadius: `${3 * s}px`,
              background: `repeating-linear-gradient(180deg, #ef4444 0px, #ef4444 ${3 * s}px, #fff ${3 * s}px, #fff ${6 * s}px)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 ${2 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
            }}
          />
          {legs('#1d4ed8', '#2563eb', 6, 10)}
        </>
      );
    case 'cap-teal':
      return wrap(
        <>
          <div
            style={{
              width: 18 * s,
              height: 7 * s,
              borderRadius: `${2 * s}px ${8 * s}px 2px 2px`,
              background: 'linear-gradient(180deg, #1e40af, #1d4ed8)',
              marginBottom: -3 * s,
            }}
          />
          {head('#e8b89a')}
          <div
            style={{
              width: 18 * s,
              height: 20 * s,
              borderRadius: `${4 * s}px`,
              background: 'linear-gradient(180deg, #0d9488, #0f766e)',
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 ${2 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
            }}
          />
          {legs('#57534e', '#44403c')}
        </>
      );
    case 'checkered':
      return wrap(
        <>
          {head('#c68642')}
          <div
            style={{
              width: 18 * s,
              height: 20 * s,
              borderRadius: `${4 * s}px`,
              backgroundColor: '#f8fafc',
              backgroundImage: `linear-gradient(45deg, #0f172a 25%, transparent 25%), linear-gradient(-45deg, #0f172a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0f172a 75%), linear-gradient(-45deg, transparent 75%, #0f172a 75%)`,
              backgroundSize: `${8 * s}px ${8 * s}px`,
              backgroundPosition: `0 0, 0 ${4 * s}px, ${4 * s}px ${-4 * s}px, ${-4 * s}px 0`,
              boxShadow: `0 ${2 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
            }}
          />
          {legs('#78350f', '#92400e')}
        </>
      );
    case 'splitshirt':
      return wrap(
        <>
          {head('#fcd3a4')}
          <div
            style={{
              width: 18 * s,
              height: 20 * s,
              borderRadius: `${4 * s}px`,
              background: `linear-gradient(180deg, #facc15 0%, #facc15 50%, #c026d3 50%, #c026d3 100%)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 ${2 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
            }}
          />
          {legs('#0369a1', '#0284c7')}
        </>
      );
    case 'beret':
      return wrap(
        <>
          <div
            style={{
              width: 16 * s,
              height: 6 * s,
              borderRadius: '50%',
              background: '#171717',
              marginBottom: -4 * s,
              transform: `rotate(-12deg)`,
            }}
          />
          {head('#d4a574')}
          <div
            style={{
              width: 18 * s,
              height: 20 * s,
              borderRadius: `${4 * s}px`,
              background: 'linear-gradient(180deg, #fb7185, #e11d48)',
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 ${2 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
            }}
          />
          {legs('#1e3a8a', '#1e40af')}
        </>
      );
    case 'hoodie-aqua':
      return wrap(
        <>
          <div
            style={{
              width: 20 * s,
              height: 12 * s,
              borderRadius: `${10 * s}px ${10 * s}px 0 0`,
              background: 'linear-gradient(180deg, #22d3ee, #06b6d4)',
              marginBottom: -8 * s,
              boxShadow: `inset 0 -${2 * s}px 0 rgba(0,0,0,0.1)`,
            }}
          />
          {head('#8d5524', 12, 12, -2)}
          <div
            style={{
              width: 20 * s,
              height: 18 * s,
              borderRadius: `${2 * s}px ${2 * s}px ${4 * s}px ${4 * s}px`,
              background: 'linear-gradient(180deg, #0891b2, #0e7490)',
              boxShadow: `0 ${2 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
            }}
          />
          {legs('#1e293b', '#334155')}
        </>
      );
    case 'vneck-lime':
      return wrap(
        <>
          {head('#f5c89a')}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 18 * s,
                height: 20 * s,
                borderRadius: `${4 * s}px`,
                background: 'linear-gradient(180deg, #84cc16, #65a30d)',
                clipPath: 'polygon(22% 0%, 78% 0%, 100% 100%, 0% 100%)',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 ${2 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                transform: 'translateX(-50%)',
                width: 7 * s,
                height: 9 * s,
                background: 'linear-gradient(180deg, #fef9c3, #eab308)',
                clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              }}
            />
          </div>
          {legs('#14532d', '#166534')}
        </>
      );
    case 'vert-stripes':
      return wrap(
        <>
          {head('#a56b3a')}
          <div
            style={{
              width: 18 * s,
              height: 20 * s,
              borderRadius: `${4 * s}px`,
              background: `repeating-linear-gradient(90deg, #15803d 0px, #15803d ${3 * s}px, #fef08a ${3 * s}px, #fef08a ${6 * s}px)`,
              boxShadow: `0 ${2 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
            }}
          />
          {legs('#a16207', '#ca8a04')}
        </>
      );
    case 'polkadot':
      return wrap(
        <>
          <div
            style={{
              width: 12 * s,
              height: 8 * s,
              borderRadius: `${6 * s}px ${6 * s}px 0 0`,
              background: 'linear-gradient(180deg, #eab308, #ca8a04)',
              marginBottom: -3 * s,
            }}
          />
          {head('#e8b89a')}
          <div
            style={{
              width: 18 * s,
              height: 20 * s,
              borderRadius: `${4 * s}px`,
              backgroundColor: '#fb7185',
              backgroundImage: `radial-gradient(circle at 30% 30%, #fff 1.5px, transparent 1.5px)`,
              backgroundSize: `${7 * s}px ${7 * s}px`,
              boxShadow: `0 ${2 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
            }}
          />
          {legs('#6b21a8', '#7c3aed')}
        </>
      );
    case 'overalls':
      return wrap(
        <>
          <div
            style={{
              width: 20 * s,
              height: 6 * s,
              borderRadius: `${2 * s}px`,
              background: 'linear-gradient(90deg, #fbbf24, #d97706)',
              marginBottom: -2 * s,
            }}
          />
          {head('#fcd3a4')}
          <div
            style={{
              width: 14 * s,
              height: 8 * s,
              borderRadius: `${2 * s}px`,
              background: '#dc2626',
              marginBottom: -2 * s,
            }}
          />
          <div
            style={{
              width: 20 * s,
              height: 16 * s,
              borderRadius: `${2 * s}px`,
              background: 'linear-gradient(180deg, #2563eb, #1d4ed8)',
              boxShadow: `inset 0 0 0 ${2 * s}px #1e40af, 0 ${2 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
            }}
          />
          {legs('#1e3a8a', '#1e40af', 6, 8)}
        </>
      );
    default:
      return wrap(<>{head('#fcd3a4')}</>);
  }
}

/**
 * HideSeekGame — find the one crowd member that matches the preview; new target & layout each round.
 */
export default function HideSeekGame({ onExit, soundManager }) {
  const reduce = useReducedMotion();
  const isLandscape = useIsLandscape();
  const lastTargetRef = useRef(null);
  const isLandscapeRef = useRef(isLandscape);
  const celebrationTimerRef = useRef(null);

  useEffect(() => {
    isLandscapeRef.current = isLandscape;
  }, [isLandscape]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [round, setRound] = useState(null);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const generateRound = useCallback(() => {
    setRound(buildNextRound(isLandscape, lastTargetRef));
  }, [isLandscape]);

  useEffect(() => {
    if (!showInstructions) generateRound();
  }, [showInstructions, generateRound]);

  useEffect(
    () => () => {
      if (celebrationTimerRef.current != null) {
        clearTimeout(celebrationTimerRef.current);
      }
    },
    []
  );

  const handleTap = useCallback(
    (typeId) => {
      if (!round || showCelebration) return;
      if (typeId === round.targetTypeId) {
        if (celebrationTimerRef.current != null) {
          clearTimeout(celebrationTimerRef.current);
        }
        setScore((s) => s + 1);
        soundManager?.playWin();
        setShowCelebration(true);
        if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
        celebrationTimerRef.current = window.setTimeout(() => {
          setShowCelebration(false);
          setCelebrationPhoto(null);
          setRound(buildNextRound(isLandscapeRef.current, lastTargetRef));
          celebrationTimerRef.current = null;
        }, 1200);
        return;
      }
      soundManager?.playEncouragement();
    },
    [round, showCelebration, isLandscape, hasPhotos, getRandomPhoto, soundManager]
  );

  const sceneHeight = isLandscape ? 'min(48vh, 360px)' : 'min(52vh, 440px)';
  /** Room above/below the bordered field so figures (anchored at feet, drawn upward) are not clipped. */
  const sceneBleedTop = isLandscape ? 'clamp(36px, 9vh, 76px)' : 'clamp(44px, 11vh, 92px)';
  const sceneBleedBottom = 'clamp(10px, 2.5vh, 20px)';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center overflow-hidden"
      style={{
        minHeight: '-webkit-fill-available',
        background:
          'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(255, 248, 220, 0.35) 0%, transparent 50%), linear-gradient(180deg, #7dd3fc 0%, #38bdf8 22%, #a3e635 22%, #4d7c0f 55%, #3f6212 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[22%] opacity-40"
        style={{
          background: `repeating-linear-gradient(90deg, transparent 0px, transparent 24px, rgba(255,255,255,0.15) 24px, rgba(255,255,255,0.15) 26px)`,
        }}
        aria-hidden
      />

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🔎" score={score} accentColor="#c2410c" />

      {!showInstructions && round && (
        <div
          className="relative z-[1] flex w-full max-w-[580px] flex-1 flex-col items-center px-2 pb-3"
          style={{
            paddingTop: isLandscape ? 2 : 'calc(48px + env(safe-area-inset-top))',
            minHeight: 0,
          }}
        >
          <h2
            className="m-0 mb-1 text-center font-display font-normal text-white"
            style={{
              fontSize: 'clamp(16px, 3.6vw, 26px)',
              textShadow: '0 2px 14px rgba(0,0,0,0.45)',
              lineHeight: 1.2,
            }}
          >
            מצאו את <strong>אפי</strong> בקהל — כמו הדמות כאן למעלה:
          </h2>

          <div
            className="mb-2 flex items-center justify-center rounded-2xl border-3 border-white/70 bg-white/25 px-4 py-2 shadow-lg backdrop-blur-sm"
            style={{
              borderWidth: 3,
              boxShadow: '0 8px 28px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            <FriendFigure typeId={round.targetTypeId} scale={isLandscape ? 1.15 : 1.35} />
          </div>

          <div
            className="relative w-full overflow-visible"
            style={{
              paddingTop: sceneBleedTop,
              paddingBottom: sceneBleedBottom,
              touchAction: 'manipulation',
            }}
          >
            <div
              className="relative w-full overflow-visible rounded-2xl border-4 border-white/50 shadow-2xl"
              style={{
                height: sceneHeight,
                maxHeight: sceneHeight,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%), #86efac',
                boxShadow: 'inset 0 0 60px rgba(34, 197, 94, 0.25), 0 12px 40px rgba(0,0,0,0.25)',
              }}
            >
              {round.figures.map((fig, idx) => (
                <div
                  key={`${round.roundKey}-${fig.id}`}
                  className="pointer-events-none absolute flex flex-col items-center justify-end"
                  style={{
                    left: `${fig.pos.x}%`,
                    top: `${fig.pos.y}%`,
                    zIndex: 10 + Math.round(fig.pos.y),
                    transform: `translate(-50%, -100%) rotate(${fig.rot}deg)`,
                  }}
                >
                  <motion.button
                    type="button"
                    className="pointer-events-auto flex flex-col items-center justify-end border-0 bg-transparent p-1"
                    style={{
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    whileTap={reduce || showCelebration ? undefined : { scale: 0.9 }}
                    onClick={() => handleTap(fig.typeId)}
                    aria-label={`דמות ${idx + 1} בקהל`}
                  >
                    <FriendFigure typeId={fig.typeId} scale={fig.scale} />
                  </motion.button>
                </div>
              ))}
            </div>
          </div>

          <p
            className="mt-1.5 mb-0 text-center font-sans text-xs text-white/90 sm:text-sm"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
          >
            אחרי כל מציאה: אפי חדש לחיפוש וכל הקהל מתערבב מחדש
          </p>
        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="למצוא את אפי 🔎"
          buttonText="בואו נחפש את אפי! 🔎"
          onStart={() => setShowInstructions(false)}
          accentColor="#c2410c"
        >
          <p>
            🎯 <strong>למעלה מופיעה אפי</strong> — רק אחד בקהל נראה בדיוק כמוה
          </p>
          <p>
            👥 <strong>כל השאר דומים אבל שונים</strong> — אל תטעו!
          </p>
          <p>
            🔄 <strong>אחרי כל מציאה</strong> אפי חדש + כולם מסתדרים מחדש
          </p>
          <p>
            ⭐ <strong>כל מציאה</strong> = נקודה
          </p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="נכון! מצאתם! 🎉"
        photo={celebrationPhoto}
        accentColor="#16A34A"
        numberOfPieces={200}
      />
    </div>
  );
}
