/**
 * Lecture flash — langage écrit (voie d'assemblage puis voie d'adressage).
 * Un mot écrit apparaît brièvement ; l'enfant touche l'image qui lui correspond
 * parmi 3 ou 4 images dont les noms se ressemblent à l'écrit ou à l'oral
 * (bouche / douche / mouche). Le mot n'est JAMAIS lu à voix haute : c'est de la lecture.
 *
 * Niveau 1 : mots réguliers à graphèmes simples (une lettre = un son, é, è, e muet final),
 *            structure CV ou CCV : lune, moto, tomate, crabe… — affichage 1 500 ms.
 * Niveau 2 : mots réguliers contenant des graphèmes complexes (ou, on, an, in, oi, ch, gn,
 *            eau, ai, eu…) ou une règle contextuelle (c/g doux, s entre voyelles) — 900 ms.
 * Niveau 3 : mots irréguliers (femme, sept, oignon, paon, wagon…) et mots longs
 *            (hippopotame, coccinelle…), qui demandent la voie d'adressage — 500 ms.
 *
 * Les distracteurs viennent de « familles » de mots proches (même attaque, même rime,
 * lettres en miroir…) ; ils peuvent être de n'importe quel niveau puisqu'ils ne sont
 * jamais écrits : seul le mot cible doit correspondre au niveau.
 */
import { pick, shuffle } from '../core/random';
import { quizGame, type QuizGame } from '../portal/quiz';

/** [mot, émoji, niveau du mot quand il est la cible]. */
export type Word = readonly [word: string, emoji: string, level: 1 | 2 | 3];

