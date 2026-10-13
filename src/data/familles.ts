/**
 * Familles de mots (morphologie dérivationnelle) et vérification des réponses tapées.
 *
 * Chaque famille : le mot montré, puis les mots de la même famille acceptés. On
 * accepte une réponse sans accents ni majuscules (« deneiger » → déneiger, la bonne
 * orthographe est montrée), au pluriel ou au féminin régulier (+s, +x, +e, +es).
 * Les formes conjuguées ne comptent pas.
 *
 * Niveau 1 : familles transparentes du quotidien (dent → dentiste).
 * Niveau 2 : familles plus grandes, préfixes et suffixes variés (terre → atterrir).
 * Niveau 3 : radicaux qui changent de forme (pied → piéton, pédale ; mer → marin).
 */

export interface Family {
  word: string;
  members: readonly string[];
}

const f = (word: string, members: string): Family => ({ word, members: members.split(', ') });

export const FAMILIES: Record<1 | 2 | 3, readonly Family[]> = {
  1: [
    f('gonfle', 'gonfler, gonflable, gonflage, gonflement, gonfleur, gonflé, dégonfler, dégonflé, regonfler'),
    f('dent', 'dentiste, dentaire, dentier, dentifrice, dentition, édenté, dentelle, dentelé'),
    f('jardin', 'jardiner, jardinier, jardinière, jardinage, jardinet'),
    f('lait', 'laitier, laitière, laiterie, laitage, laiteux, allaiter, allaitement'),
    f('fleur', 'fleurir, fleuri, fleuriste, fleurette, refleurir, défleurir, floraison, floral'),
    f('chanter', 'chant, chanteur, chanteuse, chanson, chansonnette, chantonner, enchanter, enchanté, déchanter, rechanter'),
    f('jouer', 'jeu, joueur, joueuse, jouet, déjouer, rejouer, enjeu, jouable, injouable'),
    f('neige', 'neiger, enneigé, neigeux, enneigement, déneiger, déneigement, déneigeuse'),
    f('laver', 'lavage, lavabo, lavable, lavoir, laverie, laveur, délaver, relaver, lave-vaisselle, lave-linge, lavette'),
    f('nager', 'nage, nageur, nageuse, nageoire, natation'),
    f('coller', 'colle, collage, collant, décoller, décollage, recoller, autocollant'),
    f('couper', 'coupe, coupure, coupant, découper, découpage, recouper, coupe-ongles'),
    f('dessin', 'dessiner, dessinateur, dessinatrice, redessiner'),
    f('glace', 'glacier, glacière, glacé, glacial, glaçon, glacer, verglas, glaciaire'),
    f('sucre', 'sucrer, sucré, sucrier, sucrerie, sucrette'),
  ],
  2: [
    f('terre', 'terrain, terrestre, terrier, enterrer, enterrement, déterrer, atterrir, atterrissage, souterrain, territoire, terreau, terrasse, extraterrestre, parterre'),
    f('long', 'longue, longueur, allonger, allongement, rallonger, rallonge, longer, longtemps, longuement, prolonger, prolongation'),
    f('blanc', 'blanche, blancheur, blanchir, blanchisserie, blanchâtre, blanchiment'),
    f('rouge', 'rougir, rougeur, rougeole, rougeâtre, rouget, rougeaud, rouge-gorge'),
    f('dormir', 'dortoir, dormeur, dormeuse, endormir, endormi, endormissement, rendormir'),
    f('feuille', 'feuillage, feuillu, effeuiller, feuilleton, feuilleter, feuillet, mille-feuille'),
    f('tourner', 'tour, tournant, tournée, retour, retourner, détour, détourner, contourner, entourer, autour, tournevis, tournesol, tournoyer'),
    f('porter', 'porteur, portable, portage, apporter, emporter, transporter, transport, importer, exporter, rapporter, reporter, supporter, comporter'),
    f('peindre', 'peinture, peintre, peint, repeindre, dépeindre'),
    f('vent', 'venter, venteux, ventilateur, ventiler, ventilation, éventail, paravent'),
    f('pluie', 'pleuvoir, pluvieux, parapluie, pluviomètre, pleuvoter, pluvial'),
    f('mont', 'montagne, montagnard, monter, montée, montant, remonter, démonter, surmonter, monticule, amont'),
    f('ami', 'amie, amitié, amical, amicale, amicalement, inamical'),
    f('fort', 'forte, force, fortement, forteresse, fortifier, renforcer, renfort, effort, efforcer'),
    f('sel', 'salé, saler, salière, dessaler, salin, saline, salaison, salure'),
  ],
  3: [
    f('pied', 'piéton, piétonne, piétiner, piétinement, trépied, pédale, pédaler, pédestre, pédicure, cale-pied'),
    f('main', 'manuel, manuellement, manette, manier, manipuler, manipulation, menotte, maintenir, manucure, manœuvre'),
    f('mer', 'marin, marine, maritime, amerrir, amerrissage, sous-marin, outre-mer'),
    f('lire', 'lecture, lecteur, lectrice, lisible, illisible, lisiblement, relire, relecture, liseuse'),
    f('jour', 'journée, journal, journaliste, journalier, bonjour, aujourd’hui, toujours, séjour, ajourner, abat-jour'),
    f('soleil', 'ensoleillé, ensoleillement, solaire, parasol, tournesol, solarium'),
    f('lune', 'lunaire, alunir, alunissage, lunette, luné, lundi'),
    f('nuit', 'nuitée, minuit, nocturne, nuitamment'),
    f('cheval', 'chevalier, chevalet, chevaucher, chevauchée, chevalin, cavalier, cavalière, cavalerie'),
    f('rire', 'rieur, rieuse, sourire, risible, dérisoire, dérision'),
    f('école', 'écolier, écolière, scolaire, scolarité, scolariser, préscolaire'),
    f('bord', 'border, bordure, déborder, débordement, aborder, abord, abordable, rebord'),
    f('arbre', 'arbuste, arbrisseau, arboré, arboriculteur, arborescent'),
    f('riche', 'richesse, richement, enrichir, enrichissement'),
    f('bois', 'boisé, boiserie, déboiser, déboisement, reboiser, reboisement, sous-bois'),
  ],
};

