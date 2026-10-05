/**
 * Le son caché — conscience phonologique (identification et localisation du phonème).
 *
 * Chaque mot est décrit par sa transcription phonétique (un caractère par phonème) ;
 * présence et position du son sont calculées, jamais devinées depuis l'orthographe.
 * L'écrit n'est jamais montré (images seules) : « rose » contient [z], pas [s].
 *
 * Niveau 1 : « Est-ce que tu entends le son … ? » oui / non, avec une image.
 *   Consonnes continues (qu'on peut prolonger : [ch], [f], [s], [l]…) et voyelles orales.
 *   Les mots « non » ne contiennent ni le son, ni un son proche ([ch]/[s]/[j]…), ni la
 *   lettre correspondante à l'écrit (pas de piège orthographique).
 * Niveau 2 : quelle image commence par le son ? (4 images). Ajout des occlusives
 *   ([p], [b], [t], [d], [k]) ; pas de groupe consonantique à l'attaque du bon mot,
 *   pas de distracteur commençant par un son proche (p/b, f/v, s/z…).
 * Niveau 3 : où est le son, au début, au milieu ou à la fin du mot ? Le son n'apparaît
 *   qu'une fois dans le mot ; mots terminés par consonne + [r]/[l] exclus (« arbre »).
 */
import { pick, shuffle } from '../core/random';
import { quizGame, type Choice, type QuizGame, type QuizItem } from '../portal/quiz';

/*
 * Notation phonétique (un caractère = un phonème) :
 * voyelles  a e(é) ɛ(è) i o(eau) ɔ(pomme) u(ou) y(u) ø(feu) œ(fleur) ə
 *           A(an) O(on) E(in)
 * consonnes p b t d k g f v s z S(ch) Z(j) m n N(gn) l R(r)
 * semi-voyelles j(yod : « pied ») w(« oi ») H(« ui »)
 */
const VOWELS = 'aeɛioɔuyøœəAOE';
const CONSONANTS = 'pbtdkgfvszSZmnNlR';
const GLIDES = 'jwH';
export const PHONEMES = VOWELS + CONSONANTS + GLIDES;

export type Word = readonly [word: string, emoji: string, phon: string];

