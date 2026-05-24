import { useState, useEffect, useMemo } from 'react';
import { DEFAULT_WIN_PHRASES, DEFAULT_LOSE_PHRASES, createPhraseId } from '../lib/soundPhrases';
import { ALL_GAMES, DEFAULT_VISIBLE_GAMES } from '../lib/gamesConfig';
import { BACKGROUND_OPTIONS, DEFAULT_BACKGROUND_ID } from '../lib/backgrounds';
import {
  getDefaultConfig,
  GAME_VISIBILITY_SCHEMA_VERSION,
  normalizeMonsterDragChompPeopleCount,
  MONSTER_DRAG_CHOMP_PEOPLE_MIN,
  MONSTER_DRAG_CHOMP_PEOPLE_MAX,
} from '../lib/defaultConfig';
import {
  GAME_DIFFICULTY,
  GAME_DIFFICULTY_OPTIONS,
  RHYTHM_TAP_DIFFICULTY_OPTIONS,
  WATER_SORT_DIFFICULTY_OPTIONS,
  normalizeGameDifficulty,
} from '../lib/gameDifficulties';
import {
  RUNNER_DASH_CHARACTER_OPTIONS,
  normalizeRunnerDashCharacter,
} from '../lib/runnerDashCharacter';
import MonsterMunchMenuIcon from './icons/MonsterMunchMenuIcon';

const TAB_IDS = {
  GENERAL: 'general',
  GAMES: 'games',
  PHRASES: 'phrases',
};

const tabs = [
  { id: TAB_IDS.GENERAL, icon: '⚡', label: 'כללי' },
  { id: TAB_IDS.GAMES, icon: '🧩', label: 'משחקים' },
  { id: TAB_IDS.PHRASES, icon: '🎙️', label: 'משפטים' },
];

const baseSelectStyle = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--dor-ink)',
  backgroundColor: 'var(--dor-panel-elevated)',
  border: '2px solid var(--dor-border-strong)',
  borderRadius: 'var(--dor-radius-md)',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%235c6578' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left 12px center',
  backgroundSize: 20,
  paddingLeft: 40,
};

