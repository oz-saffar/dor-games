import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { GAME_DIFFICULTY } from '../lib/gameDifficulties';
import {
  getRunnerDashCharacterAltHe,
  getRunnerDashCharacterImageSrc,
  normalizeRunnerDashCharacter,
  RUNNER_DASH_CHARACTER_OPTIONS,
} from '../lib/runnerDashCharacter';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

const COLORS = {
  skyTop: '#3b82f6',
  skyBottom: '#dbeafe',
  accent: '#1d4ed8',
};

const INITIAL_VIEW = {
  width: 360,
  height: 640,
  lane: 1,
  speed: 0.42,
  spawnIn: 0.9,
  roadOffset: 0,
  running: false,
  objects: [],
};

/** HARD matches pre–difficulty tuning */
const RUNNER_PARAMS = {
  [GAME_DIFFICULTY.EASY]: {
    startSpeed: 0.22,
    maxSpeed: 0.36,
    speedAccel: 0.007,
    spawnMin: 1.28,
    spawnMaxExtra: 1.05,
    spawnInFirst: 1.2,
    roadScrollMult: 115,
    rockChance: 0.55,
  },
  [GAME_DIFFICULTY.MEDIUM]: {
    startSpeed: 0.32,
    maxSpeed: 0.52,
    speedAccel: 0.011,
    spawnMin: 1.02,
    spawnMaxExtra: 0.82,
    spawnInFirst: 0.95,
    roadScrollMult: 172,
    rockChance: 0.64,
  },
  [GAME_DIFFICULTY.HARD]: {
    startSpeed: 0.42,
    maxSpeed: 0.68,
    speedAccel: 0.015,
    spawnMin: 0.85,
    spawnMaxExtra: 0.7,
    spawnInFirst: 0.85,
    roadScrollMult: 220,
    rockChance: 0.72,
  },
};

const randomLane = () => Math.floor(Math.random() * 3);

const createRoadObject = (rockChance) => ({
  id: `${Date.now()}-${Math.random()}`,
  lane: randomLane(),
  z: 1.15,
  type: Math.random() < rockChance ? 'rock' : 'star',
  passed: false,
  collected: false,
});

/** Fixed depth for the player (near camera); must sit inside obstacle hit z-range logic */
const PLAYER_Z = 0.058;

function projectWorldToScreen(state, lane, z) {
  const w = state.width;
  const h = state.height;
  const horizonY = h * 0.26;
  const roadHeight = h * 0.68;
  const nearHalfRoadWidth = w * 0.46;
  const farHalfRoadWidth = w * 0.09;
  const t = Math.max(0, Math.min(1, 1 - z));
  const laneWidthNear = (nearHalfRoadWidth * 2) / 3;
  const laneWidthFar = (farHalfRoadWidth * 2) / 3;
  const laneStep = laneWidthFar + (laneWidthNear - laneWidthFar) * t;
  const x = w / 2 + (lane - 1) * laneStep * 0.92;
  const y = horizonY + t ** 1.65 * roadHeight;
  return { x, y };
}

