/** État partagé de l'application : magasin de profils et sauvegarde. */
import { loadStore, saveStore, type Attempt, type Store } from '../core/profile';

export const store: Store = loadStore(window.localStorage);

/** Dans le portail, la sauvegarde part vers le serveur au lieu du navigateur. */
let persist: (() => void) | null = null;
export function usePersistence(fn: () => void): void {
  persist = fn;
}

/** Appelé à chaque enquête terminée (le portail l'enregistre comme essai). */
export const hooks = { attempt: (_a: Attempt): void => undefined };

export function save(): void {
  if (persist) return persist();
  try {
    saveStore(window.localStorage, store);
  } catch (e) {
    console.error('Sauvegarde impossible', e);
  }
}

export const root = document.querySelector<HTMLDivElement>('#app')!;
