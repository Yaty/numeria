import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { FAMILIES, FLASH_MS, TIPS, WORDS, game } from '../../src/games/lecture-flash';

const EMOJI = /\p{Extended_Pictographic}|⃣/u;

describe('lecture flash : données', () => {
  it('mots et émojis uniques', () => {
    expect(new Set(WORDS.map((w) => w[0])).size).toBe(WORDS.length);
    expect(new Set(WORDS.map((w) => w[1])).size).toBe(WORDS.length);
    for (const [word, emoji] of WORDS) {
      expect(EMOJI.test(emoji), word).toBe(true);
      expect(EMOJI.test(word), word).toBe(false);
    }
  });
  it('au moins 30 mots cibles par niveau', () => {
    for (const level of [1, 2, 3]) expect(WORDS.filter((w) => w[2] === level).length).toBeGreaterThanOrEqual(30);
  });
  it('niveau 1 : graphèmes simples seulement', () => {
    // Voyelle + n/m nasale = suivie d'une consonne ou en fin de mot (« banane », « pomme » restent simples).
    const complex = /ou|oi|ch|gn|au|ai|ei|eu|œ|ph|qu|ill|ss|[wyxhq]|c[eiy]|g[eiy]|[aeiouy][nm](?![aeiouyéèêmn])/;
    for (const [word, , level] of WORDS) if (level === 1) expect(complex.test(word), word).toBe(false);
  });
  it('familles : 3 ou 4 mots connus, sans doublon', () => {
    const known = new Set(WORDS.map((w) => w[0]));
    for (const f of FAMILIES) {
      expect(f.length).toBeGreaterThanOrEqual(3);
      expect(f.length).toBeLessThanOrEqual(4);
      expect(new Set(f).size).toBe(f.length);
      for (const w of f) expect(known.has(w), w).toBe(true);
    }
  });
  it('chaque mot cible appartient à au moins une famille', () => {
    for (const [word] of WORDS) expect(FAMILIES.some((f) => f.includes(word)), word).toBe(true);
  });
  it('astuces : mots de niveau 3, sans émoji', () => {
    for (const [word, tip] of Object.entries(TIPS)) {
      expect(WORDS.find((w) => w[0] === word)?.[2], word).toBe(3);
      expect(EMOJI.test(tip)).toBe(false);
    }
  });
});

describe('lecture flash : items', () => {
  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level} : 300 tirages cohérents`, () => {
      for (let seed = 1; seed <= 300; seed++) {
        const item = game.makeItem(level, seeded(seed), []);
        const choices = item.choices!;
        expect(choices.filter((c) => c.correct)).toHaveLength(1);
        expect(choices.length).toBeGreaterThanOrEqual(3);
        expect(choices.length).toBeLessThanOrEqual(4);
        const ids = choices.map((c) => c.label || c.emoji);
        expect(new Set(ids).size).toBe(ids.length);
        expect(item.key).toBeTruthy();
        expect(item.stimulus?.flashMs).toBe(FLASH_MS[level]);
        const target = WORDS.find((w) => w[0] === item.stimulus?.text)!;
        expect(target[2]).toBe(level);
        expect(choices.find((c) => c.correct)!.emoji).toBe(target[1]);
        // Le mot n'est jamais lu : c'est de la lecture.
        expect(item.say).toBeTruthy();
        expect(item.say!.includes(target[0])).toBe(false);
        expect(EMOJI.test(item.say!)).toBe(false);
        expect(EMOJI.test(item.explain!)).toBe(false);
      }
    });
  }
});
