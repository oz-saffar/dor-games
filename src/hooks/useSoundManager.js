import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * SoundManager Hook
 * Centralized audio management for Hebrew feedback sounds
 */
export const useSoundManager = (config = {}) => {
  const shouldPlayFeedbackSounds = config?.feedbackSoundsEnabled !== false;

  const audioRefs = useRef({});
  const lastWinSoundRef = useRef(null);
  const lastEncouragementSoundRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sound file mappings
  const sounds = {
    correct: '/assets/audio/kol_hakavod.mp3',           // "כל הכבוד!"
    winYish: '/assets/audio/yish.mp3',                  // "יש!"
    winDorHaaluf: '/assets/audio/dor_haaluf.mp3',       // "דור האלוף!"
    winDorHatoch: '/assets/audio/dor_hatoch.mp3',       // "דור התותח!"
    winDorKolHakavod: '/assets/audio/dor_kol_hakavod.mp3', // "דור כל הכבוד!"
    success: '/assets/audio/hatzlachta.mp3',            // "הצלחת!"
    startGame: '/assets/audio/behatzlacha.mp3',         // "בהצלחה!"
    encTamshich: '/assets/audio/tamshich_lenasot.mp3',  // "תמשיך לנסות"
    encTansaShuv: '/assets/audio/tansa_shuv.mp3',       // "תנסה שוב"
    encHitbalbalt: '/assets/audio/hitbalbalt.mp3',      // "התבלבלת"
    encBilbul: '/assets/audio/bilbul.mp3',              // "בילבול"
    bgMusic: '/assets/audio/background_music.mp3',      // Soft instrumental
  };

  const speakHebrew = useCallback((text) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }, []);

  // Initialize audio elements
  useEffect(() => {
    Object.entries(sounds).forEach(([key, src]) => {
      const audio = new Audio();
      audio.preload = 'auto';
      
      // Handle loading errors gracefully (files might not exist yet)
      audio.addEventListener('error', () => {
        console.warn(`Audio file could not be loaded: ${src}`);
      });
      
      if (import.meta.env.DEV) {
        audio.addEventListener('canplaythrough', () => {
          console.log(`✅ Audio loaded: ${src}`);
        });
      }
      
      // Set source after event listeners are attached
      audio.src = src;
      
      audioRefs.current[key] = audio;
    });

    // Setup background music
    if (audioRefs.current.bgMusic) {
      audioRefs.current.bgMusic.loop = true;
      audioRefs.current.bgMusic.volume = 0.3; // Soft background volume
    }

    setIsLoaded(true);

    return () => {
      // Cleanup
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  /**
   * Play a specific sound
   * @param {string} soundKey - Key from sounds object
   */
  const playSound = useCallback((soundKey) => {
    if (!shouldPlayFeedbackSounds) return;
    const audio = audioRefs.current[soundKey];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.warn(`Could not play sound ${soundKey}:`, err);
      });
    }
  }, [shouldPlayFeedbackSounds]);

  /**
   * Play a sound, with fallback to 'correct' if it fails (e.g. file missing)
   */
  const playSoundWithFallback = useCallback((soundKey) => {
    if (!shouldPlayFeedbackSounds) return;
    const audio = audioRefs.current[soundKey];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Fallback to kol_hakavod if chosen sound failed (e.g. 404)
        playSound('correct');
      });
    } else {
      playSound('correct');
    }
  }, [playSound, shouldPlayFeedbackSounds]);

  /**
   * Play correct answer feedback
   */
  const playCorrect = useCallback(() => {
    playSound('correct');
  }, [playSound]);

  /**
   * Play success/level complete feedback
   */
  const playSuccess = useCallback(() => {
    playSound('success');
  }, [playSound]);

  /**
   * Play win sound — randomly picks from phrases, never repeats the last one
   */
  const playWin = useCallback(() => {
    if (!shouldPlayFeedbackSounds) return;
    const phrases = config?.winPhrases?.length ? config.winPhrases : [];
    if (phrases.length === 0) {
      playSoundWithFallback('correct');
      return;
    }
    const pool = lastWinSoundRef.current
      ? phrases.filter((p) => p.id !== lastWinSoundRef.current)
      : phrases;
    const phrase = pool[Math.floor(Math.random() * pool.length)] || phrases[0];
    lastWinSoundRef.current = phrase.id;
    if (phrase.audioKey) {
      playSoundWithFallback(phrase.audioKey);
    } else {
      speakHebrew(phrase.text);
    }
  }, [playSoundWithFallback, speakHebrew, config?.winPhrases, shouldPlayFeedbackSounds]);

  /**
   * Play game-start sound — "בהצלחה!"
   */
  const playStartGame = useCallback(() => {
    if (!shouldPlayFeedbackSounds) return;
    playSound('startGame');
  }, [playSound, shouldPlayFeedbackSounds]);

  /**
   * Play encouragement for incorrect answers — randomly, never repeats the last one
   */
  const playEncouragement = useCallback(() => {
    if (!shouldPlayFeedbackSounds) return;
    const phrases = config?.losePhrases?.length ? config.losePhrases : [];
    if (phrases.length === 0) {
      playSound('encTamshich');
      return;
    }
    const pool = lastEncouragementSoundRef.current
      ? phrases.filter((p) => p.id !== lastEncouragementSoundRef.current)
      : phrases;
    const phrase = pool[Math.floor(Math.random() * pool.length)] || phrases[0];
    lastEncouragementSoundRef.current = phrase.id;
    if (phrase.audioKey) {
      const audio = audioRefs.current[phrase.audioKey];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => playSound('encTamshich'));
      } else {
        playSound('encTamshich');
      }
    } else {
      speakHebrew(phrase.text);
    }
  }, [playSound, speakHebrew, config?.losePhrases, shouldPlayFeedbackSounds]);

  /**
   * Start background music
   */
  const startBgMusic = useCallback(() => {
    const music = audioRefs.current.bgMusic;
    if (music && music.paused) {
      music.play().catch(err => {
        console.warn('Could not play background music:', err);
      });
    }
  }, []);

  /**
   * Stop background music
   */
  const stopBgMusic = useCallback(() => {
    const music = audioRefs.current.bgMusic;
    if (music && !music.paused) {
      music.pause();
    }
  }, []);

  /**
   * Set background music volume
   * @param {number} volume - Volume level (0-1)
   */
  const setBgMusicVolume = useCallback((volume) => {
    const music = audioRefs.current.bgMusic;
    if (music) {
      music.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  return {
    isLoaded,
    playSound,
    playCorrect,
    playSuccess,
    playWin,
    playStartGame,
    playEncouragement,
    startBgMusic,
    stopBgMusic,
    setBgMusicVolume,
  };
};


