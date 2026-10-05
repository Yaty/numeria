/** Questionnaire de positionnement : pas de « juste / faux », juste avancer. */
import { PlacementSession, type PlacementResult } from '../../core/placement';
import { applySettings, type Profile } from '../../core/profile';
import { className } from '../../core/numbers';
import { save } from '../app';
import { renderSegments, spokenSegments } from '../codes';
import { h } from '../dom';
import { keypad } from '../keypad';
import { renderVisual } from '../problemView';
import { setVoiceEnabled, speak } from '../speech';

const LEVEL_TEXT: Record<string, string> = {
  A: 'additions et soustractions',
  B: 'multiplications, divisions et aires',
  C: 'problèmes mélangés et proportionnalité',
  D: 'fonctions',
  E: 'puissances',
};

export function showPlacement(root: HTMLElement, profile: Profile, onDone: () => void): void {
  setVoiceEnabled(profile.settings.voice);
  const session = new PlacementSession();
  let n = 0;

  const finish = (result: PlacementResult) => {
    applySettings(profile, { universe: result.universe, level: result.level });
    profile.placementDone = true;
    save();
    const start = result.universe === 1 ? `la classe des ${className(0)}` : 'le monde entier des grands nombres';
    root.replaceChildren(
      h(
        'div',
        { class: 'screen center' },
        h('h1', {}, `Merci ${profile.name} ! ${profile.avatar}`),
        h('p', { class: 'lead' }, `Ton aventure commence dans ${start}.`),
        h('p', { class: 'muted' }, `Univers ${result.universe} · Enquêtes niveau ${result.level} (${LEVEL_TEXT[result.level]})`),
        h('button', { class: 'btn primary', type: 'button', onclick: onDone }, 'Commencer →'),
      ),
    );
  };

  const next = () => {
    const item = session.current();
    if (!item) return finish(session.result());
    n++;
    const pad = keypad((v) => {
      session.answer(v);
      next();
    });
    root.replaceChildren(
      h(
        'div',
        { class: 'screen placement' },
        h('div', { class: 'placement-head' },
          h('span', { class: 'muted' }, `Question ${n}`),
          h('button', { class: 'btn ghost small', type: 'button', onclick: () => finish({ universe: 1, level: 'A' }) }, 'Passer le questionnaire'),
        ),
        h(
          'div',
          { class: 'statement big' },
          h('button', { class: 'btn icon', type: 'button', 'aria-label': 'écouter', onclick: () => speak(spokenSegments(item.statement)) }, '🔊'),
          renderSegments(item.statement, profile.settings.orthographe),
        ),
        item.visual ? renderVisual(item.visual) : null,
        pad.el,
      ),
    );
  };

  root.replaceChildren(
    h(
      'div',
      { class: 'screen center' },
      h('h1', {}, `Bonjour ${profile.name} ! ${profile.avatar}`),
      h('p', { class: 'lead' }, 'Quelques questions pour savoir où commencer ton aventure.'),
      h('p', { class: 'muted' }, 'Ce n’est pas grave si tu ne sais pas : réponds ce que tu penses.'),
      h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Commencer →'),
    ),
  );
}
