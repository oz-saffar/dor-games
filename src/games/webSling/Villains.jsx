/**
 * The four villains, flat-comic style to match the heroes.
 * Local space: anchor at (0,0) — for the pop-up villains that is the rooftop
 * ledge line, so the body is drawn upward into negative y.
 */

const Rhino = ({ angry }) => (
  <g>
    {/* fists gripping the ledge */}
    <ellipse cx="-46" cy="-6" rx="15" ry="12" fill="#9aa3b8" stroke="#0b1020" strokeWidth="3" />
    <ellipse cx="46" cy="-6" rx="15" ry="12" fill="#9aa3b8" stroke="#0b1020" strokeWidth="3" />
    {/* torso */}
    <path
      d="M-42 -6 q-4 -50 16 -62 q26 -10 52 0 q20 12 16 62 q-42 12 -84 0Z"
      fill="#8b93aa"
      stroke="#0b1020"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M-20 -14 q20 8 40 0 q2 -26 -4 -34 q-16 -6 -32 0 q-6 8 -4 34Z" fill="#c3cad8" opacity="0.85" />
    {/* shoulder plates */}
    <path d="M-42 -52 q-14 6 -12 24 q10 6 18 2Z" fill="#5b6480" stroke="#0b1020" strokeWidth="2.6" />
    <path d="M42 -52 q14 6 12 24 q-10 6 -18 2Z" fill="#5b6480" stroke="#0b1020" strokeWidth="2.6" />
    {/* head */}
    <path
      d="M-30 -70 q0 -30 30 -30 q30 0 30 30 q0 12 -8 18 q-22 8 -44 0 q-8 -6 -8 -18Z"
      fill="#9aa3b8"
      stroke="#0b1020"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* ears */}
    <path d="M-28 -88 q-12 -6 -8 -17 q11 3 13 15Z" fill="#7b8399" stroke="#0b1020" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M28 -88 q12 -6 8 -17 q-11 3 -13 15Z" fill="#7b8399" stroke="#0b1020" strokeWidth="2.4" strokeLinejoin="round" />
    {/* snout */}
    <path d="M-19 -60 q19 10 38 0 q-2 16 -19 16 q-17 0 -19 -16Z" fill="#c3cad8" stroke="#0b1020" strokeWidth="2.6" />
    <circle cx="-7" cy="-49" r="2.6" fill="#3c4257" />
    <circle cx="7" cy="-49" r="2.6" fill="#3c4257" />
    {/* horn — sits on the snout, clear of the eyes above it */}
    <path d="M-10 -59 q10 -22 20 0 q-10 5 -20 0Z" fill="#f7f4ea" stroke="#0b1020" strokeWidth="2.8" strokeLinejoin="round" />
    {/* eyes */}
    <ellipse cx="-15" cy="-82" rx="7.5" ry="6.5" fill="#fff8e7" stroke="#0b1020" strokeWidth="2.4" />
    <ellipse cx="15" cy="-82" rx="7.5" ry="6.5" fill="#fff8e7" stroke="#0b1020" strokeWidth="2.4" />
    <circle cx="-14" cy="-81" r="3.1" fill="#131a2e" />
    <circle cx="16" cy="-81" r="3.1" fill="#131a2e" />
    {angry && (
      <g stroke="#0b1020" strokeWidth="3.4" strokeLinecap="round">
        <path d="M-24 -93 L-8 -88" />
        <path d="M24 -93 L8 -88" />
      </g>
    )}
  </g>
);

