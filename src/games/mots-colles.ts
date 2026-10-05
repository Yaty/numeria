/**
 * Mots collés — langage écrit (segmentation lexicale, conscience du mot écrit).
 * Une phrase est écrite sans espaces (« lechatdort ») ; l'enfant touche entre deux lettres
 * pour placer une séparation, puis valide. Juste si la découpe est exactement celle de la
 * phrase (la casse est ignorée : tout est affiché en minuscules, sans ponctuation).
 *
 * Apostrophe : elle reste affichée (c'est de l'orthographe) mais ne coupe PAS d'elle-même.
 * « l’avion » compte pour deux mots (« l’ » mis pour « le », et « avion ») : l'enfant doit
 * placer lui-même la séparation après l'apostrophe, c'est tout l'enjeu des élisions
 * (« lavion » / « l’avion »). Exceptions : « aujourd’hui » et « quelqu’un » sont UN seul mot,
 * de même que les mots composés à trait d'union (« grand-mère », « arc-en-ciel »).
 *
 * Niveau 1 : 3 mots courts et fréquents, sans élision ; la phrase peut être écoutée (🔊).
 * Niveau 2 : 4 à 6 mots, avec déterminants et élisions (l’, j’, c’, n’, m’, s’…) ; pas d'écoute.
 * Niveau 3 : 6 à 11 mots, avec pièges : élisions en chaîne (« il s’est », « l’a »),
 *            liaisons (« ils ont » / « il sont », « mon oncle »), mots d'un seul tenant
 *            (« aujourd’hui », « quelqu’un », « grand-mère », « arc-en-ciel »).
 */
import { pick } from '../core/random';
import { quizGame, type QuizGame } from '../portal/quiz';
import { h } from '../ui/dom';
import './mots-colles.css';

export const SENTENCES: Record<1 | 2 | 3, readonly string[]> = {
  1: [
    'le chat dort', 'le chien court', 'la lune brille', 'le bébé pleure', 'maman est là', 'papa a faim',
    'le lapin saute', 'la vache mange', 'le loup hurle', 'le vent souffle', 'la pluie tombe', 'le train part',
    'la porte claque', 'le coq chante', 'je suis grand', 'tu es belle', 'il fait beau', 'il fait froid',
    'elle a froid', 'nous jouons dehors', 'vous chantez bien', 'ils sont amis', 'le feu brûle', 'la soupe fume',
    'le pain cuit', 'la fleur pousse', 'mon ami arrive', 'ma tante chante', 'le roi mange', 'la fée vole',
    'le bus arrive', 'un oiseau chante', 'une souris court', 'le poisson nage', 'la mer monte', 'le soleil brille',
    'il a soif', 'je mange bien', 'le lion rugit', 'la cloche sonne', 'le clown rit', 'tu dors encore',
    'la poule picore',
  ],
  2: [
    'l’oiseau chante dans l’arbre', 'l’avion vole très haut', 'j’aime le chocolat', 'l’éléphant boit de l’eau',
    'le chat boit du lait', 'la maîtresse lit une histoire', 'j’ai un petit frère', 'c’est mon ami',
    'il y a un chat', 'les enfants jouent au ballon', 'l’école est fermée', 'je vais à l’école',
    'elle mange une pomme rouge', 'nous allons à la plage', 'mon frère a un vélo', 'l’ours dort dans sa grotte',
    'j’ai perdu mon doudou', 'l’escargot avance lentement', 'le lapin mange une carotte', 'la souris a peur du chat',
    'il n’a pas faim', 'je n’aime pas la soupe', 'l’arbre a perdu ses feuilles', 'maman m’a donné un bonbon',
    'papa t’attend dehors', 'il fait chaud en été', 'le soleil se lève', 'j’entends un oiseau',
    'l’enfant regarde la télévision', 'l’eau du bain est chaude', 'elle s’habille vite', 'tu as un beau dessin',
    'le chien a un os', 'j’adore les gâteaux', 'le petit garçon s’amuse', 'la grenouille saute dans l’eau',
    'c’est l’heure du goûter', 'l’abeille fait du miel', 'la fusée part dans l’espace', 'les poules sont dans le pré',
  ],
  3: [
    'elle s’appelle comme sa grand-mère', 'aujourd’hui l’avion part à l’heure', 'ils ont mis leurs bottes pour aller dehors',
    'les oiseaux s’envolent quand le chat arrive', 'quelqu’un a sonné à la porte', 'l’arc-en-ciel apparaît après la pluie',
    'mon grand frère n’aime pas les épinards', 'elle l’a rangé dans sa chambre', 'j’ai vu un écureuil dans l’arbre',
    'il s’est fait mal au genou', 'les enfants ont peur de l’orage', 'on a mangé une glace à la plage',
    'c’est l’anniversaire de ma petite sœur', 'l’ogre s’est endormi sous un arbre', 'nous avons trois poissons rouges dans un bocal',
    'mon oncle habite au bord de la mer', 'il n’y a plus de lait dans le frigo', 'elle s’est cachée derrière l’armoire',
    'tu t’es lavé les mains avant le repas', 'les amis de mon frère sont arrivés en retard', 'd’habitude je prends le bus pour aller à l’école',
    'ma grand-mère m’a offert un livre', 'les éléphants s’arrosent avec leur trompe', 'j’ai entendu l’ambulance passer dans la rue',
    'elle est allée chez le docteur hier', 'un écureuil a caché des noisettes', 'l’hélicoptère s’est posé sur le toit',
    'il fait beau aujourd’hui alors on sort', 'quand il pleut on reste à la maison', 'les oiseaux font leur nid au printemps',
    'mes parents m’ont acheté un vélo neuf', 'le chat s’est enfui par la fenêtre', 'on entend la mer depuis la chambre',
    'elle a mis son anorak et ses gants', 'le cuisinier a préparé une omelette aux champignons', 'les enfants s’amusent dans la cour de récréation',
    'l’eau de la piscine est très froide', 'pendant les vacances j’ai appris à nager', 'quelqu’un a laissé la porte ouverte',
    'aujourd’hui je n’ai pas école', 'le dessert est une tarte aux pommes', 'le lion s’approche lentement de l’antilope',
  ],
};

