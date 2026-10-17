import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';

/**
 * Line-art pictures on a shared 200x200 canvas.
 *
 * Every region is a closed path with `min`, the first difficulty level
 * (0 easy, 1 medium, 2 hard) it appears at. Regions are painted in array
 * order, so later ones sit on top of earlier ones. Per picture there are
 * 5 regions at min 0, 3 more at min 1 and 4 more at min 2 => 5 / 8 / 12.
 * The dark outline layer is generated from the very same visible paths.
 */
export const VIEW = 200;
export const PAPER = '#FFFDF8';
export const INK = '#3B332E';

export const LEVELS = {
  [GAME_DIFFICULTY.EASY]: 0,
  [GAME_DIFFICULTY.MEDIUM]: 1,
  [GAME_DIFFICULTY.HARD]: 2,
};

export const REGION_COUNTS = { easy: 5, medium: 8, hard: 12 };

export const levelOf = (difficulty) => LEVELS[difficulty] ?? 0;

const r = (id, min, d) => ({ id, min, d });
const circle = (cx, cy, rad) => `M${cx - rad} ${cy} a${rad} ${rad} 0 1 0 ${rad * 2} 0 a${rad} ${rad} 0 1 0 ${-rad * 2} 0Z`;

const dinosaur = {
  id: 'dinosaur',
  title: 'דינוזאור',
  emoji: '🦕',
  regions: [
    r('body', 0, 'M38 118 C38 82 80 74 112 84 C150 94 160 128 140 148 C118 160 60 160 38 118Z'),
    r('tail', 0, 'M44 108 C28 112 14 126 6 146 C26 144 42 140 54 134Z'),
    r('head', 0, 'M128 78 C128 52 150 38 170 46 C190 54 192 80 176 90 C160 100 130 98 128 78Z'),
    r('belly', 1, 'M56 134 C80 156 122 156 144 136 C136 158 70 164 56 134Z'),
    r('spot1', 1, circle(78, 118, 9)),
    r('eye', 1, circle(162, 62, 6)),
    r('spot2', 2, circle(116, 106, 9)),
    r('cheek', 2, circle(174, 80, 6)),
    r('plate1', 2, 'M62 96 L74 68 L90 88Z'),
    r('plate2', 2, 'M96 86 L108 62 L124 90Z'),
    r('leg1', 0, 'M70 148 L70 184 L94 184 L94 152Z'),
    r('leg2', 0, 'M112 150 L112 184 L136 184 L136 148Z'),
  ],
};

