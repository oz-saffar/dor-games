import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useIsLandscape } from '../../hooks/useOrientation';
import { normalizeMonsterDragChompPeopleCount } from '../../lib/defaultConfig';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../../components/game';
import MonsterIllustration from '../monsterMunch/MonsterIllustration';
import PersonPuppet from './PersonPuppet';

const PERSON_HALF = 34;
const PERSON_HIT_PAD = 14;
const MONSTER_W = 152;
const MONSTER_H = 182;
const TRAY_ROW_GAP = 20;
const TRAY_ITEM_GAP_X = 16;
const TRAY_PAD_BOTTOM = 18;
const MOUTH_PAD = 18;
/** Same mouth box ratios as `MonsterMunchGame` / `MonsterIllustration` art */
const MOUTH_INSET = { leftPct: 32, widthPct: 36, topPct: 42, heightPct: 17 };

const VARIANT_POOL = ['coral', 'teal', 'amber', 'violet', 'sky'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const newUid = (prefix) =>
  `${prefix}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`;

function fitRowGap(n, w, itemW) {
  if (n <= 0) return TRAY_ITEM_GAP_X;
  let gapX = TRAY_ITEM_GAP_X;
  for (let t = 0; t < 28; t += 1) {
    const total = n * itemW + Math.max(0, n - 1) * gapX;
    if (total <= w - 20) return gapX;
    gapX = Math.max(4, gapX - 2);
  }
  return gapX;
}

function rowXs(n, w, itemW, gapX) {
  if (n <= 0) return [];
  const total = n * itemW + (n - 1) * gapX;
  const pad = 10;
  const leftEdge = clamp((w - total) / 2, pad, Math.max(pad, w - total - pad));
  return Array.from({ length: n }, (_, j) => leftEdge + itemW * 0.5 + j * (itemW + gapX));
}

/** Top → bottom row sizes (first row is visually highest on screen). */
function splitRowCounts(count) {
  if (count <= 4) return [count];
  if (count <= 8) {
    const bottom = Math.ceil(count / 2);
    return [count - bottom, bottom];
  }
  const rowSizes = [];
  let rem = count;
  let rowsLeft = 3;
  for (let i = 0; i < 3; i += 1) {
    const n = Math.ceil(rem / rowsLeft);
    rowSizes.push(n);
    rem -= n;
    rowsLeft -= 1;
  }
  return rowSizes;
}

function spawnPeoplePositions(count, isLandscape) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 400;
  const h = typeof window !== 'undefined' ? window.innerHeight : 700;
  const itemW = PERSON_HALF * 2;
  const pad = TRAY_PAD_BOTTOM + (isLandscape ? 0 : 6);
  const yMin = PERSON_HALF + 72;
  const yMax = h - PERSON_HALF - 8;

  const rowCounts = splitRowCounts(count);
  const out = [];
  for (let b = 0; b < rowCounts.length; b += 1) {
    const n = rowCounts[rowCounts.length - 1 - b];
    const gapX = fitRowGap(n, w, itemW);
    const xs = rowXs(n, w, itemW, gapX);
    const y = h - PERSON_HALF - pad - b * (2 * PERSON_HALF + TRAY_ROW_GAP);
    const yClamped = clamp(y, yMin, yMax);
    for (let i = 0; i < n; i += 1) {
      out.push({ x: xs[i] ?? w * 0.5, y: yClamped });
    }
  }
  return out;
}

function buildPeople(isLandscape, peopleCount) {
  const pos = spawnPeoplePositions(peopleCount, isLandscape);
  return Array.from({ length: peopleCount }, (_, i) => ({
    uid: newUid('p'),
    variant: VARIANT_POOL[i % VARIANT_POOL.length],
    x: pos[i]?.x ?? 80 + i * 56,
    y: pos[i]?.y ?? 400,
  }));
}

function rectsOverlap(a, b, pad = 0) {
  return !(
    a.right + pad < b.left - pad ||
    a.left - pad > b.right + pad ||
    a.bottom + pad < b.top - pad ||
    a.top - pad > b.bottom + pad
  );
}

function mouthRectFromMonsterRect(r) {
  const w = r.width;
  const h = r.height;
  const left = r.left + (MOUTH_INSET.leftPct / 100) * w;
  const top = r.top + (MOUTH_INSET.topPct / 100) * h;
  const mw = (MOUTH_INSET.widthPct / 100) * w;
  const mh = (MOUTH_INSET.heightPct / 100) * h;
  return {
    left,
    top,
    right: left + mw,
    bottom: top + mh,
    width: mw,
    height: mh,
  };
}

/**
 * Drag the monster over friend icons; chomp animation + win when the crowd is gone.
 */
