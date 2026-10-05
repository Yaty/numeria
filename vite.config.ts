import { defineConfig } from 'vite';

// Publié sur https://yaty.github.io/numeria/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/numeria/' : '/',
});
