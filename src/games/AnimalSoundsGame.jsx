import { useState, useEffect, useRef, useCallback } from 'react';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useIsLandscape } from '../hooks/useOrientation';
import {
  GameBackButton,
  GameScoreBadge,
  GameInstructionsOverlay,
  GameCelebrationOverlay,
} from '../components/game';

/**
 * AnimalSoundsGame - Hear the Hebrew animal name, tap the right animal
 * Teaches Hebrew vocabulary for 3–5 year olds
 */

// All sounds are REAL recordings sourced from open-source GitHub repositories:
//   Misiker101/Animal-sound-game  (cat, cow, dog, horse, lion, rooster, wolf, tiger)
//   IkunoZ/EsmaeSounds            (elephant, monkey, gorilla, alligator, rhino, fox)
const ANIMALS = [
  { id: 'dog',       emoji: '🐕', name: 'כלב',    sound: '/assets/audio/animals/dog.mp3' },
  { id: 'cat',       emoji: '🐱', name: 'חתול',   sound: '/assets/audio/animals/cat.mp3' },
  { id: 'cow',       emoji: '🐄', name: 'פרה',    sound: '/assets/audio/animals/cow.mp3' },
  { id: 'horse',     emoji: '🐴', name: 'סוס',    sound: '/assets/audio/animals/horse.mp3' },
  { id: 'lion',      emoji: '🦁', name: 'אריה',   sound: '/assets/audio/animals/lion.mp3' },
  { id: 'rooster',   emoji: '🐓', name: 'תרנגול', sound: '/assets/audio/animals/rooster.mp3' },
  { id: 'wolf',      emoji: '🐺', name: 'זאב',    sound: '/assets/audio/animals/wolf.mp3' },
  { id: 'tiger',     emoji: '🐯', name: 'נמר',    sound: '/assets/audio/animals/tiger.mp3' },
  { id: 'elephant',  emoji: '🐘', name: 'פיל',    sound: '/assets/audio/animals/elephant.mp3' },
  { id: 'monkey',    emoji: '🐒', name: 'קוף',    sound: '/assets/audio/animals/monkey.mp3' },
  { id: 'gorilla',   emoji: '🦍', name: 'גורילה', sound: '/assets/audio/animals/gorilla.mp3' },
  { id: 'alligator', emoji: '🐊', name: 'תנין',   sound: '/assets/audio/animals/alligator.mp3' },
  { id: 'rhino',     emoji: '🦏', name: 'קרנף',   sound: '/assets/audio/animals/rhino.mp3' },
  { id: 'fox',       emoji: '🦊', name: 'שועל',   sound: '/assets/audio/animals/fox.mp3' },
];

