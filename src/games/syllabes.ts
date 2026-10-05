/**
 * Le train des syllabes — conscience phonologique (segmentation syllabique orale).
 * On entend un mot (et on voit son image) ; on dit combien il a de syllabes ORALES
 * en choisissant un train de 1, 2, 3… wagons. Un tambour permet de taper chaque
 * syllabe avant de répondre (aide au découpage, il ne compte pas comme réponse).
 *
 * Syllabes orales du français standard : le e muet final ne compte pas
 * (« pomme » = 1, « tomate » = 2). Mots écartés : e muet interne variable
 * (« fenêtre », « cheval »), finales consonne + r/l où un e se fait souvent
 * entendre (« arbre », « tigre », « livre »), voyelles en hiatus ou synérèse
 * instable (« lion », « avion », « piano », « nuage »).
 *
 * Niveau 1 : mots de 1 ou 2 syllabes, trains de 1 à 3 wagons.
 * Niveau 2 : mots de 1 à 3 syllabes, trains de 1 à 4 wagons.
 * Niveau 3 : mots de 2 à 4 syllabes (mots longs), trains de 1 à 5 wagons.
 */
import { h } from '../ui/dom';
import { pick } from '../core/random';
import { quizGame, type QuizGame } from '../portal/quiz';
import './syllabes.css';

/** Découpage oral, syllabes séparées par « · » (le e muet final reste dans la dernière). */
export type Word = readonly [split: string, emoji: string];

export const WORDS: readonly Word[] = [
  // 1 syllabe
  ['chat', '🐱'], ['chien', '🐶'], ['pomme', '🍎'], ['lune', '🌙'], ['loup', '🐺'], ['lit', '🛏️'],
  ['bol', '🥣'], ['feu', '🔥'], ['fleur', '🌸'], ['clé', '🔑'], ['train', '🚆'], ['main', '✋'],
  ['nez', '👃'], ['pied', '🦶'], ['dé', '🎲'], ['dent', '🦷'], ['rose', '🌹'], ['robe', '👗'],
  ['vache', '🐮'], ['mouche', '🪰'], ['bouche', '👄'], ['douche', '🚿'], ['cloche', '🔔'],
  ['glace', '🍦'], ['fraise', '🍓'], ['poire', '🍐'], ['poule', '🐔'], ['ours', '🐻'], ['crabe', '🦀'],
  ['cœur', '❤️'], ['bus', '🚌'], ['singe', '🐵'], ['plume', '🪶'], ['seau', '🪣'], ['phoque', '🦭'],
  ['œuf', '🥚'], ['cygne', '🦢'], ['miel', '🍯'], ['tente', '⛺'], ['plage', '🏖️'], ['botte', '👢'],
  ['bague', '💍'], ['os', '🦴'], ['chaise', '🪑'], ['pain', '🍞'],
  // 2 syllabes
  ['ba·llon', '⚽'], ['la·pin', '🐰'], ['ba·teau', '⛵'], ['vé·lo', '🚲'], ['mo·to', '🏍️'],
  ['mou·ton', '🐑'], ['poi·sson', '🐟'], ['co·chon', '🐷'], ['ca·nard', '🦆'], ['sa·pin', '🎄'],
  ['châ·teau', '🏰'], ['cha·peau', '🎩'], ['gâ·teau', '🎂'], ['mai·son', '🏠'], ['tor·tue', '🐢'],
  ['sou·ris', '🐭'], ['ci·tron', '🍋'], ['to·mate', '🍅'], ['ca·rotte', '🥕'], ['ba·nane', '🍌'],
  ['gi·rafe', '🦒'], ['va·lise', '🧳'], ['ro·bot', '🤖'], ['dau·phin', '🐬'], ['fu·sée', '🚀'],
  ['ca·deau', '🎁'], ['ca·fé', '☕'], ['bé·bé', '👶'], ['pan·da', '🐼'], ['tam·bour', '🥁'],
  ['four·mi', '🐜'], ['lu·nettes', '👓'], ['é·toile', '⭐'], ['a·beille', '🐝'], ['oi·seau', '🐦'],
  ['so·leil', '☀️'], ['su·cette', '🍭'], ['sa·lade', '🥗'], ['cac·tus', '🌵'], ['bou·gie', '🕯️'],
  ['cha·meau', '🐫'], ['mar·teau', '🔨'], ['ci·seaux', '✂️'], ['o·live', '🫒'], ['rai·sin', '🍇'],
  ['ba·leine', '🐳'], ['cou·ronne', '👑'], ['gui·tare', '🎸'], ['la·ma', '🦙'], ['pou·ssin', '🐤'],
  ['bon·bon', '🍬'], ['pin·ceau', '🖌️'], ['ser·pent', '🐍'], ['lé·zard', '🦎'], ['dra·gon', '🐉'],
  ['cra·vate', '👔'], ['o·range', '🍊'], ['jour·nal', '📰'], ['go·rille', '🦍'], ['chau·ssure', '👞'],
  ['chau·ssette', '🧦'], ['mi·cro', '🎤'], ['pas·tèque', '🍉'], ['vol·can', '🌋'], ['vam·pire', '🧛'],
  ['ki·wi', '🥝'], ['trac·teur', '🚜'], ['fan·tôme', '👻'], ['ma·mmouth', '🦣'], ['pin·gouin', '🐧'],
  ['trom·pette', '🎺'], ['o·reille', '👂'], ['bou·teille', '🍾'], ['crois·sant', '🥐'], ['ba·guette', '🥖'],
  // 3 syllabes
  ['pa·pi·llon', '🦋'], ['é·lé·phant', '🐘'], ['di·no·saure', '🦕'], ['cro·co·dile', '🐊'],
  ['cho·co·lat', '🍫'], ['té·lé·phone', '☎️'], ['a·na·nas', '🍍'], ['cham·pi·gnon', '🍄'],
  ['kan·gou·rou', '🦘'], ['pa·ra·pluie', '☂️'], ['es·car·got', '🐌'], ['au·ber·gine', '🍆'],
  ['pan·ta·lon', '👖'], ['coc·ci·nelle', '🐞'], ['a·rai·gnée', '🕷️'], ['a·vo·cat', '🥑'],
  ['bro·co·li', '🥦'], ['sa·xo·phone', '🎷'], ['tro·tti·nette', '🛴'], ['pa·ra·chute', '🪂'],
  ['am·bu·lance', '🚑'], ['co·qui·llage', '🐚'], ['pe·rro·quet', '🦜'], ['é·cu·reuil', '🐿️'],
  ['pa·ra·sol', '⛱️'], ['hé·ri·sson', '🦔'], ['spa·ghe·ttis', '🍝'],
  // 4 syllabes
  ['hé·li·cop·tère', '🚁'], ['rhi·no·cé·ros', '🦏'], ['hi·ppo·po·tame', '🦛'], ['or·di·na·teur', '💻'],
  ['ty·ra·nno·saure', '🦖'], ['ac·cor·dé·on', '🪗'],
];

