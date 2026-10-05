import { describe, expect, it } from 'vitest';
import { generateProblem, isCorrect, kindsForLevel, type Problem, type ProblemContext } from '../src/core/problems';
import { seeded } from '../src/core/random';

const ALL_CODES = ['arabe', 'verbal', 'analogique'] as const;

function numbersIn(p: Problem): number[] {
  return p.statement.flatMap((s) => (typeof s === 'string' ? [] : [s.n]));
}

function many(ctx: ProblemContext, count = 300): Problem[] {
  const rng = seeded(42);
  return Array.from({ length: count }, () => generateProblem(ctx, rng));
}

describe('choix des types de problèmes', () => {
  it('chaque niveau inclut les précédents', () => {
    expect(kindsForLevel('A')).toEqual(['transcodage', 'addition', 'soustraction']);
    expect(kindsForLevel('B')).toContain('aire');
    expect(kindsForLevel('B')).toContain('addition');
    expect(kindsForLevel('C')).toContain('proportionnalite');
    expect(kindsForLevel('C')).toContain('deux-etapes');
    expect(kindsForLevel('D')).toContain('fonction');
    expect(kindsForLevel('E')).toContain('puissance');
    expect(kindsForLevel('A')).not.toContain('multiplication');
  });

  it('privilégie les types du niveau courant', () => {
    const ps = many({ level: 'B', maxClass: 0, codes: [...ALL_CODES] }, 500);
    const current = ps.filter((p) => ['multiplication', 'division', 'aire'].includes(p.kind)).length;
    expect(current / ps.length).toBeGreaterThan(0.5);
    expect(current / ps.length).toBeLessThan(0.7);
  });
});

describe('cohérence des problèmes', () => {
  for (const level of ['A', 'B', 'C', 'D', 'E'] as const) {
    for (const maxClass of [0, 1, 3]) {
      it(`niveau ${level}, classe ${maxClass} : réponses et choix valides`, () => {
        for (const p of many({ level, maxClass, codes: [...ALL_CODES] })) {
          expect(Number.isFinite(p.answer)).toBe(true);
          expect(p.answer).toBeGreaterThanOrEqual(0);
          expect(isCorrect(p, p.answer)).toBe(true);
          if (p.answerMode !== 'clavier') {
            expect(p.choices).toHaveLength(3);
            expect(new Set(p.choices).size).toBe(3);
            expect(p.choices).toContain(p.answer);
            expect(p.choices!.every((c) => c >= 0)).toBe(true);
          }
          if (p.answerMode === 'choix-analogique') expect(p.answer).toBeLessThan(1e6);
          for (const s of p.statement) {
            if (typeof s !== 'string' && s.code === 'analogique') expect(s.n).toBeLessThan(1e6);
          }
        }
      });
    }
  }

  it('addition : la réponse est la somme des données', () => {
    for (const p of many({ level: 'A', maxClass: 1, codes: ['arabe'] }).filter((x) => x.kind === 'addition')) {
      const [a, b] = numbersIn(p);
      expect(p.answer).toBe(a + b);
    }
  });

  it('division : toujours exacte', () => {
    for (const p of many({ level: 'B', maxClass: 2, codes: ['arabe'] }).filter((x) => x.kind === 'division')) {
      const [total, parts] = numbersIn(p);
      expect(p.answer * parts).toBe(total);
    }
  });

  it('aux unités, les nombres restent petits (≤ 100 en A)', () => {
    for (const p of many({ level: 'A', maxClass: 0, codes: ['arabe'] })) {
      expect(Math.max(p.answer, ...numbersIn(p))).toBeLessThanOrEqual(100);
    }
  });

  it('respecte les codes actifs', () => {
    for (const p of many({ level: 'C', maxClass: 1, codes: ['arabe'] })) {
      expect(p.answerMode).toBe('clavier');
      for (const s of p.statement) if (typeof s !== 'string') expect(s.code).toBe('arabe');
    }
  });

  it('transcodage : la donnée et la réponse sont dans deux codes différents', () => {
    for (const p of many({ level: 'A', maxClass: 1, codes: [...ALL_CODES] }).filter((x) => x.kind === 'transcodage')) {
      const given = p.statement.find((s) => typeof s !== 'string') as { code: string };
      const target = { clavier: 'arabe', 'choix-verbal': 'verbal', 'choix-analogique': 'analogique' }[p.answerMode];
      expect(given.code).not.toBe(target);
    }
  });
});
