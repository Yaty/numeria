/**
 * La roue des mots — lexique, analyse des traits sémantiques (Semantic Feature Analysis,
 * Boyle et Coelho 1995 ; adaptée à l'enfant manque du mot).
 *
 * L'image est au centre d'une roue ; autour, les axes de l'analyse : le groupe (c'est
 * un animal), ce qu'il fait ou à quoi il sert, où on le trouve, comment il est, et à
 * quoi il fait penser. L'enfant touche la ou les bonnes propositions de chaque axe ;
 * le nom n'apparaît qu'à la fin (ou à la demande), pour l'évoquer d'abord soi-même.
 * En devinette, c'est l'inverse : les traits arrivent un à un comme des indices et
 * l'enfant trouve l'image.
 *
 * Niveau 1 : la roue à 3 axes (groupe, fonction, lieu), 3 propositions, une seule juste.
 * Niveau 2 : la roue complète (jusqu'à 5 axes), 4 propositions (5 s'il y a 3 justes) ;
 *            plusieurs justes pour « où » et « comment », parfois pour les autres.
 * Niveau 3 : devinette, 4 images de groupes différents ; le groupe est donné en dernier.
 * Niveau 4 : devinette fine, 4 images du même groupe (fraise, cerise, pomme…) ; il faut
 *            les traits distinctifs. Le groupe est donné en premier.
 *
 * Une seule tentative par question (sinon on trouve en touchant tout) : une erreur clôt
 * la question et montre la bonne réponse. Réussi = aucune erreur dans la roue, ou la
 * bonne image du premier coup en devinette (demander un indice de plus est permis).
 * Jeu sans voix : l'adulte lit avec l'enfant si besoin.
 */
import { shuffle } from '../core/random';
import { quizGame, typo, type QuizGame, type QuizItem } from '../portal/quiz';
import { h } from '../ui/dom';
import { ASSOCIATIONS, GROUPS, POOLS, THINGS, familyOf, type Feature, type FeatureAxis, type GroupId, type Thing } from '../data/roue-des-mots';
import './roue-des-mots.css';

export type Level = 1 | 2 | 3 | 4;
export type Axis = 'groupe' | FeatureAxis;

export const AXES: readonly Axis[] = ['groupe', 'fonction', 'lieu', 'description', 'association'];

export const AXIS_ICON: Record<Axis, string> = {
  groupe: '🗂️',
  fonction: '✋',
  lieu: '📍',
  description: '👀',
  association: '💭',
};

// ——— Mots et phrases ———

export const article = (x: Thing) => (x.genre === 'f' ? 'une' : 'un');
export const nameOf = (x: Thing) => `${article(x)} ${x.nom}`;
const il = (x: Thing) => (x.genre === 'f' ? 'Elle' : 'Il');
const le = (x: Thing) => (x.genre === 'f' ? 'la' : 'le');
const lower = (s: string) => s[0].toLowerCase() + s.slice(1);

/** « à le soleil » → « au soleil ». */
export const aLabel = (label: string) => (label.startsWith('le ') ? `au ${label.slice(3)}` : label.startsWith('les ') ? `aux ${label.slice(4)}` : `à ${label}`);

export function featureOf(x: Thing, axis: FeatureAxis, id: string): Feature {
  const f = axis === 'association' ? ASSOCIATIONS[id] : POOLS[familyOf(x)][axis][id];
  if (!f) throw new Error(`Trait inconnu : ${x.id} ${axis} ${id}`);
  return f;
}

const form = (x: Thing, f: Feature) => (x.genre === 'f' && f.f ? f.f : f.label);

/** Les lieux sont des phrases entières : « {Il} pousse… », « On {le} trouve… », « On {l}achète… ». */
const place = (x: Thing, f: Feature) => f.label.replace('{Il}', il(x)).replace('{le}', le(x)).replace('{l}', 'l’');

