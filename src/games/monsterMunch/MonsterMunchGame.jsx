import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GameBackButton, GameScoreBadge, GameInstructionsOverlay } from '../../components/game';
import { useIsLandscape } from '../../hooks/useOrientation';
import MonsterIllustration from './MonsterIllustration';
import MunchItemPhoto from './MunchItemPhoto';

const FOOD_SIZE = 88;
const TRAY_ROW_GAP = 18;
const TRAY_ITEM_GAP_X = 14;
/** Padding from bottom edge to bottom row centers */
const TRAY_PAD_BOTTOM = 14;
/** Vertical space reserved for two tray rows (from bottom of viewport) */
const TRAY_ZONE_HEIGHT = FOOD_SIZE * 2 + TRAY_ROW_GAP + TRAY_PAD_BOTTOM;
/** Monster anchor sits above tray so tiles never sit under the body */
const MONSTER_CLEAR_BOTTOM = TRAY_ZONE_HEIGHT + 36;
/** Extra pixels around mouth hit (screen space) */
const MOUTH_PAD = 20;
/** Mouth opening in monster SVG viewBox 420×500 — must match `MonsterIllustration.jsx` art */
const MOUTH_INSET = { leftPct: 32, widthPct: 36, topPct: 42, heightPct: 17 };

const FOOD_TYPES = [
  { id: 'donut', kind: 'donut', edible: true },
  { id: 'watermelon', kind: 'watermelon', edible: true },
  { id: 'cheese', kind: 'cheese', edible: true },
  { id: 'cookie', kind: 'cookie', edible: true },
  { id: 'broccoli', kind: 'broccoli', edible: true },
  { id: 'block', kind: 'block', edible: false },
  { id: 'crayon', kind: 'crayon', edible: false },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const shuffled = (arr) => [...arr].sort(() => Math.random() - 0.5);

const newUid = (prefix) =>
  `${prefix}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`;

function buildRoundTypes() {
  const edibles = FOOD_TYPES.filter((f) => f.edible);
  const yuck = FOOD_TYPES.filter((f) => !f.edible);
  const pickEdible = () => edibles[Math.floor(Math.random() * edibles.length)];
  const pickYuck = () => yuck[Math.floor(Math.random() * yuck.length)];

  return shuffled([
    { ...pickEdible(), uid: newUid('e1') },
    { ...pickEdible(), uid: newUid('e2') },
    { ...pickEdible(), uid: newUid('e3') },
    { ...pickYuck(), uid: newUid('n1') },
    { ...pickYuck(), uid: newUid('n2') },
  ]);
}

function rowXs(n, w) {
  if (n <= 0) return [];
  const total = n * FOOD_SIZE + (n - 1) * TRAY_ITEM_GAP_X;
  const pad = 10;
  const leftEdge = clamp((w - total) / 2, pad, w - total - pad);
  return Array.from({ length: n }, (_, j) => leftEdge + FOOD_SIZE * 0.5 + j * (FOOD_SIZE + TRAY_ITEM_GAP_X));
}

/**
 * Two non-overlapping tray rows (fewer items on upper row, more near the bottom edge).
 */
function spawnPositionsFor(count, isLandscape) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 400;
  const h = typeof window !== 'undefined' ? window.innerHeight : 700;
  const pad = TRAY_PAD_BOTTOM + (isLandscape ? 0 : 4);
  const yBottom = h - FOOD_SIZE * 0.5 - pad;
  const yTop = h - FOOD_SIZE * 1.5 - TRAY_ROW_GAP - pad;
  const yMin = FOOD_SIZE * 0.5 + 8;
  const yMax = h - FOOD_SIZE * 0.5 - 8;

  if (count <= 1) {
    const x = w * 0.5;
    const y = clamp(yBottom, yMin, yMax);
    return [{ x, y }];
  }

  const bottomRowCount = Math.ceil(count / 2);
  const topRowCount = count - bottomRowCount;
  const xsTop = rowXs(topRowCount, w);
  const xsBottom = rowXs(bottomRowCount, w);

  const out = [];
  for (let i = 0; i < topRowCount; i++) {
    out.push({ x: xsTop[i], y: clamp(yTop, yMin, yMax) });
  }
  for (let i = 0; i < bottomRowCount; i++) {
    out.push({ x: xsBottom[i], y: clamp(yBottom, yMin, yMax) });
  }
  return out;
}

function typesToPieces(types, isLandscape) {
  const pos = spawnPositionsFor(types.length, isLandscape);
  return types.map((t, i) => ({
    ...t,
    x: pos[i]?.x ?? 80 + i * 76,
    y: pos[i]?.y ?? 400,
  }));
}

/**
 * Monster Munch — drag treats into a hungry illustrated monster; toys bounce away.
 */
