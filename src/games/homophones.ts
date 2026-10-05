/**
 * Les homophones — orthographe grammaticale.
 * Une phrase à trou, lue à voix haute comme une dictée : l'enfant choisit la bonne
 * orthographe parmi des mots qui se prononcent pareil. Après une erreur, l'explication
 * donne l'astuce de substitution (a → avait, est → était, on → il, son → mon…).
 *
 * Niveau 1 : a / à, et / est (verbes avoir et être au présent, 3e personne).
 * Niveau 2 : on / ont, son / sont, ou / où, ces / ses.
 * Niveau 3 : c'est / s'est / ces / ses, ce / se, leur / leurs, quel / quelle / qu'elle,
 *            mes / mais / met.
 *
 * Pour que l'écoute ne trahisse pas la réponse, le mot qui suit le trou ne commence pas
 * par une voyelle (ni un h muet) dans les séries où une liaison différerait
 * (on / ont, son / sont, et / est, ce / se, leur / leurs, mes / mais / met).
 */
import { pick } from '../core/random';
import { quizGame, type QuizGame } from '../portal/quiz';

export interface HSet {
  id: string;
  level: 1 | 2 | 3;
  options: readonly string[];
  /** Le mot suivant le trou peut-il commencer par une voyelle sans trahir la réponse ? */
  vowelOk: boolean;
  /** Phrases : la réponse est entre crochets. Une note facultative remplace l'astuce générale. */
  sentences: readonly (string | readonly [sentence: string, note: string])[];
}