const DocOck = ({ angry }) => (
  <g>
    {/* four mechanical tentacles */}
    <g stroke="#7c8798" strokeWidth="7" fill="none" strokeLinecap="round">
      <path d="M-24 -44 q-42 -12 -54 -46" />
      <path d="M-16 -50 q-34 -34 -28 -66" />
      <path d="M16 -50 q34 -34 28 -66" />
      <path d="M24 -44 q42 -12 54 -46" />
    </g>
    <g fill="#b9c2d0" stroke="#0b1020" strokeWidth="2.4">
      <circle cx="-78" cy="-90" r="8" />
      <circle cx="-44" cy="-116" r="8" />
      <circle cx="44" cy="-116" r="8" />
      <circle cx="78" cy="-90" r="8" />
    </g>
    <g fill="#ffd166" stroke="#0b1020" strokeWidth="1.8">
      <circle cx="-78" cy="-90" r="3.4" />
      <circle cx="-44" cy="-116" r="3.4" />
      <circle cx="44" cy="-116" r="3.4" />
      <circle cx="78" cy="-90" r="3.4" />
    </g>

    {/* torso — the show's chartreuse lab suit */}
    <path
      d="M-34 -4 q-4 -44 12 -56 q22 -9 44 0 q16 12 12 56 q-34 10 -68 0Z"
      fill="#a3c93a"
      stroke="#0b1020"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M-12 -60 L0 -30 L12 -60" fill="none" stroke="#6f8f22" strokeWidth="3.4" />
    <rect x="-9" y="-40" width="18" height="14" rx="3" fill="#6f8f22" />
    {/* arms */}
    <path d="M-34 -46 q-18 12 -16 34" stroke="#a3c93a" strokeWidth="13" fill="none" strokeLinecap="round" />
    <path d="M34 -46 q18 12 16 34" stroke="#a3c93a" strokeWidth="13" fill="none" strokeLinecap="round" />
    <circle cx="-50" cy="-10" r="8.5" fill="#e7f0c8" stroke="#0b1020" strokeWidth="2.5" />
    <circle cx="50" cy="-10" r="8.5" fill="#e7f0c8" stroke="#0b1020" strokeWidth="2.5" />

    {/* head */}
    <ellipse cx="0" cy="-78" rx="25" ry="26" fill="#f6d3ae" stroke="#0b1020" strokeWidth="2.8" />
    {/* bob haircut */}
    <path
      d="M-27 -80 q0 -32 27 -32 q27 0 27 32 q-6 -14 -12 -16 q-15 6 -30 0 q-6 2 -12 16Z"
      fill="#3e2a1c"
      stroke="#0b1020"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path d="M-27 -80 q-3 14 2 22 q-8 -8 -6 -22Z" fill="#3e2a1c" />
    <path d="M27 -80 q3 14 -2 22 q8 -8 6 -22Z" fill="#3e2a1c" />
    {/* goggles */}
    <g>
      <circle cx="-11" cy="-79" r="10" fill="#cfeeff" stroke="#0b1020" strokeWidth="3" opacity="0.95" />
      <circle cx="11" cy="-79" r="10" fill="#cfeeff" stroke="#0b1020" strokeWidth="3" opacity="0.95" />
      <path d="M-1 -79 L1 -79" stroke="#0b1020" strokeWidth="3.4" />
      <circle cx="-11" cy="-79" r="3.6" fill="#131a2e" />
      <circle cx="11" cy="-79" r="3.6" fill="#131a2e" />
      <ellipse cx="-14" cy="-83" rx="3" ry="2" fill="#ffffff" opacity="0.85" />
      <ellipse cx="8" cy="-83" rx="3" ry="2" fill="#ffffff" opacity="0.85" />
    </g>
    <path
      d={angry ? 'M-8 -62 q8 -6 16 0' : 'M-8 -64 q8 8 16 0'}
      stroke="#0b1020"
      strokeWidth="2.8"
      fill="none"
      strokeLinecap="round"
    />
  </g>
);

