import { memo } from 'react';

/* radiating cracks, drawn once as polyline point strings */
const CRACKS = [
  '0,0 -34,-6 -62,4 -96,-4',
  '0,0 -26,10 -52,16 -84,14',
  '0,0 -12,-14 -22,-26 -40,-32',
  '0,0 8,16 16,26 30,34',
  '0,0 30,8 58,4 92,12',
  '0,0 26,-8 54,-14 88,-8',
  '0,0 4,-18 18,-28 34,-30',
];

const ROCKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + 0.4;
  const spread = 60 + (i % 4) * 26;
  return {
    dx: `${Math.cos(a) * spread}px`,
    dy: `${-46 - (i % 5) * 16}px`,
    rot: `${(i % 2 ? 1 : -1) * (180 + i * 26)}deg`,
    size: 6 + (i % 4) * 4,
    dur: 620 + (i % 5) * 90,
    tone: i % 3,
  };
});

const PUFFS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return {
    dx: `${Math.cos(a) * (70 + (i % 3) * 22)}px`,
    dy: `${Math.sin(a) * 16 - 22}px`,
    size: 26 + (i % 4) * 10,
    dur: 720 + (i % 4) * 120,
    delay: (i % 4) * 40,
  };
});

const ROCK_TONES = ['#8a4d24', '#6b3a1a', '#a9683a'];

/**
 * One ground impact: flash, dust rings, spidering cracks, popping rocks.
 * `kind` = 'hit' (big) | 'miss' (smaller, browner).
 */
function ImpactFx({ x, y, scale, kind, reduce }) {
  const big = kind === 'hit';
  const k = scale * (big ? 1 : 0.78);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', left: 0, top: 0, width: 0, height: 0,
        transform: `translate3d(${x}px, ${y}px, 0) scale(${k})`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
        zIndex: 24,
        animation: 'dsFxFade 1100ms ease-out forwards',
      }}
    >
      {/* flash */}
      {big && (
        <div style={{
          position: 'absolute', left: -110, top: -84, width: 220, height: 168, borderRadius: '50%',
          background: 'radial-gradient(ellipse,rgba(255,247,214,0.95) 0%,rgba(253,224,71,0.5) 40%,transparent 72%)',
          animation: 'dsFxFlash 340ms ease-out forwards',
        }} />
      )}

      {/* dust rings */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute', left: -150, top: -46, width: 300, height: 92, borderRadius: '50%',
            border: `${6 - i * 2}px solid rgba(232,197,152,${0.8 - i * 0.25})`,
            boxShadow: 'inset 0 0 22px rgba(214,170,120,0.5)',
            animation: reduce ? 'none' : `dsFxRing ${520 + i * 240}ms cubic-bezier(0.15,0.7,0.3,1) ${i * 90}ms forwards`,
          }}
        />
      ))}

      {/* cracks */}
      <svg
        width="260" height="100" viewBox="-130 -50 260 100"
        style={{ position: 'absolute', left: -130, top: -50, overflow: 'visible' }}
      >
        {CRACKS.map((pts, i) => (
          <polyline
            key={i}
            points={pts}
            fill="none"
            stroke="#3a1d0b"
            strokeWidth={big ? 5 : 3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
            style={{ strokeDasharray: 150, animation: reduce ? 'none' : `dsFxCrack ${300 + i * 45}ms ease-out forwards` }}
          />
        ))}
        {CRACKS.slice(0, 4).map((pts, i) => (
          <polyline
            key={`h${i}`}
            points={pts}
            fill="none"
            stroke="#d9a066"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.5"
            transform="translate(0 3)"
            style={{ strokeDasharray: 150, animation: reduce ? 'none' : `dsFxCrack ${340 + i * 45}ms ease-out forwards` }}
          />
        ))}
      </svg>

      {/* dust puffs */}
      {!reduce && PUFFS.map((p, i) => (
        <div
          key={`p${i}`}
          style={{
            position: 'absolute', left: -p.size / 2, top: -p.size / 2,
            width: p.size, height: p.size, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(240,214,178,0.95),rgba(203,164,116,0.15))',
            filter: 'blur(1.5px)',
            ['--dx']: p.dx,
            ['--dy']: p.dy,
            animation: `dsFxPuff ${p.dur}ms ease-out ${p.delay}ms forwards`,
          }}
        />
      ))}

      {/* rocks */}
      {!reduce && ROCKS.slice(0, big ? 12 : 7).map((r, i) => (
        <div
          key={`r${i}`}
          style={{
            position: 'absolute', left: -r.size / 2, top: -r.size,
            width: r.size, height: r.size * 0.82,
            borderRadius: '52% 48% 40% 60%',
            background: ROCK_TONES[r.tone],
            boxShadow: 'inset 1px 1px 0 rgba(255,222,180,0.5)',
            ['--dx']: r.dx,
            ['--dy']: r.dy,
            ['--rot']: r.rot,
            animation: `dsFxRock ${r.dur}ms cubic-bezier(0.25,0.6,0.4,1) forwards`,
          }}
        />
      ))}
    </div>
  );
}

export default memo(ImpactFx);
