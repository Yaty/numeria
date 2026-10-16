/**
 * La réserve de l'écureuil — conscience phonémique (repérer un son dans un mot).
 *
 * Un petit écureuil marron range ses provisions : une image apparaît (jamais le mot
 * écrit), l'adulte dit le mot, l'enfant la glisse (ou touche le panier) dans le bon
 * panier. Chaque panier porte le geste Borel-Maisonny de son son. Le jeu n'a pas de
 * voix. Une partie garde le même son du début à la fin.
 *
 * Niveau 1 : on entend le son ou pas ? (les intrus ont souvent le son voisin : ch / s)
 * Niveau 2 : lequel de deux sons proches (ch ou s, f ou v, an ou on…) ?
 * Niveau 3 : où est le son : au début, au milieu ou à la fin du mot ?
 *
 * Après une réponse, le mot s'écrit découpé en sons (v · a · ch).
 */
import { h } from '../ui/dom';
import { pick } from '../core/random';
import { quizGame, type QuizGame } from '../portal/quiz';
import { GESTURES, gesturePhoto, type SoundId } from '../portal/gestes';
import { WORDS, graphemesOf, soundsOf, type Word } from '../data/sons';
import './ecureuil.css';

type Level = 1 | 2 | 3;
export type Position = 'début' | 'milieu' | 'fin';
export const WHERE: Record<Position, string> = { début: 'au début', milieu: 'au milieu', fin: 'à la fin' };

/** Sons proches, qu'on confond souvent. */
export const PAIRS: readonly (readonly [SoundId, SoundId])[] = [
  ['ch', 's'], ['j', 'z'], ['f', 'v'], ['k', 'g'], ['p', 'b'], ['t', 'd'], ['s', 'z'], ['ch', 'j'], ['an', 'on'], ['m', 'n'],
];
const MIN_WORDS = 5;
export const ITEMS = 10;

const has = (w: Word, s: SoundId) => soundsOf(w).includes(s);
const count = (w: Word, s: SoundId) => soundsOf(w).filter((x) => x === s).length;

export function positionOf(w: Word, s: SoundId): Position {
  const sounds = soundsOf(w);
  const i = sounds.indexOf(s);
  return i === 0 ? 'début' : i === sounds.length - 1 ? 'fin' : 'milieu';
}

/** Mots du niveau 3 pour un son : le son une seule fois. */
const placeable = (s: SoundId) => WORDS.filter((w) => count(w, s) === 1);
/** Mots du niveau 2 pour une paire : un seul des deux sons. */
const eitherOf = ([a, b]: readonly [SoundId, SoundId]) => WORDS.filter((w) => has(w, a) !== has(w, b));

const CANDIDATES: SoundId[] = ['ch', 's', 'f', 'v', 'j', 'z', 'k', 'g', 'p', 'b', 't', 'd', 'l', 'r', 'm', 'n', 'ou', 'on', 'an', 'in', 'u', 'é'];

/** Sons jouables à chaque niveau (assez de mots). Au niveau 2, une « cible » est une paire « a/b ». */
export const TARGETS: Record<Level, string[]> = {
  1: CANDIDATES.filter((s) => WORDS.filter((w) => has(w, s)).length >= MIN_WORDS),
  2: PAIRS.filter(([a, b]) => eitherOf([a, b]).filter((w) => has(w, a)).length >= 4 && eitherOf([a, b]).filter((w) => has(w, b)).length >= 4).map(
    ([a, b]) => `${a}/${b}`,
  ),
  3: CANDIDATES.filter((s) => {
    const ws = placeable(s);
    return ws.length >= MIN_WORDS && new Set(ws.map((w) => positionOf(w, s))).size >= 2;
  }),
};

/** Clé d'un item : ecu:niveau:cible:mot. */
const keyOf = (level: Level, target: string, w: Word) => `ecu:${level}:${target}:${w[0]}`;

/** Le son de la partie : celui des items précédents tant que la partie n'est pas finie. */
export function targetFor(level: Level, rng: () => number, recent: readonly string[]): string {
  let run = 0;
  let last: string | null = null;
  for (let i = recent.length - 1; i >= 0; i--) {
    const [tag, l, t] = recent[i].split(':');
    if (tag !== 'ecu' || Number(l) !== level || (last !== null && t !== last)) break;
    last = t;
    run++;
  }
  if (last !== null && run % ITEMS !== 0) return last;
  const options = TARGETS[level].filter((t) => t !== last);
  return pick(rng, options.length ? options : TARGETS[level]);
}

