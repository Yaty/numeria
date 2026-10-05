import { describe, expect, it } from 'vitest';
import { toFrenchWords } from '../src/core/french';

describe('toFrenchWords (orthographe rectifiée 1990)', () => {
  const r = (n: number) => toFrenchWords(n, 'rectifiee');
  it.each([
    [0, 'zéro'],
    [1, 'un'],
    [7, 'sept'],
    [11, 'onze'],
    [16, 'seize'],
    [17, 'dix-sept'],
    [20, 'vingt'],
    [21, 'vingt-et-un'],
    [22, 'vingt-deux'],
    [31, 'trente-et-un'],
    [61, 'soixante-et-un'],
    [70, 'soixante-dix'],
    [71, 'soixante-et-onze'],
    [77, 'soixante-dix-sept'],
    [80, 'quatre-vingts'],
    [81, 'quatre-vingt-un'],
    [90, 'quatre-vingt-dix'],
    [91, 'quatre-vingt-onze'],
    [99, 'quatre-vingt-dix-neuf'],
    [100, 'cent'],
    [101, 'cent-un'],
    [200, 'deux-cents'],
    [201, 'deux-cent-un'],
    [580, 'cinq-cent-quatre-vingts'],
    [1000, 'mille'],
    [1001, 'mille-un'],
    [2000, 'deux-mille'],
    [80000, 'quatre-vingt-mille'],
    [200000, 'deux-cent-mille'],
    [1000000, 'un-million'],
    [2000000, 'deux-millions'],
    [80000000, 'quatre-vingts-millions'],
    [200000000, 'deux-cents-millions'],
    [1000000000, 'un-milliard'],
    [3002001, 'trois-millions-deux-mille-un'],
  ])('%i → %s', (n, words) => {
    expect(r(n)).toBe(words);
  });
});

describe('toFrenchWords (orthographe traditionnelle)', () => {
  const t = (n: number) => toFrenchWords(n, 'traditionnelle');
  it.each([
    [21, 'vingt et un'],
    [71, 'soixante et onze'],
    [81, 'quatre-vingt-un'],
    [80, 'quatre-vingts'],
    [123, 'cent vingt-trois'],
    [200, 'deux cents'],
    [2345, 'deux mille trois cent quarante-cinq'],
    [80000, 'quatre-vingt mille'],
    [2000000, 'deux millions'],
    [80000000, 'quatre-vingts millions'],
    [1200000000, 'un milliard deux cents millions'],
  ])('%i → %s', (n, words) => {
    expect(t(n)).toBe(words);
  });
});

describe('toFrenchWords décimaux', () => {
  it('lit la partie décimale après « virgule »', () => {
    expect(toFrenchWords(3.25, 'traditionnelle')).toBe('trois virgule vingt-cinq');
    expect(toFrenchWords(3.05, 'traditionnelle')).toBe('trois virgule zéro cinq');
    expect(toFrenchWords(0.007, 'rectifiee')).toBe('zéro virgule zéro zéro sept');
  });
});
