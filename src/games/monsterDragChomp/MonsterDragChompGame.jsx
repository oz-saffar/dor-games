import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useViewport } from '../../hooks/useViewport';
import { normalizeMonsterDragChompPeopleCount } from '../../lib/defaultConfig';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../../components/game';
import MonsterIllustration from '../monsterMunch/MonsterIllustration';
import KidIllustration from './KidIllustration';
import PersonPuppet from './PersonPuppet';
import MonsterPuppet from './MonsterPuppet';

const PERSON_HALF = 34;
const PERSON_HIT_PAD = 14;
const MONSTER_W = 152;
const MONSTER_H = 182;
const TRAY_ROW_GAP = 20;
const TRAY_ITEM_GAP_X = 16;
const TRAY_PAD_BOTTOM = 18;
const MOUTH_PAD = 18;
/** Mouth box of each eater's art, as % of its wrap — the monster's matches
 * `MonsterMunchGame` / `MonsterIllustration`, the kid's `KidIllustration`. */
const MOUTH_INSET_BY_MODE = {
  monster: { leftPct: 32, widthPct: 36, topPct: 42, heightPct: 17 },
  kid: { leftPct: 34, widthPct: 32, topPct: 51, heightPct: 17 },
};

/**
 * Who eats whom. The in-game toggle flips between the two; everything that
 * differs between them (art, Hebrew copy, icons) lives here so the drag,
 * chomp and tray maths stay a single code path.
 */
const MODES = {
  monster: {
    other: 'kid',
    Eater: MonsterIllustration,
    Prey: PersonPuppet,
    eaterLabel: 'מפלצת לגרירה',
    preyLabel: 'חבר',
    preyIcon: '👥',
    hint: 'גררו את המפלצת מעל כל חבר',
    toggleIcon: '🧒',
    toggleLabel: 'ילד אוכל מפלצות',
    title: 'מפלצת מעל החברים',
    lines: [
      'גררו את המפלצת כך שהפה מעל חבר אייקון.',
      'כשהפה נוגע — המפלצת נושכת ואוכלת (בצחוק!).',
    ],
    success: 'המפלצת שבעה! כל הכבוד! 🎉',
  },
  kid: {
    other: 'monster',
    Eater: KidIllustration,
    Prey: MonsterPuppet,
    eaterLabel: 'ילד לגרירה',
    preyLabel: 'מפלצת',
    preyIcon: '👾',
    hint: 'גררו את הילד מעל כל מפלצת',
    toggleIcon: '👾',
    toggleLabel: 'מפלצת אוכלת חברים',
    title: 'ילד מעל המפלצות',
    lines: [
      'גררו את הילד כך שהפה מעל מפלצת.',
      'כשהפה נוגע — הילד נושך ואוכל (בצחוק!).',
    ],
    success: 'הילד שבע! כל הכבוד! 🎉',
  },
};

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

function spawnPeoplePositions(count, isLandscape, scale = 1) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 400;
  const h = typeof window !== 'undefined' ? window.innerHeight : 700;
  const half = PERSON_HALF * scale;
  const itemW = half * 2;
  const pad = (TRAY_PAD_BOTTOM + (isLandscape ? 0 : 6)) * scale;
  const yMin = half + 72;
  const yMax = h - half - 8;

  const rowCounts = splitRowCounts(count);
  const out = [];
  for (let b = 0; b < rowCounts.length; b += 1) {
    const n = rowCounts[rowCounts.length - 1 - b];
    const gapX = fitRowGap(n, w, itemW);
    const xs = rowXs(n, w, itemW, gapX);
    const y = h - half - pad - b * (2 * half + TRAY_ROW_GAP * scale);
    const yClamped = clamp(y, yMin, yMax);
    for (let i = 0; i < n; i += 1) {
      out.push({ x: xs[i] ?? w * 0.5, y: yClamped });
    }
  }
  return out;
}

