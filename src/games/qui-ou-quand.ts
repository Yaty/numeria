/**
 * Qui, où, quand, quoi ? — compréhension écrite et inférences.
 *
 * L'enfant lit un court texte ; dessous, quatre questions (qui sont les
 * personnages, où, quand, qu'est-ce qu'ils font) proposent chacune trois images :
 * une juste, deux perturbatrices. La bonne réponse se déduit du texte, elle n'y
 * est pas forcément écrite (« sept bougies » → son anniversaire).
 *
 * Une erreur grise l'image et l'enfant cherche encore ; le texte compte comme
 * réussi s'il a tout trouvé du premier coup.
 *
 * Corpus « Énoncés inférences tous les cycles » (aideeleves.net, mis en forme par
 * Brigitte Korac), découpé comme lui :
 * Niveau 1 : Inférences 1 (cycle 2).
 * Niveau 2 : Inférences 2 et 3, reprises anaphoriques et subordonnées (début cycle 3).
 * Niveau 3 : Inférences 4 à 7 (cycle 3).
 * Niveau 4 : Inférences 8, 9, 10 et d'élaboration (cycle 3 et SEGPA).
 */
import { shuffle } from '../core/random';
import { quizGame, typo, type QuizGame, type QuizItem } from '../portal/quiz';
import { h } from '../ui/dom';
import { NIVEAU1 } from '../data/inferences/niveau1';
import { NIVEAU2 } from '../data/inferences/niveau2';
import { NIVEAU3 } from '../data/inferences/niveau3';
import { NIVEAU4A } from '../data/inferences/niveau4a';
import { NIVEAU4B } from '../data/inferences/niveau4b';
import { QUESTIONS, QUESTION_TEXT, type InferenceText, type Option, type QuestionId } from '../data/inferences/types';
import './qui-ou-quand.css';

export type Level = 1 | 2 | 3 | 4;

export const TEXTS: Record<Level, readonly InferenceText[]> = {
  1: NIVEAU1,
  2: NIVEAU2,
  3: NIVEAU3,
  4: [...NIVEAU4A, ...NIVEAU4B],
};

const keyOf = (level: Level, text: InferenceText) => `inf:${level}:${text.id}`;

/** Un texte pas encore vu récemment (sinon n'importe lequel). */
export function pickText(level: Level, rng: () => number, recent: readonly string[]): InferenceText {
  const bank = TEXTS[level];
  const fresh = bank.filter((x) => !recent.includes(keyOf(level, x)));
  const pool = fresh.length ? fresh : bank;
  return pool[Math.floor(rng() * pool.length)];
}

interface Shown {
  id: QuestionId;
  options: { option: Option; correct: boolean }[];
}

/** Les 4 questions, options mélangées. */
export function layout(text: InferenceText, rng: () => number): Shown[] {
  return QUESTIONS.map((id) => {
    const [right, ...wrong] = text.questions[id];
    return { id, options: shuffle(rng, [{ option: right, correct: true }, ...wrong.map((option) => ({ option, correct: false }))]) };
  });
}

const SHORT: Record<QuestionId, string> = { qui: 'Qui', ou: 'Où', quand: 'Quand', quoi: 'Quoi' };

function render(shown: Shown[]) {
  return (el: HTMLElement, answer: (correct: boolean, detail?: string) => void) => {
    el.classList.add('qoq');
    const missed = new Set<QuestionId>();
    const found = new Set<QuestionId>();
    for (const q of shown) {
      const row = h('div', { class: 'qoq-choices' });
      const block = h('section', { class: 'qoq-question', 'aria-label': QUESTION_TEXT[q.id] }, h('h3', {}, typo(QUESTION_TEXT[q.id])), row);
      for (const { option, correct } of q.options) {
        const btn: HTMLButtonElement = h(
          'button',
          {
            class: 'qoq-choice',
            type: 'button',
            onclick: () => {
              if (found.has(q.id) || btn.disabled) return;
              if (!correct) {
                missed.add(q.id);
                btn.classList.add('wrong');
                btn.disabled = true;
                return;
              }
              found.add(q.id);
              btn.classList.add('right');
              block.classList.add('done');
              for (const other of row.querySelectorAll('button')) if (other !== btn) other.disabled = true;
              if (found.size === shown.length) {
                answer(missed.size === 0, missed.size ? [...missed].map((m) => SHORT[m]).join(', ') : undefined);
              }
            },
          },
          h('span', { class: 'qoq-emoji', 'aria-hidden': 'true' }, option.emoji),
          h('span', { class: 'qoq-label' }, typo(option.label)),
        );
        row.append(btn);
      }
      el.append(block);
    }
  };
}

export const game: QuizGame<Level> = {
  title: 'Qui, où, quand, quoi ?',
  instructions: 'Lis le texte. Pour chaque question, touche l’image qui va avec. Attention : la réponse n’est pas toujours écrite, il faut parfois la deviner !',
  silent: true,
  itemsPerRound: 5,
  levels: [
    { label: 'Textes courts (cycle 2)', description: 'Inférences 1' },
    { label: 'Pronoms et subordonnées', description: 'Inférences 2 et 3' },
    { label: 'Textes plus longs (cycle 3)', description: 'Inférences 4 à 7' },
    { label: 'Experts (cycle 3, SEGPA)', description: 'Inférences 8 à 10 et d’élaboration' },
  ],
  makeItem(level, rng, recent): QuizItem {
    const text = pickText(level, rng, recent);
    const shown = layout(text, rng);
    return {
      key: keyOf(level, text),
      prompt: 'Lis le texte, puis réponds aux 4 questions.',
      stimulus: { text: text.text },
      custom: render(shown),
      explain: 'Relis le texte : les indices sont dedans, même quand la réponse n’est pas écrite.',
    };
  },
};

export default quizGame(game);
