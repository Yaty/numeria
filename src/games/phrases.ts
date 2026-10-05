/**
 * Phrases en désordre — morphosyntaxe (ordre des mots, structure de la phrase).
 * Les mots d’une phrase sont mélangés ; l’enfant les touche dans l’ordre pour
 * reconstruire la phrase (toucher un mot placé le renvoie), puis valide.
 *
 * Niveau 1 : 3 à 4 mots, sujet + verbe (+ complément) : « Léo mange une pomme. »
 * Niveau 2 : 5 à 7 mots, avec adjectif (avant ou après le nom), complément de
 *            lieu ou de temps, négation « ne… pas ».
 * Niveau 3 : 7 à 10 mots, avec subordonnée (parce que, si, avant de…), relative
 *            (qui, que), pronoms (il, elle, le, m’) et questions (est-ce que, où, qui…).
 *
 * Majuscule et ponctuation : les étiquettes sont en minuscules (sauf les prénoms,
 * qui gardent toujours leur majuscule) : une majuscule sur le premier mot donnerait
 * la réponse. Le point (ou le point d’interrogation) est affiché, fixe, au bout de
 * la zone de la phrase : il n’indique pas l’ordre, mais il dit si l’on construit
 * une question. Après validation, la phrase s’affiche correctement écrite
 * (majuscule, virgule éventuelle, ponctuation).
 *
 * Plusieurs ordres sont acceptés quand ils sont grammaticaux et naturels
 * (complément de lieu ou de temps en tête, subordonnée en tête…) ; ils sont
 * listés un par un (`alt`). Les phrases sont choisies pour qu’on ne puisse pas
 * échanger deux noms ou deux déterminants sans rendre la phrase fausse
 * (genre, nombre, accord, sens).
 */
import { h } from '../ui/dom';
import { pick, shuffle } from '../core/random';
import { quizGame, type QuizGame } from '../portal/quiz';
import './phrases.css';

export interface Sentence {
  level: 1 | 2 | 3;
  /** Forme de référence, sans majuscule initiale, avec virgules et ponctuation finale. */
  text: string;
  /** Autres ordres acceptés (même écriture). */
  alt: string[];
}

const S = (level: 1 | 2 | 3, text: string, ...alt: string[]): Sentence => ({ level, text, alt });

