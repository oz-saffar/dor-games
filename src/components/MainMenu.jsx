/**
 * Hub — launcher: hero photo, recent/favourite rows, category tabs, daily spotlight, sticker book
 */
import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../hooks/useDorPhotos';
import { useViewport } from '../hooks/useViewport';
import { ALL_GAMES } from '../lib/gamesConfig';
import GameTile from './home/GameTile';
import StickerBook from './home/StickerBook';
import { GAME_CATEGORIES, ALL_TAB, categoryOfGame } from '../lib/gameCategories';
import { loadProgress, toggleFavourite, markStickersSeen, hasNewSticker, pickDailySpotlight } from '../lib/progress';
import { BACKGROUND_OPTIONS, DEFAULT_BACKGROUND_ID } from '../lib/backgrounds';

const TAB_KEY = 'dor-games-home-tab';

const Section = ({ emoji, testId, children }) => (
  <section data-testid={testId} className="w-full">
    <div className="mb-1.5 text-center text-2xl leading-none" aria-hidden>{emoji}</div>
    {children}
  </section>
);

const MainMenu = ({ onSelectGame, onOpenConfig, soundManager, config }) => {
  const { photos } = useDorPhotos();
  const { isLandscape, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const [galleryIndex, setGalleryIndex] = useState(0);
  const touchStartX = useRef(0);

  const visibleIds = config?.visibleGames?.length ? config.visibleGames : ALL_GAMES.map((g) => g.id);
  const games = visibleIds.map((id) => ALL_GAMES.find((g) => g.id === id)).filter(Boolean);
  const [progress, setProgress] = useState(loadProgress);
  const [showBook, setShowBook] = useState(false);
  // decided once per mount: the bounce shows "next time home renders"
  const [newSticker] = useState(() => hasNewSticker(loadProgress()));
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return window.localStorage.getItem(TAB_KEY) || ALL_TAB.id;
    } catch {
      return ALL_TAB.id;
    }
  });

  const byId = (ids) => ids.map((id) => games.find((g) => g.id === id)).filter(Boolean);
  const recentGames = byId(progress.recent);
  const favouriteGames = byId(progress.favourites);
  const presentCategories = GAME_CATEGORIES.filter((c) => games.some((g) => categoryOfGame(g.id) === c.id));
  const tabs = [ALL_TAB, ...presentCategories];
  const tabId = tabs.some((t) => t.id === activeTab) ? activeTab : ALL_TAB.id;
  const tabGames = tabId === ALL_TAB.id ? games : games.filter((g) => categoryOfGame(g.id) === tabId);
  const spotlightId = pickDailySpotlight(games.map((g) => g.id));
  const featuredGame = tabGames.find((g) => g.id === spotlightId);
  const restGames = tabGames.filter((g) => g !== featuredGame);

  const renderTile = (game, extra = {}) => (
    <GameTile
      key={`${extra.compact ? 'c' : 'g'}-${game.id}`}
      game={game}
      isFavourite={progress.favourites.includes(game.id)}
      reduce={reduce}
      isLandscape={isLandscape}
      onLaunch={handleGameSelect}
      onToggleFavourite={handleToggleFavourite}
      {...extra}
    />
  );

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

  const selectTab = (id) => {
    setActiveTab(id);
    try {
      window.localStorage.setItem(TAB_KEY, id);
    } catch {
      /* ignore */
    }
  };
  const openBook = () => {
    setShowBook(true);
    setProgress(markStickersSeen());
  };
  const handleToggleFavourite = (id) => setProgress(toggleFavourite(id));

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
      <div className={`${isLandscape ? 'fixed' : 'absolute'} z-[200] flex ${topBar}`}>
        <motion.button
          type="button"
          onClick={onOpenConfig}
          whileTap={reduce ? {} : { scale: 0.92 }}
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-dor-md border border-dor-border-strong bg-dor-panel text-xl text-dor-ink shadow-dor-lip-sm"
          aria-label="הגדרות"
        >
          ⚙️
        </motion.button>
        <motion.button
          type="button"
          onClick={openBook}
          data-testid="sticker-book-button"
          animate={newSticker && !reduce ? { y: [0, -10, 0, -5, 0], rotate: [0, -8, 8, 0] } : { y: 0 }}
          transition={newSticker ? { duration: 1.1, repeat: Infinity, repeatDelay: 1.2 } : undefined}
          whileTap={reduce ? {} : { scale: 0.92 }}
          className="relative ms-2 flex min-h-[48px] min-w-[48px] items-center justify-center rounded-dor-md border border-dor-border-strong bg-dor-panel text-xl text-dor-ink shadow-dor-lip-sm"
          aria-label="ספר מדבקות"
        >
          📒
          <span className="absolute -bottom-2 -end-2 rounded-full border border-dor-border bg-dor-panel px-1.5 text-[11px] font-extrabold leading-5 text-dor-ink">
            {progress.stars}⭐
          </span>
          {newSticker && <span className="absolute -start-1 -top-2 text-base" aria-hidden>✨</span>}
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
        className="relative z-10 flex w-full min-w-0 flex-1 flex-col content-center justify-center gap-3"
        style={{
          maxWidth: hubMaxWidth,
          paddingBottom: isLandscape ? undefined : 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        {recentGames.length > 0 && (
          <Section emoji="🕘" testId="recent-row">
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {recentGames.map((g) => renderTile(g, { compact: true }))}
            </div>
          </Section>
        )}

        {favouriteGames.length > 0 && (
          <Section emoji="⭐" testId="favourites-row">
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))' }}>
              {favouriteGames.map((g) => renderTile(g, { compact: true }))}
            </div>
          </Section>
        )}

        <div className="flex w-full gap-2" role="tablist" aria-label="קטגוריות">
          {tabs.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={tab.label}
                data-testid={`tab-${tab.id}`}
                onClick={() => selectTab(tab.id)}
                className={`flex min-h-[60px] min-w-0 flex-1 select-none flex-col items-center justify-center rounded-dor-md border px-1 py-1.5 font-sans ${selected ? 'border-dor-border-strong bg-dor-panel text-dor-ink shadow-dor-lip-sm' : 'border-dor-border bg-transparent text-dor-ink-muted'}`}
              >
                <span className="leading-none" style={{ fontSize: 'clamp(26px, 7vw, 36px)' }}>{tab.emoji}</span>
                <span className="mt-0.5 text-center text-[10px] font-bold leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div
          className="grid w-full"
          style={{ gridTemplateColumns: hubColumns, gap: 'clamp(12px,2.5vw,16px)' }}
        >
          {featuredGame && renderTile(featuredGame, { featured: true })}
          {restGames.map((g) => renderTile(g))}
        </div>
      </div>

      {showBook && <StickerBook stars={progress.stars} reduce={reduce} onClose={() => setShowBook(false)} />}
    </div>
  );
};

export default MainMenu;
