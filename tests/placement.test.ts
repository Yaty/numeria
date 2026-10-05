import { describe, expect, it } from 'vitest';
import { PlacementSession } from '../src/core/placement';

function run(correctUntil: (tier: number, tag?: string) => boolean) {
  const s = new PlacementSession();
  for (let item = s.current(); item; item = s.current()) {
    s.answer(correctUntil(item.tier, item.tag) ? item.answer : -1);
  }
  return s.result();
}

describe('questionnaire de positionnement', () => {
  it('tout faux → univers 1, niveau A, et on s’arrête vite', () => {
    const s = new PlacementSession();
    s.answer(-1);
    s.answer(-1);
    expect(s.current()).toBeNull();
    expect(s.result()).toEqual({ universe: 1, level: 'A' });
  });

  it('réussit A et B mais échoue au palier C → niveau C', () => {
    expect(run((tier) => tier <= 2).level).toBe('C');
  });

  it('tout juste → univers 3, niveau E', () => {
    expect(run(() => true)).toEqual({ universe: 3, level: 'E' });
  });

  it('les grands nombres réussis mais pas les décimaux → univers 2', () => {
    expect(run((_t, tag) => tag !== 'decimaux').universe).toBe(2);
  });

  it('une seule erreur dans un palier n’empêche pas de continuer', () => {
    const s = new PlacementSession();
    s.answer(-1);
    expect(s.current()).not.toBeNull();
    expect(s.current()!.tier).toBe(1);
  });
});