/** Un mot pas vu récemment, sinon n'importe lequel. */
function fresh(rng: () => number, pool: readonly Word[], level: Level, target: string, recent: readonly string[]): Word {
  const unseen = pool.filter((w) => !recent.includes(keyOf(level, target, w)));
  return pick(rng, unseen.length ? unseen : pool);
}

export interface Basket {
  id: string;
  sound: SoundId | null;
  caption: string;
}

export interface Round {
  word: Word;
  target: string;
  baskets: Basket[];
  /** Panier de la bonne réponse. */
  answer: string;
}

const q = (s: SoundId) => `« ${s} »`;

export function makeRound(level: Level, rng: () => number, recent: readonly string[]): Round {
  const target = targetFor(level, rng, recent);
  if (level === 1) {
    const s = target as SoundId;
    const yes = rng() < 0.5;
    const partners = PAIRS.flatMap(([a, b]) => (a === s ? [b] : b === s ? [a] : []));
    const without = WORDS.filter((w) => !has(w, s));
    const near = without.filter((w) => partners.some((p) => has(w, p)));
    const pool = yes ? WORDS.filter((w) => has(w, s)) : near.length >= 3 && rng() < 0.6 ? near : without;
    return {
      word: fresh(rng, pool, level, target, recent),
      target,
      baskets: [
        { id: 'oui', sound: s, caption: `J’entends ${q(s)}` },
        { id: 'non', sound: null, caption: `Pas de ${q(s)}` },
      ],
      answer: yes ? 'oui' : 'non',
    };
  }
  if (level === 2) {
    const [a, b] = target.split('/') as [SoundId, SoundId];
    const word = fresh(rng, eitherOf([a, b]), level, target, recent);
    return {
      word,
      target,
      baskets: [a, b].map((s) => ({ id: s, sound: s, caption: q(s) })),
      answer: has(word, a) ? a : b,
    };
  }
  const s = target as SoundId;
  const word = fresh(rng, placeable(s), level, target, recent);
  return {
    word,
    target,
    baskets: (['début', 'milieu', 'fin'] as Position[]).map((p) => ({ id: p, sound: null, caption: WHERE[p] })),
    answer: positionOf(word, s),
  };
}

/** « v · a · ch » : le mot découpé en sons (graphèmes). */
export const spelled = (w: Word) => graphemesOf(w).join(' · ');

function explain(level: Level, r: Round): string {
  const [word] = r.word;
  const cut = `${word} : ${spelled(r.word)}`;
  if (level === 1) return r.answer === 'oui' ? `On entend ${q(r.target as SoundId)} dans ${cut}.` : `Pas de ${q(r.target as SoundId)} dans ${cut}.`;
  if (level === 2) return `Dans ${cut}, on entend ${q(r.answer as SoundId)}.`;
  return `Dans ${cut}, ${q(r.target as SoundId)} est ${WHERE[r.answer as Position]}.`;
}

function prompt(level: Level, r: Round): string {
  if (level === 1) return `Est-ce qu’on entend ${q(r.target as SoundId)} dans ce mot ?`;
  if (level === 2) {
    const [a, b] = r.target.split('/') as SoundId[];
    return `On entend ${q(a)} ou ${q(b)} ?`;
  }
  return `Où est le son ${q(r.target as SoundId)} : au début, au milieu ou à la fin ?`;
}

