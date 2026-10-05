/**
 * Numération de position : un rang (ordre) vaut 10^rang ; chaque groupe de trois
 * rangs forme une classe. Rangs -3..-1 = classe des décimales.
 */
export const MIN_RANK = -3;
export const MAX_RANK = 11;
export const MAX_CLASS = 3;

const CLASS_NAMES: Record<number, string> = {
  [-1]: 'décimales',
  0: 'unités',
  1: 'milliers',
  2: 'millions',
  3: 'milliards',
};
const CLASS_SUFFIX: Record<number, string> = { 1: ' de mille', 2: ' de millions', 3: ' de milliards' };
const ORDER_NAMES = ['unités', 'dizaines', 'centaines'];
const DECIMAL_NAMES: Record<number, string> = { [-1]: 'dixièmes', [-2]: 'centièmes', [-3]: 'millièmes' };

export function classOf(rank: number): number {
  return Math.floor(rank / 3);
}

/** 0 = unités, 1 = dizaines, 2 = centaines dans sa classe. */
export function orderOf(rank: number): number {
  return ((rank % 3) + 3) % 3;
}

export function className(cls: number): string {
  return CLASS_NAMES[cls];
}

export function rankName(rank: number): string {
  if (rank < 0) return DECIMAL_NAMES[rank];
  return ORDER_NAMES[orderOf(rank)] + (CLASS_SUFFIX[classOf(rank)] ?? '');
}

/** Lettre de colonne du tableau de numération : C D U, et d c m pour les décimales. */
export function rankLetter(rank: number): string {
  if (rank < 0) return { [-1]: 'd', [-2]: 'c', [-3]: 'm' }[rank]!;
  return ['U', 'D', 'C'][orderOf(rank)];
}

export function ranksOfClass(cls: number): number[] {
  // de gauche à droite
  return cls === -1 ? [-1, -2, -3] : [cls * 3 + 2, cls * 3 + 1, cls * 3];
}

/** Valeur d'un rang en millièmes (unité interne entière, évite les erreurs d'arrondi). */
export function milliValue(rank: number): number {
  return 10 ** (rank + 3);
}

export function toMilli(n: number): number {
  return Math.round(n * 1000);
}

export function fromMilli(m: number): number {
  return m / 1000;
}

export function digitAt(n: number, rank: number): number {
  return Math.floor(toMilli(n) / milliValue(rank)) % 10;
}

export function formatNumber(n: number): string {
  const [intPart, decPart] = String(n).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decPart ? `${grouped},${decPart}` : grouped;
}
