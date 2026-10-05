import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { ENTRIES, SETS, explainFor, fill, game } from '../../src/games/homophones';

const EMOJI = /\p{Extended_Pictographic}/u;
const VOWEL = /^[aeiouyéèêàâîôûœh]/i;

describe('homophones : données', () => {
  it('au moins 40 phrases par niveau, sans doublon', () => {
    for (const level of [1, 2, 3]) expect(ENTRIES.filter((e) => e.set.level === level).length).toBeGreaterThanOrEqual(40);
    const all = ENTRIES.map((e) => fill(e.gapped, e.answer));
    expect(new Set(all).size).toBe(all.length);
  });
  it('un seul trou, réponse parmi les options, chaque option utilisée', () => {
    for (const e of ENTRIES) {
      expect(e.gapped.split('_').length, e.gapped).toBe(2);
      expect(e.set.options, e.gapped).toContain(e.answer);
    }
    for (const s of SETS) for (const o of s.options) expect(ENTRIES.some((e) => e.set === s && e.answer === o), `${s.id} ${o}`).toBe(true);
  });
  it('pas de voyelle après le trou quand une liaison trahirait la réponse', () => {
    for (const e of ENTRIES) {
      if (e.set.vowelOk) continue;
      const after = e.gapped.split('_')[1].trim();
      expect(VOWEL.test(after), e.gapped).toBe(false);
    }
  });
  it('phrases : majuscule initiale et ponctuation finale', () => {
    for (const e of ENTRIES) {
      const s = fill(e.gapped, e.answer);
      expect(s.charAt(0), s).toBe(s.charAt(0).toUpperCase());
      expect(/[.!?]$/.test(s), s).toBe(true);
    }
  });
  it('explications sans émoji, avec la bonne réponse', () => {
    for (const e of ENTRIES) {
      const x = explainFor(e);
      expect(EMOJI.test(x)).toBe(false);
      expect(x).toContain(`«\u00a0${e.answer}\u00a0»`);
    }
  });
});

describe('homophones : items', () => {
  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level} : 300 tirages cohérents`, () => {
      const sets = new Set<string>();
      for (let seed = 1; seed <= 300; seed++) {
        const item = game.makeItem(level, seeded(seed), []);
        const choices = item.choices!;
        expect(choices.filter((c) => c.correct)).toHaveLength(1);
        expect(new Set(choices.map((c) => c.label)).size).toBe(choices.length);
        expect(item.key).toBeTruthy();
        expect(item.say && !EMOJI.test(item.say)).toBe(true);
        expect(item.stimulus?.text).toContain('……');
        sets.add(item.key.split(':')[0]);
      }
      expect(sets.size).toBe(SETS.filter((s) => s.level === level).length);
    });
  }
});
