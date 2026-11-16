import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { TEXTS, game, layout, pickText, type Level } from '../../src/games/qui-ou-quand';
import { QUESTIONS, option } from '../../src/data/inferences/types';

const LEVELS: Level[] = [1, 2, 3, 4];
const all = LEVELS.flatMap((l) => TEXTS[l]);
// Une séquence émoji : pictogrammes, sélecteurs de variante, ZWJ, modificateurs, drapeaux, keycaps.
const EMOJI = /^(?:[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}‍️⃣#*0-9])+$/u;

describe('qui, où, quand, quoi : données', () => {
  it('chaque niveau a assez de textes pour une partie', () => {
    for (const l of LEVELS) expect(TEXTS[l].length, `niveau ${l}`).toBeGreaterThanOrEqual(game.itemsPerRound ?? 10);
    expect(game.levels).toHaveLength(4);
  });

  it('identifiants et textes uniques', () => {
    expect(new Set(all.map((x) => x.id)).size).toBe(all.length);
    expect(new Set(all.map((x) => x.text)).size).toBe(all.length);
  });

  it('4 questions, 3 images distinctes avec légende', () => {
    for (const x of all) {
      expect(x.text.length, x.id).toBeGreaterThan(20);
      expect(x.text, x.id).not.toMatch(/ [,.]|\s{2}/);
      for (const q of QUESTIONS) {
        const opts = x.questions[q];
        expect(opts, `${x.id} ${q}`).toHaveLength(3);
        for (const o of opts) {
          expect(o.emoji, `${x.id} ${q} « ${o.emoji} ${o.label} »`).toMatch(EMOJI);
          expect(o.label.length, `${x.id} ${q}`).toBeGreaterThan(1);
        }
        expect(new Set(opts.map((o) => o.label)).size, `${x.id} ${q} légendes`).toBe(3);
        expect(new Set(opts.map((o) => o.emoji)).size, `${x.id} ${q} émojis`).toBe(3);
      }
    }
  });

  it('lecture d’une option', () => {
    expect(option(' 🧑‍🚒 les pompiers ')).toEqual({ emoji: '🧑‍🚒', label: 'les pompiers' });
  });
});

describe('qui, où, quand, quoi : partie', () => {
  it('une seule bonne image par question, mélangée', () => {
    const rng = seeded(3);
    const positions = new Set<number>();
    for (const x of TEXTS[1]) {
      for (const q of layout(x, rng)) {
        expect(q.options.filter((o) => o.correct)).toHaveLength(1);
        expect(q.options.find((o) => o.correct)!.option).toEqual(x.questions[q.id][0]);
        positions.add(q.options.findIndex((o) => o.correct));
      }
    }
    expect(positions.size).toBe(3);
  });

  it('évite les textes déjà vus', () => {
    const rng = seeded(9);
    const recent: string[] = [];
    for (let i = 0; i < TEXTS[1].length; i++) {
      const item = game.makeItem(1, rng, recent);
      expect(recent).not.toContain(item.key);
      recent.push(item.key);
    }
    // tout vu : on repioche quand même
    expect(pickText(1, rng, recent)).toBeDefined();
  });
});
