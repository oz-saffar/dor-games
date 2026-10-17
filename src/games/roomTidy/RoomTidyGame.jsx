import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useViewport } from '../../hooks/useViewport';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { alpha, INK, PAPER_LIGHT } from '../../lib/palette';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../../components/game';
import DollhouseScene from './DollhouseScene';
import { AVAILABLE_SCENES, pickItems } from './scenes';
import {
  ACCENT,
  CELEBRATION_MS,
  LOCK_MS,
  WOBBLE_MS,
  clamp,
  diffFor,
  isCorrectDrop,
  pxToScene,
  sceneGeometry,
  sceneToPx,
  tileSizeFor,
  trayLayout,
  zoneAt,
} from './roomTidyConfig';

const SCENE_RENDERERS = { flat: DollhouseScene };

const KEYFRAMES = `
@keyframes rtWobble {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  25% { transform: translate(-50%, -50%) rotate(-7deg); }
  75% { transform: translate(-50%, -50%) rotate(7deg); }
}
@keyframes rtLock {
  0% { transform: translate(-50%, -50%) scale(1.25); }
  60% { transform: translate(-50%, -50%) scale(0.92); }
  100% { transform: translate(-50%, -50%) scale(1); }
}
@keyframes rtHintPulse {
  0%, 100% { opacity: 0.22; }
  50% { opacity: 0.4; }
}
`;

const RoomTidyGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const cfg = diffFor(difficulty);
  // One scene today. Stage 2 adds Dor's photographed room here, and a picker
  // appears the moment `AVAILABLE_SCENES` holds more than one.
  const [scene] = useState(() => AVAILABLE_SCENES[0]);

  const [showInstructions, setShowInstructions] = useState(true);
  const [rounds, setRounds] = useState(0);
  const [roundKey, setRoundKey] = useState(1);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [items, setItems] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [hoverZoneId, setHoverZoneId] = useState(null);
  const [hoverOk, setHoverOk] = useState(false);
  const [wobbleId, setWobbleId] = useState(null);
  const [lockingId, setLockingId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);

  const containerRef = useRef(null);
  const timersRef = useRef([]);
  const dragRef = useRef(null);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const itemsRef = useRef([]);
  const geomRef = useRef(null);
  const builtRef = useRef('');
  const lockedRef = useRef(false);

  /** setTimeout that is always cleaned up on unmount. */
  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const geom = useMemo(
    () => sceneGeometry(size, scene.aspectRange, isTablet),
    [size, scene.aspectRange, isTablet]
  );

  const tile = useMemo(
    () => (geom ? tileSizeFor(cfg.items, geom.tray, isTablet) : 0),
    [geom, cfg.items, isTablet]
  );

  const traySpots = useMemo(
    () => (geom ? trayLayout(items.length, geom.tray, tile, tile) : []),
    [geom, items.length, tile]
  );

  /** Items are drawn a little smaller once they are home, so the room breathes. */
  const placedSize = geom ? Math.max(26, Math.round(geom.scene.h * 0.125)) : 0;

  useEffect(() => { geomRef.current = geom; }, [geom]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ── lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (e.code === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
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

  // ── deal a round ────────────────────────────────────────────────────────
  useEffect(() => {
    if (showInstructions) return;
    const sig = `${roundKey}:${difficulty}:${scene.id}`;
    if (builtRef.current === sig) return;
    builtRef.current = sig;
    lockedRef.current = false;

    setItems(
      pickItems(scene, cfg.items).map((it, i) => ({ ...it, trayIndex: i, placed: false }))
    );
    setDragId(null);
    setWobbleId(null);
    setLockingId(null);
    setHoverZoneId(null);
  }, [showInstructions, roundKey, difficulty, scene, cfg.items]);

  const homeOf = useCallback(
    (item) => traySpots[item.trayIndex] ?? { x: 0, y: 0 },
    [traySpots]
  );

  const busy = showCelebration || showInstructions;

  // ── completion ──────────────────────────────────────────────────────────
  const finishRound = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    soundManager?.playWin();
    setCelebrationPhoto(hasPhotos ? getRandomPhoto() : null);
    setRounds((n) => n + 1);
    setShowCelebration(true);
    schedule(() => {
      setShowCelebration(false);
      setCelebrationPhoto(null);
      setItems([]);
      setRoundKey((k) => k + 1);
    }, CELEBRATION_MS);
  }, [getRandomPhoto, hasPhotos, schedule, soundManager]);

  // ── dragging ────────────────────────────────────────────────────────────
  const handleItemPointerDown = useCallback((e, item) => {
    const g = geomRef.current;
    if (!g || busy || item.placed || dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const home = homeOf(item);
    // on touch, float the tile above the finger so it is never hidden by it
    const lift = e.pointerType === 'touch' ? tile * 0.5 + 18 : 0;

    dragRef.current = { pointerId: e.pointerId, id: item.id, dx: px - home.x, dy: py - home.y, lift };
    dragPosRef.current = { x: home.x, y: home.y - lift };
    setDragPos(dragPosRef.current);
    setDragId(item.id);
    setWobbleId(null);
    setHoverOk(false);
  }, [busy, homeOf, tile]);

  const handlePointerMove = useCallback((e) => {
    const drag = dragRef.current;
    const g = geomRef.current;
    if (!drag || !g || drag.pointerId !== e.pointerId) return;
    const rect = containerRef.current.getBoundingClientRect();
    const half = tile / 2;
    const x = clamp(e.clientX - rect.left - drag.dx, half, g.w - half);
    const y = clamp(e.clientY - rect.top - drag.dy - drag.lift, half + 8, g.h - half);
    dragPosRef.current = { x, y };
    setDragPos(dragPosRef.current);

    const item = itemsRef.current.find((it) => it.id === drag.id);
    if (!item) return;
    const { u, v } = pxToScene(x, y, g.scene);
    const zone = zoneAt(u, v, scene.zones, cfg.zonePad);
    const ok = isCorrectDrop(u, v, item, scene.zones, cfg, g.scene.w / g.scene.h);
    setHoverZoneId((prev) => (prev === (zone?.id ?? null) ? prev : zone?.id ?? null));
    setHoverOk((prev) => (prev === ok ? prev : ok));
  }, [cfg, scene.zones, tile]);

  const endDrag = useCallback((e) => {
    const drag = dragRef.current;
    const g = geomRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragId(null);
    setHoverZoneId(null);
    setHoverOk(false);
    if (!g) return;

    const item = itemsRef.current.find((it) => it.id === drag.id);
    if (!item || item.placed) return;

    const { x, y } = dragPosRef.current;
    const { u, v } = pxToScene(x, y, g.scene);

    if (!isCorrectDrop(u, v, item, scene.zones, cfg, g.scene.w / g.scene.h)) {
      // never a buzzer — the tile just shakes its head and goes back to the tray
      soundManager?.playEncouragement?.();
      setWobbleId(drag.id);
      schedule(() => setWobbleId((cur) => (cur === drag.id ? null : cur)), WOBBLE_MS);
      return;
    }

    soundManager?.playCorrect();
    setLockingId(drag.id);
    schedule(() => setLockingId((cur) => (cur === drag.id ? null : cur)), LOCK_MS);
    setItems((prev) => {
      const next = prev.map((it) => (it.id === drag.id ? { ...it, placed: true } : it));
      if (next.every((it) => it.placed)) schedule(finishRound, 320);
      return next;
    });
  }, [cfg, finishRound, scene.zones, schedule, soundManager]);

  // ── render ──────────────────────────────────────────────────────────────
  const Scene = SCENE_RENDERERS[scene.kind] ?? DollhouseScene;
  const placedCount = items.filter((it) => it.placed).length;
  const dragItem = dragId ? items.find((it) => it.id === dragId) : null;

  /** Which unplaced items show a ghost of where they belong. */
  const hinted = cfg.hints === 'all'
    ? items.filter((it) => !it.placed)
    : cfg.hints === 'active' && dragItem && !dragItem.placed
      ? [dragItem]
      : [];

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="relative h-[100dvh] min-h-[100vh] w-screen overflow-hidden select-none"
      style={{
        background: 'var(--game-surface)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <style>{KEYFRAMES}</style>

      {geom && !showInstructions && (
        <>
          {/* the house */}
          <div
            style={{
              position: 'absolute',
              left: geom.scene.x,
              top: geom.scene.y,
              width: geom.scene.w,
              height: geom.scene.h,
            }}
          >
            <Scene zones={scene.zones} hoverZoneId={hoverOk ? hoverZoneId : null} />

            {/* ghosts of where things go */}
            {hinted.map((it) => (
              <div
                key={`hint-${it.id}`}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: `${it.hx * 100}%`,
                  top: `${it.hy * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: placedSize * 0.62,
                  lineHeight: 1,
                  opacity: 0.28,
                  filter: 'grayscale(1)',
                  pointerEvents: 'none',
                  animation: reduce ? 'none' : 'rtHintPulse 2.4s ease-in-out infinite',
                }}
              >
                {it.emoji}
              </div>
            ))}

            {/* items already put away */}
            {items.filter((it) => it.placed).map((it) => {
              const p = sceneToPx(it.hx, it.hy, { x: 0, y: 0, w: geom.scene.w, h: geom.scene.h });
              return (
                <div
                  key={`placed-${it.id}`}
                  style={{
                    position: 'absolute',
                    left: p.x,
                    top: p.y,
                    width: placedSize,
                    height: placedSize,
                    transform: 'translate(-50%, -50%)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: placedSize * 0.72,
                    lineHeight: 1,
                    pointerEvents: 'none',
                    animation: lockingId === it.id && !reduce ? `rtLock ${LOCK_MS}ms ease-out` : 'none',
                    filter: `drop-shadow(0 3px 4px ${alpha(INK, 0.3)})`,
                  }}
                >
                  {it.emoji}
                </div>
              );
            })}
          </div>

          {/* tray */}
          <div
            style={{
              position: 'absolute',
              left: geom.tray.x,
              top: geom.tray.y,
              width: geom.tray.w,
              height: geom.tray.h,
              borderRadius: 20,
              background: alpha(PAPER_LIGHT, 0.5),
              border: `2px solid ${alpha(INK, 0.12)}`,
              boxShadow: `inset 0 4px 14px ${alpha(INK, 0.1)}`,
            }}
          />

          {/* the things still to put away */}
          {items.filter((it) => !it.placed).map((it) => {
            const isDrag = it.id === dragId;
            const pos = isDrag ? dragPos : homeOf(it);
            return (
              <div
                key={it.id}
                data-tap-target
                role="button"
                tabIndex={0}
                aria-label={it.label}
                onPointerDown={(e) => handleItemPointerDown(e, it)}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: tile,
                  height: tile,
                  transform: 'translate(-50%, -50%)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: tile * 0.58,
                  lineHeight: 1,
                  borderRadius: 16,
                  background: PAPER_LIGHT,
                  border: `2px solid ${isDrag && hoverOk ? ACCENT : alpha(INK, 0.14)}`,
                  boxShadow: isDrag
                    ? `0 12px 22px ${alpha(INK, 0.28)}`
                    : `0 3px 0 ${alpha(INK, 0.16)}`,
                  cursor: 'grab',
                  touchAction: 'none',
                  zIndex: isDrag ? 40 : 20,
                  transition: isDrag ? 'none' : 'box-shadow 160ms ease-out',
                  animation: wobbleId === it.id && !reduce ? `rtWobble ${WOBBLE_MS}ms ease-in-out` : 'none',
                }}
              >
                {it.emoji}
              </div>
            );
          })}

          <div
            aria-live="polite"
            style={{
              position: 'absolute',
              left: '50%',
              top: 'calc(env(safe-area-inset-top, 0px) + 22px)',
              transform: 'translateX(-50%)',
              zIndex: 70,
              // a counter is not prose: left-to-right, or "0 / 4" reads as "4 / 0"
              direction: 'ltr',
              color: INK,
              fontWeight: 800,
              fontSize: 16,
              pointerEvents: 'none',
            }}
          >
            {placedCount} / {items.length}
          </div>
        </>
      )}

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🏠" score={rounds} accentColor={ACCENT} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="מסדרים את הבית 🏠"
          buttonText="בוא נסדר! ✋"
          onStart={() => setShowInstructions(false)}
          accentColor={ACCENT}
        >
          <p style={{ marginBottom: 12 }}>🧸 <strong>גוררים חפץ</strong> אל החדר שלו.</p>
          <p style={{ marginBottom: 12 }}>🪥 מברשת שיניים לאמבטיה, 🍌 בננה למטבח.</p>
          <p style={{ marginBottom: 12 }}>✨ <strong>החדר הנכון?</strong> החפץ נכנס לבד!</p>
          <p>🎉 <strong>מסדרים הכול</strong> — וחוגגים!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="סידרת את הבית! 🎉"
        subtitle={rounds === 1 ? 'פעם אחת! 🏠' : `${rounds} פעמים! 🏠`}
        photo={celebrationPhoto}
        accentColor={ACCENT}
        numberOfPieces={200}
        onPhotoError={() => setCelebrationPhoto(null)}
      />
    </div>
  );
};

export default RoomTidyGame;