export const WORDS: readonly Word[] = [
  // Niveau 1 : graphèmes simples.
  ['lune', '🌙', 1], ['plume', '🪶', 1], ['moto', '🏍️', 1], ['vélo', '🚲', 1], ['dé', '🎲', 1],
  ['clé', '🔑', 1], ['bébé', '👶', 1], ['robe', '👗', 1], ['lama', '🦙', 1], ['koala', '🐨', 1],
  ['tomate', '🍅', 1], ['tortue', '🐢', 1], ['tulipe', '🌷', 1], ['olive', '🫒', 1], ['livre', '📖', 1],
  ['salade', '🥗', 1], ['malade', '🤒', 1], ['sac', '👜', 1], ['banane', '🍌', 1], ['cabane', '🛖', 1],
  ['café', '☕', 1], ['canapé', '🛋️', 1], ['zèbre', '🦓', 1], ['arbre', '🌳', 1], ['tigre', '🐯', 1],
  ['crabe', '🦀', 1], ['cravate', '👔', 1], ['cactus', '🌵', 1], ['castor', '🦫', 1], ['carotte', '🥕', 1],
  ['règle', '📏', 1], ['radio', '📻', 1], ['piano', '🎹', 1], ['pomme', '🍎', 1],
  // Niveau 2 : graphèmes complexes, mots réguliers.
  ['poule', '🐔', 2], ['loup', '🐺', 2], ['loupe', '🔍', 2], ['bouche', '👄', 2], ['douche', '🚿', 2],
  ['mouche', '🪰', 2], ['chat', '🐱', 2], ['rat', '🐀', 2], ['chien', '🐶', 2], ['pain', '🍞', 2],
  ['bain', '🛁', 2], ['main', '✋', 2], ['train', '🚆', 2], ['lapin', '🐰', 2], ['sapin', '🎄', 2],
  ['raisin', '🍇', 2], ['poussin', '🐤', 2], ['bateau', '⛵', 2], ['gâteau', '🎂', 2], ['château', '🏰', 2],
  ['chapeau', '🎩', 2], ['marteau', '🔨', 2], ['manteau', '🧥', 2], ['couteau', '🔪', 2], ['cadeau', '🎁', 2],
  ['lion', '🦁', 2], ['avion', '✈️', 2], ['camion', '🚚', 2], ['citron', '🍋', 2], ['ballon', '🎈', 2],
  ['bonbon', '🍬', 2], ['savon', '🧼', 2], ['melon', '🍈', 2], ['cochon', '🐷', 2], ['mouton', '🐑', 2],
  ['poisson', '🐟', 2], ['poire', '🍐', 2], ['fraise', '🍓', 2], ['chaise', '🪑', 2], ['frites', '🍟', 2],
  ['étoile', '⭐', 2], ['oiseau', '🐦', 2], ['fusée', '🚀', 2], ['fleur', '🌸', 2], ['feu', '🔥', 2],
  ['dent', '🦷', 2], ['gant', '🧤', 2], ['serpent', '🐍', 2], ['flamant', '🦩', 2], ['dauphin', '🐬', 2],
  ['requin', '🦈', 2], ['renard', '🦊', 2], ['canard', '🦆', 2], ['deux', '2️⃣', 2], ['trois', '3️⃣', 2],
  ['neuf', '9️⃣', 2], ['maison', '🏠', 2], ['soleil', '☀️', 2], ['montagne', '⛰️', 2], ['vache', '🐄', 2],
  ['ver', '🪱', 2], ['nez', '👃', 2], ['pied', '🦶', 2], ['robot', '🤖', 2], ['rose', '🌹', 2],
  ['lunettes', '👓', 2], ['baleine', '🐳', 2], ['chèvre', '🐐', 2], ['crayon', '✏️', 2], ['tracteur', '🚜', 2],
  ['cerise', '🍒', 2], ['singe', '🐵', 2], ['orange', '🍊', 2], ['lit', '🛏️', 2], ['tente', '⛺', 2],
  ['cloche', '🔔', 2], ['sucette', '🍭', 2], ['ampoule', '💡', 2], ['balance', '⚖️', 2], ['coq', '🐓', 2],
  ['dragon', '🐉', 2], ['panda', '🐼', 2],
  // Niveau 3 : mots irréguliers ou longs.
  ['femme', '👩', 3], ['homme', '👨', 3], ['six', '6️⃣', 3], ['sept', '7️⃣', 3], ['dix', '🔟', 3],
  ['cinq', '5️⃣', 3], ['huit', '8️⃣', 3], ['oignon', '🧅', 3], ['champignon', '🍄', 3], ['œil', '👁️', 3],
  ['œuf', '🥚', 3], ['cœur', '❤️', 3], ['yeux', '👀', 3], ['écureuil', '🐿️', 3], ['feuille', '🍁', 3],
  ['clown', '🤡', 3], ['pizza', '🍕', 3], ['tennis', '🎾', 3], ['maïs', '🌽', 3], ['paon', '🦚', 3],
  ['poing', '👊', 3], ['wagon', '🚃', 3], ['ours', '🐻', 3], ['os', '🦴', 3], ['escargot', '🐌', 3],
  ['hérisson', '🦔', 3], ['hibou', '🦉', 3], ['hélicoptère', '🚁', 3], ['hippopotame', '🦛', 3],
  ['rhinocéros', '🦏', 3], ['chaussette', '🧦', 3], ['trottinette', '🛴', 3], ['parapluie', '☂️', 3],
  ['parachute', '🪂', 3], ['papillon', '🦋', 3], ['ordinateur', '💻', 3], ['ambulance', '🚑', 3],
  ['crocodile', '🐊', 3], ['coccinelle', '🐞', 3], ['grenouille', '🐸', 3], ['citrouille', '🎃', 3],
  ['gorille', '🦍', 3], ['kangourou', '🦘', 3], ['abeille', '🐝', 3], ['oreille', '👂', 3],
  ['éléphant', '🐘', 3], ['cygne', '🦢', 3], ['araignée', '🕷️', 3], ['perroquet', '🦜', 3],
];

