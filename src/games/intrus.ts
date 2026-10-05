/**
 * L'intrus — lexique et sémantique (catégorisation).
 * Quatre mots-images : trois d'une même catégorie, un intrus.
 * Niveau 1 : catégories très éloignées (animaux / véhicules).
 * Niveau 2 : catégories proches (fruits / légumes, animaux de la ferme / sauvages).
 * Niveau 3 : mots écrits seuls, catégories proches.
 */
import { pick, shuffle } from '../core/random';
import { quizGame } from '../portal/quiz';

type Word = readonly [word: string, emoji: string];

interface Category {
  name: string;
  /** Article + nom pour l'explication : « des animaux de la ferme ». */
  phrase: string;
  words: readonly Word[];
}

export const CATEGORIES: Record<string, Category> = {
  animaux: { name: 'animaux', phrase: 'des animaux', words: [['chat', '🐱'], ['chien', '🐶'], ['lapin', '🐰'], ['cheval', '🐴'], ['poisson', '🐟'], ['oiseau', '🐦'], ['souris', '🐭']] },
  vehicules: { name: 'véhicules', phrase: 'des véhicules', words: [['voiture', '🚗'], ['bus', '🚌'], ['vélo', '🚲'], ['avion', '✈️'], ['bateau', '⛵'], ['train', '🚆'], ['camion', '🚚']] },
  vetements: { name: 'vêtements', phrase: 'des vêtements', words: [['chaussette', '🧦'], ['pantalon', '👖'], ['robe', '👗'], ['manteau', '🧥'], ['chapeau', '👒'], ['tee-shirt', '👕']] },
  fruits: { name: 'fruits', phrase: 'des fruits', words: [['pomme', '🍎'], ['banane', '🍌'], ['fraise', '🍓'], ['cerise', '🍒'], ['poire', '🍐'], ['raisin', '🍇'], ['orange', '🍊'], ['citron', '🍋']] },
  legumes: { name: 'légumes', phrase: 'des légumes', words: [['carotte', '🥕'], ['brocoli', '🥦'], ['poivron', '🫑'], ['maïs', '🌽'], ['concombre', '🥒'], ['aubergine', '🍆'], ['pomme de terre', '🥔']] },
  ferme: { name: 'animaux de la ferme', phrase: 'des animaux de la ferme', words: [['vache', '🐮'], ['cochon', '🐷'], ['mouton', '🐑'], ['poule', '🐔'], ['chèvre', '🐐'], ['canard', '🦆']] },
  sauvages: { name: 'animaux sauvages', phrase: 'des animaux sauvages', words: [['lion', '🦁'], ['tigre', '🐯'], ['éléphant', '🐘'], ['girafe', '🦒'], ['zèbre', '🦓'], ['singe', '🐵'], ['crocodile', '🐊']] },
  instruments: { name: 'instruments de musique', phrase: 'des instruments de musique', words: [['guitare', '🎸'], ['tambour', '🥁'], ['trompette', '🎺'], ['violon', '🎻'], ['piano', '🎹'], ['saxophone', '🎷']] },
  sports: { name: 'sports', phrase: 'des sports', words: [['football', '⚽'], ['basket', '🏀'], ['tennis', '🎾'], ['ski', '⛷️'], ['natation', '🏊'], ['vélo', '🚴']] },
  outils: { name: 'outils', phrase: 'des outils', words: [['marteau', '🔨'], ['tournevis', '🪛'], ['scie', '🪚'], ['clé', '🔧'], ['hache', '🪓']] },
  meteo: { name: 'météo', phrase: 'des mots du temps qu’il fait', words: [['soleil', '☀️'], ['pluie', '🌧️'], ['neige', '❄️'], ['nuage', '☁️'], ['orage', '⛈️'], ['arc-en-ciel', '🌈']] },
  mer: { name: 'animaux de la mer', phrase: 'des animaux de la mer', words: [['baleine', '🐳'], ['dauphin', '🐬'], ['pieuvre', '🐙'], ['crabe', '🦀'], ['requin', '🦈'], ['méduse', '🪼']] },
  insectes: { name: 'petites bêtes', phrase: 'des petites bêtes', words: [['abeille', '🐝'], ['fourmi', '🐜'], ['coccinelle', '🐞'], ['papillon', '🦋'], ['escargot', '🐌'], ['araignée', '🕷️']] },
};

/** Paires de catégories éloignées (niveau 1) et proches (niveaux 2–3). */
const FAR: [string, string][] = [
  ['animaux', 'vehicules'], ['fruits', 'vehicules'], ['vetements', 'animaux'], ['instruments', 'fruits'],
  ['meteo', 'animaux'], ['outils', 'fruits'], ['vehicules', 'vetements'], ['sports', 'legumes'],
];
const NEAR: [string, string][] = [
  ['fruits', 'legumes'], ['legumes', 'fruits'], ['ferme', 'sauvages'], ['sauvages', 'ferme'],
  ['mer', 'insectes'], ['insectes', 'mer'], ['sports', 'instruments'], ['outils', 'instruments'],
];

export default quizGame({
  title: 'L’intrus',
  instructions: 'Trois images vont ensemble. Une n’est pas de la même famille : trouve l’intrus !',
  levels: [
    { label: 'Familles très différentes', description: 'animaux, véhicules, vêtements…' },
    { label: 'Familles proches', description: 'fruits ou légumes, ferme ou savane…' },
    { label: 'Mots écrits', description: 'familles proches, sans images' },
  ],
  makeItem(level, rng, recent) {
    const pairs = level === 1 ? FAR : NEAR;
    let pair = pick(rng, pairs);
    for (let i = 0; i < 5 && recent.slice(-3).some((k) => k.startsWith(`${pair[0]}>${pair[1]}`)); i++) pair = pick(rng, pairs);
    const [main, odd] = [CATEGORIES[pair[0]], CATEGORIES[pair[1]]];
    const same = shuffle(rng, main.words).slice(0, 3);
    const intrus = pick(rng, odd.words.filter(([w]) => !main.words.some(([m]) => m === w)));
    const withEmoji = level < 3;
    return {
      key: `${pair[0]}>${pair[1]}:${intrus[0]}`,
      prompt: 'Quel est l’intrus ?',
      say: `Quel est l’intrus ? ${[...same, intrus].map(([w]) => w).sort().join(', ')}.`,
      choices: [
        ...same.map(([w, e]) => ({ label: w, emoji: withEmoji ? e : undefined, correct: false })),
        { label: intrus[0], emoji: withEmoji ? intrus[1] : undefined, correct: true },
      ],
      explain: `${capitalize(same.map(([w]) => w).join(', '))} : ce sont ${main.phrase}. « ${intrus[0]} », non !`,
    };
  },
});

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