const AnimalSoundsGame = ({ onExit, soundManager }) => {
  const isLandscape = useIsLandscape();
  const [showInstructions, setShowInstructions] = useState(true);
  const [target, setTarget]       = useState(null);   // { animal, options: [animal, ...] }
  const [score, setScore]         = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto]   = useState(null);
  const [answeredCorrect, setAnsweredCorrect]     = useState(null); // highlight correct btn

  const audioRef = useRef(null);
  const lastWrongOptionRef = useRef(null);

  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  // Speak Hebrew animal name using Web Speech API; returns Promise that resolves when done
  const speakHebrewName = useCallback((name) => {
    return new Promise((resolve) => {
      if (!name || typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(name);
      utterance.lang = 'he-IL';
      utterance.rate = 0.9;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Pick a random target animal + 2 unique decoys.
  // prevId ensures the same animal never appears as the target twice in a row.
  const generateChallenge = useCallback((prevId = null) => {
    const pool = ANIMALS.filter((a) => a.id !== prevId);
    const randomTarget = pool[Math.floor(Math.random() * pool.length)];
    const decoys = ANIMALS
      .filter((a) => a.id !== randomTarget.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    const options = [randomTarget, ...decoys].sort(() => Math.random() - 0.5);

    setTarget({ animal: randomTarget, options });
    setAnsweredCorrect(null);
  }, []);

  // Play the animal's audio
  const playAnimalSound = useCallback((animal) => {
    if (!animal) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(animal.sound);
    audioRef.current = audio;
    setIsPlaying(true);
    audio.play().catch(() => {});
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  }, []);

  // Auto-play when a new challenge is set
  useEffect(() => {
    if (target && !showInstructions) {
      // Short delay so the screen transition feels natural
      const t = setTimeout(() => playAnimalSound(target.animal), 400);
      return () => clearTimeout(t);
    }
  }, [target, showInstructions, playAnimalSound]);

  // Cleanup audio on unmount
  useEffect(() => () => audioRef.current?.pause(), []);

  const handleStart = () => {
    setShowInstructions(false);
    generateChallenge();
  };

  const handleOptionTap = async (animal) => {
    if (showCelebration || answeredCorrect !== null) return;

    if (animal.id === target.animal.id) {
      lastWrongOptionRef.current = null; // reset for next round
      setAnsweredCorrect(animal.id);
      setScore((s) => s + 1);
      setShowCelebration(true);
      if (hasPhotos) setCelebrationPhoto(getRandomPhoto());

      await speakHebrewName(animal.name);
      soundManager?.playWin();

      setTimeout(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
        generateChallenge(target.animal.id);
      }, 3000);
    } else {
      // Same wrong button twice — don't play sound
      if (lastWrongOptionRef.current === animal.id) return;
      lastWrongOptionRef.current = animal.id;
      soundManager?.playEncouragement();
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      minHeight: '-webkit-fill-available',
      background: 'linear-gradient(145deg, #14532d 0%, #16a34a 50%, #4ade80 100%)',
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
      <GameScoreBadge icon="⭐" score={score} accentColor="#16A34A" />

      {/* Game area */}
      {!showInstructions && target && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: isLandscape ? 10 : 16,
          width: '100%', maxWidth: isLandscape ? '95vw' : 480,
          paddingTop: isLandscape ? 8 : 'calc(44px + env(safe-area-inset-top))',
        }}>

          {/* Question */}
          <h2 style={{
            fontSize: 'clamp(20px, 5vw, 32px)',
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            color: 'white',
            textAlign: 'center',
            textShadow: '0 2px 12px rgba(0,0,0,0.25)',
            margin: 0
          }}>
            ?איזו חיה עושה את הקול הזה
          </h2>

          {/* Speaker / replay button */}
          <button
            onClick={() => playAnimalSound(target.animal)}
            style={{
              backgroundColor: isPlaying ? 'rgba(255,255,255,0.5)' : 'white',
              border: 'none',
              borderRadius: '50%',
              width: 'clamp(90px, 22vw, 120px)',
              height: 'clamp(90px, 22vw, 120px)',
              fontSize: 'clamp(44px, 11vw, 64px)',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              transition: 'transform 0.15s, background-color 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '0', minHeight: '0',
              animation: isPlaying ? 'pulse 0.6s ease-in-out infinite alternate' : 'none'
            }}
            onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
            onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying ? '🔊' : '🔈'}
          </button>

          <p style={{
            fontSize: 'clamp(14px, 3.5vw, 18px)',
            color: 'rgba(255,255,255,0.9)',
            margin: 0, textAlign: 'center'
          }}>
            לחץ שוב להאזנה 👆
          </p>

          {/* Animal option buttons — 6 options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isLandscape ? 'repeat(6, 1fr)' : 'repeat(3, 1fr)',
            gap: isLandscape ? 6 : 'clamp(8px, 2vw, 14px)',
            width: '100%',
          }}>
            {target.options.map((animal) => {
              const isCorrectHighlight = answeredCorrect === animal.id;
              return (
                <button
                  key={animal.id}
                  onClick={() => handleOptionTap(animal)}
                  style={{
                    backgroundColor: isCorrectHighlight ? '#BBF7D0' : 'white',
                    border: isCorrectHighlight ? '4px solid #16A34A' : '4px solid rgba(255,255,255,0.7)',
                    borderRadius: '16px',
                    padding: 'clamp(10px, 3vw, 18px) 6px',
                    minHeight: isLandscape ? 'clamp(60px, 25vh, 100px)' : 'clamp(110px, 18vh, 150px)',
                    minWidth: '0',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    transition: 'transform 0.15s, background-color 0.2s'
                  }}
                  onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.93)'}
                  onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontSize: isLandscape ? 'clamp(36px, 8vw, 56px)' : 'clamp(50px, 13vw, 76px)', lineHeight: 1 }}>
                    {animal.emoji}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showInstructions && (
        <GameInstructionsOverlay
          title="קולות חיות! 🐾"
          buttonText="בוא נשחק! 🐾"
          onStart={handleStart}
          accentColor="#16A34A"
        >
          <p>🔊 <strong>שמע את קול החיה</strong></p>
          <p>🐕 <strong>לחץ על החיה הנכונה!</strong></p>
          <p>⭐ <strong>צבור נקודות!</strong></p>
          <p>📸 <strong>תמונות של דור בכל הצלחה!</strong></p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={showCelebration}
        successText={target?.animal ? `${target.animal.emoji} כל הכבוד!` : 'כל הכבוד! 🎉'}
        subtitle={target?.animal?.name}
        photo={celebrationPhoto}
        accentColor="#16A34A"
        numberOfPieces={280}
      />

      {/* Pulse animation for speaking indicator */}
      <style>{`
        @keyframes pulse {
          from { transform: scale(1); }
          to   { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default AnimalSoundsGame;
