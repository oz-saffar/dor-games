import { useState, useEffect, useCallback } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';
import { GAME_DIFFICULTY } from '../lib/gameDifficulties';

const ACCENT = '#0e7490';

const SHADOW_GROUPS = [
  ['🐶', '🐺', '🦊', '🐱', '🐭'],
  ['🚗', '🚙', '🚕', '🚌', '🚓'],
  ['🍎', '🍑', '🍅', '🍊', '🍒'],
  ['⚽', '🏀', '🏐', '🥎', '🎾'],
  ['🌷', '🌹', '🌺', '🌸', '🌻'],
];

const DIFFICULTY_CONFIG = {
  [GAME_DIFFICULTY.EASY]: { optionsCount: 3, similarDistractors: 1 },
  [GAME_DIFFICULTY.MEDIUM]: { optionsCount: 4, similarDistractors: 2 },
  [GAME_DIFFICULTY.HARD]: { optionsCount: 6, similarDistractors: 4 },
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const flattenPool = SHADOW_GROUPS.flat();

const ShadowMatchGame = ({ onExit, soundManager, difficulty = GAME_DIFFICULTY.EASY }) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [score, setScore] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const generateChallenge = useCallback(() => {
    const cfg = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG[GAME_DIFFICULTY.EASY];
    const group = SHADOW_GROUPS[Math.floor(Math.random() * SHADOW_GROUPS.length)];
    const target = group[Math.floor(Math.random() * group.length)];
    const sameGroup = group.filter((item) => item !== target);
    const similar = shuffle(sameGroup).slice(0, cfg.similarDistractors);
    const remainingCount = Math.max(0, cfg.optionsCount - 1 - similar.length);
    const farPool = flattenPool.filter((item) => item !== target && !group.includes(item));
    const farDistractors = shuffle(farPool).slice(0, remainingCount);
    const options = shuffle([target, ...similar, ...farDistractors]).slice(0, cfg.optionsCount);

    setChallenge({ target, options });
  }, [difficulty]);

  useEffect(() => {
    if (!showInstructions) {
      generateChallenge();
    }
  }, [showInstructions, generateChallenge]);

  const handleSelect = (selected) => {
    if (!challenge) return;
    if (selected === challenge.target) {
      setScore((prev) => prev + 1);
      soundManager?.playWin();
      setShowCelebration(true);
      if (hasPhotos) {
        setCelebrationPhoto(getRandomPhoto());
      }
      setTimeout(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
        generateChallenge();
      }, 1800);
      return;
    }

    soundManager?.playEncouragement();
  };

  return (
    <div
      className="fixed flex h-[100dvh] w-screen items-center justify-center overflow-hidden p-4"
      style={{
        minHeight: '-webkit-fill-available',
        background: 'linear-gradient(155deg, #0c4a6e 0%, #38bdf8 55%, #7dd3fc 100%)',
      }}
    >
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="⭐" score={score} accentColor={ACCENT} />

      {!showInstructions && challenge && (
        <div className="flex w-full max-w-[720px] flex-col items-center gap-5">
          <h2
            className="font-display m-0 text-center text-white"
            style={{
              fontSize: 'clamp(26px, 6vw, 42px)',
              textShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}
          >
            מצא את הציור שמתאים לצל
          </h2>

          <div
            className="flex min-h-[160px] w-full items-center justify-center rounded-dor-xl border border-white/30 bg-white/95 shadow-dor-card"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.15), inset 0 1px 0 #fff' }}
          >
            <span className="text-[clamp(80px,17vw,130px)] brightness-0">{challenge.target}</span>
          </div>

          <div
            className="grid w-full gap-3"
            style={{
              gridTemplateColumns: `repeat(${Math.min(challenge.options.length, 3)}, minmax(0, 1fr))`,
            }}
          >
            {challenge.options.map((option) => (
              <button
                key={`${challenge.target}-${option}`}
                type="button"
                onClick={() => handleSelect(option)}
                className="min-h-[88px] cursor-pointer rounded-dor-lg border-[3px] border-cyan-800/15 bg-white text-[clamp(40px,9vw,58px)] shadow-dor-sm active:scale-[0.98]"
                style={{ boxShadow: 'var(--dor-shadow-card), inset 0 1px 0 #fff' }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="צלליות! 🌗"
          buttonText="בוא נשחק! 🌗"
          onStart={() => setShowInstructions(false)}
          accentColor={ACCENT}
        >
          <p>👀 רואים צל גדול למעלה</p>
          <p>👆 לוחצים על הציור שמתאים בדיוק</p>
          <p>⭐ כל תשובה נכונה נותנת נקודה</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="כל הכבוד! 🎉"
        photo={celebrationPhoto}
        accentColor="#15803d"
        numberOfPieces={200}
      />
    </div>
  );
};

export default ShadowMatchGame;
