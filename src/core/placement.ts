/**
 * Questionnaire pour « atterrir » à un niveau : des paliers de difficulté
 * croissante (A → E). Deux erreurs dans un palier arrêtent le questionnaire.
 */
import type { UniverseLevel } from './economy';
import { PROBLEM_LEVELS, type ProblemLevel, type Segment, type Visual } from './problems';

export interface PlacementItem {
  tier: number;
  tag?: 'grands-nombres' | 'decimaux';
  statement: Segment[];
  answer: number;
  visual?: Visual;
}

export const PLACEMENT_ITEMS: PlacementItem[] = [
  { tier: 1, statement: ['Écris ce nombre en chiffres : ', { n: 47, code: 'verbal' }], answer: 47 },
  { tier: 1, statement: ['Combien font 7 + 5 ?'], answer: 12 },
  { tier: 1, statement: ['Combien font 15 − 6 ?'], answer: 9 },
  { tier: 2, statement: ['Écris ce nombre en chiffres : ', { n: 2004, code: 'verbal' }], answer: 2004, tag: 'grands-nombres' },
  { tier: 2, statement: ['Combien de dizaines y a-t-il en tout dans 340 ?'], answer: 34 },
  { tier: 2, statement: ['Combien font 6 × 4 ?'], answer: 24 },
  { tier: 2, statement: ['On partage 24 billes entre 3 enfants. Combien chacun en a-t-il ?'], answer: 8 },
  { tier: 3, statement: ['Écris ce nombre en chiffres : ', { n: 3050000, code: 'verbal' }], answer: 3050000, tag: 'grands-nombres' },
  { tier: 3, statement: ['3 cahiers coûtent 6 €. Combien coûtent 5 cahiers ?'], answer: 10 },
  { tier: 3, statement: ['Léa achète 4 paquets de 25 images, puis en donne 30. Combien lui en reste-t-il ?'], answer: 70 },
  {
    tier: 4,
    statement: ['La machine à nombres transforme les nombres. Quel nombre sort si on met 6 ?'],
    answer: 18,
    visual: { type: 'machine', rule: null, pairs: [[2, 6], [4, 12], [10, 30]], input: 6 },
  },
  { tier: 4, statement: ['Combien font 12,5 + 0,5 ?'], answer: 13, tag: 'decimaux' },
  { tier: 4, statement: ['Écris ce nombre en chiffres : ', { n: 3.25, code: 'verbal' }], answer: 3.25, tag: 'decimaux' },
  { tier: 5, statement: ['Combien vaut ', { text: '10³', say: 'dix puissance trois' }, ' ?'], answer: 1000 },
  { tier: 5, statement: ['Combien vaut ', { text: '5²', say: 'cinq au carré' }, ' ?'], answer: 25 },
];

export interface PlacementResult {
  universe: UniverseLevel;
  level: ProblemLevel;
}

export class PlacementSession {
  private index = 0;
  private stopped = false;
  private failedTier: number | null = null;
  private readonly results: { item: PlacementItem; correct: boolean }[] = [];

  current(): PlacementItem | null {
    if (this.stopped || this.index >= PLACEMENT_ITEMS.length) return null;
    return PLACEMENT_ITEMS[this.index];
  }

  answer(value: number): boolean {
    const item = this.current();
    if (!item) return false;
    const correct = Math.abs(value - item.answer) < 1e-9;
    this.results.push({ item, correct });
    this.index++;
    const errors = this.results.filter((r) => r.item.tier === item.tier && !r.correct).length;
    if (errors >= 2) {
      this.stopped = true;
      this.failedTier = item.tier;
    }
    return correct;
  }

  result(): PlacementResult {
    const tier = this.failedTier ?? PROBLEM_LEVELS.length;
    const passedTag = (tag: PlacementItem['tag']) => {
      const tagged = this.results.filter((r) => r.item.tag === tag);
      return tagged.length > 0 && tagged.every((r) => r.correct);
    };
    let universe: UniverseLevel = 1;
    if (passedTag('grands-nombres')) universe = passedTag('decimaux') ? 3 : 2;
    return { universe, level: PROBLEM_LEVELS[tier - 1] };
  }
}