export default function RunnerDashGame({
  onExit,
  soundManager,
  difficulty = GAME_DIFFICULTY.HARD,
  runnerCharacter,
  onRunnerCharacterChange,
}) {
  const runnerId = normalizeRunnerDashCharacter(runnerCharacter);
  const runnerImageSrc = getRunnerDashCharacterImageSrc(runnerId);
  const runnerImageAlt = getRunnerDashCharacterAltHe(runnerId);
  const runnerParams = useMemo(
    () => RUNNER_PARAMS[difficulty] ?? RUNNER_PARAMS[GAME_DIFFICULTY.HARD],
    [difficulty]
  );

  const difficultyLabel = useMemo(() => {
    if (difficulty === GAME_DIFFICULTY.HARD) return 'קשה';
    if (difficulty === GAME_DIFFICULTY.MEDIUM) return 'בינוני';
    return 'קל';
  }, [difficulty]);

  const [showInstructions, setShowInstructions] = useState(true);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const [view, setView] = useState(INITIAL_VIEW);
  const [crashBoom, setCrashBoom] = useState(null);
  const [starBursts, setStarBursts] = useState([]);

  const gameAreaRef = useRef(null);
  const rafRef = useRef(null);
  const resetTimerRef = useRef(null);
  const celebrateTimerRef = useRef(null);
  const lastTsRef = useRef(0);
  const pointerStartRef = useRef(null);
  const frameRef = useRef(0);
  const stateRef = useRef(INITIAL_VIEW);
  const scoreRef = useRef(0);
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const syncView = useCallback(() => {
    const snapshot = stateRef.current;
    setView({ ...snapshot, objects: [...snapshot.objects] });
  }, []);

  const startRound = useCallback(() => {
    const p = runnerParams;
    const rect = gameAreaRef.current?.getBoundingClientRect();
    stateRef.current = {
      width: Math.max(320, Math.floor(rect?.width ?? window.innerWidth)),
      height: Math.max(480, Math.floor(rect?.height ?? window.innerHeight)),
      lane: 1,
      speed: p.startSpeed,
      spawnIn: p.spawnInFirst,
      roadOffset: 0,
      running: true,
      objects: [],
    };
    scoreRef.current = 0;
    setScore(0);
    setStarBursts([]);
    setCrashBoom(null);
    lastTsRef.current = 0;
    syncView();
  }, [runnerParams, syncView]);

  const triggerCelebration = useCallback(() => {
    if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
    setShowCelebration(true);
    if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
    celebrateTimerRef.current = setTimeout(() => {
      setShowCelebration(false);
      setCelebrationPhoto(null);
    }, 1000);
  }, [getRandomPhoto, hasPhotos]);

  const crashAndRestart = useCallback(() => {
    const current = stateRef.current;
    if (!current.running) return;
    current.running = false;
    stateRef.current = current;
    syncView();
    soundManager?.playEncouragement();
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(startRound, 1100);
  }, [soundManager, startRound, syncView]);

  const changeLane = useCallback((delta) => {
    const current = stateRef.current;
    if (!current.running) return;
    current.lane = Math.max(0, Math.min(2, current.lane + delta));
    stateRef.current = current;
    syncView();
  }, [syncView]);

  useEffect(() => {
    if (showInstructions) return undefined;
    startRound();

    const p = runnerParams;

    const frame = (ts) => {
      const current = stateRef.current;
      if (!current.running) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      if (!lastTsRef.current) {
        lastTsRef.current = ts;
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.035);
      lastTsRef.current = ts;

      current.speed = Math.min(p.maxSpeed, current.speed + dt * p.speedAccel);
      current.spawnIn -= dt;
      if (current.spawnIn <= 0) {
        current.objects.push(createRoadObject(p.rockChance));
        current.spawnIn = p.spawnMin + Math.random() * p.spawnMaxExtra;
      }

      current.objects = current.objects
        .map((obj) => ({ ...obj, z: obj.z - current.speed * dt }))
        .filter((obj) => obj.z > -0.15);

      let didCrash = false;
      for (const obj of current.objects) {
        const inHitWindow = obj.z < 0.2 && obj.z > 0.02 && obj.lane === current.lane;
        if (obj.type === 'star' && inHitWindow && !obj.collected) {
          obj.collected = true;
          scoreRef.current += 2;
          setScore(scoreRef.current);
          const { x, y } = projectWorldToScreen(current, obj.lane, obj.z);
          const burstId = `${Date.now()}-${Math.random()}`;
          setStarBursts((prev) => [...prev.slice(-6), { id: burstId, x, y }]);
          window.setTimeout(() => {
            setStarBursts((prev) => prev.filter((b) => b.id !== burstId));
          }, 600);
        }
        if (obj.type === 'rock' && inHitWindow && !obj.passed) {
          obj.passed = true;
          const { x, y } = projectWorldToScreen(current, current.lane, PLAYER_Z);
          setCrashBoom({ id: Date.now(), x, y });
          window.setTimeout(() => setCrashBoom(null), 750);
          stateRef.current = current;
          crashAndRestart();
          didCrash = true;
          break;
        }
        if (obj.z < 0.02 && !obj.passed) {
          obj.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
          if (scoreRef.current > 0 && scoreRef.current % 20 === 0) {
            triggerCelebration();
          }
        }
      }

      if (didCrash) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      current.roadOffset = (current.roadOffset + dt * current.speed * p.roadScrollMult) % 90;
      stateRef.current = current;
      frameRef.current += 1;
      if (frameRef.current % 2 === 0) syncView();
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [crashAndRestart, runnerParams, showInstructions, soundManager, startRound, syncView, triggerCelebration]);

  useEffect(() => {
    if (showInstructions) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        changeLane(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        changeLane(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showInstructions, changeLane]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
    },
    []
  );

  const horizonY = view.height * 0.26;
  const roadHeight = view.height * 0.68;
  const nearHalfRoadWidth = view.width * 0.46;
  const farHalfRoadWidth = view.width * 0.09;

  const projectLaneX = (lane, z) => {
    const t = Math.max(0, Math.min(1, 1 - z));
    const laneWidthNear = nearHalfRoadWidth * 2 / 3;
    const laneWidthFar = farHalfRoadWidth * 2 / 3;
    const laneStep = laneWidthFar + (laneWidthNear - laneWidthFar) * t;
    return view.width / 2 + (lane - 1) * laneStep * 0.92;
  };

  const projectY = (z) => {
    const t = Math.max(0, Math.min(1, 1 - z));
    return horizonY + Math.pow(t, 1.65) * roadHeight;
  };

  return (
    <div
      ref={gameAreaRef}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        const el = e.target;
        if (el instanceof Element && el.closest('button, a[href], [role="button"], input, textarea, select')) {
          return;
        }
        pointerStartRef.current = e.clientX;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      onPointerUp={(e) => {
        const startX = pointerStartRef.current;
        pointerStartRef.current = null;
        if (startX == null) return;
        const diff = e.clientX - startX;
        if (Math.abs(diff) > 28) {
          changeLane(diff > 0 ? 1 : -1);
        }
      }}
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '-webkit-fill-available',
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        touchAction: 'none',
        background: `linear-gradient(180deg, ${COLORS.skyTop} 0%, ${COLORS.skyBottom} 100%)`,
      }}
    >
      <GameBackButton onExit={onExit} />
      <GameScoreBadge
        iconSrc={runnerImageSrc}
        iconAlt={runnerImageAlt}
        score={score}
        accentColor={COLORS.accent}
      />

      {!showInstructions && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 'calc(52px + env(safe-area-inset-top, 0px))',
              left: 12,
              fontSize: 13,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.92)',
              textShadow: '0 1px 5px rgba(0,0,0,0.4)',
              zIndex: 9998,
              pointerEvents: 'none',
              fontFamily: 'var(--font-ui)',
            }}
          >
            רמה {difficultyLabel}
          </div>

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: horizonY + 24,
              background: 'linear-gradient(180deg, #7DD3FC 0%, #DBEAFE 100%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: horizonY,
              width: nearHalfRoadWidth * 2,
              height: roadHeight,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, #64748B 0%, #334155 55%, #1E293B 100%)',
              clipPath: `polygon(${50 - (farHalfRoadWidth / nearHalfRoadWidth) * 50}% 0%, ${50 + (farHalfRoadWidth / nearHalfRoadWidth) * 50}% 0%, 100% 100%, 0% 100%)`,
              boxShadow: 'inset 0 14px 30px rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }}
          />

          {Array.from({ length: 9 }).map((_, idx) => {
            const y = horizonY + idx * 84 + (view.roadOffset % 84);
            const t = (y - horizonY) / Math.max(roadHeight, 1);
            const width = farHalfRoadWidth * 2 + (nearHalfRoadWidth * 2 - farHalfRoadWidth * 2) * t;
            return (
              <div
                key={`stripe-${idx}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: y,
                  width: Math.max(10, width * 0.06),
                  height: Math.max(8, 14 * t),
                  transform: 'translateX(-50%)',
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.78)',
                  pointerEvents: 'none',
                }}
              />
            );
          })}

          <div
            style={{
              position: 'absolute',
              left: projectLaneX(view.lane, PLAYER_Z),
              top: projectY(PLAYER_Z),
              transform: 'translate(-50%, -100%)',
              width: 22 + (1 - PLAYER_Z) * 72,
              height: 22 + (1 - PLAYER_Z) * 72,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              zIndex: 125,
              filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))',
              animation: 'runner-dash-bob 0.32s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          >
            <img
              key={runnerId}
              src={runnerImageSrc}
              alt={runnerImageAlt}
              width={Math.round(22 + (1 - PLAYER_Z) * 72)}
              height={Math.round(22 + (1 - PLAYER_Z) * 72)}
              decoding="async"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: '50% 100%',
                display: 'block',
                userSelect: 'none',
              }}
            />
          </div>

          {starBursts.map((burst) => (
            <div
              key={burst.id}
              aria-hidden
              style={{
                position: 'absolute',
                left: burst.x,
                top: burst.y,
                transform: 'translate(-50%, -50%)',
                width: 120,
                height: 120,
                pointerEvents: 'none',
                zIndex: 480,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(253,224,71,0.95) 0%, rgba(245,158,11,0.45) 35%, transparent 70%)',
                  transformOrigin: '50% 50%',
                  animation: 'runner-star-burst 0.55s ease-out forwards',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 52,
                  animation: 'runner-star-emoji 0.5s ease-out forwards',
                  filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.9))',
                }}
              >
                ⭐
              </div>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <span
                  key={deg}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 4,
                    height: 28,
                    marginLeft: -2,
                    marginTop: -14,
                    transformOrigin: '50% 50%',
                    transform: `rotate(${deg}deg) translateY(-36px)`,
                    background: 'linear-gradient(180deg, #FDE047, transparent)',
                    borderRadius: 2,
                    animation: 'runner-star-ray-fade 0.48s ease-out forwards',
                  }}
                />
              ))}
            </div>
          ))}

          {crashBoom && (
            <div
              key={crashBoom.id}
              aria-hidden
              style={{
                position: 'absolute',
                left: crashBoom.x,
                top: crashBoom.y,
                transform: 'translate(-50%, -55%)',
                pointerEvents: 'none',
                zIndex: 490,
                width: 200,
                height: 200,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  transformOrigin: '50% 50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(251,146,60,0.55) 25%, rgba(220,38,38,0.4) 50%, transparent 72%)',
                  animation: 'runner-crash-boom 0.72s ease-out forwards',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: -40,
                  borderRadius: '50%',
                  border: '6px solid rgba(251,191,36,0.7)',
                  transformOrigin: '50% 50%',
                  animation: 'runner-crash-ring 0.7s ease-out forwards',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 88,
                  lineHeight: 1,
                  animation: 'runner-crash-emoji 0.65s ease-out forwards',
                  filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.35))',
                }}
              >
                💥
              </div>
            </div>
          )}

          {view.objects.map((obj) => {
            const y = projectY(obj.z);
            const x = projectLaneX(obj.lane, obj.z);
            const t = Math.max(0, Math.min(1, 1 - obj.z));
            const size = 22 + t * 72;
            return (
              <div
                key={obj.id}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -100%)',
                  width: size,
                  height: size,
                  borderRadius: obj.type === 'rock' ? 16 : 999,
                  display: obj.collected ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: obj.type === 'rock' ? 'linear-gradient(180deg, #F97316 0%, #DC2626 100%)' : 'linear-gradient(180deg, #FDE047 0%, #F59E0B 100%)',
                  border: '2px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
                  fontSize: size * 0.52,
                  zIndex: Math.round(t * 100),
                  pointerEvents: 'none',
                }}
              >
                {obj.type === 'rock' ? '🚧' : '⭐'}
              </div>
            );
          })}

          <div
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 'calc(54px + env(safe-area-inset-bottom, 0px))',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              background: 'rgba(15,23,42,0.78)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 18,
              zIndex: 150,
              maxWidth: 'min(420px, 96vw)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 11,
                fontWeight: 800,
                fontFamily: 'var(--font-ui)',
                flexShrink: 0,
              }}
            >
              דמות
            </span>
            {RUNNER_DASH_CHARACTER_OPTIONS.map((opt) => {
              const id = opt.value;
              const selected = runnerId === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={opt.label}
                  aria-pressed={selected}
                  title={opt.label}
                  onClick={() => onRunnerCharacterChange?.(id)}
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    borderRadius: 12,
                    padding: 2,
                    border: selected ? '3px solid #FDE047' : '2px solid rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.96)',
                    cursor: onRunnerCharacterChange ? 'pointer' : 'default',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={getRunnerDashCharacterImageSrc(id)}
                    alt=""
                    width={40}
                    height={40}
                    decoding="async"
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: '50% 100%',
                      display: 'block',
                      pointerEvents: 'none',
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 'calc(12px + env(safe-area-inset-bottom))',
              transform: 'translateX(-50%)',
              background: 'rgba(15,23,42,0.45)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 16,
              padding: '8px 16px',
              zIndex: 100,
              pointerEvents: 'none',
            }}
          >
            <div style={{ color: '#FFF', fontWeight: 800, fontSize: 15, textAlign: 'center', fontFamily: 'var(--font-ui)' }}>
              מסלול {view.lane + 1}
            </div>
          </div>
        </>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="מרוץ כמו Temple Run! 🏃"
          buttonText="יאללה לרוץ! ✨"
          onStart={() => setShowInstructions(false)}
          accentColor="#1D4ED8"
        >
          <p>👀 המבט הוא מגוף ראשון - כמו במסלול אמיתי.</p>
          <p>⌨️ מקשי החצים שמאלה/ימינה במקלדת, או סווייפ ימינה/שמאלה על המסך.</p>
          <p>⭐ אוספים כוכבים ונמנעים מהמכשולים.</p>
          <p>🦸 בתחתית המסך אפשר להחליף דמות (גוסט ספיידי, ספיידי, ספין) — נשמר גם בהגדרות.</p>
          <p>⚙️ רמת קושי של המרוץ נבחרת בהגדרות תחת &quot;מרוץ 3D&quot;.</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="אלוף! ממשיכים לרוץ! 🌈"
        photo={celebrationPhoto}
        accentColor="#1D4ED8"
        numberOfPieces={140}
      />

      <style>{`
        @keyframes runner-dash-bob {
          0%, 100% { transform: translate(-50%, calc(-100% + 2px)); }
          50% { transform: translate(-50%, calc(-100% - 10px)); }
        }
        @keyframes runner-star-burst {
          0% { transform: scale(0.2); opacity: 1; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes runner-star-emoji {
          0% { transform: translate(-50%, -50%) scale(0.4) rotate(-25deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5) rotate(15deg); opacity: 0; }
        }
        @keyframes runner-star-ray-fade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes runner-crash-boom {
          0% { transform: scale(0.15); opacity: 1; }
          35% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        @keyframes runner-crash-ring {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes runner-crash-emoji {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
          40% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
