/**
 * Affichage d'un problème : énoncé, illustration, indice (schéma en barres de
 * la méthode Singapour, tableau, texte) et réponse dans le code demandé.
 */
import type { Orthographe } from '../core/french';
import { formatNumber } from '../core/numbers';
import { isCorrect, type Hint, type Problem, type Visual } from '../core/problems';
import { blocksFor, renderSegments, spokenSegments, words } from './codes';
import { h } from './dom';
import { keypad } from './keypad';
import { openModal } from './modal';
import { speak } from './speech';

const fmt = (v: number | '?') => (v === '?' ? '?' : formatNumber(v));

export function renderVisual(v: Visual): HTMLElement {
  if (v.type === 'grille') {
    return h(
      'div',
      { class: 'grid-visual', style: `--w:${v.w}`, 'aria-label': `rectangle de ${v.w} sur ${v.h}` },
      Array.from({ length: v.w * v.h }, () => h('span')),
    );
  }
  return h(
    'div',
    { class: 'machine' },
    h('div', { class: 'machine-body' }, '⚙️ Machine', v.rule ? h('div', { class: 'machine-rule' }, v.rule) : null),
    h(
      'table',
      { class: 'machine-table' },
      h('tr', {}, h('th', {}, 'entre'), h('th', {}, ''), h('th', {}, 'sort')),
      v.pairs.map(([a, b]) => h('tr', {}, h('td', {}, formatNumber(a)), h('td', {}, '→'), h('td', {}, formatNumber(b)))),
      h('tr', { class: 'ask' }, h('td', {}, formatNumber(v.input)), h('td', {}, '→'), h('td', {}, '?')),
    ),
  );
}

