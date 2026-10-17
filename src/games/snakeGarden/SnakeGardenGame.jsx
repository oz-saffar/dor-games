import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { ACCENTS, PLAY_COLORS } from '../../lib/palette';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../../components/game';
import { drawScene, burst } from './snakeArt';
import {
  ACCENT, BEAD_GAP, DIFF, EAT_WORDS, FRUITS_FOR_CELEBRATION, FRUIT_KINDS,
  GOLDEN_EVERY, GOLDEN_FRUIT, GOLDEN_WORDS, HEAD_R, IDLE_SLOW_MS, IDLE_SPEED_MUL,
  IMMUNITY_MS, MAX_BEADS, START_BEADS, WALL_SOFT,
  assistedAngle, beadRadius, clamp, pick, placeBeads, scaleFor, seedPath,
  selfBiteIndex, speedFor, spawnFruitSpot, turnToward,
} from './snakeConfig';

const EAT_COLORS = [PLAY_COLORS.yellow, ACCENTS.sage, PLAY_COLORS.orange, '#FFFDF8'];
const GOLD_COLORS = [PLAY_COLORS.yellow, ACCENTS.ochre, '#FFFDF8'];
const OOPS_COLORS = [ACCENTS.sand, ACCENTS.clay, '#FFFDF8'];

const POPUP_COLOR = { oops: ACCENTS.clay, gold: ACCENTS.ochre, eat: ACCENTS.moss };

/**
 * הנחש הרעב — steer with a finger, eat fruit, get long.
 *
 * The whole game is one rAF loop mutating a single ref; React re-renders only
 * when something a human reads changes (score, streak, a popup). The play layer
 * is a canvas, so a 100-bead snake still runs smooth on an iPad.
 *
 * Two things keep it kind to a four-year-old: the hedge steers you away instead
 * of killing you, and biting yourself costs only the length — never the game,
 * never the fruit already eaten.
 */
const SnakeGardenGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const cfg = DIFF[difficulty] ?? DIFF[GAME_DIFFICULTY.EASY];
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [popups, setPopups] = useState([]);
  const [showHint, setShowHint] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const [field, setField] = useState(null);

  const containerRef = useRef(null);
  const matRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const timersRef = useRef([]);
  const pausedRef = useRef(false);
  const waitingRef = useRef(true);
  const hintRef = useRef(true);
  const idRef = useRef(1);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const bestRef = useRef(0);

  /** The whole simulation — mutated inside the loop, never through React */
  const stateRef = useRef({
    head: { x: 0, y: 0 },
    angle: 0,
    targetAngle: 0,
    dist: 0,
    path: [],
    beads: [],
    beadCount: START_BEADS,
    fruits: [],
    sparkles: [],
    pointer: { x: 0, y: 0 },
    pointerActive: false,
    everTouched: false,
    lastInputAt: 0,
    immuneUntil: 0,
    fruitsSpawned: 0,
    headR: HEAD_R,
    gap: BEAD_GAP,
    scale: 1,
    field: null,
  });

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const addPopup = useCallback((text, x, y, tone = 'eat') => {
    idRef.current += 1;
    const id = idRef.current;
    setPopups((list) => [...list.slice(-4), { id, text, x, y, tone }]);
    schedule(() => setPopups((list) => list.filter((p) => p.id !== id)), 850);
  }, [schedule]);

  // ── lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Escape') onExit(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => { waitingRef.current = showInstructions; }, [showInstructions]);

  // The mat is positioned in CSS (safe areas and all); JS only measures it.
  useEffect(() => {
    const mat = matRef.current;
    const box = containerRef.current;
    if (!mat || !box) return undefined;

    const measure = () => {
      const m = mat.getBoundingClientRect();
      const c = box.getBoundingClientRect();
      const next = {
        x: Math.round(m.left - c.left),
        y: Math.round(m.top - c.top),
        w: Math.round(m.width),
        h: Math.round(m.height),
        cw: Math.round(c.width),
        ch: Math.round(c.height),
      };
      setField((prev) => (
        prev && prev.x === next.x && prev.y === next.y
        && Math.abs(prev.w - next.w) < 3 && Math.abs(prev.h - next.h) < 3
          ? prev
          : next
      ));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(mat);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  const playable = !!field && field.w > 60 && field.h > 60;

  /** Drop a fruit somewhere the snake is not */
  const spawnFruit = useCallback((now) => {
    const S = stateRef.current;
    const f = S.field;
    if (!f) return;
    S.fruitsSpawned += 1;
    const golden = S.fruitsSpawned % GOLDEN_EVERY === 0;
    const avoid = [S.head, ...S.beads.slice(0, 26), ...S.fruits];
    const r = cfg.fruitR * S.scale;
    const spot = spawnFruitSpot(f, avoid, S.headR * 4.5, r * 1.9);
    idRef.current += 1;
    S.fruits.push({
      id: idRef.current,
      x: spot.x,
      y: spot.y,
      r,
      kind: golden ? GOLDEN_FRUIT : pick(FRUIT_KINDS),
      golden,
      phase: Math.random() * 6.28,
      born: now,
    });
  }, [cfg.fruitR]);

  /** Lay the snake back down in the middle of the garden */
  const resetSnake = useCallback((now) => {
    const S = stateRef.current;
    const f = S.field;
    if (!f) return;
    S.head = { x: f.x + f.w / 2, y: f.y + f.h * 0.62 };
    S.angle = -Math.PI / 2;
    S.targetAngle = S.angle;
    S.beadCount = START_BEADS;
    S.dist = 0;
    S.path = seedPath(S.head.x, S.head.y, S.angle, S.beadCount * S.gap + S.headR * 4, S.gap * 0.6);
    S.beads = placeBeads(S.path, S.beadCount, S.gap)
      .map((p, i, all) => ({ ...p, r: beadRadius(i, all.length, S.headR) }));
    S.fruits = [];
    S.sparkles = [];
    S.fruitsSpawned = 0;
    S.pointerActive = false;
    S.lastInputAt = now;
    S.immuneUntil = 0;
    for (let i = 0; i < cfg.fruits; i += 1) spawnFruit(now);
  }, [cfg.fruits, spawnFruit]);

  // Field appeared, or changed shape (rotation) — re-lay the garden.
  useEffect(() => {
    if (!playable) return;
    const S = stateRef.current;
    S.field = field;
    S.scale = scaleFor(field);
    S.headR = HEAD_R * S.scale;
    S.gap = BEAD_GAP * S.scale;
    resetSnake(performance.now());
  }, [field, playable, resetSnake]);

  // ── the loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playable) return undefined;

    const S = stateRef.current;
    const canvas = canvasRef.current;
    let ctx = null;
    try {
      ctx = canvas?.getContext ? canvas.getContext('2d') : null;
    } catch {
      ctx = null;
    }

    const dpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
    const view = { w: field.cw, h: field.ch };
    if (canvas) {
      canvas.width = Math.round(view.w * dpr);
      canvas.height = Math.round(view.h * dpr);
      canvas.style.width = `${view.w}px`;
      canvas.style.height = `${view.h}px`;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /** Confetti + a photo of Dor, then straight back into the garden */
    const celebrate = () => {
      soundManager?.playWin?.();
      if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
      schedule(() => { pausedRef.current = true; setShowCelebration(true); }, 320);
      schedule(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
        S.lastInputAt = performance.now();
        pausedRef.current = false;
      }, 3320);
    };

    const simulate = (now, dt) => {
      const f = S.field;
      if (!f) return;
      const { head } = S;

      // 1. where the finger says to go (a fingertip resting on the head is not a turn)
      if (S.pointerActive) {
        const dx = S.pointer.x - head.x;
        const dy = S.pointer.y - head.y;
        if (Math.hypot(dx, dy) > S.headR * 0.9) S.targetAngle = Math.atan2(dy, dx);
      }

      // 2. the hedge nudges, it never blocks
      const desired = assistedAngle(
        head.x, head.y, S.angle, S.targetAngle, f, WALL_SOFT * S.scale,
      );
      S.angle = turnToward(S.angle, desired, cfg.turn * dt);

      // 3. travel — a snake nobody is steering ambles rather than bolts
      const idle = !S.pointerActive && now - S.lastInputAt > IDLE_SLOW_MS;
      const speed = speedFor(cfg, S.beadCount) * S.scale * (idle ? IDLE_SPEED_MUL : 1);
      const move = speed * dt;
      head.x += Math.cos(S.angle) * move;
      head.y += Math.sin(S.angle) * move;
      S.dist += move;

      const m = S.headR * 0.85;
      head.x = clamp(head.x, f.x + m, f.x + f.w - m);
      head.y = clamp(head.y, f.y + m, f.y + f.h - m);

      // 4. body — beads sampled by arc length, so the framerate can't stretch it
      S.path.push({ x: head.x, y: head.y });
      const needed = S.beadCount * S.gap + S.headR * 4;
      let span = 0;
      let cut = 0;
      for (let i = S.path.length - 1; i > 0; i -= 1) {
        span += Math.hypot(S.path[i].x - S.path[i - 1].x, S.path[i].y - S.path[i - 1].y);
        if (span > needed) { cut = i - 1; break; }
      }
      if (cut > 48) S.path.splice(0, cut);

      const pts = placeBeads(S.path, S.beadCount, S.gap);
      for (let i = 0; i < pts.length; i += 1) pts[i].r = beadRadius(i, pts.length, S.headR);
      S.beads = pts;

      // 5. fruit
      for (let i = S.fruits.length - 1; i >= 0; i -= 1) {
        const fr = S.fruits[i];
        if (Math.hypot(head.x - fr.x, head.y - fr.y) > S.headR + fr.r * 0.85) continue;

        S.fruits.splice(i, 1);
        S.beadCount = Math.min(MAX_BEADS, S.beadCount + cfg.grow * (fr.golden ? 2 : 1));
        burst(
          S, fr.x, fr.y, fr.golden ? 20 : 12,
          fr.golden ? GOLD_COLORS : EAT_COLORS, now,
          fr.golden ? 230 : 165, S.headR * 0.4,
        );

        scoreRef.current += 1;
        streakRef.current += 1;
        setScore(scoreRef.current);
        setStreak(streakRef.current);
        if (streakRef.current > bestRef.current) {
          bestRef.current = streakRef.current;
          setBest(bestRef.current);
        }
        soundManager?.playCorrect?.();
        addPopup(
          fr.golden ? pick(GOLDEN_WORDS) : pick(EAT_WORDS),
          fr.x, fr.y - S.headR * 1.4, fr.golden ? 'gold' : 'eat',
        );

        spawnFruit(now);
        if (scoreRef.current % FRUITS_FOR_CELEBRATION === 0) celebrate();
      }

      // 6. the one thing that costs you: the head meeting the body
      if (now > S.immuneUntil) {
        const bite = selfBiteIndex(head.x, head.y, S.beads, cfg.grace, S.headR);
        if (bite >= 0) {
          const at = S.beads[bite];
          burst(S, at.x, at.y, 16, OOPS_COLORS, now, 190, S.headR * 0.36);
          S.beadCount = START_BEADS;
          S.immuneUntil = now + IMMUNITY_MS;
          streakRef.current = 0;
          setStreak(0);
          soundManager?.playEncouragement?.();
          addPopup('אוֹפְּס!', at.x, at.y - S.headR * 1.4, 'oops');
        }
      }

      // 7. housekeeping
      if (S.sparkles.length) S.sparkles = S.sparkles.filter((sp) => now - sp.born < sp.life);
      const wantsHint = !S.pointerActive
        && (!S.everTouched || now - S.lastInputAt > IDLE_SLOW_MS);
      if (wantsHint !== hintRef.current) {
        hintRef.current = wantsHint;
        setShowHint(wantsHint);
      }
    };

    let last = 0;
    const step = (ts) => {
      rafRef.current = requestAnimationFrame(step);
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      // While the instructions are up the garden is painted but held still.
      if (dt > 0 && !pausedRef.current && !waitingRef.current) simulate(ts, dt);
      if (ctx) drawScene(ctx, S, view, ts);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playable, field, cfg, soundManager, hasPhotos, getRandomPhoto,
    schedule, addPopup, spawnFruit]);

  // ── steering ─────────────────────────────────────────────────────────────
  const pointAt = (e) => {
    const box = containerRef.current;
    if (!box) return;
    const S = stateRef.current;
    const r = box.getBoundingClientRect();
    S.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    S.lastInputAt = performance.now();
    S.everTouched = true;
    if (hintRef.current) {
      hintRef.current = false;
      setShowHint(false);
    }
  };

  const handleDown = (e) => {
    if (showInstructions || showCelebration) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    stateRef.current.pointerActive = true;
    pointAt(e);
  };

  const handleMove = (e) => {
    if (!stateRef.current.pointerActive) return;
    pointAt(e);
  };

  const handleUp = () => {
    const S = stateRef.current;
    S.pointerActive = false;
    S.lastInputAt = performance.now();
  };

  const matStyle = useMemo(() => ({
    position: 'absolute',
    top: 'calc(env(safe-area-inset-top, 0px) + 66px)',
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
    left: 'calc(env(safe-area-inset-left, 0px) + 12px)',
    right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
    borderRadius: 30,
    backgroundColor: 'var(--game-card)',
    backgroundImage:
      'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--game-accent) 22%, transparent) 1.3px, transparent 1.6px)',
    backgroundSize: '26px 26px',
    border: '2px dashed color-mix(in srgb, var(--game-accent) 46%, transparent)',
    boxShadow: 'inset 0 2px 16px rgba(58, 54, 48, 0.06)',
  }), []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      className="relative h-[100dvh] min-h-[100vh] w-screen select-none overflow-hidden"
      style={{
        background: 'var(--game-surface)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div ref={matRef} style={matStyle} aria-hidden />

      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
        }}
      />

      {/* how long you got this run, and the record to beat */}
      {!showInstructions && (
        <div
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            direction: 'rtl',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 16px',
            borderRadius: 999,
            fontFamily: 'var(--font-ui)',
            fontWeight: 800,
            fontSize: 16,
            whiteSpace: 'nowrap',
            color: 'var(--dor-ink)',
            backgroundColor: 'var(--dor-panel)',
            border: '1px solid var(--dor-border-strong)',
            boxShadow: '0 3px 0 var(--dor-lip), var(--dor-shadow-card)',
          }}
        >
          <span>🐍 {streak}</span>
          {best > 0 && (
            <span style={{ color: 'var(--dor-ink-muted)', fontSize: 14 }}>⭐ {best}</span>
          )}
        </div>
      )}

      <AnimatePresence>
        {popups.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              zIndex: 80,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.6 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: -30, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.2, 0.9, 0.3, 1] }}
              style={{
                direction: 'rtl',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-display)',
                fontSize: p.tone === 'gold' ? 34 : 27,
                color: POPUP_COLOR[p.tone] ?? POPUP_COLOR.eat,
                textShadow: '0 2px 0 rgba(255, 253, 248, 0.9)',
              }}
            >
              {p.text}
            </motion.div>
          </div>
        ))}
      </AnimatePresence>

      {/* the control, taught once — and again whenever the tablet goes quiet */}
      <AnimatePresence>
        {showHint && !showInstructions && !showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 34px)',
              left: '50%',
              x: '-50%',
              zIndex: 70,
              direction: 'rtl',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 20px',
              borderRadius: 999,
              pointerEvents: 'none',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 16,
              color: 'var(--dor-ink)',
              backgroundColor: 'var(--dor-panel)',
              border: '1px solid var(--dor-border)',
              boxShadow: 'var(--dor-shadow-card)',
            }}
          >
            <motion.span
              aria-hidden
              animate={reduce ? {} : { x: [0, 14, -14, 0], y: [0, -8, 6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 22 }}
            >
              👆
            </motion.span>
            גע במסך והנחש ילך לשם
          </motion.div>
        )}
      </AnimatePresence>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🍎" score={score} accentColor={ACCENT} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="הנחש הרעב 🐍"
          buttonText="בוא נאכל! 🍏"
          onStart={() => {
            stateRef.current.lastInputAt = performance.now();
            setShowInstructions(false);
          }}
          accentColor={ACCENT}
        >
          <p style={{ marginBottom: 12 }}>👆 <strong>גע במסך</strong> — הנחש הולך בדיוק לאן שהאצבע!</p>
          <p style={{ marginBottom: 12 }}>🍎 <strong>אכול את הפירות</strong> — ותראה איך הוא מתארך.</p>
          <p style={{ marginBottom: 12 }}>⭐ <strong>כוכב זהב</strong> שווה פי שתיים!</p>
          <p style={{ marginBottom: 12 }}>🌀 <strong>זהירות מהזנב</strong> — אם הראש נוגע בגוף, הנחש חוזר להיות קטן.</p>
          <p>🎉 כל {FRUITS_FOR_CELEBRATION} פירות — חגיגה!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="איזה נחש ארוך! 🐍"
        subtitle={`${score} פירות! 🎉`}
        photo={celebrationPhoto}
        accentColor={ACCENT}
        numberOfPieces={210}
      />
    </div>
  );
};

export default SnakeGardenGame;
