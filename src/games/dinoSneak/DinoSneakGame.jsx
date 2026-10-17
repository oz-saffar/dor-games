import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useIsLandscape } from '../../hooks/useOrientation';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../../components/game';
import JungleBackdrop from './JungleBackdrop';
import SneakyDino from './SneakyDino';
import PicnicGroup from './PicnicGroup';
import SneakHud from './SneakHud';
import { HebrewPopup, FreezeSparkle } from './Effects';
import {
  ACCENT,
  CATCHES_FOR_CELEBRATION,
  KID_COUNT,
  SHRUG_MS,
  BUSTED_MS,
  DIFF,
  STATUS,
  layout,
} from './sneakConfig';

// ── Game ─────────────────────────────────────────────────────────────────────

const DinoSneakGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const isLandscape = useIsLandscape();
  const reduced = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();
  const cfg = DIFF[difficulty] ?? DIFF[GAME_DIFFICULTY.EASY];

  const [score, setScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);

  const [phase, setPhase] = useState('idle'); // idle | calm | warn | shrug | busted | chomp
  const [watcher, setWatcher] = useState(0);
  const [turnKey, setTurnKey] = useState(0);
  const [holding, setHolding] = useState(false);
  const [shake, setShake] = useState(false);
  const [popup, setPopup] = useState(null);
  const [sparkKey, setSparkKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [kidsKey, setKidsKey] = useState(0);

  const progressRef = useRef(0);
  const phaseRef = useRef('idle');
  const phaseEndRef = useRef(0);
  const penaltyTargetRef = useRef(0);
  const holdRef = useRef(false);
  const rafRef = useRef(null);
  const timeoutsRef = useRef([]);
  const popupKeyRef = useRef(0);

  const dinoRef = useRef(null);
  const clipRef = useRef(null);
  const markerRef = useRef(null);

  const cfgRef = useRef(cfg);
  const scoreRef = useRef(0);
  const fnRef = useRef({});
  const geoRef = useRef({ start: 10, end: 50 });

  const [viewport, setViewport] = useState(() => ({
    w: typeof window === 'undefined' ? 390 : window.innerWidth,
    h: typeof window === 'undefined' ? 780 : window.innerHeight,
  }));
  const geo = layout(viewport.w, viewport.h);

  // ── helpers ────────────────────────────────────────────────────────────────

  function addTimeout(fn, ms) {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timeoutsRef.current.push(id);
    return id;
  }

  function applyProgress() {
    const p = progressRef.current;
    const { start, end } = geoRef.current;
    if (dinoRef.current) {
      dinoRef.current.style.left = `${start + ((end - start) * p) / 100}%`;
    }
    if (clipRef.current) clipRef.current.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
    if (markerRef.current) markerRef.current.style.left = `${p}%`;
  }

  function nextCalmDelay() {
    const [lo, hi] = cfgRef.current.turnIntervalMs;
    return lo + Math.random() * (hi - lo);
  }

  function startRound() {
    progressRef.current = 0;
    applyProgress();
    holdRef.current = false;
    setHolding(false);
    phaseRef.current = 'calm';
    phaseEndRef.current = performance.now() + cfgRef.current.turnIntervalMs[1] + 700;
    setPhase('calm');
  }

  function resetRound() {
    setPopup(null);
    setWatcher(0);
    setKidsKey((k) => k + 1);
    startRound();
  }

  function handleBust(ts) {
    phaseRef.current = 'busted';
    phaseEndRef.current = ts + BUSTED_MS;
    penaltyTargetRef.current = Math.max(0, progressRef.current - cfgRef.current.penaltyPct);
    holdRef.current = false;
    setHolding(false);
    setPhase('busted');
    setShake(true);
    popupKeyRef.current += 1;
    setPopup({ text: 'אוֹפְּס! 😄', tone: 'soft', k: popupKeyRef.current });
    soundManager?.playEncouragement?.();
    addTimeout(() => setShake(false), 420);
    addTimeout(() => setPopup(null), 1450);
  }

  function triggerChomp() {
    phaseRef.current = 'chomp';
    progressRef.current = 100;
    applyProgress();
    holdRef.current = false;
    setHolding(false);
    setPhase('chomp');
    setShake(true);
    setBurstKey((k) => k + 1);
    popupKeyRef.current += 1;
    setPopup({ text: 'תפסתי! 🦖', tone: 'win', k: popupKeyRef.current });
    soundManager?.playCorrect?.();
    addTimeout(() => setShake(false), 560);

    const next = scoreRef.current + 1;
    scoreRef.current = next;
    setScore(next);

    if (next % CATCHES_FOR_CELEBRATION === 0) {
      soundManager?.playWin?.();
      if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
      addTimeout(() => setShowCelebration(true), 420);
      addTimeout(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
        resetRound();
      }, 420 + 3100);
    } else {
      addTimeout(resetRound, 1750);
    }
  }

  function advance(ts) {
    const ph = phaseRef.current;
    if (ph === 'calm') {
      phaseRef.current = 'warn';
      phaseEndRef.current = ts + cfgRef.current.warningMs;
      setWatcher(Math.floor(Math.random() * KID_COUNT));
      setTurnKey((k) => k + 1);
      setPhase('warn');
    } else if (ph === 'warn') {
      if (holdRef.current) {
        handleBust(ts);
      } else {
        phaseRef.current = 'shrug';
        phaseEndRef.current = ts + SHRUG_MS;
        setSparkKey((k) => k + 1);
        setPhase('shrug');
      }
    } else {
      phaseRef.current = 'calm';
      phaseEndRef.current = ts + nextCalmDelay();
      setPhase('calm');
    }
  }

  function press() {
    if (holdRef.current) return;
    const ph = phaseRef.current;
    if (ph !== 'calm' && ph !== 'warn' && ph !== 'shrug') return;
    holdRef.current = true;
    setHolding(true);
  }

  function release() {
    if (!holdRef.current) return;
    holdRef.current = false;
    setHolding(false);
  }

  // ── effects ────────────────────────────────────────────────────────────────

  // Keep the loop's view of the world fresh without ever restarting it.
  // Declared first so the callbacks exist before the rAF effect below runs.
  useEffect(() => {
    cfgRef.current = cfg;
    geoRef.current = { start: geo.start, end: geo.end };
    fnRef.current = { applyProgress, advance, triggerChomp, press, release, startRound };
    applyProgress();
  });

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.code === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  // Space bar acts exactly like a finger held on the screen (desktop testing).
  useEffect(() => {
    const down = (e) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (!e.repeat) fnRef.current.press();
    };
    const up = (e) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      fnRef.current.release();
    };
    const blur = () => fnRef.current.release();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // Main loop — reads refs only, so it never restarts mid-round.
  useEffect(() => {
    if (showInstructions) return undefined;
    let last = 0;
    const tick = (ts) => {
      rafRef.current = requestAnimationFrame(tick);
      const dt = last ? Math.min(50, ts - last) : 16;
      last = ts;

      const ph = phaseRef.current;
      const canMove = ph === 'calm' || ph === 'warn' || ph === 'shrug';

      if (canMove && holdRef.current) {
        progressRef.current = Math.min(100, progressRef.current + cfgRef.current.moveSpeed * (dt / 16.6667));
        fnRef.current.applyProgress();
        if (progressRef.current >= 100) {
          fnRef.current.triggerChomp();
          return;
        }
      }

      if (ph === 'busted' && progressRef.current > penaltyTargetRef.current) {
        const step = (cfgRef.current.penaltyPct / 520) * dt;
        progressRef.current = Math.max(penaltyTargetRef.current, progressRef.current - step);
        fnRef.current.applyProgress();
      }

      if ((canMove || ph === 'busted') && ts >= phaseEndRef.current) fnRef.current.advance(ts);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [showInstructions]);

  useEffect(() => {
    if (showInstructions) return;
    fnRef.current.startRound();
  }, [showInstructions]);

  // Hard cleanup — the app can unmount a game at any moment.
  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // ── derived view state ─────────────────────────────────────────────────────

  const moving = holding && (phase === 'calm' || phase === 'warn' || phase === 'shrug');
  const dinoPose =
    phase === 'chomp' ? 'chomp' : phase === 'busted' ? 'busted' : moving ? 'sneak' : 'freeze';
  const status =
    phase === 'chomp' ? STATUS.chomp
      : phase === 'busted' ? STATUS.busted
        : phase === 'warn' ? STATUS.warn
          : moving ? STATUS.calm
            : STATUS.frozen;

  const { picnicW, dinoW, dinoSize, kidSize } = geo;
  const kidH = 122 * kidSize;
  const blanketLift = picnicW * 0.17;
  const groundPct = isLandscape ? 20 : 23;

  const kidState = (i) => {
    if (phase === 'chomp') return 'poof';
    if (phase === 'busted') return 'laugh';
    if (i !== watcher) return 'calm';
    if (phase === 'warn') return 'warn';
    if (phase === 'shrug') return 'shrug';
    return 'calm';
  };

  return (
    <div
      className="relative h-[100dvh] min-h-[100vh] w-screen overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, #cfe0ec 0%, #dfe9f0 22%, #e6ecdd 42%, #b7c9a4 55%, #86a077 70%, #62795a 100%)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* ── world (shakes on impact) ──────────────────────────────────────── */}
      <div
        className="ds-world"
        style={{ position: 'absolute', inset: 0, animation: shake && !reduced ? 'dsShake 0.5s ease-out' : 'none' }}
      >
        <JungleBackdrop reduced={reduced} />

        {/* picnic + kids */}
        <PicnicGroup
          key={kidsKey}
          phase={phase}
          kidCount={KID_COUNT}
          kidState={kidState}
          kidSize={kidSize}
          warningMs={cfg.warningMs}
          turnKey={turnKey}
          burstKey={burstKey}
          picnicW={picnicW}
          kidH={kidH}
          blanketLift={blanketLift}
          bottomPct={groundPct - 2}
          reduced={reduced}
        />

        {/* the dinosaur */}
        <div
          ref={dinoRef}
          style={{
            position: 'absolute',
            left: `${geo.start}%`,
            bottom: `${groundPct}%`,
            width: dinoW,
            height: 196 * dinoSize,
            transform: 'translateX(-50%)',
            zIndex: 16,
            willChange: 'left',
          }}
        >
          <SneakyDino pose={dinoPose} size={dinoSize} reduced={reduced} />
          {phase === 'shrug' && !reduced && <FreezeSparkle key={sparkKey} />}
        </div>
      </div>

      {/* ── readable-state HUD: rim vignette + status pill + progress trail ─ */}
      <SneakHud
        moving={moving}
        warning={phase === 'warn'}
        status={status}
        clipRef={clipRef}
        markerRef={markerRef}
        accent={ACCENT}
        reduced={reduced}
      />

      {popup && <HebrewPopup key={popup.k} text={popup.text} tone={popup.tone} />}

      {/* ── full-screen press surface ─────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="החזק כדי להתגנב, שחרר כדי לקפוא"
        onPointerDown={(e) => { e.preventDefault(); press(); }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 40,
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
          cursor: 'pointer',
        }}
      />

      {/* ── chrome ────────────────────────────────────────────────────────── */}
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🦖" score={score} accentColor={ACCENT} />

      <style>{`
        @keyframes dsShake {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          12%  { transform: translate(-11px, 6px) rotate(-.8deg); }
          28%  { transform: translate(10px, -7px) rotate(.8deg); }
          46%  { transform: translate(-8px, 4px) rotate(-.5deg); }
          64%  { transform: translate(6px, -3px) rotate(.4deg); }
          82%  { transform: translate(-3px, 2px) rotate(-.2deg); }
        }
      `}</style>

      {/* ── overlays ──────────────────────────────────────────────────────── */}
      {showInstructions && (
        <GameInstructionsOverlay
          title="דינוזאור מתגנב 🦖"
          buttonText="בוא נתגנב! 🤫"
          onStart={() => setShowInstructions(false)}
          accentColor={ACCENT}
        >
          <p style={{ marginBottom: 12 }}>👆 <strong>לחץ והחזק</strong> על המסך — הדינוזאור מתגנב קדימה</p>
          <p style={{ marginBottom: 12 }}>✋ <strong>ילד מסתובב?</strong> תשחרר מהר — ותקפא כמו פסל!</p>
          <p style={{ marginBottom: 12 }}>😄 <strong>נתפסת?</strong> כולם צוחקים ואתה חוזר קצת אחורה</p>
          <p>🧺 <strong>תגיע לפיקניק</strong> — ותצעק תפסתי!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="תפסתי! 🦖"
        subtitle={`${score} תפיסות! 🎉`}
        photo={celebrationPhoto}
        accentColor={ACCENT}
        numberOfPieces={230}
      />
    </div>
  );
};

export default DinoSneakGame;