export function renderHint(hint: Hint): HTMLElement {
  if (hint.type === 'texte') return h('p', { class: 'hint-text' }, hint.text);
  if (hint.type === 'tableau') {
    return h(
      'table',
      { class: 'hint-table' },
      h('tr', {}, hint.header.map((c) => h('th', {}, c))),
      hint.rows.map((row) => h('tr', {}, row.map((c) => h('td', {}, fmt(c))))),
    );
  }
  // Schéma en barres : chaque part a une longueur proportionnelle à sa valeur.
  const known = (parts: { value: number | '?' }[]) =>
    parts.reduce((s, p) => s + (p.value === '?' ? 0 : p.value), 0);
  const rowSums = hint.rows.map((r) => known(r.parts));
  const full = typeof hint.total === 'number' ? hint.total : Math.max(...rowSums, 1);
  const width = (parts: { value: number | '?' }[], p: { value: number | '?' }) => {
    if (p.value !== '?') return p.value;
    const unknown = parts.filter((x) => x.value === '?').length;
    const rest = full - known(parts);
    return rest > 0 ? rest / unknown : full / Math.max(parts.length, 2);
  };
  const rowTotal = (parts: { value: number | '?' }[]) => parts.reduce((s, p) => s + width(parts, p), 0);
  const scale = Math.max(...hint.rows.map((r) => rowTotal(r.parts)));
  return h(
    'div',
    { class: 'bars' },
    hint.total !== undefined ? h('div', { class: 'bars-total' }, h('span', {}, fmt(hint.total))) : null,
    hint.rows.map((r) =>
      h(
        'div',
        { class: 'bars-row' },
        r.label ? h('span', { class: 'bars-label' }, r.label) : null,
        h(
          'div',
          { class: 'bars-track' },
          h(
            'div',
            { class: 'bars-fill', style: `width:${(rowTotal(r.parts) / scale) * 100}%` },
            r.parts.map((p) =>
              h(
                'span',
                { class: `bar-part${p.value === '?' ? ' unknown' : ''}`, style: `flex-grow:${width(r.parts, p)}` },
                // la quantité en blocs : on peut compter les dizaines et les unités
                p.value !== '?' && p.value < 1000 && Number.isInteger(p.value) ? blocksFor(p.value) : null,
                h('span', { class: 'bar-number' }, fmt(p.value)),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

/** Le nombre dans les trois codes : renforce les relations entre codes. */
export function tripleCode(n: number, orthographe: Orthographe): HTMLElement {
  return h(
    'div',
    { class: 'triple' },
    h('div', { class: 'num-arabe big' }, formatNumber(n)),
    h('div', { class: 'num-verbal' }, words(n, orthographe)),
    n < 1e6 && Number.isInteger(n) ? blocksFor(n) : null,
  );
}

export interface ProblemOptions {
  orthographe: Orthographe;
  title: string;
  /** `solved` : trouvé (avec ou sans aide) ; faux après 3 essais, la réponse est montrée. */
  onDone: (result: { solved: boolean; firstTry: boolean; hints: number }) => void;
  /** Fermeture sans répondre. */
  onClose?: () => void;
}

const MAX_TRIES = 3;

export function openProblem(p: Problem, opts: ProblemOptions): void {
  let tries = 0;
  let hints = 0;
  let result: { solved: boolean; firstTry: boolean; hints: number } | null = null;
  const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
  const hintBox = h('div', { class: 'hint', hidden: true }, h('h3', {}, '💡 Indice'), renderHint(p.hint));
  const showHint = () => {
    if (hintBox.hidden) hints++;
    hintBox.hidden = false;
  };

  const finish = (solved: boolean, firstTry: boolean, message: string, cls: string) => {
    result = { solved, firstTry, hints };
    answerZone.replaceChildren(
      h('div', { class: `result ${cls}` }, h('p', {}, message), tripleCode(p.answer, opts.orthographe)),
      h('button', { class: 'btn primary', type: 'button', onclick: () => { close(); opts.onDone(result!); } }, 'Continuer →'),
    );
    hintButton.remove();
  };

  const check = (value: number, card?: HTMLElement) => {
    if (isCorrect(p, value)) {
      speak('Bravo !');
      finish(true, tries === 0, tries === 0 ? '🎉 Bravo, du premier coup !' : '🎉 Bravo, tu as trouvé !', 'ok');
      return;
    }
    tries++;
    card?.classList.add('wrong');
    if (tries >= MAX_TRIES) {
      finish(false, false, 'La bonne réponse était :', 'reveal');
      return;
    }
    feedback.textContent = tries === 1 ? 'Pas tout à fait… Regarde l’indice et réessaie !' : 'Encore un essai !';
    feedback.classList.remove('shake');
    void feedback.offsetWidth;
    feedback.classList.add('shake');
    showHint();
    pad?.reset();
  };

  let pad: ReturnType<typeof keypad> | null = null;
  let answerZone: HTMLElement;
  if (p.answerMode === 'clavier') {
    pad = keypad((v) => check(v), !Number.isInteger(p.answer));
    answerZone = h('div', { class: 'answer' }, pad.el);
  } else {
    answerZone = h(
      'div',
      { class: 'answer choices' },
      p.choices!.map((c) => {
        const card: HTMLElement = h(
          'button',
          { class: 'choice', type: 'button', onclick: () => { if (!card.classList.contains('wrong')) check(c, card); } },
          p.answerMode === 'choix-verbal' ? h('span', { class: 'num-verbal' }, words(c, opts.orthographe)) : blocksFor(c),
        );
        return card;
      }),
    );
  }

  const hintButton = h('button', { class: 'btn ghost', type: 'button', onclick: showHint }, '💡 Indice');
  const content = h(
    'div',
    { class: 'problem' },
    h('h2', {}, opts.title),
    h(
      'div',
      { class: 'statement' },
      h('button', { class: 'btn icon', type: 'button', 'aria-label': 'écouter', onclick: () => speak(spokenSegments(p.statement)) }, '🔊'),
      renderSegments(p.statement, opts.orthographe),
    ),
    p.visual ? renderVisual(p.visual) : null,
    hintBox,
    feedback,
    answerZone,
    h('div', { class: 'problem-actions' }, hintButton),
  );
  // fermer après avoir répondu vaut « Continuer » ; avant, c'est abandonner
  const close = openModal(content, 'problem-modal', () => (result ? opts.onDone(result) : opts.onClose?.()));
}
