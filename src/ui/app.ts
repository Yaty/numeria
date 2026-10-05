/** État partagé de l'application : magasin de profils et sauvegarde. */
import { loadStore, saveStore, type Store } from '../core/profile';

export const store: Store = loadStore(window.localStorage);

export function save(): void {
  try {
    saveStore(window.localStorage, store);
  } catch (e) {
    console.error('Sauvegarde impossible', e);
  }
}

export const root = document.querySelector<HTMLDivElement>('#app')!;
