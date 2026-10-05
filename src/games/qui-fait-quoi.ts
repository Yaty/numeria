/**
 * Qui fait quoi ? — compréhension morphosyntaxique (rôles thématiques).
 * Une phrase est affichée et lue ; l’enfant répond à une question « Qui… ? »
 * en touchant le bon personnage. Les phrases sont réversibles (les deux
 * animaux peuvent faire l’action) : seule la syntaxe permet de répondre.
 * La question porte tantôt sur celui qui fait l’action (agent), tantôt sur
 * celui qui la subit (patient).
 *
 * Niveau 1 : phrases actives simples, ordre canonique sujet-verbe-objet :
 *            « Le chien pousse le chat. Qui pousse ? »
 * Niveau 2 : ordre non canonique — passives (« Le chat est poussé par le
 *            chien. ») et clivées (« C’est le chat que le chien pousse. »).
 * Niveau 3 : relatives enchâssées (« Le lapin que la souris regarde rit. »),
 *            négation (« Ce n’est pas le chien qui pousse le chat, c’est la
 *            vache. ») et ordre temporel avec avant de / après (« Avant de
 *            dessiner, Léo lit. Que fait Léo en premier ? »).
 *
 * Les phrases sont fabriquées par un générateur ; les accords (participe passé
 * au féminin : « La vache est poussée par le chien », « Après s’être lavée,
 * Zoé… ») sont vérifiés par les tests.
 */
import { pick, shuffle } from '../core/random';
import { quizGame, type Choice, type QuizGame, type QuizItem } from '../portal/quiz';

type Gender = 'm' | 'f';

export interface Animal {
  noun: string;
  g: Gender;
  emoji: string;
}

export const ANIMALS: Animal[] = [
  { noun: 'chien', g: 'm', emoji: '🐶' },
  { noun: 'chat', g: 'm', emoji: '🐱' },
  { noun: 'lapin', g: 'm', emoji: '🐰' },
  { noun: 'cochon', g: 'm', emoji: '🐷' },
  { noun: 'singe', g: 'm', emoji: '🐵' },
  { noun: 'loup', g: 'm', emoji: '🐺' },
  { noun: 'renard', g: 'm', emoji: '🦊' },
  { noun: 'canard', g: 'm', emoji: '🦆' },
  { noun: 'lion', g: 'm', emoji: '🦁' },
  { noun: 'mouton', g: 'm', emoji: '🐑' },
  { noun: 'vache', g: 'f', emoji: '🐮' },
  { noun: 'souris', g: 'f', emoji: '🐭' },
  { noun: 'poule', g: 'f', emoji: '🐔' },
  { noun: 'grenouille', g: 'f', emoji: '🐸' },
  { noun: 'girafe', g: 'f', emoji: '🦒' },
  { noun: 'tortue', g: 'f', emoji: '🐢' },
];

export interface Verb {
  /** Présent, 3e personne du singulier. */
  pres: string;
  /** Participe passé au masculin singulier (le féminin ajoute un « e »). */
  pp: string;
}

/** Verbes d’action réversibles, qui se disent seuls dans « Qui pousse ? ». */
export const VERBS: Verb[] = [
  { pres: 'pousse', pp: 'poussé' },
  { pres: 'regarde', pp: 'regardé' },
  { pres: 'suit', pp: 'suivi' },
  { pres: 'chatouille', pp: 'chatouillé' },
  { pres: 'attrape', pp: 'attrapé' },
  { pres: 'lèche', pp: 'léché' },
  { pres: 'caresse', pp: 'caressé' },
  { pres: 'appelle', pp: 'appelé' },
  { pres: 'cherche', pp: 'cherché' },
  { pres: 'touche', pp: 'touché' },
  { pres: 'tire', pp: 'tiré' },
  { pres: 'embrasse', pp: 'embrassé' },
  { pres: 'écoute', pp: 'écouté' },
  { pres: 'attend', pp: 'attendu' },
  { pres: 'aide', pp: 'aidé' },
  { pres: 'salue', pp: 'salué' },
  { pres: 'soigne', pp: 'soigné' },
  { pres: 'gronde', pp: 'grondé' },
];

