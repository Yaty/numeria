/**
 * Les sons du français et leurs gestes Borel-Maisonny (aide visuelle).
 *
 * Dessins et descriptions : « Les gestes Borel-Maisonny », Le blog de Chat noir
 * (Catherine Peronnet, 2020). Une image par son dans `src/assets/gestes/`, nommée
 * d'après l'identifiant du son (é → e-aigu, è → e-grave) ; un son sans image
 * garde son pictogramme.
 */

export type SoundId =
  | 'a' | 'i' | 'o' | 'u' | 'é' | 'è' | 'e' | 'eu' | 'ou' | 'on' | 'an' | 'in'
  | 'p' | 't' | 'k' | 'b' | 'd' | 'g' | 'f' | 's' | 'ch' | 'v' | 'z' | 'j'
  | 'l' | 'r' | 'm' | 'n' | 'gn';

export interface Gesture {
  /** Pictogramme de secours, si l'image du geste manque. */
  icon: string;
  /** Le geste, en quelques mots. */
  hint: string;
}

export const GESTURES: Record<SoundId, Gesture> = {
  a: { icon: '🖐️', hint: 'J’ouvre ma main et je dis « a ».' },
  i: { icon: '☝️', hint: 'Je lève mon doigt et je dis « i ».' },
  o: { icon: '👌', hint: 'Je forme un rond avec mes doigts et je dis « o ».' },
  u: { icon: '✌️', hint: 'Je lève mes deux doigts et je dis « u ».' },
  é: { icon: '🫸', hint: 'Je mets l’accent en avant et je dis « é ».' },
  è: { icon: '🫷', hint: 'Je mets l’accent en arrière et je dis « è ».' },
  e: { icon: '🫴', hint: 'Je fais un creux avec ma main et je dis « e ».' },
  eu: { icon: '🤏', hint: 'Je mets mon pouce entre mes deux doigts et je dis « eu ».' },
  ou: { icon: '👌', hint: 'Je forme un o et un u avec mes doigts et je dis « ou ».' },
  on: { icon: '👃', hint: 'Loin de mon nez, c’est « o ». Près de mon nez, c’est « on ».' },
  an: { icon: '👃', hint: 'Loin de mon nez, c’est « a ». Près de mon nez, c’est « an ».' },
  in: { icon: '👃', hint: 'Loin de mon nez, c’est « i ». Près de mon nez, c’est « in ».' },
  p: { icon: '✊', hint: 'Je ferme mon poing puis j’ouvre ma main et je dis « p ».' },
  t: { icon: '🤌', hint: 'Je pince la barre du T et je dis « t ».' },
  k: { icon: '👇', hint: 'Je montre le fond de ma bouche et je dis « c ».' },
  b: { icon: '🤚', hint: 'Je fais une bosse sur mon ventre puis j’ouvre ma main et je dis « b ».' },
  d: { icon: '🫲', hint: 'Je fais une bosse dans mon dos et je dis « d ».' },
  g: { icon: '🫱', hint: 'Je montre ma bouche et ma gorge et je dis « g ».' },
  f: { icon: '💨', hint: 'Je fais comme si je frottais fort et je dis « f ».' },
  s: { icon: '🐍', hint: 'Je fais un S avec mon doigt et je dis « s ».' },
  ch: { icon: '🤲', hint: 'Je prends mes joues et je dis « ch ».' },
  v: { icon: '✌️', hint: 'Je fais un V avec mes mains et je dis « v ».' },
  z: { icon: '🐝', hint: 'Mon doigt fait des zigzags et je dis « z ».' },
  j: { icon: '👉', hint: 'Je fais un point sur ma joue et je dis « j ».' },
  l: { icon: '🤫', hint: 'Je mets mon doigt sur mes lèvres et je dis « l ».' },
  r: { icon: '🫳', hint: 'Je montre ma gorge qui gratte et je dis « r ».' },
  m: { icon: '🤟', hint: 'Je fais le monstre à trois pattes en disant « m ».' },
  n: { icon: '👃', hint: 'Je mets mes doigts sur mon nez et je dis « n ».' },
  gn: { icon: '👃', hint: 'Je fais glisser mon doigt autour de mon nez et je dis « gn ».' },
};

export const isSound = (s: string): s is SoundId => s in GESTURES;

const FILE_NAMES: Record<string, SoundId> = { 'e-aigu': 'é', 'e-grave': 'è' };

/** Images des gestes : src/assets/gestes/<son>.<ext>. */
const PHOTOS: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../assets/gestes/*.{webp,png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' }),
  ).map(([path, url]) => {
    const name = path.replace(/^.*\/|\.[^.]+$/g, '');
    return [FILE_NAMES[name] ?? name, url];
  }),
);

export const gesturePhoto = (id: SoundId): string | undefined => PHOTOS[id];