/** Le petit écureuil marron (dessin vectoriel, animé par des classes). */
const SQUIRREL = `<svg viewBox="0 0 200 200" aria-hidden="true">
  <g class="ecu-tail">
    <path d="M118 176C192 174 204 92 168 54 142 28 102 42 108 74c5 26 42 22 38 48-4 24-30 30-28 54z" fill="#9a5a2c"/>
    <path d="M126 164c46-6 56-66 34-92-14-15-32-9-30 8 3 18 30 26 24 50-5 18-24 22-28 34z" fill="#c98448"/>
  </g>
  <ellipse cx="82" cy="142" rx="38" ry="44" fill="#8b5a2b"/>
  <ellipse cx="80" cy="150" rx="22" ry="29" fill="#f2d4ae"/>
  <ellipse cx="64" cy="184" rx="16" ry="8" fill="#74451f"/>
  <ellipse cx="100" cy="184" rx="16" ry="8" fill="#74451f"/>
  <g class="ecu-head">
    <path d="M54 58 47 18 78 46z" fill="#8b5a2b"/>
    <path d="M58 52 54 30 71 47z" fill="#e8a98c"/>
    <path d="M106 58 113 18 82 46z" fill="#8b5a2b"/>
    <path d="M102 52 106 30 89 47z" fill="#e8a98c"/>
    <circle cx="80" cy="80" r="35" fill="#8b5a2b"/>
    <ellipse cx="80" cy="95" rx="20" ry="14" fill="#f2d4ae"/>
    <g class="ecu-eyes">
      <circle cx="66" cy="76" r="6.5" fill="#2b1a10"/><circle cx="68.5" cy="73.5" r="2.2" fill="#fff"/>
      <circle cx="94" cy="76" r="6.5" fill="#2b1a10"/><circle cx="96.5" cy="73.5" r="2.2" fill="#fff"/>
    </g>
    <path class="ecu-happy-eyes" d="M59 77q7-8 14 0M87 77q7-8 14 0" stroke="#2b1a10" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="57" cy="92" r="5.5" fill="#f19c9c" opacity=".55"/>
    <circle cx="103" cy="92" r="5.5" fill="#f19c9c" opacity=".55"/>
    <ellipse cx="80" cy="89" rx="5" ry="3.6" fill="#3b2314"/>
    <path d="M80 92q-5 7-10 2M80 92q5 7 10 2" stroke="#3b2314" stroke-width="2" fill="none" stroke-linecap="round"/>
    <rect x="77" y="95" width="6" height="5" rx="1.2" fill="#fff"/>
  </g>
  <g class="ecu-nut">
    <ellipse cx="81" cy="131" rx="9" ry="11" fill="#c98a3c"/>
    <path d="M70 125q11-12 22 0z" fill="#6b4423"/>
  </g>
  <ellipse cx="70" cy="131" rx="7" ry="5" fill="#74451f"/>
  <ellipse cx="92" cy="131" rx="7" ry="5" fill="#74451f"/>
</svg>`;

function squirrelEl(): HTMLElement {
  const el = h('div', { class: 'ecu-squirrel' });
  el.innerHTML = SQUIRREL;
  return el;
}

function basketEl(b: Basket, onPick: () => void): HTMLButtonElement {
  const photo = b.sound ? gesturePhoto(b.sound) : undefined;
  return h(
    'button',
    { class: 'ecu-basket', type: 'button', 'data-id': b.id, onclick: onPick },
    b.sound
      ? photo
        ? h('img', { src: photo, alt: `Geste du son ${b.sound}`, draggable: 'false' })
        : h('span', { class: 'ecu-basket-icon' }, GESTURES[b.sound].icon)
      : b.id === 'non'
        ? h('span', { class: 'ecu-basket-icon' }, '🍂')
        : null,
    h('span', { class: 'ecu-basket-label' }, b.caption),
  ) as HTMLButtonElement;
}

function gestureSign(s: SoundId): HTMLElement {
  const photo = gesturePhoto(s);
  return h(
    'div',
    { class: 'ecu-sign' },
    photo ? h('img', { src: photo, alt: `Geste du son ${s}`, draggable: 'false' }) : h('span', { class: 'ecu-basket-icon' }, GESTURES[s].icon),
    h('strong', {}, s),
  );
}

/** Position dans le mot, dessinée : trois cases, celle du panier en couleur. */
function positionDots(p: Position): HTMLElement {
  const i = ['début', 'milieu', 'fin'].indexOf(p);
  return h('span', { class: 'ecu-dots', 'aria-hidden': 'true' }, [0, 1, 2].map((k) => h('i', { class: k === i ? 'on' : '' })));
}

