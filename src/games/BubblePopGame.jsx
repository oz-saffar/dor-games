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
 * BubblePopGame Component
 * Simple bubble popping game for 3-year-olds
 * Teaches hand-eye coordination and cause-effect
 */
const BubblePopGame = ({ onExit, soundManager }) => {
  const isLandscape = useIsLandscape();
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  // Generate random bubble
  const generateBubble = useCallback(() => {
    const colors = ['#FF6B9D', '#C44569', '#FFC048', '#00D2FF', '#4A69BD', '#A29BFE', '#6C5CE7'];
    const emojis = ['🌟', '⭐', '✨', '🎈', '🎉', '🎊', '💫', '🌈', '🦋', '🐠'];
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    const maxSize = isLandscape ? 70 : 140;
    const minSize = isLandscape ? 50 : 80;
    const newBubble = {
      id: Date.now() + Math.random(),
      x: Math.random() * Math.max(50, w - 120),
      y: h + 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      speed: isLandscape ? 2.5 + Math.random() * 1.5 : 2 + Math.random() * 2,
      size: minSize + Math.random() * (maxSize - minSize)
    };
    
    return newBubble;
  }, [isLandscape]);

  // Generate initial bubbles
  useEffect(() => {
    if (!showInstructions) {
      const interval = setInterval(() => {
        setBubbles(prev => {
          // Don't add too many bubbles
          if (prev.length < 8) {
            return [...prev, generateBubble()];
          }
          return prev;
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [generateBubble, showInstructions]);

  // Move bubbles up
  useEffect(() => {
    if (!showInstructions) {
      const interval = setInterval(() => {
        setBubbles(prev => {
          return prev
            .map(bubble => ({
              ...bubble,
              y: bubble.y - bubble.speed
            }))
            .filter(bubble => bubble.y > -200); // Remove bubbles that went off screen
        });
      }, 20);

      return () => clearInterval(interval);
    }
  }, [showInstructions]);

  // Pop bubble
  const popBubble = (id) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + 1);
    soundManager?.playCorrect();

    // Show celebration and win sound every 5 pops
    if ((score + 1) % 5 === 0) {
      setShowCelebration(true);
      soundManager?.playWin();
      
      // Get random photo
      if (hasPhotos) {
        setCelebrationPhoto(getRandomPhoto());
      }
      
      setTimeout(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
      }, 3000);
    }
  };

  // Keyboard support - any key pops the first bubble
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (bubbles.length > 0) {
          popBubble(bubbles[0].id);
        }
      }
      if (e.code === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [bubbles, onExit]);

  return (
    <div
      className="relative h-[100dvh] min-h-[100vh] w-screen overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 40%, #4c1d95 100%)',
      }}
    >
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🎈" score={score} accentColor="#A855F7" />

      {/* Bubbles */}
      {bubbles.map(bubble => (
        <button
          key={bubble.id}
          onClick={() => popBubble(bubble.id)}
          style={{
            position: 'absolute',
            left: bubble.x,
            top: bubble.y,
            width: bubble.size,
            height: bubble.size,
            borderRadius: '50%',
            backgroundColor: bubble.color,
            border: '4px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: bubble.size * 0.5,
            transition: 'transform 0.1s',
            animation: 'float 3s ease-in-out infinite',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          {bubble.emoji}
        </button>
      ))}

      {showInstructions && (
        <GameInstructionsOverlay
          title="משחק הבועות! 🎈"
          buttonText="בוא נפוצץ! 🎈"
          onStart={() => setShowInstructions(false)}
          accentColor="#A855F7"
        >
          <p style={{ marginBottom: '12px' }}>🎈 <strong>בועות צבעוניות עולות!</strong></p>
          <p style={{ marginBottom: '12px' }}>👆 <strong>לחץ על הבועות</strong> כדי לפוצץ אותן!</p>
          <p style={{ marginBottom: '12px' }}>⌨️ או לחץ על <strong>רווח</strong> לפוצץ</p>
          <p style={{ marginBottom: '12px' }}>🎉 <strong>קונפטי</strong> כל 5 בועות!</p>
          <p>🏠 <strong>חזרה</strong> - כפתור אדום למעלה</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="כל הכבוד! 🎉"
        subtitle={`${score} בועות! 🎈`}
        photo={celebrationPhoto}
        accentColor="#A855F7"
        numberOfPieces={300}
      />

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(20px); }
        }
      `}</style>
    </div>
  );
};

export default BubblePopGame;

