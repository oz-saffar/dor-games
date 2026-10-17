/**
 * Every @keyframes used by the דינו־stomp scene, injected once by the game root.
 * Kept in one place so the art components stay pure markup.
 */
export const STOMP_KEYFRAMES = `
/* ── kids ─────────────────────────────────────────────────────────────── */
@keyframes dsKidBob {
  0%,100% { transform: translateY(0) rotate(-1.5deg); }
  50%     { transform: translateY(-3.5px) rotate(1.5deg); }
}
@keyframes dsKidLeg {
  0%   { transform: rotate(30deg); }
  50%  { transform: rotate(-28deg); }
  100% { transform: rotate(30deg); }
}
@keyframes dsKidShin {
  0%   { transform: rotate(-6deg); }
  35%  { transform: rotate(34deg); }
  70%  { transform: rotate(2deg); }
  100% { transform: rotate(-6deg); }
}
@keyframes dsKidArm {
  0%   { transform: rotate(-38deg); }
  50%  { transform: rotate(34deg); }
  100% { transform: rotate(-38deg); }
}
@keyframes dsKidHair {
  0%,100% { transform: rotate(-4deg); }
  50%     { transform: rotate(4deg); }
}
@keyframes dsKidBlink {
  0%,92%,100% { transform: scaleY(1); }
  95%         { transform: scaleY(0.08); }
}
@keyframes dsKidDust {
  0%   { transform: translate(0,0) scale(0.35); opacity: 0.75; }
  100% { transform: translate(-26px,-14px) scale(1.5); opacity: 0; }
}
@keyframes dsKidSquish {
  0%   { transform: scale(1,1); }
  22%  { transform: scale(1.62,0.16); }
  55%  { transform: scale(1.42,0.26); }
  100% { transform: scale(1.34,0.3); }
}
@keyframes dsKidBounce {
  0%   { transform: scale(1.34,0.3) translateY(0) rotate(0deg); opacity: 1; }
  22%  { transform: scale(0.82,1.28) translateY(-105px) rotate(150deg); opacity: 1; }
  60%  { transform: scale(1,1) translateY(-180px) rotate(400deg); opacity: 1; }
  100% { transform: scale(0.62,0.62) translateY(-320px) rotate(700deg); opacity: 0; }
}
@keyframes dsKidStar {
  0%   { transform: rotate(0deg) translateX(0) scale(0.2); opacity: 0; }
  25%  { opacity: 1; }
  100% { transform: rotate(var(--spin)) translateX(46px) scale(1.1); opacity: 0; }
}

/* ── the giant leg ────────────────────────────────────────────────────── */
@keyframes dsFootSway {
  0%,100% { transform: translateX(-16px) rotate(-1.2deg); }
  50%     { transform: translateX(16px) rotate(1.2deg); }
}
@keyframes dsFootToe {
  0%   { transform: rotate(-5deg); }
  100% { transform: rotate(7deg); }
}
@keyframes dsFootWobble {
  0%,100% { transform: rotate(-2.2deg) translateX(-3px); }
  50%     { transform: rotate(2.2deg) translateX(3px); }
}
@keyframes dsFootSquash {
  0%   { transform: scale(1,1); }
  35%  { transform: scale(1.1,0.9); }
  100% { transform: scale(1,1); }
}
@keyframes dsStrain {
  0%,100% { opacity: 0.15; transform: scale(0.9); }
  50%     { opacity: 0.9; transform: scale(1.12); }
}
@keyframes dsSweat {
  0%   { transform: translate(0,0) scale(0.4); opacity: 0; }
  30%  { opacity: 1; }
  100% { transform: translate(var(--sx),-26px) scale(1); opacity: 0; }
}
@keyframes dsBreathe {
  0%,100% { transform: scale(1,1); }
  50%     { transform: scale(1.02,0.985); }
}
@keyframes dsTail {
  0%,100% { transform: rotate(-6deg); }
  50%     { transform: rotate(6deg); }
}

/* ── telegraph marker ─────────────────────────────────────────────────── */
@keyframes dsTeleGrow {
  0%   { transform: scale(0.2); opacity: 0; }
  25%  { opacity: 1; }
  100% { transform: scale(1); opacity: 0.95; }
}
@keyframes dsTeleRing {
  0%   { transform: rotate(0deg) scale(0.55); opacity: 0.2; }
  100% { transform: rotate(220deg) scale(1.12); opacity: 0.95; }
}

/* ── impact juice ─────────────────────────────────────────────────────── */
@keyframes dsFxFade {
  0%,55% { opacity: 1; }
  100%   { opacity: 0; }
}
@keyframes dsFxFlash {
  0%   { transform: scale(0.3); opacity: 0.95; }
  100% { transform: scale(1.5); opacity: 0; }
}
@keyframes dsFxRing {
  0%   { transform: scale(0.15); opacity: 0.9; }
  100% { transform: scale(1); opacity: 0; }
}
@keyframes dsFxCrack {
  0%   { stroke-dashoffset: 150; opacity: 0; }
  12%  { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 1; }
}
@keyframes dsFxRock {
  0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
  55%  { transform: translate(calc(var(--dx) * 0.62), var(--dy)) rotate(calc(var(--rot) * 0.6)) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), 14px) rotate(var(--rot)) scale(0.6); opacity: 0; }
}
@keyframes dsFxPuff {
  0%   { transform: translate(0,0) scale(0.25); opacity: 0.85; }
  100% { transform: translate(var(--dx), var(--dy)) scale(1.7); opacity: 0; }
}

/* ── UI pops ──────────────────────────────────────────────────────────── */
@keyframes dsPopup {
  0%   { transform: translate(-50%,0) scale(0.3) rotate(-9deg); opacity: 0; }
  22%  { transform: translate(-50%,-16px) scale(1.22) rotate(4deg); opacity: 1; }
  55%  { transform: translate(-50%,-30px) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate(-50%,-64px) scale(0.94); opacity: 0; }
}
@keyframes dsComboPop {
  0%   { transform: translateX(-50%) scale(0.35); opacity: 0; }
  30%  { transform: translateX(-50%) scale(1.18); opacity: 1; }
  70%  { transform: translateX(-50%) scale(1); opacity: 1; }
  100% { transform: translateX(-50%) scale(1.05); opacity: 0; }
}
@keyframes dsComboGlow {
  0%,100% { box-shadow: 0 0 0 rgba(251,191,36,0); }
  50%     { box-shadow: 0 0 18px rgba(251,191,36,0.85); }
}

/* ── backdrop life ────────────────────────────────────────────────────── */
@keyframes dsCloud {
  0%   { transform: translateX(-14vw); }
  100% { transform: translateX(114vw); }
}
@keyframes dsMote {
  0%   { transform: translate(0,0) scale(0.7); opacity: 0; }
  25%  { opacity: 0.7; }
  100% { transform: translate(var(--dx),-70px) scale(1.2); opacity: 0; }
}
@keyframes dsSmoke {
  0%   { transform: translate(0,0) scale(0.5); opacity: 0.55; }
  100% { transform: translate(-24px,-90px) scale(1.8); opacity: 0; }
}
@keyframes dsFern {
  0%,100% { transform: rotate(-3deg); }
  50%     { transform: rotate(3deg); }
}
@keyframes dsSunGlow {
  0%,100% { opacity: 0.55; transform: scale(1); }
  50%     { opacity: 0.85; transform: scale(1.06); }
}
@keyframes dsPtero {
  0%   { transform: translateX(0) translateY(0); }
  50%  { transform: translateX(30vw) translateY(-14px); }
  100% { transform: translateX(62vw) translateY(6px); }
}
@keyframes dsWingFlap {
  0%,100% { transform: scaleY(1); }
  50%     { transform: scaleY(0.45); }
}
`;
