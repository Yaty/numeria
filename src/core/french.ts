/**
 * Écriture des nombres en lettres (code verbal du triple code).
 * Deux orthographes : rectifiée 1990 (traits d'union partout, enseignée à l'école)
 * et traditionnelle.
 */
export type Orthographe = 'rectifiee' | 'traditionnelle';

const UNITS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
];
const TENS = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

function under100(n: number, sep: string, plural: boolean): string {
  if (n < 17) return UNITS[n];
  if (n < 20) return `dix-${UNITS[n - 10]}`;
  const t = Math.floor(n / 10);
  const u = n % 10;
  const et = `${sep}et${sep}`;
  if (t === 7) return u === 1 ? `soixante${et}onze` : `soixante-${under100(10 + u, sep, plural)}`;
  if (t === 8) return u === 0 ? (plural ? 'quatre-vingts' : 'quatre-vingt') : `quatre-vingt-${UNITS[u]}`;
  if (t === 9) return `quatre-vingt-${under100(10 + u, sep, plural)}`;
  if (u === 0) return TENS[t];
  return u === 1 ? `${TENS[t]}${et}un` : `${TENS[t]}-${UNITS[u]}`;
}

/** `plural` : « cents » / « quatre-vingts » prennent un s (faux devant « mille »). */
function under1000(n: number, sep: string, plural: boolean): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h === 0) return under100(rest, sep, plural);
  const cent = h === 1 ? 'cent' : `${UNITS[h]}${sep}cent${rest === 0 && plural ? 's' : ''}`;
  return rest === 0 ? cent : `${cent}${sep}${under100(rest, sep, plural)}`;
}

function integerWords(n: number, sep: string): string {
  if (n === 0) return 'zéro';
  const parts: string[] = [];
  const nouns: [number, string][] = [
    [1e9, 'milliard'],
    [1e6, 'million'],
  ];
  let rest = n;
  for (const [size, noun] of nouns) {
    const g = Math.floor(rest / size);
    rest %= size;
    if (g === 0) continue;
    parts.push(g === 1 ? `un${sep}${noun}` : `${under1000(g, sep, true)}${sep}${noun}s`);
  }
  const thousands = Math.floor(rest / 1000);
  rest %= 1000;
  if (thousands === 1) parts.push('mille');
  else if (thousands > 1) parts.push(`${under1000(thousands, sep, false)}${sep}mille`);
  if (rest > 0) parts.push(under1000(rest, sep, true));
  return parts.join(sep);
}

export function toFrenchWords(n: number, orthographe: Orthographe = 'rectifiee'): string {
  const sep = orthographe === 'rectifiee' ? '-' : ' ';
  const [intPart, decPart] = String(n).split('.');
  const words = integerWords(Number(intPart), sep);
  if (!decPart) return words;
  const zeros = decPart.match(/^0*/)![0].length;
  const decWords = [
    ...Array<string>(zeros).fill('zéro'),
    ...(zeros < decPart.length ? [integerWords(Number(decPart), sep)] : []),
  ];
  return `${words} virgule ${decWords.join(' ')}`;
}