export const SENTENCES: Sentence[] = [
  // Niveau 1 : 3 ou 4 mots.
  S(1, 'le chat dort.'),
  S(1, 'le bébé pleure.'),
  S(1, 'le chien aboie.'),
  S(1, 'le coq chante.'),
  S(1, 'le soleil brille.'),
  S(1, 'la pluie tombe.'),
  S(1, 'le train roule.'),
  S(1, 'le vent souffle.'),
  S(1, 'la cloche sonne.'),
  S(1, 'le lapin saute.'),
  S(1, 'le bébé rit.'),
  S(1, 'la neige tombe.'),
  S(1, 'le poisson nage.'),
  S(1, 'la fleur pousse.'),
  S(1, 'Léo mange une pomme.'),
  S(1, 'Zoé lit un livre.'),
  S(1, 'papa boit du café.'),
  S(1, 'maman coupe le pain.'),
  S(1, 'Tom lance le ballon.'),
  S(1, 'Mila dessine une fleur.'),
  S(1, 'Léo boit de l’eau.'),
  S(1, 'papa lave la voiture.'),
  S(1, 'maman chante une chanson.'),
  S(1, 'Nina met un chapeau.'),
  S(1, 'Léa ferme la porte.'),
  S(1, 'Hugo mange une banane.'),
  S(1, 'Paul prend le bus.'),
  S(1, 'Sami joue au ballon.'),
  S(1, 'Lou fait un gâteau.'),
  S(1, 'Inès range sa chambre.'),
  S(1, 'Jade porte un sac.'),
  S(1, 'Tom ouvre la boîte.'),
  S(1, 'Max conduit un camion.'),

  // Niveau 2 : 5 à 7 mots (adjectifs, compléments, négation).
  S(2, 'le petit chat boit du lait.'),
  S(2, 'Léo porte un pull rouge.'),
  S(2, 'Zoé met sa robe bleue.'),
  S(2, 'le gros chien dort dans sa niche.', 'dans sa niche, le gros chien dort.'),
  S(2, 'le mouton mange de l’herbe verte.'),
  S(2, 'le bébé ne veut pas dormir.'),
  S(2, 'Léo n’aime pas les épinards.'),
  S(2, 'Zoé ne trouve pas son doudou.'),
  S(2, 'il ne fait pas froid aujourd’hui.', 'aujourd’hui, il ne fait pas froid.'),
  S(2, 'les enfants jouent dans la cour.', 'dans la cour, les enfants jouent.'),
  S(2, 'papa prépare une bonne soupe.'),
  S(2, 'maman achète du pain frais.'),
  S(2, 'le chat noir dort sur la chaise.', 'sur la chaise, le chat noir dort.'),
  S(2, 'une grosse araignée grimpe sur le mur.', 'sur le mur, une grosse araignée grimpe.'),
  S(2, 'le petit garçon mange une glace.'),
  S(2, 'la petite fille a un chapeau vert.'),
  S(2, 'mon frère ne mange pas de poisson.'),
  S(2, 'Tom ne regarde pas la télé.'),
  S(2, 'la vieille dame lit son journal.'),
  S(2, 'Léo a perdu sa chaussette.'),
  S(2, 'le chien court dans le jardin.', 'dans le jardin, le chien court.'),
  S(2, 'Mila boit un grand verre d’eau.'),
  S(2, 'nous allons à la plage demain.', 'demain, nous allons à la plage.', 'nous allons demain à la plage.'),
  S(2, 'le chat ne veut pas sortir.'),
  S(2, 'papa fait des crêpes ce soir.', 'ce soir, papa fait des crêpes.'),
  S(2, 'le maître lit une belle histoire.'),
  S(2, 'les oiseaux chantent dans l’arbre.', 'dans l’arbre, les oiseaux chantent.'),
  S(2, 'je ne trouve pas mes clés.'),
  S(2, 'Hugo a un nouveau vélo.'),
  S(2, 'le bébé dort dans sa poussette.', 'dans sa poussette, le bébé dort.'),
  S(2, 'Lina mange une pomme verte.'),
  S(2, 'le poisson nage dans l’eau.', 'dans l’eau, le poisson nage.'),
  S(2, 'papa ne trouve pas ses lunettes.'),

  // Niveau 3 : 7 à 10 mots (subordonnées, relatives, pronoms, questions).
  S(3, 'je prends mon parapluie parce qu’il pleut.', 'parce qu’il pleut, je prends mon parapluie.'),
  S(3, 'le chien que j’ai adopté est très gentil.'),
  S(3, 'Léo mange sa soupe parce qu’il a faim.', 'parce qu’il a faim, Léo mange sa soupe.'),
  S(3, 'est-ce que tu veux jouer avec moi ?'),
  S(3, 'à quelle heure est-ce que tu vas à l’école ?'),
  S(3, 'qui a mangé tous les gâteaux au chocolat ?'),
  S(3, 'où est-ce que tu as caché mes chaussures ?'),
  S(3, 'comment s’appelle le petit chien de ta voisine ?'),
  S(3, 'quand est-ce que nous partons en vacances ?'),
  S(3, 'est-ce que ta sœur viendra à mon anniversaire ?'),
  S(3, 'la fille qui chante est ma cousine.', 'ma cousine est la fille qui chante.'),
  S(3, 'le gâteau que maman a fait est délicieux.'),
  S(3, 'Léo donne un os au chien qui a faim.'),
  S(3, 'Zoé cherche son chat mais elle ne le trouve pas.'),
  S(3, 'les fleurs que papa a plantées sont jolies.'),
  S(3, 'papa lit une histoire avant que je m’endorme.', 'avant que je m’endorme, papa lit une histoire.'),
  S(3, 'il faut se laver les mains avant de manger.', 'avant de manger, il faut se laver les mains.'),
  S(3, 'le garçon qui porte des lunettes s’appelle Hugo.'),
  S(3, 'Mila range ses jouets puis elle va au lit.'),
  S(3, 'mets ton manteau si tu as froid.', 'si tu as froid, mets ton manteau.'),
  S(3, 'nous irons au parc s’il ne pleut pas.', 's’il ne pleut pas, nous irons au parc.'),
  S(3, 'les enfants qui ont fini peuvent aller jouer.'),
  S(3, 'maman m’a dit que le gâteau était prêt.'),
  S(3, 'je crois que ma sœur a mangé mes bonbons.'),
  S(3, 'où est-ce que tu as rangé mon cahier rouge ?'),
  S(3, 'Léo se dépêche pour ne pas rater le bus.', 'pour ne pas rater le bus, Léo se dépêche.'),
  S(3, 'le livre que tu m’as prêté est passionnant.'),
  S(3, 'les chouettes se réveillent à la tombée de la nuit.', 'à la tombée de la nuit, les chouettes se réveillent.'),
  S(3, 'la souris se cache parce qu’elle a peur du chat.', 'parce qu’elle a peur du chat, la souris se cache.'),
  S(3, 'qui veut venir avec moi à la piscine ?', 'qui veut venir à la piscine avec moi ?'),
  S(3, 'tu peux m’aider à porter ce sac ?'),
  S(3, 'pourquoi est-ce que le ciel est bleu ?'),
  S(3, 'nous dormons chez mamie pendant les vacances.', 'pendant les vacances, nous dormons chez mamie.'),
];

