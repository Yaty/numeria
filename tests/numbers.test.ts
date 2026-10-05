import { describe, expect, it } from 'vitest';
import { classOf, className, formatNumber, rankName, rankLetter, digitAt } from '../src/core/numbers';

describe('numération', () => {
  it('associe chaque rang à sa classe', () => {
    expect(classOf(0)).toBe(0);
    expect(classOf(2)).toBe(0);
    expect(classOf(3)).toBe(1);
    expect(classOf(11)).toBe(3);
    expect(classOf(-1)).toBe(-1);
    expect(classOf(-3)).toBe(-1);
  });

  it('nomme les classes et les rangs', () => {
    expect(className(1)).toBe('milliers');
    expect(className(-1)).toBe('décimales');
    expect(rankName(0)).toBe('unités');
    expect(rankName(4)).toBe('dizaines de mille');
    expect(rankName(8)).toBe('centaines de millions');
    expect(rankName(9)).toBe('unités de milliards');
    expect(rankName(-1)).toBe('dixièmes');
    expect(rankName(-3)).toBe('millièmes');
    expect(rankLetter(5)).toBe('C');
    expect(rankLetter(3)).toBe('U');
    expect(rankLetter(-2)).toBe('c');
  });

  it('écrit les nombres avec espaces entre classes et virgule décimale', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1000)).toBe('1 000');
    expect(formatNumber(1234567)).toBe('1 234 567');
    expect(formatNumber(12.5)).toBe('12,5');
    expect(formatNumber(1234.25)).toBe('1 234,25');
  });

  it('lit le chiffre d’un rang', () => {
    expect(digitAt(4321, 0)).toBe(1);
    expect(digitAt(4321, 3)).toBe(4);
    expect(digitAt(4321, 5)).toBe(0);
    expect(digitAt(3.25, -1)).toBe(2);
    expect(digitAt(3.25, -2)).toBe(5);
  });
});
