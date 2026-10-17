import { memo } from 'react';

/* deterministic pseudo-random so the scenery never re-shuffles between renders */
let seed = 20240419;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const CLOUDS = Array.from({ length: 4 }, (_, i) => ({
  top: 6 + i * 7,
  w: 90 + rnd() * 130,
  o: 0.16 + rnd() * 0.2,
  dur: 90 + rnd() * 80,
  delay: -rnd() * 90,
}));

const MOTES = Array.from({ length: 12 }, () => ({
  left: rnd() * 100,
  bottom: rnd() * 34,
  size: 2 + rnd() * 4,
  dx: `${(rnd() - 0.5) * 60}px`,
  dur: 5 + rnd() * 6,
  delay: -rnd() * 9,
}));

const PEBBLES = Array.from({ length: 46 }, () => ({
  left: rnd() * 100,
  band: rnd(),
  w: 3 + rnd() * 9,
  tone: rnd(),
  rot: rnd() * 180,
}));

const SMOKE = Array.from({ length: 5 }, (_, i) => ({ delay: i * 1.1, dur: 5.5 + i * 0.4 }));

/* ── far skyline ─────────────────────────────────────────────────────────── */
function FarLayer({ horizon }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 220"
      preserveAspectRatio="none"
      style={{
        position: 'absolute', left: 0, right: 0, bottom: `calc(100% - ${horizon}px)`,
        width: '100%', height: 190, opacity: 0.72, filter: 'blur(0.6px)',
      }}
    >
      <defs>
        <linearGradient id="dsMesaFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8f6f8f" />
          <stop offset="100%" stopColor="#5b4a6b" />
        </linearGradient>
        <linearGradient id="dsVolcano" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5a72" />
          <stop offset="60%" stopColor="#4e3d5c" />
          <stop offset="100%" stopColor="#3b2f4a" />
        </linearGradient>
      </defs>
      <path d="M0 220 L0 168 L70 150 L112 168 L180 128 L238 168 L300 142 L352 170 L430 150 L470 176 L560 152 L620 178 L700 158 L760 182 L840 160 L900 186 L1000 164 L1000 220 Z" fill="url(#dsMesaFar)" />
      <path d="M600 220 L688 92 Q706 74 726 92 L820 220 Z" fill="url(#dsVolcano)" />
      <path d="M688 96 L707 80 L726 96 L716 104 L698 104 Z" fill="#f97316" opacity="0.85" />
      <path d="M700 104 Q710 122 722 104 L734 140 L688 140 Z" fill="#ea580c" opacity="0.55" />
      <path d="M120 220 L172 138 L226 220 Z" fill="#544162" opacity="0.8" />
      <path d="M0 220 L0 196 L1000 186 L1000 220 Z" fill="#4a3a52" opacity="0.55" />
    </svg>
  );
}

/* ── mid buttes ──────────────────────────────────────────────────────────── */
function MidLayer({ horizon }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 160"
      preserveAspectRatio="none"
      style={{
        position: 'absolute', left: 0, right: 0, bottom: `calc(100% - ${horizon + 8}px)`,
        width: '100%', height: 128, opacity: 0.95,
      }}
    >
      <defs>
        <linearGradient id="dsButte" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c2703a" />
          <stop offset="45%" stopColor="#9a4f28" />
          <stop offset="100%" stopColor="#6d3520" />
        </linearGradient>
      </defs>
      <path d="M0 160 L0 118 L58 104 L92 112 L132 66 L188 62 L214 110 L286 96 L330 116 L392 70 L452 66 L486 114 L556 100 L604 118 L664 74 L722 70 L756 116 L830 102 L878 120 L940 88 L1000 96 L1000 160 Z" fill="url(#dsButte)" />
      <g opacity="0.28" stroke="#3f1d0f" strokeWidth="2" fill="none">
        <path d="M0 132 L1000 118" />
        <path d="M0 146 L1000 134" />
        <path d="M132 78 L214 108" />
        <path d="M392 82 L486 110" />
        <path d="M664 86 L756 112" />
      </g>
      <g opacity="0.35" fill="#f0b27a">
        <path d="M132 66 L188 62 L182 76 L140 80 Z" />
        <path d="M392 70 L452 66 L446 80 L400 84 Z" />
        <path d="M664 74 L722 70 L716 84 L672 88 Z" />
      </g>
    </svg>
  );
}