export const WORDS: readonly Word[] = [
  ['chat', '🐱', 'Sa'],
  ['chien', '🐶', 'SjE'],
  ['chaussure', '👞', 'SosyR'],
  ['chaussette', '🧦', 'Sosɛt'],
  ['chapeau', '🎩', 'Sapo'],
  ['château', '🏰', 'Sato'],
  ['chameau', '🐫', 'Samo'],
  ['champignon', '🍄', 'SApiNO'],
  ['chocolat', '🍫', 'Sɔkɔla'],
  ['cochon', '🐷', 'kɔSO'],
  ['vache', '🐮', 'vaS'],
  ['mouche', '🪰', 'muS'],
  ['bouche', '👄', 'buS'],
  ['douche', '🚿', 'duS'],
  ['cloche', '🔔', 'klɔS'],
  ['hache', '🪓', 'aS'],
  ['girafe', '🦒', 'ZiRaf'],
  ['journal', '📰', 'ZuRnal'],
  ['bougie', '🕯️', 'buZi'],
  ['orange', '🍊', 'ɔRAZ'],
  ['plage', '🏖️', 'plaZ'],
  ['nuage', '☁️', 'nHaZ'],
  ['fromage', '🧀', 'fRɔmaZ'],
  ['singe', '🐵', 'sEZ'],
  ['ange', '👼', 'AZ'],
  ['aubergine', '🍆', 'obɛRZin'],
  ['fusée', '🚀', 'fyze'],
  ['fraise', '🍓', 'fRɛz'],
  ['feu', '🔥', 'fø'],
  ['fleur', '🌸', 'flœR'],
  ['fourmi', '🐜', 'fuRmi'],
  ['fantôme', '👻', 'fAtom'],
  ['fée', '🧚', 'fe'],
  ['phoque', '🦭', 'fɔk'],
  ['téléphone', '☎️', 'telefɔn'],
  ['café', '☕', 'kafe'],
  ['éléphant', '🐘', 'elefA'],
  ['gaufre', '🧇', 'gofR'],
  ['œuf', '🥚', 'œf'],
  ['dauphin', '🐬', 'dofE'],
  ['vélo', '🚲', 'velo'],
  ['violon', '🎻', 'vjɔlO'],
  ['valise', '🧳', 'valiz'],
  ['voiture', '🚗', 'vwatyR'],
  ['volcan', '🌋', 'vɔlkA'],
  ['avion', '✈️', 'avjO'],
  ['cravate', '👔', 'kRavat'],
  ['olive', '🫒', 'ɔliv'],
  ['livre', '📖', 'livR'],
  ['vampire', '🧛', 'vApiR'],
  ['soleil', '☀️', 'sɔlɛj'],
  ['sapin', '🎄', 'sapE'],
  ['serpent', '🐍', 'sɛRpA'],
  ['souris', '🐭', 'suRi'],
  ['salade', '🥗', 'salad'],
  ['citron', '🍋', 'sitRO'],
  ['ciseaux', '✂️', 'sizo'],
  ['glace', '🍦', 'glas'],
  ['ours', '🐻', 'uRs'],
  ['bus', '🚌', 'bys'],
  ['cactus', '🌵', 'kaktys'],
  ['dinosaure', '🦕', 'dinozɔR'],
  ['escargot', '🐌', 'ɛskaRgo'],
  ['pastèque', '🍉', 'pastɛk'],
  ['poisson', '🐟', 'pwasO'],
  ['sucette', '🍭', 'sysɛt'],
  ['cygne', '🦢', 'siN'],
  ['os', '🦴', 'ɔs'],
  ['zèbre', '🦓', 'zɛbR'],
  ['rose', '🌹', 'Roz'],
  ['maison', '🏠', 'mɛzO'],
  ['oiseau', '🐦', 'wazo'],
  ['lézard', '🦎', 'lezaR'],
  ['église', '⛪', 'egliz'],
  ['raisin', '🍇', 'RɛzE'],
  ['lune', '🌙', 'lyn'],
  ['lion', '🦁', 'ljO'],
  ['lapin', '🐰', 'lapE'],
  ['lit', '🛏️', 'li'],
  ['loup', '🐺', 'lu'],
  ['lunettes', '👓', 'lynɛt'],
  ['ballon', '⚽', 'balO'],
  ['bol', '🥣', 'bɔl'],
  ['étoile', '⭐', 'etwal'],
  ['poule', '🐔', 'pul'],
  ['pile', '🔋', 'pil'],
  ['crocodile', '🐊', 'kRɔkɔdil'],
  ['clé', '🔑', 'kle'],
  ['lama', '🦙', 'lama'],
  ['robe', '👗', 'Rɔb'],
  ['radio', '📻', 'Radjo'],
  ['robot', '🤖', 'Rɔbo'],
  ['tortue', '🐢', 'tɔRty'],
  ['poire', '🍐', 'pwaR'],
  ['cœur', '❤️', 'kœR'],
  ['guitare', '🎸', 'gitaR'],
  ['carotte', '🥕', 'kaRɔt'],
  ['arbre', '🌳', 'aRbR'],
  ['tigre', '🐯', 'tigR'],
  ['parapluie', '☂️', 'paRaplHi'],
  ['crabe', '🦀', 'kRab'],
  ['train', '🚆', 'tRE'],
  ['tracteur', '🚜', 'tRaktœR'],
  ['moto', '🏍️', 'moto'],
  ['mouton', '🐑', 'mutO'],
  ['main', '✋', 'mE'],
  ['montre', '⌚', 'mOtR'],
  ['pomme', '🍎', 'pɔm'],
  ['plume', '🪶', 'plym'],
  ['tomate', '🍅', 'tɔmat'],
  ['marteau', '🔨', 'maRto'],
  ['micro', '🎤', 'mikRo'],
  ['miel', '🍯', 'mjɛl'],
  ['mammouth', '🦣', 'mamut'],
  ['nez', '👃', 'ne'],
  ['nounours', '🧸', 'nunuRs'],
  ['banane', '🍌', 'banan'],
  ['canard', '🦆', 'kanaR'],
  ['couronne', '👑', 'kuRɔn'],
  ['piano', '🎹', 'pjano'],
  ['pantalon', '👖', 'pAtalO'],
  ['papillon', '🦋', 'papijO'],
  ['pied', '🦶', 'pje'],
  ['pingouin', '🐧', 'pEgwE'],
  ['pinceau', '🖌️', 'pEso'],
  ['poussin', '🐤', 'pusE'],
  ['bateau', '⛵', 'bato'],
  ['bébé', '👶', 'bebe'],
  ['baleine', '🐳', 'balɛn'],
  ['botte', '👢', 'bɔt'],
  ['bonbon', '🍬', 'bObO'],
  ['bague', '💍', 'bag'],
  ['tambour', '🥁', 'tAbuR'],
  ['tente', '⛺', 'tAt'],
  ['dé', '🎲', 'de'],
  ['dent', '🦷', 'dA'],
  ['dragon', '🐉', 'dRagO'],
  ['camion', '🚚', 'kamjO'],
  ['cadeau', '🎁', 'kado'],
  ['koala', '🐨', 'kɔala'],
  ['kangourou', '🦘', 'kAguRu'],
  ['gâteau', '🎂', 'gato'],
  ['gorille', '🦍', 'gɔRij'],
  ['goutte', '💧', 'gut'],
  ['île', '🏝️', 'il'],
  ['kiwi', '🥝', 'kiwi'],
  ['seau', '🪣', 'so'],
  ['abeille', '🐝', 'abɛj'],
  ['araignée', '🕷️', 'aRɛNe'],
  ['coccinelle', '🐞', 'kɔksinɛl'],
  ['panda', '🐼', 'pAda'],
  ['avocat', '🥑', 'avɔka'],
];