const Goblin = ({ angry }) => (
  <g>
    {/* glider */}
    <g>
      <path
        d="M-72 6 q-14 -14 4 -18 q30 -6 68 0 q22 4 8 18 q-40 10 -80 0Z"
        fill="#ff7a1a"
        stroke="#0b1020"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M-72 6 q36 8 80 0 l-10 8 q-30 4 -60 0Z" fill="#c14e08" />
      <path d="M-40 -12 L-52 -30 M40 -12 L52 -30" stroke="#0b1020" strokeWidth="3" strokeLinecap="round" />
      <path d="M-58 -30 q6 -10 14 0Z" fill="#ff7a1a" stroke="#0b1020" strokeWidth="2.4" />
      <path d="M44 -30 q6 -10 14 0Z" fill="#ff7a1a" stroke="#0b1020" strokeWidth="2.4" />
    </g>

    {/* legs + tunic */}
    <path d="M-22 -10 q22 8 44 0 l-6 12 q-16 5 -32 0Z" fill="#5b2d8e" stroke="#0b1020" strokeWidth="2.6" />
    <path
      d="M-26 -16 q-4 -40 12 -50 q18 -8 34 0 q16 10 12 50 q-30 10 -58 0Z"
      fill="#5b2d8e"
      stroke="#0b1020"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M-26 -18 q29 12 58 0 l-4 10 q-25 9 -50 0Z" fill="#7e46bd" />
    {/* arms */}
    <path d="M-26 -50 q-20 10 -20 30" stroke="#6bbf3a" strokeWidth="12" fill="none" strokeLinecap="round" />
    <path d="M26 -50 q22 6 26 24" stroke="#6bbf3a" strokeWidth="12" fill="none" strokeLinecap="round" />
    {/* pumpkin bomb */}
    <g transform="translate(56,-22)">
      <circle r="13" fill="#ff9d1e" stroke="#0b1020" strokeWidth="2.6" />
      <path d="M-13 0 q6 -12 13 0 q-6 12 -13 0Z" fill="#e07a00" opacity="0.6" />
      <path d="M0 -13 l0 -6" stroke="#3f7c1e" strokeWidth="4" strokeLinecap="round" />
      <path d="M-7 3 q3 -5 6 0 M2 3 q3 -5 6 0" stroke="#0b1020" strokeWidth="2" fill="none" />
    </g>
    <circle cx="-46" cy="-20" r="8.5" fill="#6bbf3a" stroke="#0b1020" strokeWidth="2.5" />

    {/* head */}
    <ellipse cx="0" cy="-76" rx="24" ry="25" fill="#6bbf3a" stroke="#0b1020" strokeWidth="2.8" />
    {/* pointed ears */}
    <path d="M-23 -84 q-14 -8 -10 -20 q12 4 14 18Z" fill="#6bbf3a" stroke="#0b1020" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M23 -84 q14 -8 10 -20 q-12 4 -14 18Z" fill="#6bbf3a" stroke="#0b1020" strokeWidth="2.5" strokeLinejoin="round" />
    {/* purple hood */}
    <path
      d="M-25 -84 q2 -30 25 -30 q23 0 25 30 q-8 -14 -25 -14 q-17 0 -25 14Z"
      fill="#5b2d8e"
      stroke="#0b1020"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path d="M-14 -112 q14 -12 28 0 q-14 -4 -28 0Z" fill="#7e46bd" />
    {/* eyes */}
    <ellipse cx="-10" cy="-80" rx="7.5" ry="6.5" fill="#fff3c4" stroke="#0b1020" strokeWidth="2.4" />
    <ellipse cx="10" cy="-80" rx="7.5" ry="6.5" fill="#fff3c4" stroke="#0b1020" strokeWidth="2.4" />
    <circle cx="-9" cy="-79" r="3.2" fill="#131a2e" />
    <circle cx="11" cy="-79" r="3.2" fill="#131a2e" />
    <g stroke="#0b1020" strokeWidth="3" strokeLinecap="round">
      <path d="M-19 -90 L-4 -85" />
      <path d="M19 -90 L4 -85" />
    </g>
    {/* toothy grin */}
    <path
      d={angry ? 'M-12 -64 q12 -8 24 0 q-12 4 -24 0Z' : 'M-12 -66 q12 12 24 0 q-12 8 -24 0Z'}
      fill="#2b1a0e"
      stroke="#0b1020"
      strokeWidth="2"
    />
    <path d="M-7 -65 l2 5 l3 -5 M4 -65 l2 5 l3 -5" fill="#fffdf2" />
  </g>
);

