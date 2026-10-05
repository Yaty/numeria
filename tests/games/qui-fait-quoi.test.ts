import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { ACTIVITIES, ANIMALS, PEOPLE, VERBS, game, makeItemFor, ppOf, sentences } from '../../src/games/qui-fait-quoi';

const EMOJI_RE = /\p{Extended_Pictographic}/u;
const byNoun = (n: string) => ANIMALS.find((a) => a.noun === n)!;
const verb = (pres: string) => VERBS.find((v) => v.pres === pres)!;
const chien = byNoun('chien');
const chat = byNoun('chat');
const vache = byNoun('vache');
const souris = byNoun('souris');
const lapin = byNoun('lapin');
const pousse = verb('pousse');

describe('qui fait quoi : données', () => {
  it('animaux, verbes, prénoms et activités sans doublon', () => {
    for (const xs of [ANIMALS.map((a) => a.noun), ANIMALS.map((a) => a.emoji), VERBS.map((v) => v.pres), PEOPLE.map((p) => p.name), ACTIVITIES.map((a) => a.inf), ACTIVITIES.map((a) => a.emoji)])
      expect(new Set(xs).size).toBe(xs.length);
    expect(ANIMALS.some((a) => a.g === 'f')).toBe(true);
    expect(PEOPLE.some((p) => p.g === 'f')).toBe(true);
  });

  it('participes passés : le féminin ajoute un e', () => {
    for (const v of VERBS) {
      expect(v.pp).toMatch(/(é|i|u)$/);
      expect(ppOf(v, 'f')).toBe(`${v.pp}e`);
      expect(ppOf(v, 'm')).toBe(v.pp);
    }
    expect(ppOf(verb('suit'), 'f')).toBe('suivie');
    expect(ppOf(verb('attend'), 'f')).toBe('attendue');
  });
});

describe('qui fait quoi : phrases et accords', () => {
  it('active, passive, clivées', () => {
    expect(sentences.active(chien, pousse, chat)).toBe('Le chien pousse le chat.');
    expect(sentences.passive(chien, pousse, chat)).toBe('Le chat est poussé par le chien.');
    expect(sentences.passive(chien, pousse, vache)).toBe('La vache est poussée par le chien.');
    expect(sentences.passive(vache, verb('suit'), souris)).toBe('La souris est suivie par la vache.');
    expect(sentences.passive(vache, verb('attend'), chat)).toBe('Le chat est attendu par la vache.');
    expect(sentences.cleftObject(chien, pousse, chat)).toBe('C’est le chat que le chien pousse.');
    expect(sentences.cleftSubject(vache, pousse, chat)).toBe('C’est la vache qui pousse le chat.');
  });

  it('relatives et négation (avec élision de « ne »)', () => {
    expect(sentences.relativeObject(lapin, verb('regarde'), souris, 'rit')).toBe('Le lapin que la souris regarde rit.');
    expect(sentences.relativeSubject(lapin, verb('regarde'), souris, 'rit')).toBe('Le lapin qui regarde la souris rit.');
    expect(sentences.negationReversal(chat, pousse, chien)).toBe('Le chien ne pousse pas le chat : c’est le chat qui pousse le chien.');
    expect(sentences.negationReversal(chat, verb('attrape'), chien)).toBe('Le chien n’attrape pas le chat : c’est le chat qui attrape le chien.');
    expect(sentences.negationCleft(chien, pousse, chat, vache)).toBe('Ce n’est pas le chien qui pousse le chat, c’est la vache.');
  });

  it('ordre temporel, accord du participe avec « être »', () => {
    const leo = PEOPLE.find((p) => p.name === 'Léo')!;
    const zoe = PEOPLE.find((p) => p.name === 'Zoé')!;
    const act = (inf: string) => ACTIVITIES.find((a) => a.inf === inf)!;
    expect(sentences.temporal(leo, act('lire'), act('dessiner'), 0)).toBe('Avant de dessiner, Léo lit.');
    expect(sentences.temporal(leo, act('lire'), act('dessiner'), 1)).toBe('Après avoir lu, Léo dessine.');
    expect(sentences.temporal(zoe, act('se laver'), act('lire'), 1)).toBe('Après s’être lavée, Zoé lit.');
    expect(sentences.temporal(leo, act('se laver'), act('lire'), 3)).toBe('Léo lit après s’être lavé.');
    expect(sentences.temporal(zoe, act('aller à la piscine'), act('chanter'), 3)).toBe('Zoé chante après être allée à la piscine.');
    expect(sentences.temporal(zoe, act('chanter'), act('aller à la piscine'), 0)).toBe('Avant d’aller à la piscine, Zoé chante.');
    expect(sentences.temporal(zoe, act('chanter'), act('se laver'), 2)).toBe('Zoé chante avant de se laver.');
  });

  it('toutes les passives générées accordent le participe avec le sujet', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const item = makeItemFor('passive', seeded(seed));
      const m = item.stimulus!.text!.match(/^(Le|La) (\S+) est (\S+) par (le|la) (\S+)\.$/)!;
      expect(m, item.stimulus!.text).not.toBeNull();
      const v = VERBS.find((x) => m[3] === x.pp || m[3] === `${x.pp}e`)!;
      expect(m[3]).toBe(m[1] === 'La' ? `${v.pp}e` : v.pp);
      expect(byNoun(m[2]).g).toBe(m[1] === 'La' ? 'f' : 'm');
    }
  });
});

describe('qui fait quoi : makeItem', () => {
  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level}`, () => {
      const asked = new Set<string>();
      for (let seed = 1; seed <= 400; seed++) {
        const item = game.makeItem(level, seeded(seed), []);
        const choices = item.choices!;
        expect(choices.length).toBe(3);
        expect(choices.filter((c) => c.correct)).toHaveLength(1);
        expect(new Set(choices.map((c) => c.label)).size).toBe(3);
        expect(new Set(choices.map((c) => c.emoji)).size).toBeGreaterThan(1);
        expect(item.key).not.toBe('');
        expect(EMOJI_RE.test(item.say!)).toBe(false);
        expect(item.say).toContain(item.stimulus!.text!);
        expect(item.explain).toBeTruthy();
        const tpl = item.key.split(':')[0];
        if (level === 1) expect(tpl).toBe('active');
        if (level === 2) expect(['passive', 'cleftObject', 'cleftSubject']).toContain(tpl);
        asked.add(item.key.split(':').pop()!);
      }
      // La question porte tantôt sur l’agent, tantôt sur le patient.
      if (level < 3) expect([...asked].sort()).toEqual(['agent', 'patient']);
    });
  }

  it('la bonne réponse correspond au rôle demandé (niveau 1)', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const item = game.makeItem(1, seeded(seed), []);
      const [, pres, roles, asked] = item.key.split(':');
      const [agent, patient] = roles.split('>');
      expect(item.stimulus!.text).toMatch(new RegExp(`^(Le|La) ${agent} ${pres} (le|la) ${patient}\\.$`));
      const right = item.choices!.find((c) => c.correct)!.label;
      expect(right.endsWith(` ${asked === 'agent' ? agent : patient}`)).toBe(true);
    }
  });
});
