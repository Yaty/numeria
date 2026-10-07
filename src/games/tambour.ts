/**
 * Le tambour des sons — conscience phonémique (segmentation et dénombrement des sons).
 *
 * On entend un mot (et on voit son image, jamais le mot écrit : on compterait les
 * lettres). On frappe le tambour une fois par SON entendu (« chat » = ch·a = 2 sons) ;
 * chaque frappe pose un petit tambour sur la piste, puis on valide.
 * Principe repris de MorphoMystery : on assemble la réponse morceau par morceau
 * et on la valide soi-même ; une erreur n'arrête pas l'item, on réessaie.
 *
 *  - 1er échec : les gestes Borel-Maisonny des sons du mot apparaissent, dans l'ordre.
 *  - 2e échec : tous les indices — les graphèmes écrits sur les cartes, la piste montre
 *    autant d'emplacements que de sons, et les cartes s'allument une à une.
 *  - 3e échec : la réponse est donnée.
 *
 * Mots retenus : découpage en sons stable. Écartés : e muet prononcé ou non selon la
 * région (« cerise »), oi / oin et semi-voyelles (« roi », « fille », « lion »), x.
 *
 * Niveau 1 : 2 ou 3 sons, syllabes simples.
 * Niveau 2 : 3 à 5 sons, sans groupe de consonnes.
 * Niveau 3 : 4 à 8 sons, avec groupes de consonnes (fl, tr, kt…) ; sous chaque tambour
 * posé s'écrit le graphème du son (bateau : b, a, t, eau), c, g et s en couleur.
 */
import { h } from '../ui/dom';
import { pick } from '../core/random';
import { quizGame, type QuizGame } from '../portal/quiz';
import { GESTURES, gesturePhoto, type SoundId } from '../portal/gestes';
import './tambour.css';

/**
 * [mot, sons séparés par « . », émoji]. Chaque son s'écrit `son` quand son graphème
 * dans le mot est le même (« ch », « ou »), sinon `son:graphème` (« o:eau », « k:qu »).
 * Les lettres muettes (t de chat, e final) n'ont pas de son.
 */
export type Word = readonly [word: string, sounds: string, emoji: string];

