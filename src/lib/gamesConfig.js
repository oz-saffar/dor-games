/**
 * Game definitions for home menu — accent stripes align with shell palette
 */
export const ALL_GAMES = [
  { id: 'numbers', title: 'מספרים', icon: '🧮', accent: '#e85d35' },
  { id: 'bubbles', title: 'בועות', icon: '🎈', accent: '#8b5cf6' },
  { id: 'colors', title: 'צבעים', icon: '🎨', accent: '#db2777' },
  { id: 'memory', title: 'זיכרון', icon: '🎯', accent: '#5b5fc7' },
  { id: 'animals', title: 'חיות', icon: '🐾', accent: '#15803d' },
  { id: 'count-with-me', title: 'סופרים ביחד', icon: '🔢', accent: '#0284c7' },
  { id: 'shapes', title: 'צורות', icon: '🔷', accent: '#6d28d9' },
  { id: 'what-doesnt-belong', title: 'מה לא שייך', icon: '🔍', accent: '#0e7490' },
  { id: 'shadow-match', title: 'צלליות', icon: '🌗', accent: '#0e7490' },
  { id: 'rhythm-tap', title: 'סיימון', icon: '🎵', accent: '#4338ca' },
  { id: 'maze-rescue', title: 'המבוך', icon: '🗺️', accent: '#166534' },
  { id: 'puzzle-drag', title: 'פאזל גרירה', icon: '🧩', accent: '#ea580c' },
  { id: 'runner-dash', title: 'מרוץ 3D', icon: '🏃', accent: '#1d4ed8' },
  { id: 'water-sort', title: 'מיון צבעים', icon: '🧪', accent: '#0f766e' },
  { id: 'color-pop-hunt', title: 'תופסים את הצבע', icon: '🎯', accent: '#c026d3' },
  { id: 'hide-seek', title: 'למצוא את אפי', icon: '🔎', accent: '#c2410c' },
  { id: 'monster-munch', title: 'המפלצת הרעבה', icon: '', accent: '#7c3aed' },
  { id: 'monster-drag-chomp', title: 'מפלצת מעל החברים', icon: '', accent: '#4f46e5' },
  { id: 'boy-cried-wolf', title: 'הילד שצעק זאב', icon: '🐺', accent: '#b45309' },
  { id: 'football', title: 'כדורגל', icon: '⚽', accent: '#16a34a' },
  { id: 'football-drag', title: 'כדורגל גרירה', icon: '🥅', accent: '#15803d' },
];

export const DEFAULT_VISIBLE_GAMES = ALL_GAMES.map((g) => g.id);
