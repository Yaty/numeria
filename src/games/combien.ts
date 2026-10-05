/**
 * Combien ? — logico-mathématiques (sens du nombre précoce).
 *
 * Progression :
 * - Niveau 1 : subitizing — 1 à 5 points (configuration du dé ou disposition au
 *   hasard) montrés 1,5 s, puis l'enfant choisit le nombre (1 à 5).
 * - Niveau 2 : reconnaissance de configurations canoniques de 4 à 10, montrées 1,2 s
 *   (dé, deux dés, doigts ✋ + ☝️/✌️, boîte de dix), et comparaison de deux
 *   collections « Où y en a-t-il le plus ? » montrées 2,5 s, avec des essais en
 *   conflit (la collection la plus nombreuse a les plus petits points et la plus
 *   petite surface totale) et des essais congruents.
 * - Niveau 3 : ligne numérique — placer un nombre sur une droite 0–10 ou 0–20
 *   (choisir parmi 3 positions marquées) — et comparaison de nombres écrits
 *   jusqu'à 100 (inversions 47/74, même dizaine, piège des unités 39/52, 9/12).
 *
 * Après une erreur, la collection est remontrée avec chaque élément numéroté.
 */
import { toFrenchWords } from '../core/french';
import { int, pick, shuffle, type Rng } from '../core/random';
import { quizGame, type QuizGame, type QuizItem } from '../portal/quiz';
import { h } from '../ui/dom';
import './combien.css';

export interface Pt {
  x: number;
  y: number;
  r: number;
}

export type Display = 'de' | 'hasard' | 'deux-des' | 'doigts' | 'cadre';

export interface CountSpec {
  kind: 'count';
  n: number;
  display: Display;
  /** Points en coordonnées SVG (sauf pour les doigts). */
  points: Pt[];
  /** Pour deux dés : la valeur de chaque dé. */
  dice?: [number, number];
  choices: number[];
  flashMs: number;
}

export interface CompareSpec {
  kind: 'compare';
  left: Pt[];
  right: Pt[];
  /** Vrai si la collection la plus nombreuse a les plus petits points. */
  conflict: boolean;
}

export interface LineSpec {
  kind: 'line';
  max: 10 | 20;
  target: number;
  /** Trois positions marquées (dont la bonne), dans l'ordre croissant. */
  marks: number[];
}

export interface WrittenSpec {
  kind: 'written';
  a: number;
  b: number;
  ask: 'grand' | 'petit';
  trap: 'inversion' | 'dizaine' | 'unites' | 'chiffres';
}

export type Spec = CountSpec | CompareSpec | LineSpec | WrittenSpec;

/* ---------- Dispositions ---------- */

/** Configurations du dé dans une case de 100 × 100. */
const DICE: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
};

export const VIEW = { w: 240, h: 140 };
const COMPARE_VIEW = { w: 200, h: 170 };

function dicePoints(n: number, ox: number, oy: number, size: number): Pt[] {
  const k = size / 100;
  return DICE[n].map(([x, y]) => ({ x: ox + x * k, y: oy + y * k, r: 9 * k }));
}

/**
 * Points sans chevauchement, au hasard, dans un rectangle (marge comprise).
 * Tirage avec rejet ; après 50 échecs, repli sur une grille aux cases tirées au
 * hasard (toujours possible), pour ne jamais boucler sans fin.
 */
export function scatter(rng: Rng, radii: number[], w: number, h: number, gap = 6): Pt[] {
  for (let attempt = 0; attempt < 50; attempt++) {
    const pts: Pt[] = [];
    for (const r of radii) {
      for (let t = 0; t < 200; t++) {
        const p = { x: r + 4 + rng() * (w - 2 * r - 8), y: r + 4 + rng() * (h - 2 * r - 8), r };
        if (pts.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= p.r + q.r + gap)) {
          pts.push(p);
          break;
        }
      }
    }
    if (pts.length === radii.length) return pts;
  }
  const rMax = Math.max(...radii);
  const cell = 2 * rMax + gap;
  const cols = Math.floor((w - 8) / cell);
  const rows = Math.floor((h - 8) / cell);
  const cw = (w - 8) / cols;
  const ch = (h - 8) / rows;
  const cells = shuffle(rng, Array.from({ length: cols * rows }, (_, i) => i)).slice(0, radii.length);
  return cells.map((c, i) => {
    const r = radii[i];
    const jx = (cw - cell) * (rng() - 0.5);
    const jy = (ch - cell) * (rng() - 0.5);
    return { x: 4 + (c % cols) * cw + cw / 2 + jx, y: 4 + Math.floor(c / cols) * ch + ch / 2 + jy, r };
  });
}