export default function MonsterDragChompGame({ onExit, soundManager, peopleCount: peopleCountProp }) {
  const peopleCount = normalizeMonsterDragChompPeopleCount(peopleCountProp, 8);
  const isLandscape = useIsLandscape();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const mouthRef = useRef(null);
  const dragRef = useRef(null);
  const peopleRefs = useRef({});
  const peopleListRef = useRef([]);
  const monsterPosRef = useRef({ x: 200, y: 180 });
  const tryChompAtRef = useRef(() => false);
  const eatingUidRef = useRef(null);
  const showCelebrationRef = useRef(false);

  const [showInstructions, setShowInstructions] = useState(true);
  const [people, setPeople] = useState(() =>
    buildPeople(
      typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
      normalizeMonsterDragChompPeopleCount(peopleCountProp, 8)
    )
  );
  const [monster, setMonster] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth * 0.5 : 200,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.26 : 180,
  }));
  const [dragging, setDragging] = useState(false);
  const [mouthPhase, setMouthPhase] = useState('idle');
  const [eatingUid, setEatingUid] = useState(null);
  const [chompAt, setChompAt] = useState({ x: 0, y: 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);

  useEffect(() => {
    monsterPosRef.current = monster;
  }, [monster]);

  useEffect(() => {
    peopleListRef.current = people;
  }, [people]);

  /** Reposition crowd on rotation or settings count — not when headcount drops mid-round */
  useEffect(() => {
    if (showInstructions) return;
    setPeople(buildPeople(isLandscape, peopleCount));
    setMonster((m) => ({
      x: typeof window !== 'undefined' ? window.innerWidth * 0.5 : m.x,
      y: typeof window !== 'undefined' ? window.innerHeight * 0.26 : m.y,
    }));
  }, [isLandscape, peopleCount, showInstructions]);

  const scoreLabel = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span aria-hidden>👥</span>
      <span>{people.length}</span>
    </span>
  );

  const resetRound = useCallback(() => {
    const nx = window.innerWidth * 0.5;
    const ny = window.innerHeight * 0.26;
    monsterPosRef.current = { x: nx, y: ny };
    eatingUidRef.current = null;
    setPeople(buildPeople(isLandscape, peopleCount));
    setMonster({ x: nx, y: ny });
    setEatingUid(null);
    setMouthPhase('idle');
  }, [isLandscape, peopleCount]);

  const tryChompAt = useCallback(
    (monsterCenterX, monsterCenterY) => {
      if (eatingUidRef.current || showCelebrationRef.current) return false;

      const mouthEl = mouthRef.current;
      if (!mouthEl) return false;

      const mr = mouthEl.getBoundingClientRect();
      const mouth = {
        left: mr.left - MOUTH_PAD,
        top: mr.top - MOUTH_PAD,
        right: mr.right + MOUTH_PAD,
        bottom: mr.bottom + MOUTH_PAD,
      };

      const candidates = peopleListRef.current.filter((p) => {
        const el = peopleRefs.current[p.uid];
        if (!el) return false;
        const pr = el.getBoundingClientRect();
        const b = {
          left: pr.left - PERSON_HIT_PAD,
          top: pr.top - PERSON_HIT_PAD,
          right: pr.right + PERSON_HIT_PAD,
          bottom: pr.bottom + PERSON_HIT_PAD,
        };
        return rectsOverlap(mouth, b, 0);
      });

      if (candidates.length === 0) return false;

      let best = candidates[0];
      let bestD = Infinity;
      for (const p of candidates) {
        const el = peopleRefs.current[p.uid];
        if (!el) continue;
        const pr = el.getBoundingClientRect();
        const cx = (pr.left + pr.right) / 2;
        const cy = (pr.top + pr.bottom) / 2;
        const d = Math.hypot(cx - monsterCenterX, cy - monsterCenterY);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }

      const mRect = mouthEl.closest('.mdc-monster-wrap')?.getBoundingClientRect();
      const full = mRect || mr;
      const mshape = mouthRectFromMonsterRect(full);
      const chompX = (mshape.left + mshape.right) / 2;
      const chompY = (mshape.top + mshape.bottom) / 2;

      setChompAt({ x: chompX, y: chompY });
      eatingUidRef.current = best.uid;
      setEatingUid(best.uid);
      setMouthPhase('chew');
      soundManager?.playCorrect?.();

      const wasCount = peopleListRef.current.length;

      window.setTimeout(() => {
        eatingUidRef.current = null;
        setPeople((prev) => prev.filter((p) => p.uid !== best.uid));
        setEatingUid(null);
        setMouthPhase('idle');
        if (wasCount <= 1) {
          if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
          showCelebrationRef.current = true;
          setShowCelebration(true);
          soundManager?.playWin?.();
          window.setTimeout(() => {
            showCelebrationRef.current = false;
            setShowCelebration(false);
            setCelebrationPhoto(null);
            resetRound();
          }, 2800);
        }
      }, reduce ? 380 : 620);

      return true;
    },
    [getRandomPhoto, hasPhotos, reduce, resetRound, soundManager]
  );

  useEffect(() => {
    tryChompAtRef.current = tryChompAt;
  }, [tryChompAt]);

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nx = clamp(e.clientX - d.offsetX, MONSTER_W * 0.5 + 8, w - MONSTER_W * 0.5 - 8);
      const ny = clamp(e.clientY - d.offsetY, MONSTER_H * 0.5 + 64, h - MONSTER_H * 0.5 - 8);
      monsterPosRef.current = { x: nx, y: ny };
      setMonster({ x: nx, y: ny });
    };

    const onUp = (e) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      dragRef.current = null;
      setDragging(false);

      if (eatingUidRef.current || showCelebrationRef.current) return;

      const pos = monsterPosRef.current;
      requestAnimationFrame(() => {
        tryChompAtRef.current(pos.x, pos.y);
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
  }, []);

  const handleMonsterDown = (e) => {
    if (eatingUidRef.current || showCelebrationRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
    dragRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - monster.x,
      offsetY: e.clientY - monster.y,
    };
  };

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.code === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  return (
    <div
      className="relative h-[100dvh] min-h-[100vh] w-screen touch-none overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 85% at 50% 12%, #eef2ff 0%, #c7d2fe 32%, #a5b4fc 58%, #6366f1 92%, #312e81 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <GameBackButton onExit={onExit} />
      <GameScoreBadge label={scoreLabel} accentColor="#4338ca" />

      <div
        className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+56px)] flex justify-center px-4"
        aria-hidden
      >
        <p
          className="m-0 max-w-md rounded-full border border-indigo-900/15 bg-white/40 px-5 py-2 text-center font-sans text-dor-ink shadow-lg backdrop-blur-md"
          style={{ fontSize: isLandscape ? 15 : 16, fontWeight: 700 }}
        >
          גררו את המפלצת מעל כל חבר
        </p>
      </div>

      {!showInstructions &&
        people.map((p) => (
          <motion.div
            key={p.uid}
            ref={(el) => {
              if (el) peopleRefs.current[p.uid] = el;
              else delete peopleRefs.current[p.uid];
            }}
            role="img"
            aria-label="חבר"
            className="absolute flex touch-none items-end justify-center"
            style={{
              width: PERSON_HALF * 2,
              height: PERSON_HALF * 2 + 8,
              left: p.x - PERSON_HALF,
              top: p.y - PERSON_HALF,
              zIndex: eatingUid === p.uid ? 30 : 8,
              pointerEvents: 'none',
            }}
            animate={
              eatingUid === p.uid
                ? {
                    scale: 0.12,
                    opacity: 0,
                    x: chompAt.x - p.x,
                    y: chompAt.y - p.y,
                  }
                : { scale: 1, opacity: 1, x: 0, y: 0 }
            }
            transition={
              eatingUid === p.uid
                ? { duration: reduce ? 0.28 : 0.55, ease: [0.32, 0.72, 0.45, 1] }
                : { duration: 0.2 }
            }
          >
            <PersonPuppet variant={p.variant} scale={1.15} />
          </motion.div>
        ))}

      <motion.div
        role="application"
        aria-label="מפלצת לגרירה"
        className="mdc-monster-wrap absolute touch-none"
        style={{
          width: MONSTER_W,
          height: MONSTER_H,
          left: monster.x - MONSTER_W / 2,
          top: monster.y - MONSTER_H / 2,
          zIndex: 40,
          cursor: eatingUid || showCelebration ? 'default' : 'grab',
        }}
        animate={dragging ? { scale: 1.04 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        onPointerDown={handleMonsterDown}
      >
        <MonsterIllustration
          mouthPhase={mouthPhase}
          rejectKey={0}
          className="pointer-events-none mx-auto block h-full w-full max-h-[min(200px,26svh)] object-contain drop-shadow-[0_18px_36px_rgba(49,46,129,0.42)]"
        />
        <div
          ref={mouthRef}
          className="pointer-events-none absolute rounded-[42%] border-2 border-dashed border-violet-600/30 bg-violet-200/25"
          style={{
            left: `${MOUTH_INSET.leftPct}%`,
            width: `${MOUTH_INSET.widthPct}%`,
            top: `${MOUTH_INSET.topPct}%`,
            height: `${MOUTH_INSET.heightPct}%`,
          }}
          aria-hidden
        />
      </motion.div>

      {showInstructions && (
        <GameInstructionsOverlay
          title="מפלצת מעל החברים"
          buttonText="יאללה!"
          onStart={() => {
            const nx = window.innerWidth * 0.5;
            const ny = window.innerHeight * 0.26;
            monsterPosRef.current = { x: nx, y: ny };
            setPeople(buildPeople(isLandscape, peopleCount));
            setMonster({ x: nx, y: ny });
            setShowInstructions(false);
          }}
          accentColor="#4f46e5"
        >
          <p className="m-0 mb-3">גררו את המפלצת כך שהפה מעל חבר אייקון.</p>
          <p className="m-0 mb-3">כשהפה נוגע — המפלצת נושכת ואוכלת (בצחוק!).</p>
          <p className="m-0">כשכולם נאכלו — ניצחון גדול!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="המפלצת שבעה! כל הכבוד! 🎉"
        subtitle="סיבוב חדש מתחיל מיד"
        photo={celebrationPhoto}
        accentColor="#6366f1"
        numberOfPieces={260}
      />
    </div>
  );
}
