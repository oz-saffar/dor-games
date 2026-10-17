import { memo } from 'react';
import { ACCENTS, INK, PAPER_LIGHT, alpha, mix, shade, tint } from '../../lib/palette';

/**
 * The cutaway dollhouse — a house with its front wall off.
 *
 * Every room is drawn **from the same zone rect the hit-test uses**, so the
 * picture and the answer key cannot drift apart. Decoration is keyed off the
 * zone id; the geometry is not this component's to invent.
 *
 * Purely decorative: `pointer-events: none`, `aria-hidden`.
 */

/** deterministic pseudo-random so the shingles never churn between renders */
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const WALL = mix(ACCENTS.sand, PAPER_LIGHT, 0.42);
const WALL_DARK = shade(ACCENTS.sand, 0.32);
const ROOF = shade(ACCENTS.terracotta, 0.12);

/** Each room gets its own wash so it reads as a different place at a glance. */
const TONE = {
  bedroom: { wall: tint(ACCENTS.plum, 0.7), floor: shade(ACCENTS.sand, 0.26) },
  bathroom: { wall: tint(ACCENTS.sky, 0.66), floor: tint(ACCENTS.sky, 0.34) },
  kitchen: { wall: tint(ACCENTS.sage, 0.68), floor: shade(ACCENTS.sand, 0.18) },
  living: { wall: tint(ACCENTS.ochre, 0.72), floor: shade(ACCENTS.terracotta, 0.34) },
};
const FALLBACK_TONE = { wall: tint(ACCENTS.sage, 0.7), floor: shade(ACCENTS.sand, 0.24) };

const pct = (n) => `${n * 100}%`;

const SHINGLES = Array.from({ length: 22 }, (_, i) => ({
  left: `${2 + (i % 11) * 8.8 + rnd(i) * 2}%`,
  top: `${16 + Math.floor(i / 11) * 34 + rnd(i + 40) * 6}%`,
  w: 7 + rnd(i + 80) * 2,
}));

const TILE_GRID = [
  `linear-gradient(${alpha(PAPER_LIGHT, 0.85)} 2px, transparent 2px)`,
  `linear-gradient(90deg, ${alpha(PAPER_LIGHT, 0.85)} 2px, transparent 2px)`,
].join(', ');

/** Wall fittings, so each room is identifiable before a single item is placed. */
const Fittings = ({ id }) => {
  if (id === 'bedroom') {
    return (
      <>
        <div style={{
          position: 'absolute', left: '11%', top: '14%', width: '26%', height: '34%',
          background: tint(ACCENTS.sky, 0.3), border: `3px solid ${WALL_DARK}`,
          borderRadius: 4, boxShadow: `inset 0 0 0 2px ${alpha(PAPER_LIGHT, 0.6)}`,
        }} />
        <div style={{
          position: 'absolute', left: '11%', top: '30%', width: '26%', height: 3,
          background: WALL_DARK,
        }} />
        <div style={{
          position: 'absolute', left: '23%', top: '14%', width: 3, height: '34%',
          background: WALL_DARK,
        }} />
        <div style={{
          position: 'absolute', left: '7%', top: '11%', width: '7%', height: '42%',
          background: alpha(ACCENTS.clay, 0.55), borderRadius: '4px 4px 8px 8px',
        }} />
        <div style={{
          position: 'absolute', left: '34%', top: '11%', width: '7%', height: '42%',
          background: alpha(ACCENTS.clay, 0.55), borderRadius: '4px 4px 8px 8px',
        }} />
      </>
    );
  }

  if (id === 'bathroom') {
    return (
      <>
        <div style={{
          position: 'absolute', inset: '6% 6% 26% 6%', opacity: 0.5,
          backgroundImage: TILE_GRID,
          backgroundSize: '17% 24%',
        }} />
        <div style={{
          position: 'absolute', right: '12%', top: '13%', width: '22%', height: '30%',
          borderRadius: '50%', background: alpha(PAPER_LIGHT, 0.9),
          border: `3px solid ${WALL_DARK}`,
        }} />
      </>
    );
  }

  if (id === 'kitchen') {
    return (
      <>
        <div style={{
          position: 'absolute', left: '6%', right: '6%', bottom: '17%', height: '17%',
          background: WALL_DARK, borderRadius: '5px 5px 0 0',
          boxShadow: `inset 0 3px 0 ${alpha(PAPER_LIGHT, 0.35)}`,
        }} />
        <div style={{
          position: 'absolute', left: '13%', bottom: '22%', width: '20%', height: '8%',
          background: alpha(PAPER_LIGHT, 0.85), borderRadius: 4,
        }} />
        <div style={{
          position: 'absolute', right: '14%', top: '12%', width: '24%', height: '22%',
          background: alpha(WALL_DARK, 0.45), borderRadius: 4,
        }} />
      </>
    );
  }

  if (id === 'living') {
    return (
      <>
        <div style={{
          position: 'absolute', left: '9%', bottom: '17%', width: '30%', height: '40%',
          background: WALL_DARK,
          borderRadius: '50% 50% 4px 4px / 34% 34% 4px 4px',
        }} />
        <div style={{
          position: 'absolute', left: '15%', bottom: '17%', width: '18%', height: '24%',
          background: shade(ACCENTS.terracotta, 0.1),
          borderRadius: '50% 50% 2px 2px / 40% 40% 2px 2px',
        }} />
        <div style={{
          position: 'absolute', right: '10%', bottom: '5%', width: '38%', height: '9%',
          background: alpha(ACCENTS.plum, 0.4), borderRadius: 999,
        }} />
      </>
    );
  }

  return null;
};