/* ── fern / scrub line right at the horizon ──────────────────────────────── */
function FernLine({ horizon, reduce }) {
  return (
    <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: horizon - 26, height: 34, pointerEvents: 'none' }}>
      {Array.from({ length: 22 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${(i * 4.7 + (i % 3) * 1.4) % 100}%`,
            bottom: 4,
            width: 20 + (i % 4) * 6,
            height: 16 + (i % 5) * 5,
            borderRadius: '60% 60% 12% 12%',
            background: i % 2 ? 'linear-gradient(180deg,#3f6f3a,#1f4423)' : 'linear-gradient(180deg,#4d8140,#265129)',
            opacity: 0.85,
            transformOrigin: '50% 100%',
            animation: reduce ? 'none' : `dsFern ${3 + (i % 5) * 0.5}s ease-in-out ${-i * 0.3}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── the canyon floor + lane strips ──────────────────────────────────────── */
function Floor({ geom, reduce }) {
  const { top, bottom, bands } = geom;
  return (
    <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top, height: bottom - top + geom.h * 0.06 }}>
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg,#b9793f 0%,#a8652f 22%,#96552a 52%,#7c4423 78%,#63351d 100%)',
        }}
      />
      {bands.map((b) => (
        <div
          key={b.i}
          style={{
            position: 'absolute',
            left: 0, right: 0,
            top: b.top - top,
            height: b.bottom - b.top,
            background: b.i % 2
              ? 'linear-gradient(180deg,rgba(255,225,180,0.10),rgba(0,0,0,0.06))'
              : 'linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.12))',
            borderTop: '2px solid rgba(84,42,20,0.32)',
            boxShadow: 'inset 0 2px 0 rgba(255,214,164,0.16)',
          }}
        >
          {/* haze on the far lanes sells the depth */}
          <div style={{ position: 'absolute', inset: 0, background: '#cfa98a', opacity: b.haze, mixBlendMode: 'screen' }} />
        </div>
      ))}
      {PEBBLES.map((p, i) => {
        const band = bands[Math.min(bands.length - 1, Math.floor(p.band * bands.length))];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: band.top - top + (band.bottom - band.top) * 0.62,
              width: p.w * band.scale + 2,
              height: (p.w * band.scale + 2) * 0.66,
              borderRadius: '50% 50% 45% 55%',
              background: p.tone > 0.5 ? '#7a4522' : '#5f3419',
              boxShadow: '0 1px 0 rgba(255,222,180,0.35)',
              transform: `rotate(${p.rot}deg)`,
              opacity: 0.75,
            }}
          />
        );
      })}
      {/* foreground rocks framing the bottom corners */}
      <div style={{
        position: 'absolute', left: -18, bottom: -10, width: 130, height: 78,
        borderRadius: '52% 48% 22% 30%',
        background: 'linear-gradient(150deg,#8a4d24,#4c2a13)',
        boxShadow: 'inset 6px 6px 0 rgba(255,205,150,0.16)',
      }} />
      <div style={{
        position: 'absolute', right: -24, bottom: -14, width: 150, height: 88,
        borderRadius: '44% 56% 30% 24%',
        background: 'linear-gradient(200deg,#824823,#452513)',
        boxShadow: 'inset -6px 6px 0 rgba(255,205,150,0.14)',
      }} />
      {MOTES.map((m, i) => (
        <div
          key={`m${i}`}
          style={{
            position: 'absolute',
            left: `${m.left}%`,
            bottom: `${m.bottom}%`,
            width: m.size, height: m.size, borderRadius: '50%',
            background: 'rgba(255,238,205,0.9)',
            '--dx': m.dx,
            animation: reduce ? 'none' : `dsMote ${m.dur}s linear ${m.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── whole backdrop ──────────────────────────────────────────────────────── */
function CanyonBackdrop({ geom, reduce }) {
  const horizon = geom.top;
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* sun + its bloom */}
      <div style={{
        position: 'absolute', top: horizon * 0.24, left: '17%',
        width: 108, height: 108, borderRadius: '50%',
        background: 'radial-gradient(circle,#fff7d6 0%,#fcd34d 42%,rgba(251,191,36,0.35) 62%,transparent 74%)',
        animation: reduce ? 'none' : 'dsSunGlow 6s ease-in-out infinite',
      }} />
      {/* clouds */}
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', top: `${c.top}%`, left: 0,
            width: c.w, height: c.w * 0.3, borderRadius: 999,
            background: 'linear-gradient(180deg,rgba(255,244,224,0.95),rgba(255,225,200,0.45))',
            opacity: c.o, filter: 'blur(2px)',
            animation: reduce ? 'none' : `dsCloud ${c.dur}s linear ${c.delay}s infinite`,
          }}
        />
      ))}
      {/* volcano smoke */}
      {SMOKE.map((s, i) => (
        <div
          key={`s${i}`}
          style={{
            position: 'absolute', top: horizon - 96, left: '70%',
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(214,196,190,0.55)', filter: 'blur(3px)',
            animation: reduce ? 'none' : `dsSmoke ${s.dur}s ease-out ${s.delay}s infinite`,
          }}
        />
      ))}
      {/* pterodactyls */}
      {!reduce && [0, 1].map((i) => (
        <div
          key={`p${i}`}
          style={{
            position: 'absolute', top: horizon * (0.3 + i * 0.16), left: `${4 + i * 12}%`,
            animation: `dsPtero ${26 + i * 9}s linear ${-i * 8}s infinite`,
            opacity: 0.42,
          }}
        >
          <div style={{ animation: 'dsWingFlap 0.7s ease-in-out infinite', transformOrigin: '50% 50%' }}>
            <svg width="30" height="12" viewBox="0 0 30 12" fill="none">
              <path d="M1 8 Q8 0 15 7 Q22 0 29 8" stroke="#3f2f4a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      ))}

      <FarLayer horizon={horizon} />
      <MidLayer horizon={horizon} />
      <FernLine horizon={horizon} reduce={reduce} />
      <Floor geom={geom} reduce={reduce} />

      {/* warm vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 42%,transparent 46%,rgba(60,22,8,0.42) 100%)',
      }} />
    </div>
  );
}

export default memo(CanyonBackdrop);