/** Boîte de dix : 2 rangées de 5 cases, remplies rangée du haut d'abord. */
export function framePoints(n: number): Pt[] {
  const cell = 40;
  const ox = (VIEW.w - 5 * cell) / 2;
  const oy = (VIEW.h - 2 * cell) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: ox + (i % 5) * cell + cell / 2, y: oy + Math.floor(i / 5) * cell + cell / 2, r: 14 }));
}

export const FINGERS: Record<number, string> = { 5: '✋', 6: '✋☝️', 7: '✋✌️', 10: '✋✋' };

/** Valeurs des deux dés pour 7 à 10 (chaque dé entre 2 et 6). */
const DICE_PAIRS: Record<number, [number, number][]> = {
  7: [[4, 3], [5, 2], [6, 1]],
  8: [[4, 4], [5, 3], [6, 2]],
  9: [[5, 4], [6, 3]],
  10: [[5, 5], [6, 4]],
};

/* ---------- Générateurs ---------- */

function countChoices(rng: Rng, n: number, lo: number, hi: number): number[] {
  const near = shuffle(rng, [n - 2, n - 1, n + 1, n + 2].filter((v) => v >= lo && v <= hi));
  const pickNear = [...near.filter((v) => Math.abs(v - n) === 1), ...near.filter((v) => Math.abs(v - n) === 2)].slice(0, 3);
  return [n, ...pickNear].sort((a, b) => a - b);
}

function makeCount(level: 1 | 2, rng: Rng): CountSpec {
  if (level === 1) {
    const n = int(rng, 1, 5);
    const display: Display = n === 1 || rng() < 0.5 ? 'de' : 'hasard';
    const points =
      display === 'de'
        ? dicePoints(n, (VIEW.w - 120) / 2, (VIEW.h - 120) / 2, 120)
        : scatter(rng, Array<number>(n).fill(13), VIEW.w, VIEW.h, 10);
    return { kind: 'count', n, display, points, choices: [1, 2, 3, 4, 5], flashMs: 1500 };
  }
  const display = pick(rng, ['de', 'deux-des', 'doigts', 'cadre', 'cadre'] as const);
  let n: number;
  let points: Pt[] = [];
  let dice: [number, number] | undefined;
  if (display === 'de') {
    n = int(rng, 4, 6);
    points = dicePoints(n, (VIEW.w - 120) / 2, (VIEW.h - 120) / 2, 120);
  } else if (display === 'deux-des') {
    n = int(rng, 7, 10);
    dice = pick(rng, DICE_PAIRS[n]);
    points = [...dicePoints(dice[0], 6, 10, 110), ...dicePoints(dice[1], VIEW.w - 116, 10, 110)];
  } else if (display === 'doigts') {
    n = pick(rng, [5, 6, 7, 10]);
  } else {
    n = int(rng, 4, 10);
    points = framePoints(n);
  }
  return { kind: 'count', n, display, points, dice, choices: countChoices(rng, n, 1, 12), flashMs: 1200 };
}

/** Paires (petit, grand) : rapport ≤ 2/3, facile à discriminer pour un jeune enfant. */
export const COMPARE_PAIRS: [number, number][] = [
  [2, 4], [3, 5], [3, 6], [4, 6], [4, 7], [4, 8], [5, 8], [5, 9], [5, 10], [6, 9], [6, 10], [3, 7], [2, 5],
];
export const SMALL_R = 8;
export const BIG_R = 15;

