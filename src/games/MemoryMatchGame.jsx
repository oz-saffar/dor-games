import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsLandscape } from '../hooks/useOrientation';
import { useDorPhotos } from '../hooks/useDorPhotos';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

/**
 * MemoryMatchGame - Simple memory matching for kids
 * Supports 2–20 pairs with auto-scaling grid; endless rounds (new board after each clear)
 */
const MemoryMatchGame = ({ onExit, soundManager, numPairs = 3 }) => {
  const isLandscape = useIsLandscape();
  const [showInstructions, setShowInstructions] = useState(true);
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [score, setScore] = useState(0);
  const [canFlip, setCanFlip] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const celebrationTimerRef = useRef(null);
  const photoErrorRetriesRef = useRef(0);
  const { getRandomPhoto, hasPhotos, isLoading, photos } = useDorPhotos();

  // Emoji set supports up to 20 pairs
  const emojis = ['🦖', '🍦', '🎈', '⭐', '❤️', '🌈', '🐶', '🦋', '🌸', '🎸', '🚀', '🍕', '🐱', '🐻', '🍎', '🌟', '🎉', '🦄', '🐸', '🍊'];

  const totalPairs = Math.min(Math.max(2, numPairs), emojis.length);

  // Grid columns: more columns in landscape (more width)
  const getColumns = (pairs) => {
    const cards = pairs * 2;
    if (isLandscape) {
      if (cards <= 4) return 2;
      if (cards <= 6) return 3;
      if (cards <= 8) return 4;
      if (cards <= 12) return 6;
      return 10; // up to 10 columns for 20 cards
    }
    if (cards <= 4) return 2;
    if (cards <= 6) return 3;
    if (cards <= 12) return 4;
    return 5;
  };
  const cols = getColumns(totalPairs);

  const initializeGame = () => {
    const selectedEmojis = emojis.slice(0, totalPairs);
    const pairs = [...selectedEmojis, ...selectedEmojis];
    
    const shuffled = pairs.sort(() => Math.random() - 0.5).map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false
    }));
    
    setCards(shuffled);
    setFlippedIndices([]);
    setMatchedPairs([]);
  };

  const initGameRef = useRef(initializeGame);
  initGameRef.current = initializeGame;

  useEffect(() => {
    if (!showInstructions) {
      initializeGame();
    }
  }, [showInstructions, numPairs]);

  useEffect(
    () => () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    },
    []
  );

  /** Pick a celebration photo once overlay is open and the photo list is ready (avoids null on first paint). */
  useEffect(() => {
    if (!showCelebration) {
      setCelebrationPhoto(null);
      photoErrorRetriesRef.current = 0;
      return;
    }
    if (!hasPhotos || isLoading) return;
    setCelebrationPhoto((prev) => (prev == null ? getRandomPhoto() : prev));
  }, [showCelebration, hasPhotos, isLoading, getRandomPhoto]);

  const handleCelebrationPhotoError = useCallback(() => {
    photoErrorRetriesRef.current += 1;
    if (photoErrorRetriesRef.current > 12 || !photos.length) return;
    setCelebrationPhoto((prev) => {
      const candidates = photos.filter((url) => url !== prev);
      const pool = candidates.length ? candidates : photos;
      return pool[Math.floor(Math.random() * pool.length)];
    });
  }, [photos]);

  const handleCardClick = (index) => {
    if (showCelebration) return;
    if (!canFlip || flippedIndices.includes(index) || cards[index].isMatched) {
      return;
    }

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setCanFlip(false);
      const [first, second] = newFlippedIndices;
      
      if (cards[first].emoji === cards[second].emoji) {
        soundManager?.playWin();
        const newMatched = [...matchedPairs, cards[first].emoji];
        setMatchedPairs(newMatched);
        setScore((s) => s + 1);
        
        const newCards = cards.map((card, idx) => 
          idx === first || idx === second ? { ...card, isMatched: true } : card
        );
        setCards(newCards);
        setFlippedIndices([]);
        setCanFlip(true);

        if (newMatched.length === totalPairs) {
          photoErrorRetriesRef.current = 0;
          if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
          setShowCelebration(true);
          celebrationTimerRef.current = setTimeout(() => {
            celebrationTimerRef.current = null;
            setShowCelebration(false);
            setCelebrationPhoto(null);
            photoErrorRetriesRef.current = 0;
            initGameRef.current();
          }, 2200);
        }
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
          setCanFlip(true);
        }, 1000);
      }
    }
  };

  // Card sizing: bigger cards, max 5 per row
  const cardFontSize = totalPairs <= 3
    ? 'clamp(40px, 9vw, 64px)'
    : totalPairs <= 6
      ? 'clamp(32px, 7vw, 52px)'
      : totalPairs <= 12
        ? 'clamp(26px, 6vw, 42px)'
        : 'clamp(22px, 5vw, 36px)';

  const cardMinHeight = isLandscape
    ? (totalPairs <= 3 ? '72px' : totalPairs <= 6 ? '64px' : totalPairs <= 12 ? '52px' : '42px')
    : (totalPairs <= 3 ? '88px' : totalPairs <= 6 ? '76px' : totalPairs <= 12 ? '62px' : '52px');
  const cardGap = isLandscape ? (totalPairs > 12 ? '6px' : totalPairs > 6 ? '8px' : '10px') : (totalPairs > 12 ? '8px' : totalPairs > 6 ? '10px' : '12px');

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      minHeight: '-webkit-fill-available',
      background: 'linear-gradient(145deg, #4c51bf 0%, #6b5b95 50%, #7c3aed 100%)',
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
      <GameScoreBadge icon="🎯" score={score} accentColor="#667eea" />

      {!showInstructions && cards.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          maxWidth: isLandscape ? '95vw' : '560px',
          paddingTop: 'calc(44px + env(safe-area-inset-top))'
        }}>
          <h2 style={{
            fontSize: 'clamp(22px, 5vw, 36px)',
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            color: 'white',
            textAlign: 'center',
            textShadow: '0 2px 12px rgba(0,0,0,0.25)',
            margin: 0
          }}>
            מצא את הזוגות — בלי סוף!
          </h2>

          {/* Card Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: cardGap,
            width: '100%',
            padding: '0 5px'
          }}>
            {cards.map((card, index) => {
              const isFlipped = flippedIndices.includes(index) || card.isMatched;
              
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  disabled={
                    showCelebration || (!canFlip && !flippedIndices.includes(index))
                  }
                  style={{
                    aspectRatio: '1',
                    backgroundColor: isFlipped ? 'white' : '#4A5568',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: cardFontSize,
                    cursor:
                      showCelebration || !canFlip || card.isMatched ? 'default' : 'pointer',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: card.isMatched ? 0.45 : 1,
                    minHeight: cardMinHeight,
                    minWidth: '0',
                    padding: '4px'
                  }}
                  onTouchStart={(e) => {
                    if (!showCelebration && canFlip && !card.isMatched) {
                      e.currentTarget.style.transform = 'scale(0.93)';
                    }
                  }}
                  onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {isFlipped ? card.emoji : '?'}
                </button>
              );
            })}
          </div>

          <p style={{
            fontSize: 'clamp(15px, 3.5vw, 20px)',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            margin: 0
          }}>
            👆 לחץ על שני קלפים למצוא זוג
          </p>
        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="משחק הזיכרון! 🎯"
          buttonText="בוא נשחק! 🎯"
          onStart={() => setShowInstructions(false)}
          accentColor="#667eea"
        >
          <p>🃏 <strong>קלפים עם אמוג'י!</strong></p>
          <p>👆 <strong>לחץ על שני קלפים</strong></p>
          <p>🎯 <strong>מצא זוגות תואמים!</strong></p>
          <p>⭐ <strong>אחרי שמצאת את כל הזוגות — לוח חדש, והמשחק ממשיך!</strong></p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="מצאת את כל הזוגות! 🎉"
        photo={celebrationPhoto}
        onPhotoError={handleCelebrationPhotoError}
        accentColor="#667eea"
        numberOfPieces={160}
      />
    </div>
  );
};

export default MemoryMatchGame;
