import { describe, expect, it } from 'vitest';
import { LEVELS, WORDS, game, muteFinalE, syllables, wordOf } from '../../src/games/syllabes';
import { checkItems } from './phono-helpers';

describe('syllabes : données', () => {
  it('pas de doublon, émojis présents', () => {
    const words = WORDS.map(([s]) => wordOf(s));
    expect(new Set(words).size).toBe(words.length);
    expect(new Set(WORDS.map(([, e]) => e)).size).toBe(WORDS.length);
    for (const [s, e] of WORDS) {
      expect(e).toBeTruthy();
      expect(syllables(s).every((p) => p.length > 0)).toBe(true);
    }
  });

  it('découpages vérifiés à la main (e muet final non compté)', () => {
    const n = (w: string) => syllables(WORDS.find(([s]) => wordOf(s) === w)![0]).length;
    expect(n('pomme')).toBe(1);
    expect(n('tomate')).toBe(2);
    expect(n('lunettes')).toBe(2);
    expect(n('papillon')).toBe(3);
    expect(n('hélicoptère')).toBe(4);
    expect(muteFinalE('pomme')).toBe(true);
    expect(muteFinalE('fusée')).toBe(false);
    expect(muteFinalE('chat')).toBe(false);
  });

  it('assez de mots à chaque niveau', () => {
    for (const level of [1, 2, 3] as const) {
      const { counts, max } = LEVELS[level];
      const pool = WORDS.filter(([s]) => counts.includes(syllables(s).length));
      expect(pool.length).toBeGreaterThanOrEqual(30);
      for (const c of counts) {
        expect(WORDS.some(([s]) => syllables(s).length === c)).toBe(true);
        expect(c).toBeLessThanOrEqual(max);
      }
    }
  });

  it('aucun mot exclu par les règles (finales consonne + r/l, hiatus)', () => {
    for (const [s] of WORDS) {
      const w = wordOf(s);
      expect(w, w).not.toMatch(/[bcdfgptv][rl]e$/);
      expect(w, w).not.toMatch(/(ion|ia|ua)/);
    }
  });
});

describe('syllabes : makeItem', () => {
  it('items valides', () => {
    checkItems(game, (item, level) => {
      const w = item.key.replace('syl:', '');
      const entry = WORDS.find(([s]) => wordOf(s) === w);
      expect(entry).toBeDefined();
      expect(LEVELS[level].counts).toContain(syllables(entry![0]).length);
      expect(item.say).toContain(w);
    });
  });
});
