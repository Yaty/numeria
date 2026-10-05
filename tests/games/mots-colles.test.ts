import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { SENTENCES, boundaries, explainFor, game, isCorrect, segment, tokenize } from '../../src/games/mots-colles';

const EMOJI = /\p{Extended_Pictographic}/u;

describe('mots collés : découpe', () => {
  it('élisions coupées après l’apostrophe, sauf mots entiers', () => {
    expect(tokenize('l’avion vole')).toEqual(['l’', 'avion', 'vole']);
    expect(tokenize('il s’est fait mal')).toEqual(['il', 's’', 'est', 'fait', 'mal']);
    expect(tokenize('aujourd’hui c’est')).toEqual(['aujourd’hui', 'c’', 'est']);
    expect(tokenize('quelqu’un a sonné')).toEqual(['quelqu’un', 'a', 'sonné']);
    expect(tokenize('ma grand-mère')).toEqual(['ma', 'grand-mère']);
  });
  it('séparations et vérification', () => {
    const words = tokenize('le chat dort');
    const b = boundaries(words);
    expect(b).toEqual([1, 5]);
    const letters = Array.from(words.join(''));
    expect(segment(letters, new Set(b))).toBe('le chat dort');
    expect(isCorrect(b, new Set(b))).toBe(true);
    expect(isCorrect(b, new Set([1]))).toBe(false);
    expect(isCorrect(b, new Set([1, 5, 7]))).toBe(false);
  });
});

describe('mots collés : données', () => {
  const counts = { 1: [3, 3], 2: [4, 6], 3: [6, 12] } as const;
  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level} : au moins 40 phrases, sans doublon, ${counts[level].join(' à ')} mots`, () => {
      const list = SENTENCES[level];
      expect(list.length).toBeGreaterThanOrEqual(40);
      expect(new Set(list).size).toBe(list.length);
      for (const s of list) {
        expect(s, s).toBe(s.toLowerCase());
        expect(/^[a-zàâçéèêëîïôûùœ’ -]+$/.test(s), s).toBe(true);
        expect(s.includes("'"), s).toBe(false);
        const n = tokenize(s).length;
        expect(n, s).toBeGreaterThanOrEqual(counts[level][0]);
        expect(n, s).toBeLessThanOrEqual(counts[level][1]);
        if (level === 1) expect(s.includes('’'), s).toBe(false);
      }
    });
  }
  it('niveau 2 : la plupart des phrases ont une élision', () => {
    expect(SENTENCES[2].filter((s) => s.includes('’')).length).toBeGreaterThanOrEqual(25);
  });
});

describe('mots collés : items', () => {
  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level} : 300 tirages cohérents`, () => {
      for (let seed = 1; seed <= 300; seed++) {
        const item = game.makeItem(level, seeded(seed), []);
        expect(item.key).toBeTruthy();
        expect(typeof item.custom).toBe('function');
        expect(item.choices).toBeUndefined();
        expect(item.say && !EMOJI.test(item.say)).toBe(true);
        expect(EMOJI.test(item.explain!)).toBe(false);
        const sentence = item.key.slice(2);
        // Aux niveaux 2 et 3, la phrase n'est pas lue (c'est de la lecture).
        if (level > 1) expect(item.say!.includes(sentence)).toBe(false);
        expect(explainFor(sentence)).toContain(`Il y a ${tokenize(sentence).length} mots\u00a0:`);
      }
    });
  }
});
