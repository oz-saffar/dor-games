/**
 * Hub — “arcade jewel box” launcher: aurora layers, metallic hero, rim-lit tiles
 */
import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useViewport } from '../hooks/useViewport';
import { ALL_GAMES } from '../lib/gamesConfig';
import MonsterMunchMenuIcon from './icons/MonsterMunchMenuIcon';
import { BACKGROUND_OPTIONS, DEFAULT_BACKGROUND_ID } from '../lib/backgrounds';

const MainMenu = ({ onSelectGame, onOpenConfig, soundManager, config }) => {
  const { photos } = useDorPhotos();
  const { isLandscape, isTablet } = useViewport();
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
    const game = ALL_GAMES.find(g => g.id === gameId);
    if (game?.externalUrl) {
      window.location.href = game.externalUrl;
      return;
    }
    soundManager?.playStartGame();
    onSelectGame(gameId);
  };

  const topBar = isLandscape
    ? 'bottom-[calc(12px+env(safe-area-inset-bottom))] right-3 mb-2'
    : 'top-[calc(12px+env(safe-area-inset-top))] left-3';

  const auroraClass = reduce ? 'dor-hub-aurora dor-hub-aurora--static' : 'dor-hub-aurora';

  /* Tile grid. A phone gets two columns upright and four on its side; the iPad
     has room for six across in landscape and three upright, so the hub fills the
     glass instead of leaving a phone-width strip down the middle. */
  const hubTrack = (n) => `repeat(${n}, 1fr)`;
  let hubColumns;
  let hubMaxWidth;
  if (isLandscape) {
    hubColumns = hubTrack(isTablet ? 6 : games.length === 6 ? 3 : 4);
    hubMaxWidth = isTablet ? 1080 : 640;
  } else {
    hubColumns = hubTrack(isTablet ? 3 : 2);
    hubMaxWidth = isTablet ? 720 : 440;
  }

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
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-dor-md border border-dor-border-strong bg-dor-panel text-xl text-dor-ink shadow-dor-lip-sm"
          aria-label="הגדרות"
        >
          ⚙️
        </motion.button>
      </div>

      <div
        className={`relative z-10 flex shrink-0 flex-col items-center text-center ${isLandscape ? (isTablet ? 'mb-0 w-auto max-w-[260px]' : 'mb-0 w-auto max-w-[200px]') : 'mb-3 w-full'}`}
      >
        <div className={isLandscape ? 'mb-3' : 'mb-2'}>
          <h1
            className="font-display m-0 flex flex-row flex-nowrap items-baseline justify-center gap-x-2 whitespace-nowrap tracking-tight"
            style={{
              fontSize: isLandscape ? 'clamp(22px, 4.2vw, 38px)' : 'clamp(26px, 7vw, 48px)',
            }}
          >
            <span className="text-dor-ember">משחקי</span>
            <span className="text-dor-ink">דור</span>
          </h1>
          <div
            className="mx-auto mt-3 h-[4px] max-w-[140px] rounded-full bg-dor-ochre opacity-80"
            style={{ width: 'clamp(100px, 28vw, 140px)' }}
          />
        </div>

        {photos.length > 0 ? (
          <div
            className="rounded-dor-lg border border-dor-border bg-dor-panel p-[6px] shadow-dor-lip"
          >
            <div
              className={`relative aspect-square overflow-hidden rounded-[18px] ${isLandscape ? (isTablet ? 'w-[200px]' : 'w-[120px]') : 'w-[min(88vw,240px)] max-w-[240px]'}`}
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
            className={`flex flex-col items-center justify-center rounded-dor-lg border border-dashed border-dor-border-strong bg-dor-panel px-5 py-8 text-center font-sans text-sm text-dor-ink-muted ${isLandscape ? (isTablet ? 'w-[200px]' : 'w-[120px]') : 'w-[min(88vw,240px)]'}`}
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
          gridTemplateColumns: hubColumns,
          maxWidth: hubMaxWidth,
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
            className="rounded-dor-lg"
            style={{
              /* the wooden bottom edge, tinted with the game's own accent */
              boxShadow: `0 4px 0 ${game.accent}, var(--dor-shadow-card)`,
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
              whileHover={reduce ? {} : { y: -2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="flex min-h-[clamp(88px,12vh,128px)] w-full flex-col items-center justify-center rounded-dor-lg border border-dor-border font-sans font-extrabold text-dor-ink"
              style={{
                padding: 'clamp(14px, 3vw, 22px)',
                minHeight: isLandscape ? 'clamp(76px, 18vh, 108px)' : undefined,
                /* a whisper of the accent washed into the paper */
                background: `linear-gradient(168deg, var(--dor-tile-face-top) 0%, color-mix(in srgb, ${game.accent} 10%, var(--dor-tile-face-bottom)) 100%)`,
              }}
            >
              <span
                className="mb-1.5 flex select-none items-center justify-center"
                style={{ minHeight: 'clamp(38px,9vw,56px)' }}
              >
                {game.id === 'monster-drag-chomp' ? (
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
