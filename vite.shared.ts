import { fileURLToPath } from 'node:url';
import type { UserConfig } from 'vite';

/**
 * Réglages communs aux deux bundles. Le phonétiseur de Piper n'est pas exporté par
 * vits-web : on pointe sur son fichier (nom figé par la version verrouillée).
 */
export const shared: UserConfig = {
  resolve: {
    alias: {
      'piper-phonemize': fileURLToPath(new URL('./node_modules/@diffusionstudio/vits-web/dist/piper-DeOu3H9E.js', import.meta.url)),
    },
  },
  worker: { format: 'es' },
};