/** Mots qui contiennent une apostrophe mais ne se coupent pas. */
export const WHOLE = ['aujourd’hui', 'quelqu’un'];

/** Découpe une phrase en mots : espaces, puis après chaque apostrophe d'élision. */
export function tokenize(sentence: string): string[] {
  return sentence.split(' ').flatMap((w) => (WHOLE.includes(w) ? [w] : w.split(/(?<=’)/)));
}

/** Positions des séparations : indice (dans les lettres collées) de la lettre qui précède. */
export function boundaries(words: readonly string[]): number[] {
  const out: number[] = [];
  let n = 0;
  for (const w of words.slice(0, -1)) {
    n += Array.from(w).length;
    out.push(n - 1);
  }
  return out;
}

/** Recolle des lettres selon des séparations (pour le détail des essais). */
export function segment(letters: readonly string[], cuts: ReadonlySet<number>): string {
  return letters.map((c, i) => (cuts.has(i) && i < letters.length - 1 ? `${c} ` : c)).join('');
}

export function isCorrect(target: readonly number[], cuts: ReadonlySet<number>): boolean {
  return target.length === cuts.size && target.every((i) => cuts.has(i));
}

export function explainFor(sentence: string): string {
  const words = tokenize(sentence);
  const tips: string[] = [];
  const elided = words.find((w) => w.endsWith('’'));
  if (elided) tips.push(`« ${elided} » est un petit mot à lui tout seul : l’apostrophe remplace une lettre.`);
  const whole = words.find((w) => WHOLE.includes(w) || w.includes('-'));
  if (whole) tips.push(`« ${whole} » est un seul mot.`);
  return [`Il y a ${words.length} mots : ${words.map((w) => `« ${w} »`).join(', ')}.`, ...tips]
    .join(' ')
    .replace(/ ([:»])/g, '\u00a0$1')
    .replace(/« /g, '«\u00a0');
}