export const WORDS: readonly Word[] = [
  // 2 sons
  ['chat', 'ch.a', '🐱'], ['lit', 'l.i', '🛏️'], ['loup', 'l.ou', '🐺'], ['nez', 'n.é:ez', '👃'],
  ['feu', 'f.eu', '🔥'], ['dé', 'd.é', '🎲'], ['riz', 'r.i', '🍚'], ['roue', 'r.ou', '🛞'],
  ['pain', 'p.in:ain', '🍞'], ['main', 'm.in:ain', '✋'], ['dent', 'd.an:en', '🦷'], ['pont', 'p.on', '🌉'],
  ['thé', 't:th.é', '🍵'], ['os', 'o.s', '🦴'], ['œuf', 'eu:œu.f', '🥚'], ['seau', 's.o:eau', '🪣'],
  ['vent', 'v.an:en', '🌬️'], ['nœud', 'n.eu:œu', '🪢'], ['chou', 'ch.ou', '🥬'],
  // 3 sons
  ['lune', 'l.u.n', '🌙'], ['robe', 'r.o.b', '👗'], ['vache', 'v.a.ch', '🐮'], ['pomme', 'p.o.m:mm', '🍎'],
  ['bol', 'b.o.l', '🥣'], ['mouche', 'm.ou.ch', '🪰'], ['bouche', 'b.ou.ch', '👄'], ['douche', 'd.ou.ch', '🚿'],
  ['poule', 'p.ou.l', '🐔'], ['rose', 'r.o.z:s', '🌹'], ['coq', 'k:c.o.k:q', '🐓'], ['sac', 's.a.k:c', '👜'],
  ['bague', 'b.a.g:gu', '💍'], ['chaise', 'ch.è:ai.z:s', '🪑'], ['phoque', 'f:ph.o.k:qu', '🦭'], ['singe', 's.in.j:g', '🐵'],
  ['tente', 't.an:en.t', '⛺'], ['cygne', 's:c.i:y.gn', '🦢'], ['ours', 'ou.r.s', '🐻'], ['bus', 'b.u.s', '🚌'],
  ['botte', 'b.o.t:tt', '👢'],
  // 4 sons
  ['moto', 'm.o.t.o', '🏍️'], ['vélo', 'v.é.l.o', '🚲'], ['lapin', 'l.a.p.in', '🐰'], ['bébé', 'b.é.b.é', '👶'],
  ['café', 'k:c.a.f.é', '☕'], ['lama', 'l.a.m.a', '🦙'], ['panda', 'p.an.d.a', '🐼'], ['robot', 'r.o.b.o', '🤖'],
  ['mouton', 'm.ou.t.on', '🐑'], ['bateau', 'b.a.t.o:eau', '⛵'], ['gâteau', 'g.a:â.t.o:eau', '🎂'], ['cadeau', 'k:c.a.d.o:eau', '🎁'],
  ['château', 'ch.a:â.t.o:eau', '🏰'], ['chapeau', 'ch.a.p.o:eau', '🎩'], ['sapin', 's.a.p.in', '🎄'], ['cochon', 'k:c.o.ch.on', '🐷'],
  ['dauphin', 'd.o:au.f:ph.in', '🐬'], ['bonbon', 'b.on.b.on', '🍬'], ['fusée', 'f.u.z:s.é:ée', '🚀'], ['ballon', 'b.a.l:ll.on', '🎈'],
  ['bougie', 'b.ou.j:g.i:ie', '🕯️'], ['souris', 's.ou.r.i', '🐭'], ['fleur', 'f.l.eu.r', '🌸'], ['crabe', 'k:c.r.a.b', '🦀'],
  ['plume', 'p.l.u.m', '🪶'], ['glace', 'g.l.a.s:c', '🍦'], ['fraise', 'f.r.è:ai.z:s', '🍓'], ['cloche', 'k:c.l.o.ch', '🔔'],
  ['plage', 'p.l.a.j:g', '🏖️'], ['clé', 'k:c.l.é', '🔑'], ['train', 't.r.in:ain', '🚆'],
  // 5 sons
  ['tomate', 't.o.m.a.t', '🍅'], ['carotte', 'k:c.a.r.o.t:tt', '🥕'], ['banane', 'b.a.n.a.n', '🍌'], ['tortue', 't.o.r.t.u', '🐢'],
  ['girafe', 'j:g.i.r.a.f', '🦒'], ['valise', 'v.a.l.i.z:s', '🧳'], ['salade', 's.a.l.a.d', '🥗'], ['sucette', 's.u.s:c.è:e.t:tt', '🍭'],
  ['canard', 'k:c.a.n.a.r', '🦆'], ['fourmi', 'f.ou.r.m.i', '🐜'], ['tambour', 't.an:am.b.ou.r', '🥁'], ['tulipe', 't.u.l.i.p', '🌷'],
  ['citron', 's:c.i.t.r.on', '🍋'], ['dragon', 'd.r.a.g.on', '🐉'], ['éléphant', 'é.l.é.f:ph.an', '🐘'],
  // 6 sons et plus
  ['cactus', 'k:c.a.k:c.t.u.s', '🌵'], ['chocolat', 'ch.o.k:c.o.l.a', '🍫'], ['ananas', 'a.n.a.n.a.s', '🍍'],
  ['trompette', 't.r.on:om.p.è:e.t:tt', '🎺'], ['pantalon', 'p.an.t.a.l.on', '👖'], ['kangourou', 'k.an.g.ou.r.ou', '🦘'],
  ['cravate', 'k:c.r.a.v.a.t', '👔'], ['parasol', 'p.a.r.a.s.o.l', '⛱️'], ['escargot', 'è:e.s.k:c.a.r.g.o', '🐌'],
  ['brocoli', 'b.r.o.k:c.o.l.i', '🥦'], ['tracteur', 't.r.a.k:c.t.eu.r', '🚜'], ['crocodile', 'k:c.r.o.k:c.o.d.i.l', '🐊'],
];