export const SETS: readonly HSet[] = [
  {
    id: 'a', level: 1, options: ['a', 'à'], vowelOk: true,
    sentences: [
      'Le chat [a] faim.', 'Mon frère [a] un vélo rouge.', 'Léa [a] perdu sa chaussure.', 'Le chien [a] mangé tout son repas.',
      'Papa [a] fait une tarte aux pommes.', 'Il [a] froid sans son manteau.', 'Ma sœur [a] sept ans.', 'Le bébé [a] sommeil.',
      'Tom [a] gagné la course.', 'La maîtresse [a] lu une belle histoire.', 'Elle [a] un chaton tout blanc.', 'Mon ami [a] peur du noir.',
      'Je vais [à] l’école.', 'Nous jouons [à] cache-cache.', 'Il habite [à] Paris.', 'On mange [à] midi.',
      'Elle parle [à] sa maman.', 'Le gâteau [à] la fraise est délicieux.', 'Je donne un os [à] mon chien.', 'Il fait du vélo [à] la campagne.',
      'Nous partons [à] la mer.', 'J’ai mal [à] la tête.', 'Tu joues [à] la balle ?', 'C’est l’heure d’aller [à] la piscine.',
    ],
  },
  {
    id: 'et', level: 1, options: ['et', 'est'], vowelOk: false,
    sentences: [
      'Le ciel [est] bleu.', 'Ma maison [est] grande.', 'Le chat [est] sur le canapé.', 'Papa [est] parti au travail.',
      'La soupe [est] chaude.', 'Mon frère [est] malade.', 'Le gâteau [est] délicieux.', 'La porte [est] fermée.',
      'Il [est] tard.', 'Ma chambre [est] rangée.', 'La neige [est] froide.', 'Ce livre [est] drôle.',
      'J’ai un chat [et] deux poissons.', 'Il pleut [et] le vent souffle.', 'Je mange du pain [et] du fromage.', 'Léa [et] Tom jouent ensemble.',
      'Le drapeau est bleu, blanc [et] rouge.', 'Maman [et] papa sont partis.', 'Il a pris son sac [et] son manteau.', 'J’aime les fraises [et] les cerises.',
      'Le chat saute [et] court partout.', 'Elle chante [et] danse.', 'Prends ta gomme [et] ton crayon.', 'La poule [et] ses poussins picorent.',
    ],
  },
  {
    id: 'on', level: 2, options: ['on', 'ont'], vowelOk: false,
    sentences: [
      '[On] va au parc cet après-midi.', 'Demain, [on] part en vacances.', 'À la récréation, [on] joue au ballon.', 'Ce soir, [on] mange des crêpes.',
      'Quand il pleut, [on] reste à la maison.', 'Avec ma sœur, [on] fait un gâteau.',
      'Les enfants [ont] faim.', 'Mes parents [ont] deux voitures.', 'Ils [ont] trouvé un trésor.', 'Les oiseaux [ont] fait leur nid.',
      'Mes amis [ont] perdu leur ballon.', 'Les chats [ont] des moustaches.',
    ],
  },
  {
    id: 'son', level: 2, options: ['son', 'sont'], vowelOk: false,
    sentences: [
      'Le chien mange dans [son] bol.', 'Léo range [son] cartable.', 'Elle cherche [son] doudou.', 'Le roi porte [son] manteau rouge.',
      'Il fait [son] lit tout seul.', 'Papa lave [son] vélo.',
      'Les fleurs [sont] belles.', 'Mes amis [sont] dans la cour.', 'Les poules [sont] dans le poulailler.', 'Ils [sont] fatigués.',
      'Les pommes [sont] mûres.', 'Les vaches [sont] dans le pré.',
    ],
  },
  {
    id: 'ou', level: 2, options: ['ou', 'où'], vowelOk: true,
    sentences: [
      'Tu veux du lait [ou] du jus ?', 'On va au parc [ou] à la piscine ?', 'Veux-tu une pomme [ou] une poire ?', 'Je mets mes bottes [ou] mes baskets ?',
      'Il viendra lundi [ou] mardi.', 'Tu préfères le rouge [ou] le bleu ?',
      '[Où] est mon cartable ?', 'Je ne sais pas [où] est le chat.', 'La maison [où] j’habite est grande.', 'Dis-moi [où] tu vas.',
      '[Où] as-tu caché le trésor ?', 'C’est la ville [où] vit ma grand-mère.',
    ],
  },
  {
    id: 'ces', level: 2, options: ['ces', 'ses'], vowelOk: true,
    sentences: [
      'Regarde [ces] beaux nuages !', 'Qui a laissé [ces] chaussures-là ?', '[Ces] fleurs-là sont fanées.', 'J’aime bien [ces] dessins-là.',
      'Tu vois [ces] oiseaux là-haut ?', 'Combien coûtent [ces] bonbons ?',
      'Le chat lèche [ses] pattes.', 'Léa a mis [ses] bottes pour sortir.', 'Le garçon range [ses] jouets dans sa chambre.', 'Papa cherche [ses] lunettes.',
      'L’oiseau nourrit [ses] petits.', 'Mamie arrose [ses] fleurs.',
    ],
  },
  {
    id: 'cest', level: 3, options: ['c’est', 's’est', 'ces', 'ses'], vowelOk: true,
    sentences: [
      '[C’est] mon anniversaire demain.', 'Regarde, [c’est] un arc-en-ciel !', 'Je crois que [c’est] l’heure de partir.', '[C’est] Tom qui a gagné.',
      'Le chat [s’est] caché sous le lit.', 'Ma sœur [s’est] fait mal au genou.', 'Le bébé [s’est] endormi.', 'Il [s’est] lavé les mains.',
      'Regarde [ces] papillons-là !', 'Qui a dessiné [ces] bateaux-là ?',
      'Le lapin joue avec [ses] amis.', 'Tom a perdu [ses] gants.',
    ],
  },
  {
    id: 'ce', level: 3, options: ['ce', 'se'], vowelOk: false,
    sentences: [
      '[Ce] chien aboie toute la nuit.', 'J’adore [ce] dessin animé.', 'Qui a fait [ce] beau château de sable ?', '[Ce] soir, nous allons au cinéma.',
      'Regarde [ce] gros nuage noir.',
      'Le chat [se] lave avec sa langue.', 'Les enfants [se] cachent derrière l’arbre.', 'Il [se] brosse les dents.', 'Elle [se] regarde dans le miroir.',
      'Les oiseaux [se] posent sur le fil.',
    ],
  },
  {
    id: 'leur', level: 3, options: ['leur', 'leurs'], vowelOk: false,
    sentences: [
      ['Les enfants promènent [leur] chien.', 'Ils n’ont qu’un seul chien : on écrit « leur », sans s.'],
      ['Je [leur] donne des bonbons.', '« Leur » est devant un verbe, on pourrait dire « je lui donne » : il ne prend jamais de s.'],
      ['La maîtresse [leur] lit une histoire.', '« Leur » est devant un verbe, on pourrait dire « elle lui lit » : il ne prend jamais de s.'],
      ['Mes voisins ont repeint [leur] maison.', 'Ils n’ont qu’une seule maison : on écrit « leur », sans s.'],
      ['Papa [leur] prépare le goûter.', '« Leur » est devant un verbe, on pourrait dire « papa lui prépare » : il ne prend jamais de s.'],
      ['Les élèves rangent [leurs] cahiers.', '« Cahiers » est au pluriel : on écrit « leurs », avec un s.'],
      ['Les oiseaux protègent [leurs] petits.', '« Petits » est au pluriel : on écrit « leurs », avec un s.'],
      ['Mes cousins ont apporté [leurs] vélos.', '« Vélos » est au pluriel : on écrit « leurs », avec un s.'],
      ['Les filles mettent [leurs] bottes.', '« Bottes » est au pluriel : on écrit « leurs », avec un s.'],
      ['Les enfants cherchent [leurs] chaussures.', '« Chaussures » est au pluriel : on écrit « leurs », avec un s.'],
    ],
  },
  {
    id: 'quel', level: 3, options: ['quel', 'quelle', 'qu’elle'], vowelOk: true,
    sentences: [
      ['[Quel] âge as-tu ?', 'On dit « un âge » : c’est masculin, on écrit « quel ».'],
      ['[Quel] temps fait-il ?', 'On dit « le temps » : c’est masculin, on écrit « quel ».'],
      ['[Quel] beau dessin !', 'On dit « un dessin » : c’est masculin, on écrit « quel ».'],
      ['Tu prends [quel] bus ?', 'On dit « un bus » : c’est masculin, on écrit « quel ».'],
      ['[Quelle] heure est-il ?', 'On dit « une heure » : c’est féminin, on écrit « quelle ».'],
      ['[Quelle] belle journée !', 'On dit « une journée » : c’est féminin, on écrit « quelle ».'],
      ['Dans [quelle] classe es-tu ?', 'On dit « une classe » : c’est féminin, on écrit « quelle ».'],
      'Je crois [qu’elle] dort.', 'Maman dit [qu’elle] arrive bientôt.', 'Il faut [qu’elle] range sa chambre.', 'Ma sœur pense [qu’elle] a gagné.',
    ],
  },
  {
    id: 'mes', level: 3, options: ['mes', 'mais', 'met'], vowelOk: false,
    sentences: [
      'J’ai rangé [mes] crayons.', '[Mes] parents sont gentils.', 'Je cherche [mes] chaussons.',
      'Il fait beau [mais] froid.', 'Je voulais jouer dehors [mais] la pluie tombe.', 'Le chat est petit [mais] courageux.',
      'J’ai faim [mais] le repas n’est pas prêt.',
      'Papa [met] la table.', 'Elle [met] son manteau.', 'Le boulanger [met] le pain au four.', 'Il [met] du sucre dans son chocolat.',
    ],
  },
];

