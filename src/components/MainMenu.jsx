/**
 * Hub — “arcade jewel box” launcher: aurora layers, metallic hero, rim-lit tiles
 */
import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useIsLandscape } from '../hooks/useOrientation';
import { ALL_GAMES } from '../lib/gamesConfig';
import MonsterMunchMenuIcon from './icons/MonsterMunchMenuIcon';
import { BACKGROUND_OPTIONS, DEFAULT_BACKGROUND_ID } from '../lib/backgrounds';

const MainMenu = ({ onSelectGame, onOpenConfig, soundManager, config }) => {
  const { photos } = useDorPhotos();
  const isLandscape = useIsLandscape();
  const reduce = useReducedMotion();
  const [galleryIndex, setGalleryIndex] = useState(0);
  const touchStartX = useRef(0);

  const visibleIds = config?.visibleGames?.length ? config.visibleGames : ALL_GAMES.map((g) => g.id);
  const games = visibleIds.map((id) => ALL_GAMES.find((g) => g.id === id)).filter(Boolean);
  const bgValue = BACKGROUND_OPTIONS.find((b) => b.id === (config?.backgroundId || DEFAULT_BACKGROUND_ID))?.value ?? BACKGROUND_OPTIONS[0].value;

  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => {
      setGalleryIndex((i) => (i + 1) % photos.length);
    }, 3000);
    return () => clearInterval(t);
  }, [photos.length]);

  const goPrev = () => setGalleryIndex((i) => (i - 1 + photos.length) % photos.length);
  const goNext = () => setGalleryIndex((i) => (i + 1) % photos.length);

  const handleSwipeStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? e.clientX;
  };
  const handleSwipeEnd = (e) => {
    const endX = e.changedTouches?.[0]?.clientX ?? e.clientX;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  const handleGameSelect = (gameId) => {
    soundManager?.playStartGame();
    onSelectGame(gameId);
  };

  const topBar = isLandscape
    ? 'bottom-[calc(12px+env(safe-area-inset-bottom))] right-3 mb-2'
    : 'top-[calc(12px+env(safe-area-inset-top))] left-3';

  const auroraClass = reduce ? 'dor-hub-aurora dor-hub-aurora--static' : 'dor-hub-aurora';

  return (
    <div
      className={`relative flex min-h-[100dvh] w-full overflow-x-hidden ${isLandscape ? 'flex-row items-start justify-center gap-8 py-[calc(12px+env(safe-area-inset-top))] pb-[calc(12px+env(safe-area-inset-bottom))]' : 'flex-col items-center'} px-[15px] pb-[calc(12px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))]`}
      style={{ background: bgValue }}
    >
      <div className={auroraClass} aria-hidden />
      <div className="dor-hub-vignette" aria-hidden />

      {/* z-[200] so hero/grid (z-10) never steals taps from settings */}
      <div className={`absolute z-[200] flex ${topBar}`}>
        <motion.button
          type="button"
          onClick={onOpenConfig}
          whileTap={reduce ? {} : { scale: 0.92 }}
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-white/50 bg-white/25 text-xl text-dor-ink shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl"
          aria-label="הגדרות"
        >
          ⚙️
        </motion.button>
      </div>

      <div
        className={`relative z-10 flex shrink-0 flex-col items-center text-center ${isLandscape ? 'mb-0 w-auto max-w-[200px]' : 'mb-3 w-full'}`}
      >
        <div className={isLandscape ? 'mb-3' : 'mb-2'}>
          <h1
            className="font-display m-0 flex flex-row flex-nowrap items-baseline justify-center gap-x-2 whitespace-nowrap tracking-tight"
            style={{
              fontSize: isLandscape ? 'clamp(22px, 4.2vw, 38px)' : 'clamp(26px, 7vw, 48px)',
            }}
          >
            <span
              className="bg-gradient-to-l from-[#6b1c2c] via-[#c94c3b] to-[#c9a227] bg-clip-text text-transparent"
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              משחקי
            </span>
            <span
              className="text-dor-ink drop-shadow-[0_1px_12px_rgba(255,255,255,0.35)]"
              style={{ textShadow: '0 1px 0 rgba(255,255,255,0.45)' }}
            >
              דור
            </span>
          </h1>
          <div
            className="mx-auto mt-3 h-[3px] max-w-[140px] rounded-full bg-gradient-to-l from-dor-ember via-dor-gold to-dor-teal opacity-95 shadow-[0_0_24px_rgba(201,76,59,0.5)]"
            style={{ width: 'clamp(100px, 28vw, 140px)' }}
          />
        </div>

        {photos.length > 0 ? (
          <div
            className="rounded-[22px] p-[3px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35),0_0_40px_-8px_rgba(201,162,39,0.35)]"
            style={{
              background: 'linear-gradient(135deg, var(--dor-gold-bright) 0%, var(--dor-ember) 35%, var(--dor-teal) 100%)',
            }}
          >
            <div
              className={`relative aspect-square overflow-hidden rounded-[19px] ring-2 ring-black/10 ${isLandscape ? 'w-[120px]' : 'w-[min(88vw,240px)] max-w-[240px]'}`}
              style={{
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35), 0 12px 40px rgba(0,0,0,0.2)',
              }}
              onTouchStart={photos.length > 1 ? handleSwipeStart : undefined}
              onTouchEnd={photos.length > 1 ? handleSwipeEnd : undefined}
              onMouseDown={photos.length > 1 ? handleSwipeStart : undefined}
              onMouseUp={photos.length > 1 ? handleSwipeEnd : undefined}
            >
              {photos.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt="Dor"
                  className="absolute left-0 top-0 h-full w-full object-cover transition-opacity duration-500"
                  style={{ opacity: i === galleryIndex ? 1 : 0 }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center rounded-[20px] border border-dashed border-dor-border-strong bg-dor-glass px-5 py-8 text-center font-sans text-sm text-dor-ink-muted shadow-lg backdrop-blur-md ${isLandscape ? 'w-[120px]' : 'w-[min(88vw,240px)]'}`}
          >
            <span className="mb-2 text-3xl opacity-80" aria-hidden>
              🖼️
            </span>
            <p className="m-0 max-w-[13rem] leading-snug">תמונות יופיעו כאן כשיהיו זמינות</p>
          </div>
        )}
      </div>

      <div
        className="relative z-10 grid w-full flex-1 content-center gap-3"
        style={{
          gridTemplateColumns: isLandscape ? (games.length === 6 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)') : 'repeat(2, 1fr)',
          maxWidth: isLandscape ? 640 : 440,
          gap: 'clamp(12px,2.5vw,16px)',
          paddingBottom: isLandscape ? undefined : 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <div className="col-span-full -mb-1 text-center">
          <span className="font-sans text-xs font-extrabold uppercase tracking-[0.2em] text-dor-ink-muted">בחרו משחק</span>
        </div>
        {games.map((game, i) => (
          <motion.div
            key={game.id}
            className="rounded-[22px] p-[2.5px]"
            style={{
              background: `linear-gradient(135deg, ${game.accent} 0%, rgba(255,255,255,0.82) 42%, ${game.accent}dd 100%)`,
              boxShadow: `0 16px 40px -14px rgba(0,0,0,0.35), 0 0 32px -10px ${game.accent}66`,
            }}
            initial={reduce ? false : { opacity: 0, y: 22, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: reduce ? 0 : 0.06 + i * 0.045,
              type: 'spring',
              stiffness: 380,
              damping: 26,
            }}
          >
            <motion.button
              type="button"
              onClick={() => handleGameSelect(game.id)}
              whileTap={reduce ? {} : { scale: 0.97, y: 2 }}
              whileHover={reduce ? {} : { y: -4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="flex min-h-[clamp(88px,12vh,128px)] w-full flex-col items-center justify-center rounded-[19px] border border-white/50 font-sans font-extrabold text-dor-ink"
              style={{
                padding: 'clamp(14px, 3vw, 22px)',
                minHeight: isLandscape ? 'clamp(76px, 18vh, 108px)' : undefined,
                background: 'linear-gradient(168deg, var(--dor-tile-face-top) 0%, var(--dor-tile-face-bottom) 100%)',
                boxShadow:
                  '0 1px 0 var(--dor-tile-shine) inset, 0 22px 44px -16px rgba(0,0,0,0.33), 0 10px 20px -12px rgba(0,0,0,0.18)',
              }}
            >
              <span
                className="mb-1 flex select-none items-center justify-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                style={{ filter: 'saturate(1.1)', minHeight: 'clamp(38px,9vw,56px)' }}
              >
                {game.id === 'monster-munch' || game.id === 'monster-drag-chomp' ? (
                  <MonsterMunchMenuIcon size={50} />
                ) : (
                  <span className="text-[clamp(38px,9vw,56px)]">{game.icon}</span>
                )}
              </span>
              <span className="text-[clamp(14px,3.8vw,19px)] leading-tight text-dor-ink">{game.title}</span>
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MainMenu;
