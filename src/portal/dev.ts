/**
 * Banc d'essai sans Rails : /play.html?jeu=tambour — état et essais en localStorage,
 * essais affichés dans la console.
 */
import '@fontsource/andika/400.css';
import '@fontsource/andika/700.css';
import './portal.css';
import { prepareVoice, speak } from '../ui/speech';
import { GAMES } from './registry';
import type { GameContext } from './types';

const params = new URLSearchParams(location.search);
const slug = params.get('jeu') ?? '';
const el = document.querySelector<HTMLElement>('#jeu')!;
const key = `dev-${slug}`;
const load = (k: string) => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? 'null');
  } catch {
    return null;
  }
};

if (!GAMES[slug]) {
  el.replaceChildren(
    ...Object.keys(GAMES).map((s) => {
      const a = document.createElement('a');
      a.href = `?jeu=${s}`;
      a.textContent = s;
      a.style.display = 'block';
      a.style.padding = '8px';
      return a;
    }),
  );
} else {
  const ctx: GameContext = {
    slug,
    profile: { id: 1, name: 'Léa', avatar: '🦊', age: 7 },
    mode: (params.get('mode') as 'seance' | 'maison') ?? 'maison',
    adult: params.has('adulte'),
    state: load(key),
    saveState: (s) => localStorage.setItem(key, JSON.stringify(s)),
    settings: load(`${key}-reglages`) ?? {},
    saveSettings(s) {
      this.settings = s;
      localStorage.setItem(`${key}-reglages`, JSON.stringify(s));
    },
    record: (a) => console.log('[essai]', JSON.stringify(a)),
    speak: (t) => (params.has('muet') ? console.log('[voix]', t) : speak(t)),
    exit: () => (location.href = '?'),
  };
  GAMES[slug]().then((g) => {
    g.mount(el, ctx);
    if (!params.has('muet') && !g.silent) prepareVoice();
  });
}