export interface Target {
  id: string;
  /** Graphie affichée entre crochets : « [ch] ». */
  label: string;
  /** Mot repère : « comme dans chat ». */
  anchor: string;
  /** Phonèmes qui comptent comme « le son » (o et ɔ = le son [o]). */
  sounds: string;
  /** Sons proches : jamais dans un mot « non » (niv. 1) ni en tête d'un distracteur (niv. 2). */
  close: string;
  /** Mots contenant ces phonèmes écartés pour ce son (ambigus : « oi » pour [a], « ion » pour [i]…). */
  conflicts: string;
  /** Graphies du son : un mot « non » du niveau 1 ne doit pas les contenir à l'écrit. */
  letters: RegExp;
  levels: readonly (1 | 2 | 3)[];
}

export const TARGETS: readonly Target[] = [
  { id: 'ch', label: 'ch', anchor: 'chat', sounds: 'S', close: 'szZ', conflicts: '', letters: /ch|sh/, levels: [1, 2, 3] },
  { id: 'j', label: 'j', anchor: 'jardin', sounds: 'Z', close: 'Szs', conflicts: '', letters: /j|g/, levels: [1, 2, 3] },
  { id: 'f', label: 'f', anchor: 'fusée', sounds: 'f', close: 'v', conflicts: '', letters: /f|ph/, levels: [1, 2, 3] },
  { id: 'v', label: 'v', anchor: 'vélo', sounds: 'v', close: 'fb', conflicts: '', letters: /v|w/, levels: [1, 2, 3] },
  { id: 's', label: 's', anchor: 'soleil', sounds: 's', close: 'zS', conflicts: '', letters: /s|c|ç|x/, levels: [1, 2, 3] },
  { id: 'z', label: 'z', anchor: 'zèbre', sounds: 'z', close: 'sZ', conflicts: '', letters: /z|s|x/, levels: [1, 3] },
  { id: 'l', label: 'l', anchor: 'lune', sounds: 'l', close: 'R', conflicts: '', letters: /l/, levels: [1, 2, 3] },
  { id: 'r', label: 'r', anchor: 'robot', sounds: 'R', close: 'l', conflicts: '', letters: /r/, levels: [1, 2, 3] },
  { id: 'm', label: 'm', anchor: 'moto', sounds: 'm', close: 'n', conflicts: '', letters: /m/, levels: [1, 2, 3] },
  { id: 'n', label: 'n', anchor: 'nez', sounds: 'n', close: 'mN', conflicts: 'N', letters: /n/, levels: [1, 2, 3] },
  { id: 'p', label: 'p', anchor: 'pomme', sounds: 'p', close: 'b', conflicts: '', letters: /p/, levels: [2, 3] },
  { id: 'b', label: 'b', anchor: 'bébé', sounds: 'b', close: 'pv', conflicts: '', letters: /b/, levels: [2, 3] },
  { id: 't', label: 't', anchor: 'tomate', sounds: 't', close: 'd', conflicts: '', letters: /t/, levels: [2, 3] },
  { id: 'd', label: 'd', anchor: 'domino', sounds: 'd', close: 't', conflicts: '', letters: /d/, levels: [2, 3] },
  { id: 'k', label: 'k', anchor: 'cadeau', sounds: 'k', close: 'g', conflicts: '', letters: /k|c|q/, levels: [2, 3] },
  { id: 'a', label: 'a', anchor: 'ananas', sounds: 'a', close: 'A', conflicts: 'AwE', letters: /a|à|â/, levels: [1, 3] },
  { id: 'i', label: 'i', anchor: 'lit', sounds: 'i', close: 'yE', conflicts: 'jHE', letters: /i|î|y/, levels: [1, 3] },
  { id: 'ou', label: 'ou', anchor: 'loup', sounds: 'u', close: 'yo', conflicts: 'w', letters: /ou|u|o/, levels: [1, 3] },
  { id: 'u', label: 'u', anchor: 'lune', sounds: 'y', close: 'ui', conflicts: 'H', letters: /u|û/, levels: [1, 3] },
  { id: 'o', label: 'o', anchor: 'moto', sounds: 'oɔ', close: 'uO', conflicts: 'Ow', letters: /o|ô|au/, levels: [1, 3] },
];

