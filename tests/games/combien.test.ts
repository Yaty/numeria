import { describe, expect, it } from 'vitest';
import { seeded } from '../../src/core/random';
import { COMPARE_PAIRS, FINGERS, game, makeSpec, specKey, type Pt, BIG_R, SMALL_R } from '../../src/games/combien';

const EMOJI = /\p{Extended_Pictographic}/u;

function noOverlap(pts: Pt[]): boolean {
  return pts.every((p, i) => pts.every((q, j) => i === j || Math.hypot(p.x - q.x, p.y - q.y) >= p.r + q.r));
}

describe('combien : données', () => {
  it('paires de comparaison : rapport ≤ 2/3', () => {
    expect(new Set(COMPARE_PAIRS.map((p) => p.join())).size).toBe(COMPARE_PAIRS.length);
    for (const [a, b] of COMPARE_PAIRS) expect(a / b).toBeLessThanOrEqual(2 / 3);
  });
  it('doigts : 5 par main', () => {
    expect(Object.keys(FINGERS).map(Number)).toEqual([5, 6, 7, 10]);
  });
  it('essais en conflit : la plus nombreuse a la plus petite surface totale', () => {
    for (const [few, many] of COMPARE_PAIRS) expect(many * SMALL_R ** 2).toBeLessThan(few * BIG_R ** 2);
  });
});

describe('combien : items', () => {
  for (const level of [1, 2, 3] as const) {
    it(`niveau ${level} : specs cohérentes`, () => {
      const kinds = new Set<string>();
      for (let seed = 1; seed <= 400; seed++) {
        const s = makeSpec(level, seeded(seed));
        kinds.add(s.kind);
        if (s.kind === 'count') {
          expect(s.choices).toContain(s.n);
          expect(new Set(s.choices).size).toBe(s.choices.length);
          expect(s.choices.length).toBeGreaterThanOrEqual(4);
          if (level === 1) {
            expect(s.n).toBeGreaterThanOrEqual(1);
            expect(s.n).toBeLessThanOrEqual(5);
            expect(s.flashMs).toBe(1500);
          } else {
            expect(s.n).toBeGreaterThanOrEqual(4);
            expect(s.n).toBeLessThanOrEqual(10);
            expect(s.flashMs).toBe(1200);
          }
          if (s.display === 'doigts') expect(FINGERS[s.n]).toBeTruthy();
          else expect(s.points.length).toBe(s.n);
          if (s.dice) expect(s.dice[0] + s.dice[1]).toBe(s.n);
          expect(noOverlap(s.points)).toBe(true);
        } else if (s.kind === 'compare') {
          expect(s.left.length).not.toBe(s.right.length);
          expect(noOverlap(s.left) && noOverlap(s.right)).toBe(true);
          const [many, few] = s.left.length > s.right.length ? [s.left, s.right] : [s.right, s.left];
          expect(many[0].r < few[0].r).toBe(s.conflict);
        } else if (s.kind === 'line') {
          expect(s.marks).toContain(s.target);
          expect(s.marks.length).toBe(3);
          const gap = s.max === 10 ? 2 : 4;
          for (let i = 1; i < 3; i++) expect(s.marks[i] - s.marks[i - 1]).toBeGreaterThanOrEqual(gap);
          for (const m of s.marks) expect(m > 0 && m < s.max).toBe(true);
        } else {
          expect(s.a).not.toBe(s.b);
          expect(Math.max(s.a, s.b)).toBeLessThanOrEqual(100);
          if (s.trap === 'unites') {
            const [big, small] = [Math.max(s.a, s.b), Math.min(s.a, s.b)];
            expect(small % 10).toBeGreaterThan(big % 10);
          }
        }
      }
      const expected = level === 1 ? ['count'] : level === 2 ? ['compare', 'count'] : ['line', 'written'];
      expect([...kinds].sort()).toEqual(expected);
    });

    it(`niveau ${level} : makeItem sur 300 graines`, () => {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = seeded(seed);
        const item = game.makeItem(level, rng, []);
        expect(item.key.length).toBeGreaterThan(0);
        expect(EMOJI.test(item.say ?? item.prompt)).toBe(false);
        expect(item.explain).toBeTruthy();
        if (item.choices) {
          expect(item.choices.filter((c) => c.correct).length).toBe(1);
          expect(new Set(item.choices.map((c) => c.label)).size).toBe(item.choices.length);
          for (const c of item.choices) expect(EMOJI.test(c.say ?? '')).toBe(false);
        } else {
          expect(typeof item.custom).toBe('function');
        }
      }
    });
  }

  it('clés stables', () => {
    expect(specKey({ kind: 'line', max: 10, target: 7, marks: [2, 7, 9] })).toBe('ligne10:7');
  });
});