/** Mot de substitution : on remplace la réponse par lui dans la phrase pour vérifier. */
const SUBSTITUTE: Record<string, string> = {
  a: 'avait', est: 'était', ont: 'avaient', sont: 'étaient', on: 'il', son: 'mon', ou: 'ou bien',
  'c’est': 'cela est', 's’est': 's’était', 'qu’elle': 'qu’il', met: 'mettait', ce: 'un',
};

/** Astuce générale quand il n'y a pas de substitution simple. */
const RULE: Record<string, string> = {
  a: 'c’est le verbe avoir, on écrit « a » sans accent.',
  à: 'On ne peut pas dire « avait » à cet endroit : on écrit « à » avec un accent.',
  est: 'c’est le verbe être, on écrit « est ».',
  et: 'On peut dire « et puis » à cet endroit : on écrit « et ».',
  on: 'on écrit « on », sans t.',
  ont: 'c’est le verbe avoir, on écrit « ont ».',
  son: 'c’est à lui ou à elle, on écrit « son ».',
  sont: 'c’est le verbe être, on écrit « sont ».',
  ou: 'on écrit « ou » sans accent.',
  où: '« Où » parle d’un endroit : on écrit « où » avec un accent.',
  ces: 'On montre quelque chose, on pourrait dire « ceux-là » ou « celles-là » : on écrit « ces ».',
  ses: 'Ce sont les siens ou les siennes, à lui ou à elle : on écrit « ses ».',
  'c’est': 'on écrit « c’est ».',
  's’est': 'c’est un verbe avec « se », comme « je me suis » : on écrit « s’est ».',
  ce: '« ce » est devant un nom : on écrit « ce ».',
  se: '« Se » est devant un verbe, on pourrait dire « je me » : on écrit « se ».',
  quel: 'Le nom est masculin : on écrit « quel ».',
  quelle: 'Le nom est féminin : on écrit « quelle ».',
  'qu’elle': 'on écrit « qu’elle ».',
  mes: 'Ce sont les miens, à moi : on écrit « mes ».',
  mais: 'On pourrait dire « pourtant » : on écrit « mais ».',
  met: 'c’est le verbe mettre, on écrit « met ».',
};