/** Verbes intransitifs de la principale (niveau 3), compatibles avec toutes les actions. */
export const INTRANSITIVES = ['rit', 'sourit', 'tombe', 'saute', 'crie'];

export interface Person {
  name: string;
  g: Gender;
  emoji: string;
}

export const PEOPLE: Person[] = [
  { name: 'Léo', g: 'm', emoji: '👦' },
  { name: 'Tom', g: 'm', emoji: '👦' },
  { name: 'Sami', g: 'm', emoji: '👦' },
  { name: 'Hugo', g: 'm', emoji: '👦' },
  { name: 'Zoé', g: 'f', emoji: '👧' },
  { name: 'Lina', g: 'f', emoji: '👧' },
  { name: 'Jade', g: 'f', emoji: '👧' },
  { name: 'Inès', g: 'f', emoji: '👧' },
];

export interface Activity {
  inf: string;
  pres: string;
  /** Infinitif passé, masculin puis féminin (accord avec « être »). */
  past: [string, string];
  emoji: string;
}

const avoir = (inf: string, pres: string, pp: string, emoji: string): Activity => ({ inf, pres, past: [`avoir ${pp}`, `avoir ${pp}`], emoji });

/** Activités neutres : aucun ordre n’est plus logique que l’autre, seule la syntaxe compte. */
export const ACTIVITIES: Activity[] = [
  avoir('lire', 'lit', 'lu', '📖'),
  avoir('dessiner', 'dessine', 'dessiné', '🖍️'),
  avoir('chanter', 'chante', 'chanté', '🎤'),
  avoir('jouer au ballon', 'joue au ballon', 'joué au ballon', '⚽'),
  avoir('goûter', 'goûte', 'goûté', '🍪'),
  avoir('faire du vélo', 'fait du vélo', 'fait du vélo', '🚲'),
  avoir('peindre', 'peint', 'peint', '🎨'),
  avoir('jouer du piano', 'joue du piano', 'joué du piano', '🎹'),
  avoir('faire un puzzle', 'fait un puzzle', 'fait un puzzle', '🧩'),
  avoir('regarder la télé', 'regarde la télé', 'regardé la télé', '📺'),
  { inf: 'se laver', pres: 'se lave', past: ['s’être lavé', 's’être lavée'], emoji: '🛁' },
  { inf: 'aller à la piscine', pres: 'va à la piscine', past: ['être allé à la piscine', 'être allée à la piscine'], emoji: '🏊' },
];

// ---------- Fabrication des phrases ----------

