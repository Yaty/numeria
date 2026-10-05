import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { game, makeSequence, SIMILAR_RIMES, WORDS, sayFor, explainFor } from '../../src/games/memoire';

const EMOJI = /\p{Extended_Pictographic}/u;

/** Syllabes orales approximées : groupes de voyelles, e final muet retiré (y = consonne ici). */
function oralSyllables(word: string): number {
  const w = word.replace(/es?$/, '');
  return (w.match(/[aeiouéèêàâîôûœ]+/g) ?? []).length;
}

describe('mémoire : données', () => {
  it('au moins 40 mots, sans doublon de mot ni d’émoji', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(WORDS.map((w) => w[0])).size).toBe(WORDS.length);
    expect(new Set(WORDS.map((w) => w[1])).size).toBe(WORDS.length);
  });
  it('au moins 30 mots d’une syllabe pour le niveau 1', () => {
    expect(WORDS.filter((w) => w[2] === 1).length).toBeGreaterThanOrEqual(30);
  });
  it('syllabes orales cohérentes', () => {
    for (const [word, , syl] of WORDS) expect(oralSyllables(word), word).toBe(syl);
  });
  it('émojis présents, mots sans émoji', () => {
    for (const [word, emoji] of WORDS) {
      expect(EMOJI.test(emoji), word).toBe(true);
      expect(EMOJI.test(word)).toBe(false);
    }
  });
  it('les familles de rimes du niveau 3 ont au moins 6 mots', () => {
    for (const r of SIMILAR_RIMES) expect(WORDS.filter((w) => w[3] === r).length, r).toBeGreaterThanOrEqual(6);
  });
});

describe('mémoire : séquences', () => {
  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level}`, () => {
      const modes = new Set<string>();
      for (let seed = 1; seed <= 400; seed++) {
        const rng = seeded(seed);
        const s = makeSequence(level, rng);
        modes.add(s.mode);
        const span = s.words.length;
        const [lo, hi] = level === 1 ? [2, 3] : level === 2 ? [3, 4] : s.mode === 'envers' ? [3, 4] : [4, 5];
        expect(span).toBeGreaterThanOrEqual(lo);
        expect(span).toBeLessThanOrEqual(hi);
        expect(s.grid.length).toBe(level === 1 ? 6 : level === 2 ? 8 : 9);
        expect(new Set(s.grid).size).toBe(s.grid.length);
        for (const w of s.words) expect(s.grid).toContain(w);
        expect(s.expected).toEqual(s.mode === 'envers' ? [...s.words].reverse() : s.words);
        if (level === 1) for (const w of s.grid) expect(w[2]).toBe(1);
        if (s.mode === 'ressemblent') {
          expect(new Set(s.words.map((w) => w[3])).size).toBe(1);
          // Au moins un leurre qui rime dans la grille.
          expect(s.grid.filter((w) => w[3] === s.words[0][3]).length).toBeGreaterThan(span);
        } else {
          expect(new Set(s.grid.map((w) => w[3])).size).toBe(s.grid.length);
        }
        expect(EMOJI.test(sayFor(s))).toBe(false);
        expect(EMOJI.test(explainFor(s))).toBe(false);
      }
      if (level === 3) expect([...modes].sort()).toEqual(['envers', 'ressemblent']);
      else expect([...modes]).toEqual(['endroit']);
    });

    it(`makeItem niveau ${level} : clé, rendu libre, voix sans émoji`, () => {
      for (let seed = 1; seed <= 300; seed++) {
        const item = game.makeItem(level, seeded(seed), []);
        expect(item.key).toMatch(/^\w+:.+/u);
        expect(typeof item.custom).toBe('function');
        expect(item.choices).toBeUndefined();
        expect(EMOJI.test(item.say ?? item.prompt)).toBe(false);
        expect(item.explain).toBeTruthy();
      }
    });
  }
});
