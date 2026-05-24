import { useState, useRef, useCallback, useEffect } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useIsLandscape } from '../hooks/useOrientation';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

/**
 * CountWithMeGame - Tap 20 icons, Hebrew audio counts with you (1-20)
 * Teaches counting to 20 in Hebrew for 3-5 year olds
 */
const ICONS = ['🌟', '⭐', '✨', '🎈', '🎉', '🌈', '🦋', '🐠', '🌸', '🎸', '🚀', '🍕', '🐶', '🐱', '🐻', '🍎', '🍊', '🥕', '🎁', '💫'];

const CountWithMeGame = ({ onExit, soundManager }) => {
  const isLandscape = useIsLandscape();
  const [showInstructions, setShowInstructions] = useState(true);
  const [count, setCount] = useState(0);
  const [tappedIds, setTappedIds] = useState(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState(null);
  const [displayNumber, setDisplayNumber] = useState(null); // shows counted number for 0.5s

  const audioRef = useRef(null);
  const displayTimerRef = useRef(null);
  const preloadedRef = useRef({});
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  // Preload number sounds for instant playback
  useEffect(() => {
    for (let i = 1; i <= 20; i++) {
      const audio = new Audio(`/assets/audio/numbers/${i}.mp3`);
      preloadedRef.current[i] = audio;
    }
    return () => {
      Object.values(preloadedRef.current).forEach((a) => a.pause());
    };
  }, []);

  // Cleanup display timer on unmount
  useEffect(() => () => {
    if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
  }, []);

  const playNumber = useCallback((n) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = preloadedRef.current[n] || new Audio(`/assets/audio/numbers/${n}.mp3`);
    audio.currentTime = 0;
    audio.playbackRate = 1.15;
    audioRef.current = audio;
    audio.play().catch(() => {});
  }, []);

  const handleIconTap = useCallback((id) => {
    if (tappedIds.has(id) || count >= 20) return;

    if (displayTimerRef.current) clearTimeout(displayTimerRef.current);

    setTappedIds((prev) => new Set([...prev, id]));
    const nextCount = count + 1;
    setCount(nextCount);

    setDisplayNumber(nextCount);
    displayTimerRef.current = setTimeout(() => {
      setDisplayNumber(null);
      displayTimerRef.current = null;
    }, 500);

    playNumber(nextCount);

    if (nextCount === 20) {
      if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
      setDisplayNumber(null);
      soundManager?.playWin();
      setShowCelebration(true);
      if (hasPhotos) setCelebrationPhoto(getRandomPhoto());
      setTimeout(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
        setCount(0);
        setTappedIds(new Set());
      }, 3500);
    }
  }, [count, tappedIds, playNumber, soundManager, hasPhotos, getRandomPhoto]);

  const handleStart = () => {
    setShowInstructions(false);
    setCount(0);
    setTappedIds(new Set());
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      minHeight: '-webkit-fill-available',
      background: 'linear-gradient(145deg, #0369a1 0%, #0ea5e9 45%, #7dd3fc 100%)',
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px',
    }}>

      <GameBackButton onExit={onExit} />
      <GameScoreBadge label={`${count} / 20`} accentColor="#0EA5E9" />

      {/* Number display overlay - shows for 0.5s after each tap */}
      {displayNumber !== null && !showCelebration && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 120,
          pointerEvents: 'none',
          animation: 'numberFlash 0.5s ease-out',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '20px 40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            fontSize: 'clamp(80px, 25vw, 140px)',
            fontWeight: '900',
            color: '#0EA5E9',
          }}>
            {displayNumber}
          </div>
        </div>
      )}

      {/* Game area - 20 icons: 4x5 portrait, 5x4 or 10x2 landscape */}
      {!showInstructions && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isLandscape ? 'repeat(10, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
          gridTemplateRows: isLandscape ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
          columnGap: isLandscape ? 8 : 12,
          rowGap: isLandscape ? 8 : 8,
          width: '100%',
          maxWidth: isLandscape ? '95vw' : 'min(100vw - 16px, 500px)',
          height: isLandscape ? 'calc(100svh - 100px)' : 'calc(100svh - 150px)',
          marginTop: isLandscape ? 8 : 'calc(44px + env(safe-area-inset-top))',
          padding: '0 6px 6px',
          boxSizing: 'border-box',
        }}>
          {ICONS.map((emoji, id) => {
            const isTapped = tappedIds.has(id);
            return (
              <button
                key={id}
                onClick={() => handleIconTap(id)}
                disabled={isTapped}
                style={{
                  aspectRatio: '1',
                  minHeight: 0,
                  backgroundColor: isTapped ? 'rgba(255,255,255,0.4)' : 'white',
                  border: isTapped ? '3px solid rgba(255,255,255,0.8)' : '3px solid rgba(255,255,255,0.9)',
                  borderRadius: '12px',
                  fontSize: isLandscape ? 'clamp(28px, 4vw, 48px)' : 'clamp(36px, 9vw, 64px)',
                  cursor: isTapped ? 'default' : 'pointer',
                  boxShadow: isTapped ? '0 2px 6px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s, background-color 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isTapped ? 0.65 : 1,
                  transform: isTapped ? 'scale(0.92)' : 'scale(1)',
                }}
                onTouchStart={(e) => {
                  if (!isTapped) e.currentTarget.style.transform = 'scale(0.9)';
                }}
                onTouchEnd={(e) => {
                  if (!isTapped) e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span style={{
                  display: 'inline-block',
                  animation: isTapped ? 'countPop 0.4s ease-out' : 'none',
                }}>
                  {emoji}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="סופרים ביחד! 🔢"
          buttonText="בוא נספור! 🔢"
          onStart={handleStart}
          accentColor="#0EA5E9"
        >
          <p>⭐ <strong>לחץ על כל אייקון</strong></p>
          <p>🔊 <strong>תשמע את המספרים בעברית!</strong></p>
          <p>1, 2, 3... עד 20!</p>
          <p>📸 <strong>תמונה של דור בסיום!</strong></p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText="כל הכבוד! 🎉"
        subtitle="ספרת עד 20!"
        photo={celebrationPhoto}
        accentColor="#0EA5E9"
        numberOfPieces={300}
      />

      <style>{`
        @keyframes countPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.35); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes numberFlash {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CountWithMeGame;
