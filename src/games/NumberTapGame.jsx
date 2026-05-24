import { useState, useCallback } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useIsLandscape } from '../hooks/useOrientation';
import { SCORE_BADGE, SCORE_BADGE_CONTENT } from '../lib/designTokens';
import {
  GameBackButton,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

/**
 * NumberTapGame - Tap the correct number
 * Teaches number recognition 0-9
 */
const COUNT_ICONS = ['🌟', '🎈', '⚽', '🎨', '🚗', '🦋', '🍎', '🌈', '🎵', '🌺', '🐠', '🎁'];

const NumberTapGame = ({ onExit, soundManager }) => {
  const isLandscape = useIsLandscape();
  const [showInstructions, setShowInstructions] = useState(true);
  const [targetNumber, setTargetNumber] = useState(null);
  const [currentIcon, setCurrentIcon] = useState('🌟');
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const [level, setLevel] = useState(1);

  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const generateChallenge = useCallback(() => {
    const newTarget = Math.floor(Math.random() * 10);
    const options = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const randomIcon = COUNT_ICONS[Math.floor(Math.random() * COUNT_ICONS.length)];
    setCurrentIcon(randomIcon);
    setTargetNumber({
      number: newTarget,
      options
    });
  }, [level]);

  const handleStartGame = () => {
    setShowInstructions(false);
    generateChallenge();
  };

  const handleNumberSelect = (selectedNum) => {
    if (selectedNum === targetNumber.number) {
      setScore(score + 1);
      setLevel(level + 1);
      soundManager?.playWin();
      setShowCelebration(true);
      if (hasPhotos) {
        setCelebrationPhoto(getRandomPhoto());
      }
      setTimeout(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
        generateChallenge();
      }, 2000);
    } else {
      soundManager?.playEncouragement();
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      minHeight: '-webkit-fill-available',
      background: 'linear-gradient(145deg, #c2410c 0%, #ea580c 50%, #fb923c 100%)',
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px'
    }}>
      <GameBackButton onExit={onExit} />

      {/* Score & Level */}
      <div style={{
        position: 'absolute',
        top: SCORE_BADGE.top,
        left: '12px',
        display: 'flex',
        gap: '8px',
        zIndex: 100
      }}>
        <div style={{ ...SCORE_BADGE_CONTENT, backgroundColor: 'white', color: '#F97316' }}>
          🏆 {score}
        </div>
        <div style={{ ...SCORE_BADGE_CONTENT, backgroundColor: 'white', color: '#F97316' }}>
          שלב {level}
        </div>
      </div>

      {/* ── Game area ── */}
      {!showInstructions && targetNumber && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isLandscape ? 8 : 12,
          width: '100%',
          maxWidth: isLandscape ? '95vw' : 500,
          paddingTop: isLandscape ? 8 : 'calc(56px + env(safe-area-inset-top))',
          paddingBottom: isLandscape ? 8 : 20,
        }}>

          {/* Question title */}
          <h2 style={{
            fontSize: 'clamp(22px, 5vw, 36px)',
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            color: 'white',
            textAlign: 'center',
            textShadow: '0 2px 12px rgba(0,0,0,0.25)',
            margin: 0
          }}>
            כמה ציורים יש במסך?
          </h2>

          {/* Emoji display */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: isLandscape ? '10px 14px' : '16px 20px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            width: '100%',
            marginBottom: isLandscape ? 0 : 20,
          }}>
            {targetNumber.number === 0 ? (
              <div style={{ minHeight: 'clamp(50px, 11vw, 70px)' }} />
            ) : (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'center'
              }}>
                {Array.from({ length: targetNumber.number }).map((_, i) => (
                  <span key={i} style={{ fontSize: 'clamp(40px, 10vw, 62px)' }}>
                    {currentIcon}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Number grid — 5 columns × 2 rows, or 10 columns in landscape */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isLandscape ? 'repeat(10, 1fr)' : 'repeat(5, 1fr)',
            gap: isLandscape ? 6 : 'clamp(6px, 2vw, 10px)',
            width: '100%',
          }}>
            {targetNumber.options.map((num) => (
              <button
                key={num}
                onClick={() => handleNumberSelect(num)}
                style={{
                  backgroundColor: 'white',
                  border: '3px solid rgba(255,255,255,0.7)',
                  borderRadius: '12px',
                  padding: 'clamp(8px, 2vw, 14px) 4px',
                  minHeight: isLandscape ? 'clamp(44px, 22vh, 60px)' : 'clamp(56px, 10vh, 80px)',
                  minWidth: '0',
                  fontSize: 'clamp(30px, 7vw, 50px)',
                  fontWeight: '900',
                  color: '#F97316',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                  transition: 'transform 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.93)'}
                onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {num}
              </button>
            ))}
          </div>

        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="זיהוי מספרים! 🔢"
          buttonText="בוא נשחק! 🔢"
          onStart={handleStartGame}
          accentColor="#F97316"
        >
          <p>🌟 <strong>ראה כמה ציורים יש!</strong></p>
          <p>🔢 <strong>לחץ על המספר הנכון!</strong></p>
          <p>🎯 <strong>למד לזהות מספרים 0-9!</strong></p>
          <p>📸 <strong>תמונות של דור בכל הצלחה!</strong></p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="נכון! 🎉"
        subtitle="יופי של דור!"
        photo={celebrationPhoto}
        accentColor="#4CAF50"
        numberOfPieces={200}
      />
    </div>
  );
};

export default NumberTapGame;
