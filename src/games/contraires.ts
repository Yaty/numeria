/**
 * Contraires et synonymes — lexique et sémantique (relations de sens).
 * Un mot est montré et lu ; l’enfant choisit son contraire ou un mot de même sens.
 *
 * Niveau 1 : contraires d’adjectifs concrets (chaud / froid, plein / vide…),
 *            3 choix, avec images quand le mot s’illustre clairement.
 * Niveau 2 : contraires de verbes, d’adverbes et contraires par préfixe
 *            (monter / descendre, coller / décoller, possible / impossible),
 *            mêlés à un tiers de synonymes simples (vélo / bicyclette) ; 4 choix.
 * Niveau 3 : synonymes et mots proches plus nuancés (content / joyeux,
 *            grand / immense, construire / bâtir) ; 4 choix.
 *
 * Distracteurs : même nature de mot, d’un autre champ sémantique (le « champ »
 * `dim` regroupe les mots qu’un enfant pourrait défendre comme bonne réponse :
 * jamais proposés comme distracteurs l’un de l’autre). Un distracteur « piège »
 * est ajouté quand il existe : le synonyme du mot quand on cherche le contraire,
 * le contraire quand on cherche le synonyme.
 */
import { pick, shuffle } from '../core/random';
import { quizGame, type QuizGame } from '../portal/quiz';

type Pos = 'adj' | 'verbe' | 'adv' | 'nom';
type Level = 1 | 2 | 3;

export interface Pair {
  a: string;
  b: string;
  /** Champ sémantique : deux mots du même champ ne sont jamais distracteurs l’un de l’autre. */
  dim: string;
  pos: Pos;
  level: Level;
}

const P = (level: Level, pos: Pos, dim: string, list: [string, string][]): Pair[] => list.map(([a, b]) => ({ a, b, dim, pos, level }));

