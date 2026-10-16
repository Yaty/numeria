/**
 * Le tambour des sons — conscience phonémique (segmentation et dénombrement des sons).
 *
 * On voit une image (jamais le mot écrit : on compterait les lettres) ; l'adulte dit
 * le mot, le jeu n'a pas de voix. On frappe le tambour une fois par SON entendu
 * (« chat » = ch·a = 2 sons) ; chaque frappe pose un petit tambour sur la piste, puis
 * on valide.
 * Principe repris de MorphoMystery : on assemble la réponse morceau par morceau
 * et on la valide soi-même ; une erreur n'arrête pas l'item, on réessaie.
 *
 *  - 1er échec : les gestes Borel-Maisonny des sons du mot apparaissent, dans l'ordre.
 *  - 2e échec : tous les indices — les graphèmes écrits sur les cartes, la piste montre
 *    autant d'emplacements que de sons, et les cartes s'allument une à une.
 *  - 3e échec : la réponse est donnée.
 *
 * Mots retenus : découpage en sons stable. Écartés : e muet prononcé ou non selon la
 * région (« cerise »), oi / oin et semi-voyelles (« roi », « fille », « lion »), x.
 *
 * Niveau 1 : 2 ou 3 sons, syllabes simples.
 * Niveau 2 : 3 à 5 sons, sans groupe de consonnes.
 * Niveau 3 : 4 à 8 sons, avec groupes de consonnes (fl, tr, kt…) ; sous chaque tambour
 * posé s'écrit le graphème du son (bateau : b, a, t, eau), c, g et s en couleur ; les
 * lettres muettes (le t de chat) apparaissent sur des tambours gris, hors du compte.
 */
import { h } from '../ui/dom';
import { pick } from '../core/random';
import { quizGame, type QuizGame } from '../portal/quiz';
import { GESTURES, gesturePhoto, type SoundId } from '../portal/gestes';
import { WORDS, graphemesOf, soundsOf, type Word } from '../data/sons';
import './tambour.css';

export { WORDS, soundsOf, graphemesOf, type Word } from '../data/sons';

/**
 * Lettres muettes qui suivent chaque son (« chat » : ['', 't'], « lune » : ['', '', 'e']).
 * On cherche chaque graphème dans le mot, dans l'ordre : ce qui reste entre deux
 * graphèmes (ou à la fin) ne se prononce pas.
 */
export function silentAfter(w: Word): string[] {
  const word = w[0];
  const graphemes = graphemesOf(w);
  const after = graphemes.map(() => '');
  let at = 0;
  graphemes.forEach((g, i) => {
    const found = word.indexOf(g, at);
    if (i > 0 && found > at) after[i - 1] += word.slice(at, found);
    at = found + g.length;
  });
  after[after.length - 1] += word.slice(at);
  return after;
}

/** Groupe de consonnes : deux consonnes qui se suivent (fl, tr, kt…). */
const VOWELS = new Set(['a', 'i', 'o', 'u', 'é', 'è', 'e', 'eu', 'ou', 'on', 'an', 'in']);
export const hasCluster = (w: Word) => soundsOf(w).some((s, i, all) => i > 0 && !VOWELS.has(s) && !VOWELS.has(all[i - 1]));

export const LEVELS: Record<1 | 2 | 3, { min: number; max: number; clusters: boolean }> = {
  1: { min: 2, max: 3, clusters: false },
  2: { min: 3, max: 5, clusters: false },
  3: { min: 4, max: 8, clusters: true },
};

export function poolFor(level: 1 | 2 | 3): Word[] {
  const { min, max, clusters } = LEVELS[level];
  return WORDS.filter((w) => {
    const n = soundsOf(w).length;
    return n >= min && n <= max && (clusters || !hasCluster(w));
  });
}

/** Petits tambours posés au plus sur la piste. */
export const MAX_DRUMS = 10;
const NUMBERS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];

/**
 * Graphème écrit, avec c, g et s en couleur : ces lettres changent de son selon
 * la lettre qui suit (c/ç, g/ge, s/ss). Dans « ch » et « gn », elles font partie
 * d'un autre son et restent dans la couleur normale.
 */
export function cgsRuns(g: string): { text: string; letter?: 'c' | 'g' | 's' }[] {
  if (g === 'ch' || g === 'gn') return [{ text: g }];
  return [...g].map((ch) => {
    const letter = ch === 'ç' ? 'c' : ch;
    return letter === 'c' || letter === 'g' || letter === 's' ? { text: ch, letter } : { text: ch };
  });
}

export function graphemeEl(g: string, cls: string): HTMLElement {
  return h(
    'span',
    { class: cls },
    cgsRuns(g).map((r) => (r.letter ? h('span', { class: `tambour-cgs tambour-${r.letter}` }, r.text) : r.text)),
  );
}

function gestureCard(id: SoundId, grapheme: string | null): HTMLElement {
  const g = GESTURES[id];
  const photo = gesturePhoto(id);
  return h(
    'figure',
    { class: 'tambour-card' },
    photo ? h('img', { src: photo, alt: g.hint }) : h('span', { class: 'tambour-card-icon', role: 'img', 'aria-label': g.hint }, g.icon),
    grapheme ? graphemeEl(grapheme, 'tambour-card-label') : null,
  );
}