const DollhouseScene = memo(({ zones, hoverZoneId }) => (
  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    {/* roof */}
    <div style={{
      position: 'absolute', left: '-1%', top: 0, width: '102%', height: '15.5%',
      background: ROOF,
      clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
    }}>
      {SHINGLES.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: s.left, top: s.top,
          width: `${s.w}%`, height: '13%',
          background: alpha(INK, 0.1), borderRadius: '999px 999px 0 0',
        }} />
      ))}
    </div>

    {/* house body */}
    <div style={{
      position: 'absolute', left: '2%', top: '14%', width: '96%', height: '86%',
      background: WALL,
      borderRadius: '8px 8px 12px 12px',
      border: `3px solid ${WALL_DARK}`,
      boxShadow: `0 10px 0 -2px ${alpha(INK, 0.16)}, inset 0 2px 0 ${alpha(PAPER_LIGHT, 0.7)}`,
    }} />

    {/* rooms */}
    {zones.map((z) => {
      const tone = TONE[z.id] ?? FALLBACK_TONE;
      const hot = hoverZoneId === z.id;
      return (
        <div
          key={z.id}
          style={{
            position: 'absolute',
            left: pct(z.x), top: pct(z.y), width: pct(z.w), height: pct(z.h),
            background: tone.wall,
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: hot
              ? `inset 0 0 0 4px ${ACCENTS.sand}, 0 0 22px 2px ${alpha(ACCENTS.sand, 0.55)}`
              : `inset 0 3px 10px ${alpha(INK, 0.16)}`,
            transition: 'box-shadow 160ms ease-out',
          }}
        >
          <Fittings id={z.id} />
          {/* floor */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: '16%',
            background: tone.floor,
            boxShadow: `inset 0 2px 0 ${alpha(INK, 0.2)}`,
          }} />
        </div>
      );
    })}

    {/* front door, on the base strip under the ground floor */}
    <div style={{
      position: 'absolute', left: '45.5%', bottom: '0.4%', width: '9%', height: '5%',
      background: shade(ACCENTS.terracotta, 0.26),
      borderRadius: '6px 6px 2px 2px',
      border: `2px solid ${WALL_DARK}`,
    }} />
  </div>
));

DollhouseScene.displayName = 'DollhouseScene';

export default DollhouseScene;
