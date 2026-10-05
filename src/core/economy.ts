/**
 * Moteur du jeu incrémental : le nombre du joueur est stocké rang par rang
 * (chaque rang peut temporairement contenir plus de 9 éléments, c'est tout
 * l'intérêt des échanges 10 → 1).
 */
import { MAX_RANK, classOf, fromMilli, milliValue, toMilli } from './numbers';

export const CAPACITY = 19;
export const MANUAL_EXCHANGES_FOR_MACHINE = 10;
const FACTORY_COST_GROWTH = 1.25;
const BOOST_SECONDS = 30;

export type UniverseLevel = 1 | 2 | 3;
/** progressive : manuel, puis machine à échanger achetable après 10 échanges. */
export type ExchangeMode = 'progressive' | 'manual' | 'auto';

export interface GameOptions {
  exchangeMode: ExchangeMode;
  /** Secondes entre deux pannes (0 = jamais). */
  breakdownInterval: number;
}

export interface Factory {
  id: string;
  rank: number;
  broken: boolean;
  boostUntil: number;
}

export interface GameState {
  level: UniverseLevel;
  options: GameOptions;
  counts: Record<number, number>;
  maxClass: number;
  decimals: boolean;
  /** Classe où se trouve la caméra. */
  currentClass: number;
  factories: Factory[];
  progress: Record<string, number>;
  autoExchange: Record<number, boolean>;
  manualExchanges: Record<number, number>;
  time: number;
  nextBreakdown: number;
  nextFactoryId: number;
}

export type GameEvent =
  | { type: 'classOpened'; cls: number }
  | { type: 'breakdown'; factoryId: string };

export const DEFAULT_OPTIONS: GameOptions = { exchangeMode: 'progressive', breakdownInterval: 45 };

export function newGame(level: UniverseLevel, options: Partial<GameOptions> = {}): GameState {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const counts: Record<number, number> = {};
  for (let r = -3; r <= MAX_RANK; r++) counts[r] = 0;
  return {
    level,
    options: opts,
    counts,
    maxClass: level === 1 ? 0 : 3,
    decimals: level === 3,
    currentClass: 0,
    factories: [],
    progress: {},
    autoExchange: {},
    manualExchanges: {},
    time: 0,
    nextBreakdown: opts.breakdownInterval,
    nextFactoryId: 1,
  };
}

/** Rangs ouverts, du plus grand au plus petit (ordre d'un tableau de numération). */
export function openRanks(g: GameState): number[] {
  const ranks: number[] = [];
  for (let r = g.maxClass * 3 + 2; r >= (g.decimals ? -3 : 0); r--) ranks.push(r);
  return ranks;
}

function isOpen(g: GameState, rank: number): boolean {
  return rank <= g.maxClass * 3 + 2 && rank >= (g.decimals ? -3 : 0);
}

function totalMilli(g: GameState): number {
  return openRanks(g).reduce((sum, r) => sum + g.counts[r] * milliValue(r), 0);
}

export function totalValue(g: GameState): number {
  return fromMilli(totalMilli(g));
}

export function produce(g: GameState, rank: number, amount: number): void {
  g.counts[rank] = Math.min(CAPACITY, g.counts[rank] + amount);
}

export function tap(g: GameState): void {
  produce(g, 0, 1);
}

export function canExchange(g: GameState, rank: number): boolean {
  if (g.counts[rank] < 10 || rank >= MAX_RANK) return false;
  const target = rank + 1;
  if (!isOpen(g, target)) return classOf(target) === g.maxClass + 1;
  return g.counts[target] < CAPACITY;
}

function doExchange(g: GameState, rank: number): GameEvent[] {
  const events: GameEvent[] = [];
  const target = rank + 1;
  if (!isOpen(g, target)) {
    g.maxClass = classOf(target);
    g.currentClass = g.maxClass;
    events.push({ type: 'classOpened', cls: g.maxClass });
  }
  g.counts[rank] -= 10;
  g.counts[target] += 1;
  return events;
}

export function exchange(g: GameState, rank: number): GameEvent[] {
  if (!canExchange(g, rank)) return [];
  g.manualExchanges[rank] = (g.manualExchanges[rank] ?? 0) + 1;
  return doExchange(g, rank);
}

