/**
 * Game definitions for home menu — accent stripes align with shell palette
 *
 * `hiddenByDefault` games stay in the registry (so they can be switched back on
 * from the settings screen) but are off in a fresh install.
 */
export const ALL_GAMES = [
  { id: 'numbers', title: 'מספרים', icon: '🧮', accent: '#c97b5a' },
  { id: 'bubbles', title: 'בועות', icon: '🎈', accent: '#9887a8', hiddenByDefault: true },
  { id: 'colors', title: 'צבעים', icon: '🎨', accent: '#c08b8b', hiddenByDefault: true },
  { id: 'memory', title: 'זיכרון', icon: '🎯', accent: '#7e9bb5' },
  { id: 'animals', title: 'חיות', icon: '🐾', accent: '#6e8b6e', hiddenByDefault: true },
  { id: 'count-with-me', title: 'סופרים ביחד', icon: '🔢', accent: '#d9a441' },
  { id: 'shapes', title: 'צורות', icon: '🔷', accent: '#9887a8', hiddenByDefault: true },
  { id: 'what-doesnt-belong', title: 'מה לא שייך', icon: '🔍', accent: '#8fa98a', hiddenByDefault: true },
  { id: 'shadow-match', title: 'צלליות', icon: '🌗', accent: '#7e9bb5', hiddenByDefault: true },
  { id: 'rhythm-tap', title: 'סיימון', icon: '🎵', accent: '#9887a8' },
  { id: 'maze-rescue', title: 'המבוך', icon: '🗺️', accent: '#6e8b6e' },
  { id: 'runner-dash', title: 'מרוץ 3D', icon: '🏃', accent: '#7e9bb5' },
  { id: 'water-sort', title: 'מיון צבעים', icon: '🧪', accent: '#8fa98a' },
  { id: 'color-pop-hunt', title: 'תופסים את הצבע', icon: '🎯', accent: '#c08b8b' },
  { id: 'hide-seek', title: 'למצוא את אפי', icon: '🔎', accent: '#c97b5a' },
  { id: 'monster-drag-chomp', title: 'מפלצת מעל החברים', icon: '', accent: '#9887a8' },
  { id: 'number-trace', title: 'כותבים מספרים', icon: '✏️', accent: '#7e9bb5' },
  { id: 'dino-sneak', title: 'דינוזאור מתגנב', icon: '🦖', accent: '#8fa98a' },
  { id: 'dino-stomp', title: 'רעידת אדמה', icon: '🦶', accent: '#c9b08a' },
  { id: 'photo-puzzle', title: 'פאזל תמונות', icon: '🧩', accent: '#d9a441' },
  { id: 'web-sling', title: 'רשת!', icon: '🕸️', accent: '#c97b5a' },
  { id: 'snake-garden', title: 'הנחש הרעב', icon: '🐍', accent: '#8fa98a' },
  { id: 'room-tidy', title: 'מסדרים את הבית', icon: '🏠', accent: '#c9b08a' },
  { id: 'arrow-escape', title: 'חצים', icon: '➡️', accent: '#7e9bb5' },
  { id: 'pop-it', title: 'פופ-איט', icon: '🫧', accent: '#c08b8b' },
  { id: 'dino-ar', title: 'ציד AR', icon: '🦖', accent: '#6e8b6e', externalUrl: '/dino-ar/' },
  { id: 'dino-hunt', title: 'ציד דינוזאורים', icon: '🦕', accent: '#8fa98a', externalUrl: '/dino-hunt/' },
];

/** Games hidden in a fresh install — kept selectable in the settings screen */
export const DEFAULT_HIDDEN_GAMES = ALL_GAMES.filter((g) => g.hiddenByDefault).map((g) => g.id);

export const DEFAULT_VISIBLE_GAMES = ALL_GAMES.filter((g) => !g.hiddenByDefault).map((g) => g.id);
