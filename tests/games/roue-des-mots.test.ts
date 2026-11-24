import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { ASSOCIATIONS, GROUPS, POOLS, THINGS, familyOf, type GroupId } from '../../src/data/roue-des-mots';
import {
  AXES,
  aLabel,
  buildRiddle,
  buildWheel,
  clueText,
  distinguishable,
  game,
  optionText,
  question,
  rightOf,
  wrongOf,
  type Level,
} from '../../src/games/roue-des-mots';

const EMOJI = /^(?:[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}‍️⃣#*0-9])+$/u;
const HAS_EMOJI = /\p{Extended_Pictographic}/u;
const FEATURE_AXES = ['fonction', 'lieu', 'description', 'association'] as const;

describe('roue des mots : données', () => {
  it('identifiants, noms et images uniques', () => {
    expect(new Set(THINGS.map((x) => x.id)).size).toBe(THINGS.length);
    expect(new Set(THINGS.map((x) => x.nom)).size).toBe(THINGS.length);
    expect(new Set(THINGS.map((x) => x.emoji)).size).toBe(THINGS.length);
    for (const x of THINGS) expect(x.emoji, x.id).toMatch(EMOJI);
    for (const a of Object.values(ASSOCIATIONS)) expect(a.emoji, a.label).toMatch(EMOJI);
  });

  it('tous les traits cités existent, sans doublon ni contradiction', () => {
    for (const x of THINGS) {
      for (const axis of FEATURE_AXES) {
        const known = axis === 'association' ? ASSOCIATIONS : POOLS[familyOf(x)][axis];
        const { oui, aussi } = x[axis];
        for (const id of [...oui, ...aussi]) expect(known[id], `${x.id} ${axis} ${id}`).toBeDefined();
        expect(new Set([...oui, ...aussi]).size, `${x.id} ${axis} doublon ou oui/aussi à la fois`).toBe(oui.length + aussi.length);
      }
    }
  });

  it('chaque objet a une fonction, au moins 2 lieux et 2 descriptions, et assez de pièges', () => {
    for (const x of THINGS) {
      expect(x.fonction.oui.length, `${x.id} fonction`).toBeGreaterThan(0);
      expect(x.lieu.oui.length, `${x.id} lieu`).toBeGreaterThanOrEqual(2);
      expect(x.description.oui.length, `${x.id} description`).toBeGreaterThanOrEqual(2);
      for (const axis of AXES) {
        if (!rightOf(x, axis).length) continue;
        // roue complète : 4 propositions, dont 1 juste au moins
        expect(wrongOf(x, axis).length, `${x.id} ${axis} : pièges`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('chaque groupe a au moins 3 objets, chaque famille de quoi faire une devinette fine', () => {
    for (const g of Object.keys(GROUPS) as GroupId[]) expect(THINGS.filter((x) => x.groupe === g).length, g).toBeGreaterThanOrEqual(3);
  });

  it('un piège n’est jamais une bonne réponse', () => {
    for (const x of THINGS) for (const axis of AXES) for (const id of wrongOf(x, axis)) expect(rightOf(x, axis), `${x.id} ${axis}`).not.toContain(id);
  });
});

describe('roue des mots : phrases', () => {
  const byId = (id: string) => THINGS.find((x) => x.id === id)!;

  it('accords et pronoms', () => {
    expect(question(byId('vache'), 'fonction')).toBe('Qu’est-ce qu’elle fait ?');
    expect(optionText(byId('vache'), 'fonction', 'meugle')).toBe('Elle meugle');
    expect(optionText(byId('pomme'), 'description', 'rond')).toBe('Elle est ronde');
    expect(optionText(byId('banane'), 'fonction', 'cru')).toBe('crue');
    expect(clueText(byId('banane'), 'fonction', 'cru')).toBe('On la mange crue.');
    expect(clueText(byId('citron'), 'lieu', 'arbre')).toBe('Il pousse sur un arbre.');
    expect(clueText(byId('casquette'), 'association', 'soleil')).toBe('Ça fait penser au soleil.');
    expect(clueText(byId('lion'), 'groupe', 'animal')).toBe('C’est un animal.');
    expect(question(byId('chaise'), 'lieu')).toBe('Où on peut la trouver ?');
    expect(optionText(byId('pomme'), 'lieu', 'marche')).toBe('On l’achète au marché');
    expect(optionText(byId('lion'), 'lieu', 'zoo')).toBe('On le voit au zoo');
    expect(clueText(byId('casquette'), 'lieu', 'tete')).toBe('On la met sur la tête.');
    expect(aLabel('les vacances')).toBe('aux vacances');
  });

  it('aucune phrase vide, sans double espace ni espace avant le point', () => {
    for (const x of THINGS) {
      for (const axis of AXES) {
        for (const id of [...rightOf(x, axis), ...wrongOf(x, axis)]) {
          for (const s of [optionText(x, axis, id), clueText(x, axis, id)]) {
            expect(s, `${x.id} ${axis} ${id}`).not.toMatch(/\s{2}| \.|^\s|\s$/);
            expect(s.length).toBeGreaterThan(2);
          }
        }
      }
    }
  });
});

describe('roue des mots : parties', () => {
  it('roue : bonnes réponses justes, pièges faux, propositions distinctes', () => {
    for (const level of [1, 2] as const) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = seeded(seed);
        const x = THINGS[seed % THINGS.length];
        const panels = buildWheel(x, level, rng);
        expect(panels.length, x.id).toBe(level === 1 ? 3 : AXES.filter((a) => rightOf(x, a).length).length);
        for (const p of panels) {
          expect(p.options.length).toBe(level === 1 ? 3 : p.need === 3 ? 5 : 4);
          expect(new Set(p.options.map((o) => o.text)).size, `${x.id} ${p.axis}`).toBe(p.options.length);
          const right = p.options.filter((o) => o.correct);
          expect(right.length).toBe(p.need);
          if (level === 1 || p.axis === 'groupe') expect(p.need).toBe(1);
          if (level === 2 && (p.axis === 'lieu' || p.axis === 'description')) expect(p.need, `${x.id} ${p.axis}`).toBeGreaterThanOrEqual(2);
          for (const o of right) expect(rightOf(x, p.axis)).toContain(o.id);
          for (const o of p.options.filter((o) => !o.correct)) expect(wrongOf(x, p.axis)).toContain(o.id);
        }
      }
    }
  });

  it('devinette : 4 images distinctes, la bonne parmi elles, chaque intrus contredit par un indice', () => {
    for (const level of [3, 4] as const) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = seeded(seed);
        const x = THINGS[seed % THINGS.length];
        const r = buildRiddle(x, level, rng);
        expect(r.choices).toHaveLength(4);
        expect(new Set(r.choices.map((d) => d.id)).size).toBe(4);
        expect(r.choices).toContain(x);
        for (const d of r.choices) if (d !== x) expect(distinguishable(x, d), `${x.id} / ${d.id}`).toBe(true);
        if (level === 3) {
          expect(r.clues.at(-1)!.axis).toBe('groupe');
          expect(new Set(r.choices.map((d) => d.groupe)).size).toBe(4);
        } else {
          expect(r.clues[0].axis).toBe('groupe');
          // au moins un intrus du même groupe
          expect(r.choices.filter((d) => d !== x && d.groupe === x.groupe).length).toBeGreaterThanOrEqual(1);
        }
        expect(r.clues.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('devinette fine : chaque objet a au moins 2 voisins du même groupe à distinguer', () => {
    for (const x of THINGS) {
      const same = THINGS.filter((d) => d.groupe === x.groupe && distinguishable(x, d));
      expect(same.length, x.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('makeItem : clé, consigne et voix sans émoji, sur 300 graines par niveau', () => {
    for (const level of [1, 2, 3, 4] as Level[]) {
      const rng = seeded(level * 7);
      const recent: string[] = [];
      for (let i = 0; i < 300; i++) {
        const item = game.makeItem(level, rng, recent);
        expect(item.key).toMatch(new RegExp(`^roue:${level}:`));
        expect(item.custom).toBeTypeOf('function');
        expect(item.say ?? item.prompt).not.toMatch(HAS_EMOJI);
        expect(item.explain ?? '').not.toMatch(HAS_EMOJI);
        recent.push(item.key);
      }
    }
  });

  it('évite les objets vus récemment', () => {
    const rng = seeded(5);
    const recent: string[] = [];
    for (let i = 0; i < 20; i++) {
      const item = game.makeItem(1, rng, recent);
      expect(recent).not.toContain(item.key);
      recent.push(item.key);
    }
  });
});
