/**
 * La ligne numérique — estimation sur la droite numérique (représentation analogique
 * des nombres, sens du nombre).
 *
 * Deux tâches :
 *  - placer : un nombre est donné, l'enfant le place sur une ligne dont seuls les deux
 *    bouts sont écrits (tâche d'estimation de Siegler) ; réussi si l'écart est d'au plus
 *    5 % de la longueur de la ligne ;
 *  - lire (un item sur trois) : une flèche montre un point de la ligne, l'enfant choisit
 *    le nombre parmi quatre.
 * Après une erreur, la correction situe le nombre par rapport aux repères (quart,
 * milieu, trois quarts).
 *
 * Niveau 1 : de 0 à 100, 250, 380… jusqu'à 1 000.
 * Niveau 2 : la ligne ne commence pas à 0 (20 à 1 000, 30 à 90…).
 * Niveau 3 : nombres négatifs, de −1 000 (ou −250, −380…) à 0.
 * Niveau 4 : de part et d'autre de 0 (−1 000 à 1 000, −50 à 50, −200 à 800…).
 * Niveau 5 : nombres à virgule (dixièmes, centièmes, millièmes) et grands nombres
 *            (milliers, centaines de milliers, millions).
 */
import { h } from '../ui/dom';
import { pick, shuffle } from '../core/random';
import { formatNumber } from '../core/numbers';
import { toFrenchWords } from '../core/french';
import { quizGame, type QuizGame } from '../portal/quiz';
import './ligne-numerique.css';

export type Level = 1 | 2 | 3 | 4 | 5;

/** Une ligne : ses bouts, et le pas des nombres demandés (1, 0,1, 1 000…). */
export interface Line {
  start: number;
  end: number;
  step: number;
}

/** Écart toléré, en fraction de la longueur de la ligne. */
export const TOLERANCE = 0.05;

const ENDS_1 = [100, 200, 250, 300, 380, 400, 500, 600, 750, 800, 1000];
const STARTS_2 = [10, 20, 25, 30, 40, 50, 60, 100, 120, 150, 200, 250, 300, 400, 500];
const ENDS_2 = [90, 100, 120, 150, 200, 300, 400, 500, 600, 750, 800, 900, 1000];
const NEG_STARTS_4 = [-1000, -500, -300, -250, -200, -100, -50, -20];
const POS_ENDS_4 = [20, 50, 100, 200, 250, 500, 800, 1000];
/** Niveau 5 : [début, fin, pas]. */
const LINES_5: readonly (readonly [number, number, number])[] = [
  [0, 1, 0.01],
  [0, 1, 0.1],
  [0, 10, 0.1],
  [2, 3, 0.01],
  [0, 0.1, 0.001],
  [0, 0.01, 0.001],
  [-1, 1, 0.1],
  [-5, 5, 0.5],
  [0, 10000, 100],
  [1000, 5000, 50],
  [0, 100000, 1000],
  [0, 1000000, 10000],
  [0, 2.5, 0.05],
];

export function makeLine(level: Level, rng: () => number): Line {
  switch (level) {
    case 1:
      return { start: 0, end: pick(rng, ENDS_1), step: 1 };
    case 2: {
      const start = pick(rng, STARTS_2);
      const end = pick(rng, ENDS_2.filter((e) => e - start >= 40));
      return { start, end, step: 1 };
    }
    case 3:
      return { start: -pick(rng, ENDS_1), end: 0, step: 1 };
    case 4: {
      const start = pick(rng, NEG_STARTS_4);
      // chaque côté du 0 fait au moins 10 % de la ligne
      const end = pick(rng, POS_ENDS_4.filter((e) => e >= -start / 9 && -start >= e / 9));
      return { start, end, step: 1 };
    }
    case 5: {
      const [start, end, step] = pick(rng, LINES_5);
      return { start, end, step };
    }
  }
}

/** Nombre de décimales du pas (0,01 → 2). */
const decimalsOf = (step: number) => (String(step).split('.')[1] ?? '').length;

/** Arrondi au pas, sans erreur de virgule flottante (0,1 + 0,2…). */
export function snap(x: number, line: Line): number {
  const k = Math.round((x - line.start) / line.step);
  return Number((line.start + k * line.step).toFixed(decimalsOf(line.step)));
}