/** Minuscules, œ → oe, apostrophes et tirets unifiés ; sans accents sauf `keepAccents`. */
export function normalize(s: string, keepAccents = false): string {
  const n = s
    .trim()
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[’`]/g, "'")
    .replace(/\s*-\s*|\s+/g, '-');
  return keepAccents ? n.normalize('NFC') : n.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Pluriel et féminin réguliers d'une forme normalisée. */
const variants = (n: string) => [n, `${n}s`, `${n}x`, `${n}e`, `${n}es`];

export type Check =
  | { ok: true; member: string }
  | { ok: false; reason: 'vide' | 'depart' | 'deja' | 'inconnu'; member?: string };

/**
 * Vérifie une réponse tapée pour une famille ; `found` = mots déjà trouvés.
 * D'abord avec les accents (« gonflé » est un mot de la famille de « gonfle »),
 * puis sans : un mot du départ tapé sans accent reste le mot de départ.
 */
export function checkAnswer(family: Family, typed: string, found: readonly string[]): Check {
  if (!normalize(typed)) return { ok: false, reason: 'vide' };
  for (const keep of [true, false]) {
    const n = normalize(typed, keep);
    const same = (m: string) => normalize(m, keep) === n;
    const like = (m: string) => variants(normalize(m, keep)).includes(n);
    // un mot de la liste tel quel passe avant les variantes (« amie », famille de « ami »)
    const member = family.members.find(same) ?? (like(family.word) ? undefined : family.members.find(like));
    if (member) return found.includes(member) ? { ok: false, reason: 'deja', member } : { ok: true, member };
    if (like(family.word)) return { ok: false, reason: 'depart' };
  }
  return { ok: false, reason: 'inconnu' };
}

/** Points du k-ième mot trouvé dans une même famille (1er : 10, 2e : 20…) : chercher loin rapporte. */
export const pointsFor = (k: number) => 10 * k;
