/**
 * Les sons du français et leurs gestes Borel-Maisonny (aide visuelle).
 *
 * Chaque son a un pictogramme provisoire (émoji de main) et une description courte
 * du geste. Pour afficher une vraie photo du geste, déposer une image nommée d'après
 * l'identifiant du son dans `src/assets/gestes/` (ex. `ch.webp`, `an.jpg`) : elle est
 * détectée à la compilation et remplace le pictogramme.
 */

export type SoundId =
  | 'a' | 'i' | 'o' | 'u' | 'é' | 'è' | 'e' | 'eu' | 'ou' | 'on' | 'an' | 'in'
  | 'p' | 't' | 'k' | 'b' | 'd' | 'g' | 'f' | 's' | 'ch' | 'v' | 'z' | 'j'
  | 'l' | 'r' | 'm' | 'n' | 'gn';

export interface Gesture {
  /** Comment on écrit le plus souvent ce son (étiquette de la carte). */
  label: string;
  /** Pictogramme provisoire, en attendant une photo du geste. */
  icon: string;
  /** Le geste, en quelques mots (lisible par l'adulte, lu à l'enfant). */
  hint: string;
}

export const GESTURES: Record<SoundId, Gesture> = {
  a: { label: 'a', icon: '🖐️', hint: 'La main grande ouverte, la bouche grande ouverte.' },
  i: { label: 'i', icon: '☝️', hint: 'Un doigt levé, tout droit.' },
  o: { label: 'o', icon: '👌', hint: 'Les doigts font un rond.' },
  u: { label: 'u', icon: '✌️', hint: 'Deux doigts levés.' },
  é: { label: 'é', icon: '🫸', hint: 'La main penche en avant, comme l’accent du é.' },
  è: { label: 'è', icon: '🫷', hint: 'La main penche en arrière, comme l’accent du è.' },
  e: { label: 'e', icon: '🫴', hint: 'La main fait un petit creux.' },
  eu: { label: 'eu', icon: '🤏', hint: 'Le pouce glisse entre deux doigts.' },
  ou: { label: 'ou', icon: '👌', hint: 'Les doigts font un rond, puis deux doigts, et la main avance.' },
  on: { label: 'on', icon: '👃', hint: 'Le rond du o, tout près du nez.' },
  an: { label: 'an', icon: '👃', hint: 'La main ouverte du a, tout près du nez.' },
  in: { label: 'in', icon: '👃', hint: 'Le doigt levé du i, tout près du nez.' },
  p: { label: 'p', icon: '✊', hint: 'Le poing fermé s’ouvre d’un coup, avec la bouche.' },
  t: { label: 't', icon: '🤌', hint: 'Deux doigts pincent la petite barre du t.' },
  k: { label: 'c', icon: '👇', hint: 'Le doigt montre le fond de la bouche.' },
  b: { label: 'b', icon: '🤚', hint: 'La main droite fait un petit ventre devant.' },
  d: { label: 'd', icon: '🫲', hint: 'La main gauche fait une bosse derrière.' },
  g: { label: 'g', icon: '🫱', hint: 'On montre la bouche, puis la gorge.' },
  f: { label: 'f', icon: '💨', hint: 'La main frotte en avançant, on souffle longtemps.' },
  s: { label: 's', icon: '🐍', hint: 'Le doigt ondule comme un serpent.' },
  ch: { label: 'ch', icon: '🤲', hint: 'Les mains tiennent les joues.' },
  v: { label: 'v', icon: '✌️', hint: 'Les mains font un V.' },
  z: { label: 'z', icon: '🐝', hint: 'Le doigt vole en zigzag, comme une guêpe.' },
  j: { label: 'j', icon: '👉', hint: 'Un doigt fait un point sur la joue.' },
  l: { label: 'l', icon: '👅', hint: 'Le doigt monte devant les lèvres, comme la langue.' },
  r: { label: 'r', icon: '🫳', hint: 'La main sur la gorge : ça gratte.' },
  m: { label: 'm', icon: '🤟', hint: 'Trois doigts, les lèvres serrées : ça chante dans le nez.' },
  n: { label: 'n', icon: '✌️', hint: 'Deux doigts sur le nez : ça chante dans le nez.' },
  gn: { label: 'gn', icon: '👃', hint: 'Le doigt fait le tour du nez : il monte d’un côté, descend de l’autre.' },
};

export const isSound = (s: string): s is SoundId => s in GESTURES;

/** Photos de gestes déposées dans src/assets/gestes/<son>.<ext> (aucune par défaut). */
const PHOTOS: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../assets/gestes/*.{webp,png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' }),
  ).map(([path, url]) => [path.replace(/^.*\/|\.[^.]+$/g, ''), url]),
);

export const gesturePhoto = (id: SoundId): string | undefined => PHOTOS[id];
