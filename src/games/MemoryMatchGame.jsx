import { useState, useEffect, useRef, useCallback } from 'react';
import { useViewport } from '../hooks/useViewport';
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
  const { width: vw, height: vh, isLandscape, isTablet } = useViewport();
  const [showInstructions, setShowInstructions] = useState(true);
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const celebrationTimerRef = useRef(null);
  const mismatchTimerRef = useRef(null);
  const photoErrorRetriesRef = useRef(0);
  const { getRandomPhoto, hasPhotos, isLoading, photos } = useDorPhotos();

  // Mirrors flippedIndices synchronously: two quick taps land in the same React
  // batch, and a handler reading the state variable there would let the second
  // tap overwrite the first instead of completing the pair. Always written
  // alongside setFlippedIndices, never during render.
  const flippedRef = useRef([]);

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
  const rows = Math.ceil((totalPairs * 2) / cols);

  // Cards are sized to the board, not to the width alone: on the iPad the old
  // "as wide as 95vw allows" rule made 370px cards and pushed the bottom row —
  // and the hint under it — clean off the screen.
  const cardGapPx = totalPairs > 12 ? 8 : totalPairs > 6 ? 10 : 12;
  const cardSize = (() => {
    const chromeH = isLandscape && !isTablet ? 120 : 170;
    const byWidth = (vw - 32 - cardGapPx * (cols - 1)) / cols;
    const byHeight = (vh - chromeH - cardGapPx * (rows - 1)) / rows;
    const ceiling = isTablet ? 190 : 150;
    return Math.max(44, Math.floor(Math.min(byWidth, byHeight, ceiling)));
  })();

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
    flippedRef.current = [];
    setFlippedIndices([]);
    setMatchedPairs([]);
  };

  // Latest-render copy, so the celebration timer deals a fresh board rather than
  // replaying the one captured when it was scheduled.
  const initGameRef = useRef(initializeGame);
  useEffect(() => {
    initGameRef.current = initializeGame;
  });

  useEffect(() => {
    if (!showInstructions) {
      initializeGame();
    }
  }, [showInstructions, numPairs]);

  useEffect(
    () => () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
      if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current);
    },
    []
  );

  /** Turn the two wrong cards back over, whether the timer got there or a tap did. */
  const clearMismatch = () => {
    if (mismatchTimerRef.current) {
      clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    }
    flippedRef.current = [];
    setFlippedIndices([]);
  };

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
    if (showCelebration || cards[index].isMatched) return;
    let flipped = flippedRef.current;

    // Two wrong cards are showing and the child has already moved on. Rather than
    // ignoring the tap for the rest of the second-long reveal — which is what made
    // the game feel like it needed several presses — turn the pair straight back
    // over and treat this tap as the first card of the next pair.
    if (flipped.length >= 2) {
      if (flipped.includes(index)) return;
      clearMismatch();
      flipped = [];
    }

    if (flipped.includes(index)) return;

    const newFlippedIndices = [...flipped, index];
    flippedRef.current = newFlippedIndices;
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
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
        flippedRef.current = [];
        setFlippedIndices([]);

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
        mismatchTimerRef.current = setTimeout(clearMismatch, 1000);
      }
    }
  };

  const cardFontSize = `${Math.round(cardSize * 0.52)}px`;

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      minHeight: '-webkit-fill-available',
      background: 'var(--game-surface)',
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
      <GameScoreBadge icon="🎯" score={score} accentColor="var(--game-accent)" />

      {!showInstructions && cards.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          paddingTop: 'calc(44px + env(safe-area-inset-top))'
        }}>
          <h2 style={{
            fontSize: 'clamp(22px, 5vw, 36px)',
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            color: 'var(--dor-ink)',
            textAlign: 'center',
            margin: 0
          }}>
            מצא את הזוגות — בלי סוף!
          </h2>

          {/* Card Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${cardSize}px)`,
            gap: `${cardGapPx}px`,
            justifyContent: 'center'
          }}>
            {cards.map((card, index) => {
              const isFlipped = flippedIndices.includes(index) || card.isMatched;
              
              return (
                <button
                  key={card.id}
                  // Flip on pointer-down, not click: on iOS a click after a touch is
                  // easily swallowed (tiny finger drift), which made a card need
                  // several presses. onClick stays for keyboard activation only
                  // (detail === 0), so a tap never counts twice.
                  onPointerDown={() => handleCardClick(index)}
                  onClick={(e) => { if (e.detail === 0) handleCardClick(index); }}
                  disabled={showCelebration || card.isMatched}
                  style={{
                    aspectRatio: '1',
                    backgroundColor: isFlipped ? 'var(--dor-panel)' : 'var(--game-accent)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: cardFontSize,
                    cursor:
                      showCelebration || card.isMatched ? 'default' : 'pointer',
                    boxShadow: 'var(--dor-shadow-card)',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: card.isMatched ? 0.45 : 1,
                    minWidth: 0,
                    padding: '4px',
                    // never let the browser treat a tap on a card as a pan gesture
                    touchAction: 'none'
                  }}
                  onTouchStart={(e) => {
                    if (!showCelebration && !card.isMatched) {
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
            color: 'var(--dor-ink-muted)',
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
          accentColor="var(--game-accent)"
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
        accentColor="var(--game-accent)"
        numberOfPieces={160}
      />
    </div>
  );
};

export default MemoryMatchGame;