/** Un nombre de la ligne, pas trop près des bouts (entre 5 % et 95 %). */
export function pickTarget(line: Line, rng: () => number): number {
  const steps = Math.round((line.end - line.start) / line.step);
  const lo = Math.ceil(steps * 0.05);
  const hi = Math.floor(steps * 0.95);
  const k = lo + Math.floor(rng() * (hi - lo + 1));
  return snap(line.start + k * line.step, line);
}

/** Écriture française : espace fine insécable pour les milliers, virgule décimale. */
export function fmt(n: number): string {
  const s = formatNumber(Math.abs(n)).replace(/ /g, ' ');
  return n < 0 ? `−${s}` : s;
}

export function spoken(n: number): string {
  return n < 0 ? `moins ${toFrenchWords(-n)}` : toFrenchWords(n);
}

export const fractionOf = (x: number, line: Line) => (x - line.start) / (line.end - line.start);

/** Situe le nombre par rapport aux repères de la ligne (quart, milieu, trois quarts). */
export function landmark(f: number): string {
  const marks: [number, string][] = [
    [0, 'le début'],
    [0.25, 'le quart'],
    [0.5, 'le milieu'],
    [0.75, 'les trois quarts'],
    [1, 'la fin'],
  ];
  const [at, name] = marks.reduce((best, m) => (Math.abs(m[0] - f) < Math.abs(best[0] - f) ? m : best));
  if (Math.abs(at - f) <= 0.02 && at > 0 && at < 1) return { 0.25: 'au quart', 0.5: 'au milieu', 0.75: 'aux trois quarts' }[at]!;
  return `${f < at ? 'un peu avant' : 'un peu après'} ${name}`;
}

/** Trois mauvaises réponses pour « lire » : décalées de 12 à 35 %, et le symétrique. */
export function distractors(target: number, line: Line, rng: () => number): number[] {
  const width = line.end - line.start;
  const out = new Set<number>();
  const mirror = snap(line.end - (target - line.start), line);
  const far = (x: number) => Math.abs(x - target) >= width * 0.1;
  if (far(mirror)) out.add(mirror);
  for (let i = 0; out.size < 3 && i < 200; i++) {
    const shift = (0.12 + rng() * 0.23) * width * (rng() < 0.5 ? -1 : 1);
    const x = snap(target + shift, line);
    if (x > line.start && x < line.end && far(x) && [...out].every((o) => Math.abs(o - x) >= width * 0.08)) out.add(x);
  }
  return [...out].slice(0, 3);
}

/** La ligne dessinée : les deux bouts écrits, une zone de toucher haute. */
function drawLine(line: Line): { root: HTMLElement; bar: HTMLElement; layer: HTMLElement } {
  const layer = h('div', { class: 'nl-layer' });
  const bar = h('div', { class: 'nl-bar' }, h('span', { class: 'nl-tick start' }), h('span', { class: 'nl-tick end' }), layer);
  const root = h(
    'div',
    { class: 'nl' },
    bar,
    h('div', { class: 'nl-ends' }, h('span', {}, fmt(line.start)), h('span', {}, fmt(line.end))),
  );
  return { root, bar, layer };
}

function mark(f: number, cls: string, label?: string): HTMLElement {
  return h('span', { class: `nl-mark ${cls}`, style: `left:${(f * 100).toFixed(2)}%` }, label ? h('span', { class: 'nl-mark-label' }, label) : null);
}

