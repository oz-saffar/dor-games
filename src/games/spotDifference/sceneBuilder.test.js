import { describe, it, expect } from 'vitest';
import { GAME_DIFFICULTY } from '../../lib/gameDifficulties';
import { createRng, generateRound, radiusOf } from './sceneBuilder';
import { DIFFICULTY } from './sceneConfig';

const SEEDS = Array.from({ length: 150 }, (_, i) => i * 7919 + 1);
const LEVELS = [GAME_DIFFICULTY.EASY, GAME_DIFFICULTY.MEDIUM, GAME_DIFFICULTY.HARD];

const overlaps = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < radiusOf(a) + radiusOf(b);

describe('createRng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(5);
    const b = createRng(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('scene generation', () => {
  for (const level of LEVELS) {
    it(`${level}: counts, overlaps and real changes hold across many seeds`, () => {
      for (const seed of SEEDS) {
        const { scene, altered, differences } = generateRound(seed, level);

        expect(scene.objects.length).toBeGreaterThanOrEqual(6);
        expect(scene.objects.length).toBeLessThanOrEqual(9);
        expect(differences).toHaveLength(DIFFICULTY[level].count);

        // no two objects overlap, in either picture
        for (const s of [scene, altered]) {
          for (let i = 0; i < s.objects.length; i += 1) {
            for (let j = i + 1; j < s.objects.length; j += 1) {
              expect(overlaps(s.objects[i], s.objects[j])).toBe(false);
            }
          }
        }

        // differences are apart from each other, one per object
        for (let i = 0; i < differences.length; i += 1) {
          for (let j = i + 1; j < differences.length; j += 1) {
            const a = differences[i];
            const b = differences[j];
            expect(a.objectId).not.toBe(b.objectId);
            expect(Math.hypot(a.cx - b.cx, a.cy - b.cy)).toBeGreaterThanOrEqual(a.r + b.r);
          }
        }

        // every difference really changes the object's data; nothing else does
        const changedIds = new Set(differences.map((d) => d.objectId));
        for (const d of differences) {
          const before = scene.objects.find((o) => o.id === d.objectId);
          const after = altered.objects.find((o) => o.id === d.objectId);
          if (d.kind === 'missing') expect(after).toBeUndefined();
          else expect(after).not.toEqual(before);
          if (d.kind === 'color') expect(after.color).not.toBe(before.color);
          if (d.kind === 'swap') expect(after.kind).not.toBe(before.kind);
          if (d.kind === 'flip') expect(after.flip).not.toBe(before.flip);
          if (d.kind === 'bigger') expect(after.scale).toBeGreaterThan(1);
          if (level === GAME_DIFFICULTY.EASY) expect(d.kind).not.toBe('flip');
        }
        for (const o of scene.objects) {
          if (!changedIds.has(o.id)) {
            expect(altered.objects.find((x) => x.id === o.id)).toEqual(o);
          }
        }
      }
    });
  }

  it('is reproducible from a seed and uses several themes', () => {
    expect(generateRound(42, GAME_DIFFICULTY.HARD)).toEqual(generateRound(42, GAME_DIFFICULTY.HARD));
    const themes = new Set(SEEDS.map((s) => generateRound(s, GAME_DIFFICULTY.EASY).scene.theme));
    expect(themes.size).toBeGreaterThanOrEqual(3);
  });
});
