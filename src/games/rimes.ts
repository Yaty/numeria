/**
 * Rimes en folie — conscience phonologique (jugement et identification de rimes).
 * Un mot cible (image + voix) et plusieurs images : trouver celle qui rime.
 * Deux mots riment quand ils finissent par le même son : dernière voyelle prononcée
 * et sons qui la suivent (rime PHONÉTIQUE : « seau » rime avec « chapeau » et « vélo »).
 * Les mots sont regroupés par rime ; un mot n'appartient qu'à une rime. Rimes trop
 * proches pour servir d'intrus écartées (« poire » rime en [ar] avec « canard »).
 * La graphie de la rime ignore le pluriel (« lunettes » s'écrit comme « chaussette »).
 *
 * Niveau 1 : 3 images ; la bonne rime s'écrit pareil (bateau / gâteau) ; les intrus
 *   n'ont ni la même voyelle finale ni le même son initial que la cible.
 * Niveau 2 : 4 images ; intrus proches, qui commencent par le même son que la cible
 *   (bateau / ballon) ou qui ont la même voyelle sans rimer (mouche / poule).
 * Niveau 3 : 4 images ; la bonne rime s'écrit autrement (chapeau / vélo, cœur / fleur),
 *   intrus de préférence avec la même voyelle (rimes « presque pareilles »).
 */
import { pick, shuffle } from '../core/random';
import { quizGame, type QuizGame } from '../portal/quiz';

/** [mot, émoji, graphie de la rime, premier phonème (notation de son-cache)] */
export type Word = readonly [word: string, emoji: string, spelling: string, initial: string];

export interface Rime {
  /** Ce qu'on entend, écrit simplement pour l'explication : « eau » → « o ». */
  sound: string;
  /** Voyelle de la rime (o et ɔ, e et ɛ confondus pour les intrus « éloignés »). */
  vowel: string;
  words: readonly Word[];
}

