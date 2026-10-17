/** Bar indices 0..7 = C5 D5 E5 F5 G5 A5 B5 C6. */
export const BAR_COUNT = 8;
export const BAR_FREQS = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
export const BAR_COLOR_KEYS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];

export const SONGS = [
  {
    id: 'twinkle',
    title: 'כוכב קטן',
    notes: [
      0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0,
      4, 4, 3, 3, 2, 2, 1, 4, 4, 3, 3, 2, 2, 1,
      0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0,
    ],
  },
  {
    id: 'yonatan',
    title: 'יונתן הקטן',
    notes: [
      0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, 2, 3, 4,
      4, 5, 4, 3, 2, 0, 4, 5, 4, 3, 2, 0, 0, 4, 0, 0, 4, 0,
    ],
  },
];

/** easy = first phrase (7 notes), medium = half, hard = whole song. */
export function notesFor(song, difficulty) {
  const all = song.notes;
  if (difficulty === 'hard') return all;
  if (difficulty === 'medium') return all.slice(0, Math.ceil(all.length / 2));
  return all.slice(0, 7);
}
