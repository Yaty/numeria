/**
 * Problèmes du détective (niveaux A à E). Chaque problème présente ses données
 * dans un des codes du triple code et demande la réponse dans un code
 * éventuellement différent : c'est le travail des relations entre codes.
 */
import { int, pick, shuffle, type Rng } from './random';

export type ProblemLevel = 'A' | 'B' | 'C' | 'D' | 'E';
export const PROBLEM_LEVELS: ProblemLevel[] = ['A', 'B', 'C', 'D', 'E'];
export type Code = 'arabe' | 'verbal' | 'analogique';
export type AnswerMode = 'clavier' | 'choix-verbal' | 'choix-analogique';
export type ProblemKind =
  | 'transcodage'
  | 'addition'
  | 'soustraction'
  | 'multiplication'
  | 'division'
  | 'aire'
  | 'proportionnalite'
  | 'deux-etapes'
  | 'fonction'
  | 'puissance';

export const KIND_LABELS: Record<ProblemKind, string> = {
  transcodage: 'Transcodage',
  addition: 'Addition',
  soustraction: 'Soustraction',
  multiplication: 'Multiplication',
  division: 'Division',
  aire: 'Aire',
  proportionnalite: 'Proportionnalité',
  'deux-etapes': 'Problème en deux étapes',
  fonction: 'Fonction',
  puissance: 'Puissance',
};

/** Texte, nombre dans un code, ou texte avec une lecture vocale différente. */
export type Segment = string | { n: number; code: Code } | { text: string; say: string };

export interface BarPart {
  value: number | '?';
}
export type Hint =
  | { type: 'barres'; rows: { label?: string; parts: BarPart[] }[]; total?: number | '?' }
  | { type: 'tableau'; header: string[]; rows: (number | '?')[][] }
  | { type: 'texte'; text: string };
export type Visual =
  | { type: 'grille'; w: number; h: number }
  | { type: 'machine'; rule: string | null; pairs: [number, number][]; input: number };

export interface Problem {
  kind: ProblemKind;
  statement: Segment[];
  answer: number;
  answerMode: AnswerMode;
  choices?: number[];
  hint: Hint;
  visual?: Visual;
}

export interface ProblemContext {
  level: ProblemLevel;
  /** Plus grande classe ouverte dans l'univers : fait grandir les nombres. */
  maxClass: number;
  codes: Code[];
}

const NEW_KINDS: Record<ProblemLevel, ProblemKind[]> = {
  A: ['addition', 'soustraction'],
  B: ['multiplication', 'division', 'aire'],
  C: ['proportionnalite', 'deux-etapes'],
  D: ['fonction'],
  E: ['puissance'],
};

export function kindsForLevel(level: ProblemLevel): ProblemKind[] {
  const idx = PROBLEM_LEVELS.indexOf(level);
  return ['transcodage', ...PROBLEM_LEVELS.slice(0, idx + 1).flatMap((l) => NEW_KINDS[l])];
}

const ANALOG_LIMIT = 1e6;
const MODE_OF: Record<Code, AnswerMode> = { arabe: 'clavier', verbal: 'choix-verbal', analogique: 'choix-analogique' };

function presentCode(rng: Rng, codes: Code[], ...values: number[]): Code {
  const usable = codes.filter((c) => c !== 'analogique' || values.every((v) => v < ANALOG_LIMIT));
  return usable.length ? pick(rng, usable) : 'arabe';
}

function answerModeFor(rng: Rng, codes: Code[], answer: number, exclude?: Code): AnswerMode {
  const usable = codes.filter(
    (c) => c !== exclude && (c !== 'analogique' || answer < ANALOG_LIMIT) && Number.isInteger(answer),
  );
  return usable.length ? MODE_OF[pick(rng, usable)] : 'clavier';
}

/** Distracteurs typiques des erreurs de numération : ±1 sur un rang, rang décalé, chiffres inversés. */
function distractors(rng: Rng, n: number, max: number): number[] {
  const digits = String(n).length;
  const candidates = new Set<number>();
  for (let k = 0; k < digits; k++) {
    candidates.add(n + 10 ** k);
    candidates.add(n - 10 ** k);
  }
  candidates.add(n * 10);
  if (n % 10 === 0) candidates.add(n / 10);
  if (digits >= 2) {
    const s = String(n).split('');
    const i = int(rng, 0, digits - 2);
    [s[i], s[i + 1]] = [s[i + 1], s[i]];
    candidates.add(Number(s.join('')));
  }
  const valid = [...candidates].filter((c) => c > 0 && c !== n && c < max && Number.isInteger(c));
  const chosen = shuffle(rng, valid).slice(0, 2);
  for (let extra = n + 2; chosen.length < 2; extra++) if (!chosen.includes(extra)) chosen.push(extra);
  return chosen;
}