/** Familles de mots proches (attaque, rime, lettres confusables) : 3 ou 4 mots. */
export const FAMILIES: readonly (readonly string[])[] = [
  // Surtout pour le niveau 1.
  ['lune', 'plume', 'lunettes'],
  ['moto', 'mouton', 'robot'],
  ['vélo', 'vache', 'ver'],
  ['dé', 'clé', 'nez', 'pied'],
  ['bébé', 'dé', 'nez'],
  ['robe', 'rose', 'robot'],
  ['lama', 'panda', 'koala'],
  ['tomate', 'tortue', 'tulipe'],
  ['tigre', 'tulipe', 'tortue'],
  ['olive', 'livre', 'lit'],
  ['livre', 'lit', 'lion'],
  ['salade', 'malade', 'sac'],
  ['sac', 'sapin', 'salade', 'savon'],
  ['banane', 'cabane', 'baleine'],
  ['cabane', 'canapé', 'cactus'],
  ['café', 'canapé', 'clé'],
  ['zèbre', 'chèvre', 'arbre'],
  ['crabe', 'cravate', 'crayon', 'crocodile'],
  ['cactus', 'castor', 'carotte', 'canard'],
  ['règle', 'renard', 'requin'],
  ['radio', 'piano', 'moto', 'vélo'],
  ['pomme', 'poire', 'poule'],
  // Surtout pour le niveau 2.
  ['bouche', 'douche', 'mouche'],
  ['pain', 'bain', 'main', 'train'],
  ['lapin', 'sapin', 'raisin', 'poussin'],
  ['bateau', 'gâteau', 'château'],
  ['chapeau', 'château', 'chat'],
  ['marteau', 'manteau', 'couteau'],
  ['cadeau', 'gâteau', 'bateau'],
  ['loup', 'loupe', 'poule'],
  ['chat', 'rat', 'chien'],
  ['lion', 'avion', 'camion', 'citron'],
  ['ballon', 'bonbon', 'savon', 'melon'],
  ['mouton', 'melon', 'moto'],
  ['cochon', 'mouton', 'poisson'],
  ['poisson', 'poussin', 'poire'],
  ['fraise', 'chaise', 'frites'],
  ['étoile', 'poire', 'oiseau'],
  ['fusée', 'fleur', 'feu'],
  ['dent', 'gant', 'dé'],
  ['serpent', 'éléphant', 'flamant'],
  ['dauphin', 'requin', 'lapin'],
  ['canard', 'renard', 'castor'],
  ['maison', 'poisson', 'savon'],
  ['fleur', 'tracteur', 'ordinateur'],
  ['soleil', 'abeille', 'oreille'],
  ['deux', 'feu', 'yeux'],
  ['huit', 'neuf', 'deux', 'trois'],
  ['singe', 'cygne', 'cerise'],
  ['montagne', 'araignée', 'champignon'],
  ['tennis', 'tente', 'tortue'],
  ['cloche', 'clown', 'clé'],
  ['sucette', 'chaussette', 'trottinette'],
  ['ampoule', 'ambulance', 'balance'],
  ['coq', 'cochon', 'coccinelle'],
  ['dragon', 'wagon', 'savon'],
  ['orange', 'ours', 'os'],
  // Surtout pour le niveau 3.
  ['six', 'sept', 'dix', 'cinq'],
  ['femme', 'homme', 'pomme'],
  ['oignon', 'champignon', 'citron'],
  ['œil', 'œuf', 'cœur'],
  ['écureuil', 'feuille', 'œil'],
  ['pizza', 'pied', 'piano'],
  ['maïs', 'maison', 'main'],
  ['paon', 'pain', 'poing'],
  ['escargot', 'carotte', 'canard'],
  ['hérisson', 'hibou', 'hélicoptère'],
  ['hérisson', 'poisson', 'poussin'],
  ['hippopotame', 'hélicoptère', 'hibou'],
  ['rhinocéros', 'renard', 'requin'],
  ['parapluie', 'parachute', 'papillon'],
  ['grenouille', 'citrouille', 'gorille'],
  ['kangourou', 'hibou', 'loup'],
  ['perroquet', 'paon', 'poussin'],
];

