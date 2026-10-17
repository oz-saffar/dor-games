import { ACCENTS, PAPER_LIGHT, PLAY_COLORS } from '../../lib/palette';
import { SCENE_H, SCENE_W } from './sceneConfig';
import { SceneObject } from './SceneObjects';

/** Pale, flat backdrops: they must never compete with the objects for attention. */
const BACKDROPS = {
  garden: () => (
    <>
      <rect width={SCENE_W} height={SCENE_H} fill="#DDEAF2" />
      <rect y="34" width={SCENE_W} height={SCENE_H - 34} fill="#B9D0A8" />
      <path d="M0 34 Q25 28 50 34 T100 33 V36 H0 Z" fill="#A5C492" />
    </>
  ),
  beach: () => (
    <>
      <rect width={SCENE_W} height={SCENE_H} fill="#DDEAF2" />
      <rect y="30" width={SCENE_W} height="16" fill="#B7D2E2" />
      <path d="M0 30 Q12 27 25 30 T50 30 T75 30 T100 30" stroke="#F5F0E6" strokeWidth="1.2" fill="none" />
      <rect y="46" width={SCENE_W} height={SCENE_H - 46} fill="#EBDDBF" />
    </>
  ),
  room: () => (
    <>
      <rect width={SCENE_W} height={SCENE_H} fill="#F0E4D2" />
      <rect y="50" width={SCENE_W} height={SCENE_H - 50} fill="#D9BFA0" />
      <rect y="49" width={SCENE_W} height="2.5" fill="#C9A98A" />
      {[14, 38, 62, 86].map((x) => (
        <line key={x} x1={x} y1="51" x2={x - 6} y2={SCENE_H} stroke="#C9A98A" strokeWidth="0.8" />
      ))}
    </>
  ),
  farm: () => (
    <>
      <rect width={SCENE_W} height={SCENE_H} fill="#E4EDF0" />
      <path d="M0 36 Q30 26 60 34 T100 30 V80 H0 Z" fill="#C9D9A0" />
      <path d="M0 52 Q40 46 100 54 V80 H0 Z" fill="#E1D49C" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={i * 20 - 6} y1="80" x2={i * 20 + 6} y2="55" stroke="#CDBE86" strokeWidth="0.8" />
      ))}
    </>
  ),
};

/** A whole picture: backdrop plus its objects, in the 100 x 80 canvas. */
export function SceneArt({ scene }) {
  const Backdrop = BACKDROPS[scene.theme] ?? BACKDROPS.garden;
  return (
    <g>
      <Backdrop />
      <rect width={SCENE_W} height={SCENE_H} fill="none" stroke={PAPER_LIGHT} strokeWidth="0" />
      {scene.objects.map((o) => <SceneObject key={o.id} obj={o} />)}
    </g>
  );
}

/** Colours used by the rings and hint pulse. */
export const RING_COLOR = PLAY_COLORS.red;
export const HINT_COLOR = ACCENTS.ochre;
