import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { distractors, fmt, game, landmark, makeLine, pickTarget, snap, spoken, type Level } from '../../src/games/ligne-numerique';

const LEVELS: Level[] = [1, 2, 3, 4, 5];

describe('ligne numérique : lignes', () => {
  it('chaque niveau respecte ses bornes', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const rng = seeded(seed);
      const l1 = makeLine(1, rng);
      expect(l1.start).toBe(0);
      expect(l1.end).toBeGreaterThanOrEqual(100);
      expect(l1.end).toBeLessThanOrEqual(1000);
      const l2 = makeLine(2, rng);
      expect(l2.start).toBeGreaterThan(0);
      expect(l2.end).toBeLessThanOrEqual(1000);
      expect(l2.end - l2.start).toBeGreaterThanOrEqual(40);
      const l3 = makeLine(3, rng);
      expect(l3.end).toBe(0);
      expect(l3.start).toBeGreaterThanOrEqual(-1000);
      const l4 = makeLine(4, rng);
      expect(l4.start).toBeLessThan(0);
      expect(l4.end).toBeGreaterThan(0);
      expect(l4.start).toBeGreaterThanOrEqual(-1000);
      expect(l4.end).toBeLessThanOrEqual(1000);
    }
  });

  it('niveau 5 : des virgules et des grands nombres', () => {
    const steps = new Set<number>();
    const ends = new Set<number>();
    for (let seed = 1; seed <= 400; seed++) {
      const l = makeLine(5, seeded(seed));
      steps.add(l.step);
      ends.add(l.end);
    }
    expect([...steps].some((s) => s <= 0.001)).toBe(true);
    expect([...ends].some((e) => e >= 1000000)).toBe(true);
  });

  it('les nombres demandés tombent sur le pas, entre 5 % et 95 % de la ligne', () => {
    for (const level of LEVELS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = seeded(seed);
        const line = makeLine(level, rng);
        const t = pickTarget(line, rng);
        const f = (t - line.start) / (line.end - line.start);
        expect(f).toBeGreaterThanOrEqual(0.04);
        expect(f).toBeLessThanOrEqual(0.96);
        expect(snap(t, line)).toBe(t);
        expect(String(t)).not.toMatch(/\d{6,}\.|\.\d{5,}/); // pas de 0,30000000000000004
      }
    }
  });
});

describe('ligne numérique : écriture et repères', () => {
  it('écriture française', () => {
    expect(fmt(1000)).toBe('1 000');
    expect(fmt(-250)).toBe('−250');
    expect(fmt(0.045)).toBe('0,045');
    expect(fmt(1000000)).toBe('1 000 000');
    expect(spoken(-380)).toBe('moins trois-cent-quatre-vingts');
    expect(spoken(2.5)).toBe('deux virgule cinq');
  });

  it('repères', () => {
    expect(landmark(0.5)).toBe('au milieu');
    expect(landmark(0.26)).toBe('au quart');
    expect(landmark(0.45)).toBe('un peu avant le milieu');
    expect(landmark(0.8)).toBe('un peu après les trois quarts');
    expect(landmark(0.06)).toBe('un peu après le début');
    expect(landmark(0.95)).toBe('un peu avant la fin');
  });

  it('distracteurs distincts, sur la ligne, loin de la bonne réponse', () => {
    for (const level of LEVELS) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = seeded(seed);
        const line = makeLine(level, rng);
        const t = pickTarget(line, rng);
        const d = distractors(t, line, rng);
        expect(d.length).toBe(3);
        expect(new Set([t, ...d]).size).toBe(4);
        for (const x of d) {
          expect(x).toBeGreaterThanOrEqual(line.start);
          expect(x).toBeLessThanOrEqual(line.end);
          expect(Math.abs(x - t)).toBeGreaterThanOrEqual((line.end - line.start) * 0.1 - 1e-9);
        }
      }
    }
  });
});

describe('ligne numérique : items', () => {
  it('cinq niveaux, items valides, pas d’émoji ni de chiffre dans la voix', () => {
    expect(game.levels).toHaveLength(5);
    for (const level of LEVELS) {
      for (let seed = 1; seed <= 100; seed++) {
        const item = game.makeItem(level, seeded(seed), []);
        expect(item.key).toMatch(/^nl:/);
        expect(item.custom).toBeTypeOf('function');
        expect(item.say).not.toMatch(/\d/);
        expect(item.explain).toBeTruthy();
      }
    }
  });
});
