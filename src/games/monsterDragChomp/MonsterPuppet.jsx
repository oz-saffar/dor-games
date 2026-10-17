/**
 * Small picture-book monster for the tray — the prey side of the reversed mode,
 * sized to the same footprint as `PersonPuppet` so the tray layout is shared.
 */
export default function MonsterPuppet({ variant = 'coral', scale = 1 }) {
  const s = scale;
  const skins = {
    coral: { body: '#fb7185', dark: '#be123c', horn: '#9f1239' },
    teal: { body: '#2dd4bf', dark: '#0f766e', horn: '#115e59' },
    amber: { body: '#fbbf24', dark: '#b45309', horn: '#92400e' },
    violet: { body: '#a78bfa', dark: '#6d28d9', horn: '#5b21b6' },
    sky: { body: '#38bdf8', dark: '#0369a1', horn: '#075985' },
  };
  const { body, dark, horn } = skins[variant] ?? skins.coral;

  return (
    <svg
      width={40 * s}
      height={46 * s}
      viewBox="0 0 40 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none drop-shadow-[0_3px_5px_rgba(0,0,0,0.22)]"
      aria-hidden
    >
      <path d="M11 9L6 1l9 3z" fill={horn} />
      <path d="M29 9l5-8-9 3z" fill={horn} />
      <ellipse cx="12" cy="42" rx="5" ry="3.5" fill={dark} />
      <ellipse cx="28" cy="42" rx="5" ry="3.5" fill={dark} />
      <path
        d="M20 3c9 0 15 7 15 16v7c0 8-6 14-15 14S5 34 5 26v-7C5 10 11 3 20 3z"
        fill={body}
        stroke={dark}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse cx="20" cy="27" rx="9" ry="7" fill="#fff" opacity="0.28" />
      <circle cx="14" cy="17" r="5" fill="#fffdf8" stroke={dark} strokeWidth="1.2" />
      <circle cx="26" cy="17" r="5" fill="#fffdf8" stroke={dark} strokeWidth="1.2" />
      <circle cx="15" cy="18" r="2.4" fill="#1f2937" />
      <circle cx="27" cy="18" r="2.4" fill="#1f2937" />
      <path d="M12 29h16v2.5c-2.5 3.5-13.5 3.5-16 0V29z" fill="#fffdf8" stroke={dark} strokeWidth="1" />
      <path d="M17 29v4M23 29v4" stroke={dark} strokeWidth="0.9" opacity="0.6" />
    </svg>
  );
}
