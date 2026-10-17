import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useViewport } from '../../hooks/useViewport';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { alpha, INK, PAPER_LIGHT } from '../../lib/palette';
import {
  GameBackButton, GameScoreBadge, GameInstructionsOverlay, GameCelebrationOverlay,
} from '../../components/game';
import { tileSizeFor, trayLayout } from '../roomTidy/roomTidyConfig';
import KitchenCabinet from './KitchenCabinet';
import { ItemIcon } from './KitchenItems';
import { createKitchenSfx } from './kitchenAudio';
import {
  MODE, SETTLE_MS, WOBBLE_MS, DOORS_MS, NEXT_ROUND_MS,
  clamp, generateRound, kitchenGeometry, shelfIndexAt, slotPosition,
} from './kitchenSortConfig';

const ACCENT = 'var(--game-accent)';
const TAP_SLOP = 10;

const KEYFRAMES = `
@keyframes ksWobble {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  25% { transform: translate(-50%, -50%) rotate(-8deg); }
  75% { transform: translate(-50%, -50%) rotate(8deg); }
}
@keyframes ksSettle {
  0% { transform: translate(-50%, -50%) translateY(-7px); }
  55% { transform: translate(-50%, -50%) translateY(2px); }
  100% { transform: translate(-50%, -50%) translateY(0); }
}
`;

const KitchenSortGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const { width, height, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [showInstructions, setShowInstructions] = useState(true);
  const [rounds, setRounds] = useState(0);
  const [round, setRound] = useState(() => generateRound(difficulty, MODE.COLOR));
  const [slots, setSlots] = useState({}); // itemId -> { shelf, slot }
  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [wobbleId, setWobbleId] = useState(null);
  const [settleId, setSettleId] = useState(null);
  const [doorsClosed, setDoorsClosed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [photo, setPhoto] = useState(null);

  const timers = useRef([]);
  const sfx = useRef(null);
  const drag = useRef(null);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const slotsRef = useRef({});
  const doneRef = useRef(false);
  const containerRef = useRef(null);

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    sfx.current = createKitchenSfx();
    const list = timers;
    const audio = sfx;
    return () => {
      list.current.forEach(clearTimeout);
      audio.current?.close();
    };
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.code === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  const geom = useMemo(
    () => kitchenGeometry(width, height, isTablet, round.shelves.length, round.items.length),
    [width, height, isTablet, round.shelves.length, round.items.length]
  );
  const tile = geom ? tileSizeFor(round.items.length, geom.tray, isTablet) : 0;
  const traySpots = useMemo(
    () => (geom ? trayLayout(round.items.length, geom.tray, tile, tile) : []),
    [geom, round.items.length, tile]
  );

  const busy = showInstructions || showCelebration || doorsClosed;
  const isPlaced = (id) => id in slots;

  const finishRound = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    schedule(() => {
      sfx.current?.thunk();
      setDoorsClosed(true);
      schedule(() => {
        soundManager?.playWin?.();
        setPhoto(hasPhotos ? getRandomPhoto() : null);
        setRounds((n) => n + 1);
        setShowCelebration(true);
        schedule(() => {
          const next = generateRound(difficulty, round.mode === MODE.COLOR ? MODE.TYPE : MODE.COLOR);
          doneRef.current = false;
          slotsRef.current = {};
          setSlots({});
          setRound(next);
          setDoorsClosed(false);
          setShowCelebration(false);
          setPhoto(null);
        }, NEXT_ROUND_MS);
      }, DOORS_MS);
    }, 450);
  }, [difficulty, getRandomPhoto, hasPhotos, round.mode, schedule, soundManager]);

  /** Try to put `item` on shelf `idx`. Wrong shelves just send it home. */
  const tryPlace = useCallback((item, idx) => {
    if (!item || slotsRef.current[item.id]) return;
    const shelf = round.shelves[idx];
    if (!shelf || shelf.id !== item.shelfId) {
      setWobbleId(item.id);
      schedule(() => setWobbleId((c) => (c === item.id ? null : c)), WOBBLE_MS);
      return;
    }
    const used = Object.values(slotsRef.current).filter((s) => s.shelf === idx).length;
    slotsRef.current = { ...slotsRef.current, [item.id]: { shelf: idx, slot: used } };
    setSlots(slotsRef.current);
    setSelectedId(null);
    setSettleId(item.id);
    sfx.current?.clink();
    schedule(() => setSettleId((c) => (c === item.id ? null : c)), SETTLE_MS + 200);
    if (Object.keys(slotsRef.current).length === round.items.length) finishRound();
  }, [finishRound, round, schedule]);

  const local = (e) => {
    const r = containerRef.current?.getBoundingClientRect();
    const cx = Number.isFinite(e.clientX) ? e.clientX : 0;
    const cy = Number.isFinite(e.clientY) ? e.clientY : 0;
    return { x: cx - (r?.left ?? 0), y: cy - (r?.top ?? 0) };
  };

  const onItemDown = (e, item) => {
    if (busy || isPlaced(item.id) || drag.current || !geom) return;
    e.preventDefault?.();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = local(e);
    const home = traySpots[item.trayIndex] ?? p;
    const lift = e.pointerType === 'touch' ? tile * 0.5 + 14 : 0;
    drag.current = { pid: e.pointerId, id: item.id, start: p, dx: p.x - home.x, dy: p.y - home.y, lift, moved: false };
    dragPosRef.current = { x: home.x, y: home.y - lift };
    setDragPos(dragPosRef.current);
    setDragId(item.id);
    setWobbleId(null);
  };

  const onMove = (e) => {
    const d = drag.current;
    if (!d || d.pid !== e.pointerId || !geom) return;
    const p = local(e);
    if (Math.hypot(p.x - d.start.x, p.y - d.start.y) > TAP_SLOP) d.moved = true;
    const half = tile / 2;
    const pos = { x: clamp(p.x - d.dx, half, geom.w - half), y: clamp(p.y - d.dy - d.lift, half, geom.h - half) };
    dragPosRef.current = pos;
    setDragPos(pos);
    setHoverIdx(shelfIndexAt(pos.x, pos.y, geom.shelves));
  };

  const onUp = (e) => {
    const d = drag.current;
    if (!d || d.pid !== e.pointerId) return;
    drag.current = null;
    setDragId(null);
    setHoverIdx(-1);
    const item = round.items.find((it) => it.id === d.id);
    if (!d.moved) { // a tap: arm / disarm the item for a tap on a shelf
      setSelectedId((cur) => (cur === d.id ? null : d.id));
      return;
    }
    setSelectedId(null);
    const idx = geom ? shelfIndexAt(dragPosRef.current.x, dragPosRef.current.y, geom.shelves) : -1;
    if (idx < 0) {
      setWobbleId(d.id);
      schedule(() => setWobbleId((c) => (c === d.id ? null : c)), WOBBLE_MS);
    } else tryPlace(item, idx);
  };

  const onShelfTap = (idx) => {
    if (busy || !selectedId) return;
    const item = round.items.find((it) => it.id === selectedId);
    tryPlace(item, idx);
    setSelectedId(null);
  };

  const placedCount = Object.keys(slots).length;
  const t = reduce ? 'none' : `left ${SETTLE_MS}ms cubic-bezier(.3,1.3,.5,1), top ${SETTLE_MS}ms cubic-bezier(.3,1.3,.5,1), width ${SETTLE_MS}ms, height ${SETTLE_MS}ms, background-color ${SETTLE_MS}ms`;

  return (
    <div
      ref={containerRef}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="relative h-[100dvh] min-h-[100vh] w-screen overflow-hidden select-none"
      style={{ background: 'var(--game-surface)', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <style>{KEYFRAMES}</style>
      {geom && !showInstructions && (
        <>
          <KitchenCabinet
            geom={geom} shelves={geom.shelves} defs={round.shelves} hoverIdx={hoverIdx}
            armed={!!selectedId} doorsClosed={doorsClosed} reduce={reduce} onShelfTap={onShelfTap}
          />
          <div
            style={{
              position: 'absolute', left: geom.tray.x, top: geom.tray.y, width: geom.tray.w, height: geom.tray.h,
              borderRadius: 20, background: alpha(PAPER_LIGHT, 0.5), border: `2px solid ${alpha(INK, 0.12)}`,
              boxShadow: `inset 0 4px 14px ${alpha(INK, 0.1)}`,
            }}
          />
          {round.items.map((it) => {
            const slot = slots[it.id];
            const isDrag = it.id === dragId;
            const spot = slot ? slotPosition(geom.shelves[slot.shelf], slot.slot, round.perShelf) : null;
            const pos = isDrag ? dragPos : spot ?? traySpots[it.trayIndex] ?? { x: 0, y: 0 };
            const size = spot ? spot.size : tile;
            const anim = wobbleId === it.id ? 'ksWobble' : settleId === it.id ? 'ksSettle' : null;
            return (
              <div
                key={it.id}
                data-item={it.id}
                data-target-shelf={it.shelfId}
                data-placed={slot ? 'true' : 'false'}
                data-tap-target={slot ? undefined : true}
                role={slot ? undefined : 'button'}
                tabIndex={slot ? -1 : 0}
                aria-label={it.label}
                onPointerDown={slot ? undefined : (e) => onItemDown(e, it)}
                style={{
                  position: 'absolute', left: pos.x, top: pos.y, width: size, height: size,
                  transform: 'translate(-50%, -50%)', display: 'grid', placeItems: 'center',
                  borderRadius: 16, padding: slot ? 0 : size * 0.1, boxSizing: 'border-box',
                  background: slot ? 'transparent' : PAPER_LIGHT,
                  border: slot ? '2px solid transparent' : `2px solid ${selectedId === it.id ? ACCENT : alpha(INK, 0.14)}`,
                  boxShadow: slot ? 'none' : isDrag ? `0 12px 22px ${alpha(INK, 0.28)}` : `0 3px 0 ${alpha(INK, 0.16)}`,
                  cursor: slot ? 'default' : 'grab', touchAction: 'none', pointerEvents: slot ? 'none' : 'auto',
                  zIndex: isDrag ? 60 : slot ? 10 : 20,
                  transition: isDrag ? 'none' : t,
                  animation: anim && !reduce ? `${anim} ${anim === 'ksWobble' ? WOBBLE_MS : SETTLE_MS}ms ease-in-out` : 'none',
                }}
              >
                <ItemIcon kind={it.kind} color={it.color} />
              </div>
            );
          })}
          <div
            aria-live="polite"
            style={{
              position: 'absolute', left: '50%', top: 'calc(env(safe-area-inset-top, 0px) + 22px)',
              transform: 'translateX(-50%)', zIndex: 70, direction: 'ltr', color: INK,
              fontWeight: 800, fontSize: 16, pointerEvents: 'none',
            }}
          >
            {placedCount} / {round.items.length}
          </div>
        </>
      )}

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🍽️" score={rounds} accentColor={ACCENT} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="מסדרים מטבח 🍽️"
          buttonText="בואו נתחיל"
          onStart={() => setShowInstructions(false)}
          accentColor={ACCENT}
        >
          <p style={{ marginBottom: 12 }}>🧺 <strong>גוררים</strong> כל חפץ אל המדף שלו.</p>
          <p style={{ marginBottom: 12 }}>🎨 לפעמים לפי צבע, ולפעמים לפי סוג.</p>
          <p style={{ marginBottom: 12 }}>👆 אפשר גם ללחוץ על החפץ ואז על המדף.</p>
          <p>🚪 מסדרים הכול — והדלתות נסגרות!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="המטבח מסודר! 🎉"
        subtitle={rounds === 1 ? 'פעם אחת! 🍽️' : `${rounds} פעמים! 🍽️`}
        photo={photo}
        accentColor={ACCENT}
        numberOfPieces={200}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default KitchenSortGame;