const has = (phon: string, set: string) => [...phon].some((p) => set.includes(p));
const count = (phon: string, set: string) => [...phon].filter((p) => set.includes(p)).length;
const isConsonant = (p: string) => CONSONANTS.includes(p);

/** Mot terminé par consonne + [r]/[l] (« arbre », « tigre ») : fin de mot instable à l'oral. */
const finalCluster = (phon: string) => phon.length >= 2 && isConsonant(phon[phon.length - 2]) && 'Rl'.includes(phon[phon.length - 1]);

/** Mots utilisables pour un son (jamais le mot repère, jamais un mot ambigu pour ce son). */
const usable = (t: Target) => WORDS.filter(([w, , p]) => w !== t.anchor && !has(p, t.conflicts));

/** Niveau 1 : mots où l'on entend le son. */
export const yesWords = (t: Target) => usable(t).filter(([, , p]) => has(p, t.sounds));
/** Niveau 1 : mots sans le son, sans son proche, sans la lettre à l'écrit. */
export const noWords = (t: Target) =>
  usable(t).filter(([w, , p]) => !has(p, t.sounds) && !has(p, t.close) && !t.letters.test(w.normalize('NFC')));

/** Niveau 2 : mots qui commencent par le son, sans groupe consonantique (« fraise » exclu). */
export const startWords = (t: Target) =>
  usable(t).filter(([, , p]) => t.sounds.includes(p[0]) && !isConsonant(p[1]));
/** Niveau 2 : distracteurs (ne commencent ni par le son ni par un son proche). */
export const otherStartWords = (t: Target) =>
  WORDS.filter(([w, , p]) => w !== t.anchor && !t.sounds.includes(p[0]) && !t.close.includes(p[0]));

export type Position = 'debut' | 'milieu' | 'fin';
export function position(phon: string, t: Target): Position {
  const i = [...phon].findIndex((p) => t.sounds.includes(p));
  return i === 0 ? 'debut' : i === phon.length - 1 ? 'fin' : 'milieu';
}
/** Niveau 3 : le son n'apparaît qu'une fois, fin de mot stable. */
export const placeWords = (t: Target) => usable(t).filter(([, , p]) => count(p, t.sounds) === 1 && !finalCluster(p));

const POSITIONS: { id: Position; label: string; strip: string; phrase: string }[] = [
  { id: 'debut', label: 'au début', strip: '🟩⬜⬜', phrase: 'au début' },
  { id: 'milieu', label: 'au milieu', strip: '⬜🟩⬜', phrase: 'au milieu' },
  { id: 'fin', label: 'à la fin', strip: '⬜⬜🟩', phrase: 'à la fin' },
];

const VOWEL_TARGETS = ['a', 'i', 'ou', 'u', 'o'];
/**
 * Le son tel qu'il est lu par la synthèse vocale : une voyelle se prononce seule
 * (« ou », « u »…), mais « [ch] » serait épelé ; pour une consonne on s'appuie
 * donc sur le mot repère, qui commence toujours par ce son.
 */
export const sound = (t: Target) =>
  VOWEL_TARGETS.includes(t.id) ? `le son « ${t.label} », comme dans ${t.anchor}` : `le son du début de ${t.anchor}`;