export default function MonsterMunchGame({ onExit, soundManager }) {
  const isLandscape = useIsLandscape();
  const reduce = useReducedMotion();
  const mouthRef = useRef(null);
  const dragRef = useRef(null);
  const piecesRef = useRef([]);

  const [showInstructions, setShowInstructions] = useState(true);
  const [pieces, setPieces] = useState(() =>
    typesToPieces(
      buildRoundTypes(),
      typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
    )
  );
  const [fedCount, setFedCount] = useState(0);
  const [mouthPhase, setMouthPhase] = useState('idle');
  const [rejectTick, setRejectTick] = useState(0);
  const [activeUid, setActiveUid] = useState(null);
  const [sparkles, setSparkles] = useState([]);

  const layoutKey = useMemo(() => `${isLandscape}-${pieces.length}`, [isLandscape, pieces.length]);

  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  useEffect(() => {
    if (showInstructions) return;
    setPieces((prev) => {
      const types = prev.map((p) => ({
        id: p.id,
        kind: p.kind,
        edible: p.edible,
        uid: p.uid,
      }));
      return typesToPieces(types, isLandscape);
    });
  }, [layoutKey, showInstructions, isLandscape]);

  const mouthContains = useCallback((cx, cy) => {
    const el = mouthRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return (
      cx >= r.left - MOUTH_PAD &&
      cx <= r.right + MOUTH_PAD &&
      cy >= r.top - MOUTH_PAD &&
      cy <= r.bottom + MOUTH_PAD
    );
  }, []);

  const burstSparkles = useCallback(
    (cx, cy) => {
      const id = Date.now();
      const n = reduce ? 6 : 14;
      const newOnes = Array.from({ length: n }, (_, i) => ({
        id: `${id}-${i}`,
        x: cx,
        y: cy,
        dx: (Math.random() - 0.5) * 120,
        dy: -20 - Math.random() * 80,
        rot: (Math.random() - 0.5) * 200,
        hue: [280, 320, 200, 40][i % 4],
      }));
      setSparkles((s) => [...s, ...newOnes]);
      window.setTimeout(() => {
        setSparkles((s) => s.filter((p) => !newOnes.find((q) => q.id === p.id)));
      }, 900);
    },
    [reduce]
  );

  const snapPieceHome = useCallback(
    (uid) => {
      setPieces((prev) => {
        const idx = prev.findIndex((p) => p.uid === uid);
        if (idx < 0) return prev;
        const pos = spawnPositionsFor(prev.length, isLandscape);
        return prev.map((p, i) => (p.uid === uid ? { ...p, x: pos[i].x, y: pos[i].y } : p));
      });
    },
    [isLandscape]
  );

  useEffect(() => {
    if (showInstructions) return;
    const noEdibles = pieces.length > 0 && !pieces.some((p) => p.edible);
    if (!noEdibles) return;
    const t = window.setTimeout(() => {
      setPieces(typesToPieces(buildRoundTypes(), isLandscape));
    }, 520);
    return () => window.clearTimeout(t);
  }, [pieces, showInstructions, isLandscape]);

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      setPieces((prev) =>
        prev.map((p) =>
          p.uid === d.uid
            ? {
                ...p,
                x: clamp(e.clientX - d.offsetX, FOOD_SIZE * 0.5 + 6, w - FOOD_SIZE * 0.5 - 6),
                y: clamp(e.clientY - d.offsetY, FOOD_SIZE * 0.5 + 6, h - FOOD_SIZE * 0.5 - 6),
              }
            : p
        )
      );
    };

    const onUp = (e) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      dragRef.current = null;
      setActiveUid(null);

      const piece = piecesRef.current.find((p) => p.uid === d.uid);
      if (!piece) return;

      if (!mouthContains(piece.x, piece.y)) {
        snapPieceHome(piece.uid);
        return;
      }

      if (!piece.edible) {
        soundManager?.playEncouragement?.();
        setMouthPhase('reject');
        setRejectTick((t) => t + 1);
        window.setTimeout(() => setMouthPhase('idle'), 480);
        snapPieceHome(piece.uid);
        return;
      }

      soundManager?.playCorrect?.();
      setMouthPhase('chew');
      window.setTimeout(() => setMouthPhase('idle'), 560);
      burstSparkles(piece.x, piece.y);
      setPieces((prev) => prev.filter((p) => p.uid !== piece.uid));
      setFedCount((c) => {
        const next = c + 1;
        if (next % 4 === 0) {
          window.setTimeout(() => soundManager?.playWin?.(), 280);
        }
        return next;
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [mouthContains, snapPieceHome, soundManager, burstSparkles]);

  const handlePointerDown = (e, piece) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setActiveUid(piece.uid);
    dragRef.current = {
      pointerId: e.pointerId,
      uid: piece.uid,
      offsetX: e.clientX - piece.x,
      offsetY: e.clientY - piece.y,
    };
  };

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.code === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  const scoreLabel = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden style={{ flexShrink: 0 }}>
        <circle cx="16" cy="14" r="9" fill="#fde68a" stroke="#ca8a04" strokeWidth="1.5" />
        <path d="M8 22c2 6 6 9 8 9s6-3 8-9" fill="none" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span>{fedCount}</span>
    </span>
  );

  return (
    <div
      className="relative h-[100dvh] min-h-[100vh] w-screen touch-none overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 18%, #fefce8 0%, #fde68a 28%, #fbbf24 52%, #ea580c 88%, #9a3412 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <GameBackButton onExit={onExit} />
      <GameScoreBadge label={scoreLabel} accentColor="#b45309" />

      <div
        className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+56px)] flex justify-center px-4"
        aria-hidden
      >
        <p
          className="m-0 max-w-md rounded-full border border-amber-900/15 bg-white/35 px-5 py-2 text-center font-sans text-dor-ink shadow-lg backdrop-blur-md"
          style={{ fontSize: isLandscape ? 15 : 16, fontWeight: 700 }}
        >
          גררו את האוכל אל הפה הרעב
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-amber-950/20 to-transparent" />

      {/* Shelf behind two tray rows */}
      <div
        className="pointer-events-none absolute inset-x-3 rounded-t-[28px] border border-amber-900/10 bg-white/25 shadow-[inset_0_2px_0_rgba(255,255,255,0.65)] backdrop-blur-sm"
        style={{
          bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
          height: TRAY_ZONE_HEIGHT + 20,
        }}
        aria-hidden
      />

      <div
        className="absolute left-1/2 w-[min(100%,480px)] -translate-x-1/2"
        style={{
          bottom: `calc(${MONSTER_CLEAR_BOTTOM}px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <div className="relative mx-auto w-full max-w-[400px]">
          <MonsterIllustration
            mouthPhase={mouthPhase}
            rejectKey={rejectTick}
            className="mx-auto block h-auto max-h-[min(380px,42svh)] w-full object-contain drop-shadow-[0_28px_48px_rgba(124,45,18,0.35)]"
          />
          <div
            ref={mouthRef}
            className="pointer-events-none absolute rounded-[42%] border-2 border-dashed border-amber-700/35 bg-amber-300/20"
            style={{
              left: `${MOUTH_INSET.leftPct}%`,
              width: `${MOUTH_INSET.widthPct}%`,
              top: `${MOUTH_INSET.topPct}%`,
              height: `${MOUTH_INSET.heightPct}%`,
            }}
            aria-hidden
          />
        </div>
      </div>

      {!showInstructions &&
        pieces.map((piece) => (
          <motion.div
            key={piece.uid}
            role="img"
            aria-label={piece.edible ? 'אוכל' : 'לא לאכילה'}
            className="absolute touch-none"
            style={{
              width: FOOD_SIZE,
              height: FOOD_SIZE,
              left: piece.x - FOOD_SIZE / 2,
              top: piece.y - FOOD_SIZE / 2,
              zIndex: activeUid === piece.uid ? 50 : 10,
              cursor: 'grab',
              filter:
                activeUid === piece.uid
                  ? 'drop-shadow(0 16px 28px rgba(124,45,18,0.45))'
                  : 'drop-shadow(0 8px 16px rgba(0,0,0,0.18))',
            }}
            animate={activeUid === piece.uid ? { scale: 1.08 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            onPointerDown={(e) => handlePointerDown(e, piece)}
          >
            <MunchItemPhoto kind={piece.kind} />
          </motion.div>
        ))}

      {sparkles.map((s) => (
        <motion.span
          key={s.id}
          className="pointer-events-none absolute z-40 h-2 w-2 rounded-full"
          style={{
            left: s.x,
            top: s.y,
            marginLeft: -4,
            marginTop: -4,
            background: `hsl(${s.hue} 90% 62%)`,
            boxShadow: `0 0 12px hsl(${s.hue} 90% 55%)`,
          }}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: 0, x: s.dx, y: s.dy, rotate: s.rot, scale: 0.2 }}
          transition={{ duration: reduce ? 0.35 : 0.75, ease: 'easeOut' }}
        />
      ))}

      {showInstructions && (
        <GameInstructionsOverlay
          title="המפלצת הרעבה"
          buttonText="בואו נאכיל!"
          onStart={() => {
            setPieces(typesToPieces(buildRoundTypes(), isLandscape));
            setShowInstructions(false);
          }}
          accentColor="#c2410c"
        >
          <p className="m-0 mb-3">גררו את החטיפים אל הפה הגדול.</p>
          <p className="m-0 mb-3">צעצועים וצבעים לא לאכילה — הם פשוט יקפצו חזרה בצחוק.</p>
          <p className="m-0">אין ניקוד אמיתי, רק הרבה נשנושים שמחים.</p>
        </GameInstructionsOverlay>
      )}
    </div>
  );
}
