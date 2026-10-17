import { useState, useEffect, useCallback, useRef } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useViewport } from '../hooks/useViewport';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

/**
 * ShapeMatchGame - Match shapes, learn Hebrew shape names
 * Teaches: עיגול, ריבוע, משולש, כוכב, לב, מלבן, מעוין, סהר
 */
const SHAPES = [
  { id: 'circle', name: 'עיגול', color: '#C4614B', render: () => <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#C4614B', border: '3px solid rgba(74,62,46,0.14)', boxShadow: 'var(--dor-shadow-sm)' }} /> },
  { id: 'square', name: 'ריבוע', color: '#6A8FBA', render: () => <div style={{ width: 56, height: 56, background: '#6A8FBA', border: '3px solid rgba(74,62,46,0.14)', boxShadow: 'var(--dor-shadow-sm)' }} /> },
  { id: 'triangle', name: 'משולש', color: '#6E9A63', render: () => <div style={{ width: 0, height: 0, borderLeft: '32px solid transparent', borderRight: '32px solid transparent', borderBottom: '56px solid #6E9A63', filter: 'drop-shadow(0 2px 3px rgba(74,62,46,0.18))' }} /> },
  { id: 'star', name: 'כוכב', color: '#D9B441', render: () => <span style={{ fontSize: 52, lineHeight: 1 }}>⭐</span> },
  { id: 'heart', name: 'לב', color: '#C57F9B', render: () => <span style={{ fontSize: 52, lineHeight: 1 }}>❤️</span> },
  { id: 'rectangle', name: 'מלבן', color: '#5B9A96', render: () => <div style={{ width: 70, height: 44, background: '#5B9A96', border: '3px solid rgba(74,62,46,0.14)', boxShadow: 'var(--dor-shadow-sm)' }} /> },
  { id: 'diamond', name: 'מעוין', color: '#9179AE', render: () => <div style={{ width: 48, height: 48, background: '#9179AE', border: '3px solid rgba(74,62,46,0.14)', boxShadow: 'var(--dor-shadow-sm)', transform: 'rotate(45deg)' }} /> },
  { id: 'crescent', name: 'סהר', color: '#D98A45', render: () => <span style={{ fontSize: 52, lineHeight: 1 }}>🌙</span> },
];

const ShapeMatchGame = ({ onExit, soundManager }) => {
  const { isLandscape, isTablet } = useViewport();
  // isTablet lifts the ceilings for Dor's iPad; every phone value is untouched.

  const [showInstructions, setShowInstructions] = useState(true);
  const [targetShape, setTargetShape] = useState(null);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const prevShapeIdRef = useRef(null);
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const speakShapeName = useCallback((shape) => {
    const text = typeof shape === 'string' ? shape : (shape?.speakText || shape?.name);
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }, []);

  const generateChallenge = useCallback(() => {
    const pool = prevShapeIdRef.current
      ? SHAPES.filter((s) => s.id !== prevShapeIdRef.current)
      : SHAPES;
    const randomShape = pool[Math.floor(Math.random() * pool.length)];
    prevShapeIdRef.current = randomShape.id;
    const others = SHAPES.filter((s) => s.id !== randomShape.id);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 5);
    const options = [...shuffled, randomShape].sort(() => Math.random() - 0.5);
    setTargetShape({ ...randomShape, options });
    setTimeout(() => speakShapeName(randomShape), 400);
  }, [speakShapeName]);

  useEffect(() => {
    if (!showInstructions) generateChallenge();
  }, [showInstructions, generateChallenge]);

  const handleShapeSelect = (selected) => {
    if (selected.id === targetShape.id) {
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
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="⭐" score={score} accentColor="var(--game-accent)" />

      {!showInstructions && targetShape && (
        <div style={{
          display: 'flex',
          flexDirection: isLandscape ? 'row' : 'column',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isLandscape ? 16 : 24,
          maxWidth: isLandscape ? '95vw' : 500,
          width: '100%',
        }}>
          <h2 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--dor-ink)', margin: 0 }}>
            שמע את שם הצורה - איזו צורה זה?
          </h2>
          <button
            onClick={() => speakShapeName(targetShape)}
            style={{
              backgroundColor: 'var(--dor-panel)',
              border: 'none',
              borderRadius: '50%',
              width: 'clamp(90px, 22vw, 120px)',
              height: 'clamp(90px, 22vw, 120px)',
              fontSize: 'clamp(44px, 11vw, 64px)',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            🔈
          </button>
          <p style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', color: 'var(--dor-ink-muted)', margin: 0 }}>לחץ שוב להאזנה</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isLandscape ? 'repeat(6, 1fr)' : 'repeat(3, 1fr)',
            gap: isLandscape ? 10 : 12,
            width: '100%',
            maxWidth: isLandscape ? (isTablet ? 900 : 500) : 400,
          }}>
            {targetShape.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleShapeSelect(opt)}
                style={{
                  backgroundColor: 'var(--dor-panel)',
                  border: '1px solid var(--dor-border)',
                  borderRadius: '16px',
                  padding: '16px',
                  minHeight: isLandscape ? (isTablet ? 140 : 70) : 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s',
                }}
                onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {opt.render()}
              </button>
            ))}
          </div>
        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="משחק הצורות! 🔷"
          buttonText="בוא נשחק! 🔷"
          onStart={() => {
            // Prime speech synthesis on iOS — must run synchronously in click handler.
            // iOS Safari blocks speechSynthesis.speak() from setTimeout unless unlocked first.
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              try {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
              } catch {
                /* iOS may throw if synthesis unavailable */
              }
            }
            setShowInstructions(false);
          }}
          accentColor="var(--game-accent)"
        >
          <p>🔊 <strong>שמע את שם הצורה בעברית!</strong></p>
          <p>👆 <strong>לחץ על הצורה הנכונה!</strong></p>
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

export default ShapeMatchGame;
