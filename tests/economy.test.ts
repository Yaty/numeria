import { describe, expect, it } from 'vitest';
import {
  CAPACITY,
  availableFactoryRanks,
  buildFactory,
  canExchange,
  exchange,
  exchangeMachineCost,
  buyExchangeMachine,
  factoryCost,
  newGame,
  openRanks,
  produce,
  repairFactory,
  tap,
  tick,
  totalValue,
} from '../src/core/economy';

describe('nouvelle partie', () => {
  it('niveau 1 : seule la classe des unités est ouverte', () => {
    const g = newGame(1);
    expect(openRanks(g)).toEqual([2, 1, 0]);
    expect(totalValue(g)).toBe(0);
  });
  it('niveau 2 : toutes les classes entières, pas de décimales', () => {
    expect(openRanks(newGame(2))).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
  });
  it('niveau 3 : décimales ouvertes aussi', () => {
    expect(openRanks(newGame(3)).at(-1)).toBe(-3);
  });
});

describe('production', () => {
  it('toucher produit une unité', () => {
    const g = newGame(1);
    tap(g);
    tap(g);
    expect(g.counts[0]).toBe(2);
    expect(totalValue(g)).toBe(2);
  });
  it('un rang ne dépasse pas sa capacité', () => {
    const g = newGame(1);
    produce(g, 0, 50);
    expect(g.counts[0]).toBe(CAPACITY);
  });
});

describe('échanges', () => {
  it('10 unités → 1 dizaine, la valeur est conservée', () => {
    const g = newGame(1);
    produce(g, 0, 13);
    expect(canExchange(g, 0)).toBe(true);
    exchange(g, 0);
    expect(g.counts[0]).toBe(3);
    expect(g.counts[1]).toBe(1);
    expect(totalValue(g)).toBe(13);
    expect(g.manualExchanges[0]).toBe(1);
  });
  it('impossible avec moins de 10', () => {
    const g = newGame(1);
    produce(g, 0, 9);
    expect(canExchange(g, 0)).toBe(false);
  });
  it('échanger 10 centaines ouvre la classe des milliers', () => {
    const g = newGame(1);
    produce(g, 2, 10);
    const events = exchange(g, 2);
    expect(events).toEqual([{ type: 'classOpened', cls: 1 }]);
    expect(g.maxClass).toBe(1);
    expect(g.counts[3]).toBe(1);
    expect(g.currentClass).toBe(1);
  });
  it('les milliards sont la dernière classe', () => {
    const g = newGame(2);
    produce(g, 11, 10);
    expect(canExchange(g, 11)).toBe(false);
  });
  it('la machine à échanger s’achète après 10 échanges manuels et automatise le rang', () => {
    const g = newGame(1);
    produce(g, 0, 19);
    for (let i = 0; i < 9; i++) {
      g.counts[0] = 10;
      exchange(g, 0);
    }
    g.counts[1] = 0;
    expect(buyExchangeMachine(g, 0)).toBe(false); // seulement 9 échanges
    g.counts[0] = 10;
    exchange(g, 0);
    g.counts[0] = 0;
    g.counts[1] = 0;
    g.counts[2] = exchangeMachineCost(0) / 100;
    expect(buyExchangeMachine(g, 0)).toBe(true);
    expect(g.autoExchange[0]).toBe(true);
    produce(g, 0, 15);
    tick(g, 0.01);
    expect(g.counts[0]).toBe(5);
    expect(g.counts[1]).toBe(1);
  });
  it('l’échange automatique ne franchit jamais une classe fermée', () => {
    const g = newGame(1, { exchangeMode: 'auto' });
    produce(g, 2, 12);
    tick(g, 0.01);
    expect(g.counts[2]).toBe(12);
    expect(g.maxClass).toBe(0);
  });
});

describe('usines', () => {
  it('aux unités, seule l’usine à unités existe ; dès les milliers elles se diversifient', () => {
    const g = newGame(1);
    expect(availableFactoryRanks(g)).toEqual([0]);
    produce(g, 2, 10);
    exchange(g, 2);
    expect(availableFactoryRanks(g)).toEqual([5, 4, 3, 2, 1, 0]);
  });
  it('construire une usine coûte de plus en plus cher et recompose le nombre', () => {
    const g = newGame(1);
    expect(factoryCost(g, 0)).toBe(10);
    produce(g, 0, 15);
    expect(buildFactory(g, 0)).toBe(true);
    expect(totalValue(g)).toBe(5);
    expect(factoryCost(g, 0)).toBeGreaterThan(10);
    expect(buildFactory(g, 0)).toBe(false);
  });
  it('payer « casse » les rangs supérieurs si besoin', () => {
    const g = newGame(1);
    g.counts[1] = 2; // 20
    expect(buildFactory(g, 0)).toBe(true);
    expect(g.counts[1]).toBe(1);
    expect(g.counts[0]).toBe(0);
  });
  it('une usine produit un élément de son rang par seconde', () => {
    const g = newGame(1);
    produce(g, 0, 10);
    buildFactory(g, 0);
    tick(g, 3.5);
    expect(g.counts[0]).toBe(3);
    tick(g, 0.5);
    expect(g.counts[0]).toBe(4);
  });
  it('une usine en panne ne produit plus ; réparée elle produit double pendant 30 s', () => {
    const g = newGame(1);
    produce(g, 0, 10);
    buildFactory(g, 0);
    g.factories[0].broken = true;
    tick(g, 5);
    expect(g.counts[0]).toBe(0);
    repairFactory(g, g.factories[0].id);
    tick(g, 3);
    expect(g.counts[0]).toBe(6);
  });
  it('les pannes surviennent selon l’intervalle réglé, une seule à la fois', () => {
    const g = newGame(1, { breakdownInterval: 10 });
    g.counts[1] = 3;
    buildFactory(g, 0);
    buildFactory(g, 0);
    const events = tick(g, 10.5, () => 0);
    expect(events).toContainEqual({ type: 'breakdown', factoryId: g.factories[0].id });
    tick(g, 30, () => 0);
    expect(g.factories.filter((f) => f.broken)).toHaveLength(1);
  });
});
