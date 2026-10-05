import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { ANTONYMS, EMOJI, SYNONYMS, game, prefixed } from '../../src/games/contraires';

const EMOJI_RE = /\p{Extended_Pictographic}/u;
const all = [...ANTONYMS, ...SYNONYMS];

describe('contraires : données', () => {
  it('paires valides et sans doublon', () => {
    const seen = new Set<string>();
    for (const p of all) {
      expect(p.a).not.toBe(p.b);
      const k = [p.a, p.b].sort().join('|');
      expect(seen.has(k), k).toBe(false);
      seen.add(k);
    }
  });

  it('chaque mot a un seul champ et une seule nature', () => {
    const info = new Map<string, string>();
    for (const p of all)
      for (const w of [p.a, p.b]) {
        const v = `${p.dim}/${p.pos}`;
        expect(info.get(w) ?? v, w).toBe(v);
        info.set(w, v);
      }
  });

  it('aucun mot n’est à la fois synonyme et contraire d’un autre', () => {
    const ant = new Set(ANTONYMS.flatMap((p) => [`${p.a}|${p.b}`, `${p.b}|${p.a}`]));
    for (const p of SYNONYMS) expect(ant.has(`${p.a}|${p.b}`), p.a).toBe(false);
  });

  it('niveau 1 : contraires seulement ; niveau 3 : synonymes seulement', () => {
    expect(SYNONYMS.some((p) => p.level === 1)).toBe(false);
    expect(ANTONYMS.some((p) => p.level === 3)).toBe(false);
    for (const l of [1, 2, 3]) expect(all.filter((p) => p.level === l).length * 2).toBeGreaterThanOrEqual(30);
  });

  it('images seulement pour des mots connus, par paires au niveau 1', () => {
    const words = new Set(all.flatMap((p) => [p.a, p.b]));
    for (const w of Object.keys(EMOJI)) expect(words.has(w), w).toBe(true);
    for (const p of ANTONYMS.filter((p) => p.level === 1)) expect(!!EMOJI[p.a], p.a).toBe(!!EMOJI[p.b]);
  });

  it('détecte les contraires par préfixe', () => {
    expect(prefixed('possible', 'impossible')).toEqual({ base: 'possible', derived: 'impossible' });
    expect(prefixed('décoller', 'coller')).toEqual({ base: 'coller', derived: 'décoller' });
    expect(prefixed('habiller', 'déshabiller')?.base).toBe('habiller');
    expect(prefixed('chaud', 'froid')).toBeNull();
  });
});

describe('contraires : makeItem', () => {
  const ant = new Map<string, Set<string>>();
  const syn = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, x: string, y: string) => m.set(x, (m.get(x) ?? new Set()).add(y));
  for (const p of ANTONYMS) (add(ant, p.a, p.b), add(ant, p.b, p.a));
  for (const p of SYNONYMS) (add(syn, p.a, p.b), add(syn, p.b, p.a));

  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level} : une seule bonne réponse, jamais un autre bon mot en distracteur`, () => {
      for (let seed = 1; seed <= 400; seed++) {
        const item = game.makeItem(level, seeded(seed), []);
        const choices = item.choices!;
        expect(choices.length).toBe(level === 1 ? 3 : 4);
        expect(choices.filter((c) => c.correct)).toHaveLength(1);
        expect(new Set(choices.map((c) => c.label)).size).toBe(choices.length);
        expect(item.key).not.toBe('');
        expect(item.say).toBeTruthy();
        expect(EMOJI_RE.test(item.say!)).toBe(false);
        expect(item.explain).toBeTruthy();
        const [kind, rest] = item.key.split(':');
        const [w, answer] = rest.split('>');
        if (level === 1) expect(kind).toBe('ant');
        if (level === 3) expect(kind).toBe('syn');
        const rel = kind === 'ant' ? ant : syn;
        expect(rel.get(w)?.has(answer)).toBe(true);
        expect(choices.find((c) => c.correct)!.label).toBe(answer);
        for (const c of choices.filter((c) => !c.correct)) {
          expect(rel.get(w)?.has(c.label) ?? false, `${w} → ${c.label}`).toBe(false);
          expect(c.label).not.toBe(w);
        }
        // Images : toutes ou aucune.
        const withEmoji = choices.filter((c) => c.emoji).length;
        expect([0, choices.length]).toContain(withEmoji);
      }
    });
  }
});