const segments = (w: Word) => w[1].split('.').map((seg) => seg.split(':'));
export const soundsOf = (w: Word): SoundId[] => segments(w).map(([s]) => s as SoundId);
/** Graphème de chaque son, dans l'ordre (« bateau » : b, a, t, eau). */
export const graphemesOf = (w: Word): string[] => segments(w).map(([s, g]) => g ?? s);

/** Groupe de consonnes : deux consonnes qui se suivent (fl, tr, kt…). */
const VOWELS = new Set(['a', 'i', 'o', 'u', 'é', 'è', 'e', 'eu', 'ou', 'on', 'an', 'in']);
export const hasCluster = (w: Word) => soundsOf(w).some((s, i, all) => i > 0 && !VOWELS.has(s) && !VOWELS.has(all[i - 1]));

export const LEVELS: Record<1 | 2 | 3, { min: number; max: number; clusters: boolean }> = {
  1: { min: 2, max: 3, clusters: false },
  2: { min: 3, max: 5, clusters: false },
  3: { min: 4, max: 8, clusters: true },
};

export function poolFor(level: 1 | 2 | 3): Word[] {
  const { min, max, clusters } = LEVELS[level];
  return WORDS.filter((w) => {
    const n = soundsOf(w).length;
    return n >= min && n <= max && (clusters || !hasCluster(w));
  });
}

/** Petits tambours posés au plus sur la piste. */
export const MAX_DRUMS = 10;
const NUMBERS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];

/**
 * Graphème écrit, avec c, g et s en couleur : ces lettres changent de son selon
 * la lettre qui suit (c/ç, g/ge, s/ss). Dans « ch » et « gn », elles font partie
 * d'un autre son et restent dans la couleur normale.
 */
export function cgsRuns(g: string): { text: string; letter?: 'c' | 'g' | 's' }[] {
  if (g === 'ch' || g === 'gn') return [{ text: g }];
  return [...g].map((ch) => {
    const letter = ch === 'ç' ? 'c' : ch;
    return letter === 'c' || letter === 'g' || letter === 's' ? { text: ch, letter } : { text: ch };
  });
}

export function graphemeEl(g: string, cls: string): HTMLElement {
  return h(
    'span',
    { class: cls },
    cgsRuns(g).map((r) => (r.letter ? h('span', { class: `tambour-cgs tambour-${r.letter}` }, r.text) : r.text)),
  );
}

function gestureCard(id: SoundId, grapheme: string | null): HTMLElement {
  const g = GESTURES[id];
  const photo = gesturePhoto(id);
  return h(
    'figure',
    { class: 'tambour-card', title: g.hint },
    photo ? h('img', { src: photo, alt: g.hint }) : h('span', { class: 'tambour-card-icon', 'aria-hidden': 'true' }, g.icon),
    grapheme ? graphemeEl(grapheme, 'tambour-card-label') : null,
    h('figcaption', {}, g.hint),
  );
}