/** Question posée sur un axe. */
export function question(x: Thing, axis: Axis): string {
  const fam = familyOf(x);
  const pr = lower(il(x));
  switch (axis) {
    case 'groupe':
      return 'Qu’est-ce que c’est ?';
    case 'fonction':
      if (fam === 'animal' || fam === 'vehicule') return `Qu’est-ce qu’${pr} fait ?`;
      if (fam === 'aliment') return `Comment on ${le(x)} mange ?`;
      if (fam === 'vetement') return 'À quoi ça sert ?';
      return 'Comment on s’en sert ?';
    case 'lieu':
      if (fam === 'vehicule') return `Où on peut ${le(x)} voir ?`;
      if (fam === 'vetement') return `Où on ${le(x)} porte ?`;
      return `Où on peut ${le(x)} trouver ?`;
    case 'description':
      return `Comment est-${pr} ?`;
    case 'association':
      return 'À quoi ça fait penser ?';
  }
}

/** Texte d'une proposition dans la roue. */
export function optionText(x: Thing, axis: Axis, id: string): string {
  if (axis === 'groupe') return GROUPS[id as GroupId].label;
  const f = featureOf(x, axis, id);
  if (axis === 'lieu') return place(x, f);
  const fam = familyOf(x);
  const withSubject = axis === 'description' || (axis === 'fonction' && (fam === 'animal' || fam === 'vehicule'));
  return withSubject ? `${il(x)} ${form(x, f)}` : form(x, f);
}

/** Phrase d'indice pour la devinette. */
export function clueText(x: Thing, axis: Axis, id: string): string {
  if (axis === 'groupe') return `C’est ${GROUPS[id as GroupId].label}.`;
  const f = featureOf(x, axis, id);
  const fam = familyOf(x);
  const w = form(x, f);
  switch (axis) {
    case 'description':
      return `${il(x)} ${w}.`;
    case 'association':
      return `Ça fait penser ${aLabel(w)}.`;
    case 'fonction':
      if (fam === 'animal' || fam === 'vehicule') return `${il(x)} ${w}.`;
      if (fam === 'aliment') return `On ${le(x)} mange ${w}.`;
      if (fam === 'vetement') return `Ça sert ${w}.`;
      return `On s’en sert ${w}.`;
    case 'lieu':
      return `${place(x, f)}.`;
  }
}

// ——— Traits vrais et pièges ———

/** Traits justes d'un axe (le groupe : un seul). */
export function rightOf(x: Thing, axis: Axis): string[] {
  return axis === 'groupe' ? [x.groupe] : x[axis].oui;
}

/** Associations qui appartiennent à une famille (objets de cette famille). */
const ASSOC_FAMILIES = new Map<string, Set<string>>();
for (const x of THINGS) {
  for (const id of x.association.oui) {
    if (!ASSOC_FAMILIES.has(id)) ASSOC_FAMILIES.set(id, new Set());
    ASSOC_FAMILIES.get(id)!.add(familyOf(x));
  }
}

/** Pièges possibles : faux pour cet objet, sans ambiguïté. */
export function wrongOf(x: Thing, axis: Axis): string[] {
  if (axis === 'groupe') return (Object.keys(GROUPS) as GroupId[]).filter((g) => g !== x.groupe);
  const traits = x[axis];
  const banned = new Set([...traits.oui, ...traits.aussi]);
  if (axis === 'association') {
    const fam = familyOf(x);
    return [...ASSOC_FAMILIES.entries()]
      .filter(([id, fams]) => !banned.has(id) && !fams.has(fam) && ASSOCIATIONS[id].emoji !== x.emoji)
      .map(([id]) => id);
  }
  return Object.keys(POOLS[familyOf(x)][axis]).filter((id) => !banned.has(id));
}

/** Un trait de `t` est-il clairement faux pour `d` (même famille) ? */
const falseFor = (d: Thing, axis: FeatureAxis, id: string) => !d[axis].oui.includes(id) && !d[axis].aussi.includes(id);

