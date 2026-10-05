/**
 * Contrat entre le portail (Rails) et un jeu. Le portail fournit le profil du
 * joueur, l'état sauvegardé et de quoi enregistrer les essais ; le jeu se monte
 * dans un élément et rend une fonction de nettoyage.
 */
export interface PlayerProfile {
  id: number;
  name: string;
  avatar: string;
  /** Âge en années (si l'année de naissance est connue). */
  age: number | null;
}

export interface AttemptRecord {
  /** Niveau joué (1, 2, 3 ou libellé propre au jeu). */
  level: number | string;
  /** Identifiant de l'item (pour les statistiques par item). */
  item: string;
  correct: boolean;
  /** Temps de réponse en millisecondes. */
  ms?: number;
  /** Réponse donnée quand elle est fausse, ou toute précision utile. */
  detail?: string;
}

export interface GameContext {
  slug: string;
  profile: PlayerProfile;
  /** « seance » chez l'orthophoniste, « maison » sinon. */
  mode: 'seance' | 'maison';
  /** Un adulte (orthophoniste ou parent déverrouillé) peut modifier les réglages. */
  adult: boolean;
  state: unknown;
  saveState(state: unknown): void;
  /** Réglages choisis par l'adulte (ex. { level: 2 } ou { level: 'auto' }). */
  settings: Record<string, unknown>;
  saveSettings(settings: Record<string, unknown>): void;
  record(attempt: AttemptRecord): void;
  speak(text: string): void;
  /** Retour au catalogue. */
  exit(): void;
}

export interface GameModule {
  mount(el: HTMLElement, ctx: GameContext): () => void;
}