export const ANTONYMS: Pair[] = [
  // Niveau 1 : adjectifs concrets.
  ...P(1, 'adj', 'taille', [['grand', 'petit'], ['long', 'court'], ['haut', 'bas'], ['jeune', 'vieux']]),
  ...P(1, 'adj', 'température', [['chaud', 'froid']]),
  ...P(1, 'adj', 'humeur', [['content', 'triste']]),
  ...P(1, 'adj', 'lumière', [['ouvert', 'fermé'], ['allumé', 'éteint'], ['clair', 'sombre']]),
  ...P(1, 'adj', 'vitesse', [['lent', 'rapide']]),
  ...P(1, 'adj', 'vérité', [['vrai', 'faux']]),
  ...P(1, 'adj', 'posture', [['debout', 'couché'], ['endormi', 'réveillé']]),
  ...P(1, 'adj', 'remplissage', [['plein', 'vide']]),
  ...P(1, 'adj', 'propreté', [['propre', 'sale']]),
  ...P(1, 'adj', 'humidité', [['mouillé', 'sec']]),
  ...P(1, 'adj', 'texture', [['dur', 'mou'], ['cru', 'cuit']]),
  ...P(1, 'adj', 'force', [['lourd', 'léger'], ['fort', 'faible']]),
  ...P(1, 'adj', 'gentillesse', [['gentil', 'méchant']]),

  // Niveau 2 : verbes.
  ...P(2, 'verbe', 'monter', [['monter', 'descendre']]),
  ...P(2, 'verbe', 'entrer', [['entrer', 'sortir'], ['arriver', 'partir']]),
  ...P(2, 'verbe', 'ouvrir', [['ouvrir', 'fermer'], ['allumer', 'éteindre']]),
  ...P(2, 'verbe', 'gagner', [['gagner', 'perdre']]),
  ...P(2, 'verbe', 'acheter', [['acheter', 'vendre']]),
  ...P(2, 'verbe', 'prendre', [['donner', 'prendre'], ['attraper', 'lâcher']]),
  ...P(2, 'verbe', 'rire', [['rire', 'pleurer']]),
  ...P(2, 'verbe', 'début', [['commencer', 'finir']]),
  ...P(2, 'verbe', 'remplir', [['remplir', 'vider'], ['ajouter', 'enlever']]),
  ...P(2, 'verbe', 'pousser', [['pousser', 'tirer']]),
  ...P(2, 'verbe', 'sommeil', [['s’endormir', 'se réveiller'], ['se lever', 's’asseoir']]),
  ...P(2, 'verbe', 'aimer', [['aimer', 'détester']]),
  ...P(2, 'verbe', 'accepter', [['accepter', 'refuser']]),
  ...P(2, 'verbe', 'avancer', [['avancer', 'reculer']]),
  ...P(2, 'verbe', 'cacher', [['cacher', 'montrer'], ['apparaître', 'disparaître']]),
  ...P(2, 'verbe', 'voix', [['parler', 'se taire'], ['chuchoter', 'crier']]),
  ...P(2, 'verbe', 'fixer', [['coller', 'décoller'], ['accrocher', 'décrocher'], ['brancher', 'débrancher'], ['visser', 'dévisser']]),
  ...P(2, 'verbe', 'plier', [['plier', 'déplier']]),
  ...P(2, 'verbe', 'habiller', [['habiller', 'déshabiller']]),
  ...P(2, 'verbe', 'emballer', [['emballer', 'déballer']]),
  ...P(2, 'verbe', 'gonfler', [['gonfler', 'dégonfler']]),
  ...P(2, 'verbe', 'charger', [['charger', 'décharger']]),
  ...P(2, 'verbe', 'obéir', [['obéir', 'désobéir']]),
  // Niveau 2 : adverbes et prépositions.
  ...P(2, 'adv', 'position', [['devant', 'derrière'], ['avant', 'après'], ['tôt', 'tard'], ['hier', 'demain']]),
  ...P(2, 'adv', 'dessus', [['dessus', 'dessous']]),
  ...P(2, 'adv', 'dedans', [['dedans', 'dehors']]),
  ...P(2, 'adv', 'distance', [['loin', 'près']]),
  ...P(2, 'adv', 'quantité', [['toujours', 'jamais'], ['beaucoup', 'peu']]),
  ...P(2, 'adv', 'vitesse', [['vite', 'lentement']]),
  ...P(2, 'adv', 'bien', [['bien', 'mal']]),
  // Niveau 2 : adjectifs, dont contraires par préfixe.
  ...P(2, 'adj', 'difficulté', [['possible', 'impossible'], ['facile', 'difficile']]),
  ...P(2, 'adj', 'patience', [['patient', 'impatient']]),
  ...P(2, 'adj', 'gentillesse', [['poli', 'impoli'], ['agréable', 'désagréable']]),
  ...P(2, 'adj', 'justice', [['juste', 'injuste'], ['honnête', 'malhonnête']]),
  ...P(2, 'adj', 'connu', [['connu', 'inconnu']]),
  ...P(2, 'adj', 'humeur', [['heureux', 'malheureux'], ['riche', 'pauvre']]),
  ...P(2, 'adj', 'prudence', [['prudent', 'imprudent']]),
  ...P(2, 'adj', 'visible', [['visible', 'invisible']]),
  ...P(2, 'adj', 'utile', [['utile', 'inutile']]),
  ...P(2, 'adj', 'adresse', [['adroit', 'maladroit']]),
  ...P(2, 'adj', 'régulier', [['régulier', 'irrégulier']]),
  ...P(2, 'adj', 'largeur', [['large', 'étroit']]),
  ...P(2, 'adj', 'toucher', [['lisse', 'rugueux']]),
  ...P(2, 'adj', 'ordre', [['premier', 'dernier']]),
  ...P(2, 'adj', 'bruit', [['bruyant', 'silencieux']]),
  ...P(2, 'adj', 'solide', [['solide', 'fragile']]),
];

