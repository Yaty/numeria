import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { ITEMS, TARGETS, game, makeRound, positionOf, spelled, targetFor } from '../../src/games/ecureuil';
import { WORDS, soundsOf } from '../../src/data/sons';
import type { SoundId } from '../../src/portal/gestes';

const word = (w: string) => WORDS.find((x) => x[0] === w)!;

describe('réserve de l’écureuil : données', () => {
  it('assez de sons jouables à chaque niveau', () => {
    expect(TARGETS[1].length).toBeGreaterThanOrEqual(10);
    expect(TARGETS[2].length).toBeGreaterThanOrEqual(5);
    expect(TARGETS[3].length).toBeGreaterThanOrEqual(8);
  });

  it('position du son dans le mot', () => {
    expect(positionOf(word('vache'), 'ch')).toBe('fin');
    expect(positionOf(word('chat'), 'ch')).toBe('début');
    expect(positionOf(word('cochon'), 'ch')).toBe('milieu');
    expect(spelled(word('vache'))).toBe('v · a · ch');
    const r = makeRound(3, seeded(1), []);
    expect(r.baskets.map((b) => b.caption)).toEqual(['au début', 'au milieu', 'à la fin']);
  });
});

describe('réserve de l’écureuil : items', () => {
  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level} : la bonne réponse correspond au mot`, () => {
      const rng = seeded(level * 7);
      for (let i = 0; i < 300; i++) {
        const r = makeRound(level, rng, []);
        const sounds = soundsOf(r.word);
        expect(r.baskets.map((b) => b.id)).toContain(r.answer);
        if (level === 1) expect(r.answer === 'oui').toBe(sounds.includes(r.target as SoundId));
        if (level === 2) {
          const [a, b] = r.target.split('/') as SoundId[];
          expect(sounds.includes(a) !== sounds.includes(b)).toBe(true);
          expect(sounds).toContain(r.answer);
        }
        if (level === 3) {
          expect(sounds.filter((s) => s === r.target)).toHaveLength(1);
          expect(r.answer).toBe(positionOf(r.word, r.target as SoundId));
        }
      }
    });
  }

  it('le même son pendant toute une partie, puis un autre', () => {
    const rng = seeded(3);
    const recent: string[] = [];
    const targets: string[] = [];
    for (let i = 0; i < ITEMS * 2; i++) {
      const item = game.makeItem(1, rng, recent);
      recent.push(item.key);
      targets.push(item.key.split(':')[2]);
    }
    expect(new Set(targets.slice(0, ITEMS)).size).toBe(1);
    expect(new Set(targets.slice(ITEMS)).size).toBe(1);
    expect(targets[ITEMS]).not.toBe(targets[0]);
    expect(targetFor(2, rng, recent)).toContain('/');
  });

  it('jeu sans voix', () => {
    expect(game.silent).toBe(true);
  });
});