/** `d` peut-il servir d'intrus face à `x` en devinette : un indice au moins le contredit. */
export function distinguishable(x: Thing, d: Thing): boolean {
  if (d.id === x.id || d.emoji === x.emoji) return false;
  if (familyOf(d) !== familyOf(x)) return true;
  if (d.groupe !== x.groupe) return true;
  return (['fonction', 'lieu', 'description', 'association'] as const).some((axis) => x[axis].oui.some((id) => falseFor(d, axis, id)));
}

// ——— Construction des items ———

export interface Panel {
  axis: Axis;
  question: string;
  options: { id: string; text: string; emoji?: string; correct: boolean }[];
  /** Nombre de bonnes réponses à trouver. */
  need: number;
}

const keyOf = (level: Level, x: Thing) => `roue:${level}:${x.id}`;

export function pickThing(level: Level, rng: () => number, recent: readonly string[]): Thing {
  const fresh = THINGS.filter((x) => !recent.includes(keyOf(level, x)));
  const pool = fresh.length ? fresh : THINGS;
  return pool[Math.floor(rng() * pool.length)];
}

/** Les axes de la roue pour un objet et un niveau. */
export function buildWheel(x: Thing, level: 1 | 2, rng: () => number): Panel[] {
  const axes: Axis[] = level === 1 ? ['groupe', 'fonction', 'lieu'] : AXES.filter((a) => rightOf(x, a).length > 0);
  const size = level === 1 ? 3 : 4;
  return axes.map((axis) => {
    const right = shuffle(rng, rightOf(x, axis));
    // Dès le niveau 2, « où » et « comment » ont plusieurs bonnes réponses (2 ou 3).
    const several = level === 2 && right.length >= 2 && (axis === 'lieu' || axis === 'description' || rng() < 0.5);
    const need = several ? (right.length >= 3 && rng() < 0.4 ? 3 : 2) : 1;
    const wrong = shuffle(rng, wrongOf(x, axis)).slice(0, need === 3 ? 2 : size - need);
    const opt = (id: string, correct: boolean) => ({
      id,
      text: optionText(x, axis, id),
      emoji: axis === 'association' ? ASSOCIATIONS[id].emoji : undefined,
      correct,
    });
    return {
      axis,
      question: question(x, axis),
      options: shuffle(rng, [...right.slice(0, need).map((id) => opt(id, true)), ...wrong.map((id) => opt(id, false))]),
      need,
    };
  });
}

export interface Riddle {
  clues: { axis: Axis; text: string }[];
  choices: Thing[];
}

/**
 * Les indices, un axe après l'autre (un trait par axe, puis on recommence avec les
 * traits restants), et 4 images. Niveau 3 : intrus d'autres groupes, groupe en dernier.
 * Niveau 4 : intrus du même groupe (sinon de la même famille), groupe en premier.
 */
export function buildRiddle(x: Thing, level: 3 | 4, rng: () => number): Riddle {
  const order: Axis[] = level === 3 ? ['lieu', 'description', 'fonction', 'association'] : ['description', 'fonction', 'lieu', 'association'];
  const queues = order.map((axis) => ({ axis, ids: shuffle(rng, rightOf(x, axis)) }));
  const clues: Riddle['clues'] = [];
  while (queues.some((q) => q.ids.length)) {
    for (const q of queues) {
      const id = q.ids.shift();
      if (id) clues.push({ axis: q.axis, text: clueText(x, q.axis, id) });
    }
  }
  const groupClue = { axis: 'groupe' as Axis, text: clueText(x, 'groupe', x.groupe) };
  if (level === 3) clues.push(groupClue);
  else clues.unshift(groupClue);

  const ok = THINGS.filter((d) => distinguishable(x, d));
  let others: Thing[];
  if (level === 3) {
    // un intrus par groupe, pour varier
    const byGroup = new Map<GroupId, Thing[]>();
    for (const d of ok) if (d.groupe !== x.groupe) byGroup.set(d.groupe, [...(byGroup.get(d.groupe) ?? []), d]);
    others = shuffle(rng, [...byGroup.values()])
      .slice(0, 3)
      .map((ds) => ds[Math.floor(rng() * ds.length)]);
  } else {
    const same = shuffle(rng, ok.filter((d) => d.groupe === x.groupe));
    const family = shuffle(rng, ok.filter((d) => d.groupe !== x.groupe && familyOf(d) === familyOf(x)));
    others = [...same, ...family].slice(0, 3);
  }
  return { clues, choices: shuffle(rng, [x, ...others]) };
}

