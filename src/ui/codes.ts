/**
 * Rendu des trois codes : analogique (blocs), arabe (chiffres), verbal (mots).
 */
import { toFrenchWords, type Orthographe } from '../core/french';
import { classOf, className, digitAt, formatNumber, orderOf } from '../core/numbers';
import type { Segment } from '../core/problems';
import { h } from './dom';

export const CLASS_COLORS: Record<number, string> = {
  [-1]: '#e0559a',
  0: '#2f7de1',
  1: '#1f9d63',
  2: '#ec7a12',
  3: '#8a55e8',
};

export function classColor(rank: number): string {
  return CLASS_COLORS[classOf(rank)];
}

/** Une pièce de base dix : cube (unités), barre (dizaines), plaque (centaines). */
export function block(rank: number): HTMLElement {
  const shape = ['cube', 'barre', 'plaque'][orderOf(rank)];
  return h('span', { class: `blk ${shape}`, style: `--c:${classColor(rank)}` });
}

/** Une colonne de pièces d'un même rang. */
export function blockStack(rank: number, count: number): HTMLElement {
  return h(
    'span',
    { class: `stack o${orderOf(rank)}` },
    Array.from({ length: count }, (_, i) => {
      const b = block(rank);
      b.style.setProperty('--i', String(i));
      return b;
    }),
  );
}

/** Représentation analogique d'un nombre : pièces groupées par classe. */
export function blocksFor(n: number): HTMLElement {
  const groups: HTMLElement[] = [];
  for (let cls = 3; cls >= -1; cls--) {
    const ranks = cls === -1 ? [-1, -2, -3] : [cls * 3 + 2, cls * 3 + 1, cls * 3];
    const stacks = ranks.filter((r) => digitAt(n, r) > 0).map((r) => blockStack(r, digitAt(n, r)));
    if (stacks.length === 0) continue;
    groups.push(
      h('span', { class: 'blk-group', style: `--c:${CLASS_COLORS[cls]}`, title: className(cls) }, stacks),
    );
  }
  if (groups.length === 0) groups.push(h('span', { class: 'blk-empty' }, '∅'));
  return h('span', { class: 'blocks' }, groups);
}

export function words(n: number, orthographe: Orthographe): string {
  return toFrenchWords(n, orthographe);
}

export function renderSegments(segments: Segment[], orthographe: Orthographe): HTMLElement {
  return h(
    'span',
    { class: 'segments' },
    segments.map((s) => {
      if (typeof s === 'string') return s;
      if ('text' in s) return h('span', { class: 'num-arabe' }, s.text);
      if (s.code === 'arabe') return h('span', { class: 'num-arabe' }, formatNumber(s.n));
      if (s.code === 'verbal') return h('span', { class: 'num-verbal' }, words(s.n, orthographe));
      return blocksFor(s.n);
    }),
  );
}

/** Texte à lire à voix haute. Une quantité en blocs n'est pas lue (sinon on donne la réponse). */
export function spokenSegments(segments: Segment[]): string {
  return segments
    .map((s) => {
      if (typeof s === 'string') return s;
      if ('say' in s) return s.say;
      if (s.code === 'analogique') return 'ce nombre';
      return words(s.n, 'traditionnelle');
    })
    .join('')
    .replace(/\s+/g, ' ');
}