function makeCompare(rng: Rng): CompareSpec {
  const [few, many] = pick(rng, COMPARE_PAIRS);
  const conflict = rng() < 0.6;
  const manyPts = scatter(rng, Array<number>(many).fill(conflict ? SMALL_R : BIG_R), COMPARE_VIEW.w, COMPARE_VIEW.h);
  const fewPts = scatter(rng, Array<number>(few).fill(conflict ? BIG_R : SMALL_R), COMPARE_VIEW.w, COMPARE_VIEW.h);
  return rng() < 0.5 ? { kind: 'compare', left: manyPts, right: fewPts, conflict } : { kind: 'compare', left: fewPts, right: manyPts, conflict };
}

function makeLine(rng: Rng): LineSpec {
  const max = rng() < 0.5 ? 10 : 20;
  const gap = max === 10 ? 2 : 4;
  for (;;) {
    const target = int(rng, 1, max - 1);
    const others = shuffle(rng, Array.from({ length: max - 1 }, (_, i) => i + 1)).filter((v) => Math.abs(v - target) >= gap);
    const a = others[0];
    const b = others.find((v) => Math.abs(v - a) >= gap);
    if (a !== undefined && b !== undefined) return { kind: 'line', max, target, marks: [target, a, b].sort((x, y) => x - y) };
  }
}

