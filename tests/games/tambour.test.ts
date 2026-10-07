import { describe, expect, it } from 'vitest';
import { LEVELS, MAX_DRUMS, WORDS, game, hasCluster, poolFor, soundsOf } from '../../src/games/tambour';
import { GESTURES } from '../../src/portal/gestes';
import { EMOJI, checkItems } from './phono-helpers';

const find = (w: string) => WORDS.find(([word]) => word === w)!;

describe('tambour des sons : données', () => {
  it('pas de doublon, une image par mot, des sons connus', () => {
    const words = WORDS.map(([w]) => w);
    expect(new Set(words).size).toBe(words.length);
    expect(new Set(WORDS.map(([, , e]) => e)).size).toBe(WORDS.length);
    for (const w of WORDS) {
      expect(w[2], w[0]).toMatch(EMOJI);
      for (const s of soundsOf(w)) expect(GESTURES, `${w[0]} : ${s}`).toHaveProperty(s);
      expect(soundsOf(w).length).toBeLessThanOrEqual(MAX_DRUMS);
    }
  });

  it('découpages vérifiés à la main', () => {
    expect(soundsOf(find('chat'))).toEqual(['ch', 'a']);
    expect(soundsOf(find('pomme'))).toHaveLength(3);
    expect(soundsOf(find('mouton'))).toEqual(['m', 'ou', 't', 'on']);
    expect(soundsOf(find('tracteur'))).toHaveLength(7);
    expect(hasCluster(find('fleur'))).toBe(true);
    expect(hasCluster(find('lapin'))).toBe(false);
  });

  it('pas de mots aux sons instables (oi, semi-voyelles, x)', () => {
    for (const [w] of WORDS) expect(w, w).not.toMatch(/oi|ill|ion|ien|ui|x/);
  });

  it('assez de mots à chaque niveau, dans les bornes', () => {
    for (const level of [1, 2, 3] as const) {
      const pool = poolFor(level);
      expect(pool.length, `niveau ${level}`).toBeGreaterThanOrEqual(25);
      for (const w of pool) {
        expect(soundsOf(w).length).toBeGreaterThanOrEqual(LEVELS[level].min);
        expect(soundsOf(w).length).toBeLessThanOrEqual(LEVELS[level].max);
      }
    }
    expect(poolFor(1).some(hasCluster)).toBe(false);
    expect(poolFor(2).some(hasCluster)).toBe(false);
    expect(poolFor(3).some(hasCluster)).toBe(true);
  });

  it('chaque son a un geste décrit', () => {
    for (const g of Object.values(GESTURES)) {
      expect(g.label).toBeTruthy();
      expect(g.hint.length).toBeGreaterThan(10);
    }
  });
});

describe('tambour des sons : makeItem', () => {
  it('items valides, le mot n’est jamais écrit à l’écran', () => {
    checkItems(game, (item, level) => {
      const w = item.key.replace('son:', '');
      expect(poolFor(level).map(([x]) => x)).toContain(w);
      expect(item.say).toContain(w);
      expect(item.stimulus?.text).toBeUndefined();
      expect(item.prompt).not.toContain(w);
    });
  });
});
