import { describe, expect, it } from 'vitest';
import { FAMILIES, checkAnswer, normalize, parseFamily, pointsFor } from '../../src/data/familles';
import { ranking } from '../../src/games/familles';

const all = Object.values(FAMILIES).flat();
const fam = (w: string) => all.find((f) => f.word === w)!;

describe('familles de mots : données', () => {
  it('au moins 14 familles par niveau, au moins 4 mots chacune, sans doublon', () => {
    for (const level of [1, 2] as const) {
      expect(FAMILIES[level].length).toBeGreaterThanOrEqual(14);
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

  it('accepte -é à la place de -er', () => {
    expect(checkAnswer(fam('jardin'), 'jardiné', [])).toEqual({ ok: true, member: 'jardiner' });
    expect(checkAnswer(fam('neige'), 'déneigées', [])).toEqual({ ok: true, member: 'déneiger' });
    expect(checkAnswer(fam('gonfle'), 'degonfle', [])).toEqual({ ok: true, member: 'dégonflé' });
    expect(checkAnswer(fam('jardin'), 'jardinés', ['jardiner'])).toMatchObject({ ok: false, reason: 'deja' });
    expect(checkAnswer(fam('laver'), 'lavé', [])).toMatchObject({ ok: false, reason: 'depart' });
  });

  it('un mot de la liste passe avant les variantes du mot de départ', () => {
    expect(checkAnswer(fam('ami'), 'amie', [])).toEqual({ ok: true, member: 'amie' });
    expect(checkAnswer(fam('fort'), 'forte', [])).toEqual({ ok: true, member: 'forte' });
  });
});

describe('familles créées par les joueurs', () => {
  it('lit les mots séparés par virgules ou lignes, sans doublon ni mot de départ', () => {
    expect(parseFamily(' poule ', 'poulet, poussin\n Poulet ;poulailler\n\npoule')).toEqual({
      word: 'poule',
      members: ['poulet', 'poussin', 'poulailler'],
    });
  });

  it('refuse une famille sans mot de départ ou sans mot', () => {
    expect(parseFamily('  ', 'poulet')).toBeTypeOf('string');
    expect(parseFamily('poule', ' , \n')).toBeTypeOf('string');
  });

  it('se joue comme les autres', () => {
    const f = parseFamily('poule', 'poulailler') as ReturnType<typeof fam>;
    expect(checkAnswer(f, 'poulaillers', [])).toEqual({ ok: true, member: 'poulailler' });
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