export const game: QuizGame = {
  title: 'Le tambour des sons',
  instructions: 'Écoute le mot. Tape sur le tambour une fois pour chaque son que tu entends, puis appuie sur Valider.',
  levels: [
    { label: 'Mots courts', description: 'deux ou trois sons' },
    { label: 'Mots moyens', description: 'trois à cinq sons' },
    { label: 'Mots longs', description: 'quatre à huit sons, consonnes qui se suivent ; les lettres s’écrivent sous les tambours' },
  ],
  makeItem(level, rng, recent) {
    const pool = poolFor(level);
    // Le nombre de sons est tiré d'abord : les réponses sont équilibrées.
    const counts = [...new Set(pool.map((w) => soundsOf(w).length))];
    const n = pick(rng, counts);
    const same = pool.filter((w) => soundsOf(w).length === n);
    let entry = pick(rng, same);
    for (let i = 0; i < 10 && recent.includes(`son:${entry[0]}`); i++) entry = pick(rng, same);
    const [word, , emoji] = entry;
    const sounds = soundsOf(entry);
    const graphemes = graphemesOf(entry);
    // Niveau 3 : chaque tambour posé montre le graphème du son correspondant.
    const writeUnder = level === 3;
    const say = `Écoute : ${word}. Combien de sons ?`;
    return {
      key: `son:${word}`,
      prompt: 'Combien de sons entends-tu ?',
      say,
      stimulus: { emoji },
      explain: `${word} : ${graphemes.join(' · ')}. ${NUMBERS[n]} son${n > 1 ? 's' : ''}.`.replace(/^./, (c) => c.toUpperCase()),
      custom(el, answer, ctx) {
        el.classList.add('tambour-area');
        let fails = 0;
        let done = false;
        const track = h('div', { class: 'tambour-track', 'aria-live': 'polite', 'aria-label': 'Tambours posés' });
        const hints = h('div', { class: 'tambour-hints' });
        const note = h('p', { class: 'tambour-note', 'aria-live': 'polite' });

        const placed = () => track.querySelectorAll('.tambour-beat').length;
        const refresh = () => {
          validate.disabled = placed() === 0 || done;
          // 2e échec : les emplacements vides montrent combien de sons il faut.
          track.querySelectorAll('.tambour-slot').forEach((s, i) => s.classList.toggle('filled', i < placed()));
        };
        const addDrum = () => {
          if (done || placed() >= MAX_DRUMS) return;
          const index = placed();
          const beat = h(
            'div',
            { class: 'tambour-beat' },
            h('button', { class: 'tambour-small', type: 'button', 'aria-label': 'Enlever ce tambour', onclick: () => removeDrum() }, '🥁'),
            writeUnder && index < graphemes.length ? graphemeEl(graphemes[index], 'tambour-graph') : null,
          );
          const slot = track.querySelector('.tambour-slot:not(.filled)');
          if (slot) slot.append(beat);
          else track.append(beat);
          big.classList.remove('hit');
          void big.offsetWidth;
          big.classList.add('hit');
          refresh();
        };
        const removeDrum = () => {
          if (done) return;
          const all = track.querySelectorAll('.tambour-beat');
          all[all.length - 1]?.remove();
          refresh();
        };
        const clearTrack = () => {
          track.querySelectorAll('.tambour-beat').forEach((d) => d.remove());
          refresh();
        };

        /** Cartes des sons, dans l'ordre du mot ; elles s'allument une à une. */
        const showCards = (withGraphemes: boolean) => {
          const cards = sounds.map((s, i) => gestureCard(s, withGraphemes ? graphemes[i] : null));
          hints.replaceChildren(h('div', { class: 'tambour-cards' }, cards));
          cards.forEach((c, i) => {
            c.style.animationDelay = `${i * 0.5}s`;
            c.classList.add('lit');
          });
        };

        const big = h(
          'button',
          { class: 'tambour-big', type: 'button', 'aria-label': 'Taper un son', onclick: addDrum },
          '🥁',
        );
        const undo = h('button', { class: 'btn tambour-undo', type: 'button', onclick: removeDrum }, '⌫ Enlever');
        const validate = h(
          'button',
          {
            class: 'btn primary tambour-ok',
            type: 'button',
            disabled: true,
            onclick: () => {
              if (done) return;
              const count = placed();
              if (count === n) {
                done = true;
                track.classList.add('right');
                note.textContent = '';
                showCards(true);
                return answer(true, fails === 0 ? undefined : fails === 1 ? 'avec les gestes' : 'avec tous les indices');
              }
              fails++;
              track.classList.remove('shake');
              void track.offsetWidth;
              track.classList.add('shake');
              if (fails === 1) {
                clearTrack();
                showCards(false);
                note.textContent = 'Regarde les gestes et réécoute le mot.';
                ctx.speak(`Regarde les gestes. ${word}.`);
              } else if (fails === 2) {
                clearTrack();
                showCards(true);
                track.prepend(...sounds.map(() => h('span', { class: 'tambour-slot' })));
                note.textContent = 'Un tambour pour chaque carte.';
                ctx.speak(`Un tambour pour chaque son. ${word}.`);
              } else {
                done = true;
                track.classList.add('wrong');
                note.textContent = '';
                answer(false, `${count} au lieu de ${n}`);
              }
              refresh();
            },
          },
          '✓ Valider',
        );

        el.append(
          h('div', { class: 'tambour-play' }, big, h('div', { class: 'tambour-side' }, undo, validate)),
          track,
          note,
          hints,
        );
      },
    };
  },
};

export default quizGame(game);
