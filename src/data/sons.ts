/**
 * Mots illustrés découpés en sons, partagés par les jeux de conscience phonémique
 * (tambour des sons, réserve de l'écureuil).
 *
 * Mots retenus : découpage en sons stable. Écartés : e muet prononcé ou non selon la
 * région (« cerise »), oi / oin et semi-voyelles (« roi », « fille », « lion »), x.
 */
import type { SoundId } from '../portal/gestes';

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
