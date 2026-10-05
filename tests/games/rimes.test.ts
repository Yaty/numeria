import { describe, expect, it } from 'vitest';
import { ENTRIES, RIMES, game, partners, targetsFor } from '../../src/games/rimes';
import { checkItems } from './phono-helpers';

const NOTATION = /^[aeɛioɔuyøœAOEpbtdkgfvszSZmnNlRjwH]$/;

describe('rimes : données', () => {
  it('chaque mot une seule fois, émoji unique', () => {
    const words = ENTRIES.map((e) => e.word[0]);
    expect(new Set(words).size).toBe(words.length);
    const emojis = ENTRIES.map((e) => e.word[1]);
    expect(new Set(emojis).size).toBe(emojis.length);
  });

  it('graphie de rime et initiale cohérentes', () => {
    for (const { word } of ENTRIES) {
      const [w, , spelling, initial] = word;
      expect(w.replace(/[sx]$/, '').endsWith(spelling) || w.endsWith(spelling), w).toBe(true);
      expect(initial, w).toMatch(NOTATION);
    }
  });

  it('chaque rime a au moins deux mots', () => {
    for (const r of Object.values(RIMES)) expect(r.words.length).toBeGreaterThanOrEqual(2);
  });

  it('assez de cibles par niveau', () => {
    for (const level of [1, 2, 3] as const) expect(targetsFor(level).length).toBeGreaterThanOrEqual(30);
    // Niveau 3 : la rime s'écrit autrement.
    for (const t of targetsFor(3)) for (const p of partners(t, 3)) expect(p[2]).not.toBe(t.word[2]);
  });
});

describe('rimes : makeItem', () => {
  const rimeOf = (emoji: string) => ENTRIES.find((e) => e.word[1] === emoji)!.rime;
  it('items valides, une seule image rime', () => {
    checkItems(game, (item, level) => {
      const target = ENTRIES.find((e) => e.word[1] === item.stimulus!.emoji)!;
      expect(item.choices).toHaveLength(level === 1 ? 3 : 4);
      for (const c of item.choices!) expect(rimeOf(c.emoji!) === target.rime).toBe(c.correct);
      expect(item.choices!.some((c) => c.emoji === target.word[1])).toBe(false);
      const good = ENTRIES.find((e) => e.word[1] === item.choices!.find((c) => c.correct)!.emoji)!;
      if (level === 1) expect(good.word[2]).toBe(target.word[2]);
      if (level === 3) expect(good.word[2]).not.toBe(target.word[2]);
    });
  });
});
