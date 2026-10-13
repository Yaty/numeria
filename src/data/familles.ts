/**
 * Familles de mots (morphologie dérivationnelle) et vérification des réponses tapées.
 *
 * Chaque famille : le mot montré, puis les mots de la même famille acceptés. On
 * accepte une réponse sans accents ni majuscules (« deneiger » → déneiger, la bonne
 * orthographe est montrée), au pluriel ou au féminin régulier (+s, +x, +e, +es), et
 * en -é à la place de -er (« dégonflé » → dégonfler).
 * Les formes conjuguées ne comptent pas.
 *
 * Niveau 1 : familles transparentes du quotidien (dent → dentiste).
 * Niveau 2 : familles plus grandes, préfixes et suffixes variés (terre → atterrir),
 * radicaux qui changent de forme (pied → piéton, pédale ; mer → marin).
 */

export interface Family {
  word: string;
  members: readonly string[];
}

const f = (word: string, members: string): Family => ({ word, members: members.split(', ') });

export const FAMILIES: Record<1 | 2, readonly Family[]> = {
  1: [
    f('gonfle', 'gonfler, gonflable, gonflage, gonflement, gonfleur, gonflé, dégonfler, dégonflé, regonfler'),
    f('dent', 'dentiste, dentaire, dentier, dentifrice, dentition'),
    f('jardin', 'jardiner, jardinier, jardinière, jardinage, jardinet'),
    f('lait', 'laitier, laitière, laiterie, laitage, laiteux, allaiter, allaitement'),
    f('chanter', 'chant, chanteur, chanteuse, chanson, chansonnette, chantonner, enchanter, enchanté, déchanter, rechanter'),
    f('neige', 'neiger, enneigé, neigeux, enneigement, déneiger, déneigement, déneigeuse'),
    f('laver', 'lavage, lavabo, lavable, lavoir, laverie, laveur, délaver, relaver, lave-vaisselle, lave-linge, lavette'),
    f('nager', 'nage, nageur, nageuse, nageoire, natation'),
    f('coller', 'colle, collage, collant, décoller, décollage, recoller, autocollant'),
    f('couper', 'coupe, coupure, coupant, découper, découpage, recouper, coupe-ongles'),
    f('dessin', 'dessiner, dessinateur, dessinatrice, redessiner'),
    f('glace', 'glacier, glacière, glacé, glacial, glaçon, glacer, verglas, glaciaire'),
    f('sucre', 'sucrer, sucré, sucrier, sucrerie, sucrette'),
    f('porter', 'porteur, portable, portage, apporter, emporter, transporter, transport, importer, exporter, rapporter, reporter, supporter, comporter'),
  ],
  2: [
    f('fleur', 'fleurir, fleuri, fleuriste, fleurette, refleurir, défleurir, floraison, floral'),
    f('jouer', 'jeu, joueur, joueuse, jouet, déjouer, rejouer, enjeu, jouable, injouable'),
    f('terre', 'terrain, terrestre, terrier, enterrer, enterrement, déterrer, atterrir, atterrissage, souterrain, territoire, terreau, terrasse, extraterrestre, parterre'),
    f('long', 'longue, longueur, allonger, allongement, rallonger, rallonge, longer, longtemps, longuement, prolonger, prolongation'),
    f('blanc', 'blanche, blancheur, blanchir, blanchisserie, blanchâtre, blanchiment'),
    f('rouge', 'rougir, rougeur, rougeole, rougeâtre, rouget, rougeaud, rouge-gorge'),
    f('dormir', 'dortoir, dormeur, dormeuse, endormir, endormi, endormissement, rendormir'),
    f('feuille', 'feuillage, feuillu, effeuiller, feuilleton, feuilleter, feuillet, mille-feuille'),
    f('tourner', 'tour, tournant, tournure, tournée, retour, retourner, détour, détourner, contourner, entourer, autour, tournevis, tournesol, tournoyer'),
    f('peindre', 'peinture, peintre, peint, repeindre, dépeindre'),
    f('vent', 'venter, venteux, ventilateur, ventiler, ventilation, éventail, paravent'),
    f('pluie', 'pleuvoir, pluvieux, parapluie, pluviomètre, pleuvoter, pluvial'),
    f('mont', 'montagne, montagnard, monter, montée, montant, remonter, démonter, surmonter, monticule, amont'),
    f('ami', 'amie, amitié, amical, amicale, amicalement, inamical'),
    f('fort', 'forte, force, fortement, forteresse, fortifier, renforcer, renfort, effort, efforcer'),
    f('sel', 'salé, saler, salière, dessaler, salin, saline, salaison, salure'),
    f('marché', 'marchand, marchande, marchandise, marchander, marchandage, supermarché, hypermarché'),
    f('herbe', 'herbier, herbivore, herbage, herbacé, herbeux, désherber, désherbant, désherbage, herboriste'),
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
    f('chaud', 'chaude, chaleur, chaleureux, chaleureusement, chaudement, chaudière, chauffer, chauffage, chauffeur, réchauffer, réchauffement, échauffer, chauffe-eau'),
    f('froid', 'froide, froideur, froidement, refroidir, refroidissement, refroidi'),
    f('grand', 'grande, grandeur, grandir, grandement, agrandir, agrandissement, grandiose, grand-père, grand-mère, grands-parents'),
    f('nom', 'nommer, renommer, renommée, dénommer, surnom, surnommer, prénom, pronom, nominal'),
    f('roi', 'royal, royale, royaume, royauté, royalement, vice-roi'),
    f('poisson', 'poissonnier, poissonnière, poissonnerie, poissonneux'),
    f('fer', 'ferraille, ferrailleur, ferrer, ferronnier, ferronnerie, ferroviaire, ferreux, ferrure'),
    f('vie', 'vivre, vivant, vivante, survivre, survivant, revivre, vital, vitalité, vivace, vivement'),
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

/** Pluriel et féminin réguliers d'une forme normalisée ; -é(e)(s) pour un mot en -er. */
const variants = (n: string, keepAccents: boolean) => {
  const forms = [n, `${n}s`, `${n}x`, `${n}e`, `${n}es`];
  if (!n.endsWith('er')) return forms;
  const e = `${n.slice(0, -2)}${keepAccents ? 'é' : 'e'}`;
  return [...forms, e, `${e}e`, `${e}s`, `${e}es`];
};

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
    const like = (m: string) => variants(normalize(m, keep), keep).includes(n);
    // un mot de la liste tel quel passe avant les variantes (« amie », famille de « ami »)
    const member = family.members.find(same) ?? (like(family.word) ? undefined : family.members.find(like));
    if (member) return found.includes(member) ? { ok: false, reason: 'deja', member } : { ok: true, member };
    if (like(family.word)) return { ok: false, reason: 'depart' };
  }
  return { ok: false, reason: 'inconnu' };
}

/** Points du k-ième mot trouvé dans une même famille (1er : 10, 2e : 20…) : chercher loin rapporte. */
export const pointsFor = (k: number) => 10 * k;

export const MAX_CUSTOM = 30;

/**
 * Famille créée par les joueurs : le mot montré, puis ses mots séparés par des
 * virgules, des points-virgules ou des retours à la ligne. Doublons et mot de départ
 * retirés ; renvoie un message d'erreur si la famille est vide.
 */
export function parseFamily(word: string, text: string): Family | string {
  const w = word.trim().replace(/\s+/g, ' ');
  if (!w) return 'Écris le mot de départ.';
  const seen = new Set([normalize(w, true)]);
  const members: string[] = [];
  for (const raw of text.split(/[,;\n]/)) {
    const m = raw.trim().replace(/\s+/g, ' ');
    if (!m || seen.has(normalize(m, true))) continue;
    seen.add(normalize(m, true));
    members.push(m);
  }
  if (!members.length) return 'Écris au moins un mot de la famille.';
  return { word: w, members };
}