export const game: QuizGame = {
  title: 'Le tambour des sons',
  instructions: 'Dis le mot de l’image. Tape sur le tambour une fois pour chaque son, puis appuie sur Valider.',
  // Pas de voix : l'adulte dit le mot (la voix de synthèse déforme certains sons).
  silent: true,
  levels: [
    { label: 'Mots courts', description: 'deux ou trois sons' },
    { label: 'Mots moyens', description: 'trois à cinq sons' },
    { label: 'Mots longs', description: 'quatre à huit sons, consonnes qui se suivent ; les lettres s’écrivent sous les tambours' },
  ],
  makeItem(level, rng, recent) {
    const pool = poolFor(level);
    // Le nombre de sons est tiré d'abord : les réponses sont équilibrées.
    const counts = [...new Set(pool.map((w) => soundsOf(w).length))];
    const n = pick(rng, counts);
    const same = pool.filter((w) => soundsOf(w).length === n);
    let entry = pick(rng, same);
    for (let i = 0; i < 10 && recent.includes(`son:${entry[0]}`); i++) entry = pick(rng, same);
    const [word, , emoji] = entry;
    const sounds = soundsOf(entry);
    const graphemes = graphemesOf(entry);
    const silent = silentAfter(entry);
    // Niveau 3 : chaque tambour posé montre le graphème de son son ; les lettres
    // muettes qui le suivent apparaissent sur des tambours gris, hors du compte.
    const writeUnder = level === 3;
    return {
      key: `son:${word}`,
      prompt: 'Combien de sons dans ce mot ?',
      say: word,
      stimulus: { emoji },
      explain: `${word} : ${graphemes.join(' · ')}. ${NUMBERS[n]} son${n > 1 ? 's' : ''}.`.replace(/^./, (c) => c.toUpperCase()),
      custom(el, answer) {
        el.classList.add('tambour-area');
        let fails = 0;
        let done = false;
        let placed = 0;
        /** 2e échec : la piste montre un emplacement par son. */
        let slots = false;
        const track = h('div', { class: 'tambour-track', 'aria-live': 'polite', 'aria-label': 'Tambours posés' });
        const hints = h('div', { class: 'tambour-hints' });
        const note = h('p', { class: 'tambour-note', 'aria-live': 'polite' });

        const beat = (i: number, fresh: boolean) =>
          h(
            'div',
            { class: `tambour-beat${fresh ? ' fresh' : ''}` },
            h('button', { class: 'tambour-small', type: 'button', 'aria-label': 'Enlever ce tambour', onclick: () => removeDrum() }, '🥁'),
            writeUnder && i < n ? graphemeEl(graphemes[i], 'tambour-graph') : null,
          );
        const muted = (letters: string, fresh: boolean) =>
          h(
            'div',
            { class: `tambour-beat tambour-muet${fresh ? ' fresh' : ''}`, title: 'Lettre muette : elle ne s’entend pas' },
            h('span', { class: 'tambour-small', 'aria-hidden': 'true' }, '🥁'),
            h('span', { class: 'tambour-graph' }, letters),
          );

        /** Redessine la piste ; seul le dernier tambour posé est animé. */
        const render = (freshIndex = -1) => {
          const items: HTMLElement[] = [];
          const total = slots ? Math.max(n, placed) : placed;
          for (let i = 0; i < total; i++) {
            const drum = i < placed ? beat(i, i === freshIndex) : null;
            items.push(slots && i < n ? h('span', { class: `tambour-slot${drum ? ' filled' : ''}` }, drum) : drum!);
            if (writeUnder && i < placed && i < n && silent[i]) items.push(muted(silent[i], i === freshIndex));
          }
          track.replaceChildren(...items);
          validate.disabled = placed === 0 || done;
        };
        const addDrum = () => {
          if (done || placed >= MAX_DRUMS) return;
          placed++;
          big.classList.remove('hit');
          void big.offsetWidth;
          big.classList.add('hit');
          render(placed - 1);
        };
        const removeDrum = () => {
          if (done || placed === 0) return;
          placed--;
          render();
        };

        /** Cartes des sons, dans l'ordre du mot ; elles s'allument une à une. */
        const showCards = (withGraphemes: boolean) => {
          const cards = sounds.map((s, i) => gestureCard(s, withGraphemes ? graphemes[i] : null));
          hints.replaceChildren(h('div', { class: 'tambour-cards' }, cards));
          cards.forEach((c, i) => {
            c.style.animationDelay = `${i * 0.5}s`;
            c.classList.add('lit');
          });
        };

        const big = h('button', { class: 'tambour-big', type: 'button', 'aria-label': 'Taper un son', onclick: addDrum }, '🥁');
        const undo = h('button', { class: 'btn tambour-undo', type: 'button', onclick: removeDrum }, '⌫ Enlever');
        const validate = h(
          'button',
          {
            class: 'btn primary tambour-ok',
            type: 'button',
            disabled: true,
            onclick: () => {
              if (done) return;
              const count = placed;
              if (count === n) {
                done = true;
                track.classList.add('right');
                note.textContent = '';
                showCards(true);
                render();
                return answer(true, fails === 0 ? undefined : fails === 1 ? 'avec les gestes' : 'avec tous les indices');
              }
              fails++;
              track.classList.remove('shake');
              void track.offsetWidth;
              track.classList.add('shake');
              if (fails === 1) {
                placed = 0;
                showCards(false);
                note.textContent = 'Regarde les gestes et redis le mot.';
              } else if (fails === 2) {
                placed = 0;
                slots = true;
                showCards(true);
                note.textContent = 'Un tambour pour chaque carte.';
              } else {
                done = true;
                track.classList.add('wrong');
                note.textContent = '';
                answer(false, `${count} au lieu de ${n}`);
              }
              render();
            },
          },
          '✓ Valider',
        );

        el.append(h('div', { class: 'tambour-play' }, big, h('div', { class: 'tambour-side' }, undo, validate)), track, note, hints);
        render();
      },
    };
  },
};

export default quizGame(game);
