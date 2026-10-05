/**
 * Profils patients, réglages de l'orthophoniste, historique et sauvegarde locale.
 */
import { FACTORY_SPEEDS, newGame, type ExchangeMode, type GameState, type UniverseLevel } from './economy';
import type { Orthographe } from './french';
import type { AnswerMode, Code, ProblemKind, ProblemLevel } from './problems';

export interface Settings {
  universe: UniverseLevel;
  level: ProblemLevel;
  exchangeMode: ExchangeMode;
  breakdownInterval: number;
  factorySpeed: keyof typeof FACTORY_SPEEDS;
  codes: Code[];
  voice: boolean;
  orthographe: Orthographe;
}

export interface Attempt {
  t: number;
  kind: ProblemKind;
  level: ProblemLevel;
  mode: AnswerMode;
  /** Réussi du premier coup. */
  firstTry: boolean;
  hints: number;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  settings: Settings;
  placementDone: boolean;
  game: GameState | null;
  history: Attempt[];
}

export interface Store {
  profiles: Profile[];
  /** Code de l'espace orthophoniste. */
  pin: string | null;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'numeria';
const EXPORT_FORMAT = 'numeria-profil-v1';
const HISTORY_LIMIT = 1000;

export const DEFAULT_SETTINGS: Settings = {
  universe: 1,
  level: 'A',
  exchangeMode: 'progressive',
  breakdownInterval: 45,
  factorySpeed: 'normale',
  codes: ['arabe', 'verbal', 'analogique'],
  voice: true,
  orthographe: 'rectifiee',
};

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createProfile(name: string, avatar: string): Profile {
  return {
    id: newId(),
    name,
    avatar,
    createdAt: Date.now(),
    settings: { ...DEFAULT_SETTINGS, codes: [...DEFAULT_SETTINGS.codes] },
    placementDone: false,
    game: null,
    history: [],
  };
}

function gameOptions(s: Settings) {
  return {
    exchangeMode: s.exchangeMode,
    breakdownInterval: s.breakdownInterval,
    factoryRate: FACTORY_SPEEDS[s.factorySpeed],
  };
}

export function newGameFor(s: Settings): GameState {
  return newGame(s.universe, gameOptions(s));
}

/** Applique des réglages ; changer d'univers recommence la partie. */
export function applySettings(p: Profile, changes: Partial<Settings>): void {
  const universeChanged = changes.universe !== undefined && changes.universe !== p.settings.universe;
  p.settings = { ...p.settings, ...changes };
  const options = gameOptions(p.settings);
  if (!p.game || universeChanged) {
    p.game = newGameFor(p.settings);
  } else {
    p.game.options = options;
    p.game.nextBreakdown = Math.min(p.game.nextBreakdown, p.game.time + options.breakdownInterval);
  }
}

export function recordAttempt(p: Profile, a: Omit<Attempt, 't'>): void {
  p.history.push({ ...a, t: Date.now() });
  if (p.history.length > HISTORY_LIMIT) p.history.splice(0, p.history.length - HISTORY_LIMIT);
}

export function statsByKind(p: Profile): Partial<Record<ProblemKind, { attempts: number; firstTry: number }>> {
  const stats: Partial<Record<ProblemKind, { attempts: number; firstTry: number }>> = {};
  for (const a of p.history) {
    const s = (stats[a.kind] ??= { attempts: 0, firstTry: 0 });
    s.attempts++;
    if (a.firstTry) s.firstTry++;
  }
  return stats;
}

function withDefaults(raw: Profile): Profile {
  const p = { ...raw, settings: { ...DEFAULT_SETTINGS, ...raw.settings }, history: raw.history ?? [] };
  // parties sauvegardées avant l'ajout d'un réglage : on le reporte dans la partie
  if (p.game) p.game.options = { ...p.game.options, ...gameOptions(p.settings) };
  return p;
}

export function loadStore(storage: KeyValueStorage): Store {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { profiles: [], pin: null };
    const parsed = JSON.parse(raw) as Store;
    return { profiles: (parsed.profiles ?? []).map(withDefaults), pin: parsed.pin ?? null };
  } catch {
    return { profiles: [], pin: null };
  }
}

export function saveStore(storage: KeyValueStorage, store: Store): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function exportProfile(p: Profile): string {
  return JSON.stringify({ format: EXPORT_FORMAT, profile: p });
}

export function importProfile(json: string, existingIds: string[]): Profile {
  const data = JSON.parse(json) as { format?: string; profile?: Profile };
  if (data.format !== EXPORT_FORMAT || !data.profile?.name) {
    throw new Error('Ce fichier n’est pas un profil Numéria.');
  }
  const p = withDefaults(data.profile);
  return existingIds.includes(p.id) ? { ...p, id: newId() } : p;
}