function finalize(rng: Rng, p: Omit<Problem, 'choices'>): Problem {
  if (p.answerMode === 'clavier') return p;
  const max = p.answerMode === 'choix-analogique' ? ANALOG_LIMIT : Number.MAX_SAFE_INTEGER;
  return { ...p, choices: shuffle(rng, [p.answer, ...distractors(rng, p.answer, max)]) };
}

/** Nombre « rond » adapté à la classe : ≤ 50 aux unités, puis 2 chiffres significatifs. */
function nice(rng: Rng, maxClass: number): number {
  if (maxClass === 0) return int(rng, 2, 50);
  const top = 3 * maxClass;
  return int(rng, 2, 99) * 10 ** int(rng, Math.max(1, top - 2), top);
}

function scale(rng: Rng, maxClass: number): number {
  return maxClass === 0 ? 1 : 10 ** int(rng, 1, Math.min(3 * maxClass - 1, 5));
}

const num = (n: number, code: Code): Segment => ({ n, code });

function transcodage(rng: Rng, ctx: ProblemContext): Problem {
  let n: number;
  if (ctx.maxClass === 0) n = ctx.level === 'A' ? int(rng, 1, 100) : int(rng, 1, 999);
  else {
    // des zéros intercalés : piège classique du transcodage (2 004)
    const top = 3 * ctx.maxClass + int(rng, 0, 2);
    n = int(rng, 1, 9) * 10 ** top;
    for (let r = top - 1; r >= 0; r--) if (rng() < 0.45) n += int(rng, 1, 9) * 10 ** r;
  }
  const from = presentCode(rng, ctx.codes, n);
  const mode = answerModeFor(rng, ctx.codes, n, from);
  const question: Record<AnswerMode, string> = {
    clavier: 'Écris ce nombre en chiffres :',
    'choix-verbal': 'Choisis ce nombre écrit en lettres :',
    'choix-analogique': 'Choisis la bonne quantité :',
  };
  return finalize(rng, {
    kind: 'transcodage',
    statement: ['Une étiquette de l’usine est abîmée. ', num(n, from), ' ', question[mode]],
    answer: n,
    answerMode: mode,
    hint: {
      type: 'texte',
      text: 'Découpe le nombre en classes (milliards, millions, mille, unités) et pense aux rangs vides : ils valent 0.',
    },
  });
}

function addition(rng: Rng, ctx: ProblemContext): Problem {
  const a = nice(rng, ctx.maxClass);
  const b = nice(rng, ctx.maxClass);
  const code = presentCode(rng, ctx.codes, a, b);
  return finalize(rng, {
    kind: 'addition',
    statement: [
      'Le matin, l’usine a fabriqué ', num(a, code), ' caisses. L’après-midi, elle en a fabriqué ',
      num(b, code), '. Combien de caisses en tout ?',
    ],
    answer: a + b,
    answerMode: answerModeFor(rng, ctx.codes, a + b),
    hint: { type: 'barres', rows: [{ parts: [{ value: a }, { value: b }] }], total: '?' },
  });
}

function soustraction(rng: Rng, ctx: ProblemContext): Problem {
  let a = nice(rng, ctx.maxClass);
  let b = nice(rng, ctx.maxClass);
  if (a === b) a += ctx.maxClass === 0 ? 1 : 10;
  if (a < b) [a, b] = [b, a];
  const code = presentCode(rng, ctx.codes, a, b);
  const mode = answerModeFor(rng, ctx.codes, a - b);
  if (rng() < 0.5) {
    return finalize(rng, {
      kind: 'soustraction',
      statement: [
        'Il y avait ', num(a, code), ' caisses dans l’entrepôt. Un camion en emporte ', num(b, code),
        '. Combien en reste-t-il ?',
      ],
      answer: a - b,
      answerMode: mode,
      hint: { type: 'barres', rows: [{ parts: [{ value: b }, { value: '?' }] }], total: a },
    });
  }
  return finalize(rng, {
    kind: 'soustraction',
    statement: [
      'L’usine bleue a fabriqué ', num(a, code), ' jouets et l’usine rouge ', num(b, code),
      '. Combien de jouets de plus pour l’usine bleue ?',
    ],
    answer: a - b,
    answerMode: mode,
    hint: {
      type: 'barres',
      rows: [
        { label: 'bleue', parts: [{ value: a }] },
        { label: 'rouge', parts: [{ value: b }, { value: '?' }] },
      ],
    },
  });
}