export const SYNONYMS: Pair[] = [
  // Niveau 2 : synonymes simples du quotidien.
  ...P(2, 'nom', 'voiture', [['voiture', 'auto']]),
  ...P(2, 'nom', 'vélo', [['vélo', 'bicyclette']]),
  ...P(2, 'nom', 'médecin', [['docteur', 'médecin']]),
  ...P(2, 'nom', 'ami', [['copain', 'ami']]),
  ...P(2, 'nom', 'habit', [['habit', 'vêtement']]),
  ...P(2, 'verbe', 'début', [['finir', 'terminer']]),
  ...P(2, 'verbe', 'prendre', [['donner', 'offrir']]),
  ...P(2, 'verbe', 'rire', [['rire', 'rigoler']]),
  ...P(2, 'adj', 'beauté', [['beau', 'joli']]),

  // Niveau 3 : adjectifs.
  ...P(3, 'adj', 'humeur', [['content', 'joyeux'], ['triste', 'malheureux']]),
  ...P(3, 'adj', 'peur', [['peureux', 'craintif']]),
  ...P(3, 'adj', 'fatigue', [['fatigué', 'épuisé']]),
  ...P(3, 'adj', 'taille', [['grand', 'immense'], ['petit', 'minuscule']]),
  ...P(3, 'adj', 'calme', [['calme', 'tranquille']]),
  ...P(3, 'adj', 'drôle', [['drôle', 'amusant'], ['bizarre', 'étrange']]),
  ...P(3, 'adj', 'malin', [['malin', 'rusé']]),
  ...P(3, 'adj', 'gentillesse', [['gentil', 'aimable']]),
  ...P(3, 'adj', 'difficulté', [['difficile', 'compliqué'], ['facile', 'simple']]),
  ...P(3, 'adj', 'connu', [['célèbre', 'connu']]),
  ...P(3, 'adj', 'colère', [['fâché', 'furieux']]),
  // Niveau 3 : verbes.
  ...P(3, 'verbe', 'début', [['commencer', 'débuter']]),
  ...P(3, 'verbe', 'vue', [['regarder', 'observer']]),
  ...P(3, 'verbe', 'voix', [['crier', 'hurler'], ['bavarder', 'papoter']]),
  ...P(3, 'verbe', 'chute', [['tomber', 'chuter']]),
  ...P(3, 'verbe', 'construire', [['construire', 'bâtir']]),
  ...P(3, 'verbe', 'casser', [['casser', 'briser']]),
  ...P(3, 'verbe', 'manger', [['manger', 'dévorer']]),
  ...P(3, 'verbe', 'penser', [['penser', 'réfléchir']]),
  ...P(3, 'verbe', 'mémoire', [['se souvenir', 'se rappeler']]),
  ...P(3, 'verbe', 'rire', [['pleurer', 'sangloter']]),
  ...P(3, 'verbe', 'vitesse', [['se dépêcher', 'se presser']]),
  ...P(3, 'verbe', 'lancer', [['jeter', 'lancer']]),
  ...P(3, 'verbe', 'habiter', [['habiter', 'vivre']]),
  ...P(3, 'verbe', 'cacher', [['cacher', 'dissimuler']]),
  // Niveau 3 : noms.
  ...P(3, 'nom', 'bateau', [['bateau', 'navire']]),
  ...P(3, 'nom', 'peur', [['peur', 'frayeur']]),
  ...P(3, 'nom', 'visage', [['visage', 'figure']]),
  ...P(3, 'nom', 'erreur', [['erreur', 'faute']]),
  ...P(3, 'nom', 'début', [['début', 'commencement']]),
  // Niveau 3 : adverbes.
  ...P(3, 'adv', 'vitesse', [['vite', 'rapidement'], ['tout de suite', 'immédiatement']]),
  ...P(3, 'adv', 'quantité', [['souvent', 'fréquemment']]),
  ...P(3, 'adv', 'aussi', [['aussi', 'également']]),
];

/** Images : seulement quand l’émoji illustre le mot sans hésitation. */
export const EMOJI: Record<string, string> = {
  chaud: '🥵', froid: '🥶', content: '😀', triste: '😢', ouvert: '🔓', fermé: '🔒',
  jeune: '👶', vieux: '👴', lent: '🐌', rapide: '🏎️', vrai: '✅', faux: '❌', haut: '⬆️', bas: '⬇️',
  voiture: '🚗', auto: '🚗', vélo: '🚲', bicyclette: '🚲', bateau: '⛵', navire: '🚢',
};

interface Info {
  dim: string;
  pos: Pos;
}

/** Champ et nature de chaque mot (identiques dans toutes les paires, vérifié par les tests). */
export const INFO: Record<string, Info> = {};
for (const p of [...ANTONYMS, ...SYNONYMS]) for (const w of [p.a, p.b]) INFO[w] = { dim: p.dim, pos: p.pos };

/** Mots liés à `w` par une relation, jusqu’au niveau donné. */
function related(list: Pair[], w: string, level: Level): string[] {
  return list.filter((p) => p.level <= level && (p.a === w || p.b === w)).map((p) => (p.a === w ? p.b : p.a));
}

/** Mots qui commencent comme `base` précédé d’un préfixe de sens contraire. */
const PREFIXES = ['im', 'in', 'il', 'ir', 'mal', 'dés', 'dé', 'dis'];
export function prefixed(w1: string, w2: string): { base: string; derived: string } | null {
  for (const [base, derived] of [[w1, w2], [w2, w1]])
    if (PREFIXES.some((p) => derived === p + base)) return { base, derived };
  return null;
}

const q = (w: string) => `«\u00a0${w}\u00a0»`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Mot cité en début de phrase : « Déplier ». */
const qCap = (w: string) => q(cap(w));

function listForSpeech(words: string[]): string {
  const sorted = [...words].sort((x, y) => x.localeCompare(y, 'fr'));
  return `${sorted.slice(0, -1).join(', ')} ou ${sorted[sorted.length - 1]}`;
}