function levelOne(t: Target, rng: () => number, avoid: string[]): QuizItem | null {
  const yes = rng() < 0.5;
  const pool = (yes ? yesWords(t) : noWords(t)).filter(([w]) => !avoid.includes(`${t.id}?${w}`));
  if (pool.length === 0) return null;
  const [w, e, p] = pick(rng, pool);
  return {
    key: `${t.id}?${w}`,
    prompt: `Est-ce que tu entends ${sound(t)} ?`,
    say: `Écoute : ${w}. Est-ce que tu entends ${sound(t)}, dans ${w} ?`,
    stimulus: { emoji: e },
    keepOrder: true,
    choices: [
      { label: 'Oui', emoji: '👍', correct: yes },
      { label: 'Non', emoji: '👎', correct: !yes },
    ],
    explain: yes
      ? `La réponse est oui : dans « ${w} », on entend ${sound(t)}${count(p, t.sounds) === 1 ? `, ${POSITIONS.find((x) => x.id === position(p, t))?.phrase}` : ''}.`
      : `La réponse est non : dans « ${w} », on n’entend pas ${sound(t)}.`,
  };
}

function levelTwo(t: Target, rng: () => number, avoid: string[]): QuizItem | null {
  const pool = startWords(t).filter(([w]) => !avoid.includes(`${t.id}^${w}`));
  if (pool.length === 0) return null;
  const good = pick(rng, pool);
  const others: Word[] = [];
  for (const o of shuffle(rng, otherStartWords(t))) {
    // Distracteurs commençant par des sons différents entre eux.
    if (others.length < 3 && !others.some((x) => x[2][0] === o[2][0])) others.push(o);
  }
  const all = shuffle(rng, [good, ...others]);
  const choices: Choice[] = all.map(([w, e]) => ({ label: '', emoji: e, say: w, correct: w === good[0] }));
  return {
    key: `${t.id}^${good[0]}`,
    prompt: `Quelle image commence par ${sound(t)} ?`,
    say: `Quel mot commence par ${sound(t)} ? Écoute : ${all.map(([w]) => w).join(', ')}.`,
    keepOrder: true,
    choices,
    explain: `« ${capitalize(good[0])} » commence par ${sound(t)}.`,
  };
}

function levelThree(t: Target, rng: () => number, avoid: string[]): QuizItem | null {
  // On tire d'abord la position, pour équilibrer début / milieu / fin.
  const want = pick(rng, POSITIONS).id;
  const all = placeWords(t).filter(([w]) => !avoid.includes(`${t.id}@${w}`));
  const pool = all.filter(([, , p]) => position(p, t) === want);
  if (all.length === 0) return null;
  const [w, e, p] = pick(rng, pool.length > 0 ? pool : all);
  const where = position(p, t);
  return {
    key: `${t.id}@${w}`,
    prompt: `Où entends-tu ${sound(t)} ?`,
    say: `Écoute : ${w}. Où entends-tu ${sound(t)}, dans ${w} ? Au début, au milieu, ou à la fin ?`,
    stimulus: { emoji: e },
    keepOrder: true,
    choices: POSITIONS.map((x) => ({ label: x.label, emoji: x.strip, correct: x.id === where })),
    explain: `Dans « ${w} », ${sound(t)} est ${POSITIONS.find((x) => x.id === where)?.phrase}.`,
  };
}

export const game: QuizGame = {
  title: 'Le son caché',
  instructions: 'Écoute bien le mot et cherche le son caché : est-il là ? Au début ? À la fin ?',
  levels: [
    { label: 'J’entends ou pas ?', description: 'oui ou non, sons faciles à entendre' },
    { label: 'Le son du début', description: 'quelle image commence par le son ?' },
    { label: 'Où est le son ?', description: 'au début, au milieu ou à la fin' },
  ],
  makeItem(level, rng, recent) {
    const make = level === 1 ? levelOne : level === 2 ? levelTwo : levelThree;
    const targets = TARGETS.filter((t) => t.levels.includes(level));
    const avoid = recent.slice(-12);
    for (let i = 0; i < 20; i++) {
      const t = pick(rng, targets);
      // Éviter d'enchaîner deux fois le même son.
      if (i < 10 && recent.length > 0 && recent[recent.length - 1].startsWith(`${t.id}${'?^@'[level - 1]}`)) continue;
      const item = make(t, rng, i < 15 ? avoid : []);
      if (item) return item;
    }
    // Toujours possible : chaque son a des mots à chaque niveau (vérifié par les tests).
    return make(targets[0], rng, []) as QuizItem;
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default quizGame(game);
