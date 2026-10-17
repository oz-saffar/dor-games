import { useState, useEffect, useCallback } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useViewport } from '../hooks/useViewport';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

/**
 * WhatDoesntBelongGame - Find the odd one out
 * Teaches categorization for 3-5 year olds
 */
const CATEGORIES = [
  { id: 'animals', items: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁'] },
  { id: 'fruits', items: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍌', '🥝', '🍑', '🍒', '🍉'] },
  { id: 'vehicles', items: ['🚗', '🚌', '✈️', '🚀', '🚲', '🛵', '🚢', '🚂', '🚁'] },
  { id: 'food', items: ['🍕', '🍦', '🍫', '🥪', '🍔', '🍟', '🥗', '🧁'] },
  { id: 'toys', items: ['⚽', '🏀', '🎨', '📚', '🪀', '🎸', '🧩', '🎯'] },
  { id: 'nature', items: ['🌳', '🌸', '🌻', '🦋', '🐠', '🌊', '⛅', '🌈'] },
];

const WhatDoesntBelongGame = ({ onExit, soundManager }) => {
  const { isLandscape, isTablet } = useViewport();
  // isTablet lifts the ceilings for Dor's iPad; every phone value is untouched.

  const [showInstructions, setShowInstructions] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const generateChallenge = useCallback(() => {
    const mainCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const otherCats = CATEGORIES.filter((c) => c.id !== mainCat.id);
    const oddCat = otherCats[Math.floor(Math.random() * otherCats.length)];

    const mainItems = [...mainCat.items].sort(() => Math.random() - 0.5).slice(0, 3);
    const oddItem = oddCat.items[Math.floor(Math.random() * oddCat.items.length)];

    const all = [...mainItems, oddItem].sort(() => Math.random() - 0.5);
    const oddIndex = all.indexOf(oddItem);

    setChallenge({ items: all, oddIndex });
  }, []);

  useEffect(() => {
    if (!showInstructions) generateChallenge();
  }, [showInstructions, generateChallenge]);

  const handleSelect = (index) => {
    if (index === challenge.oddIndex) {
      setScore((s) => s + 1);
      soundManager?.playWin();
      setShowCelebration(true);
      if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
      setTimeout(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
        setTimeout(() => generateChallenge(), 150);
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
      background: 'var(--game-surface)',
      position: 'fixed',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="⭐" score={score} accentColor="var(--game-accent)" />

      {!showInstructions && challenge && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isLandscape ? 12 : 24,
          maxWidth: isLandscape ? '95vw' : 500,
          width: '100%',
          paddingTop: isLandscape ? 0 : 'calc(56px + env(safe-area-inset-top))',
        }}>
          <h2 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--dor-ink)', margin: 0 }}>
            מה לא שייך? לחץ על הדבר השונה
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isLandscape ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
            gap: isLandscape ? 10 : 16,
            width: '100%',
            maxWidth: isLandscape ? (isTablet ? 880 : 500) : 360,
          }}>
            {challenge.items.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                style={{
                  backgroundColor: 'var(--dor-panel)',
                  border: '1px solid var(--dor-border)',
                  borderRadius: '20px',
                  padding: '24px',
                  minHeight: isLandscape ? (isTablet ? 180 : 90) : 120,
                  fontSize: isTablet ? 'clamp(48px, 12vw, 116px)' : 'clamp(48px, 12vw, 72px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 3px 0 var(--dor-lip), var(--dor-shadow-card)',
                  transition: 'transform 0.2s',
                }}
                onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="מה לא שייך? 🔍"
          buttonText="בוא נשחק! 🔍"
          onStart={() => setShowInstructions(false)}
          accentColor="var(--game-accent)"
        >
          <p>🔍 <strong>מצא את הדבר השונה!</strong></p>
          <p>👆 <strong>לחץ על מה שלא שייך</strong></p>
          <p>🧠 <strong>חשיבה לוגית!</strong></p>
          <p>⭐ <strong>צבור נקודות!</strong></p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="כל הכבוד! 🎉"
        photo={celebrationPhoto}
        accentColor="var(--game-accent)"
        numberOfPieces={200}
      />
    </div>
  );
};

export default WhatDoesntBelongGame;
