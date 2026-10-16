import { defineConfig } from 'vite';
import { shared } from './vite.shared';

// Bundle des jeux pour le portail Rails : portail/public/jeux/
export default defineConfig({
  ...shared,
  base: '/jeux/',
  publicDir: false,
  build: {
    outDir: 'portail/public/jeux',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: { input: 'src/portal/main.ts' },
  },
});
