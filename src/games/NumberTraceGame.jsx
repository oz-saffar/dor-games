import { useState, useRef, useEffect, useCallback } from 'react';
import { GameBackButton, GameInstructionsOverlay, GameCelebrationOverlay } from '../components/game';
import { useViewport } from '../hooks/useViewport';

// ── Config ───────────────────────────────────────────────────────────────────

const ACCENT = 'var(--game-accent)';
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Cheerful per-digit tile colours for the picker
const TILE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#0ea5e9', '#2563eb', '#7c3aed', '#db2777', '#e11d48',
];

// Single-stroke *centerline* writing paths (the line you trace ALONG, like a
// handwriting worksheet) — NOT the filled glyph outline. viewBox 200×300.
// `start` is where to place the "begin here" dot. Some glyphs (1, 4) have a
// second pen-stroke, expressed as a separate subpath after `M`.
const DIGIT_PATHS = {
  0: { d: 'M100,50 C172,50 172,250 100,250 C28,250 28,50 100,50 Z', start: [100, 50] },
  1: { d: 'M68,88 L100,52 L100,250', start: [68, 88] },
  2: { d: 'M60,95 C60,55 140,52 140,98 C140,140 80,190 56,248 L146,248', start: [60, 95] },
  3: { d: 'M60,92 C72,54 142,60 128,106 C120,136 96,148 104,148 C140,150 146,206 126,230 C104,256 62,246 54,208', start: [60, 92] },
  4: { d: 'M120,52 L50,190 L152,190 M120,52 L120,250', start: [120, 52] },
  5: { d: 'M140,56 L72,56 L66,138 C104,118 148,132 138,188 C130,236 66,244 52,206', start: [140, 56] },
  6: { d: 'M138,68 C96,54 58,104 58,170 C58,230 142,232 140,180 C138,138 66,138 60,178', start: [138, 68] },
  7: { d: 'M54,58 L150,58 L86,250', start: [54, 58] },
  8: { d: 'M100,56 C50,56 52,146 100,148 C152,150 150,250 100,250 C48,250 46,150 100,148 C152,146 154,56 100,56 Z', start: [100, 56] },
  9: { d: 'M140,108 C140,68 60,68 60,110 C60,152 140,152 140,108 C140,150 136,200 104,250', start: [140, 108] },
};

// ── Digit picker ─────────────────────────────────────────────────────────────

