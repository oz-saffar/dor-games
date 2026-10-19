import { PLAY_COLORS, ACCENTS, INK } from '../../lib/palette';

const Sparkles = () => (
  <g fill={ACCENTS.ochre}>
    <text x="12" y="26" fontSize="16">✨</text>
    <text x="72" y="20" fontSize="14">✨</text>
    <text x="78" y="52" fontSize="12">⭐</text>
  </g>
);

const Eyes = ({ tickled }) => (tickled ? (
  <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none">
    <path d="M30 46 q6 -7 12 0" />
    <path d="M58 46 q6 -7 12 0" />
  </g>
) : (
  <g>
    <ellipse cx="36" cy="45" rx="7" ry="8" fill="#fff" />
    <ellipse cx="64" cy="45" rx="7" ry="8" fill="#fff" />
    <circle cx="37" cy="46" r="4" fill={INK} />
    <circle cx="63" cy="46" r="4" fill={INK} />
    <circle cx="38.5" cy="44" r="1.4" fill="#fff" />
    <circle cx="64.5" cy="44" r="1.4" fill="#fff" />
  </g>
));

/** A friendly mole; `tickled` squints and giggles. */
export const MoleArt = ({ tickled, hat }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
    <ellipse cx="50" cy="62" rx="36" ry="40" fill={PLAY_COLORS.brown} />
    <ellipse cx="50" cy="72" rx="22" ry="22" fill="#C9A47E" />
    <circle cx="22" cy="30" r="8" fill={PLAY_COLORS.brown} />
    <circle cx="78" cy="30" r="8" fill={PLAY_COLORS.brown} />
    <circle cx="22" cy="30" r="4" fill={PLAY_COLORS.pink} opacity="0.7" />
    <circle cx="78" cy="30" r="4" fill={PLAY_COLORS.pink} opacity="0.7" />
    <Eyes tickled={tickled} />
    <ellipse cx="50" cy="58" rx="9" ry="6.5" fill={PLAY_COLORS.pink} />
    <ellipse cx="47" cy="56" rx="2.5" ry="1.5" fill="#fff" opacity="0.6" />
    {tickled ? (
      <path d="M38 68 q12 14 24 0 z" fill={INK} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    ) : (
      <path d="M42 68 q8 7 16 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    )}
    <circle cx="28" cy="58" r="5" fill={PLAY_COLORS.pink} opacity="0.45" />
    <circle cx="72" cy="58" r="5" fill={PLAY_COLORS.pink} opacity="0.45" />
    {hat && (
      <g>
        <path d="M26 24 q24 -26 48 0 z" fill={ACCENTS.ochre} />
        <rect x="22" y="22" width="56" height="6" rx="3" fill={ACCENTS.ochre} />
      </g>
    )}
    {tickled && <Sparkles />}
  </svg>
);

/** A bunny that just waves hello. */
export const BunnyArt = ({ waving }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
    <ellipse cx="34" cy="22" rx="8" ry="22" fill="#F5F0E6" />
    <ellipse cx="66" cy="22" rx="8" ry="22" fill="#F5F0E6" />
    <ellipse cx="34" cy="24" rx="4" ry="15" fill={PLAY_COLORS.pink} opacity="0.6" />
    <ellipse cx="66" cy="24" rx="4" ry="15" fill={PLAY_COLORS.pink} opacity="0.6" />
    <ellipse cx="50" cy="64" rx="34" ry="34" fill="#F5F0E6" />
    <circle cx="38" cy="58" r="4.5" fill={INK} />
    <circle cx="62" cy="58" r="4.5" fill={INK} />
    <circle cx="39.5" cy="56.5" r="1.4" fill="#fff" />
    <circle cx="63.5" cy="56.5" r="1.4" fill="#fff" />
    <ellipse cx="50" cy="68" rx="5" ry="3.5" fill={PLAY_COLORS.pink} />
    <path d="M44 74 q6 6 12 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <circle cx="28" cy="70" r="5" fill={PLAY_COLORS.pink} opacity="0.4" />
    <circle cx="72" cy="70" r="5" fill={PLAY_COLORS.pink} opacity="0.4" />
    {waving && <text x="76" y="62" fontSize="20">👋</text>}
  </svg>
);
