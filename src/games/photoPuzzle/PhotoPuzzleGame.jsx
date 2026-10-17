import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useViewport } from '../../hooks/useViewport';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../../components/game';
import PuzzlePiece from './PuzzlePiece';
import { PUZZLE_KEYFRAMES } from './photoPuzzleStyles';
import {
  ACCENT, CELEBRATION_MS, DISSOLVE_MS, LOCK_MS, WOBBLE_MS,
  clamp, gridFor, makeFallbackArt, shuffle, trayLayout, trayScaleFor,
} from './photoPuzzleConfig';

const TOP_INSET = 100;
const PAD = 12;

const PhotoPuzzleGame = ({ onExit, soundManager, pieceCount = 12 }) => {
  const { isLandscape, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [showInstructions, setShowInstructions] = useState(true);
  const [rounds, setRounds] = useState(0);
  const [roundKey, setRoundKey] = useState(1);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pieces, setPieces] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoOk, setPhotoOk] = useState(null);
  // width / height of the actual picture; null while unknown or on fallback art
  const [photoAspect, setPhotoAspect] = useState(null);
  const [fallbackArt, setFallbackArt] = useState(() => makeFallbackArt());
  const [dragId, setDragId] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [hoverOk, setHoverOk] = useState(false);
  const [wobbleId, setWobbleId] = useState(null);
  const [lockingId, setLockingId] = useState(null);
  const [dissolving, setDissolving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const [peek, setPeek] = useState(false);

  const containerRef = useRef(null);
  const timersRef = useRef([]);
  const dragRef = useRef(null);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const piecesRef = useRef([]);
  const geomRef = useRef(null);
  const photoRoundRef = useRef(0);
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

  // A wide picture wants a wide grid and a tall one a tall grid, whichever way
  // the tablet is held — cutting a portrait photo into a 4×3 board is what used
  // to force it out of shape. Fallback art has no shape of its own, so it
  // follows the screen as before.
  const grid = useMemo(
    () => gridFor(pieceCount, photoAspect ? photoAspect >= 1 : isLandscape),
    [pieceCount, photoAspect, isLandscape]
  );

  /** Board + tray rectangles, in container-relative pixels. */
  const geom = useMemo(() => {
    const { w, h } = size;
    if (w < 40 || h < 40) return null;
    const trayH = clamp(h * 0.26, 96, isTablet ? 240 : 200);
    const availW = w - PAD * 2;
    const availH = h - TOP_INSET - trayH - PAD * 2;
    // The board is the largest rectangle of the picture's own ratio that fits the
    // free space; the cells are that rectangle divided up. Pieces are therefore
    // only square when the picture is — the image is never squeezed to fill.
    let cellW;
    let cellH;
    if (photoAspect) {
      const fitW = Math.min(availW, availH * photoAspect);
      cellW = Math.max(24, Math.floor(fitW / grid.cols));
      cellH = Math.max(24, Math.floor(fitW / photoAspect / grid.rows));
    } else {
      const cell = Math.max(28, Math.floor(Math.min(availW / grid.cols, availH / grid.rows)));
      cellW = cell;
      cellH = cell;
    }
    const boardW = cellW * grid.cols;
    const boardH = cellH * grid.rows;
    const tray = { x: PAD, y: h - trayH - PAD, w: availW, h: trayH };
    return {
      cellW,
      cellH,
      trayScale: trayScaleFor(grid.total, tray, cellH),
      boardW,
      boardH,
      boardX: Math.round((w - boardW) / 2),
      boardY: Math.round(TOP_INSET + Math.max(0, (availH - boardH) / 2)),
      tray,
      w,
      h,
    };
  }, [size, grid, photoAspect, isTablet]);

  useEffect(() => { geomRef.current = geom; }, [geom]);
  useEffect(() => { piecesRef.current = pieces; }, [pieces]);

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

  // ── round 1: pick the picture, then probe whether it actually loads ──────
  useEffect(() => {
    if (showInstructions || photoRoundRef.current === roundKey) return;
    photoRoundRef.current = roundKey;
    setFallbackArt(makeFallbackArt());
    const url = hasPhotos ? getRandomPhoto() : null;
    setPhotoUrl(url);
    setPhotoOk(url ? null : false);
    setPhotoAspect(null);
  }, [roundKey, showInstructions, hasPhotos, getRandomPhoto]);

  // ── round 2: once the picture is resolved, cut it up and fill the tray ───
  useEffect(() => {
    if (showInstructions || !geom || photoOk === null) return;
    // the signature includes the grid, so rotating the tablet re-cuts the picture
    // instead of leaving pieces addressing cells that no longer exist
    const sig = `${roundKey}:${grid.cols}x${grid.rows}`;
    if (builtRef.current === sig) return;
    builtRef.current = sig;

    const cells = [];
    for (let r = 0; r < grid.rows; r += 1) {
      for (let c = 0; c < grid.cols; c += 1) cells.push({ r, c });
    }
    // Lay the pile out at the size the pieces are actually drawn (trayScale), not
    // at full board size — on a big screen a full-size cell is far taller than the
    // tray, which is what pushed the bottom row of pieces off the iPad's screen.
    const shownW = geom.cellW * geom.trayScale;
    const shownH = geom.cellH * geom.trayScale;
    const spots = trayLayout(cells.length, geom.tray, shownW, shownH);
    const hxPad = clamp((shownW / 2 + 6) / geom.tray.w, 0.02, 0.45);
    const hyPad = clamp((shownH / 2 + 6) / geom.tray.h, 0.05, 0.45);
    const order = shuffle(cells);
    lockedRef.current = false;

    setPieces(order.map((cellPos, i) => ({
      id: `${cellPos.r}-${cellPos.c}`,
      r: cellPos.r,
      c: cellPos.c,
      hx: clamp((spots[i].x - geom.tray.x) / geom.tray.w, hxPad, 1 - hxPad),
      hy: clamp((spots[i].y - geom.tray.y) / geom.tray.h, hyPad, 1 - hyPad),
      tilt: spots[i].tilt,
      placed: false,
    })));
    setDragId(null);
    setWobbleId(null);
    setLockingId(null);
    setDissolving(false);
  }, [showInstructions, geom, photoOk, roundKey, grid]);

  // ── geometry helpers ────────────────────────────────────────────────────
  const homeOf = useCallback((p, g) => ({
    x: g.tray.x + p.hx * g.tray.w,
    y: g.tray.y + p.hy * g.tray.h,
  }), []);

  const slotOf = useCallback((p, g) => ({
    x: g.boardX + (p.c + 0.5) * g.cellW,
    y: g.boardY + (p.r + 0.5) * g.cellH,
  }), []);

  /** Is (x, y) close enough to a piece's slot to count as dropped in it? */
  const nearSlot = useCallback((x, y, slot, g) => {
    const reach = Math.max(Math.min(g.cellW, g.cellH) * 0.95, 66);
    return Math.hypot(x - slot.x, y - slot.y) <= reach
      || (Math.abs(x - slot.x) <= g.cellW * 1.12 && Math.abs(y - slot.y) <= g.cellH * 1.12);
  }, []);

  const busy = showCelebration || dissolving || showInstructions;

  // ── completion ──────────────────────────────────────────────────────────
  const finishRound = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setDissolving(true);
    soundManager?.playWin();
    schedule(() => {
      setCelebrationPhoto(photoOk && photoUrl ? photoUrl : null);
      setRounds((n) => n + 1);
      setShowCelebration(true);
    }, DISSOLVE_MS);
    schedule(() => {
      setShowCelebration(false);
      setCelebrationPhoto(null);
      setPieces([]);
      setRoundKey((k) => k + 1);
    }, DISSOLVE_MS + CELEBRATION_MS);
  }, [photoOk, photoUrl, schedule, soundManager]);

  // ── dragging ────────────────────────────────────────────────────────────
  const handlePiecePointerDown = useCallback((e, piece) => {
    const g = geomRef.current;
    if (!g || busy || piece.placed || dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const home = homeOf(piece, g);
    // on touch, float the piece above the finger so it is never hidden
    const lift = e.pointerType === 'touch' ? g.cellH * 0.5 + 18 : 0;

    dragRef.current = {
      pointerId: e.pointerId,
      id: piece.id,
      dx: px - home.x,
      dy: py - home.y,
      lift,
    };
    dragPosRef.current = { x: home.x, y: home.y - lift };
    setDragPos(dragPosRef.current);
    setDragId(piece.id);
    setWobbleId(null);
    setHoverOk(false);
  }, [busy, homeOf]);

  const handlePointerMove = useCallback((e) => {
    const drag = dragRef.current;
    const g = geomRef.current;
    if (!drag || !g || drag.pointerId !== e.pointerId) return;
    const rect = containerRef.current.getBoundingClientRect();
    const halfW = g.cellW / 2;
    const halfH = g.cellH / 2;
    const x = clamp(e.clientX - rect.left - drag.dx, halfW, g.w - halfW);
    const y = clamp(e.clientY - rect.top - drag.dy - drag.lift, halfH + 8, g.h - halfH);
    dragPosRef.current = { x, y };
    setDragPos(dragPosRef.current);

    const piece = piecesRef.current.find((p) => p.id === drag.id);
    if (!piece) return;
    const near = nearSlot(x, y, slotOf(piece, g), g);
    setHoverOk((prev) => (prev === near ? prev : near));
  }, [nearSlot, slotOf]);

  const endDrag = useCallback((e) => {
    const drag = dragRef.current;
    const g = geomRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragId(null);
    setHoverOk(false);
    if (!g) return;

    const piece = piecesRef.current.find((p) => p.id === drag.id);
    if (!piece || piece.placed) return;

    const { x, y } = dragPosRef.current;
    // deliberately forgiving: a fat radius OR anywhere over the right cell
    const snapped = nearSlot(x, y, slotOf(piece, g), g);

    if (!snapped) {
      setWobbleId(drag.id);
      schedule(() => setWobbleId((cur) => (cur === drag.id ? null : cur)), WOBBLE_MS);
      return;
    }

    soundManager?.playCorrect();
    setLockingId(drag.id);
    schedule(() => setLockingId((cur) => (cur === drag.id ? null : cur)), LOCK_MS);
    setPieces((prev) => {
      const next = prev.map((p) => (p.id === drag.id ? { ...p, placed: true } : p));
      if (next.every((p) => p.placed)) schedule(finishRound, 260);
      return next;
    });
  }, [finishRound, nearSlot, schedule, slotOf, soundManager]);

  // ── render ──────────────────────────────────────────────────────────────
  const boardImage = photoOk && photoUrl ? `url("${photoUrl}")` : fallbackArt;
  const placedCount = pieces.filter((p) => p.placed).length;
  const dragPiece = dragId ? pieces.find((p) => p.id === dragId) : null;

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
        '--pp-accent': ACCENT,
        '--pp-accent-soft': 'color-mix(in srgb, var(--game-accent) 55%, transparent)',
      }}
    >
      <style>{PUZZLE_KEYFRAMES}</style>

      {/* probe: photos live only on the production server, so a 404 is normal */}
      {photoUrl && photoOk === null && (
        <img
          src={photoUrl}
          alt=""
          aria-hidden="true"
          onLoad={(e) => {
            const { naturalWidth, naturalHeight } = e.currentTarget;
            setPhotoAspect(naturalWidth && naturalHeight ? naturalWidth / naturalHeight : null);
            setPhotoOk(true);
          }}
          onError={() => setPhotoOk(false)}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        />
      )}

      {geom && !showInstructions && (
        <>
          {/* the board: a faint ghost of the finished picture + empty slots */}
          <div
            style={{
              position: 'absolute',
              left: geom.boardX,
              top: geom.boardY,
              width: geom.boardW,
              height: geom.boardH,
              borderRadius: 16,
              background: 'rgba(4,30,42,0.42)',
              boxShadow: 'inset 0 3px 14px rgba(0,0,0,0.42), 0 10px 26px rgba(0,0,0,0.32)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: boardImage,
                backgroundSize: `${geom.boardW}px ${geom.boardH}px`,
                opacity: peek ? 0.55 : 0.17,
                transition: 'opacity 240ms ease-out',
              }}
            />
            {pieces.filter((p) => !p.placed).map((p) => {
              const active = dragPiece?.id === p.id && hoverOk;
              return (
                <div
                  key={`slot-${p.id}`}
                  style={{
                    position: 'absolute',
                    left: p.c * geom.cellW,
                    top: p.r * geom.cellH,
                    width: geom.cellW,
                    height: geom.cellH,
                    boxShadow: active ? undefined : 'inset 0 0 0 2px rgba(255,255,255,0.22)',
                    background: active ? 'rgba(103,232,249,0.20)' : 'transparent',
                    animation: active
                      ? 'ppSlotGlow 900ms ease-in-out infinite'
                      : reduce ? 'none' : 'ppSlotHint 3s ease-in-out infinite',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}
            {dissolving && !reduce && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: '48%',
                  background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.85),transparent)',
                  animation: 'ppShine 900ms ease-out forwards',
                  pointerEvents: 'none',
                  zIndex: 30,
                }}
              />
            )}
          </div>

          {/* tray strip */}
          <div
            style={{
              position: 'absolute',
              left: geom.tray.x,
              top: geom.tray.y,
              width: geom.tray.w,
              height: geom.tray.h,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.13)',
              border: '2px solid rgba(255,255,255,0.30)',
              boxShadow: 'inset 0 6px 18px rgba(0,0,0,0.18)',
            }}
          />

          {pieces.map((p, i) => {
            const isDrag = p.id === dragId;
            const pos = p.placed ? slotOf(p, geom) : isDrag ? dragPos : homeOf(p, geom);
            return (
              <PuzzlePiece
                key={p.id}
                piece={p}
                x={pos.x}
                y={pos.y}
                w={geom.cellW}
                h={geom.cellH}
                boardImage={boardImage}
                boardW={geom.boardW}
                boardH={geom.boardH}
                state={p.placed ? 'placed' : isDrag ? 'drag' : 'tray'}
                tilt={p.tilt}
                trayScale={geom.trayScale}
                wobble={wobbleId === p.id}
                locking={lockingId === p.id}
                accent={ACCENT}
                reduce={reduce}
                floatDelay={i * 170}
                seamOpacity={dissolving ? 0 : 1}
                onPointerDown={handlePiecePointerDown}
              />
            );
          })}

          <button
            type="button"
            onPointerDown={() => setPeek(true)}
            onPointerUp={() => setPeek(false)}
            onPointerCancel={() => setPeek(false)}
            onPointerLeave={() => setPeek(false)}
            style={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 80,
              direction: 'rtl',
              padding: '8px 18px',
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.75)',
              background: peek ? ACCENT : 'var(--dor-panel)',
              color: '#ecfeff',
              fontWeight: 800,
              fontSize: 18,
              touchAction: 'none',
              animation: peek && !reduce ? 'ppPeekPulse 700ms ease-in-out infinite' : 'none',
              boxShadow: '0 6px 16px rgba(0,0,0,0.28)',
            }}
          >
            🔍 הצצה
          </button>

          <div
            aria-live="polite"
            style={{
              position: 'absolute',
              left: '50%',
              top: 'calc(env(safe-area-inset-top, 0px) + 68px)',
              transform: 'translateX(-50%)',
              zIndex: 70,
              direction: 'rtl',
              color: '#cffafe',
              fontWeight: 800,
              fontSize: 15,
              textShadow: '0 2px 6px rgba(0,0,0,0.55)',
              pointerEvents: 'none',
              animation: 'ppFadeIn 400ms ease-out',
            }}
          >
            {placedCount} / {pieces.length}
          </div>
        </>
      )}

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🧩" score={rounds} accentColor={ACCENT} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="פאזל תמונות 🧩"
          buttonText="בוא נרכיב! ✋"
          onStart={() => setShowInstructions(false)}
          accentColor={ACCENT}
        >
          <p style={{ marginBottom: 12 }}>🖐️ <strong>גוררים חתיכה</strong> אל המקום שלה בלוח.</p>
          <p style={{ marginBottom: 12 }}>✨ <strong>קרוב מספיק?</strong> החתיכה נכנסת לבד!</p>
          <p style={{ marginBottom: 12 }}>🔍 <strong>לוחצים על הצצה</strong> כדי לראות את התמונה.</p>
          <p>🎉 <strong>מסיימים את התמונה</strong> — וחוגגים!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="הרכבת את התמונה! 🎉"
        subtitle={`${rounds} תמונות שלמות! 🧩`}
        photo={celebrationPhoto}
        accentColor={ACCENT}
        numberOfPieces={220}
      />
    </div>
  );
};

export default PhotoPuzzleGame;