export function isAutoExchanging(g: GameState, rank: number): boolean {
  if (g.options.exchangeMode === 'manual') return false;
  return g.options.exchangeMode === 'auto' || g.autoExchange[rank] === true;
}

export function exchangeMachineCost(rank: number): number {
  return fromMilli(milliValue(rank + 2));
}

export function canBuyExchangeMachine(g: GameState, rank: number): boolean {
  return (
    g.options.exchangeMode === 'progressive' &&
    !g.autoExchange[rank] &&
    (g.manualExchanges[rank] ?? 0) >= MANUAL_EXCHANGES_FOR_MACHINE
  );
}

export function buyExchangeMachine(g: GameState, rank: number): boolean {
  if (!canBuyExchangeMachine(g, rank) || !pay(g, toMilli(exchangeMachineCost(rank)))) return false;
  g.autoExchange[rank] = true;
  return true;
}

export function availableFactoryRanks(g: GameState): number[] {
  if (g.maxClass === 0) return openRanks(g).filter((r) => r <= 0);
  return openRanks(g);
}

export function factoryCost(g: GameState, rank: number): number {
  const owned = g.factories.filter((f) => f.rank === rank).length;
  return fromMilli(Math.ceil(10 * FACTORY_COST_GROWTH ** owned) * milliValue(rank));
}

/**
 * Retire `cost` (en millièmes) en gardant au mieux les éléments du joueur :
 * on conserve chaque rang en partant du plus grand, et le reste à rendre
 * est recomposé sur les petits rangs (c'est « casser » une dizaine).
 */
function pay(g: GameState, cost: number): boolean {
  const total = totalMilli(g);
  if (total < cost) return false;
  let remaining = total - cost;
  const ranks = openRanks(g);
  for (const r of ranks) {
    const kept = Math.min(g.counts[r], Math.floor(remaining / milliValue(r)));
    g.counts[r] = kept;
    remaining -= kept * milliValue(r);
  }
  for (const r of ranks) {
    const extra = Math.floor(remaining / milliValue(r));
    g.counts[r] += extra;
    remaining -= extra * milliValue(r);
  }
  return true;
}

export function buildFactory(g: GameState, rank: number): boolean {
  if (!availableFactoryRanks(g).includes(rank) || !pay(g, toMilli(factoryCost(g, rank)))) return false;
  g.factories.push({ id: `u${g.nextFactoryId++}`, rank, broken: false, boostUntil: 0 });
  return true;
}

export function repairFactory(g: GameState, factoryId: string): void {
  const f = g.factories.find((x) => x.id === factoryId);
  if (!f) return;
  f.broken = false;
  f.boostUntil = g.time + BOOST_SECONDS;
}

export function moveLeft(g: GameState): boolean {
  if (g.currentClass >= g.maxClass) return false;
  g.currentClass++;
  return true;
}

export function tick(g: GameState, dt: number, rng: () => number = Math.random): GameEvent[] {
  const events: GameEvent[] = [];
  g.time += dt;

  for (const f of g.factories) {
    if (f.broken) continue;
    const rate = f.boostUntil > g.time ? 2 : 1;
    const p = (g.progress[f.id] ?? 0) + rate * dt;
    const made = Math.floor(p);
    g.progress[f.id] = p - made;
    if (made > 0) produce(g, f.rank, made);
  }

  for (const r of [...openRanks(g)].reverse()) {
    if (!isAutoExchanging(g, r)) continue;
    // l'échange automatique ne franchit jamais une classe fermée
    while (isOpen(g, r + 1) && canExchange(g, r)) doExchange(g, r);
  }

  if (g.options.breakdownInterval > 0 && g.time >= g.nextBreakdown) {
    g.nextBreakdown = g.time + g.options.breakdownInterval;
    const working = g.factories.filter((f) => !f.broken);
    if (working.length > 0 && working.length === g.factories.length) {
      const f = working[Math.floor(rng() * working.length)];
      f.broken = true;
      events.push({ type: 'breakdown', factoryId: f.id });
    }
  }
  return events;
}