export interface Entry {
  set: HSet;
  index: number;
  /** Phrase avec « _ » à la place du mot. */
  gapped: string;
  answer: string;
  note?: string;
}

/** Espace insécable avant ? ! : (typographie française). */
const typo = (s: string) => s.replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function parse(set: HSet, index: number): Entry {
  const raw = set.sentences[index];
  const [sentence, note] = typeof raw === 'string' ? [raw, undefined] : raw;
  const m = /\[([^\]]+)\]/.exec(sentence)!;
  return { set, index, gapped: sentence.replace(m[0], '_'), answer: m[1].toLowerCase(), note };
}

export const ENTRIES: readonly Entry[] = SETS.flatMap((set) => set.sentences.map((_, i) => parse(set, i)));

/** Remplit le trou avec un mot (majuscule en début de phrase). */
export function fill(gapped: string, word: string): string {
  return gapped.startsWith('_') ? capitalize(word) + gapped.slice(1) : gapped.replace('_', word);
}

export function explainFor(e: Entry): string {
  return typo(rawExplain(e));
}

function rawExplain(e: Entry): string {
  const head = `Il fallait écrire « ${e.answer} ».`;
  if (e.note) return `${head} ${e.note}`;
  const sub = SUBSTITUTE[e.answer];
  if (sub) return `${head} On peut dire « ${fill(e.gapped, sub)} » : ${RULE[e.answer]}`;
  return `${head} ${RULE[e.answer]}`;
}

export const game: QuizGame = {
  title: 'Les homophones',
  instructions: 'Écoute la phrase et choisis le mot bien écrit pour compléter le trou. Ces mots se prononcent pareil, mais ne s’écrivent pas pareil !',
  levels: [
    { label: 'a / à, et / est', description: 'les verbes avoir et être' },
    { label: 'on / ont, son / sont…', description: 'on, son, ou, ces' },
    { label: 'Les pièges', description: 'c’est / s’est, ce / se, leur, quel, mais' },
  ],
  makeItem(level, rng, recent) {
    const pool = ENTRIES.filter((e) => e.set.level === level);
    const keyOf = (e: Entry) => `${e.set.id}:${e.index}`;
    // Une série au hasard d'abord (équilibre entre séries), puis une phrase.
    const sets = SETS.filter((s) => s.level === level);
    let e = pick(rng, pool);
    for (let i = 0; i < 10; i++) {
      const set = pick(rng, sets);
      e = pick(rng, pool.filter((x) => x.set === set));
      if (!recent.includes(keyOf(e))) break;
    }
    const atStart = e.gapped.startsWith('_');
    const label = (w: string) => (atStart ? capitalize(w) : w);
    return {
      key: keyOf(e),
      prompt: 'Choisis le mot bien écrit.',
      say: `Complète la phrase. ${typo(fill(e.gapped, e.answer))}`,
      stimulus: { text: typo(e.gapped.replace('_', '……')) },
      choices: e.set.options.map((o) => ({ label: label(o), correct: o === e.answer })),
      keepOrder: true,
      explain: explainFor(e),
    };
  },
};

export default quizGame(game);
