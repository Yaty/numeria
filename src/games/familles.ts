/**
 * La course aux familles — morphologie dérivationnelle, en temps limité, à plusieurs.
 *
 * Un mot apparaît (« gonfle ») : on tape le plus de mots possible de la même famille
 * (gonfler, gonflable, dégonfler…). Chaque mot rapporte des points, de plus en plus
 * dans une même famille (10, 20, 30…) : chercher loin paie plus que passer. On peut
 * passer au mot suivant à tout moment. Chaque joueur a 3 minutes, à tour de rôle sur
 * le même appareil ; à la fin, le classement. Après chaque tour, les mots trouvés et
 * ceux qu'on aurait pu trouver.
 *
 * Seule une partie à un joueur est enregistrée dans les statistiques du profil (en
 * groupe, les réponses ne sont pas celles de l'enfant suivi).
 */
import { h } from '../ui/dom';
import { seeded, shuffle } from '../core/random';
import { FAMILIES, checkAnswer, pointsFor, type Family } from '../data/familles';
import type { GameModule } from '../portal/types';
import './familles.css';

export const TURN_SECONDS = 180;
export const MAX_PLAYERS = 6;
type Level = 1 | 2 | 3;

const LEVEL_LABELS: Record<Level, string> = {
  1: 'Mots du quotidien',
  2: 'Grandes familles',
  3: 'Mots qui changent de forme',
};

interface Played {
  family: Family;
  found: string[];
}
interface Player {
  name: string;
  score: number;
  played: Played[];
}
interface State {
  best: Partial<Record<Level, number>>;
}

const MESSAGES = {
  vide: '',
  depart: 'C’est le mot de départ : cherche un autre mot de sa famille.',
  deja: 'Déjà trouvé !',
  inconnu: 'Ce mot n’est pas dans la liste de cette famille.',
} as const;

export function ranking(players: readonly Player[]): Player[] {
  return [...players].sort((a, b) => b.score - a.score || wordsOf(b) - wordsOf(a));
}
const wordsOf = (p: Player) => p.played.reduce((n, x) => n + x.found.length, 0);