// ——— Rendu ———
// Une seule tentative par question : une erreur clôt la question et montre la bonne
// réponse, pour qu'on ne puisse pas trouver en essayant tout.

/** Récapitulatif des bons traits, en phrases, montré après une erreur. */
const recap = (x: Thing, panels: Panel[]) =>
  [`C’est ${nameOf(x)}.`, ...panels.flatMap((p) => p.options.filter((o) => o.correct).map((o) => clueText(x, p.axis, o.id)))].join(' ');

function renderWheel(x: Thing, panels: Panel[]) {
  return (el: HTMLElement, answer: (correct: boolean, detail?: string) => void) => {
    el.classList.add('rdm', `rdm-axes-${panels.length}`);
    const missed = new Set<Axis>();
    let done = 0;

    const name = h('div', { class: 'rdm-name', hidden: true }, nameOf(x));
    const reveal = h('button', { class: 'rdm-reveal', type: 'button', onclick: () => showName() }, 'Voir le nom');
    const showName = () => {
      name.hidden = false;
      reveal.hidden = true;
    };
    el.append(
      h(
        'div',
        { class: 'rdm-center' },
        h('div', { class: 'rdm-hub' }, h('span', { class: 'rdm-hub-emoji', role: 'img', 'aria-label': 'image à nommer' }, x.emoji)),
        name,
        reveal,
      ),
    );

    for (const p of panels) {
      let found = 0;
      const list = h('div', { class: 'rdm-options' });
      const badge = p.need > 1 ? h('span', { class: 'rdm-need' }, `${p.need} réponses`) : null;
      const panel = h(
        'section',
        { class: `rdm-panel rdm-${p.axis}`, 'aria-label': p.question },
        h('h3', {}, h('span', { class: 'rdm-icon', 'aria-hidden': 'true' }, AXIS_ICON[p.axis]), h('span', {}, typo(p.question)), badge),
        list,
      );
      const close = (ok: boolean) => {
        panel.classList.add(ok ? 'done' : 'missed');
        for (const b of list.querySelectorAll<HTMLButtonElement>('button')) {
          if (!ok && b.dataset.correct && !b.classList.contains('right')) b.classList.add('right', 'shown');
          b.disabled = true;
        }
        if (++done === panels.length) finish();
      };
      for (const o of p.options) {
        const btn: HTMLButtonElement = h(
          'button',
          {
            class: `rdm-option ${o.emoji ? 'has-emoji' : ''}`,
            type: 'button',
            onclick: () => {
              if (btn.disabled || panel.matches('.done, .missed')) return;
              btn.disabled = true;
              if (!o.correct) {
                missed.add(p.axis);
                btn.classList.add('wrong');
                close(false);
                return;
              }
              btn.classList.add('right');
              if (++found === p.need) close(true);
            },
          },
          o.emoji ? h('span', { class: 'rdm-option-emoji', 'aria-hidden': 'true' }, o.emoji) : null,
          h('span', {}, typo(o.text)),
        );
        if (o.correct) btn.dataset.correct = '1';
        list.append(btn);
      }
      el.append(panel);
    }

    function finish() {
      showName();
      el.classList.add('finished');
      // on laisse le temps de voir le nom et les corrections avant la suite
      window.setTimeout(() => {
        if (el.isConnected) answer(missed.size === 0, missed.size ? [...missed].join(', ') : undefined);
      }, 1600);
    }
  };
}

