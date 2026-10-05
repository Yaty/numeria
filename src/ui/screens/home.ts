import { createProfile, type Profile } from '../../core/profile';
import { save, store } from '../app';
import { h } from '../dom';

const AVATARS = ['🦊', '🐼', '🐸', '🦁', '🐙', '🦄', '🐢', '🚀', '🐝', '🐧', '🦖', '🐬'];

export interface HomeActions {
  open(p: Profile): void;
  therapist(): void;
}

export function showHome(root: HTMLElement, actions: HomeActions): void {
  const list = h(
    'div',
    { class: 'profiles' },
    store.profiles.map((p) =>
      h(
        'button',
        { class: 'profile-card', type: 'button', onclick: () => actions.open(p) },
        h('span', { class: 'profile-avatar' }, p.avatar),
        h('span', { class: 'profile-name' }, p.name),
      ),
    ),
    h('button', { class: 'profile-card add', type: 'button', onclick: () => showNewPlayer() }, h('span', { class: 'profile-avatar' }, '＋'), h('span', { class: 'profile-name' }, 'Nouveau joueur')),
  );

  function showNewPlayer() {
    let avatar = AVATARS[0];
    const name = h('input', { class: 'input', type: 'text', maxlength: 20, placeholder: 'Prénom', autocomplete: 'off' });
    const avatars = h(
      'div',
      { class: 'avatars' },
      AVATARS.map((a, i) => {
        const b = h('button', { class: `avatar-pick${i === 0 ? ' selected' : ''}`, type: 'button', onclick: () => {
          avatar = a;
          avatars.querySelectorAll('.avatar-pick').forEach((x) => x.classList.remove('selected'));
          b.classList.add('selected');
        } }, a);
        return b;
      }),
    );
    const create = () => {
      const n = name.value.trim();
      if (!n) return name.focus();
      const p = createProfile(n, avatar);
      store.profiles.push(p);
      save();
      actions.open(p);
    };
    name.addEventListener('keydown', (e) => e.key === 'Enter' && create());
    root.replaceChildren(
      h(
        'div',
        { class: 'screen center' },
        h('h1', {}, 'Nouveau joueur'),
        name,
        h('p', {}, 'Choisis ton personnage :'),
        avatars,
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => showHome(root, actions) }, 'Annuler'),
          h('button', { class: 'btn primary', type: 'button', onclick: create }, 'C’est parti →'),
        ),
      ),
    );
    name.focus();
  }

  root.replaceChildren(
    h(
      'div',
      { class: 'screen center home' },
      h('h1', { class: 'title' }, 'Numéria'),
      h('p', { class: 'subtitle' }, 'Le monde des grands nombres'),
      h('h2', {}, 'Qui joue ?'),
      list,
      h('button', { class: 'btn ghost therapist-link', type: 'button', onclick: actions.therapist }, '🔒 Espace orthophoniste'),
    ),
  );
}