const VOWEL = /^[aeiouyéèêàâîôûh]/i;
export const the = (a: Animal) => `${a.g === 'm' ? 'le' : 'la'} ${a.noun}`;
export const ppOf = (v: Verb, g: Gender) => (g === 'f' ? `${v.pp}e` : v.pp);
const ne = (verb: string) => (VOWEL.test(verb) ? `n’${verb}` : `ne ${verb}`);
const de = (inf: string) => (VOWEL.test(inf) ? `d’${inf}` : `de ${inf}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pronoun = (g: Gender) => (g === 'm' ? 'il' : 'elle');

export const sentences = {
  active: (a: Animal, v: Verb, p: Animal) => `${cap(the(a))} ${v.pres} ${the(p)}.`,
  passive: (a: Animal, v: Verb, p: Animal) => `${cap(the(p))} est ${ppOf(v, p.g)} par ${the(a)}.`,
  cleftObject: (a: Animal, v: Verb, p: Animal) => `C’est ${the(p)} que ${the(a)} ${v.pres}.`,
  cleftSubject: (a: Animal, v: Verb, p: Animal) => `C’est ${the(a)} qui ${v.pres} ${the(p)}.`,
  /** « Le lapin que la souris regarde rit. » : x est le patient, y l’agent. */
  relativeObject: (x: Animal, v: Verb, y: Animal, intr: string) => `${cap(the(x))} que ${the(y)} ${v.pres} ${intr}.`,
  /** « Le lapin qui regarde la souris rit. » : x est l’agent, y le patient. */
  relativeSubject: (x: Animal, v: Verb, y: Animal, intr: string) => `${cap(the(x))} qui ${v.pres} ${the(y)} ${intr}.`,
  negationReversal: (a: Animal, v: Verb, p: Animal) => `${cap(the(p))} ${ne(v.pres)} pas ${the(a)} : c’est ${the(a)} qui ${v.pres} ${the(p)}.`,
  negationCleft: (wrong: Animal, v: Verb, p: Animal, real: Animal) => `Ce n’est pas ${the(wrong)} qui ${v.pres} ${the(p)}, c’est ${the(real)}.`,
  /** Quatre tournures où `first` a lieu avant `second`. */
  temporal: (who: Person, first: Activity, second: Activity, form: 0 | 1 | 2 | 3) => {
    const past = first.past[who.g === 'm' ? 0 : 1];
    return [
      `Avant ${de(second.inf)}, ${who.name} ${first.pres}.`,
      `Après ${past}, ${who.name} ${second.pres}.`,
      `${who.name} ${first.pres} avant ${de(second.inf)}.`,
      `${who.name} ${second.pres} après ${past}.`,
    ][form];
  },
};

const quote = (s: string) => `«\u00a0${s}\u00a0»`;

function animalChoices(correct: Animal, others: Animal[]): Choice[] {
  return [correct, ...others].map((a) => ({ label: the(a), emoji: a.emoji, correct: a === correct }));
}

/** Tire des animaux distincts. */
function animals(rng: () => number, n: number): Animal[] {
  return shuffle(rng, ANIMALS).slice(0, n);
}

type Template = 'active' | 'passive' | 'cleftObject' | 'cleftSubject' | 'relativeObject' | 'relativeSubject' | 'negationReversal' | 'negationCleft' | 'temporal';

function chooseTemplate(level: 1 | 2 | 3, rng: () => number): Template {
  const r = rng();
  if (level === 1) return 'active';
  if (level === 2) return r < 0.5 ? 'passive' : r < 0.85 ? 'cleftObject' : 'cleftSubject';
  return r < 0.25 ? 'relativeObject' : r < 0.45 ? 'relativeSubject' : r < 0.6 ? 'negationReversal' : r < 0.7 ? 'negationCleft' : 'temporal';
}

/** Rôle sur lequel porte la question. */
type Asked = 'agent' | 'patient';

export function makeItemFor(template: Template, rng: () => number): QuizItem {
  const v = pick(rng, VERBS);
  const asked: Asked = rng() < 0.5 ? 'agent' : 'patient';
  const qAgent = `Qui ${v.pres}\u00a0?`;
  const qPatient = `Qui est ${v.pp}\u00a0?`;

  if (template === 'temporal') {
    const who = pick(rng, PEOPLE);
    const [first, second, other] = shuffle(rng, ACTIVITIES).slice(0, 3);
    const form = Math.floor(rng() * 4) as 0 | 1 | 2 | 3;
    const sentence = sentences.temporal(who, first, second, form);
    const askFirst = rng() < 0.6;
    const question = `Que fait ${who.name} en ${askFirst ? 'premier' : 'dernier'}\u00a0?`;
    const right = askFirst ? first : second;
    const pr = pronoun(who.g);
    return {
      key: `temporal:${form}:${first.inf}>${second.inf}:${askFirst ? 1 : 2}`,
      prompt: question,
      say: `${sentence} ${question}`,
      stimulus: { emoji: who.emoji, text: sentence },
      choices: [first, second, other].map((a) => ({ label: `${pr} ${a.pres}`, emoji: a.emoji, correct: a === right })),
      explain: `${quote(sentence)} ${who.name} ${first.pres} d’abord, puis ${pr} ${second.pres}.`,
    };
  }

  if (template === 'negationCleft') {
    const [wrong, p, real] = animals(rng, 3);
    const sentence = sentences.negationCleft(wrong, v, p, real);
    const question = `Qui ${v.pres} ${the(p)}\u00a0?`;
    return {
      key: `${template}:${v.pres}:${wrong.noun}/${real.noun}>${p.noun}`,
      prompt: question,
      say: `${sentence} ${question}`,
      stimulus: { text: sentence },
      choices: animalChoices(real, [wrong, p]),
      explain: `${quote(sentence)} Ce n’est pas ${the(wrong)} : c’est ${the(real)} qui ${v.pres} ${the(p)}.`,
    };
  }

  if (template === 'relativeObject' || template === 'relativeSubject') {
    const [x, y, extra] = animals(rng, 3);
    const intr = pick(rng, INTRANSITIVES);
    // relativeObject : y fait l’action sur x ; relativeSubject : x fait l’action sur y.
    const [agent, patient] = template === 'relativeObject' ? [y, x] : [x, y];
    const sentence = template === 'relativeObject' ? sentences.relativeObject(x, v, y, intr) : sentences.relativeSubject(x, v, y, intr);
    // Trois questions possibles : l’action de la principale (toujours x), l’agent ou le patient de la relative.
    const r = rng();
    const [question, right, tag] =
      r < 0.5 ? [`Qui ${intr}\u00a0?`, x, 'main'] : asked === 'agent' ? [qAgent, agent, 'agent'] : [qPatient, patient, 'patient'];
    return {
      key: `${template}:${v.pres}:${agent.noun}>${patient.noun}:${intr}:${tag}`,
      prompt: question,
      say: `${sentence} ${question}`,
      stimulus: { text: sentence },
      choices: animalChoices(right, [x, y, extra].filter((a) => a !== right)),
      explain: `${quote(sentence)} ${cap(the(agent))} ${v.pres} ${the(patient)}, et c’est ${the(x)} qui ${intr}.`,
    };
  }

  const [agent, patient, extra] = animals(rng, 3);
  const sentence =
    template === 'negationReversal' ? sentences.negationReversal(agent, v, patient) : sentences[template as 'active'](agent, v, patient);
  const question = asked === 'agent' ? qAgent : qPatient;
  const right = asked === 'agent' ? agent : patient;
  const facts = `c’est ${the(agent)} qui ${v.pres}, et ${the(patient)} est ${ppOf(v, patient.g)}.`;
  const plain = `${cap(the(agent))} ${v.pres} ${the(patient)}.`;
  const trick: Record<string, string> = {
    active: cap(facts),
    passive: `Celui qui fait l’action vient après le mot « par » : ${facts}`,
    cleftObject: `Cette phrase veut dire : ${quote(plain)} Donc ${facts}`,
    cleftSubject: `Cette phrase veut dire : ${quote(plain)} Donc ${facts}`,
    negationReversal: `Le mot « pas » dit que ce n’est pas vrai : ${facts}`,
  };
  return {
    key: `${template}:${v.pres}:${agent.noun}>${patient.noun}:${asked}`,
    prompt: question,
    say: `${sentence} ${question}`,
    stimulus: { text: sentence },
    choices: animalChoices(right, [agent, patient, extra].filter((a) => a !== right)),
    explain: `${quote(sentence)} ${trick[template]}`,
  };
}

export const game: QuizGame = {
  title: 'Qui fait quoi ?',
  instructions: 'Écoute bien la phrase, puis réponds à la question : touche le bon personnage.',
  levels: [
    { label: 'Phrases simples', description: '« Le chien pousse le chat. »' },
    { label: 'Phrases à l’envers', description: 'passives et « c’est… que… »' },
    { label: 'Phrases complexes', description: 'relatives, négation, avant / après' },
  ],
  makeItem(level, rng, recent) {
    let item = makeItemFor(chooseTemplate(level, rng), rng);
    for (let i = 0; i < 5 && recent.includes(item.key); i++) item = makeItemFor(chooseTemplate(level, rng), rng);
    return item;
  },
};

export default quizGame(game);