function renderRiddle(x: Thing, riddle: Riddle) {
  return (el: HTMLElement, answer: (correct: boolean, detail?: string) => void) => {
    el.classList.add('rdm-riddle');
    let shown = 0;
    let over = false;
    const list = h('ol', { class: 'rdm-clues' });
    const more = h('button', { class: 'btn rdm-more', type: 'button', onclick: () => next() }, '💡 Encore un indice');

    function next() {
      if (shown >= riddle.clues.length) return;
      const c = riddle.clues[shown++];
      list.append(h('li', { class: `rdm-clue rdm-${c.axis}` }, h('span', { class: 'rdm-icon', 'aria-hidden': 'true' }, AXIS_ICON[c.axis]), h('span', {}, typo(c.text))));
      more.disabled = shown >= riddle.clues.length;
    }
    next();

    const grid = h('div', { class: 'rdm-choices' });
    for (const d of riddle.choices) {
      const btn: HTMLButtonElement = h(
        'button',
        {
          class: 'rdm-choice',
          type: 'button',
          onclick: () => {
            if (over) return;
            over = true;
            const used = shown;
            const ok = d.id === x.id;
            btn.classList.add(ok ? 'right' : 'wrong');
            if (!ok) grid.querySelector('[data-correct]')?.classList.add('right', 'shown');
            while (shown < riddle.clues.length) next();
            more.disabled = true;
            for (const b of grid.querySelectorAll('button')) b.disabled = true;
            const detail = `${used} indice(s)${ok ? '' : `, a choisi ${d.nom}`}`;
            // une erreur : le moteur montre tout de suite la correction
            if (!ok) return answer(false, detail);
            window.setTimeout(() => {
              if (el.isConnected) answer(true, detail);
            }, 1600);
          },
        },
        h('span', { class: 'rdm-choice-emoji', 'aria-hidden': 'true' }, d.emoji),
        h('span', { class: 'rdm-choice-label' }, d.nom),
      );
      if (d.id === x.id) btn.dataset.correct = '1';
      grid.append(btn);
    }
    el.append(list, more, grid);
  };
}

export const game: QuizGame<Level> = {
  title: 'La roue des mots',
  instructions:
    'Regarde l’image au milieu de la roue et essaie de dire son nom. Puis, tout autour, touche les bonnes réponses : ce que c’est, ce qu’il fait, où on le trouve… Attention, une seule chance par question ! Dans les devinettes, c’est le contraire : lis les indices et trouve l’image.',
  silent: true,
  itemsPerRound: 6,
  levels: [
    { label: 'La roue : 3 questions', description: 'Groupe, fonction, lieu ; 3 propositions, une juste' },
    { label: 'La roue complète', description: 'Jusqu’à 5 questions ; plusieurs bonnes réponses pour « où » et « comment »' },
    { label: 'Devinettes', description: 'Les indices un à un, 4 images de groupes différents' },
    { label: 'Devinettes fines', description: '4 images du même groupe : il faut les traits qui les distinguent' },
  ],
  makeItem(level, rng, recent): QuizItem {
    const x = pickThing(level, rng, recent);
    if (level === 1 || level === 2) {
      const panels = buildWheel(x, level, rng);
      return {
        key: keyOf(level, x),
        prompt: 'Dis le nom de l’image, puis touche les bonnes réponses.',
        custom: renderWheel(x, panels),
        explain: recap(x, panels),
      };
    }
    const riddle = buildRiddle(x, level, rng);
    return {
      key: keyOf(level, x),
      prompt: 'Devinette : qui suis-je ?',
      custom: renderRiddle(x, riddle),
      explain: `C’était ${nameOf(x)}. ${riddle.clues.map((c) => c.text).join(' ')}`,
    };
  },
};

export default quizGame(game);
