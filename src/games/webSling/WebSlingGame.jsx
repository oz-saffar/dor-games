import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { useIsLandscape } from '../../hooks/useOrientation';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { GameBackButton, GameScoreBadge } from '../../components/game';
import CityBackdrop from './CityBackdrop';
import HeroSelect from './HeroSelect';
import CharacterSprite from './CharacterSprite';
import { preloadSprites, spriteAspect } from './spriteUtils';
import { WebLine, Cocoon, Splat, AlertBubble, WEB_KEYFRAMES } from './WebFx';
import {
  ACCENT, COMBO_TARGET, DIFF, HERO_BY_ID, VILLAINS, HERO_H, VILLAIN_H, HERO_HAND,
  FIRE_MS, HOLD_MS, MISS_MS,
  citySkyline, clamp, pick, rand, villainPool,
} from './webSlingConfig';

/** Vertical middle of a villain's body, in screen px. */
const centerOf = (v) => v.y - VILLAIN_H * 0.5 * v.scale;

const WebSlingGame = ({ onExit, difficulty = GAME_DIFFICULTY.EASY }) => {
  const cfg = DIFF[difficulty] ?? DIFF[GAME_DIFFICULTY.EASY];
  const isLandscape = useIsLandscape();
  const reduce = useReducedMotion();

  const [heroId, setHeroId] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboFlash, setComboFlash] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [villains, setVillains] = useState([]);
  const [shots, setShots] = useState([]);
  const [splats, setSplats] = useState([]);
  const [popups, setPopups] = useState([]);
  const [aimRad, setAimRad] = useState(-1.15);
  const [firing, setFiring] = useState(false);

  const containerRef = useRef(null);
  const villainsRef = useRef([]);
  const geomRef = useRef(null);
  const timersRef = useRef([]);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const spawnRef = useRef(600);
  const idRef = useRef(1);
  const pausedRef = useRef(false);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const usedSlotsRef = useRef(new Set());
  const recentSlotsRef = useRef([]);
  const shake = useAnimation();

  const hero = HERO_BY_ID[heroId] ?? HERO_BY_ID.spidey;

  useEffect(() => { preloadSprites(); }, []);

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
    () => (size.w > 0 && size.h > 0 ? citySkyline(size.w, size.h, isLandscape) : null),
    [size.w, size.h, isLandscape],
  );

  useEffect(() => { geomRef.current = geom; }, [geom]);

  const heroPos = geom
    ? { x: geom.w / 2, y: geom.h - 92, s: geom.baseScale * 0.95 }
    : { x: 0, y: 0, s: 1 };

  const heroH = HERO_H * heroPos.s;
  const heroW = heroH * spriteAspect(hero.id);
  const handOffset = HERO_HAND[hero.id] ?? HERO_HAND.spidey;
  const handWorld = {
    x: heroPos.x + handOffset.fx * heroW,
    y: heroPos.y + handOffset.fy * heroH,
  };
  // the whole hero leans toward the shot, since the sprite has no posable arm
  const leanDeg = clamp(((aimRad + Math.PI / 2) * 180) / Math.PI, -22, 22) * 0.32;

  // ── spawning + movement ────────────────────────────────────────────────
  useEffect(() => {
    if (!heroId) return undefined;
    lastTsRef.current = 0;

    const spawn = (g) => {
      const kind = pick(villainPool(scoreRef.current));
      const V = VILLAINS[kind];
      const scale = g.baseScale * V.size;
      idRef.current += 1;

      if (V.behavior === 'fly') {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const bandTop = g.horizon - 200;
        const bandBottom = g.horizon - 60;
        villainsRef.current.push({
          id: idRef.current,
          kind,
          behavior: 'fly',
          x: dir > 0 ? -110 : g.w + 110,
          y: rand(bandTop, bandBottom),
          dir,
          speed: rand(cfg.flySpeed[0], cfg.flySpeed[1]),
          scale,
          rise: 1,
          state: 'idle',
          life: Infinity,
          slot: -1,
        });
        return;
      }

      const free = g.slots
        .map((s, i) => i)
        .filter((i) => !usedSlotsRef.current.has(i));
      if (free.length === 0) return;

      // Prefer perches that haven't been used lately, so villains move around
      // the skyline instead of reappearing on the same two or three roofs.
      const recent = recentSlotsRef.current;
      const fresh = free.filter((i) => !recent.includes(i));
      const slotIdx = pick(fresh.length > 0 ? fresh : free);
      const slot = g.slots[slotIdx];
      usedSlotsRef.current.add(slotIdx);
      recent.push(slotIdx);
      while (recent.length > Math.max(2, Math.floor(g.slots.length * 0.5))) recent.shift();

      // nudge along the ledge so even a repeat perch isn't pixel-identical
      const jitter = Math.max(0, slot.w / 2 - 46);
      const px = clamp(slot.x + rand(-jitter, jitter), 54, g.w - 54);

      villainsRef.current.push({
        id: idRef.current,
        kind,
        behavior: 'pop',
        x: px,
        y: slot.ledge,
        ledge: slot.ledge,
        scale,
        rise: 0,
        dirRise: 1,
        state: 'rise',
        life: rand(cfg.visibleMs[0], cfg.visibleMs[1]) * V.popMul,
        slot: slotIdx,
      });
    };

    const step = (ts) => {
      rafRef.current = requestAnimationFrame(step);
      const prev = lastTsRef.current || ts;
      lastTsRef.current = ts;
      const dt = Math.min(0.1, (ts - prev) / 1000);
      const g = geomRef.current;
      if (!g || pausedRef.current) return;

      spawnRef.current -= dt * 1000;
      const liveCount = villainsRef.current.filter((v) => v.state !== 'wrapped').length;
      if (spawnRef.current <= 0) {
        spawnRef.current = rand(cfg.spawnMs[0], cfg.spawnMs[1]);
        if (liveCount < cfg.maxActive) spawn(g);
      }

      const alive = [];
      for (const v of villainsRef.current) {
        if (v.state === 'wrapped') { alive.push(v); continue; }

        if (v.behavior === 'fly') {
          v.x += v.dir * v.speed * dt;
          if (v.x < -160 || v.x > g.w + 160) continue;
          v.y += Math.sin(ts / 600 + v.id) * 12 * dt;
        } else if (v.state === 'rise') {
          v.rise = Math.min(1, v.rise + (dt * 1000) / cfg.riseMs);
          if (v.rise >= 1) v.state = 'idle';
        } else if (v.state === 'idle') {
          v.life -= dt * 1000;
          if (v.life <= 0) v.state = 'duck';
        } else if (v.state === 'duck') {
          v.rise -= (dt * 1000) / cfg.riseMs;
          if (v.rise <= 0) { usedSlotsRef.current.delete(v.slot); continue; }
        }
        alive.push(v);
      }
      villainsRef.current = alive;

      setVillains(alive.map((v) => ({
        id: v.id, kind: v.kind, behavior: v.behavior, x: v.x, y: v.y,
        ledge: v.ledge, scale: v.scale, rise: v.rise, state: v.state,
        dir: v.dir ?? 1, life: v.life,
      })));
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [heroId, cfg]);

  // ── juice helpers ──────────────────────────────────────────────────────
  const addPopup = (text, x, y, tone) => {
    idRef.current += 1;
    const id = idRef.current;
    setPopups((list) => [...list, { id, text, x, y, tone }]);
    schedule(() => setPopups((list) => list.filter((p) => p.id !== id)), 1000);
  };

  const addShot = (to) => {
    idRef.current += 1;
    const id = idRef.current;
    setShots((list) => [...list, { id, from: { ...handWorld }, to }]);
    schedule(() => setShots((list) => list.filter((s) => s.id !== id)), FIRE_MS + 190);
  };

  const doShake = (big) => {
    if (reduce) return;
    shake.start(big
      ? { x: [0, -10, 9, -5, 3, 0], y: [0, 6, -5, 3, -1, 0], transition: { duration: 0.4, ease: 'easeOut' } }
      : { x: [0, -4, 4, -2, 0], transition: { duration: 0.26, ease: 'easeOut' } });
  };

  // ── the tap ────────────────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    if (!heroId || pausedRef.current) return;
    const el = containerRef.current;
    const g = geomRef.current;
    if (!el || !g) return;

    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // aim at wherever the finger landed
    const ang = Math.atan2(py - handWorld.y, px - handWorld.x);
    const aim = clamp(ang, -Math.PI * 0.94, -0.12);
    setAimRad(aim);
    setFiring(true);
    schedule(() => setFiring(false), 210);

    // nearest villain under the finger
    let target = null;
    let best = Infinity;
    for (const v of villainsRef.current) {
      if (v.state === 'wrapped') continue;
      if (v.behavior === 'pop' && v.rise < 0.45) continue;
      const cy = centerOf(v);
      const d = Math.hypot(v.x - px, cy - py);
      const radius = VILLAINS[v.kind].hit * v.scale + cfg.hitBonus;
      if (d <= radius && d < best) { best = d; target = v; }
    }

    if (!target) {
      addShot({ x: px, y: py });
      idRef.current += 1;
      const id = idRef.current;
      setSplats((list) => [...list, { id, x: px, y: py }]);
      schedule(() => setSplats((list) => list.filter((s) => s.id !== id)), MISS_MS + 60);
      comboRef.current = 0;
      setCombo(0);
      doShake(false);
      return;
    }

    const cy = centerOf(target);
    addShot({ x: target.x, y: cy });
    target.state = 'wrapped';
    if (target.behavior === 'pop') usedSlotsRef.current.delete(target.slot);
    schedule(() => {
      villainsRef.current = villainsRef.current.filter((v) => v.id !== target.id);
    }, HOLD_MS);

    doShake(true);
    addPopup(VILLAINS[target.kind].cheer, target.x, cy - 96 * target.scale, 'hit');

    comboRef.current += 1;
    setCombo(comboRef.current);
    if (comboRef.current % COMBO_TARGET === 0) {
      setComboFlash(comboRef.current);
      schedule(() => setComboFlash(0), 1200);
    }

    scoreRef.current += 1;
    setScore(scoreRef.current);
  };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative h-[100dvh] min-h-[100vh] w-screen overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg,#1a1c5c 0%,#3b2a86 26%,#8a3d92 50%,#e0645e 70%,#ffd27a 100%)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <style>{WEB_KEYFRAMES}</style>

      {geom && (
        <motion.div animate={shake} style={{ position: 'absolute', inset: 0 }}>
          <CityBackdrop geom={geom} reduce={reduce} />

          <svg
            viewBox={`0 0 ${geom.w} ${geom.h}`}
            width={geom.w}
            height={geom.h}
            style={{ position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <defs>
              {villains
                .filter((v) => v.behavior === 'pop')
                .map((v) => (
                  <clipPath key={`clip-${v.id}`} id={`wsClip${v.id}`}>
                    <rect x={v.x - 180} y={v.ledge - 900} width="360" height={900} />
                  </clipPath>
                ))}
            </defs>

            {/* villains */}
            {villains.map((v) => {
              const vh = VILLAIN_H * v.scale;
              const hidden = v.behavior === 'pop' ? (1 - v.rise) * (vh + 12) : 0;
              const warn = v.behavior === 'pop' && v.state === 'idle' && v.life < 620;
              return (
                <g
                  key={v.id}
                  data-villain={v.kind}
                  data-state={v.state}
                  clipPath={v.behavior === 'pop' ? `url(#wsClip${v.id})` : undefined}
                >
                  <g transform={`translate(${v.x}, ${v.y + hidden})`}>
                    {v.state === 'wrapped' ? (
                      <g transform={`scale(${v.scale})`}>
                        <Cocoon reduce={reduce} />
                      </g>
                    ) : (
                      <CharacterSprite
                        id={v.kind}
                        height={vh}
                        flip={v.behavior === 'fly' && v.dir < 0}
                      />
                    )}
                  </g>
                  {warn && v.state !== 'wrapped' && (
                    <g transform={`translate(${v.x + 46 * v.scale}, ${v.y - 126 * v.scale})`}>
                      <AlertBubble reduce={reduce} />
                    </g>
                  )}
                </g>
              );
            })}

            {/* web splats on a miss */}
            {splats.map((s) => (
              <g key={s.id} transform={`translate(${s.x}, ${s.y})`}>
                <Splat color={hero.webColor} reduce={reduce} />
              </g>
            ))}

            {/* web lines */}
            {shots.map((s) => (
              <WebLine
                key={s.id}
                x1={s.from.x}
                y1={s.from.y}
                x2={s.to.x}
                y2={s.to.y}
                color={hero.webColor}
                ms={FIRE_MS}
                reduce={reduce}
              />
            ))}

            {/* the hero on the near rooftop */}
            <g transform={`translate(${heroPos.x}, ${heroPos.y})`}>
              <ellipse cx="0" cy="4" rx={heroW * 0.42} ry="9" fill="#0b1020" opacity="0.34" />
              <g
                style={
                  reduce ? undefined : { animation: 'wsHeroBob 2.4s ease-in-out infinite' }
                }
              >
                <g
                  transform={`rotate(${leanDeg}) scale(${firing ? 1.04 : 1})`}
                  style={{ transition: 'transform 120ms ease-out' }}
                >
                  <CharacterSprite id={hero.id} height={heroH} />
                </g>
              </g>
              {/* web fluid flashing at the glove */}
              {firing && (
                <g transform={`translate(${handOffset.fx * heroW}, ${handOffset.fy * heroH})`}>
                  <circle r={15 * heroPos.s} fill={hero.glow} opacity="0.45" />
                  <circle r={7 * heroPos.s} fill="#ffffff" opacity="0.9" />
                </g>
              )}
            </g>
          </svg>

          {/* comic popups */}
          {popups.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'absolute', left: p.x, top: p.y, zIndex: 40,
                transform: 'translate(-50%, 0)', direction: 'rtl', whiteSpace: 'nowrap',
                pointerEvents: 'none', fontWeight: 900,
                fontSize: 'clamp(20px, 5vw, 30px)',
                color: '#fffbeb',
                textShadow: `0 3px 0 ${hero.suitB}, 0 0 24px ${hero.glow}`,
                animation: 'wsPopup 1000ms cubic-bezier(0.2,0.9,0.3,1) forwards',
              }}
            >
              {p.text}
            </div>
          ))}
        </motion.div>
      )}

      {/* combo counter */}
      {combo >= 2 && heroId && (
        <div
          aria-live="polite"
          style={{
            position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 74px)', left: '50%',
            transform: 'translateX(-50%)', zIndex: 90, direction: 'rtl',
            padding: '6px 16px', borderRadius: 999, fontWeight: 900, fontSize: 18,
            color: '#fff7ed', background: 'rgba(17, 22, 48, 0.72)',
            border: `2px solid ${hero.glow}`,
            animation: reduce ? 'none' : 'wsComboGlow 1.1s ease-in-out infinite',
          }}
        >
          🔥 {combo}
        </div>
      )}

      {comboFlash > 0 && (
        <div
          style={{
            position: 'absolute', top: '28%', left: '50%', zIndex: 95,
            transform: 'translateX(-50%)',
            direction: 'rtl', fontSize: 'clamp(30px, 9vw, 52px)', fontWeight: 900,
            color: '#ffe066',
            textShadow: `0 4px 0 ${hero.suitB}, 0 0 34px ${hero.glow}`,
            pointerEvents: 'none', whiteSpace: 'nowrap',
            animation: 'wsPopup 1200ms ease-out forwards',
          }}
        >
          צוות ספיידי! 🕷️
        </div>
      )}

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🕸️" score={score} accentColor={ACCENT} />

      {!heroId && <HeroSelect onPick={setHeroId} accentColor={ACCENT} />}
    </div>
  );
};

export default WebSlingGame;
