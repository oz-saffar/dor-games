/**
 * Every @keyframes the photo-puzzle scene needs, injected once by the game root
 * so the piece components stay pure markup.
 */
export const PUZZLE_KEYFRAMES = `
/* ── a piece that was dropped in the wrong place ─────────────────────────── */
/* --pp-s / --pp-r carry the piece's resting scale + tilt so an animated
   transform never wipes them out. */
@keyframes ppWobble {
  0%   { transform: scale(calc(var(--pp-s,1) * 1.05)) rotate(var(--pp-r,0deg)); }
  22%  { transform: scale(var(--pp-s,1)) rotate(calc(var(--pp-r,0deg) - 8deg)); }
  46%  { transform: scale(var(--pp-s,1)) rotate(calc(var(--pp-r,0deg) + 7deg)); }
  70%  { transform: scale(var(--pp-s,1)) rotate(calc(var(--pp-r,0deg) - 4deg)); }
  88%  { transform: scale(var(--pp-s,1)) rotate(calc(var(--pp-r,0deg) + 2deg)); }
  100% { transform: scale(var(--pp-s,1)) rotate(var(--pp-r,0deg)); }
}

/* ── a piece locking into its slot ───────────────────────────────────────── */
@keyframes ppLockPop {
  0%   { transform: scale(1.14); }
  38%  { transform: scale(0.955); }
  70%  { transform: scale(1.025); }
  100% { transform: scale(1); }
}
@keyframes ppSweep {
  0%   { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
  18%  { opacity: 0.95; }
  100% { transform: translateX(130%) skewX(-18deg); opacity: 0; }
}
@keyframes ppSparkle {
  0%   { transform: translate(0,0) scale(0.2) rotate(0deg); opacity: 0; }
  22%  { opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(1.05) rotate(var(--rot)); opacity: 0; }
}
@keyframes ppLockRing {
  0%   { transform: scale(0.55); opacity: 0.85; }
  100% { transform: scale(1.45); opacity: 0; }
}

/* ── the slot the child is currently hovering ────────────────────────────── */
@keyframes ppSlotGlow {
  0%,100% { box-shadow: inset 0 0 0 4px var(--pp-accent), 0 0 16px 2px var(--pp-accent-soft); }
  50%     { box-shadow: inset 0 0 0 6px var(--pp-accent), 0 0 30px 8px var(--pp-accent-soft); }
}
@keyframes ppSlotHint {
  0%,100% { opacity: 0.30; }
  50%     { opacity: 0.46; }
}

/* ── idle life in the tray ───────────────────────────────────────────────── */
@keyframes ppTrayFloat {
  0%,100% { transform: translateY(0px) scale(var(--pp-s,1)) rotate(var(--pp-r,0deg)); }
  50%     { transform: translateY(-4px) scale(var(--pp-s,1)) rotate(var(--pp-r,0deg)); }
}

/* ── completion: the seams dissolve and the picture becomes whole ────────── */
@keyframes ppSeamFade {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes ppWholePulse {
  0%   { transform: scale(1); filter: brightness(1); }
  35%  { transform: scale(1.035); filter: brightness(1.22); }
  100% { transform: scale(1); filter: brightness(1); }
}
@keyframes ppShine {
  0%   { transform: translateX(-120%) skewX(-14deg); opacity: 0; }
  25%  { opacity: 0.8; }
  100% { transform: translateX(150%) skewX(-14deg); opacity: 0; }
}

/* ── chrome ──────────────────────────────────────────────────────────────── */
@keyframes ppPeekPulse {
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.06); }
}
@keyframes ppFadeIn {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;