function DigitPicker({ onPick }) {
  const { isTablet } = useViewport();
  // isTablet lifts the ceilings for Dor's iPad; every phone value is untouched.

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        paddingTop: 'max(env(safe-area-inset-top), 70px)',
        gap: 18,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 26,
          fontWeight: 900,
          color: '#1e293b',
          direction: 'rtl',
          textAlign: 'center',
        }}
      >
        איזו ספרה נכתוב? ✏️
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 14,
          width: '100%',
          maxWidth: isTablet ? 800 : 520,
        }}
      >
        {DIGITS.map((d) => (
          <button
            key={d}
            onClick={() => onPick(d)}
            aria-label={`לכתוב את הספרה ${d}`}
            style={{
              aspectRatio: '1 / 1',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              color: 'var(--dor-ink)',
              fontSize: isTablet ? 'clamp(30px, 9vw, 80px)' : 'clamp(30px, 9vw, 52px)',
              fontWeight: 900,
              background: `linear-gradient(160deg, ${TILE_COLORS[d]} 0%, ${TILE_COLORS[d]}cc 100%)`,
              boxShadow: `0 6px 0 ${TILE_COLORS[d]}88, 0 10px 22px rgba(0,0,0,0.18)`,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              userSelect: 'none',
            }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tracing canvas ───────────────────────────────────────────────────────────

// Success detection tuning — deliberately forgiving for a 4-year-old:
// the trace counts if most of the guide line was covered, even sloppily.
const SAMPLE_COUNT = 64;          // points sampled along the guide path
const HIT_TOLERANCE_SVG = 26;     // px in viewBox units — how far a finger stroke can be and still "cover" a sample
const NEAR_TOLERANCE_SVG = 40;    // looser radius for the anti-scribble ratio
const COVERAGE_NEEDED = 0.65;     // fraction of the guide that must be covered
const NEAR_RATIO_NEEDED = 0.45;   // fraction of drawn points that must be near the guide
const MIN_DRAWN_POINTS = 12;      // ignore stray taps

function TraceBoard({ digit, soundManager, onClear, onPickAnother }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const guidePathRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef(null);
  const ctxRef = useRef(null);

  // Trace-success tracking
  const samplesRef = useRef([]);            // guide points in canvas coords, with .hit
  const tolRef = useRef({ hit: 30, near: 46 });
  const drawnStatsRef = useRef({ near: 0, total: 0 });
  const succeededRef = useRef(false);
  const [succeeded, setSucceeded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationTimerRef = useRef(null);

  // Size the canvas to its container (DPR-aware) and keep stroke styling.
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 16;
    ctx.strokeStyle = ACCENT;
    ctxRef.current = ctx;
  }, []);

  // Sample the guide path into canvas coordinates so finger strokes can be
  // matched against it. Resizing wipes the canvas, so coverage resets too.
  const computeSamples = useCallback(() => {
    const path = guidePathRef.current;
    const svg = svgRef.current;
    const canvas = canvasRef.current;
    if (!path || !svg || !canvas) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const rect = canvas.getBoundingClientRect();
    const total = path.getTotalLength();
    const samples = [];
    for (let i = 0; i <= SAMPLE_COUNT; i++) {
      const p = path.getPointAtLength((total * i) / SAMPLE_COUNT);
      const sp = new DOMPoint(p.x, p.y).matrixTransform(ctm);
      samples.push({ x: sp.x - rect.left, y: sp.y - rect.top, hit: false });
    }
    samplesRef.current = samples;
    const scale = Math.hypot(ctm.a, ctm.b);
    tolRef.current = { hit: HIT_TOLERANCE_SVG * scale, near: NEAR_TOLERANCE_SVG * scale };
    drawnStatsRef.current = { near: 0, total: 0 };
  }, []);

  useEffect(() => {
    setupCanvas();
    computeSamples();
    const ro = new ResizeObserver(() => {
      setupCanvas();
      computeSamples();
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // Re-run when digit changes so the fresh canvas is clean for the new number.
  }, [setupCanvas, computeSamples, digit]);

  useEffect(() => () => clearTimeout(celebrationTimerRef.current), []);

  const registerPoint = (p) => {
    if (succeededRef.current) return;
    const { hit, near } = tolRef.current;
    const stats = drawnStatsRef.current;
    stats.total += 1;
    let isNear = false;
    for (const s of samplesRef.current) {
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d <= hit) s.hit = true;
      if (d <= near) isNear = true;
    }
    if (isNear) stats.near += 1;
  };

  // Fast finger movement produces sparse points — walk the segment so
  // coverage doesn't miss samples between them.
  const registerSegment = (a, b) => {
    if (succeededRef.current) return;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const step = Math.max(tolRef.current.hit / 2, 4);
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= n; i++) {
      registerPoint({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
    }
  };

  const checkSuccess = () => {
    if (succeededRef.current) return;
    const samples = samplesRef.current;
    const { near, total } = drawnStatsRef.current;
    if (!samples.length || total < MIN_DRAWN_POINTS) return;
    const coverage = samples.filter((s) => s.hit).length / samples.length;
    if (coverage < COVERAGE_NEEDED || near / total < NEAR_RATIO_NEEDED) return;
    succeededRef.current = true;
    setSucceeded(true);
    setShowCelebration(true);
    soundManager?.playWin?.();
    celebrationTimerRef.current = setTimeout(() => setShowCelebration(false), 2600);
  };

  const pointFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleDown = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    lastRef.current = pointFromEvent(e);
    canvasRef.current.setPointerCapture?.(e.pointerId);
    // A tap leaves a dot so even the lightest touch shows progress.
    const ctx = ctxRef.current;
    const { x, y } = lastRef.current;
    ctx.beginPath();
    ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT;
    ctx.fill();
    registerPoint(lastRef.current);
  };

  const handleMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = ctxRef.current;
    const p = pointFromEvent(e);
    const last = lastRef.current;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    registerSegment(last, p);
    lastRef.current = p;
  };

  const handleUp = (e) => {
    if (drawingRef.current) checkSuccess();
    drawingRef.current = false;
    lastRef.current = null;
    canvasRef.current.releasePointerCapture?.(e.pointerId);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of samplesRef.current) s.hit = false;
    drawnStatsRef.current = { near: 0, total: 0 };
    succeededRef.current = false;
    setSucceeded(false);
    setShowCelebration(false);
    onClear?.();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 'max(env(safe-area-inset-top), 64px)',
        paddingBottom: 'calc(max(env(safe-area-inset-bottom), 12px) + 16px)',
        paddingLeft: 16,
        paddingRight: 16,
        gap: 14,
      }}
    >
      {/* Drawing surface: dotted digit guide + finger canvas on top */}
      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          maxWidth: 460,
          borderRadius: 28,
          background: 'var(--dor-panel)',
          boxShadow: 'inset 0 0 0 3px rgba(37,99,235,0.12), 0 8px 24px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        {/* Dashed centerline of the digit — the path to trace ALONG, plus a
            dot marking where to start writing. */}
        <svg
          ref={svgRef}
          viewBox="0 0 200 300"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
          style={{ position: 'absolute', inset: '8% 6%', width: '88%', height: '84%', pointerEvents: 'none' }}
        >
          <path
            ref={guidePathRef}
            d={DIGIT_PATHS[digit].d}
            fill="none"
            stroke={succeeded ? '#22c55e' : '#9aa6b6'}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 22"
          />
          <circle
            cx={DIGIT_PATHS[digit].start[0]}
            cy={DIGIT_PATHS[digit].start[1]}
            r="9"
            fill="#475569"
          />
        </svg>

        {/* Finger-drawing canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          onPointerLeave={handleUp}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            touchAction: 'none',
            cursor: 'crosshair',
          }}
        />
      </div>

      {/* Bottom controls */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 460 }}>
        <button
          onClick={clearCanvas}
          style={controlBtnStyle('#16a34a')}
          aria-label="לנקות את הציור ולהתחיל מחדש"
        >
          🧽 נקה
        </button>
        <button
          onClick={onPickAnother}
          style={controlBtnStyle(ACCENT)}
          aria-label="לבחור ספרה אחרת"
        >
          🔢 ספרה אחרת
        </button>
      </div>

      <GameCelebrationOverlay
        show={showCelebration}
        successText="כל הכבוד! 🎉"
        subtitle={`כתבת את הספרה ${digit}!`}
        accentColor={ACCENT}
        numberOfPieces={220}
      />
    </div>
  );
}