function makeWritten(rng: Rng): WrittenSpec {
  const trap = pick(rng, ['inversion', 'inversion', 'dizaine', 'unites', 'unites', 'chiffres'] as const);
  let a: number;
  let b: number;
  if (trap === 'inversion') {
    const [d1, d2] = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    [a, b] = [d1 * 10 + d2, d2 * 10 + d1];
  } else if (trap === 'dizaine') {
    const t = int(rng, 1, 9);
    const [u1, u2] = shuffle(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    [a, b] = [t * 10 + u1, t * 10 + u2];
  } else if (trap === 'unites') {
    // Le plus petit a le plus grand chiffre des unités : 39 / 52.
    const t = int(rng, 1, 7);
    const t2 = t + int(rng, 1, 2);
    const uBig = int(rng, 6, 9);
    const uSmall = int(rng, 0, uBig - 3);
    [a, b] = [t * 10 + uBig, t2 * 10 + uSmall];
  } else {
    // Un chiffre contre deux chiffres : 9 / 12 (le chiffre seul est plus grand).
    const one = int(rng, 6, 9);
    const two = 10 + int(rng, 0, one - 1);
    [a, b] = [one, two];
  }
  if (rng() < 0.5) [a, b] = [b, a];
  return { kind: 'written', a, b, ask: rng() < 0.7 ? 'grand' : 'petit', trap };
}

export function makeSpec(level: 1 | 2 | 3, rng: Rng): Spec {
  if (level === 1) return makeCount(1, rng);
  if (level === 2) return rng() < 0.6 ? makeCount(2, rng) : makeCompare(rng);
  return rng() < 0.5 ? makeLine(rng) : makeWritten(rng);
}

export function specKey(s: Spec): string {
  switch (s.kind) {
    case 'count':
      return `n${s.n}:${s.display}`;
    case 'compare':
      return `plus:${s.left.length}v${s.right.length}:${s.conflict ? 'conflit' : 'congruent'}`;
    case 'line':
      return `ligne${s.max}:${s.target}`;
    case 'written':
      return `ecrit:${s.a}v${s.b}:${s.ask}`;
  }
}

/* ---------- Explications ---------- */

const count = (n: number) => Array.from({ length: n }, (_, i) => i + 1).join(', ');
const words = (n: number) => toFrenchWords(n);

export function explainCount(s: CountSpec): string {
  const name = s.display === 'doigts' ? 'doigts' : 'points';
  if (s.display === 'doigts') {
    const rest = s.n - 5;
    return s.n === 10 ? 'Deux mains, c’est 10 doigts : 5 et 5.' : rest === 0 ? 'Une main, c’est 5 doigts.' : `Une main, c’est 5 doigts, plus ${rest} : ${s.n} doigts.`;
  }
  if (s.display === 'deux-des' && s.dice) return `${s.dice[0]} et ${s.dice[1]}, ça fait ${s.n} points. On compte : ${count(s.n)}.`;
  if (s.display === 'cadre' && s.n > 5) return `Il y avait ${s.n} points : 5 en haut et ${s.n - 5} en bas.`;
  if (s.display === 'cadre') return `Il y avait ${s.n} points. La boîte a 10 cases, et ${10 - s.n} cases restaient vides.`;
  return s.n === 1 ? 'Il y avait 1 seul point.' : `Il y avait ${s.n} ${name}. On compte : ${count(s.n)}.`;
}

export function explainCompare(s: CompareSpec): string {
  const [l, r] = [s.left.length, s.right.length];
  const most = Math.max(l, r);
  const base = `À gauche, il y avait ${l} points ; à droite, ${r} points. ${most}, c’est plus que ${Math.min(l, r)}.`;
  return s.conflict ? `${base} Attention : de gros points ne veulent pas dire plus de points !` : base;
}

export function explainLine(s: LineSpec): string {
  const mid = s.max / 2;
  if (s.target === mid) return `${s.target} est juste au milieu, entre 0 et ${s.max}.`;
  return s.target < mid
    ? `${s.target} est avant le milieu (${mid}) : il est plus près de 0 que de ${s.max}.`
    : `${s.target} est après le milieu (${mid}) : il est plus près de ${s.max} que de 0.`;
}

export function explainWritten(s: WrittenSpec): string {
  const big = Math.max(s.a, s.b);
  const small = Math.min(s.a, s.b);
  const answer = s.ask === 'grand' ? `${big} est le plus grand.` : `${small} est le plus petit.`;
  if (s.trap === 'chiffres') return `${answer} ${big} a deux chiffres : il est plus grand que ${small}, qui n’en a qu’un.`;
  if (s.trap === 'dizaine') return `${answer} Même dizaine : on regarde les unités, ${big % 10} est plus grand que ${small % 10}.`;
  const tens = (n: number) => `${n} dizaine${n > 1 ? 's' : ''}`;
  return `${answer} On regarde d’abord les dizaines : ${tens(Math.floor(big / 10))}, c’est plus que ${tens(Math.floor(small / 10))}.`;
}

/* ---------- Rendu SVG ---------- */

const NS = 'http://www.w3.org/2000/svg';
function svg(tag: string, attrs: Record<string, string | number>, ...children: (Node | string)[]): SVGElement {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  el.append(...children);
  return el;
}

const DOT_COLOR = '#e8574c';

/** Dessin d'une collection ; `numbered` ajoute le rang de chaque point (explication). */
function drawCount(s: CountSpec, numbered: boolean): Element {
  if (s.display === 'doigts') return h('div', { class: 'combien-fingers' }, FINGERS[s.n]);
  const parts: SVGElement[] = [];
  if (s.display === 'de') parts.push(svg('rect', { x: (VIEW.w - 120) / 2, y: (VIEW.h - 120) / 2, width: 120, height: 120, rx: 18, class: 'combien-die' }));
  if (s.display === 'deux-des') {
    parts.push(svg('rect', { x: 6, y: 10, width: 110, height: 110, rx: 16, class: 'combien-die' }));
    parts.push(svg('rect', { x: VIEW.w - 116, y: 10, width: 110, height: 110, rx: 16, class: 'combien-die' }));
  }
  if (s.display === 'cadre') {
    const cell = 40;
    const ox = (VIEW.w - 5 * cell) / 2;
    const oy = (VIEW.h - 2 * cell) / 2;
    for (let i = 0; i < 10; i++)
      parts.push(svg('rect', { x: ox + (i % 5) * cell, y: oy + Math.floor(i / 5) * cell, width: cell, height: cell, class: 'combien-cell' }));
  }
  return svg('svg', { viewBox: `0 0 ${VIEW.w} ${VIEW.h}`, class: 'combien-svg' }, ...parts, ...dots(s.points, numbered));
}

function dots(points: Pt[], numbered: boolean): SVGElement[] {
  return points.flatMap((p, i) => [
    svg('circle', { cx: p.x, cy: p.y, r: p.r, fill: DOT_COLOR }),
    ...(numbered
      ? [svg('text', { x: p.x, y: p.y, 'font-size': Math.max(11, p.r * 1.1), class: 'combien-num', 'dominant-baseline': 'central', 'text-anchor': 'middle' }, String(i + 1))]
      : []),
  ]);
}

function collection(points: Pt[], numbered: boolean): SVGElement {
  return svg('svg', { viewBox: `0 0 ${COMPARE_VIEW.w} ${COMPARE_VIEW.h}`, class: 'combien-svg' }, ...dots(points, numbered));
}

type Answer = (correct: boolean, detail?: string) => void;

/** Affichage flash au-dessus des boutons de réponse (les boutons apparaissent ensuite). */
function renderCount(s: CountSpec) {
  return (el: HTMLElement) => {
    const show = h('div', { class: 'combien-show' }, h('div', { class: 'combien-ready' }, '👀 Regarde bien !'));
    el.before(show);
    el.classList.add('combien-wait');
    window.setTimeout(() => {
      if (!show.isConnected) return;
      show.replaceChildren(drawCount(s, false));
      window.setTimeout(() => {
        if (!show.isConnected) return;
        show.replaceChildren(h('div', { class: 'combien-cover' }, '?'));
        el.classList.remove('combien-wait');
      }, s.flashMs);
    }, 700);
    // Après la réponse (bouton du moteur), on remontre la collection, numérotée si erreur.
    el.addEventListener('click', () => {
      const root = el.closest('.quiz');
      if (!root || el.dataset.shown) return;
      const wrong = root.classList.contains('is-wrong');
      if (!wrong && !root.classList.contains('is-correct')) return;
      el.dataset.shown = '1';
      show.replaceChildren(drawCount(s, wrong));
    });
  };
}

function renderCompare(s: CompareSpec) {
  return (el: HTMLElement, answer: Answer) => {
    const [l, r] = [s.left.length, s.right.length];
    let done = false;
    let covered = false;
    const panels = [s.left, s.right].map((pts, side) => {
      const btn = h('button', { class: 'combien-panel', type: 'button', 'aria-label': side === 0 ? 'à gauche' : 'à droite' });
      btn.append(collection(pts, false));
      btn.addEventListener('click', () => {
        if (done) return;
        done = true;
        const mine = side === 0 ? l : r;
        const correct = mine === Math.max(l, r);
        btn.classList.add(correct ? 'right' : 'wrong');
        panels.forEach((p, i) => {
          p.replaceChildren(collection(i === 0 ? s.left : s.right, !correct));
          if (!correct && i !== side) p.classList.add('right');
          p.disabled = true;
        });
        answer(correct, `${s.conflict ? 'conflit' : 'congruent'} ; choisi ${side === 0 ? 'gauche' : 'droite'} (${mine})${covered ? '' : ' ; avant masquage'}`);
      });
      return btn;
    });
    el.append(h('div', { class: 'combien-pair' }, ...panels));
    window.setTimeout(() => {
      if (done || !el.isConnected) return;
      covered = true;
      panels.forEach((p) => p.replaceChildren(h('div', { class: 'combien-cover' }, '?')));
    }, 2500);
  };
}

function renderLine(s: LineSpec) {
  return (el: HTMLElement, answer: Answer) => {
    const W = 600;
    const x0 = 40;
    const x1 = W - 40;
    const xOf = (v: number) => x0 + ((x1 - x0) * v) / s.max;
    const letters = ['A', 'B', 'C'];
    let done = false;
    const base: SVGElement[] = [
      svg('line', { x1: x0, y1: 90, x2: x1, y2: 90, class: 'combien-axis' }),
      svg('line', { x1: x0, y1: 76, x2: x0, y2: 104, class: 'combien-axis' }),
      svg('line', { x1: x1, y1: 76, x2: x1, y2: 104, class: 'combien-axis' }),
      svg('text', { x: x0, y: 132, class: 'combien-label', 'text-anchor': 'middle' }, '0'),
      svg('text', { x: x1, y: 132, class: 'combien-label', 'text-anchor': 'middle' }, String(s.max)),
    ];
    const reveal: SVGElement = svg('g', {});
    const pins = s.marks.map((v, i) => {
      const g = svg('g', { class: 'combien-pin', role: 'button', tabindex: 0, 'aria-label': `position ${letters[i]}` });
      g.append(
        svg('line', { x1: xOf(v), y1: 56, x2: xOf(v), y2: 90, class: 'combien-pin-stem' }),
        svg('circle', { cx: xOf(v), cy: 30, r: 26 }),
        svg('text', { x: xOf(v), y: 31, class: 'combien-pin-letter', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, letters[i]),
      );
      const choose = () => {
        if (done) return;
        done = true;
        const correct = v === s.target;
        g.classList.add(correct ? 'right' : 'wrong');
        pins[s.marks.indexOf(s.target)].classList.add('right');
        // Explication : chaque repère reçoit son nombre, et le milieu est marqué.
        reveal.append(
          ...(correct ? [] : [svg('line', { x1: xOf(s.max / 2), y1: 82, x2: xOf(s.max / 2), y2: 98, class: 'combien-axis' })]),
          ...s.marks.map((m) =>
            svg('text', { x: xOf(m), y: 132, class: `combien-label ${m === s.target ? 'good' : ''}`, 'text-anchor': 'middle' }, String(m)),
          ),
        );
        answer(correct, correct ? undefined : `choisi ${v} (au lieu de ${s.target})`);
      };
      g.addEventListener('click', choose);
      g.addEventListener('keydown', (e) => (e as KeyboardEvent).key === 'Enter' && choose());
      return g;
    });
    el.append(
      h(
        'div',
        { class: 'combien-line-box' },
        h('div', { class: 'combien-target' }, String(s.target)),
        svg('svg', { viewBox: `0 0 ${W} 150`, class: 'combien-line' }, ...base, reveal, ...pins),
      ),
    );
  };
}

/* ---------- Items ---------- */

export function itemFromSpec(s: Spec): QuizItem {
  const key = specKey(s);
  switch (s.kind) {
    case 'count': {
      const what = s.display === 'doigts' ? 'doigts' : 'points';
      const prompt = `Combien de ${what} ?`;
      return {
        key,
        prompt,
        keepOrder: true,
        choices: s.choices.map((c) => ({ label: String(c), say: words(c), correct: c === s.n })),
        custom: renderCount(s),
        explain: explainCount(s),
      };
    }
    case 'compare':
      return { key, prompt: 'Où y en a-t-il le plus ?', custom: renderCompare(s), explain: explainCompare(s) };
    case 'line':
      return {
        key,
        prompt: `Où est le ${s.target} sur la ligne ?`,
        say: `Où est le ${words(s.target)} sur la ligne qui va de zéro à ${words(s.max)} ?`,
        custom: renderLine(s),
        explain: explainLine(s),
      };
    case 'written': {
      const prompt = `Quel nombre est le plus ${s.ask} ?`;
      const target = s.ask === 'grand' ? Math.max(s.a, s.b) : Math.min(s.a, s.b);
      return {
        key,
        prompt,
        say: `${prompt} ${words(s.a)} ou ${words(s.b)} ?`,
        keepOrder: true,
        choices: [s.a, s.b].map((n) => ({ label: String(n), say: words(n), correct: n === target })),
        explain: explainWritten(s),
      };
    }
  }
}

export const game: QuizGame = {
  title: 'Combien ?',
  instructions: 'Regarde bien : les images ne restent pas longtemps ! Trouve combien il y en a, ou où il y en a le plus.',
  levels: [
    { label: '1 à 5 points', description: 'voir d’un coup d’œil, sans compter' },
    { label: 'Jusqu’à 10', description: 'dés, doigts, boîte de dix, et « où y en a-t-il le plus ? »' },
    { label: 'Ligne des nombres', description: 'placer un nombre, comparer des nombres écrits jusqu’à 100' },
  ],
  makeItem(level, rng, recent) {
    let s = makeSpec(level, rng);
    for (let i = 0; i < 6 && recent.slice(-2).includes(specKey(s)); i++) s = makeSpec(level, rng);
    return itemFromSpec(s);
  },
};

export default quizGame(game);