const ConfigScreen = ({ onClose, config, onConfigChange, onReset, soundManager }) => {
  const [activeTab, setActiveTab] = useState(TAB_IDS.GENERAL);
  const [memoryPairs, setMemoryPairs] = useState(config.memoryPairs ?? 3);
  const [monsterDragChompPeopleCount, setMonsterDragChompPeopleCount] = useState(
    normalizeMonsterDragChompPeopleCount(config.monsterDragChompPeopleCount)
  );
  const [shadowMatchDifficulty, setShadowMatchDifficulty] = useState(
    normalizeGameDifficulty(config.shadowMatchDifficulty)
  );
  const [rhythmTapDifficulty, setRhythmTapDifficulty] = useState(
    normalizeGameDifficulty(config.rhythmTapDifficulty)
  );
  const [mazeRescueDifficulty, setMazeRescueDifficulty] = useState(
    normalizeGameDifficulty(config.mazeRescueDifficulty)
  );
  const [waterSortDifficulty, setWaterSortDifficulty] = useState(
    normalizeGameDifficulty(config.waterSortDifficulty)
  );
  const [footballDifficulty, setFootballDifficulty] = useState(
    normalizeGameDifficulty(config.footballDifficulty)
  );
  const [footballDragDifficulty, setFootballDragDifficulty] = useState(
    normalizeGameDifficulty(config.footballDragDifficulty)
  );
  const [runnerDashDifficulty, setRunnerDashDifficulty] = useState(
    normalizeGameDifficulty(config.runnerDashDifficulty, GAME_DIFFICULTY.HARD)
  );
  const [runnerDashCharacter, setRunnerDashCharacter] = useState(
    normalizeRunnerDashCharacter(config.runnerDashCharacter)
  );
  const [musicEnabled, setMusicEnabled] = useState(
    config.musicEnabled !== undefined ? config.musicEnabled : false
  );
  const [feedbackSoundsEnabled, setFeedbackSoundsEnabled] = useState(
    config.feedbackSoundsEnabled !== undefined ? config.feedbackSoundsEnabled : true
  );
  const [visibleGames, setVisibleGames] = useState(
    config.visibleGames?.length ? config.visibleGames : DEFAULT_VISIBLE_GAMES
  );
  const [backgroundId, setBackgroundId] = useState(config.backgroundId ?? DEFAULT_BACKGROUND_ID);
  const [themeMode, setThemeMode] = useState(config.themeMode === 'twilight' ? 'twilight' : 'light');
  const [winPhrases, setWinPhrases] = useState(
    config.winPhrases?.length ? config.winPhrases : DEFAULT_WIN_PHRASES
  );
  const [losePhrases, setLosePhrases] = useState(
    config.losePhrases?.length ? config.losePhrases : DEFAULT_LOSE_PHRASES
  );

  useEffect(() => {
    if (!config) return;
    setMemoryPairs(config.memoryPairs ?? 3);
    setMonsterDragChompPeopleCount(
      normalizeMonsterDragChompPeopleCount(config.monsterDragChompPeopleCount)
    );
    setShadowMatchDifficulty(normalizeGameDifficulty(config.shadowMatchDifficulty));
    setFootballDifficulty(normalizeGameDifficulty(config.footballDifficulty));
    setFootballDragDifficulty(normalizeGameDifficulty(config.footballDragDifficulty));
    setRhythmTapDifficulty(normalizeGameDifficulty(config.rhythmTapDifficulty));
    setMazeRescueDifficulty(normalizeGameDifficulty(config.mazeRescueDifficulty));
    setWaterSortDifficulty(normalizeGameDifficulty(config.waterSortDifficulty));
    setRunnerDashDifficulty(normalizeGameDifficulty(config.runnerDashDifficulty, GAME_DIFFICULTY.HARD));
    setRunnerDashCharacter(normalizeRunnerDashCharacter(config.runnerDashCharacter));
    setMusicEnabled(config.musicEnabled !== undefined ? config.musicEnabled : false);
    setFeedbackSoundsEnabled(config.feedbackSoundsEnabled !== undefined ? config.feedbackSoundsEnabled : true);
    setVisibleGames(config.visibleGames?.length ? config.visibleGames : DEFAULT_VISIBLE_GAMES);
    setBackgroundId(config.backgroundId ?? DEFAULT_BACKGROUND_ID);
    setThemeMode(config.themeMode === 'twilight' ? 'twilight' : 'light');
    setWinPhrases(config.winPhrases?.length ? config.winPhrases : DEFAULT_WIN_PHRASES);
    setLosePhrases(config.losePhrases?.length ? config.losePhrases : DEFAULT_LOSE_PHRASES);
  }, [config]);

  const visibleGameCount = visibleGames.length;
  const hiddenGames = useMemo(
    () => ALL_GAMES.filter((g) => !visibleGames.includes(g.id)),
    [visibleGames]
  );
  const difficultyLabel = memoryPairs <= 4 ? 'קל' : memoryPairs <= 10 ? 'בינוני' : 'קשה';

  const toggleGameVisibility = (gameId) => {
    const isVisible = visibleGames.includes(gameId);
    if (isVisible && visibleGames.length <= 1) return;
    setVisibleGames((prev) => (isVisible ? prev.filter((id) => id !== gameId) : [...prev, gameId]));
  };

  const moveGameUp = (index) => {
    if (index <= 0) return;
    setVisibleGames((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveGameDown = (index) => {
    if (index >= visibleGames.length - 1) return;
    setVisibleGames((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleMusicToggle = () => {
    const nextValue = !musicEnabled;
    setMusicEnabled(nextValue);
    if (nextValue) {
      soundManager?.startBgMusic();
    } else {
      soundManager?.stopBgMusic();
    }
  };

  const updatePhrase = (setter, id, newText) => {
    setter((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const trimmed = newText.trim();
        const text = trimmed || item.text;
        const changed = !!trimmed && trimmed !== item.text;
        return { ...item, text, audioKey: changed ? null : item.audioKey };
      })
    );
  };

  const removePhrase = (list, setter, id) => {
    if (list.length <= 1) return;
    setter((prev) => prev.filter((p) => p.id !== id));
  };

  const addPhrase = (setter) => {
    setter((prev) => [...prev, { id: createPhraseId(), text: '', audioKey: null }]);
  };

  const handleSave = () => {
    const filteredWin = winPhrases.filter((p) => p.text?.trim());
    const filteredLose = losePhrases.filter((p) => p.text?.trim());
    onConfigChange({
      themeMode,
      memoryPairs,
      monsterDragChompPeopleCount: normalizeMonsterDragChompPeopleCount(monsterDragChompPeopleCount),
      footballDifficulty: normalizeGameDifficulty(footballDifficulty),
      footballDragDifficulty: normalizeGameDifficulty(footballDragDifficulty),
      shadowMatchDifficulty: normalizeGameDifficulty(shadowMatchDifficulty),
      rhythmTapDifficulty: normalizeGameDifficulty(rhythmTapDifficulty),
      mazeRescueDifficulty: normalizeGameDifficulty(mazeRescueDifficulty),
      waterSortDifficulty: normalizeGameDifficulty(waterSortDifficulty),
      runnerDashDifficulty: normalizeGameDifficulty(runnerDashDifficulty),
      runnerDashCharacter: normalizeRunnerDashCharacter(runnerDashCharacter),
      musicEnabled,
      feedbackSoundsEnabled,
      visibleGames: visibleGames.length ? visibleGames : DEFAULT_VISIBLE_GAMES,
      visibilityVersion: GAME_VISIBILITY_SCHEMA_VERSION,
      backgroundId,
      winPhrases: filteredWin.length ? filteredWin : DEFAULT_WIN_PHRASES,
      losePhrases: filteredLose.length ? filteredLose : DEFAULT_LOSE_PHRASES,
    });
    onClose();
  };

  const handleReset = () => {
    const def = getDefaultConfig();
    setMemoryPairs(def.memoryPairs);
    setMonsterDragChompPeopleCount(
      normalizeMonsterDragChompPeopleCount(def.monsterDragChompPeopleCount)
    );
    setFootballDifficulty(def.footballDifficulty);
    setFootballDragDifficulty(def.footballDragDifficulty);
    setShadowMatchDifficulty(def.shadowMatchDifficulty);
    setRhythmTapDifficulty(def.rhythmTapDifficulty);
    setMazeRescueDifficulty(def.mazeRescueDifficulty);
    setWaterSortDifficulty(def.waterSortDifficulty);
    setRunnerDashDifficulty(def.runnerDashDifficulty);
    setRunnerDashCharacter(normalizeRunnerDashCharacter(def.runnerDashCharacter));
    setMusicEnabled(def.musicEnabled);
    setFeedbackSoundsEnabled(def.feedbackSoundsEnabled);
    setVisibleGames(def.visibleGames);
    setBackgroundId(def.backgroundId);
    setThemeMode(def.themeMode === 'twilight' ? 'twilight' : 'light');
    setWinPhrases(def.winPhrases);
    setLosePhrases(def.losePhrases);
    onReset?.();
    onClose();
  };

  const renderSwitch = (value, onChange) => (
    <button
      type="button"
      onClick={onChange}
      style={{
        minWidth: 96,
        border: 'none',
        borderRadius: 999,
        padding: '8px 16px',
        fontSize: 14,
        fontWeight: 800,
        color: '#FFFFFF',
        cursor: 'pointer',
        background: value
          ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
          : 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
        boxShadow: value ? '0 8px 14px rgba(34,197,94,0.28)' : '0 6px 12px rgba(100,116,139,0.22)',
      }}
    >
      {value ? 'פועל' : 'כבוי'}
    </button>
  );

  const renderPhraseRows = (phrases, canRemove, onUpdate, onRemove, emptyLabel) =>
    phrases.map((phrase, index) => (
      <div
        key={phrase.id}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={phrase.text}
          onChange={(e) => onUpdate(phrase.id, e.target.value)}
          placeholder={emptyLabel}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '2px solid #E2E8F0',
            fontSize: 15,
            fontWeight: 700,
            color: '#1F2937',
            textAlign: 'right',
          }}
          aria-label={`phrase-${index + 1}`}
        />
        <button
          type="button"
          onClick={() => onRemove(phrase.id)}
          disabled={!canRemove}
          style={{
            border: 'none',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 16,
            cursor: canRemove ? 'pointer' : 'not-allowed',
            backgroundColor: canRemove ? '#FEE2E2' : '#E2E8F0',
            color: canRemove ? '#B91C1C' : '#94A3B8',
            fontWeight: 900,
          }}
          title="מחק"
        >
          ✕
        </button>
      </div>
    ));

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3"
      style={{
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        background: 'rgba(26, 35, 50, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        data-config-modal
        className="flex max-h-[92vh] min-h-[70vh] w-full max-w-[920px] flex-col overflow-hidden rounded-dor-xl border border-dor-border-strong bg-dor-panel-elevated shadow-dor-card"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)', direction: 'rtl' }}
      >
        <div
          className="relative flex-shrink-0 overflow-hidden border-b border-white/15"
          style={{
            background: 'linear-gradient(125deg, #0c1222 0%, #1a2744 38%, #0f1a2e 100%)',
            boxShadow: 'inset 0 -2px 0 rgba(201, 162, 39, 0.35)',
          }}
        >
          {/* Decoration only — must stay under interactive layer (z-0) */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <div
              className="absolute -left-24 -top-28 h-56 w-56 rounded-full opacity-90"
              style={{ background: 'radial-gradient(circle, rgba(201,76,59,0.5) 0%, transparent 68%)' }}
            />
            <div
              className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full opacity-80"
              style={{ background: 'radial-gradient(circle, rgba(42,95,98,0.45) 0%, transparent 68%)' }}
            />
          </div>
          {/* All taps target this layer only */}
          <div className="relative z-[1] px-5 pb-4 pt-5 text-white" style={{ isolation: 'isolate' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  className="font-display m-0 text-[clamp(26px,4.5vw,36px)] font-normal tracking-tight text-white"
                  style={{
                    textShadow: '0 0 40px rgba(232, 207, 106, 0.35), 0 2px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  הגדרות
                </h2>
                <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  מסוף בקרה
                </p>
              </div>
              <div
                className="rounded-dor-md px-3 py-2 text-xs font-extrabold text-white"
                style={{
                  border: '1px solid rgba(255,255,255,0.35)',
                  backgroundColor: 'rgba(255,255,255,0.14)',
                }}
              >
                {visibleGameCount} משחקים מוצגים
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="הגדרות">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className="min-h-[44px] cursor-pointer rounded-full px-4 py-2.5 font-sans text-sm font-extrabold"
                    style={
                      active
                        ? {
                            backgroundColor: '#ffffff',
                            color: '#0f1729',
                            border: '2px solid #ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          }
                        : {
                            backgroundColor: 'rgba(15, 23, 42, 0.55)',
                            color: '#ffffff',
                            border: '2px solid rgba(255,255,255,0.45)',
                          }
                    }
                  >
                    <span aria-hidden>{tab.icon}</span>{' '}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          data-config-scroll
          className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto bg-dor-mist/40 p-[18px]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {activeTab === TAB_IDS.GENERAL && (
            <>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>🧠 רמת קושי למשחקים</h3>
                <div style={threeColStyle}>
                  <div>
                    <label style={fieldLabelStyle}>זיכרון - כמות זוגות</label>
                    <select
                      value={memoryPairs}
                      onChange={(e) => setMemoryPairs(Number(e.target.value))}
                      style={baseSelectStyle}
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => (
                        <option key={num} value={num}>
                          {num} זוגות ({num * 2} קלפים)
                        </option>
                      ))}
                    </select>
                    <div style={{ ...subtleTextStyle, marginTop: 6 }}>קושי משוער: {difficultyLabel}</div>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>מפלצת מעל החברים — כמה חברים</label>
                    <select
                      value={monsterDragChompPeopleCount}
                      onChange={(e) =>
                        setMonsterDragChompPeopleCount(
                          normalizeMonsterDragChompPeopleCount(Number(e.target.value))
                        )
                      }
                      style={baseSelectStyle}
                    >
                      {Array.from(
                        { length: MONSTER_DRAG_CHOMP_PEOPLE_MAX - MONSTER_DRAG_CHOMP_PEOPLE_MIN + 1 },
                        (_, i) => MONSTER_DRAG_CHOMP_PEOPLE_MIN + i
                      ).map((num) => (
                        <option key={num} value={num}>
                          {num} חברים על המגש
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>צלליות</label>
                    <select
                      value={shadowMatchDifficulty}
                      onChange={(e) => setShadowMatchDifficulty(normalizeGameDifficulty(e.target.value))}
                      style={baseSelectStyle}
                    >
                      {GAME_DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>סיימון</label>
                    <select
                      value={rhythmTapDifficulty}
                      onChange={(e) => setRhythmTapDifficulty(normalizeGameDifficulty(e.target.value))}
                      style={baseSelectStyle}
                    >
                      {RHYTHM_TAP_DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>המבוך</label>
                    <select
                      value={mazeRescueDifficulty}
                      onChange={(e) => setMazeRescueDifficulty(normalizeGameDifficulty(e.target.value))}
                      style={baseSelectStyle}
                    >
                      {GAME_DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>ווטר סורט</label>
                    <select
                      value={waterSortDifficulty}
                      onChange={(e) => setWaterSortDifficulty(normalizeGameDifficulty(e.target.value))}
                      style={baseSelectStyle}
                    >
                      {WATER_SORT_DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>מרוץ 3D — קושי</label>
                    <select
                      value={runnerDashDifficulty}
                      onChange={(e) => setRunnerDashDifficulty(normalizeGameDifficulty(e.target.value))}
                      style={baseSelectStyle}
                    >
                      {GAME_DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>מרוץ 3D — דמות</label>
                    <select
                      value={runnerDashCharacter}
                      onChange={(e) => setRunnerDashCharacter(normalizeRunnerDashCharacter(e.target.value))}
                      style={baseSelectStyle}
                    >
                      {RUNNER_DASH_CHARACTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>כדורגל ⚽</label>
                    <select
                      value={footballDifficulty}
                      onChange={(e) => setFootballDifficulty(normalizeGameDifficulty(e.target.value))}
                      style={baseSelectStyle}
                    >
                      {GAME_DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>כדורגל גרירה 🥅</label>
                    <select
                      value={footballDragDifficulty}
                      onChange={(e) => setFootballDragDifficulty(normalizeGameDifficulty(e.target.value))}
                      style={baseSelectStyle}
                    >
                      {GAME_DIFFICULTY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>🔊 אודיו</h3>
                <div style={toggleRowStyle}>
                  <div>
                    <div style={fieldLabelStyle}>מוזיקת רקע</div>
                    <div style={subtleTextStyle}>מתנגן בזמן ניווט ומשחק</div>
                  </div>
                  {renderSwitch(musicEnabled, handleMusicToggle)}
                </div>
                <div style={{ ...toggleRowStyle, marginTop: 10 }}>
                  <div>
                    <div style={fieldLabelStyle}>קולות משוב</div>
                    <div style={subtleTextStyle}>ניצחון, עידוד והצלחות</div>
                  </div>
                  {renderSwitch(feedbackSoundsEnabled, () => setFeedbackSoundsEnabled((prev) => !prev))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>🖼️ רקע דף הבית</h3>
                <select value={backgroundId} onChange={(e) => setBackgroundId(e.target.value)} style={baseSelectStyle}>
                  {BACKGROUND_OPTIONS.map((background) => (
                    <option key={background.id} value={background.id}>
                      {background.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>🌓 מצב תצוגה</h3>
                <div style={toggleRowStyle}>
                  <div>
                    <div style={fieldLabelStyle}>בהיר או לילה</div>
                    <div style={subtleTextStyle}>משפיע על טקסט ורקע בכל האפליקציה</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setThemeMode((m) => (m === 'light' ? 'twilight' : 'light'))}
                    style={{
                      minWidth: 100,
                      borderRadius: 999,
                      padding: '8px 16px',
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: 'pointer',
                      background:
                        themeMode === 'twilight'
                          ? 'linear-gradient(135deg, #2a3d52 0%, #1a2332 100%)'
                          : 'linear-gradient(135deg, #f4efe6 0%, #e4ecf5 100%)',
                      color: themeMode === 'twilight' ? '#fff' : 'var(--dor-ink)',
                      border: '1px solid var(--dor-border-strong)',
                    }}
                  >
                    {themeMode === 'light' ? 'בהיר' : 'לילה'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === TAB_IDS.GAMES && (
            <>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>🧩 משחקים בדף הבית</h3>
                <p style={subtleTextStyle}>בחרו מה להציג ושנו סדר בלחיצה על החצים.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visibleGames.map((gameId, index) => {
                    const game = ALL_GAMES.find((item) => item.id === gameId);
                    if (!game) return null;
                    return (
                      <div
                        key={game.id}
                        style={{
                          border: '1px solid #CBD5E1',
                          borderRadius: 12,
                          backgroundColor: '#FFFFFF',
                          padding: '10px 12px',
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => moveGameUp(index)}
                            disabled={index === 0}
                            style={arrowButtonStyle(index === 0)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveGameDown(index)}
                            disabled={index === visibleGames.length - 1}
                            style={arrowButtonStyle(index === visibleGames.length - 1)}
                          >
                            ↓
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {game.id === 'monster-munch' || game.id === 'monster-drag-chomp' ? (
                            <MonsterMunchMenuIcon size={22} />
                          ) : (
                            <span style={{ fontSize: 22 }}>{game.icon}</span>
                          )}
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>{game.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleGameVisibility(game.id)}
                          disabled={visibleGames.length <= 1}
                          style={{
                            border: 'none',
                            borderRadius: 10,
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: visibleGames.length <= 1 ? 'not-allowed' : 'pointer',
                            backgroundColor: visibleGames.length <= 1 ? '#E2E8F0' : '#FEE2E2',
                            color: visibleGames.length <= 1 ? '#94A3B8' : '#B91C1C',
                          }}
                        >
                          הסתר
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>👀 משחקים מוסתרים</h3>
                {hiddenGames.length === 0 ? (
                  <p style={subtleTextStyle}>כל המשחקים מוצגים.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {hiddenGames.map((game) => (
                      <div
                        key={game.id}
                        style={{
                          border: '2px dashed #CBD5E1',
                          borderRadius: 12,
                          backgroundColor: '#F8FAFC',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                          {game.id === 'monster-munch' || game.id === 'monster-drag-chomp' ? (
                            <MonsterMunchMenuIcon size={20} />
                          ) : (
                            <span style={{ fontSize: 20 }}>{game.icon}</span>
                          )}
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{game.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleGameVisibility(game.id)}
                          style={{
                            border: 'none',
                            borderRadius: 10,
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: 'pointer',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                          }}
                        >
                          הצג
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === TAB_IDS.PHRASES && (
            <>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>🏆 משפטי ניצחון</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {renderPhraseRows(
                    winPhrases,
                    winPhrases.length > 1,
                    (id, text) => updatePhrase(setWinPhrases, id, text),
                    (id) => removePhrase(winPhrases, setWinPhrases, id),
                    'הוסף משפט ניצחון'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addPhrase(setWinPhrases)}
                  style={addButtonStyle('#DCFCE7', '#166534')}
                >
                  + הוסף משפט ניצחון
                </button>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>💪 משפטי עידוד</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {renderPhraseRows(
                    losePhrases,
                    losePhrases.length > 1,
                    (id, text) => updatePhrase(setLosePhrases, id, text),
                    (id) => removePhrase(losePhrases, setLosePhrases, id),
                    'הוסף משפט עידוד'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addPhrase(setLosePhrases)}
                  style={addButtonStyle('#FFEDD5', '#9A3412')}
                >
                  + הוסף משפט עידוד
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2.5 border-t border-dor-border bg-dor-panel px-3.5 py-3 [padding-bottom:calc(12px+env(safe-area-inset-bottom))]">
          {onReset && (
            <button
              type="button"
              onClick={handleReset}
              className="cursor-pointer rounded-dor-md border-2 border-dor-border-strong bg-transparent py-2.5 font-sans text-[15px] font-extrabold text-dor-ink-muted"
            >
              איפוס לברירת מחדל
            </button>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] flex-1 cursor-pointer rounded-dor-lg border-none bg-dor-mist py-3 font-sans text-base font-black text-dor-ink-muted"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="min-h-[48px] flex-1 cursor-pointer rounded-dor-lg border-none bg-dor-ember py-3 font-sans text-base font-black text-white shadow-[0_4px_0_var(--dor-ember-dark)]"
            >
              שמור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  backgroundColor: 'var(--dor-panel-elevated)',
  border: '1px solid var(--dor-border-strong)',
  borderRadius: 'var(--dor-radius-lg)',
  padding: '14px',
  boxShadow: 'var(--dor-shadow-sm)',
};

const cardTitleStyle = {
  margin: '0 0 10px',
  fontSize: 18,
  fontWeight: 900,
  color: 'var(--dor-ink)',
};

const fieldLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--dor-ink-muted)',
};

const subtleTextStyle = {
  margin: 0,
  fontSize: 13,
  color: 'var(--dor-ink-subtle)',
};

const toggleRowStyle = {
  border: '1px solid var(--dor-border-strong)',
  borderRadius: 'var(--dor-radius-md)',
  padding: '10px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  backgroundColor: 'var(--dor-panel)',
};

const threeColStyle = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
};

const addButtonStyle = (bg, fg) => ({
  width: '100%',
  border: 'none',
  borderRadius: 10,
  padding: '10px 12px',
  backgroundColor: bg,
  color: fg,
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer',
});

const arrowButtonStyle = (disabled) => ({
  border: 'none',
  borderRadius: 8,
  padding: '3px 10px',
  fontSize: 13,
  fontWeight: 900,
  cursor: disabled ? 'not-allowed' : 'pointer',
  backgroundColor: disabled ? '#E2E8F0' : '#334155',
  color: '#FFFFFF',
});

export default ConfigScreen;
