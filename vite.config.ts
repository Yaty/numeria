import { defineConfig } from 'vite';
import { shared } from './vite.shared';

// Publié sur https://yaty.github.io/numeria/
export default defineConfig({
  ...shared,
  base: process.env.GITHUB_PAGES ? '/numeria/' : '/',
});