function buildPeople(isLandscape, peopleCount, scale = 1) {
  const pos = spawnPeoplePositions(peopleCount, isLandscape, scale);
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

function mouthRectFromMonsterRect(r, inset) {
  const w = r.width;
  const h = r.height;
  const left = r.left + (inset.leftPct / 100) * w;
  const top = r.top + (inset.topPct / 100) * h;
  const mw = (inset.widthPct / 100) * w;
  const mh = (inset.heightPct / 100) * h;
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
 * Drag the eater over the crowd; chomp animation + win when the crowd is gone.
 * The in-game toggle swaps the halves round: a monster eating friends, or a kid
 * eating monsters.
 */
export default function MonsterDragChompGame({ onExit, soundManager, peopleCount: peopleCountProp }) {
  const peopleCount = normalizeMonsterDragChompPeopleCount(peopleCountProp, 8);
  const { isLandscape, isTablet } = useViewport();
  // The whole scene is built from phone-sized pixel constants; on a tablet they
  // leave a row of thumbnail people marooned in the middle of the glass.
  const uiScale = isTablet ? 1.5 : 1;
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
  const uiScaleRef = useRef(uiScale);
  useEffect(() => {
    uiScaleRef.current = uiScale;
  }, [uiScale]);

  /** 'monster' = monster eats friends, 'kid' = kid eats monsters */
  const [mode, setMode] = useState('monster');
  const modeCfg = MODES[mode];
  const Eater = modeCfg.Eater;
  const Prey = modeCfg.Prey;
  const mouthInset = MOUTH_INSET_BY_MODE[mode];
  const mouthInsetRef = useRef(mouthInset);
  useEffect(() => {
    mouthInsetRef.current = mouthInset;
  }, [mouthInset]);

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

  /** Rebuild the crowd on rotation, mode flip or settings count — not when headcount drops mid-round */
  useEffect(() => {
    if (showInstructions) return;
    setPeople(buildPeople(isLandscape, peopleCount, uiScale));
    setMonster((m) => ({
      x: typeof window !== 'undefined' ? window.innerWidth * 0.5 : m.x,
      y: typeof window !== 'undefined' ? window.innerHeight * 0.26 : m.y,
    }));
  }, [isLandscape, uiScale, peopleCount, mode, showInstructions]);

  const bannerFontSize = Math.round((isLandscape ? 15 : 16) * (isTablet ? 1.3 : 1));

  const scoreLabel = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span aria-hidden>{modeCfg.preyIcon}</span>
      <span>{people.length}</span>
    </span>
  );

  const resetRound = useCallback(() => {
    const nx = window.innerWidth * 0.5;
    const ny = window.innerHeight * 0.26;
    monsterPosRef.current = { x: nx, y: ny };
    eatingUidRef.current = null;
    setPeople(buildPeople(isLandscape, peopleCount, uiScale));
    setMonster({ x: nx, y: ny });
    setEatingUid(null);
    setMouthPhase('idle');
  }, [isLandscape, uiScale, peopleCount]);

  const toggleMode = useCallback(() => {
    if (showCelebrationRef.current) return;
    eatingUidRef.current = null;
    setEatingUid(null);
    setMouthPhase('idle');
    setMode((m) => MODES[m].other);
  }, []);

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
      const mshape = mouthRectFromMonsterRect(full, mouthInsetRef.current);
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
      const mw = MONSTER_W * uiScaleRef.current;
      const mh = MONSTER_H * uiScaleRef.current;
      const nx = clamp(e.clientX - d.offsetX, mw * 0.5 + 8, w - mw * 0.5 - 8);
      const ny = clamp(e.clientY - d.offsetY, mh * 0.5 + 64, h - mh * 0.5 - 8);
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
          'var(--game-surface)',
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
      <GameScoreBadge label={scoreLabel} accentColor="var(--game-accent)" />

      <div
        className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+56px)] flex flex-col items-center gap-2 px-4"
        style={{ zIndex: 45 }}
      >
        <p
          className="m-0 max-w-md rounded-full border border-indigo-900/15 bg-white/40 px-5 py-2 text-center font-sans text-dor-ink shadow-lg backdrop-blur-md"
          style={{ fontSize: bannerFontSize, fontWeight: 700 }}
          aria-hidden
        >
          {modeCfg.hint}
        </p>
        <button
          type="button"
          data-tap-target
          aria-label={`להחליף ל: ${modeCfg.toggleLabel}`}
          className="dor-lip pointer-events-auto m-0 flex items-center gap-2 rounded-full border px-4 py-2 font-sans transition-transform active:scale-95"
          style={{
            fontSize: bannerFontSize,
            fontWeight: 800,
            borderColor: 'color-mix(in srgb, var(--game-accent) 55%, var(--dor-border))',
            background: 'color-mix(in srgb, var(--game-accent) 38%, var(--dor-panel))',
            color: 'var(--dor-ink)',
            touchAction: 'manipulation',
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMode();
          }}
          onClick={(e) => {
            // keyboard activation only — the tap already fired on pointerdown
            if (e.detail === 0) toggleMode();
          }}
        >
          <span aria-hidden>🔄</span>
          <span aria-hidden>{modeCfg.toggleIcon}</span>
          <span>{modeCfg.toggleLabel}</span>
        </button>
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
            aria-label={modeCfg.preyLabel}
            className="absolute flex touch-none items-end justify-center"
            style={{
              width: PERSON_HALF * 2 * uiScale,
              height: (PERSON_HALF * 2 + 8) * uiScale,
              left: p.x - PERSON_HALF * uiScale,
              top: p.y - PERSON_HALF * uiScale,
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
            <Prey variant={p.variant} scale={1.15 * uiScale} />
          </motion.div>
        ))}

      <motion.div
        role="application"
        aria-label={modeCfg.eaterLabel}
        className="mdc-monster-wrap absolute touch-none"
        style={{
          width: MONSTER_W * uiScale,
          height: MONSTER_H * uiScale,
          left: monster.x - (MONSTER_W * uiScale) / 2,
          top: monster.y - (MONSTER_H * uiScale) / 2,
          zIndex: 40,
          cursor: eatingUid || showCelebration ? 'default' : 'grab',
        }}
        animate={dragging ? { scale: 1.04 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        onPointerDown={handleMonsterDown}
      >
        <Eater
          mouthPhase={mouthPhase}
          rejectKey={0}
          className="pointer-events-none mx-auto block h-full w-full object-contain drop-shadow-[0_18px_36px_rgba(49,46,129,0.42)]"
        />
        <div
          ref={mouthRef}
          className="pointer-events-none absolute rounded-[42%] border-2 border-dashed border-violet-600/30 bg-violet-200/25"
          style={{
            left: `${mouthInset.leftPct}%`,
            width: `${mouthInset.widthPct}%`,
            top: `${mouthInset.topPct}%`,
            height: `${mouthInset.heightPct}%`,
          }}
          aria-hidden
        />
      </motion.div>

      {showInstructions && (
        <GameInstructionsOverlay
          title={modeCfg.title}
          buttonText="יאללה!"
          onStart={() => {
            const nx = window.innerWidth * 0.5;
            const ny = window.innerHeight * 0.26;
            monsterPosRef.current = { x: nx, y: ny };
            setPeople(buildPeople(isLandscape, peopleCount, uiScale));
            setMonster({ x: nx, y: ny });
            setShowInstructions(false);
          }}
          accentColor="var(--game-accent)"
        >
          {modeCfg.lines.map((line) => (
            <p key={line} className="m-0 mb-3">
              {line}
            </p>
          ))}
          <p className="m-0">כשכולם נאכלו — ניצחון גדול!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText={modeCfg.success}
        subtitle="סיבוב חדש מתחיל מיד"
        photo={celebrationPhoto}
        accentColor="var(--game-accent)"
        numberOfPieces={260}
      />
    </div>
  );
}