export const RIMES: Record<string, Rime> = {
  o: {
    sound: 'o',
    vowel: 'o',
    words: [
      ['bateau', '⛵', 'eau', 'b'], ['gâteau', '🎂', 'eau', 'g'], ['château', '🏰', 'eau', 'S'], ['chapeau', '🎩', 'eau', 'S'],
      ['marteau', '🔨', 'eau', 'm'], ['cadeau', '🎁', 'eau', 'k'], ['chameau', '🐫', 'eau', 'S'], ['oiseau', '🐦', 'eau', 'w'],
      ['pinceau', '🖌️', 'eau', 'p'], ['seau', '🪣', 'eau', 's'], ['couteau', '🔪', 'eau', 'k'], ['ciseaux', '✂️', 'eau', 's'],
      ['vélo', '🚲', 'o', 'v'], ['moto', '🏍️', 'o', 'm'], ['piano', '🎹', 'o', 'p'], ['micro', '🎤', 'o', 'm'],
      ['radio', '📻', 'o', 'R'], ['robot', '🤖', 'ot', 'R'], ['escargot', '🐌', 'ot', 'ɛ'],
    ],
  },
  a: {
    sound: 'a',
    vowel: 'a',
    words: [
      ['chat', '🐱', 'at', 'S'], ['chocolat', '🍫', 'at', 'S'], ['avocat', '🥑', 'at', 'a'],
      ['lama', '🦙', 'a', 'l'], ['panda', '🐼', 'a', 'p'], ['koala', '🐨', 'a', 'k'], ['pizza', '🍕', 'a', 'p'],
    ],
  },
  i: {
    sound: 'i',
    vowel: 'i',
    words: [
      ['lit', '🛏️', 'it', 'l'], ['souris', '🐭', 'is', 's'], ['fourmi', '🐜', 'i', 'f'], ['kiwi', '🥝', 'i', 'k'],
      ['riz', '🍚', 'iz', 'R'], ['parapluie', '☂️', 'ie', 'p'],
    ],
  },
  ou: {
    sound: 'ou',
    vowel: 'u',
    words: [['loup', '🐺', 'oup', 'l'], ['kangourou', '🦘', 'ou', 'k']],
  },
  on: {
    sound: 'on',
    vowel: 'O',
    words: [
      ['mouton', '🐑', 'on', 'm'], ['ballon', '⚽', 'on', 'b'], ['poisson', '🐟', 'on', 'p'], ['cochon', '🐷', 'on', 'k'],
      ['citron', '🍋', 'on', 's'], ['dragon', '🐉', 'on', 'd'], ['bonbon', '🍬', 'on', 'b'], ['pantalon', '👖', 'on', 'p'],
      ['champignon', '🍄', 'on', 'S'], ['glaçon', '🧊', 'on', 'g'], ['violon', '🎻', 'on', 'v'], ['camion', '🚚', 'on', 'k'],
      ['avion', '✈️', 'on', 'a'], ['lion', '🦁', 'on', 'l'], ['savon', '🧼', 'on', 's'], ['hérisson', '🦔', 'on', 'e'],
      ['papillon', '🦋', 'on', 'p'], ['crayon', '✏️', 'on', 'k'], ['biberon', '🍼', 'on', 'b'],
    ],
  },
  in: {
    sound: 'in',
    vowel: 'E',
    words: [
      ['lapin', '🐰', 'in', 'l'], ['sapin', '🎄', 'in', 's'], ['dauphin', '🐬', 'in', 'd'], ['poussin', '🐤', 'in', 'p'],
      ['raisin', '🍇', 'in', 'R'], ['requin', '🦈', 'in', 'R'], ['pingouin', '🐧', 'in', 'p'],
      ['train', '🚆', 'ain', 't'], ['main', '✋', 'ain', 'm'], ['pain', '🍞', 'ain', 'p'], ['chien', '🐶', 'ien', 'S'],
    ],
  },
  an: {
    sound: 'an',
    vowel: 'A',
    words: [
      ['éléphant', '🐘', 'ant', 'e'], ['gant', '🧤', 'ant', 'g'], ['croissant', '🥐', 'ant', 'k'], ['diamant', '💎', 'ant', 'd'],
      ['serpent', '🐍', 'ent', 's'], ['dent', '🦷', 'ent', 'd'], ['volcan', '🌋', 'an', 'v'],
    ],
  },
  e: {
    sound: 'é',
    vowel: 'e',
    words: [
      ['fusée', '🚀', 'ée', 'f'], ['fée', '🧚', 'ée', 'f'], ['araignée', '🕷️', 'ée', 'a'],
      ['clé', '🔑', 'é', 'k'], ['café', '☕', 'é', 'k'], ['bébé', '👶', 'é', 'b'], ['dé', '🎲', 'é', 'd'],
      ['nez', '👃', 'ez', 'n'], ['pied', '🦶', 'ied', 'p'],
    ],
  },
  ere: {
    sound: 'ère',
    vowel: 'e',
    words: [['cuillère', '🥄', 'ère', 'k'], ['hélicoptère', '🚁', 'ère', 'e'], ['théière', '🫖', 'ère', 't'], ['ver', '🪱', 'er', 'v']],
  },
  ar: {
    sound: 'ar',
    vowel: 'a',
    words: [['canard', '🦆', 'ard', 'k'], ['lézard', '🦎', 'ard', 'l'], ['homard', '🦞', 'ard', 'ɔ'], ['renard', '🦊', 'ard', 'R'], ['guitare', '🎸', 'are', 'g']],
  },
  el: {
    sound: 'elle',
    vowel: 'e',
    words: [['échelle', '🪜', 'elle', 'e'], ['coccinelle', '🐞', 'elle', 'k'], ['poubelle', '🗑️', 'elle', 'p'], ['miel', '🍯', 'iel', 'm'], ['arc-en-ciel', '🌈', 'iel', 'a']],
  },
  ette: {
    sound: 'ette',
    vowel: 'e',
    words: [
      ['lunettes', '👓', 'ette', 'l'], ['chaussette', '🧦', 'ette', 'S'], ['sucette', '🍭', 'ette', 's'],
      ['trompette', '🎺', 'ette', 't'], ['trottinette', '🛴', 'ette', 't'], ['baguette', '🥖', 'ette', 'b'],
    ],
  },
  ure: { sound: 'ure', vowel: 'y', words: [['chaussure', '👞', 'ure', 'S'], ['voiture', '🚗', 'ure', 'v']] },
  aise: { sound: 'aise', vowel: 'e', words: [['fraise', '🍓', 'aise', 'f'], ['chaise', '🪑', 'aise', 'S']] },
  ouche: { sound: 'ouche', vowel: 'u', words: [['mouche', '🪰', 'ouche', 'm'], ['bouche', '👄', 'ouche', 'b'], ['douche', '🚿', 'ouche', 'd']] },
  eil: {
    sound: 'eil',
    vowel: 'e',
    words: [['soleil', '☀️', 'eil', 's'], ['abeille', '🐝', 'eille', 'a'], ['oreille', '👂', 'eille', 'ɔ'], ['bouteille', '🍾', 'eille', 'b']],
  },
  age: {
    sound: 'age',
    vowel: 'a',
    words: [['plage', '🏖️', 'age', 'p'], ['nuage', '☁️', 'age', 'n'], ['fromage', '🧀', 'age', 'f'], ['coquillage', '🐚', 'age', 'k']],
  },
  onne: { sound: 'onne', vowel: 'o', words: [['couronne', '👑', 'onne', 'k'], ['téléphone', '☎️', 'one', 't'], ['saxophone', '🎷', 'one', 's']] },
  ol: { sound: 'ol', vowel: 'o', words: [['bol', '🥣', 'ol', 'b'], ['école', '🏫', 'ole', 'e'], ['parasol', '⛱️', 'ol', 'p']] },
  il: { sound: 'il', vowel: 'i', words: [['crocodile', '🐊', 'ile', 'k'], ['île', '🏝️', 'île', 'i'], ['pile', '🔋', 'ile', 'p']] },
  ise: { sound: 'ise', vowel: 'i', words: [['valise', '🧳', 'ise', 'v'], ['cerise', '🍒', 'ise', 's'], ['église', '⛪', 'ise', 'e']] },
  eur: {
    sound: 'eur',
    vowel: 'œ',
    words: [['fleur', '🌸', 'eur', 'f'], ['tracteur', '🚜', 'eur', 't'], ['ordinateur', '💻', 'eur', 'ɔ'], ['cœur', '❤️', 'œur', 'k']],
  },
  ange: { sound: 'ange', vowel: 'A', words: [['orange', '🍊', 'ange', 'ɔ'], ['ange', '👼', 'ange', 'A']] },
  or: { sound: 'or', vowel: 'o', words: [['dinosaure', '🦕', 'aure', 'd'], ['tyrannosaure', '🦖', 'aure', 't'], ['castor', '🦫', 'or', 'k']] },
  eine: { sound: 'aine', vowel: 'e', words: [['baleine', '🐳', 'eine', 'b'], ['fontaine', '⛲', 'aine', 'f']] },
};