function multiplication(rng: Rng, ctx: ProblemContext): Problem {
  const a = int(rng, 2, ctx.maxClass === 0 ? 10 : 9);
  const b = int(rng, 2, ctx.maxClass === 0 ? 10 : 9) * scale(rng, ctx.maxClass);
  const code = presentCode(rng, ctx.codes, a, b);
  return finalize(rng, {
    kind: 'multiplication',
    statement: [num(a, code), ' camions transportent chacun ', num(b, code), ' caisses. Combien de caisses en tout ?'],
    answer: a * b,
    answerMode: answerModeFor(rng, ctx.codes, a * b),
    hint: { type: 'barres', rows: [{ parts: Array.from({ length: a }, () => ({ value: b })) }], total: '?' },
  });
}

function division(rng: Rng, ctx: ProblemContext): Problem {
  const parts = int(rng, 2, ctx.maxClass === 0 ? 10 : 9);
  const each = int(rng, 2, ctx.maxClass === 0 ? 10 : 9) * scale(rng, ctx.maxClass);
  const total = parts * each;
  const code = presentCode(rng, ctx.codes, total, parts);
  return finalize(rng, {
    kind: 'division',
    statement: [
      'Il faut ranger ', num(total, code), ' caisses dans ', num(parts, code),
      ' camions, autant dans chaque camion. Combien de caisses par camion ?',
    ],
    answer: each,
    answerMode: answerModeFor(rng, ctx.codes, each),
    hint: {
      type: 'barres',
      rows: [{ parts: Array.from({ length: parts }, () => ({ value: '?' as const })) }],
      total,
    },
  });
}

function aire(rng: Rng, ctx: ProblemContext): Problem {
  const w = int(rng, 2, 10);
  const h = int(rng, 2, 8);
  const code = presentCode(rng, ctx.codes.filter((c) => c !== 'analogique'), w, h);
  return finalize(rng, {
    kind: 'aire',
    statement: [
      'Le sol de l’usine est un rectangle de ', num(w, code), ' carreaux de long et ', num(h, code),
      ' carreaux de large. Combien de carreaux faut-il pour le recouvrir ?',
    ],
    answer: w * h,
    answerMode: answerModeFor(rng, ctx.codes, w * h),
    hint: { type: 'texte', text: `Compte les carreaux d’une ligne, puis le nombre de lignes : l’aire, c’est ${w} × ${h}.` },
    visual: { type: 'grille', w, h },
  });
}

function proportionnalite(rng: Rng, ctx: ProblemContext): Problem {
  const a = int(rng, 2, 5);
  const k = int(rng, 2, 10) * scale(rng, ctx.maxClass);
  let c = int(rng, 2, 10);
  if (c === a) c++;
  const code = presentCode(rng, ctx.codes, a, a * k, c);
  return finalize(rng, {
    kind: 'proportionnalite',
    statement: [
      num(a, code), ' usines identiques fabriquent ', num(a * k, code), ' robots par jour. Combien de robots fabriquent ',
      num(c, code), ' usines ?',
    ],
    answer: c * k,
    answerMode: answerModeFor(rng, ctx.codes, c * k),
    hint: { type: 'tableau', header: ['usines', 'robots'], rows: [[a, a * k], [1, '?'], [c, '?']] },
  });
}

function deuxEtapes(rng: Rng, ctx: ProblemContext): Problem {
  const x = int(rng, 2, 9);
  const y = int(rng, 2, 10) * scale(rng, ctx.maxClass);
  const z = int(rng, 1, x * y - 1);
  const code = presentCode(rng, ctx.codes, x, y, z);
  return finalize(rng, {
    kind: 'deux-etapes',
    statement: [
      'L’usine remplit ', num(x, code), ' cartons de ', num(y, code), ' billes. Elle en vend ', num(z, code),
      '. Combien de billes reste-t-il ?',
    ],
    answer: x * y - z,
    answerMode: answerModeFor(rng, ctx.codes, x * y - z),
    hint: {
      type: 'barres',
      rows: [
        { label: 'cartons', parts: Array.from({ length: x }, () => ({ value: y })) },
        { label: 'billes', parts: [{ value: z }, { value: '?' }] },
      ],
    },
  });
}

