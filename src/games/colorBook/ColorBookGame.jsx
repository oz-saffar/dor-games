import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDorPhotos } from '../../hooks/useDorPhotos';
import { useViewport } from '../../hooks/useViewport';
import { GAME_DIFFICULTY, normalizeGameDifficulty } from '../../lib/gameDifficulties';
import { PLAY_COLORS } from '../../lib/palette';
import {
  GameBackButton, GameScoreBadge, GameInstructionsOverlay, GameCelebrationOverlay,
} from '../../components/game';
import { createBlopSfx } from './colorAudio';
import {
  AUTO_FINISH_MS, CELEBRATION_MS, FINISH_ROW, SWATCHES, TOP_RESERVE, layoutFor, loadGallery, saveToGallery,
} from './colorConfig';
import { PICTURES, getPicture, regionsFor } from './pictures';
import PictureSvg from './PictureSvg';
import Palette from './Palette';
import Picker from './Picker';

const ColorBookGame = ({ onExit, soundManager, difficulty: difficultyProp = GAME_DIFFICULTY.EASY }) => {
  const difficulty = normalizeGameDifficulty(difficultyProp);
  const { width, height, isTablet } = useViewport();
  const reduce = useReducedMotion();
  const { getRandomPhoto, hasPhotos } = useDorPhotos();

  const [showInstructions, setShowInstructions] = useState(true);
  const [phase, setPhase] = useState('paint'); // paint | picker
  const [pictureId, setPictureId] = useState(PICTURES[0].id);
  const [fills, setFills] = useState({});
  const [spreads, setSpreads] = useState({});
  const [selected, setSelected] = useState(SWATCHES[0].name);
  const [rounds, setRounds] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [gallery, setGallery] = useState(loadGallery);

  const celebratingRef = useRef(false);
  const timersRef = useRef([]);
  const keyRef = useRef(0);
  const [sfx] = useState(createBlopSfx);

  const picture = getPicture(pictureId);
  const regions = regionsFor(picture, difficulty);
  const allFilled = regions.every((region) => fills[region.id]);

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.code === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    sfx.close();
  }, [sfx]);

  const handleRegion = useCallback((id, cx, cy) => {
    if (celebratingRef.current) return;
    const color = PLAY_COLORS[selected];
    const idx = SWATCHES.findIndex((s) => s.name === selected);
    if (fills[id] === color) return;
    if (!reduce) {
      keyRef.current += 1;
      const key = keyRef.current;
      setSpreads((s) => ({ ...s, [id]: { prev: fills[id], color, cx, cy, key } }));
    }
    setFills((cur) => ({ ...cur, [id]: color }));
    sfx.blop(0.85 + (idx % 5) * 0.1);
    try { navigator.vibrate?.(8); } catch { /* no haptics */ }
  }, [selected, fills, reduce, sfx]);

  const handleSpreadDone = useCallback((id, key) => {
    setSpreads((s) => {
      if (!s[id] || s[id].key !== key) return s;
      const next = { ...s };
      delete next[id];
      return next;
    });
  }, []);

  const toPicker = useCallback(() => {
    celebratingRef.current = false;
    setCelebrating(false);
    setPhoto(null);
    setPhase('picker');
  }, []);

  const finish = useCallback(() => {
    if (celebratingRef.current) return;
    celebratingRef.current = true;
    setCelebrating(true);
    setGallery(saveToGallery({ pictureId, difficulty, fills }));
    soundManager?.playWin?.();
    setPhoto(hasPhotos ? getRandomPhoto() : null);
    setRounds((n) => n + 1);
    schedule(toPicker, CELEBRATION_MS);
  }, [pictureId, difficulty, fills, soundManager, hasPhotos, getRandomPhoto, schedule, toPicker]);

  // Everything coloured: the finish button shows, and shortly after we celebrate on our own.
  useEffect(() => {
    if (showInstructions || phase !== 'paint' || celebrating || !allFilled) return undefined;
    const id = setTimeout(finish, AUTO_FINISH_MS);
    return () => clearTimeout(id);
  }, [fills, allFilled, showInstructions, phase, celebrating, finish]);

  const pick = useCallback((id) => {
    setPictureId(id);
    setFills({});
    setSpreads({});
    setPhase('paint');
  }, []);

  const layout = layoutFor(width, height, isTablet);
  const finishBtn = (
    <div style={{ height: FINISH_ROW, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {allFilled && !celebrating && (
        <motion.button
          type="button"
          data-finish=""
          data-tap-target=""
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onPointerDown={(e) => { e.stopPropagation(); finish(); }}
          onClick={(e) => { if (e.detail === 0) finish(); }}
          style={{
            padding: '8px 26px', fontSize: 24, borderRadius: 999, color: '#fff', cursor: 'pointer',
            fontFamily: 'Varela Round, Rubik, sans-serif', background: 'var(--game-accent)',
            border: '1px solid var(--dor-border)', boxShadow: '0 3px 0 var(--dor-lip)',
          }}
        >
          סיימתי ✓
        </motion.button>
      )}
    </div>
  );

  const canvas = (
    <div
      style={{
        width: layout.picture, height: layout.picture, padding: 8, borderRadius: 24, background: '#FFFDF8',
        border: '1px solid var(--dor-border)', boxShadow: 'var(--dor-shadow-card), 0 3px 0 var(--dor-lip)',
      }}
    >
      <PictureSvg
        picture={picture}
        difficulty={difficulty}
        fills={fills}
        spreads={spreads}
        size={layout.picture - 18}
        onRegion={handleRegion}
        onSpreadDone={handleSpreadDone}
      />
    </div>
  );
  const palette = <Palette layout={layout} selected={selected} onSelect={setSelected} reduce={reduce} />;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'var(--game-surface)', touchAction: 'none', userSelect: 'none' }}
      onPointerDown={() => { if (celebratingRef.current) toPicker(); }}
    >
      {phase === 'paint' ? (
        <div
          className={`absolute inset-0 flex items-center justify-center ${layout.landscape ? 'flex-row' : 'flex-col'}`}
          style={{ paddingTop: TOP_RESERVE - 20, gap: layout.landscape ? 24 : 0 }}
          dir="ltr"
        >
          {canvas}
          {layout.landscape ? (
            <div className="flex flex-col items-center">{palette}{finishBtn}</div>
          ) : (
            <>{finishBtn}{palette}</>
          )}
        </div>
      ) : (
        <Picker width={width} height={height} gallery={gallery} difficulty={difficulty} onPick={pick} />
      )}

      <GameBackButton onExit={onExit} />
      <GameScoreBadge icon="🎨" score={rounds} />

      {showInstructions && (
        <GameInstructionsOverlay
          title="צובעים 🎨"
          buttonText="בואו נתחיל"
          onStart={() => setShowInstructions(false)}
        >
          <p style={{ marginBottom: 12 }}>🖍️ <strong>בוחרים צבע</strong> ולוחצים על חלק בציור כדי לצבוע אותו.</p>
          <p style={{ marginBottom: 12 }}>✨ אפשר לצבוע הכול איך שרוצים!</p>
        </GameInstructionsOverlay>
      )}

      <GameCelebrationOverlay
        show={celebrating}
        successText="איזה ציור יפה! 🎉"
        subtitle={rounds === 1 ? 'ציור אחד! 🎨' : `${rounds} ציורים! 🎨`}
        photo={photo}
        numberOfPieces={180}
        onPhotoError={() => setPhoto(null)}
      />
    </div>
  );
};

export default ColorBookGame;
