import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { SENTENCES, display, forms, game, matchForm, punctuation, tokens } from '../../src/games/phrases';

const EMOJI_RE = /\p{Extended_Pictographic}/u;
const sorted = (xs: string[]) => [...xs].sort().join(' ');
const NAMES = new Set(['Léo', 'Zoé', 'Tom', 'Mila', 'Nina', 'Léa', 'Hugo', 'Paul', 'Sami', 'Lou', 'Inès', 'Jade', 'Max', 'Lina']);

describe('phrases : données', () => {
  it('pas de doublon', () => {
    expect(new Set(SENTENCES.map((s) => s.text)).size).toBe(SENTENCES.length);
  });

  it('nombre de mots selon le niveau, au moins 30 phrases par niveau', () => {
    const range = { 1: [3, 4], 2: [5, 7], 3: [7, 10] } as const;
    for (const s of SENTENCES) {
      const n = tokens(s.text).length;
      expect(n, s.text).toBeGreaterThanOrEqual(range[s.level][0]);
      expect(n, s.text).toBeLessThanOrEqual(range[s.level][1]);
    }
    for (const l of [1, 2, 3]) expect(SENTENCES.filter((s) => s.level === l).length).toBeGreaterThanOrEqual(30);
  });

  it('les autres ordres acceptés utilisent exactement les mêmes étiquettes et la même ponctuation', () => {
    for (const s of SENTENCES) {
      expect(['.', '?', '!']).toContain(punctuation(s.text));
      for (const f of s.alt) {
        expect(sorted(tokens(f)), f).toBe(sorted(tokens(s.text)));
        expect(punctuation(f)).toBe(punctuation(s.text));
        expect(tokens(f).join(' ')).not.toBe(tokens(s.text).join(' '));
      }
    }
  });

  it('pas de majuscule sur les étiquettes, sauf les prénoms', () => {
    for (const s of SENTENCES)
      for (const t of tokens(s.text)) if (/^\p{Lu}/u.test(t)) expect(NAMES.has(t), `${t} dans « ${s.text} »`).toBe(true);
  });

  it('écriture finale : majuscule, virgule, ponctuation', () => {
    expect(display('demain, nous allons à la plage.')).toBe('Demain, nous allons à la plage.');
    expect(display('est-ce que tu veux jouer avec moi ?')).toBe('Est-ce que tu veux jouer avec moi ?');
    expect(display('à quelle heure est-ce que tu vas à l’école ?')).toBe('À quelle heure est-ce que tu vas à l’école ?');
  });

  it('accepte chaque ordre listé et refuse les autres', () => {
    const s = SENTENCES.find((x) => x.text.startsWith('nous allons à la plage'))!;
    for (const f of forms(s)) expect(matchForm(s, tokens(f))).toBe(f);
    expect(matchForm(s, ['à', 'la', 'plage', 'nous', 'allons', 'demain'])).toBeNull();
    const l1 = SENTENCES.find((x) => x.text === 'Léo mange une pomme.')!;
    expect(matchForm(l1, ['une', 'pomme', 'mange', 'Léo'])).toBeNull();
  });
});

describe('phrases : makeItem', () => {
  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level}`, () => {
      for (let seed = 1; seed <= 300; seed++) {
        const item = game.makeItem(level, seeded(seed), []);
        expect(item.key).not.toBe('');
        expect(item.custom).toBeTypeOf('function');
        expect(item.choices).toBeUndefined();
        expect(EMOJI_RE.test(item.say ?? item.prompt)).toBe(false);
        expect(item.explain).toMatch(/^La phrase est : «\s\p{Lu}/u);
        const s = SENTENCES.find((x) => item.key === `${level}:${x.text}`);
        expect(s, item.key).toBeDefined();
      }
    });
  }
});