export const game: QuizGame<Level> = {
  title: 'La réserve de l’écureuil',
  instructions:
    'Dis le mot de l’image. Le petit écureuil range ses provisions : glisse l’image dans le bon panier, ou touche le panier.',
  silent: true,
  itemsPerRound: ITEMS,
  levels: [
    { label: 'J’entends le son ?', description: 'On entend le son ou pas.' },
    { label: 'Lequel des deux ?', description: 'Deux sons proches : ch ou s, f ou v…' },
    { label: 'Où est le son ?', description: 'Au début, au milieu ou à la fin du mot.' },
  ],
  makeItem(level, rng, recent) {
    const r = makeRound(level, rng, recent);
    const [word, , emoji] = r.word;
    return {
      key: keyOf(level, r.target, r.word),
      prompt: prompt(level, r),
      explain: explain(level, r),
      custom(el, answer) {
        let done = false;
        const squirrel = squirrelEl();
        const pic = h('div', { class: 'ecu-pic', role: 'img', 'aria-label': word }, h('span', {}, emoji));
        const leaves = h('div', { class: 'ecu-leaves', 'aria-hidden': 'true' }, ['🍂', '🍁', '🍂'].map((l) => h('span', {}, l)));
        const baskets = r.baskets.map((b) => {
          const el = basketEl(b, () => choose(b.id));
          if (level === 3) el.prepend(positionDots(b.id as Position));
          return el;
        });
        const row = h('div', { class: `ecu-baskets n${baskets.length}` }, baskets);
        // niveau 3 : le geste du son cherché, tenu à côté de l'écureuil
        const sign = level === 3 ? gestureSign(r.target as SoundId) : null;
        const scene = h('div', { class: 'ecu-scene' }, leaves, squirrel, sign, pic);
        const written = h('p', { class: 'ecu-word', 'aria-live': 'polite' });
        el.classList.add('ecu-area');
        el.append(scene, row, written);

        function choose(id: string): void {
          if (done) return;
          done = true;
          const ok = id === r.answer;
          const target = baskets.find((b) => b.dataset.id === r.answer)!;
          const chosen = baskets.find((b) => b.dataset.id === id)!;
          baskets.forEach((b) => (b.disabled = true));
          written.textContent = spelled(r.word);
          if (ok) {
            flyInto(target);
            target.classList.add('right');
            squirrel.classList.add('happy');
          } else {
            pic.style.transform = '';
            pic.classList.add('nope');
            chosen.classList.add('wrong');
            target.classList.add('right');
            squirrel.classList.add('think');
          }
          answer(ok, ok ? undefined : r.baskets.find((b) => b.id === id)?.caption);
        }

        /** L'image file dans le panier. */
        function flyInto(b: HTMLElement): void {
          const from = pic.getBoundingClientRect();
          const to = b.getBoundingClientRect();
          const dx = to.left + to.width / 2 - (from.left + from.width / 2);
          const dy = to.top + to.height / 2 - (from.top + from.height / 2);
          pic.classList.add('stored');
          pic.style.transform = `translate(${dx}px, ${dy}px) scale(0.35)`;
        }

        // Glisser l'image (souris, doigt) ; la lâcher sur un panier le choisit.
        let drag: { id: number; x: number; y: number } | null = null;
        const under = (e: PointerEvent) =>
          baskets.find((b) => {
            const r = b.getBoundingClientRect();
            return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
          });
        pic.addEventListener('pointerdown', (e) => {
          if (done) return;
          drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
          pic.setPointerCapture(e.pointerId);
          pic.classList.add('dragging');
        });
        pic.addEventListener('pointermove', (e) => {
          if (!drag || e.pointerId !== drag.id) return;
          pic.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px) rotate(-4deg)`;
          const over = under(e);
          baskets.forEach((b) => b.classList.toggle('over', b === over));
        });
        const drop = (e: PointerEvent) => {
          if (!drag || e.pointerId !== drag.id) return;
          drag = null;
          pic.classList.remove('dragging');
          baskets.forEach((b) => b.classList.remove('over'));
          const over = under(e);
          if (over) choose(over.dataset.id!);
          else pic.style.transform = '';
        };
        pic.addEventListener('pointerup', drop);
        pic.addEventListener('pointercancel', drop);
      },
    };
  },
};

export default quizGame(game);