export const syllables = (split: string) => split.split('·');
export const wordOf = (split: string) => split.replaceAll('·', '');

/** Nombre de syllabes possibles et trains proposés, par niveau. */
export const LEVELS: Record<1 | 2 | 3, { counts: number[]; max: number }> = {
  1: { counts: [1, 2], max: 3 },
  2: { counts: [1, 2, 3], max: 4 },
  3: { counts: [2, 3, 4], max: 5 },
};

/** Le mot finit par un e muet (« tomate », « lunettes ») : on le signale dans l'explication. */
export const muteFinalE = (word: string) => /[^éi]es?$/.test(word) && !/(ée|ées)$/.test(word);

const NUMBERS = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq'];

export const game: QuizGame = {
  title: 'Le train des syllabes',
  instructions: 'Écoute le mot et compte ses syllabes : tape sur le tambour à chaque morceau, puis choisis le train qui a autant de wagons.',
  levels: [
    { label: 'Mots courts', description: 'une ou deux syllabes' },
    { label: 'Mots moyens', description: 'une à trois syllabes' },
    { label: 'Mots longs', description: 'deux à quatre syllabes' },
  ],
  makeItem(level, rng, recent) {
    const { counts, max } = LEVELS[level];
    // Le nombre de syllabes est tiré d'abord : les réponses sont équilibrées.
    const n = pick(rng, counts);
    const pool = WORDS.filter(([s]) => syllables(s).length === n);
    let entry = pick(rng, pool);
    for (let i = 0; i < 10 && recent.includes(`syl:${wordOf(entry[0])}`); i++) entry = pick(rng, pool);
    const [split, emoji] = entry;
    const word = wordOf(split);
    const parts = syllables(split);
    const mute = muteFinalE(word) ? ' Le e de la fin ne s’entend pas.' : '';
    return {
      key: `syl:${word}`,
      prompt: 'Combien de syllabes entends-tu ?',
      say: `Écoute : ${word}. Combien de syllabes ?`,
      stimulus: { emoji },
      explain: `${parts.join('·')} : ${NUMBERS[n]} syllabe${n > 1 ? 's' : ''}, ${NUMBERS[n]} wagon${n > 1 ? 's' : ''}.${mute}`,
      custom(el, answer) {
        el.classList.add('syllabes-area');
        let taps = 0;
        const dots = h('div', { class: 'syllabes-dots', 'aria-live': 'polite' });
        const drum = h(
          'button',
          {
            class: 'syllabes-drum',
            type: 'button',
            'aria-label': 'Taper une syllabe',
            onclick: () => {
              if (taps >= 6) return;
              taps++;
              dots.append(h('span', { class: 'syllabes-dot' }));
              drum.classList.remove('hit');
              void drum.offsetWidth;
              drum.classList.add('hit');
            },
          },
          '🥁',
        );
        const reset = h(
          'button',
          {
            class: 'btn syllabes-reset',
            type: 'button',
            onclick: () => {
              taps = 0;
              dots.replaceChildren();
            },
          },
          '↺ Recommencer',
        );
        const trains = h('div', { class: 'syllabes-trains' });
        for (let k = 1; k <= max; k++) {
          const btn = h(
            'button',
            {
              class: 'quiz-choice syllabes-train',
              type: 'button',
              'aria-label': `${k} wagon${k > 1 ? 's' : ''}`,
              onclick: () => {
                if (trains.classList.contains('done')) return;
                trains.classList.add('done');
                const ok = k === n;
                btn.classList.add(ok ? 'right' : 'wrong');
                if (!ok) trains.querySelector<HTMLElement>(`[data-n="${n}"]`)?.classList.add('right');
                answer(ok, ok ? undefined : `${k} au lieu de ${n}`);
              },
            },
            h('span', { class: 'syllabes-wagons' }, '🚂', ...Array.from({ length: k }, () => h('span', {}, '🚃'))),
            h('span', { class: 'quiz-choice-label' }, String(k)),
          );
          btn.dataset.n = String(k);
          trains.append(btn);
        }
        el.append(h('div', { class: 'syllabes-tap' }, drum, h('div', { class: 'syllabes-tapside' }, dots, reset)), trains);
      },
    };
  },
};

export default quizGame(game);
