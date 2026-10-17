import { memo } from 'react';

/**
 * The goofy sneaking T-Rex.
 *
 * Poses (driven by the `data-pose` attribute + the CSS block at the bottom):
 *   sneak  — exaggerated tiptoe: high knees, arms up, bouncing body, sweat drops
 *   freeze — statue pose behind a *far too small* bush, whistling, eyes darting
 *   chomp  — lunge, mouth wide open, delighted squint
 *   busted — caught red-handed: blush, wobbly mouth, sheepish shrug
 *
 * Everything is inline SVG; no assets, no external deps.
 */

const VB_W = 224;
const VB_H = 196;

function SneakyDinoBase({ pose = 'freeze', reduced = false, size = 1 }) {
  return (
    <div
      className="dsd"
      data-pose={pose}
      data-reduced={reduced ? '1' : '0'}
      aria-hidden
      style={{ position: 'relative', width: VB_W * size, height: VB_H * size }}
    >
      {/* contact shadow */}
      <div
        className="dsd-shadow"
        style={{
          position: 'absolute',
          left: '16%',
          right: '14%',
          bottom: -6 * size,
          height: 20 * size,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(4,32,14,0.55) 0%, rgba(4,32,14,0.22) 48%, transparent 74%)',
          filter: 'blur(2px)',
        }}
      />

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width={VB_W * size}
        height={VB_H * size}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="dsdBody" x1="0.2" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#a7f3a0" />
            <stop offset="34%" stopColor="#5ee07f" />
            <stop offset="72%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="dsdBodyDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22a34f" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="dsdBelly" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="60%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="dsdSpike" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="45%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="dsdSnout" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <radialGradient id="dsdCheek" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="dsdGloss" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dsdTooth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>

        {/* ───────────────── tail (behind everything) ───────────────── */}
        <g className="dsd-tail">
          <path
            d="M78,120 Q40,132 20,112 Q4,96 12,72 Q18,54 34,52 Q22,64 24,82 Q28,102 52,104 Q70,104 82,98 Z"
            fill="url(#dsdBodyDark)"
          />
          <path d="M28,58 Q20,74 26,90 Q34,102 52,104 Q34,98 30,84 Q27,70 34,56 Z" fill="#0f4a25" opacity="0.5" />
          {/* tail scutes */}
          <path d="M34,52 L28,40 L42,48 Z" fill="url(#dsdSpike)" />
          <path d="M20,72 L8,66 L20,60 Z" fill="url(#dsdSpike)" />
          <path d="M20,98 L8,102 L18,86 Z" fill="url(#dsdSpike)" />
          <path d="M40,116 L34,128 L52,116 Z" fill="url(#dsdSpike)" />
          <path d="M62,122 L60,134 L76,120 Z" fill="url(#dsdSpike)" />
        </g>

        {/* ───────────────── far leg ───────────────── */}
        <g className="dsd-leg-far">
          <path d="M84,124 Q68,142 74,160 Q78,174 90,176 Q98,176 100,168 Q92,164 92,154 Q94,140 104,130 Z" fill="#12622f" />
          <ellipse cx="86" cy="177" rx="19" ry="8" fill="#0f4a25" />
          <path d="M70,180 L74,172 M80,181 L82,172 M90,180 L91,172" stroke="#0b3a1d" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* far arm */}
        <g className="dsd-arm-far">
          <path d="M122,106 Q112,94 116,84 Q120,78 126,82 Q122,92 130,100 Z" fill="#12622f" />
          <circle cx="120" cy="80" r="5" fill="#12622f" />
        </g>

        {/* ───────────────── body ───────────────── */}
        <g className="dsd-torso">
          <ellipse cx="108" cy="112" rx="50" ry="42" fill="url(#dsdBody)" />
          {/* rump shading */}
          <ellipse cx="86" cy="126" rx="34" ry="28" fill="#15803d" opacity="0.24" />
          {/* body gloss */}
          <ellipse cx="96" cy="88" rx="28" ry="16" fill="url(#dsdGloss)" transform="rotate(-16 96 88)" />

          {/* belly plate */}
          <path
            d="M96,84 Q136,82 146,110 Q152,136 128,150 Q106,160 92,148 Q84,138 86,118 Q88,94 96,84 Z"
            fill="url(#dsdBelly)"
          />
          <g stroke="#f0b429" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" fill="none">
            <path d="M94,98 Q118,94 138,104" />
            <path d="M90,112 Q116,108 146,116" />
            <path d="M89,126 Q116,124 144,128" />
            <path d="M92,138 Q116,138 136,140" />
            <path d="M99,149 Q116,151 128,148" />
          </g>

          {/* back scutes along the spine */}
          <g fill="url(#dsdSpike)">
            <path d="M78,86 L70,72 L92,80 Z" />
            <path d="M96,76 L92,60 L112,72 Z" />
            <path d="M116,72 L116,55 L132,70 Z" />
            <path d="M134,74 L138,58 L150,76 Z" />
            <path d="M150,84 L158,72 L160,90 Z" />
          </g>
          <g fill="#fdba74" opacity="0.65">
            <path d="M79,85 L74,75 L86,80 Z" />
            <path d="M97,75 L94,64 L106,72 Z" />
            <path d="M117,71 L117,59 L127,70 Z" />
          </g>
        </g>

        {/* ───────────────── near leg (front) ───────────────── */}
        <g className="dsd-leg-near">
          <path
            d="M112,126 Q98,148 104,164 Q110,178 124,178 Q134,178 136,170 Q124,166 122,156 Q122,142 134,132 Z"
            fill="url(#dsdBodyDark)"
          />
          <ellipse cx="122" cy="179" rx="22" ry="9" fill="#166534" />
          <ellipse cx="120" cy="176" rx="18" ry="6" fill="#1c8a44" opacity="0.6" />
          {/* toes + claws */}
          <path d="M104,182 L108,173 M115,183 L116,173 M127,182 L126,173" stroke="#0f4a25" strokeWidth="3.4" strokeLinecap="round" />
          <g fill="#fffbeb">
            <path d="M101,180 L96,176 L102,175 Z" />
            <path d="M112,182 L108,177 L114,177 Z" />
            <path d="M124,181 L121,176 L127,177 Z" />
          </g>
        </g>

        {/* ───────────────── near arm (raised, tiptoe) ───────────────── */}
        <g className="dsd-arm-near">
          <path d="M138,102 Q132,86 138,74 Q143,66 150,71 Q144,82 148,96 Z" fill="url(#dsdBody)" />
          <circle cx="146" cy="70" r="7" fill="#4ade80" />
          <g fill="#fffbeb">
            <path d="M150,64 L156,60 L152,68 Z" />
            <path d="M143,63 L146,56 L148,65 Z" />
          </g>
        </g>

        {/* ───────────────── head ───────────────── */}
        <g className="dsd-head">
          {/* neck */}
          <path d="M136,90 Q142,66 164,56 L186,74 Q166,84 156,100 Z" fill="url(#dsdBody)" />
          <path d="M140,86 Q148,70 166,62" stroke="#15803d" strokeWidth="2" opacity="0.35" fill="none" />

          {/* skull */}
          <ellipse cx="176" cy="52" rx="33" ry="27" fill="url(#dsdBody)" />
          {/* snout */}
          <path
            d="M182,40 Q214,36 220,50 Q224,62 210,68 Q192,72 176,66 Q170,52 182,40 Z"
            fill="url(#dsdSnout)"
          />
          {/* jaw */}
          <path d="M172,64 Q192,74 212,66 Q210,80 190,82 Q174,80 170,70 Z" fill="#16a34a" />
          <path d="M174,68 Q192,76 208,70 Q204,78 190,79 Q178,78 174,68 Z" fill="#b91c1c" opacity="0.35" />

          {/* teeth */}
          <g fill="url(#dsdTooth)" className="dsd-teeth">
            <path d="M184,66 L188,74 L192,66 Z" />
            <path d="M194,67 L197,74 L201,66 Z" />
            <path d="M204,65 L206,72 L210,64 Z" />
            <path d="M178,64 L180,71 L184,64 Z" />
          </g>

          {/* nostril */}
          <ellipse cx="210" cy="46" rx="3.6" ry="2.8" fill="#14532d" opacity="0.75" transform="rotate(-16 210 46)" />
          <ellipse cx="201" cy="43" rx="3" ry="2.3" fill="#14532d" opacity="0.5" transform="rotate(-16 201 43)" />

          {/* head gloss */}
          <ellipse cx="170" cy="36" rx="20" ry="10" fill="url(#dsdGloss)" transform="rotate(-14 170 36)" />

          {/* brow ridge */}
          <path d="M152,34 Q166,20 186,26 Q172,26 160,38 Z" fill="#16a34a" />

          {/* horn nubs */}
          <path d="M158,28 L154,16 L168,24 Z" fill="url(#dsdSpike)" />
          <path d="M176,24 L176,12 L188,24 Z" fill="url(#dsdSpike)" />

          {/* cheek blush (busted / chomp) */}
          <ellipse className="dsd-blush" cx="162" cy="58" rx="13" ry="9" fill="url(#dsdCheek)" />

          {/* ── eye ── */}
          <g className="dsd-eye">
            <ellipse cx="172" cy="40" rx="14" ry="13" fill="#ffffff" />
            <ellipse cx="172" cy="40" rx="14" ry="13" fill="none" stroke="#14532d" strokeWidth="1.6" opacity="0.35" />
            <g className="dsd-pupil">
              <circle cx="174" cy="41" r="6.6" fill="#0f172a" />
              <circle cx="176.4" cy="38.4" r="2.4" fill="#ffffff" />
              <circle cx="171" cy="44" r="1.2" fill="#ffffff" opacity="0.8" />
            </g>
            {/* squint lids for chomp */}
            <path className="dsd-squint" d="M159,40 Q172,30 185,40 Q172,48 159,40 Z" fill="#16a34a" />
            {/* blinking lid */}
            <g className="dsd-lid">
              <path d="M158,40 A14,13 0 0 1 186,40 L186,26 L158,26 Z" fill="#22c55e" />
            </g>
            {/* lashes */}
            <path d="M160,30 L156,25 M168,26 L166,20 M178,26 L181,20" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* far eye peeking */}
          <ellipse cx="152" cy="46" rx="8" ry="7.5" fill="#ffffff" opacity="0.92" />
          <circle cx="151" cy="47" r="3.6" fill="#0f172a" opacity="0.9" />
          <circle cx="152.6" cy="45.4" r="1.3" fill="#ffffff" />

          {/* eyebrow */}
          <path className="dsd-brow" d="M160,22 Q172,14 186,20" stroke="#14532d" strokeWidth="3.4" strokeLinecap="round" fill="none" />

          {/* ── mouths (one shown per pose) ── */}
          <g className="dsd-mouth dsd-mouth-grin">
            <path d="M180,70 Q192,80 206,72" stroke="#0b3a1d" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <path d="M186,74 Q192,84 199,75 Q193,79 186,74 Z" fill="#f87171" />
          </g>
          <g className="dsd-mouth dsd-mouth-whistle">
            <ellipse cx="200" cy="70" rx="6" ry="7" fill="#0b3a1d" />
            <ellipse cx="200" cy="69" rx="3.4" ry="4" fill="#f87171" />
            {/* whistle notes */}
            <g className="dsd-notes" fill="#fef9c3">
              <path d="M214,58 L214,48 L221,46 L221,56 Z" opacity="0.9" />
              <circle cx="212" cy="58" r="3" />
              <circle cx="219" cy="56" r="3" />
            </g>
          </g>
          <g className="dsd-mouth dsd-mouth-chomp">
            <path d="M176,60 Q200,58 220,52 Q222,84 194,90 Q174,86 176,60 Z" fill="#7f1d1d" />
            <path d="M186,78 Q198,72 212,74 Q206,88 194,88 Q186,86 186,78 Z" fill="#fb7185" />
            <g fill="#ffffff">
              <path d="M180,62 L184,72 L189,61 Z" />
              <path d="M192,60 L196,71 L201,59 Z" />
              <path d="M204,57 L208,68 L213,55 Z" />
              <path d="M184,88 L188,80 L192,88 Z" />
              <path d="M196,89 L200,81 L204,88 Z" />
            </g>
          </g>
          <g className="dsd-mouth dsd-mouth-oops">
            <path d="M180,72 Q186,66 192,72 Q198,78 204,72" stroke="#0b3a1d" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        </g>
      </svg>

      {/* ── sweat droplets (sneak + busted) ─────────────────────────── */}
      <div className="dsd-sweat" style={{ position: 'absolute', inset: 0 }}>
        <span className="dsd-drop dsd-drop-1" />
        <span className="dsd-drop dsd-drop-2" />
        <span className="dsd-drop dsd-drop-3" />
      </div>

      {/* ── the hopelessly small "hiding" bush (freeze pose gag) ────── */}
      <svg
        className="dsd-bush"
        viewBox="0 0 90 70"
        width={90 * size}
        height={70 * size}
        style={{ position: 'absolute', left: 62 * size, bottom: -4 * size }}
      >
        <defs>
          <linearGradient id="dsdBushG" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="55%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#065f2e" />
          </linearGradient>
        </defs>
        <ellipse cx="45" cy="68" rx="34" ry="6" fill="rgba(4,32,14,0.4)" />
        <circle cx="26" cy="48" r="17" fill="url(#dsdBushG)" />
        <circle cx="46" cy="40" r="21" fill="url(#dsdBushG)" />
        <circle cx="66" cy="49" r="16" fill="url(#dsdBushG)" />
        <circle cx="38" cy="56" r="15" fill="#15803d" />
        <circle cx="56" cy="57" r="14" fill="#15803d" />
        <g fill="#86efac" opacity="0.6">
          <ellipse cx="38" cy="32" rx="8" ry="5" transform="rotate(-24 38 32)" />
          <ellipse cx="60" cy="41" rx="6" ry="4" transform="rotate(16 60 41)" />
        </g>
        <g fill="#fb7185">
          <circle cx="30" cy="42" r="3.2" />
          <circle cx="58" cy="34" r="2.8" />
          <circle cx="68" cy="52" r="2.6" />
        </g>
      </svg>

      <style>{`
        .dsd svg g { transform-box: fill-box; }

        /* ── default (freeze) look ─────────────────────────────── */
        .dsd .dsd-mouth { display: none; }
        .dsd .dsd-squint { display: none; }
        .dsd .dsd-blush { opacity: 0; transition: opacity .18s ease; }
        .dsd .dsd-sweat { opacity: 0; }
        .dsd .dsd-bush { opacity: 0; transform: translateY(16px) scale(0.6); transition: opacity .16s ease, transform .22s cubic-bezier(.34,1.56,.64,1); }

        .dsd .dsd-tail     { transform-origin: 95% 40%; }
        .dsd .dsd-leg-far  { transform-origin: 60% 8%; }
        .dsd .dsd-leg-near { transform-origin: 62% 6%; }
        .dsd .dsd-arm-far  { transform-origin: 50% 92%; }
        .dsd .dsd-arm-near { transform-origin: 50% 94%; }
        .dsd .dsd-head     { transform-origin: 22% 78%; }
        .dsd .dsd-torso    { transform-origin: 50% 90%; }
        .dsd .dsd-lid      { transform-origin: 50% 0%; transform: scaleY(0); }

        /* ── FREEZE ────────────────────────────────────────────── */
        .dsd[data-pose="freeze"] .dsd-mouth-whistle { display: block; }
        .dsd[data-pose="freeze"] .dsd-bush { opacity: 1; transform: translateY(0) scale(1); }
        .dsd[data-pose="freeze"] .dsd-pupil { transform: translate(6px, 2px); transition: transform .2s ease; }
        .dsd[data-pose="freeze"] .dsd-torso { animation: dsdHoldStill 1.7s ease-in-out infinite; }
        .dsd[data-pose="freeze"] .dsd-arm-near { transform: rotate(-26deg); }
        .dsd[data-pose="freeze"] .dsd-arm-far  { transform: rotate(18deg); }
        .dsd[data-pose="freeze"] .dsd-notes { animation: dsdNotes 1.9s ease-in-out infinite; }
        .dsd[data-pose="freeze"] .dsd-lid { animation: dsdBlink 5.3s ease-in-out infinite; }

        /* ── SNEAK ─────────────────────────────────────────────── */
        .dsd[data-pose="sneak"] .dsd-mouth-grin { display: block; }
        .dsd[data-pose="sneak"] .dsd-sweat { opacity: 1; }
        .dsd[data-pose="sneak"] .dsd-pupil { transform: translate(3px, -1px); }
        .dsd[data-pose="sneak"] .dsd-torso    { animation: dsdBob   .44s ease-in-out infinite; }
        .dsd[data-pose="sneak"] .dsd-head     { animation: dsdNod   .44s ease-in-out infinite; }
        .dsd[data-pose="sneak"] .dsd-leg-near { animation: dsdStepA .44s ease-in-out infinite; }
        .dsd[data-pose="sneak"] .dsd-leg-far  { animation: dsdStepB .44s ease-in-out infinite; }
        .dsd[data-pose="sneak"] .dsd-arm-near { animation: dsdArmA  .44s ease-in-out infinite; }
        .dsd[data-pose="sneak"] .dsd-arm-far  { animation: dsdArmB  .44s ease-in-out infinite; }
        .dsd[data-pose="sneak"] .dsd-tail     { animation: dsdTail  .88s ease-in-out infinite; }
        .dsd[data-pose="sneak"] .dsd-shadow   { animation: dsdShadow .44s ease-in-out infinite; }
        .dsd[data-pose="sneak"] .dsd-lid      { animation: dsdBlink 4.1s ease-in-out infinite; }

        /* ── CHOMP ─────────────────────────────────────────────── */
        .dsd[data-pose="chomp"] .dsd-mouth-chomp { display: block; }
        .dsd[data-pose="chomp"] .dsd-squint { display: block; }
        .dsd[data-pose="chomp"] .dsd-blush { opacity: 1; }
        .dsd[data-pose="chomp"] .dsd-torso { animation: dsdLunge .5s cubic-bezier(.3,1.5,.5,1) both; }
        .dsd[data-pose="chomp"] .dsd-head  { animation: dsdLungeHead .5s cubic-bezier(.3,1.5,.5,1) both; }
        .dsd[data-pose="chomp"] .dsd-tail  { animation: dsdTailWag .26s ease-in-out infinite; }
        .dsd[data-pose="chomp"] .dsd-arm-near { transform: rotate(-46deg); }
        .dsd[data-pose="chomp"] .dsd-arm-far  { transform: rotate(-30deg); }

        /* ── BUSTED ────────────────────────────────────────────── */
        .dsd[data-pose="busted"] .dsd-mouth-oops { display: block; }
        .dsd[data-pose="busted"] .dsd-blush { opacity: 1; }
        .dsd[data-pose="busted"] .dsd-sweat { opacity: 1; }
        .dsd[data-pose="busted"] .dsd-pupil { transform: translate(-5px, 3px); }
        .dsd[data-pose="busted"] .dsd-brow  { transform: translateY(4px); }
        .dsd[data-pose="busted"] .dsd-torso { animation: dsdShrink .5s ease-out both; }
        .dsd[data-pose="busted"] .dsd-arm-near { transform: rotate(34deg) translateY(6px); }
        .dsd[data-pose="busted"] .dsd-arm-far  { transform: rotate(-24deg); }
        .dsd[data-pose="busted"] .dsd-tail  { animation: dsdTailDroop .5s ease-out both; }

        /* ── sweat droplets ────────────────────────────────────── */
        .dsd .dsd-drop {
          position: absolute;
          width: 9px; height: 12px;
          border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%;
          background: linear-gradient(180deg, #e0f2fe, #38bdf8);
          box-shadow: inset -1px -2px 0 rgba(255,255,255,.7);
          opacity: 0;
        }
        .dsd .dsd-drop-1 { left: 66%; top: 4%;  animation: dsdDrop 1.25s ease-in .0s  infinite; }
        .dsd .dsd-drop-2 { left: 82%; top: 12%; animation: dsdDrop 1.25s ease-in .42s infinite; }
        .dsd .dsd-drop-3 { left: 57%; top: 12%; animation: dsdDrop 1.25s ease-in .84s infinite; }

        /* ── keyframes ─────────────────────────────────────────── */
        @keyframes dsdBob {
          0%,100% { transform: translateY(0)     rotate(-1deg); }
          25%     { transform: translateY(-7px)  rotate(1.6deg); }
          50%     { transform: translateY(-1px)  rotate(-.5deg); }
          75%     { transform: translateY(-7px)  rotate(1.6deg); }
        }
        @keyframes dsdNod {
          0%,100% { transform: translateY(0) rotate(0deg); }
          25%     { transform: translateY(-5px) rotate(-3deg); }
          75%     { transform: translateY(-5px) rotate(3deg); }
        }
        @keyframes dsdStepA {
          0%,100% { transform: rotate(-30deg) translateY(-8px); }
          50%     { transform: rotate(24deg)  translateY(0); }
        }
        @keyframes dsdStepB {
          0%,100% { transform: rotate(26deg)  translateY(0); }
          50%     { transform: rotate(-28deg) translateY(-8px); }
        }
        @keyframes dsdArmA {
          0%,100% { transform: rotate(-38deg); }
          50%     { transform: rotate(-14deg); }
        }
        @keyframes dsdArmB {
          0%,100% { transform: rotate(-12deg); }
          50%     { transform: rotate(-34deg); }
        }
        @keyframes dsdTail {
          0%,100% { transform: rotate(-7deg); }
          50%     { transform: rotate(9deg); }
        }
        @keyframes dsdTailWag {
          0%,100% { transform: rotate(-13deg); }
          50%     { transform: rotate(13deg); }
        }
        @keyframes dsdTailDroop {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-13deg) translateY(8px); }
        }
        @keyframes dsdShadow {
          0%,100% { transform: scaleX(.9); opacity: .75; }
          50%     { transform: scaleX(1);  opacity: 1; }
        }
        @keyframes dsdHoldStill {
          0%,100% { transform: translate(0,0)      rotate(0deg)   scale(1); }
          40%     { transform: translate(1.5px,0)  rotate(.7deg)  scale(1.012); }
          70%     { transform: translate(-1.5px,0) rotate(-.7deg) scale(.99); }
        }
        @keyframes dsdLunge {
          0%   { transform: translateX(0)    scaleX(1)    scaleY(1); }
          32%  { transform: translateX(-12px) scaleX(.88) scaleY(1.14); }
          62%  { transform: translateX(30px)  scaleX(1.16) scaleY(.88); }
          100% { transform: translateX(16px)  scaleX(1)   scaleY(1); }
        }
        @keyframes dsdLungeHead {
          0%   { transform: translateX(0)     rotate(0deg); }
          32%  { transform: translateX(-10px) rotate(-9deg); }
          62%  { transform: translateX(36px)  rotate(11deg); }
          100% { transform: translateX(20px)  rotate(4deg); }
        }
        @keyframes dsdShrink {
          0%   { transform: scale(1)   translateY(0); }
          40%  { transform: scale(.92) translateY(6px); }
          100% { transform: scale(.95) translateY(4px); }
        }
        @keyframes dsdBlink {
          0%,92%,100% { transform: scaleY(0); }
          95%,97%     { transform: scaleY(1); }
        }
        @keyframes dsdNotes {
          0%   { opacity: 0; transform: translate(0,0) rotate(0deg); }
          35%  { opacity: .95; }
          100% { opacity: 0; transform: translate(16px,-22px) rotate(18deg); }
        }
        @keyframes dsdDrop {
          0%   { opacity: 0; transform: translateY(0) scale(.5); }
          22%  { opacity: .95; transform: translateY(4px) scale(1); }
          100% { opacity: 0; transform: translateY(30px) scale(.7); }
        }

        /* ── reduced motion: keep pose readability, drop the loops ─ */
        .dsd[data-reduced="1"] * { animation: none !important; }
      `}</style>
    </div>
  );
}

export default memo(SneakyDinoBase);