function render(sentence: string, level: 1 | 2 | 3) {
  return (el: HTMLElement, answer: (correct: boolean, detail?: string) => void, ctx: { speak(t: string): void }) => {
    const words = tokenize(sentence);
    const letters = Array.from(words.join(''));
    const target = boundaries(words);
    const cuts = new Set<number>();
    const history: number[] = [];
    let done = false;

    const gaps: HTMLButtonElement[] = [];
    const line = h('div', { class: 'mots-colles-line' });
    letters.forEach((c, i) => {
      const unit = h('span', { class: 'mots-colles-unit' }, h('span', { class: 'mots-colles-letter' }, c));
      if (i < letters.length - 1) {
        const gap = h('button', {
          class: 'mots-colles-gap',
          type: 'button',
          'aria-label': `Séparer après ${c}`,
          onclick: () => {
            if (done) return;
            toggle(i);
            history.push(i);
            refresh();
          },
        });
        gaps.push(gap);
        unit.append(gap);
      }
      line.append(unit);
    });

    const toggle = (i: number) => (cuts.has(i) ? cuts.delete(i) : cuts.add(i));
    const undo = h('button', { class: 'btn', type: 'button', onclick: () => { const i = history.pop(); if (i !== undefined && !done) { toggle(i); refresh(); } } }, '↶ Annuler');
    const clear = h('button', { class: 'btn', type: 'button', onclick: () => { if (done) return; cuts.clear(); history.length = 0; refresh(); } }, '✖ Tout effacer');
    const validate = h('button', {
      class: 'btn primary',
      type: 'button',
      onclick: () => {
        if (done || cuts.size === 0) return;
        done = true;
        const ok = isCorrect(target, cuts);
        // Correction visible : séparations justes, en trop, manquantes.
        gaps.forEach((g, i) => {
          const want = target.includes(i);
          if (cuts.has(i) && !want) g.classList.add('wrong');
          else if (want && !cuts.has(i)) g.classList.add('missing');
        });
        line.classList.add('checked');
        refresh();
        answer(ok, ok ? undefined : segment(letters, cuts));
      },
    }, '✔ Valider');

    function refresh(): void {
      gaps.forEach((g, i) => g.classList.toggle('on', cuts.has(i)));
      undo.disabled = done || history.length === 0;
      clear.disabled = done || cuts.size === 0;
      validate.disabled = done || cuts.size === 0;
    }

    const listen =
      level === 1
        ? h('button', { class: 'btn', type: 'button', onclick: () => ctx.speak(sentence) }, '🔊 Écouter la phrase')
        : null;

    el.classList.add('mots-colles');
    el.append(line, h('div', { class: 'mots-colles-tools' }, listen, undo, clear, validate));
    refresh();
  };
}

export const game: QuizGame = {
  title: 'Mots collés',
  instructions: 'Oh non, les mots de la phrase sont tout collés ! Touche entre deux lettres pour séparer les mots, puis appuie sur Valider.',
  levels: [
    { label: 'Petites phrases', description: '3 mots courts, on peut écouter la phrase' },
    { label: 'Avec des apostrophes', description: '4 à 6 mots : l’avion, j’aime, c’est…' },
    { label: 'Phrases pièges', description: 'longues phrases : il s’est, ils ont, aujourd’hui…' },
  ],
  makeItem(level, rng, recent) {
    const pool = SENTENCES[level];
    let sentence = pick(rng, pool);
    for (let i = 0; i < 10 && recent.includes(`${level}:${sentence}`); i++) sentence = pick(rng, pool);
    return {
      key: `${level}:${sentence}`,
      prompt: 'Sépare les mots de la phrase.',
      say:
        level === 1
          ? 'Sépare les mots de la phrase. Tu peux écouter la phrase avec le bouton.'
          : 'Sépare les mots de la phrase. Lis-la bien dans ta tête.',
      custom: render(sentence, level),
      explain: explainFor(sentence),
    };
  },
};

export default quizGame(game);