function fonction(rng: Rng, ctx: ProblemContext): Problem {
  const big = 10 ** Math.min(ctx.maxClass, 2);
  const type = pick(rng, ['+', '−', '×'] as const);
  const k = type === '×' ? int(rng, 2, 9) : int(rng, 2, 20) * big;
  const apply = (x: number) => (type === '+' ? x + k : type === '−' ? x - k : x * k);
  const low = type === '−' ? k + 1 : 1;
  const inputs = new Set<number>();
  while (inputs.size < 4) inputs.add(type === '×' ? int(rng, 1, 12) : low + int(rng, 0, 30) * big);
  const [x, ...shown] = [...inputs];
  const showRule = rng() < 0.3;
  return finalize(rng, {
    kind: 'fonction',
    statement: [
      showRule
        ? 'Voici la machine à nombres et sa règle. Quel nombre sort si on met '
        : 'La machine à nombres transforme toujours les nombres de la même façon. Quel nombre sort si on met ',
      num(x, 'arabe'),
      ' ?',
    ],
    answer: apply(x),
    answerMode: answerModeFor(rng, ctx.codes, apply(x)),
    hint: { type: 'texte', text: 'Compare chaque nombre qui entre avec celui qui sort : on ajoute, on enlève ou on multiplie ?' },
    visual: { type: 'machine', rule: showRule ? `${type} ${k}` : null, pairs: shown.map((s) => [s, apply(s)]), input: x },
  });
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (e: number) => String(e).split('').map((d) => SUP[Number(d)]).join('');
const EXP_WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];

function puissance(rng: Rng, ctx: ProblemContext): Problem {
  const form = int(rng, 0, 2);
  if (form === 0) {
    const e = int(rng, 1, Math.min(9, 3 * ctx.maxClass + 3));
    const n = 10 ** e;
    return finalize(rng, {
      kind: 'puissance',
      statement: ['Combien vaut ', { text: `10${sup(e)}`, say: `dix puissance ${EXP_WORDS[e]}` }, ' ?'],
      answer: n,
      answerMode: answerModeFor(rng, ctx.codes, n),
      hint: { type: 'texte', text: `10${sup(e)}, c’est 1 suivi de ${e} zéro${e > 1 ? 's' : ''} : on multiplie ${e} fois par 10.` },
    });
  }
  if (form === 1) {
    const e = pick(rng, [3, 6, 9]);
    return finalize(rng, {
      kind: 'puissance',
      statement: [
        'Combien de zéros faut-il pour écrire ', num(10 ** e, 'verbal'), ' en chiffres ? C’est 10 puissance combien ?',
      ],
      answer: e,
      answerMode: 'clavier',
      hint: { type: 'texte', text: 'Chaque classe a 3 rangs. Mille, c’est la 2e classe : 1 et 3 zéros.' },
    });
  }
  const cube = rng() < 0.3;
  const a = cube ? int(rng, 2, 5) : int(rng, 2, 10);
  const e = cube ? 3 : 2;
  return finalize(rng, {
    kind: 'puissance',
    statement: [
      'Combien vaut ',
      { text: `${a}${sup(e)}`, say: `${a} ${cube ? 'au cube' : 'au carré'}` },
      ' ?',
    ],
    answer: a ** e,
    answerMode: answerModeFor(rng, ctx.codes, a ** e),
    hint: { type: 'texte', text: `${a}${sup(e)} = ${Array(e).fill(a).join(' × ')}` },
  });
}

const GENERATORS: Record<ProblemKind, (rng: Rng, ctx: ProblemContext) => Problem> = {
  transcodage,
  addition,
  soustraction,
  multiplication,
  division,
  aire,
  proportionnalite,
  'deux-etapes': deuxEtapes,
  fonction,
  puissance,
};

export function generateProblem(ctx: ProblemContext, rng: Rng = Math.random): Problem {
  const all = kindsForLevel(ctx.level).filter((k) => k !== 'transcodage' || ctx.codes.length >= 2);
  const fresh = NEW_KINDS[ctx.level];
  const review = all.filter((k) => !fresh.includes(k));
  const pool = review.length === 0 || rng() < 0.6 ? fresh : review;
  return GENERATORS[pick(rng, pool)](rng, ctx);
}

export function isCorrect(p: Problem, value: number): boolean {
  return Math.abs(value - p.answer) < 1e-9;
}
