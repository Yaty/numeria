/**
 * Moteur commun des jeux « par items » : une partie de N items, retour immédiat,
 * niveau adaptatif sur 3 niveaux, résumé avec étoiles, essais enregistrés.
 *
 * Un jeu fournit des items à choix (`choices`) ou un rendu libre (`custom`).
 */
import { h } from '../ui/dom';
import { pick as pickR, seeded, shuffle as shuffleR } from '../core/random';
import type { GameContext, GameModule } from './types';

export interface Choice {
  /** Texte du bouton (peut être vide si `emoji` suffit). */
  label: string;
  emoji?: string;
  /** Lu à voix haute quand on appuie longuement sur 🔊 ou au survol (sinon label). */
  say?: string;
  correct: boolean;
}

export interface Stimulus {
  /** Un ou plusieurs émojis affichés en grand. */
  emoji?: string;
  /** Texte affiché (mot, phrase…). */
  text?: string;
  /** Le texte disparaît après ce délai (lecture flash). */
  flashMs?: number;
}

export interface QuizItem {
  /** Identifiant stable de l'item (statistiques). */
  key: string;
  /** Consigne affichée. */
  prompt: string;
  /** Ce qui est lu à voix haute ; par défaut la consigne. Peut inclure le mot à entendre. */
  say?: string;
  stimulus?: Stimulus;
  /** Réponses proposées (mélangées par le moteur sauf `keepOrder`). */
  choices?: Choice[];
  keepOrder?: boolean;
  /** Rendu libre : appeler `answer(correct, detail)` une seule fois. */
  custom?: (el: HTMLElement, answer: (correct: boolean, detail?: string) => void, ctx: GameContext) => void;
  /** Montré (et lu) après une erreur : la bonne réponse expliquée. */
  explain?: string;
}

export interface LevelInfo {
  label: string;
  description: string;
}

/**
 * `L` : niveaux du jeu (1 | 2 | 3 par défaut). Un jeu peut en avoir plus : il
 * déclare autant d'entrées dans `levels`, et `L` en conséquence.
 */
export interface QuizGame<L extends number = 1 | 2 | 3> {
  title: string;
  /** Consigne générale lue au début. */
  instructions: string;
  levels: LevelInfo[];
  /** Jeu sans voix : rien n'est lu, pas de bouton 🔊 (l'adulte dit le mot). */
  silent?: boolean;
  /** Items par partie (10 par défaut). */
  itemsPerRound?: number;
  /** Fabrique un item ; `recent` = clés des derniers items, à éviter. */
  makeItem(level: L, rng: () => number, recent: string[]): QuizItem;
}

interface QuizState {
  level: number;
  rounds: number;
  bestStars: Record<number, number>;
  recent: string[];
}

export const LEVEL_UP = 0.8;
export const LEVEL_DOWN = 0.5;

/** Niveau de la partie suivante selon le score (fraction de réussites). */
export function nextLevel<L extends number>(level: L, score: number, levels = 3): L {
  if (score >= LEVEL_UP && level < levels) return (level + 1) as L;
  if (score < LEVEL_DOWN && level > 1) return (level - 1) as L;
  return level;
}

/**
 * Affichage seulement : espace insécable avant « ? ! : ; » et à l'intérieur des guillemets,
 * pour qu'un signe ne parte jamais seul à la ligne sur un petit écran.
 */
export function typo(text: string): string {
  return text.replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
}

export function starsFor(score: number): number {
  return score >= 0.9 ? 3 : score >= 0.7 ? 2 : score >= 0.4 ? 1 : 0;
}

const validLevel = (l: unknown, levels: number): l is number => typeof l === 'number' && Number.isInteger(l) && l >= 1 && l <= levels;

function readState(raw: unknown, levels: number): QuizState {
  const s = (raw ?? {}) as Partial<QuizState>;
  return {
    level: validLevel(s.level, levels) ? s.level : 1,
    rounds: s.rounds ?? 0,
    bestStars: s.bestStars ?? {},
    recent: Array.isArray(s.recent) ? s.recent.slice(-30) : [],
  };
}

function forcedLevel(ctx: GameContext, levels: number): number | null {
  const l = ctx.settings.level;
  return validLevel(l, levels) ? l : null;
}

