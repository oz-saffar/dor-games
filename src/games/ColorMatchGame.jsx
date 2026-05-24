import { useState, useEffect, useCallback } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useIsLandscape } from '../hooks/useOrientation';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

/**
 * ColorMatchGame - Match colored objects
 * Perfect for 3-year-olds learning colors
 */
const ColorMatchGame = ({ onExit, soundManager }) => {
  const isLandscape = useIsLandscape();
  const [showInstructions, setShowInstructions] = useState(true);
  const [targetColor, setTargetColor] = useState(null);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const colors = [
    { name: 'אדום', nameEn: 'Red', color: '#E62429', items: ['🍎', '🍓', '🍅', '❤️', '🌹'] },
    { name: 'כחול', nameEn: 'Blue', color: '#2B3B96', items: ['🫐', '💙', '🦋', '🐟', '🌊'] },
    { name: 'ירוק', nameEn: 'Green', color: '#4CAF50', items: ['🍏', '🌿', '🐢', '🥒', '🌳'] },
    { name: 'צהוב', nameEn: 'Yellow', color: '#FCD34D', items: ['🌟', '🌻', '🍌', '🧀', '☀️'] },
    { name: 'סגול', nameEn: 'Purple', color: '#9333EA', items: ['🍇', '🔮', '🦄', '🌂', '👾'] },
    { name: 'כתום', nameEn: 'Orange', color: '#F97316', items: ['🍊', '🎃', '🦊', '🥕', '🧡'] },
    { name: 'ורוד', nameEn: 'Pink', color: '#EC4899', items: ['🌸', '🐷', '💗', '🦩', '🍧'] },
    { name: 'חום', nameEn: 'Brown', color: '#92400E', items: ['🐻', '🥔', '🪵', '🍂', '🤎'] },
    { name: 'שחור', nameEn: 'Black', color: '#1F2937', items: ['🐧', '🎩', '🖤', '⚫', '🦇'] },
    { name: 'לבן', nameEn: 'White', color: '#F3F4F6', items: ['☁️', '🐑', '❄️', '🤍', '🥛'] }
  ];

  const generateChallenge = useCallback(() => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    // Pick 6 random colors including the target
    const otherColors = colors.filter(c => c.name !== randomColor.name);
    const shuffled = otherColors.sort(() => Math.random() - 0.5).slice(0, 5);
    const options = [...shuffled, randomColor].sort(() => Math.random() - 0.5);
    
    setTargetColor({ 
      ...randomColor,
      options: options.map(opt => ({
        ...opt,
        displayItem: opt.items[Math.floor(Math.random() * opt.items.length)]
      }))
    });
  }, []);

  useEffect(() => {
    if (!showInstructions) {
      generateChallenge();
    }
  }, [showInstructions, generateChallenge]);

  const handleColorSelect = (selectedColor) => {
    if (selectedColor.name === targetColor.name) {
      setScore(score + 1);
      soundManager?.playWin();
      setShowCelebration(true);
      
      // Get random photo
      if (hasPhotos) {
        setCelebrationPhoto(getRandomPhoto());
      }
      
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
      background: 'linear-gradient(145deg, #be185d 0%, #ec4899 45%, #f9a8d4 100%)',
      position: 'fixed',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px'
    }}>
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="⭐" score={score} accentColor="#EC4899" />

      {!showInstructions && targetColor && (
        <div style={{
          display: 'flex',
          flexDirection: isLandscape ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isLandscape ? 24 : 30,
          maxWidth: isLandscape ? '90vw' : 600,
          width: '100%',
          flexWrap: isLandscape ? 'wrap' : 'nowrap',
        }}>
          {/* Question */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: 'clamp(32px, 6vw, 48px)',
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              color: 'white',
              marginBottom: '20px',
              textShadow: '0 2px 12px rgba(0,0,0,0.25)'
            }}>
              מצא דברים בצבע:
            </h2>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }}>
              {/* Just the color - no emoji */}
              <div style={{
                width: 'clamp(100px, 20vw, 150px)',
                height: 'clamp(100px, 20vw, 150px)',
                backgroundColor: targetColor.color,
                borderRadius: '50%',
                border: targetColor.name === 'לבן' ? '3px solid #ccc' : 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }} />
              <p style={{
                fontSize: 'clamp(32px, 6vw, 48px)',
                fontWeight: '900',
                color: targetColor.color,
                margin: 0
              }}>
                {targetColor.name}
              </p>
            </div>
          </div>

          {/* Color Options - Items to choose from */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isLandscape ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
            gap: isLandscape ? 8 : 12,
            width: '100%',
            maxWidth: isLandscape ? 280 : 500,
          }}>
            {targetColor.options && targetColor.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleColorSelect(option)}
                style={{
                  backgroundColor: 'white',
                  border: '4px solid rgba(255,255,255,0.8)',
                  borderRadius: '20px',
                  padding: '20px',
                  minHeight: isLandscape ? 70 : 100,
                  fontSize: isLandscape ? 'clamp(32px, 6vw, 48px)' : 'clamp(40px, 8vw, 60px)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onTouchStart={(e) => e.target.style.transform = 'scale(0.95)'}
                onTouchEnd={(e) => e.target.style.transform = 'scale(1)'}
              >
                {option.displayItem}
              </button>
            ))}
          </div>
        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="משחק הצבעים! 🎨"
          buttonText="בוא נשחק! 🎨"
          onStart={() => setShowInstructions(false)}
          accentColor="#EC4899"
        >
          <p>🎨 <strong>למד צבעים!</strong></p>
          <p>👆 <strong>לחץ על הצבע הנכון</strong></p>
          <p>🍎 <strong>התאם את האמוג'י</strong></p>
          <p>⭐ <strong>צבור נקודות!</strong></p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="כל הכבוד! 🎉"
        photo={celebrationPhoto}
        accentColor="#4CAF50"
        numberOfPieces={200}
      />
    </div>
  );
};

export default ColorMatchGame;