/** Ponctuation finale d’une forme. */
export function punctuation(form: string): string {
  return form.trim().slice(-1);
}

/** Étiquettes d’une forme : mots sans virgules ni ponctuation finale. */
export function tokens(form: string): string[] {
  return form
    .trim()
    .slice(0, -1)
    .replace(/,/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Toutes les formes acceptées d’une phrase. */
export function forms(s: Sentence): string[] {
  return [s.text, ...s.alt];
}

/** Forme acceptée correspondant à l’ordre construit, ou null. */
export function matchForm(s: Sentence, built: string[]): string | null {
  return forms(s).find((f) => tokens(f).join(' ') === built.join(' ')) ?? null;
}

/** Écriture finale : majuscule initiale, espace insécable avant « ? » et « ! ». */
export function display(form: string): string {
  const f = form.trim();
  const p = punctuation(f);
  const body = f.slice(0, -1).trim();
  return body.charAt(0).toUpperCase() + body.slice(1) + (p === '.' ? '.' : ` ${p}`);
}

export const game: QuizGame = {
  title: 'Phrases en désordre',
  instructions: 'Les mots sont mélangés. Touche-les dans le bon ordre pour construire la phrase, puis appuie sur Valider.',
  levels: [
    { label: 'Petites phrases', description: '3 ou 4 mots : qui fait quoi' },
    { label: 'Phrases plus longues', description: 'adjectifs, compléments, négation' },
    { label: 'Grandes phrases', description: 'subordonnées, pronoms, questions' },
  ],
  makeItem(level, rng, recent) {
    const pool = SENTENCES.filter((s) => s.level === level);
    let s = pick(rng, pool);
    for (let i = 0; i < 10 && recent.includes(`${level}:${s.text}`); i++) s = pick(rng, pool);
    const words = tokens(s.text);
    const accepted = forms(s).map((f) => tokens(f).join(' '));
    let tiles = shuffle(rng, words);
    for (let i = 0; i < 20 && accepted.includes(tiles.join(' ')); i++) tiles = shuffle(rng, words);
    const others = s.alt.length ? ` On peut aussi dire : «\u00a0${display(s.alt[0])}\u00a0»` : '';
    return {
      key: `${level}:${s.text}`,
      prompt: 'Remets les mots dans l’ordre pour faire une phrase.',
      say: punctuation(s.text) === '?' ? 'Remets les mots dans l’ordre. Attention, c’est une question !' : 'Remets les mots dans l’ordre pour faire une phrase.',
      explain: `La phrase est : «\u00a0${display(s.text)}\u00a0»${others}`,
      custom: (el, answer, ctx) => renderTiles(el, s, tiles, answer, ctx.speak),
    };
  },
};

function renderTiles(el: HTMLElement, s: Sentence, tiles: string[], answer: (ok: boolean, detail?: string) => void, speak: (t: string) => void): void {
  const placed: number[] = [];
  let done = false;
  const target = h('div', { class: 'tiles target phrases-target', 'aria-label': 'Ta phrase' });
  const pool = h('div', { class: 'tiles phrases-pool' });
  const result = h('p', { class: 'phrases-result' });
  const validate = h('button', { class: 'btn primary', type: 'button', onclick: () => check() }, 'Valider ✓');

  function render(): void {
    target.replaceChildren(
      ...placed.map((i, pos) =>
        h('button', { class: 'tile placed', type: 'button', disabled: done, onclick: () => remove(pos) }, tiles[i]),
      ),
      h('span', { class: 'phrases-punct' }, punctuation(s.text)),
    );
    pool.replaceChildren(
      ...tiles.map((w, i) =>
        h('button', { class: `tile ${placed.includes(i) ? 'phrases-used' : ''}`, type: 'button', disabled: done || placed.includes(i), onclick: () => place(i) }, w),
      ),
    );
    validate.disabled = done || placed.length !== tiles.length;
  }
  function place(i: number): void {
    if (done || placed.includes(i)) return;
    placed.push(i);
    speak(tiles[i]);
    render();
  }
  function remove(pos: number): void {
    if (done) return;
    placed.splice(pos, 1);
    render();
  }
  function check(): void {
    if (done || placed.length !== tiles.length) return;
    done = true;
    const built = placed.map((i) => tiles[i]);
    const form = matchForm(s, built);
    render();
    if (form) {
      target.classList.add('phrases-ok');
      target.replaceChildren(h('span', { class: 'phrases-sentence' }, display(form)));
      answer(true);
    } else {
      target.classList.add('phrases-bad');
      result.textContent = display(s.text);
      answer(false, built.join(' '));
    }
    validate.remove();
    pool.remove();
  }

  render();
  el.append(h('div', { class: 'phrases-wrap' }, target, pool, result, validate));
}

export default quizGame(game);
