/**
 * Format des textes du jeu « Qui, où, quand, quoi ? ».
 *
 * Chaque texte pose 4 questions ; chaque question propose 3 images (émoji +
 * courte légende). La première option écrite est la bonne, les deux autres sont
 * des perturbateurs (le jeu les mélange). Une option s'écrit « émoji légende »,
 * les trois sont séparées par « | » :
 *
 *   t('i1-anniv', 'Inférences 1', 'Lucie a invité ses copines…',
 *     '👧 Lucie et ses copines | 👵 Lucie et sa mamie | 🧑‍🏫 la maîtresse',
 *     …)
 *
 * La bonne réponse est celle qu'on déduit du texte, même quand elle n'y est pas
 * écrite telle quelle (« sept bougies » → à son anniversaire).
 */

export interface Option {
  emoji: string;
  label: string;
}

/** La bonne réponse d'abord, puis les deux perturbateurs. */
export type Question = readonly [right: Option, wrong1: Option, wrong2: Option];

export const QUESTIONS = ['qui', 'ou', 'quand', 'quoi'] as const;
export type QuestionId = (typeof QUESTIONS)[number];

export const QUESTION_TEXT: Record<QuestionId, string> = {
  qui: 'Qui sont les personnages ?',
  ou: 'Où ça se passe ?',
  quand: 'Quand ça se passe ?',
  quoi: 'Qu’est-ce qu’ils font ?',
};

export interface InferenceText {
  /** Identifiant stable (statistiques). */
  id: string;
  /** Série du corpus d'origine (« Inférences 3 », « Élaboration »…). */
  serie: string;
  text: string;
  questions: Record<QuestionId, Question>;
}

/** « 🧑‍🍳 maman » → { emoji: '🧑‍🍳', label: 'maman' } (tout ce qui précède la 1re espace est l'émoji). */
export function option(raw: string): Option {
  const s = raw.trim();
  const i = s.indexOf(' ');
  return i < 0 ? { emoji: s, label: '' } : { emoji: s.slice(0, i), label: s.slice(i + 1).trim() };
}

function question(raw: string): Question {
  const parts = raw.split('|').map(option);
  if (parts.length !== 3) throw new Error(`3 options attendues : ${raw}`);
  return [parts[0], parts[1], parts[2]];
}

export function t(id: string, serie: string, text: string, qui: string, ou: string, quand: string, quoi: string): InferenceText {
  return { id, serie, text, questions: { qui: question(qui), ou: question(ou), quand: question(quand), quoi: question(quoi) } };
}
