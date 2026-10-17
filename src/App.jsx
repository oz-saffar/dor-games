import React, { useState, useEffect, useCallback, Suspense } from 'react';
import MainMenu from './components/MainMenu';
import ConfigScreen from './components/ConfigScreen';
import LoadingFallback from './components/LoadingFallback';
import { useSoundManager } from './hooks/useSoundManager';
import { GAME_COMPONENTS } from './lib/gameComponents';
import { BACKGROUND_OPTIONS, DEFAULT_BACKGROUND_ID } from './lib/backgrounds';
import { ALL_GAMES } from './lib/gamesConfig';
import { getDefaultConfig, mergeConfigWithDefaults, CONFIG_STORAGE_KEY } from './lib/defaultConfig';
import { normalizeRunnerDashCharacter } from './lib/runnerDashCharacter';
import { ActiveGameContext } from './lib/ActiveGameContext';
import { recordPlayed } from './lib/progress';

/**
 * Main App — routing and global state
 */
function App() {
  const [currentGame, setCurrentGame] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const defaultConfig = getDefaultConfig();
  const [config, setConfig] = useState(defaultConfig);
  const soundManager = useSoundManager(config);

  useEffect(() => {
    const noScroll = (e) => {
      // Entire settings card (tabs live outside the scroll region); without this,
      // iOS often suppresses clicks after touchmove + preventDefault on the header.
      if (showConfig && e.target.closest?.('[data-config-modal]')) return;
      // Home hub scrolls so all game tiles are reachable; only allow when config is closed.
      if (!currentGame && !showConfig) return;
      // A finger never holds perfectly still, so a plain tap on a control emits a
      // touchmove; preventing its default makes iOS swallow the click that follows,
      // and the tap has to be repeated (this is what made memory cards need several
      // presses). Nothing can scroll behind a game anyway — body is position:fixed
      // with touch-action:none — so controls are safe to leave alone.
      if (e.target.closest?.('button, [role="button"], a, input, select, textarea, [data-tap-target]')) return;
      e.preventDefault();
    };
    const noMenu = (e) => e.preventDefault();

    document.addEventListener('touchmove', noScroll, { passive: false });
    document.addEventListener('contextmenu', noMenu);

    return () => {
      document.removeEventListener('touchmove', noScroll);
      document.removeEventListener('contextmenu', noMenu);
    };
  }, [showConfig, currentGame]);

  useEffect(() => {
    if (!config.musicEnabled) return;

    const startMusic = () => {
      soundManager.startBgMusic();
      document.removeEventListener('click', startMusic);
      document.removeEventListener('touchstart', startMusic);
      document.removeEventListener('keydown', startMusic);
    };

    document.addEventListener('click', startMusic);
    document.addEventListener('touchstart', startMusic);
    document.addEventListener('keydown', startMusic);

    return () => {
      document.removeEventListener('click', startMusic);
      document.removeEventListener('touchstart', startMusic);
      document.removeEventListener('keydown', startMusic);
    };
  }, [soundManager, config.musicEnabled]);

  useEffect(() => {
    const mode = config.themeMode === 'twilight' ? 'twilight' : 'light';
    document.documentElement.dataset.theme = mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', mode === 'twilight' ? '#211e1b' : '#f9f5ee');
    }
  }, [config.themeMode]);

  const handleSelectGame = (gameId) => {
    recordPlayed(gameId);
    setCurrentGame(gameId);
  };

  const handleExitGame = () => {
    setCurrentGame(null);
  };

  const handleOpenConfig = useCallback(() => {
    setShowConfig(true);
  }, []);

  const handleCloseConfig = useCallback(() => {
    setShowConfig(false);
  }, []);

  const handleConfigChange = useCallback((newConfig) => {
    setConfig(newConfig);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
  }, []);

  const handleRunnerDashCharacterChange = useCallback((characterId) => {
    const runnerDashCharacter = normalizeRunnerDashCharacter(characterId);
    setConfig((prev) => {
      const next = { ...prev, runnerDashCharacter };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        const merged = mergeConfigWithDefaults(parsed);
        setConfig(merged);
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
  }, []);

  useEffect(() => {
    const accent = ALL_GAMES.find((g) => g.id === currentGame)?.accent;
    const html = document.documentElement;
    if (accent) {
      html.style.setProperty('--game-accent', accent);
    } else {
      html.style.removeProperty('--game-accent');
    }
  }, [currentGame]);

  useEffect(() => {
    const html = document.documentElement;
    const root = document.getElementById('root');
    if (!currentGame) {
      html.classList.add('dor-hub-scroll');
      root?.classList.add('dor-hub-scroll');
    } else {
      html.classList.remove('dor-hub-scroll');
      root?.classList.remove('dor-hub-scroll');
    }
    return () => {
      html.classList.remove('dor-hub-scroll');
      root?.classList.remove('dor-hub-scroll');
    };
  }, [currentGame]);

  const bgValue = BACKGROUND_OPTIONS.find((b) => b.id === (config.backgroundId || DEFAULT_BACKGROUND_ID))?.value ?? BACKGROUND_OPTIONS[0].value;
  useEffect(() => {
    const el = document.querySelector('.app-bg');
    if (el) el.style.background = bgValue;
  }, [bgValue]);

  return (
    <div
      className={
        currentGame
          ? 'h-full min-h-screen w-screen overflow-hidden'
          : 'min-h-[100dvh] w-screen overflow-x-hidden overflow-y-auto [touch-action:pan-y]'
      }
      style={{ background: bgValue }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {!currentGame && (
        <MainMenu
          key="main-menu"
          onSelectGame={handleSelectGame}
          onOpenConfig={handleOpenConfig}
          soundManager={soundManager}
          config={config}
        />
      )}

      {showConfig && (
        <ConfigScreen
          onClose={handleCloseConfig}
          config={config}
          onConfigChange={handleConfigChange}
          onReset={() => {
            const def = getDefaultConfig();
            setConfig(def);
            handleConfigChange(def);
          }}
          soundManager={soundManager}
        />
      )}

      {currentGame && GAME_COMPONENTS[currentGame] && (
        <ActiveGameContext.Provider value={currentGame}>
          <Suspense fallback={<LoadingFallback />}>
            {React.createElement(GAME_COMPONENTS[currentGame], {
              key: currentGame,
              onExit: handleExitGame,
              soundManager,
              ...(currentGame === 'memory' && { numPairs: config.memoryPairs }),
              ...(currentGame === 'monster-drag-chomp' && {
                peopleCount: config.monsterDragChompPeopleCount,
              }),
              ...(currentGame === 'shadow-match' && {
                difficulty: config.shadowMatchDifficulty,
              }),
              ...(currentGame === 'rhythm-tap' && {
                difficulty: config.rhythmTapDifficulty,
              }),
              ...(currentGame === 'maze-rescue' && {
                difficulty: config.mazeRescueDifficulty,
              }),
              ...(currentGame === 'water-sort' && {
                difficulty: config.waterSortDifficulty,
              }),
              ...(currentGame === 'runner-dash' && {
                difficulty: config.runnerDashDifficulty,
                runnerCharacter: config.runnerDashCharacter,
                onRunnerCharacterChange: handleRunnerDashCharacterChange,
              }),
              ...(currentGame === 'dino-sneak' && {
                difficulty: config.dinoSneakDifficulty,
              }),
              ...(currentGame === 'dino-stomp' && {
                difficulty: config.dinoStompDifficulty,
              }),
              ...(currentGame === 'web-sling' && {
                difficulty: config.webSlingDifficulty,
              }),
              ...(currentGame === 'snake-garden' && {
                difficulty: config.snakeGardenDifficulty,
              }),
              ...(currentGame === 'room-tidy' && {
                difficulty: config.roomTidyDifficulty,
              }),
              ...(currentGame === 'arrow-escape' && {
                difficulty: config.arrowEscapeDifficulty,
              }),
              ...(currentGame === 'photo-puzzle' && {
                pieceCount: config.photoPuzzlePieces,
              }),
            })}
          </Suspense>
        </ActiveGameContext.Provider>
      )}
    </div>
  );
}

export default App;