/** Pistes de lecture pour les mots irréguliers (lues après une erreur). */
export const TIPS: Record<string, string> = {
  femme: 'Dans « femme », le e se lit comme le a de papa.',
  homme: 'Dans « homme », le h ne se lit pas.',
  six: 'Dans « six », le x se lit comme le s de sac.',
  dix: 'Dans « dix », le x se lit comme le s de sac.',
  sept: 'Dans « sept », le p ne se lit pas.',
  cinq: 'Dans « cinq », on entend le q à la fin, comme dans coq.',
  huit: 'Dans « huit », le h ne se lit pas.',
  oignon: 'Dans « oignon », o et i se lisent comme le o de moto.',
  œil: 'Le o et le e collés se lisent comme le eu de feu.',
  œuf: 'Le o et le e collés se lisent comme le eu de feu.',
  cœur: 'Le o et le e collés se lisent comme le eu de feu.',
  yeux: 'Le mot « yeux » commence comme « yaourt ».',
  clown: '« Clown » vient de l’anglais : o et w se lisent comme le ou de loup.',
  tennis: 'Dans « tennis », e et n ne font pas le son en de tente.',
  maïs: 'Les deux points sur le i séparent le a et le i : ma, ïs.',
  paon: 'Dans « paon », on n’entend pas le o : on lit comme le an de maman.',
  wagon: 'Dans « wagon », le w se lit comme le v de vélo.',
  ours: 'Dans « ours », on entend le s à la fin.',
  os: 'Dans « os », on entend le s à la fin.',
  escargot: 'Dans « escargot », le t final ne se lit pas.',
  hérisson: 'Dans « hérisson », le h ne se lit pas.',
  hibou: 'Dans « hibou », le h ne se lit pas.',
  hélicoptère: 'Dans « hélicoptère », le h ne se lit pas.',
  hippopotame: 'Dans « hippopotame », le h ne se lit pas.',
  rhinocéros: 'Dans « rhinocéros », le h ne se lit pas et on entend le s à la fin.',
  cygne: 'Dans « cygne », le y se lit comme un i, et g n comme dans montagne.',
  coccinelle: 'Dans « coccinelle », le premier c se lit comme dans coq, le second comme dans cerise.',
};

export const FLASH_MS = { 1: 1500, 2: 900, 3: 500 } as const;

const BY_WORD = new Map(WORDS.map((w) => [w[0], w]));

export const game: QuizGame = {
  title: 'Lecture flash',
  instructions: 'Un mot va apparaître très vite. Lis-le bien, puis touche l’image qui correspond au mot.',
  levels: [
    { label: 'Mots simples', description: 'lune, moto, tomate… (1,5 seconde)' },
    { label: 'Sons complexes', description: 'ou, on, an, oi, ch, eau… (0,9 seconde)' },
    { label: 'Mots pièges', description: 'femme, sept, oignon, mots longs (0,5 seconde)' },
  ],
  makeItem(level, rng, recent) {
    const targets = WORDS.filter((w) => w[2] === level);
    let target = pick(rng, targets);
    for (let i = 0; i < 8 && recent.includes(target[0]); i++) target = pick(rng, targets);
    const family = pick(rng, FAMILIES.filter((f) => f.includes(target[0])));
    const others = shuffle(rng, family.filter((w) => w !== target[0])).slice(0, 3);
    const tip = TIPS[target[0]];
    return {
      key: target[0],
      prompt: 'Lis le mot, puis touche la bonne image.',
      say: 'Lis le mot, puis touche la bonne image.',
      stimulus: { text: target[0], flashMs: FLASH_MS[level] },
      choices: [
        { label: '', emoji: target[1], correct: true },
        ...others.map((w) => ({ label: '', emoji: BY_WORD.get(w)![1], correct: false })),
      ],
      explain: `Le mot écrit était « ${target[0]} ».${tip ? ` ${tip}` : ''}`.replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»'),
    };
  },
};

export default quizGame(game);
