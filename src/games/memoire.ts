/**
 * La mémoire des mots — mémoire et attention (empan verbal auditif).
 * Le jeu dit une suite de mots, images cachées ; l'enfant appuie sur « J'ai écouté,
 * je réponds », puis touche les images dans le même ordre (rappel sériel avec
 * reconnaissance d'images, sans production orale).
 *
 * Progression :
 * - Niveau 1 : empan 2–3, mots courts d'une syllabe, très fréquents ; grille de 6
 *   images, aucune rime entre les images (pas de confusion phonologique).
 * - Niveau 2 : empan 3–4, mots d'une ou deux syllabes ; grille de 8 images sans rimes.
 * - Niveau 3 : deux sortes d'items.
 *   · « Mots qui se ressemblent » : empan 4–5, tous les mots de la suite riment
 *     (bateau, gâteau, cadeau…) et la grille contient d'autres mots de la même rime
 *     (effet de similarité phonologique : la boucle phonologique les confond).
 *   · « À l'envers » : empan 3–4 (l'empan envers est plus court d'environ un mot
 *     que l'empan endroit chez l'enfant), mots sans rimes, rappel du dernier au premier.
 *
 * Un seul « Réécouter » est permis par item ; il est noté dans le détail de l'essai,
 * comme la réponse donnée.
 */
import { int, pick, shuffle, type Rng } from '../core/random';
import { quizGame, type QuizGame, type QuizItem } from '../portal/quiz';
import { h } from '../ui/dom';
import './memoire.css';

/** [mot, émoji, syllabes orales, rime phonétique]. */
export type Word = readonly [word: string, emoji: string, syllables: 1 | 2, rime: string];

/** Rimes notées par leur son : « in » = [ɛ̃], « on » = [ɔ̃], « é » = [e], « è » = [ɛ]… */
export const WORDS: readonly Word[] = [
  // Une syllabe orale (le e final muet ne compte pas).
  ['chat', '🐱', 1, 'a'],
  ['rat', '🐀', 1, 'a'],
  ['chien', '🐶', 1, 'in'],
  ['loup', '🐺', 1, 'ou'],
  ['ours', '🐻', 1, 'ours'],
  ['vache', '🐮', 1, 'ache'],
  ['poule', '🐔', 1, 'oule'],
  ['crabe', '🦀', 1, 'abe'],
  ['singe', '🐵', 1, 'inge'],
  ['tigre', '🐯', 1, 'igre'],
  ['zèbre', '🦓', 1, 'èbre'],
  ['pain', '🍞', 1, 'in'],
  ['lait', '🥛', 1, 'è'],
  ['œuf', '🥚', 1, 'euf'],
  ['pomme', '🍎', 1, 'omme'],
  ['poire', '🍐', 1, 'oire'],
  ['fraise', '🍓', 1, 'èze'],
  ['glace', '🍦', 1, 'ace'],
  ['lune', '🌙', 1, 'une'],
  ['fleur', '🌷', 1, 'eur'],
  ['feu', '🔥', 1, 'eu'],
  ['train', '🚆', 1, 'in'],
  ['bus', '🚌', 1, 'us'],
  ['lit', '🛏️', 1, 'i'],
  ['clé', '🔑', 1, 'é'],
  ['main', '✋', 1, 'in'],
  ['pied', '🦶', 1, 'é'],
  ['nez', '👃', 1, 'é'],
  ['dent', '🦷', 1, 'an'],
  ['cœur', '❤️', 1, 'eur'],
  ['livre', '📖', 1, 'ivre'],
  ['porte', '🚪', 1, 'orte'],
  ['chaise', '🪑', 1, 'èze'],
  ['sac', '👜', 1, 'ac'],
  ['dé', '🎲', 1, 'é'],
  ['scie', '🪚', 1, 'i'],
  ['plume', '🪶', 1, 'une'],
  ['gant', '🧤', 1, 'an'],
  ['robe', '👗', 1, 'obe'],
  ['cloche', '🔔', 1, 'oche'],
  // Deux syllabes orales.
  ['bateau', '⛵', 2, 'o'],
  ['gâteau', '🎂', 2, 'o'],
  ['chapeau', '🎩', 2, 'o'],
  ['cadeau', '🎁', 2, 'o'],
  ['château', '🏰', 2, 'o'],
  ['vélo', '🚲', 2, 'o'],
  ['lapin', '🐰', 2, 'in'],
  ['sapin', '🎄', 2, 'in'],
  ['raisin', '🍇', 2, 'in'],
  ['requin', '🦈', 2, 'in'],
  ['ballon', '🎈', 2, 'on'],
  ['camion', '🚚', 2, 'on'],
  ['cochon', '🐷', 2, 'on'],
  ['mouton', '🐑', 2, 'on'],
  ['citron', '🍋', 2, 'on'],
  ['crayon', '✏️', 2, 'on'],
  ['poisson', '🐟', 2, 'on'],
  ['maison', '🏠', 2, 'on'],
  ['avion', '✈️', 2, 'on'],
  ['souris', '🐭', 2, 'i'],
  ['bougie', '🕯️', 2, 'i'],
  ['kiwi', '🥝', 2, 'i'],
  ['taxi', '🚕', 2, 'i'],
  ['fusée', '🚀', 2, 'é'],
  ['bébé', '👶', 2, 'é'],
  ['canard', '🦆', 2, 'ar'],
  ['tortue', '🐢', 2, 'u'],
  ['soleil', '☀️', 2, 'eil'],
  ['étoile', '⭐', 2, 'oile'],
  ['banane', '🍌', 2, 'ane'],
  ['carotte', '🥕', 2, 'otte'],
  ['tomate', '🍅', 2, 'ate'],
  ['hibou', '🦉', 2, 'ou'],
  ['girafe', '🦒', 2, 'afe'],
];

