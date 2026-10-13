/**
 * Entrée du portail : monte le jeu demandé par la page Rails
 * (<div id="jeu" data-config='{…}'>).
 */
import '@fontsource/andika/400.css';
import '@fontsource/andika/700.css';
import './portal.css';
import { prepareVoice, setChosenVoice } from '../ui/speech';
import { portalContext, type PortalConfig } from './context';
import { GAMES } from './registry';
import { mountVoicePicker } from './voicePicker';

const el = document.querySelector<HTMLElement>('#jeu');
if (el) {
  const cfg = JSON.parse(el.dataset.config ?? '{}') as PortalConfig;
  const load = GAMES[cfg.slug];
  if (!load) el.textContent = 'Jeu introuvable.';
  else {
    // voix choisie par le compte (ou par l'orthophoniste pour un exercice envoyé)
    if (cfg.voice) setChosenVoice(cfg.voice);
    const ctx = portalContext(cfg);
    load().then((game) => {
      game.mount(el, ctx);
      if (!game.silent) prepareVoice();
    });
    const flush = () => ctx.flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  }
}

const picker = document.querySelector<HTMLElement>('#voix-picker');
if (picker) mountVoicePicker(picker);
