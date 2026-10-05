import { describe, expect, it } from 'vitest';
import {
  PHONEMES, TARGETS, WORDS, game, noWords, otherStartWords, placeWords, position, startWords, yesWords,
} from '../../src/games/son-cache';
import { checkItems } from './phono-helpers';

const phon = (w: string) => WORDS.find(([x]) => x === w)![2];
const target = (id: string) => TARGETS.find((t) => t.id === id)!;

describe('son-cache : données', () => {
  it('pas de doublon, notation valide', () => {
    expect(new Set(WORDS.map(([w]) => w)).size).toBe(WORDS.length);
    expect(new Set(WORDS.map(([, e]) => e)).size).toBe(WORDS.length);
    for (const [w, e, p] of WORDS) {
      expect(e, w).toBeTruthy();
      for (const c of p) expect(PHONEMES, `${w} : ${c}`).toContain(c);
    }
  });

  it('pièges phonétiques', () => {
    expect(phon('rose')).toContain('z');
    expect(phon('rose')).not.toContain('s');
    // « oiseau » : le o de « oi » n'est pas [o] → mot écarté pour le son [o].
    expect(yesWords(target('o')).map(([w]) => w)).not.toContain('oiseau');
    expect(yesWords(target('o')).map(([w]) => w)).toContain('bateau');
    // « champignon » : pas de [n] (on, gn).
    expect(noWords(target('n')).map(([w]) => w)).not.toContain('champignon');
    expect(position(phon('rose'), target('z'))).toBe('fin');
    expect(position(phon('tortue'), target('r'))).toBe('milieu');
    expect(position(phon('chat'), target('ch'))).toBe('debut');
  });

  it('chaque son a assez de mots à ses niveaux', () => {
    const keys: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    for (const t of TARGETS) {
      for (const l of t.levels) {
        if (l === 1) {
          expect(yesWords(t).length, `${t.id} oui`).toBeGreaterThanOrEqual(4);
          expect(noWords(t).length, `${t.id} non`).toBeGreaterThanOrEqual(4);
          keys[1] += yesWords(t).length + noWords(t).length;
        }
        if (l === 2) {
          expect(startWords(t).length, `${t.id} début`).toBeGreaterThanOrEqual(2);
          expect(otherStartWords(t).length).toBeGreaterThanOrEqual(10);
          keys[2] += startWords(t).length;
        }
        if (l === 3) {
          expect(placeWords(t).length, `${t.id} position`).toBeGreaterThanOrEqual(4);
          keys[3] += placeWords(t).length;
        }
      }
    }
    for (const l of [1, 2, 3]) expect(keys[l]).toBeGreaterThanOrEqual(30);
  });

  it('mots « non » du niveau 1 : ni le son, ni un son proche, ni la lettre', () => {
    for (const t of TARGETS) {
      for (const [w, , p] of noWords(t)) {
        for (const c of t.sounds + t.close) expect(p, `${t.id} / ${w}`).not.toContain(c);
        expect(t.letters.test(w)).toBe(false);
      }
    }
  });
});

describe('son-cache : makeItem', () => {
  it('items valides et réponses justes', () => {
    checkItems(game, (item, level) => {
      const t = target(item.key.split(/[?^@]/)[0]);
      const w = item.key.split(/[?^@]/)[1];
      expect(t.levels).toContain(level);
      expect(w).not.toBe(t.anchor);
      const p = phon(w);
      const good = item.choices!.find((c) => c.correct)!;
      if (level === 1) expect(good.label === 'Oui').toBe([...p].some((c) => t.sounds.includes(c)));
      if (level === 2) {
        expect(t.sounds).toContain(p[0]);
        for (const c of item.choices!) {
          const cp = phon(c.say!);
          expect(t.sounds.includes(cp[0])).toBe(c.correct);
        }
      }
      if (level === 3) {
        const where = { debut: 'au début', milieu: 'au milieu', fin: 'à la fin' }[position(p, t)];
        expect(good.label).toBe(where);
      }
    });
  });
});

describe('voix', () => {
  it('chaque consonne a un mot repère qui commence par ce son', async () => {
    const { TARGETS, sound } = await import('../../src/games/son-cache');
    for (const t of TARGETS) {
      const spoken = sound(t);
      expect(spoken).not.toMatch(/\[/);
      expect(spoken).toContain(t.anchor);
    }
  });
});