/** Rimes assez fournies (au moins 6 mots) pour les items « mots qui se ressemblent ». */
export const SIMILAR_RIMES = ['o', 'in', 'on', 'i', 'é'] as const;

export type Mode = 'endroit' | 'ressemblent' | 'envers';

export interface Sequence {
  mode: Mode;
  /** Mots dits, dans l'ordre de l'énoncé. */
  words: Word[];
  /** Ordre attendu des touches (inversé pour « à l'envers »). */
  expected: Word[];
  /** Images de la grille, mélangées (contient tous les mots de la suite). */
  grid: Word[];
}

const GRID_SIZE: Record<1 | 2 | 3, number> = { 1: 6, 2: 8, 3: 9 };

/** Tire `n` mots de `pool` dont les rimes sont toutes différentes (et absentes de `banned`). */
function distinctRimes(rng: Rng, pool: readonly Word[], n: number, banned: ReadonlySet<string> = new Set()): Word[] {
  const out: Word[] = [];
  if (n <= 0) return out;
  const used = new Set(banned);
  for (const w of shuffle(rng, pool)) {
    if (used.has(w[3])) continue;
    out.push(w);
    used.add(w[3]);
    if (out.length === n) break;
  }
  return out;
}

export function makeSequence(level: 1 | 2 | 3, rng: Rng): Sequence {
  const gridSize = GRID_SIZE[level];
  if (level === 3 && rng() < 0.55) {
    // Mots qui riment : suite et leurres pris dans la même famille de rimes.
    const rime = pick(rng, SIMILAR_RIMES);
    const family = shuffle(rng, WORDS.filter((w) => w[3] === rime));
    const span = rng() < 0.65 ? 4 : 5;
    const words = family.slice(0, span);
    const lures = family.slice(span, gridSize);
    const fillers = distinctRimes(rng, WORDS, gridSize - words.length - lures.length, new Set([rime]));
    return { mode: 'ressemblent', words, expected: words, grid: shuffle(rng, [...words, ...lures, ...fillers]) };
  }
  const reverse = level === 3;
  const span = level === 1 ? int(rng, 2, 3) : int(rng, 3, 4);
  const pool = level === 1 ? WORDS.filter((w) => w[2] === 1) : WORDS;
  const all = distinctRimes(rng, pool, gridSize);
  const words = all.slice(0, span);
  return {
    mode: reverse ? 'envers' : 'endroit',
    words,
    expected: reverse ? [...words].reverse() : words,
    grid: shuffle(rng, all),
  };
}

const list = (ws: readonly Word[]) => ws.map((w) => w[0]).join(', ');

export function sayFor(seq: Sequence): string {
  return `${seq.mode === 'envers' ? 'Attention, à l’envers ! ' : ''}Écoute bien : ${list(seq.words)}.`;
}

export function explainFor(seq: Sequence): string {
  if (seq.mode === 'envers') return `Les mots étaient : ${list(seq.words)}. À l’envers, on part du dernier : ${list(seq.expected)}.`;
  if (seq.mode === 'ressemblent') return `Les mots étaient : ${list(seq.words)}. Ils riment tous : écoute bien le début de chaque mot.`;
  return `Les mots étaient : ${list(seq.words)}. Astuce : répète-les tout bas pendant que tu écoutes.`;
}

