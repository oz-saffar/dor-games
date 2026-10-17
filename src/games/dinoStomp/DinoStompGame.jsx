import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useIsLandscape } from '../../hooks/useOrientation';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../../components/game';
import CanyonBackdrop from './CanyonBackdrop';
import DinoOverhead from './DinoOverhead';
import RunningKid from './RunningKid';
import StompFoot, { TelegraphShadow } from './StompFoot';
import ImpactFx from './ImpactFx';
import { STOMP_KEYFRAMES } from './stompStyles';
import {
  ACCENT, CATCHES_FOR_CELEBRATION, COMBO_TARGET, DIFF, KID_VARIANTS,
  SLAM_MS, IMPACT_MS, PULL_MS, SQUISH_MS, BOUNCE_MS,
  clamp, laneAt, laneGeometry, pick, rand, randInt,
} from './stompConfig';

const DinoStompGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const cfg = DIFF[difficulty] ?? DIFF[GAME_DIFFICULTY.EASY];
  const isLandscape = useIsLandscape();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboFlash, setComboFlash] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [kids, setKids] = useState([]);
  const [footState, setFootState] = useState('idle');
  const [footTarget, setFootTarget] = useState({ x: 0, lane: 0 });
  const [fx, setFx] = useState([]);
  const [popups, setPopups] = useState([]);

  const containerRef = useRef(null);
  const kidsRef = useRef([]);
  const geomRef = useRef(null);
  const timersRef = useRef([]);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const spawnRef = useRef(700);
  const idRef = useRef(1);
  const busyRef = useRef(false);
  const pausedRef = useRef(false);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const sideRef = useRef(1);
  const shake = useAnimation();

  /** setTimeout that always gets cleaned up on unmount */
  const schedule = (fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  };

  // ── lifecycle ──────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (e.code === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geom = useMemo(
    () => (size.w > 0 && size.h > 0 ? laneGeometry(cfg.lanes, size.w, size.h, isLandscape) : null),
    [cfg.lanes, size.w, size.h, isLandscape],
  );

  useEffect(() => {
    geomRef.current = geom;
    if (geom) setFootTarget((p) => (p.x === 0 ? { x: geom.w / 2, lane: geom.lanes - 1 } : p));
  }, [geom]);

  // ── the one rAF loop: spawning + running kids ──────────────────────────
  useEffect(() => {
    if (showInstructions) return undefined;
    lastTsRef.current = 0;

    const step = (ts) => {
      rafRef.current = requestAnimationFrame(step);
      const prev = lastTsRef.current || ts;
      lastTsRef.current = ts;
      const dt = Math.min(0.1, (ts - prev) / 1000);
      const g = geomRef.current;
      if (!g || pausedRef.current) return;

      spawnRef.current -= dt * 1000;
      if (spawnRef.current <= 0) {
        spawnRef.current = rand(cfg.spawnMs[0], cfg.spawnMs[1]);
        if (kidsRef.current.length < cfg.maxKids) {
          const lane = randInt(0, g.lanes - 1);
          const dir = sideRef.current;
          sideRef.current = -dir;
          const startX = dir > 0 ? -70 : g.w + 70;
          const busyLane = kidsRef.current.some(
            (k) => k.lane === lane && Math.abs(k.x - startX) < 150,
          );
          if (!busyLane) {
            const speed = rand(cfg.kidSpeed[0], cfg.kidSpeed[1]);
            idRef.current += 1;
            kidsRef.current.push({
              id: idRef.current,
              lane, dir, speed,
              x: startX,
              variant: pick(KID_VARIANTS),
              stepMs: Math.round(clamp(52000 / speed, 220, 900)),
              state: 'run',
            });
          }
        }
      }

      const alive = [];
      for (const k of kidsRef.current) {
        if (k.state === 'run') {
          k.x += k.dir * k.speed * dt;
          if (k.x < -160 || k.x > g.w + 160) continue;
        } else if (k.state === 'bounce') {
          k.x += k.dir * 30 * dt;
        }
        alive.push(k);
      }
      kidsRef.current = alive;
      setKids(alive.map((k) => ({
        id: k.id, lane: k.lane, dir: k.dir, x: k.x,
        variant: k.variant, stepMs: k.stepMs, state: k.state,
      })));
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [showInstructions, cfg]);

  // ── juice helpers ──────────────────────────────────────────────────────
  const addFx = (kind, x, y, scale) => {
    idRef.current += 1;
    const id = idRef.current;
    setFx((list) => [...list, { id, kind, x, y, scale }]);
    schedule(() => setFx((list) => list.filter((e) => e.id !== id)), 1150);
  };

  const addPopup = (text, x, y, tone) => {
    idRef.current += 1;
    const id = idRef.current;
    setPopups((list) => [...list, { id, text, x, y, tone }]);
    schedule(() => setPopups((list) => list.filter((e) => e.id !== id)), 1000);
  };

  const doShake = (big) => {
    if (reduce) return;
    shake.start(big
      ? { x: [0, -14, 12, -8, 5, 0], y: [0, 10, -7, 4, -2, 0], transition: { duration: 0.46, ease: 'easeOut' } }
      : { x: [0, -6, 5, -3, 0], y: [0, 4, -3, 2, 0], transition: { duration: 0.3, ease: 'easeOut' } });
  };

  const celebrate = () => {
    soundManager?.playWin();
    if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
    schedule(() => { pausedRef.current = true; setShowCelebration(true); }, 380);
    schedule(() => {
      setShowCelebration(false);
      setCelebrationPhoto(null);
      kidsRef.current = [];
      setKids([]);
      setFx([]);
      setPopups([]);
      spawnRef.current = 500;
      pausedRef.current = false;
      busyRef.current = false;
      setFootState('idle');
    }, 380 + 3100);
  };

  // ── the stomp ──────────────────────────────────────────────────────────
  const resolveImpact = (x, lane) => {
    const g = geomRef.current;
    if (!g) return;
    const band = g.bands[lane];
    const pad = cfg.hitPad + 20 * band.scale;

    let target = null;
    let best = Infinity;
    for (const k of kidsRef.current) {
      if (k.state !== 'run' || k.lane !== lane) continue;
      const d = Math.abs(k.x - x);
      if (d <= pad && d < best) { best = d; target = k; }
    }

    if (target) {
      target.state = 'squish';
      schedule(() => { target.state = 'bounce'; }, SQUISH_MS);
      schedule(() => {
        kidsRef.current = kidsRef.current.filter((k) => k.id !== target.id);
      }, SQUISH_MS + BOUNCE_MS);

      soundManager?.playCorrect();
      addFx('hit', x, band.y, band.scale * 1.15);
      addPopup('בּוּם!', x, band.y - 95 * band.scale, 'hit');
      doShake(true);

      comboRef.current += 1;
      setCombo(comboRef.current);
      if (comboRef.current % COMBO_TARGET === 0) {
        setComboFlash(comboRef.current);
        addFx('hit', x, band.y, band.scale * 1.6);
        schedule(() => setComboFlash(0), 1200);
      }

      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFootState('impact');
      schedule(() => { setFootState('idle'); busyRef.current = false; }, IMPACT_MS + 80);
      if (scoreRef.current % CATCHES_FOR_CELEBRATION === 0) celebrate();
    } else {
      soundManager?.playEncouragement?.();
      addFx('miss', x, band.y, band.scale);
      addPopup('אוּפְּס!', x, band.y - 70 * band.scale, 'miss');
      doShake(false);
      comboRef.current = 0;
      setCombo(0);
      setFootState('stuck');
      schedule(() => setFootState('pull'), cfg.stuckMs);
      schedule(() => { setFootState('idle'); busyRef.current = false; }, cfg.stuckMs + PULL_MS);
    }
  };

  const handlePointerDown = (e) => {
    if (showInstructions || showCelebration) return;
    const el = containerRef.current;
    const g = geomRef.current;
    if (!el || !g || busyRef.current || pausedRef.current) return;
    const rect = el.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 34, rect.width - 34);
    const lane = laneAt(g, e.clientY - rect.top);

    busyRef.current = true;
    setFootTarget({ x, lane });
    setFootState('telegraph');
    schedule(() => {
      setFootState('slam');
      schedule(() => resolveImpact(x, lane), SLAM_MS);
    }, cfg.telegraphMs);
  };

  // ── derived render values ──────────────────────────────────────────────
  const band = geom ? geom.bands[Math.min(footTarget.lane, geom.lanes - 1)] : null;
  const hoverY = geom ? geom.top - 34 : 0;
  // keep the foot big but never much wider than the window it actually hits
  const footScale = geom && band ? geom.baseScale * (0.46 + 0.22 * band.t) : 0.55;
  const hitWidth = band ? (cfg.hitPad + 20 * band.scale) * 2 : 0;
  const footY = !geom ? 0
    : footState === 'idle' ? hoverY
      : footState === 'telegraph' ? hoverY - 36
        : band.y;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative h-[100dvh] min-h-[100vh] w-screen overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg,#6b5f6e 0%,#8d7280 14%,#c08b7a 30%,#d9a887 44%,#e8cfa8 54%,#c9a87f 62%,#9c8464 100%)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <style>{STOMP_KEYFRAMES}</style>

      {geom && (
        <motion.div animate={shake} style={{ position: 'absolute', inset: 0 }}>
          <CanyonBackdrop geom={geom} reduce={reduce} />
          <DinoOverhead horizon={geom.top} scale={geom.baseScale} reduce={reduce} />

          {kids.map((k) => {
            const b = geom.bands[k.lane];
            return (
              <div
                key={k.id}
                style={{
                  position: 'absolute', left: 0, top: 0, width: 0, height: 0,
                  transform: `translate3d(${k.x}px, ${b.y}px, 0) scale(${b.scale})`,
                  transformOrigin: '0 0',
                  zIndex: 10 + k.lane,
                  filter: `saturate(${1 - b.haze}) brightness(${1 + b.haze * 0.3})`,
                }}
              >
                <div style={{
                  position: 'absolute', left: -27, top: -7, width: 54, height: 14,
                  borderRadius: '50%', background: 'rgba(58,26,8,0.34)', filter: 'blur(2px)',
                }} />
                <RunningKid variant={k.variant} state={k.state} dir={k.dir} stepMs={k.stepMs} reduce={reduce} />
              </div>
            );
          })}

          {(footState === 'telegraph' || footState === 'slam') && band && (
            <TelegraphShadow x={footTarget.x} y={band.y} w={hitWidth} ms={cfg.telegraphMs} />
          )}

          <StompFoot
            x={footTarget.x}
            y={footY}
            scale={footScale}
            state={footState}
            telegraphMs={cfg.telegraphMs}
            reduce={reduce}
          />

          {fx.map((e) => (
            <ImpactFx key={e.id} x={e.x} y={e.y} scale={e.scale} kind={e.kind} reduce={reduce} />
          ))}

          {popups.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'absolute', left: p.x, top: p.y, zIndex: 40,
                transform: 'translate(-50%,0)', direction: 'rtl', whiteSpace: 'nowrap',
                pointerEvents: 'none', fontWeight: 900,
                fontSize: p.tone === 'hit' ? 40 : 27,
                color: p.tone === 'miss' ? '#fde68a' : '#fffbeb',
                textShadow: '0 3px 0 rgba(120,53,15,0.95), 0 0 24px rgba(251,191,36,0.75)',
                animation: 'dsPopup 1000ms cubic-bezier(0.2,0.9,0.3,1) forwards',
              }}
            >
              {p.text}
            </div>
          ))}
        </motion.div>
      )}

      {/* combo counter */}
      {combo >= 2 && !showInstructions && (
        <div
          aria-live="polite"
          style={{
            position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 74px)', left: '50%',
            transform: 'translateX(-50%)', zIndex: 90, direction: 'rtl',
            padding: '6px 16px', borderRadius: 999, fontWeight: 900, fontSize: 18,
            color: '#fff7ed', background: 'rgba(120,53,15,0.72)',
            border: '2px solid rgba(253,224,71,0.75)',
            animation: reduce ? 'none' : 'dsComboGlow 1.1s ease-in-out infinite',
          }}
        >
          🔥 {combo}
        </div>
      )}

      {comboFlash > 0 && (
        <div
          style={{
            position: 'absolute', top: '30%', left: '50%', zIndex: 95,
            direction: 'rtl', fontSize: 52, fontWeight: 900, color: '#fde047',
            textShadow: '0 4px 0 #7c2d12, 0 0 34px rgba(251,191,36,0.95)',
            pointerEvents: 'none', whiteSpace: 'nowrap',
            animation: 'dsComboPop 1200ms ease-out forwards',
          }}
        >
          משולש! 🔥
        </div>
      )}

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🦖" score={score} accentColor={ACCENT} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="רעידת אדמה 🦖"
          buttonText="בוא נרעיד! 🦶"
          onStart={() => setShowInstructions(false)}
          accentColor={ACCENT}
        >
          <p style={{ marginBottom: 12 }}>👣 <strong>לחץ על השביל</strong> — הרגל הענקית תרד בדיוק לשם!</p>
          <p style={{ marginBottom: 12 }}>🏃 <strong>כוון קצת לפני הילד</strong> — הוא רץ מהר!</p>
          <p style={{ marginBottom: 12 }}>💥 <strong>פגעת?</strong> הילד עף עם כוכבים וצוחק!</p>
          <p>🎉 <strong>כל {CATCHES_FOR_CELEBRATION} בומים</strong> — חגיגה גדולה!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="בּוּם! 🦖"
        subtitle={`${score} בומים! 🎉`}
        photo={celebrationPhoto}
        accentColor={ACCENT}
        numberOfPieces={230}
      />
    </div>
  );
};

export default DinoStompGame;