export const game: QuizGame = {
  title: 'Contraires et synonymes',
  instructions: 'Écoute le mot. Trouve son contraire, ou un mot qui veut dire presque la même chose !',
  levels: [
    { label: 'Contraires en images', description: 'chaud ou froid, plein ou vide…' },
    { label: 'Verbes et petits mots', description: 'monter ou descendre, possible ou impossible, et quelques synonymes' },
    { label: 'Mots de même sens', description: 'content et joyeux, grand et immense…' },
  ],
  makeItem(level, rng, recent) {
    const kind: 'ant' | 'syn' = level === 1 ? 'ant' : level === 3 ? 'syn' : rng() < 2 / 3 ? 'ant' : 'syn';
    const pairs = (kind === 'ant' ? ANTONYMS : SYNONYMS).filter((p) => p.level === level);
    let w = '';
    let answer = '';
    for (let i = 0; i < 10; i++) {
      const p = pick(rng, pairs);
      [w, answer] = rng() < 0.5 ? [p.a, p.b] : [p.b, p.a];
      if (!recent.slice(-8).some((k) => k.includes(`:${w}>`) || k.includes(`>${w}`))) break;
    }
    const { dim, pos } = INFO[w];
    const nChoices = level === 1 ? 3 : 4;

    // Distracteur « piège » : l’autre relation (synonyme si on cherche le contraire, et inversement).
    const traps = related(kind === 'ant' ? SYNONYMS : ANTONYMS, w, level).filter((x) => x !== answer);
    const trap = traps.length ? pick(rng, traps) : null;

    const emojiMode = level === 1 && !!EMOJI[w] && !!EMOJI[answer];
    const levelWords = [...ANTONYMS, ...SYNONYMS].filter((p) => p.level === level).flatMap((p) => [p.a, p.b]);
    const candidates = (words: string[]) =>
      [...new Set(words)].filter((x) => INFO[x].pos === pos && INFO[x].dim !== dim && (!emojiMode || EMOJI[x]));
    let pool = candidates(levelWords);
    const needed = nChoices - 1 - (trap ? 1 : 0);
    const dimCount = (xs: string[]) => new Set(xs.map((x) => INFO[x].dim)).size;
    if (dimCount(pool) < needed) pool = candidates(Object.keys(INFO).filter((x) => [...ANTONYMS, ...SYNONYMS].some((p) => p.level <= level && (p.a === x || p.b === x))));
    // Distracteurs de champs différents entre eux.
    const distractors: string[] = [];
    const usedDims = new Set<string>();
    for (const x of shuffle(rng, pool)) {
      if (distractors.length >= needed) break;
      if (usedDims.has(INFO[x].dim)) continue;
      usedDims.add(INFO[x].dim);
      distractors.push(x);
    }
    for (const x of shuffle(rng, pool)) if (distractors.length < needed && !distractors.includes(x)) distractors.push(x);
    const wrong = trap ? [trap, ...distractors] : distractors;

    const question = kind === 'ant' ? `Quel est le contraire du mot ${q(w)}\u00a0?` : `Quel mot veut dire presque la même chose que le mot ${q(w)}\u00a0?`;
    const spokenQuestion = kind === 'ant' ? `Quel est le contraire du mot ${w} ?` : `Quel mot veut dire presque la même chose que le mot ${w}\u00a0?`;

    let explain =
      kind === 'ant' ? `Le contraire du mot ${q(w)}, c’est ${q(answer)}.` : `${qCap(w)} et ${q(answer)} veulent dire presque la même chose.`;
    const pre = kind === 'ant' ? prefixed(w, answer) : null;
    if (pre) {
      explain +=
        pos === 'verbe'
          ? ` ${qCap(pre.derived)}, c’est faire l’inverse du verbe ${q(pre.base)} : le petit morceau au début change le sens.`
          : ` ${qCap(pre.derived)}, ça veut dire ${q(`pas ${pre.base}`)} : le petit morceau au début change le sens.`;
    }
    if (trap) explain += kind === 'ant' ? ` Attention : ${q(trap)} veut dire presque la même chose, ce n’est pas le contraire.` : ` Attention : ${q(trap)}, c’est le contraire !`;

    return {
      key: `${kind}:${w}>${answer}`,
      prompt: question,
      say: `Écoute : ${w}. ${spokenQuestion} Choisis : ${listForSpeech([answer, ...wrong])}.`,
      stimulus: { text: w, emoji: EMOJI[w] },
      choices: [
        { label: answer, emoji: emojiMode ? EMOJI[answer] : undefined, correct: true },
        ...wrong.map((x) => ({ label: x, emoji: emojiMode ? EMOJI[x] : undefined, correct: false })),
      ],
      explain,
    };
  },
};

export default quizGame(game);