function render(seq: Sequence, say: string) {
  return (el: HTMLElement, answer: (correct: boolean, detail?: string) => void, ctx: { speak(t: string): void }) => {
    // Le bouton 🔊 du moteur relirait la suite à volonté : on le remplace par un
    // « Réécouter » unique.
    el.closest('.quiz-card')?.classList.add('memoire-card');
    el.classList.add('memoire-area');
    let replayed: '' | 'avant' | 'pendant' = '';
    let taps: Word[] = [];
    let done = false;

    const badge = () => (seq.mode === 'envers' ? h('div', { class: 'memoire-badge' }, '🔄 À l’envers : du dernier au premier !') : null);

    const replayButton = (phase: 'avant' | 'pendant') =>
      h(
        'button',
        {
          class: 'btn ghost memoire-replay',
          type: 'button',
          disabled: replayed !== '',
          onclick: () => {
            if (replayed || done) return;
            replayed = phase;
            ctx.speak(say);
            listen();
          },
        },
        replayed ? '🔇 Déjà réécouté' : '🔊 Réécouter (une fois)',
      );

    function listen(): void {
      taps = [];
      el.replaceChildren(
        h(
          'div',
          { class: 'memoire-listen' },
          badge(),
          h('div', { class: 'memoire-ear', 'aria-hidden': 'true' }, '👂'),
          h('p', { class: 'memoire-hint' }, 'Écoute bien…'),
          h(
            'div',
            { class: 'memoire-actions' },
            replayButton('avant'),
            h('button', { class: 'btn primary big', type: 'button', onclick: grid }, 'J’ai écouté, je réponds ➜'),
          ),
        ),
      );
    }

    function grid(): void {
      const slots = h('div', { class: 'tiles target memoire-slots' });
      const pics = h('div', { class: 'memoire-grid' });
      const undo = h('button', { class: 'btn ghost', type: 'button', onclick: () => undoLast() }, '↩ Effacer');
      const extra = h('div', { class: 'memoire-extra' });

      const buttons = seq.grid.map((w) =>
        h(
          'button',
          { class: 'quiz-choice emoji-only memoire-pic', type: 'button', 'aria-label': w[0], onclick: () => tap(w) },
          h('span', { class: 'quiz-choice-emoji' }, w[1]),
        ),
      );
      pics.append(...buttons);

      const refresh = () => {
        slots.replaceChildren(
          ...seq.expected.map((_, i) =>
            taps[i]
              ? h('span', { class: 'tile placed memoire-slot' }, h('small', {}, String(i + 1)), taps[i][1])
              : h('span', { class: 'tile memoire-slot empty' }, h('small', {}, String(i + 1)), '?'),
          ),
        );
        seq.grid.forEach((w, i) => {
          const order = taps.indexOf(w);
          buttons[i].disabled = done || order >= 0;
          buttons[i].classList.toggle('used', order >= 0);
        });
        undo.disabled = done || taps.length === 0;
      };

      function tap(w: Word): void {
        if (done || taps.includes(w) || taps.length >= seq.expected.length) return;
        taps = [...taps, w];
        refresh();
        if (taps.length === seq.expected.length) finish();
      }

      function undoLast(): void {
        if (done) return;
        taps = taps.slice(0, -1);
        refresh();
      }

      function finish(): void {
        done = true;
        const correct = taps.every((w, i) => w === seq.expected[i]);
        refresh();
        el.querySelector('.memoire-replay')?.remove();
        const notes = [
          correct ? null : `réponse : ${list(taps)} (attendu : ${list(seq.expected)})`,
          seq.mode === 'endroit' ? null : seq.mode === 'envers' ? 'à l’envers' : 'mots qui riment',
          replayed ? `réécouté (${replayed === 'avant' ? 'avant de répondre' : 'pendant la réponse'})` : null,
        ].filter(Boolean);
        if (!correct) {
          // La grille d'images laisse la place à la bonne suite (petits écrans).
          el.querySelector('.memoire-answer')?.classList.add('corrige');
          extra.replaceChildren(
            h('p', { class: 'memoire-solution-label' }, 'La bonne suite :'),
            h(
              'div',
              { class: 'tiles memoire-solution' },
              seq.expected.map((w, i) => h('span', { class: 'tile placed memoire-slot' }, h('small', {}, String(i + 1)), w[1])),
            ),
          );
        }
        answer(correct, notes.length ? notes.join(' ; ') : undefined);
      }

      el.replaceChildren(
        h('div', { class: 'memoire-answer' }, badge(), slots, pics, h('div', { class: 'memoire-actions' }, undo, replayButton('pendant')), extra),
      );
      refresh();
    }

    listen();
  };
}

export const game: QuizGame = {
  title: 'La mémoire des mots',
  instructions: 'Écoute bien les mots, sans regarder. Ensuite, touche les images dans le même ordre !',
  levels: [
    { label: '2 ou 3 mots', description: 'mots courts, 6 images' },
    { label: '3 ou 4 mots', description: 'mots courts ou longs, 8 images' },
    { label: '4 ou 5 mots', description: 'mots qui riment, ou à l’envers' },
  ],
  makeItem(level, rng, recent) {
    const used = new Set(recent.slice(-3).flatMap((k) => k.split(':')[1]?.split('-') ?? []));
    let seq = makeSequence(level, rng);
    for (let i = 0; i < 8 && seq.words.some((w) => used.has(w[0])); i++) seq = makeSequence(level, rng);
    const say = sayFor(seq);
    const prompt =
      seq.mode === 'envers'
        ? 'Écoute les mots, puis touche les images à l’envers : du dernier au premier.'
        : 'Écoute les mots, puis touche les images dans le même ordre.';
    const item: QuizItem = {
      key: `${seq.mode}:${seq.words.map((w) => w[0]).join('-')}`,
      prompt,
      say,
      custom: render(seq, say),
      explain: explainFor(seq),
    };
    return item;
  },
};

export default quizGame(game);