const Zola = ({ angry }) => (
  <g>
    {/* robot legs */}
    <rect x="-26" y="-18" width="14" height="20" rx="4" fill="#4b5568" stroke="#0b1020" strokeWidth="2.6" />
    <rect x="12" y="-18" width="14" height="20" rx="4" fill="#4b5568" stroke="#0b1020" strokeWidth="2.6" />
    {/* boxy chassis */}
    <rect x="-44" y="-92" width="88" height="76" rx="10" fill="#8e97ab" stroke="#0b1020" strokeWidth="3.2" />
    <rect x="-44" y="-92" width="88" height="16" rx="8" fill="#aab3c6" />
    {/* rivets */}
    <g fill="#5b6480">
      <circle cx="-36" cy="-24" r="3" />
      <circle cx="36" cy="-24" r="3" />
      <circle cx="-36" cy="-84" r="3" />
      <circle cx="36" cy="-84" r="3" />
    </g>
    {/* the chest screen with Zola's face */}
    <rect x="-30" y="-80" width="60" height="52" rx="7" fill="#1b2340" stroke="#0b1020" strokeWidth="3" />
    <rect x="-26" y="-76" width="52" height="44" rx="5" fill="#33d6ff" opacity="0.22" />
    <g>
      <ellipse cx="-11" cy="-62" rx="7" ry="8" fill="#c9f6ff" stroke="#0b1020" strokeWidth="2" />
      <ellipse cx="11" cy="-62" rx="7" ry="8" fill="#c9f6ff" stroke="#0b1020" strokeWidth="2" />
      <circle cx="-11" cy="-61" r="3.4" fill="#0b1020" />
      <circle cx="11" cy="-61" r="3.4" fill="#0b1020" />
      <path
        d={angry ? 'M-13 -42 q13 -9 26 0' : 'M-13 -45 q13 9 26 0'}
        stroke="#c9f6ff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {angry && (
        <g stroke="#c9f6ff" strokeWidth="3" strokeLinecap="round">
          <path d="M-20 -74 L-5 -69" />
          <path d="M20 -74 L5 -69" />
        </g>
      )}
    </g>
    {/* scanline shimmer */}
    <rect x="-26" y="-58" width="52" height="3" fill="#8ef0ff" opacity="0.25" />
    {/* claw arms */}
    <path d="M-44 -72 q-24 4 -28 26" stroke="#7c8798" strokeWidth="9" fill="none" strokeLinecap="round" />
    <path d="M44 -72 q24 4 28 26" stroke="#7c8798" strokeWidth="9" fill="none" strokeLinecap="round" />
    <g fill="#b9c2d0" stroke="#0b1020" strokeWidth="2.4">
      <path d="M-80 -46 q10 -6 16 2 q-8 10 -16 -2Z" />
      <path d="M80 -46 q-10 -6 -16 2 q8 10 16 -2Z" />
    </g>
    {/* antenna */}
    <path d="M0 -92 L0 -108" stroke="#7c8798" strokeWidth="4" strokeLinecap="round" />
    <circle cx="0" cy="-112" r="6" fill="#ff4d5f" stroke="#0b1020" strokeWidth="2.4" />
  </g>
);

const RENDERERS = { rhino: Rhino, ock: DocOck, goblin: Goblin, zola: Zola };

const Villain = ({ id, angry = true }) => {
  const Cmp = RENDERERS[id] ?? Rhino;
  return <Cmp angry={angry} />;
};

export default Villain;