export const game: QuizGame<Level> = {
  title: 'La ligne numérique',
  instructions: 'Place le nombre sur la ligne : touche l’endroit où il se trouve, puis valide. Pense au milieu et aux quarts pour t’aider.',
  levels: [
    { label: 'De 0 à 1 000', description: 'la ligne commence à 0 et finit à 100, 250, 380… jusqu’à 1 000' },
    { label: 'Ligne décalée', description: 'la ligne ne commence pas à 0 (de 20 à 1 000, de 30 à 90…)' },
    { label: 'Nombres négatifs', description: 'de −1 000 à 0' },
    { label: 'Autour de 0', description: 'de −1 000 à 1 000' },
    { label: 'Virgules et grands nombres', description: 'dixièmes, centièmes, millièmes, milliers, millions' },
  ],
  makeItem(level, rng, recent) {
    let line = makeLine(level, rng);
    let target = pickTarget(line, rng);
    for (let i = 0; i < 10 && recent.includes(`nl:${line.start}:${line.end}:${target}`); i++) {
      line = makeLine(level, rng);
      target = pickTarget(line, rng);
    }
    const key = `nl:${line.start}:${line.end}:${target}`;
    const f = fractionOf(target, line);
    const where = `${landmark(f)} de la ligne, entre ${fmt(line.start)} et ${fmt(line.end)}`;
    const read = rng() < 1 / 3;

    if (read) {
      return {
        key: `${key}:lire`,
        prompt: 'Quel nombre la flèche montre-t-elle ?',
        say: `Quel nombre la flèche montre-t-elle ? La ligne va de ${spoken(line.start)} à ${spoken(line.end)}.`,
        explain: `La flèche montre ${fmt(target)} : ${where}.`,
        custom(el, answer) {
          el.classList.add('nl-area');
          const { root, layer } = drawLine(line);
          layer.append(mark(f, 'nl-arrow'));
          const options = shuffle(rng, [target, ...distractors(target, line, rng)]);
          const choices = h('div', { class: 'nl-choices' });
          for (const x of options) {
            const btn = h(
              'button',
              {
                class: 'quiz-choice nl-choice',
                type: 'button',
                onclick: () => {
                  if (choices.classList.contains('done')) return;
                  choices.classList.add('done');
                  const ok = x === target;
                  btn.classList.add(ok ? 'right' : 'wrong');
                  if (!ok) {
                    choices.querySelector<HTMLElement>(`[data-x="${target}"]`)?.classList.add('right');
                    layer.append(mark(fractionOf(x, line), 'nl-wrong', fmt(x)));
                  }
                  answer(ok, ok ? undefined : `${fmt(x)} au lieu de ${fmt(target)}`);
                },
              },
              h('span', { class: 'quiz-choice-label' }, fmt(x)),
            );
            btn.dataset.x = String(x);
            choices.append(btn);
          }
          el.append(root, choices);
        },
      };
    }

    return {
      key,
      prompt: 'Place ce nombre sur la ligne.',
      say: `Place ${spoken(target)} sur la ligne. Elle va de ${spoken(line.start)} à ${spoken(line.end)}.`,
      stimulus: { text: fmt(target) },
      explain: `${fmt(target)} se trouve ${where}.`,
      custom(el, answer) {
        el.classList.add('nl-area');
        const { root, bar, layer } = drawLine(line);
        let pos: number | null = null;
        let done = false;
        const cursor = mark(0, 'nl-cursor');
        cursor.hidden = true;
        layer.append(cursor);

        bar.tabIndex = 0;
        bar.setAttribute('role', 'slider');
        bar.setAttribute('aria-label', `Ligne de ${fmt(line.start)} à ${fmt(line.end)}`);
        bar.setAttribute('aria-valuemin', '0');
        bar.setAttribute('aria-valuemax', '100');

        const place = (f: number) => {
          if (done) return;
          pos = Math.min(1, Math.max(0, f));
          cursor.hidden = false;
          cursor.style.left = `${(pos * 100).toFixed(2)}%`;
          bar.setAttribute('aria-valuenow', String(Math.round(pos * 100)));
          bar.setAttribute('aria-valuetext', `${Math.round(pos * 100)} % de la ligne`);
          ok.disabled = false;
        };
        const fromPointer = (e: PointerEvent) => {
          const r = bar.getBoundingClientRect();
          place((e.clientX - r.left) / r.width);
        };
        bar.addEventListener('pointerdown', (e) => {
          if (done) return;
          bar.setPointerCapture(e.pointerId);
          fromPointer(e);
        });
        bar.addEventListener('pointermove', (e) => {
          if (bar.hasPointerCapture(e.pointerId)) fromPointer(e);
        });
        bar.addEventListener('keydown', (e) => {
          const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          place((pos ?? 0.5) + d * (e.shiftKey ? 0.05 : 0.01));
        });

        const ok = h(
          'button',
          {
            class: 'btn primary nl-ok',
            type: 'button',
            disabled: true,
            onclick: () => {
              if (done || pos === null) return;
              done = true;
              ok.disabled = true;
              const placed = snap(line.start + pos * (line.end - line.start), line);
              const gap = Math.abs(pos - f);
              const good = gap <= TOLERANCE;
              cursor.classList.add(good ? 'right' : 'wrong');
              cursor.append(h('span', { class: 'nl-mark-label' }, `≈ ${fmt(placed)}`));
              layer.append(mark(f, 'nl-target', fmt(target)));
              answer(good, good ? undefined : `écart de ${Math.round(gap * 100)} % (≈ ${fmt(placed)})`);
            },
          },
          '✓ Valider',
        );
        el.append(root, ok);
      },
    };
  },
};

export default quizGame(game);