const car = {
  id: 'car',
  title: 'מכונית',
  emoji: '🚗',
  regions: [
    r('body', 0, 'M12 148 L12 114 Q12 100 28 98 L172 98 Q190 100 190 116 L190 148Z'),
    r('cabin', 0, 'M52 98 L72 58 L138 58 L160 98Z'),
    r('window', 0, 'M64 96 L80 68 L132 68 L148 96Z'),
    r('stripe', 2, 'M12 120 H190 V128 H12Z'),
    r('door', 2, 'M84 100 L84 140 L120 140 L120 100Z'),
    r('taillight', 2, circle(24, 110, 6)),
    r('headlight', 1, circle(180, 110, 7)),
    r('roofLight', 2, 'M96 44 H116 V58 H96Z'),
    r('wheel1', 0, circle(56, 148, 22)),
    r('wheel2', 0, circle(148, 148, 22)),
    r('hub1', 1, circle(56, 148, 9)),
    r('hub2', 1, circle(148, 148, 9)),
  ],
};
const house = {
  id: 'house',
  title: 'בית',
  emoji: '🏠',
  regions: [
    r('grass', 2, 'M0 178 H200 V198 H0Z'),
    r('wall', 0, 'M30 100 H170 V178 H30Z'),
    r('chimney', 1, 'M138 54 H158 V86 H138Z'),
    r('roof', 0, 'M16 102 L100 32 L184 102Z'),
    r('door', 0, 'M84 126 H116 V178 H84Z'),
    r('window1', 0, 'M44 114 H72 V142 H44Z'),
    r('window2', 0, 'M128 114 H156 V142 H128Z'),
    r('sun', 1, circle(166, 30, 13)),
    r('cloud', 2, 'M20 40 Q18 26 34 26 Q40 14 54 22 Q70 22 66 40Z'),
    r('atticWindow', 1, circle(100, 76, 10)),
    r('step', 2, 'M80 178 H120 V190 H80Z'),
    r('knob', 2, circle(108, 154, 6)),
  ],
};
const fish = {
  id: 'fish',
  title: 'דג',
  emoji: '🐟',
  regions: [
    r('tail', 0, 'M150 100 L190 66 L190 134Z'),
    r('topFin', 0, 'M80 70 C92 40 120 44 126 68Z'),
    r('bottomFin', 0, 'M84 128 C92 158 118 158 122 130Z'),
    r('body', 0, 'M30 100 C60 52 130 52 156 100 C130 148 60 148 30 100Z'),
    r('eye', 0, circle(62, 92, 8)),
    r('spot1', 1, circle(94, 100, 10)),
    r('spot2', 1, circle(122, 96, 8)),
    r('cheek', 1, circle(74, 114, 7)),
    r('bubble1', 2, circle(30, 62, 8)),
    r('bubble2', 2, circle(46, 36, 6)),
    r('bubble3', 2, circle(18, 34, 5)),
    r('seaweed', 2, 'M160 192 C146 176 172 164 160 146 L172 146 C184 164 158 176 172 192Z'),
  ],
};
const flower = {
  id: 'flower',
  title: 'פרח',
  emoji: '🌸',
  regions: [
    r('stem', 0, 'M94 100 H106 V160 H94Z'),
    r('leaf1', 0, 'M106 142 C134 120 152 130 152 130 C142 156 118 158 106 150Z'),
    r('leaf2', 1, 'M94 142 C66 120 48 130 48 130 C58 156 82 158 94 150Z'),
    r('pot', 0, 'M70 166 H130 L120 198 H80Z'),
    r('rim', 1, 'M64 152 H136 V168 H64Z'),
    r('petals', 0, circle(100, 70, 44)),
    r('center', 0, circle(100, 70, 18)),
    r('dot', 2, circle(100, 70, 7)),
    r('sun', 1, circle(28, 28, 14)),
    r('cloud', 2, 'M138 28 Q136 14 152 14 Q158 4 172 10 Q188 10 184 28Z'),
    r('ladybug', 2, circle(34, 176, 11)),
    r('bud', 2, circle(168, 160, 12)),
  ],
};
const rocket = {
  id: 'rocket',
  title: 'טיל',
  emoji: '🚀',
  regions: [
    r('flame', 0, 'M78 152 H122 L100 196Z'),
    r('finL', 0, 'M58 112 L30 158 L58 150Z'),
    r('finR', 0, 'M142 112 L170 158 L142 150Z'),
    r('body', 0, 'M100 20 C140 50 148 110 144 150 H56 C52 110 60 50 100 20Z'),
    r('nose', 1, 'M100 20 C118 36 130 56 134 70 H66 C70 56 82 36 100 20Z'),
    r('band', 1, 'M55 122 H145 V136 H55Z'),
    r('window', 0, circle(100, 90, 17)),
    r('innerFlame', 1, 'M90 152 H110 L100 180Z'),
    r('star1', 2, 'M36 24 L40 34 L50 34 L42 40 L45 50 L36 44 L27 50 L30 40 L22 34 L32 34Z'),
    r('star2', 2, 'M168 54 L172 64 L182 64 L174 70 L177 80 L168 74 L159 80 L162 70 L154 64 L164 64Z'),
    r('planet', 2, circle(28, 100, 12)),
    r('moon', 2, circle(172, 30, 12)),
  ],
};

export const PICTURES = [dinosaur, car, house, fish, flower, rocket];

export const getPicture = (id) => PICTURES.find((p) => p.id === id) || PICTURES[0];

/** Regions visible at a difficulty, in paint order. */
export const regionsFor = (picture, difficulty) => {
  const level = levelOf(difficulty);
  return picture.regions.filter((region) => region.min <= level);
};