const time = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const game: GameModule = {
  mount(el, ctx) {
    const rng = seeded(Date.now() % 2147483647);
    const state: State = { best: { ...((ctx.state as State | null)?.best ?? {}) } };
    const forced = [1, 2, 3].includes(ctx.settings.level as number) ? (ctx.settings.level as Level) : null;
    let level: Level = forced ?? 1;
    let timer = 0;
    let disposed = false;

    const screen = (...children: (Node | null)[]) => {
      window.clearInterval(timer);
      el.replaceChildren(h('div', { class: 'quiz fam' }, h('div', { class: 'quiz-card fam-card' }, ...children)));
    };

    /** Écran de départ : les joueurs et le niveau. */
    function setup(names: string[] = [ctx.profile.name]): void {
      const list = h('ol', { class: 'fam-players' });
      const addRow = (value = '') => {
        if (list.children.length >= MAX_PLAYERS) return;
        const input = h('input', {
          class: 'fam-name',
          type: 'text',
          value,
          maxlength: 20,
          placeholder: `Joueur ${list.children.length + 1}`,
          'aria-label': `Prénom du joueur ${list.children.length + 1}`,
          autocomplete: 'off',
        });
        const remove = h('button', { class: 'btn ghost fam-remove', type: 'button', 'aria-label': 'Retirer ce joueur', onclick: () => { row.remove(); refresh(); } }, '✕');
        const row = h('li', {}, input, remove);
        list.append(row);
        refresh();
        return input;
      };
      const refresh = () => {
        add.disabled = list.children.length >= MAX_PLAYERS;
        list.querySelectorAll<HTMLButtonElement>('.fam-remove').forEach((b) => (b.hidden = list.children.length <= 1));
      };
      const add = h('button', { class: 'btn ghost', type: 'button', onclick: () => addRow()?.focus() }, '+ Ajouter un joueur');
      const levels = h(
        'div',
        { class: 'quiz-levels' },
        ([1, 2, 3] as Level[]).map((n) =>
          h(
            'button',
            {
              class: `quiz-level ${n === level ? 'current' : ''}`,
              type: 'button',
              disabled: forced !== null && forced !== n,
              onclick: (e: Event) => {
                level = n;
                levels.querySelectorAll('.quiz-level').forEach((b) => b.classList.toggle('current', b === e.currentTarget));
              },
            },
            h('strong', {}, `Niveau ${n}`),
            h('span', {}, LEVEL_LABELS[n]),
            state.best[n] ? h('span', { class: 'quiz-stars' }, `record ${state.best[n]} pts`) : null,
          ),
        ),
      );
      screen(
        h('h1', {}, 'La course aux familles'),
        h('p', { class: 'quiz-instructions' }, 'Un mot apparaît : écris le plus de mots possible de la même famille. Plus tu en trouves pour un mot, plus ça rapporte. Tu peux passer au mot suivant. Chaque joueur a 3 minutes.'),
        h('h2', { class: 'fam-sub' }, 'Joueurs'),
        list,
        add,
        levels,
        h(
          'button',
          {
            class: 'btn primary big',
            type: 'button',
            onclick: () => {
              const players = [...list.querySelectorAll<HTMLInputElement>('.fam-name')].map((i, k) => ({
                name: i.value.trim() || `Joueur ${k + 1}`,
                score: 0,
                played: [],
              }));
              turnIntro(players, 0);
            },
          },
          '▶ Commencer',
        ),
        forced !== null ? h('p', { class: 'muted' }, `Niveau ${forced} choisi par l’adulte.`) : null,
      );
      names.forEach((n) => addRow(n));
    }

    /** Avant chaque tour : on passe l'appareil au joueur. */
    function turnIntro(players: Player[], index: number): void {
      const p = players[index];
      screen(
        players.length > 1 ? h('p', { class: 'fam-turn' }, `Joueur ${index + 1} sur ${players.length}`) : null,
        h('h1', {}, players.length > 1 ? `À toi, ${p.name} !` : 'Prêt ?'),
        h('p', { class: 'quiz-instructions' }, '3 minutes pour trouver le plus de mots de la même famille.'),
        h('button', { class: 'btn primary big', type: 'button', onclick: () => turn(players, index) }, '▶ C’est parti'),
      );
    }

    /** Un tour de 3 minutes. */
    function turn(players: Player[], index: number): void {
      const p = players[index];
      const deck = shuffle(rng, FAMILIES[level]);
      let current = -1;
      let played: Played;
      const ends = performance.now() + TURN_SECONDS * 1000;

      const clock = h('span', { class: 'fam-clock' }, time(TURN_SECONDS));
      const score = h('span', { class: 'fam-score' }, `${p.score} pts`);
      const word = h('div', { class: 'fam-word', 'aria-live': 'polite' });
      const input = h('input', {
        class: 'fam-input',
        type: 'text',
        autocomplete: 'off',
        autocapitalize: 'off',
        autocorrect: 'off',
        spellcheck: 'false',
        enterkeyhint: 'send',
        'aria-label': 'Un mot de la même famille',
        placeholder: 'Écris un mot…',
      });
      const note = h('p', { class: 'fam-note', 'aria-live': 'polite' });
      const chips = h('ul', { class: 'fam-chips', 'aria-label': 'Mots trouvés' });

      const next = () => {
        current++;
        if (current >= deck.length) return finish(); // toutes les familles vues
        played = { family: deck[current], found: [] };
        p.played.push(played);
        word.textContent = played.family.word;
        chips.replaceChildren();
        note.textContent = '';
        note.className = 'fam-note';
        ctx.speak(played.family.word);
        input.focus();
      };
      const submit = () => {
        const typed = input.value;
        const r = checkAnswer(played.family, typed, played.found);
        if (r.ok) {
          played.found.push(r.member);
          const pts = pointsFor(played.found.length);
          p.score += pts;
          score.textContent = `${p.score} pts`;
          chips.append(h('li', {}, r.member, h('small', {}, ` +${pts}`)));
          note.textContent = `+${pts} points`;
          note.className = 'fam-note good';
          input.value = '';
        } else if (r.reason !== 'vide') {
          note.textContent = MESSAGES[r.reason];
          note.className = 'fam-note bad';
          input.select();
        }
        input.focus();
      };
      const finish = () => {
        if (players.length === 1) {
          // la dernière famille, coupée par la fin du temps, ne compte pas si rien n'a été trouvé
          const counted = p.played.filter((x, i) => x.found.length > 0 || i < p.played.length - 1);
          for (const x of counted) {
            ctx.record({ level, item: `fam:${x.family.word}`, correct: x.found.length > 0, detail: x.found.length ? x.found.join(', ') : 'aucun mot' });
          }
          if (p.score > (state.best[level] ?? 0)) state.best[level] = p.score;
          ctx.saveState(state);
        }
        turnSummary(players, index);
      };

      screen(
        h('div', { class: 'fam-top' }, h('span', { class: 'fam-who' }, p.name), clock, score),
        word,
        h('form', { class: 'fam-form', onsubmit: (e: Event) => { e.preventDefault(); submit(); } }, input, h('button', { class: 'btn primary', type: 'submit' }, 'OK')),
        note,
        chips,
        h('button', { class: 'btn ghost fam-skip', type: 'button', onclick: next }, 'Passer ➜'),
      );
      timer = window.setInterval(() => {
        if (disposed) return;
        const left = Math.max(0, Math.ceil((ends - performance.now()) / 1000));
        clock.textContent = time(left);
        clock.classList.toggle('low', left <= 20);
        if (left === 0) finish();
      }, 250);
      next();
    }

    /** Fin d'un tour : score, mots trouvés et mots qu'on aurait pu trouver. */
    function turnSummary(players: Player[], index: number): void {
      const p = players[index];
      const last = index === players.length - 1;
      screen(
        h('h1', {}, players.length > 1 ? `${p.name} : ${p.score} points` : `${p.score} points`),
        h('p', {}, `${wordsOf(p)} mot${wordsOf(p) > 1 ? 's' : ''} trouvé${wordsOf(p) > 1 ? 's' : ''}.`),
        h(
          'ul',
          { class: 'fam-review' },
          p.played.map((x) =>
            h(
              'li',
              {},
              h('strong', {}, x.family.word),
              ' : ',
              x.found.length ? h('span', { class: 'fam-found' }, x.found.join(', ')) : h('span', { class: 'muted' }, 'aucun'),
              h('br'),
              h('small', { class: 'muted' }, `Aussi : ${x.family.members.filter((m) => !x.found.includes(m)).join(', ') || '—'}`),
            ),
          ),
        ),
        h(
          'button',
          { class: 'btn primary big', type: 'button', onclick: () => (last ? podium(players) : turnIntro(players, index + 1)) },
          last ? (players.length > 1 ? '🏆 Voir le classement' : 'Terminer') : 'Joueur suivant ➜',
        ),
      );
    }

    /** Classement final. */
    function podium(players: Player[]): void {
      const medals = ['🥇', '🥈', '🥉'];
      const sorted = ranking(players);
      let rank = 0;
      screen(
        h('h1', {}, players.length > 1 ? 'Classement' : 'Bravo !'),
        h(
          'ol',
          { class: 'fam-ranking' },
          sorted.map((p, i) => {
            // ex æquo : même rang
            if (i === 0 || p.score !== sorted[i - 1].score || wordsOf(p) !== wordsOf(sorted[i - 1])) rank = i;
            return h(
              'li',
              { class: rank === 0 ? 'first' : '' },
              h('span', { class: 'fam-medal' }, medals[rank] ?? `${rank + 1}ᵉ`),
              h('span', { class: 'fam-player' }, p.name),
              h('span', { class: 'fam-points' }, `${p.score} pts`),
              h('small', { class: 'muted' }, `${wordsOf(p)} mot${wordsOf(p) > 1 ? 's' : ''}`),
            );
          }),
        ),
        h(
          'div',
          { class: 'quiz-actions' },
          h('button', { class: 'btn primary big', type: 'button', onclick: () => setup(players.map((p) => p.name)) }, '🔁 Rejouer'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => ctx.exit() }, 'Autres jeux'),
        ),
      );
    }

    setup();
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  },
};

export default game;
