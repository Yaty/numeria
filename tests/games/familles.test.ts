import { describe, expect, it } from 'vitest';
import { FAMILIES, checkAnswer, normalize, pointsFor } from '../../src/data/familles';
import { ranking } from '../../src/games/familles';

const all = Object.values(FAMILIES).flat();
const fam = (w: string) => all.find((f) => f.word === w)!;

describe('familles de mots : données', () => {
  it('15 familles par niveau, au moins 4 mots chacune, sans doublon', () => {
    for (const level of [1, 2, 3] as const) {
      expect(FAMILIES[level].length).toBeGreaterThanOrEqual(15);
      for (const f of FAMILIES[level]) {
        expect(f.members.length, f.word).toBeGreaterThanOrEqual(4);
        expect(new Set(f.members.map(normalize)).size, f.word).toBe(f.members.length);
        expect(f.members.map((m) => normalize(m, true)), f.word).not.toContain(normalize(f.word, true));
      }
    }
    const words = all.map((f) => f.word);
    expect(new Set(words).size).toBe(words.length);
  });
});

describe('familles de mots : réponses', () => {
  it('accepte sans accents ni majuscules, au pluriel ou au féminin', () => {
    expect(checkAnswer(fam('gonfle'), 'gonflable', [])).toEqual({ ok: true, member: 'gonflable' });
    expect(checkAnswer(fam('gonfle'), '  Degonfler ', [])).toEqual({ ok: true, member: 'dégonfler' });
    expect(checkAnswer(fam('gonfle'), 'gonflables', [])).toEqual({ ok: true, member: 'gonflable' });
    expect(checkAnswer(fam('dent'), 'dentaires', [])).toEqual({ ok: true, member: 'dentaire' });
    expect(checkAnswer(fam('laver'), 'lave vaisselle', [])).toEqual({ ok: true, member: 'lave-vaisselle' });
    expect(checkAnswer(fam('main'), 'manoeuvre', [])).toEqual({ ok: true, member: 'manœuvre' });
    expect(checkAnswer(fam('jour'), "aujourd'hui", [])).toEqual({ ok: true, member: 'aujourd’hui' });
  });

  it('refuse le mot de départ, les doublons, les mots hors famille', () => {
    expect(checkAnswer(fam('gonfle'), 'gonfle', [])).toMatchObject({ ok: false, reason: 'depart' });
    expect(checkAnswer(fam('gonfle'), 'gonfles', [])).toMatchObject({ ok: false, reason: 'depart' });
    expect(checkAnswer(fam('gonfle'), 'gonflé', [])).toEqual({ ok: true, member: 'gonflé' });
    expect(checkAnswer(fam('gonfle'), 'gonflable', ['gonflable'])).toMatchObject({ ok: false, reason: 'deja' });
    expect(checkAnswer(fam('gonfle'), 'gonflables', ['gonflable'])).toMatchObject({ ok: false, reason: 'deja' });
    expect(checkAnswer(fam('gonfle'), 'ballon', [])).toMatchObject({ ok: false, reason: 'inconnu' });
    expect(checkAnswer(fam('gonfle'), '   ', [])).toMatchObject({ ok: false, reason: 'vide' });
  });

  it('un mot de la liste passe avant les variantes du mot de départ', () => {
    expect(checkAnswer(fam('ami'), 'amie', [])).toEqual({ ok: true, member: 'amie' });
    expect(checkAnswer(fam('fort'), 'forte', [])).toEqual({ ok: true, member: 'forte' });
  });
});

describe('familles de mots : points et classement', () => {
  it('chercher loin rapporte plus', () => {
    expect([1, 2, 3].map(pointsFor)).toEqual([10, 20, 30]);
  });

  it('classement par points, puis par nombre de mots', () => {
    const p = (name: string, score: number, words: number) => ({
      name,
      score,
      played: [{ family: fam('dent'), found: Array.from({ length: words }, (_, i) => fam('dent').members[i]) }],
    });
    expect(ranking([p('A', 30, 2), p('B', 60, 3), p('C', 30, 3)]).map((x) => x.name)).toEqual(['B', 'C', 'A']);
  });
});