function controlBtnStyle(color) {
  return {
    flex: 1,
    height: 64,
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    color: 'var(--dor-ink)',
    fontSize: 22,
    fontWeight: 900,
    direction: 'rtl',
    background: `linear-gradient(180deg, ${color} 0%, ${color}d0 100%)`,
    boxShadow: `0 5px 0 ${color}80, 0 8px 18px rgba(0,0,0,0.15)`,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    userSelect: 'none',
  };
}

// ── Main game ────────────────────────────────────────────────────────────────

const NumberTraceGame = ({ onExit, soundManager }) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [digit, setDigit] = useState(null);

  useEffect(() => {
    const h = (e) => { if (e.code === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  return (
    <div
      className="relative h-[100dvh] w-screen overflow-hidden select-none"
      style={{
        height: '100dvh',
        background: 'var(--game-surface)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <GameBackButton onExit={onExit} />

      {digit === null ? (
        <DigitPicker onPick={setDigit} />
      ) : (
        <TraceBoard
          key={digit}
          digit={digit}
          soundManager={soundManager}
          onClear={() => {}}
          onPickAnother={() => setDigit(null)}
        />
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="כותבים מספרים ✏️"
          buttonText="בוא נכתוב! ✍️"
          onStart={() => setShowInstructions(false)}
          accentColor={ACCENT}
        >
          <p style={{ marginBottom: 12 }}>🔢 <strong>בוחרים ספרה</strong> מ-0 עד 9</p>
          <p style={{ marginBottom: 12 }}>✍️ <strong>עוקבים עם האצבע</strong> על הקו המנוקד</p>
          <p>🧽 אפשר תמיד <strong>לנקות</strong> ולכתוב שוב — כל הכבוד שניסית!</p>
        </GameInstructionsOverlay>
      )}
    </div>
  );
};

export default NumberTraceGame;