export function quizGame<L extends number = 1 | 2 | 3>(game: QuizGame<L>): GameModule {
  const levelCount = game.levels.length;
  return {
    silent: game.silent,
    mount(el, ctx) {
      let state = readState(ctx.state, levelCount);
      let disposed = false;
      const timers: number[] = [];
      const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(() => !disposed && fn(), ms));
      const rng = seeded(Date.now() % 2147483647);
      if (game.silent) ctx = { ...ctx, speak: () => undefined };
      const sayButton = (label: string, text: string) =>
        game.silent ? null : h('button', { class: 'q-say', type: 'button', 'aria-label': label, onclick: () => ctx.speak(text) }, '🔊');

      function shell(...children: (Node | null)[]): HTMLElement {
        const root = h('div', { class: 'quiz' }, ...children);
        el.replaceChildren(root);
        // Nouvel écran : on remonte en haut (la correction a pu faire défiler la zone de jeu).
        for (let n: HTMLElement | null = el; n; n = n.parentElement) n.scrollTop = 0;
        return root;
      }

      function intro(): void {
        const forced = forcedLevel(ctx, levelCount);
        const level = forced ?? state.level;
        shell(
          h(
            'div',
            { class: 'quiz-card quiz-intro' },
            h('h1', {}, game.title),
            h('p', { class: 'quiz-instructions' }, typo(game.instructions)),
            sayButton('Écouter la consigne', game.instructions),
            h(
              'div',
              { class: 'quiz-levels' },
              game.levels.map((l, i) => {
                const n = i + 1;
                const stars = state.bestStars[n] ?? 0;
                return h(
                  'button',
                  {
                    class: `quiz-level ${n === level ? 'current' : ''}`,
                    type: 'button',
                    disabled: forced !== null && forced !== n,
                    onclick: () => {
                      state.level = n;
                      play(n);
                    },
                  },
                  h('strong', {}, `Niveau ${n}`),
                  h('span', {}, l.label),
                  h('span', { class: 'quiz-stars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
                );
              }),
            ),
            h('button', { class: 'btn primary big', type: 'button', onclick: () => play(level) }, '▶ Jouer'),
            forced !== null ? h('p', { class: 'muted' }, `Niveau ${forced} choisi par l’adulte.`) : null,
          ),
        );
        ctx.speak(game.instructions);
      }

      function play(level: number): void {
        const total = game.itemsPerRound ?? 10;
        let index = 0;
        let correctCount = 0;

        const next = () => {
          if (index >= total) return summary(level, correctCount / total, total);
          const item = game.makeItem(level as L, rng, state.recent);
          state.recent = [...state.recent, item.key].slice(-30);
          index++;
          showItem(item, index, total, level, (ok) => {
            if (ok) correctCount++;
            next();
          });
        };
        next();
      }

      function showItem(item: QuizItem, index: number, total: number, level: number, done: (ok: boolean) => void): void {
        const started = performance.now();
        let answered = false;
        const feedback = h('div', { class: 'quiz-feedback', 'aria-live': 'polite' });
        const answerArea = h('div', { class: 'quiz-answers' });
        const say = item.say ?? item.prompt;

        const answer = (correct: boolean, detail?: string) => {
          if (answered) return;
          answered = true;
          ctx.record({ level, item: item.key, correct, ms: Math.round(performance.now() - started), detail });
          root.classList.add(correct ? 'is-correct' : 'is-wrong');
          if (correct) {
            feedback.replaceChildren(h('span', { class: 'quiz-ok' }, pick(['Bravo !', 'Super !', 'Oui !', 'Bien joué !'])));
            ctx.speak(feedback.textContent ?? '');
            later(() => done(true), 1100);
          } else {
            const explain = item.explain ?? '';
            feedback.replaceChildren(
              h('span', { class: 'quiz-bad' }, 'Pas tout à fait…'),
              ...(explain ? [h('p', { class: 'quiz-explain' }, typo(explain))] : []),
              h('button', { class: 'btn primary', type: 'button', onclick: () => done(false) }, 'Continuer ➜'),
            );
            ctx.speak(explain ? `Pas tout à fait. ${explain}` : 'Pas tout à fait.');
            // Petit écran : l'explication et « Continuer » peuvent être sous la ligne de flottaison.
            requestAnimationFrame(() => feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
          }
        };

        if (item.choices) {
          const choices = item.keepOrder ? item.choices : shuffle(item.choices);
          for (const c of choices) {
            const btn = h(
              'button',
              {
                class: `quiz-choice ${c.emoji && !c.label ? 'emoji-only' : ''}`,
                type: 'button',
                onclick: () => {
                  if (answered) return;
                  btn.classList.add(c.correct ? 'right' : 'wrong');
                  if (!c.correct) answerArea.querySelector<HTMLElement>('[data-correct]')?.classList.add('right');
                  answer(c.correct, c.correct ? undefined : c.label || c.say || c.emoji);
                },
              },
              c.emoji ? h('span', { class: 'quiz-choice-emoji' }, c.emoji) : null,
              c.label ? h('span', { class: 'quiz-choice-label' }, c.label) : null,
            );
            if (c.correct) btn.dataset.correct = '1';
            answerArea.append(btn);
          }
        }

        const stimulus = item.stimulus
          ? h(
              'div',
              { class: 'quiz-stimulus' },
              item.stimulus.emoji ? h('div', { class: 'quiz-stimulus-emoji' }, item.stimulus.emoji) : null,
              item.stimulus.text ? h('div', { class: 'quiz-stimulus-text' }, typo(item.stimulus.text)) : null,
            )
          : null;

        const root = shell(
          h(
            'div',
            { class: 'quiz-top' },
            h('div', { class: 'quiz-progress', style: `--p:${(index - 1) / total}` }, h('span')),
            h('span', { class: 'quiz-count' }, `${index} / ${total}`),
          ),
          h(
            'div',
            { class: 'quiz-card quiz-item' },
            h(
              'div',
              { class: 'quiz-prompt' },
              sayButton('Réécouter', say),
              h('p', {}, typo(item.prompt)),
            ),
            stimulus,
            answerArea,
            feedback,
          ),
        );

        if (item.custom) item.custom(answerArea, answer, ctx);
        if (item.stimulus?.flashMs && stimulus) {
          const text = stimulus.querySelector<HTMLElement>('.quiz-stimulus-text');
          later(() => text?.classList.add('flashed'), item.stimulus.flashMs);
        }
        ctx.speak(say);
      }

      function summary(level: number, score: number, total: number): void {
        const stars = starsFor(score);
        state.bestStars[level] = Math.max(state.bestStars[level] ?? 0, stars);
        state.rounds++;
        const forced = forcedLevel(ctx, levelCount);
        const after = forced ?? nextLevel(level, score, levelCount);
        const moved = forced !== null ? 'same' : after > level ? 'up' : after < level ? 'down' : 'same';
        // niveau imposé (réglage ou exercice envoyé) : la progression automatique n'est pas touchée
        if (forced === null) state.level = after;
        ctx.saveState(state);
        const message =
          moved === 'up' ? `Niveau ${after} débloqué !` : moved === 'down' ? 'On s’entraîne encore un peu au niveau précédent.' : stars >= 2 ? 'Très bien !' : 'Continue, tu progresses !';
        shell(
          h(
            'div',
            { class: 'quiz-card quiz-summary' },
            h('div', { class: 'quiz-big-stars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
            h('h2', {}, score === 1 ? 'Tout juste !' : `${Math.round(score * total)} bonnes réponses sur ${total}`),
            h('p', {}, message),
            h(
              'div',
              { class: 'quiz-actions' },
              h('button', { class: 'btn primary big', type: 'button', onclick: () => play(after) }, '🔁 Rejouer'),
              h('button', { class: 'btn ghost', type: 'button', onclick: () => ctx.exit() }, 'Autres jeux'),
            ),
          ),
        );
        ctx.speak(message);
      }

      const pick = <T>(xs: readonly T[]): T => pickR(rng, xs);
      const shuffle = <T>(xs: readonly T[]): T[] => shuffleR(rng, xs);

      intro();
      return () => {
        disposed = true;
        timers.forEach(clearTimeout);
      };
    },
  };
}