interface Entry {
  rime: string;
  word: Word;
}

export const ENTRIES: Entry[] = Object.entries(RIMES).flatMap(([rime, r]) => r.words.map((word) => ({ rime, word })));

/** Partenaires de rime pour un niveau (même graphie au niveau 1, graphie différente au niveau 3). */
export function partners(target: Entry, level: 1 | 2 | 3): Word[] {
  return RIMES[target.rime].words.filter(
    (w) => w[0] !== target.word[0] && (level === 1 ? w[2] === target.word[2] : level === 3 ? w[2] !== target.word[2] : true),
  );
}

/** Cibles possibles à un niveau : celles qui ont au moins un partenaire. */
export const targetsFor = (level: 1 | 2 | 3) => ENTRIES.filter((e) => partners(e, level).length > 0);

const vowelFamily = (v: string) => ({ ɔ: 'o', ɛ: 'e', ø: 'œ' })[v] ?? v;

export const game: QuizGame = {
  title: 'Rimes en folie',
  instructions: 'Deux mots riment quand ils finissent par le même son, comme bateau et gâteau. Trouve l’image qui rime avec le mot !',
  levels: [
    { label: 'Rimes faciles', description: 'mots qui finissent pareil, trois images' },
    { label: 'Attention aux pièges', description: 'des mots qui commencent pareil, quatre images' },
    { label: 'Rimes cachées', description: 'ça sonne pareil mais ça s’écrit autrement' },
  ],
  makeItem(level, rng, recent) {
    const targets = targetsFor(level);
    let target = pick(rng, targets);
    for (let i = 0; i < 15 && recent.slice(-12).some((k) => k.startsWith(`${target.word[0]}>`) || k.endsWith(`>${target.word[0]}`)); i++) {
      target = pick(rng, targets);
    }
    const good = pick(rng, partners(target, level));
    const tv = vowelFamily(RIMES[target.rime].vowel);
    const ti = target.word[3];

    // Intrus : une seule image par rime, jamais la rime de la cible.
    const others = shuffle(rng, ENTRIES.filter((e) => e.rime !== target.rime));
    const near = (e: Entry) => vowelFamily(RIMES[e.rime].vowel) === tv || e.word[3] === ti;
    let ordered: Entry[];
    if (level === 1) ordered = others.filter((e) => vowelFamily(RIMES[e.rime].vowel) !== tv && e.word[3] !== ti && e.word[3] !== good[3]);
    else if (level === 2) ordered = [...others.filter(near), ...others.filter((e) => !near(e))];
    else {
      const sameVowel = others.filter((e) => vowelFamily(RIMES[e.rime].vowel) === tv);
      ordered = [...sameVowel, ...others.filter((e) => e.word[3] === ti && !sameVowel.includes(e)), ...others.filter((e) => !near(e))];
    }
    const distractors: Word[] = [];
    const usedRimes = new Set<string>();
    for (const e of ordered) {
      if (distractors.length >= (level === 1 ? 2 : 3)) break;
      if (usedRimes.has(e.rime)) continue;
      usedRimes.add(e.rime);
      distractors.push(e.word);
    }

    const all = shuffle(rng, [good, ...distractors]);
    const sound = RIMES[target.rime].sound;
    const spelled = good[2] !== target.word[2] ? ' Ça ne s’écrit pas pareil, mais ça sonne pareil !' : '';
    return {
      key: `${target.word[0]}>${good[0]}`,
      prompt: `Qu’est-ce qui rime avec « ${target.word[0]} » ?`,
      say: `Qu’est-ce qui rime avec ${target.word[0]} ? Écoute : ${all.map((w) => w[0]).join(', ')}.`,
      stimulus: { emoji: target.word[1] },
      keepOrder: true,
      choices: all.map(([w, e]) => ({ label: '', emoji: e, say: w, correct: w === good[0] })),
      explain: `${capitalize(target.word[0])} et ${good[0]} riment : on entend « ${sound} » à la fin des deux mots.${spelled}`,
    };
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default quizGame(game);
