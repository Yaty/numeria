/**
 * Numéria dans le portail : le profil Numéria (réglages, partie, historique)
 * est l'état sauvegardé du jeu ; chaque enquête devient un essai du portail.
 */
import '../style.css';
import './numeria-portal.css';
import { createProfile, withDefaults, type Profile } from '../core/profile';
import { KIND_LABELS } from '../core/problems';
import { hooks, store, usePersistence } from '../ui/app';
import { h } from '../ui/dom';
import { showGame } from '../ui/screens/game';
import { showPlacement } from '../ui/screens/placement';
import { showTherapist } from '../ui/screens/therapist';
import { stopSpeaking } from '../ui/speech';
import type { GameModule } from '../portal/types';

const numeria: GameModule = {
  mount(el, ctx) {
    const saved = ctx.state as Profile | null;
    const profile: Profile = saved?.settings ? withDefaults(saved) : createProfile(ctx.profile.name, ctx.profile.avatar);
    profile.name = ctx.profile.name;
    profile.avatar = ctx.profile.avatar;
    store.profiles = [profile];
    store.pin = null;

    usePersistence(() => ctx.saveState(profile));
    hooks.attempt = (a) =>
      ctx.record({
        level: a.level,
        item: `${a.kind} (${KIND_LABELS[a.kind] ?? a.kind})`,
        correct: a.firstTry,
        detail: a.hints > 0 ? `${a.hints} indice(s)` : a.firstTry ? undefined : 'réussi après plusieurs essais ou échoué',
      });

    const root = h('div', { class: 'numeria-root' });
    const gear = ctx.adult
      ? h('button', { class: 'numeria-gear', type: 'button', title: 'Réglages (adulte)', onclick: () => settings() }, '⚙️')
      : null;
    el.replaceChildren(root, ...(gear ? [gear] : []));

    let stopGame: (() => void) | null = null;

    function open(): void {
      if (gear) gear.hidden = false;
      if (!profile.placementDone || !profile.game) showPlacement(root, profile, open);
      else stopGame = showGame(root, profile, () => ctx.exit());
    }

    function settings(): void {
      if (gear) gear.hidden = true;
      stopGame?.();
      stopGame = null;
      ctx.saveState(profile);
      showTherapist(root, () => {
        ctx.saveState(profile);
        open();
      }, profile);
    }

    open();
    return () => {
      stopGame?.();
      stopSpeaking();
      ctx.saveState(profile);
    };
  },
};

export default numeria;
