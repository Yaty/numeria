/**
 * Jeux disponibles : chaque fichier src/games/<slug>.ts exporte par défaut un
 * GameModule (chargé à la demande). Les fiches (titre, domaine, âge, objectifs)
 * sont côté Rails : portail/config/games.yml.
 */
import type { GameModule } from './types';

const modules = import.meta.glob<{ default: GameModule }>('../games/*.ts');

export const GAMES: Record<string, () => Promise<GameModule>> = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [path.replace(/^.*\/([^/]+)\.ts$/, '$1'), () => load().then((m) => m.default)]),
);
