/**
 * Lecture à voix haute (code verbal oral).
 *
 * Par défaut : une voix neuronale (Piper) calculée dans le navigateur. Elle est
 * téléchargée une fois (~60 Mo), puis gardée sur l'appareil et fonctionne hors
 * ligne. Les voix du système restent disponibles (utiles sur iPad / Mac, où
 * elles sont bonnes), mais sous Linux ou Android elles sont souvent robotiques.
 */
import type { VoiceId } from '@diffusionstudio/vits-web';

const VOICE_KEY = 'numeria-voix';

export const NEURAL_VOICES: { id: VoiceId; label: string }[] = [
  { id: 'fr_FR-siwis-medium', label: 'Siwis — voix de femme (recommandée)' },
  { id: 'fr_FR-tom-medium', label: 'Tom — voix d’homme' },
  { id: 'fr_FR-upmc-medium', label: 'UPMC — voix de femme' },
];
const DEFAULT_VOICE = `piper:${NEURAL_VOICES[0].id}`;

export type VoiceStatus =
  | { state: 'idle' }
  | { state: 'downloading'; percent: number }
  | { state: 'ready' }
  | { state: 'error'; message: string };

let enabled = true;
let systemVoices: SpeechSynthesisVoice[] = [];
let status: VoiceStatus = { state: 'idle' };
let statusVoice: VoiceId | null = null;
const listeners = new Set<(s: VoiceStatus) => void>();
const cache = new Map<string, Promise<string>>();
let playing: HTMLAudioElement | null = null;
let token = 0;

type Tts = typeof import('@diffusionstudio/vits-web');
let ttsModule: Promise<Tts> | null = null;
const tts = () => (ttsModule ??= import('@diffusionstudio/vits-web'));

export function isVoiceAvailable(): boolean {
  return 'speechSynthesis' in window || 'Audio' in window;
}

function refreshSystemVoices(): void {
  if (!('speechSynthesis' in window)) return;
  systemVoices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr'));
}

if ('speechSynthesis' in window) {
  refreshSystemVoices();
  window.speechSynthesis.addEventListener('voiceschanged', refreshSystemVoices);
}

export function systemFrenchVoices(): SpeechSynthesisVoice[] {
  return systemVoices;
}

export function chosenVoice(): string {
  try {
    return localStorage.getItem(VOICE_KEY) ?? DEFAULT_VOICE;
  } catch {
    return DEFAULT_VOICE;
  }
}

export function setChosenVoice(choice: string): void {
  try {
    localStorage.setItem(VOICE_KEY, choice);
  } catch {
    /* stockage indisponible : on garde la voix par défaut */
  }
  prepareVoice();
}

function neuralId(choice = chosenVoice()): VoiceId | null {
  return choice.startsWith('piper:') ? (choice.slice(6) as VoiceId) : null;
}

export function voiceStatus(): VoiceStatus {
  return status;
}

export function onVoiceStatus(cb: (s: VoiceStatus) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setStatus(s: VoiceStatus): void {
  status = s;
  for (const cb of listeners) cb(s);
}

let preparing: Promise<void> | null = null;

/** Télécharge la voix neuronale choisie si besoin (en arrière-plan). */
export function prepareVoice(): Promise<void> {
  const id = neuralId();
  if (!id) return Promise.resolve();
  if (statusVoice === id && (status.state === 'ready' || preparing)) return preparing ?? Promise.resolve();
  statusVoice = id;
  preparing = (async () => {
    try {
      const lib = await tts();
      if (!(await lib.stored()).includes(id)) {
        setStatus({ state: 'downloading', percent: 0 });
        const files = new Map<string, { loaded: number; total: number }>();
        await lib.download(id, ({ url, loaded, total }) => {
          files.set(url, { loaded, total });
          const sum = [...files.values()].reduce((a, f) => ({ loaded: a.loaded + f.loaded, total: a.total + f.total }), { loaded: 0, total: 0 });
          if (statusVoice === id) setStatus({ state: 'downloading', percent: Math.round((sum.loaded / Math.max(sum.total, 1)) * 100) });
        });
      }
      // échauffement : charge le moteur maintenant, pour que la 1re vraie lecture soit rapide
      await neuralAudio(id, 'Bonjour !').catch(() => undefined);
      if (statusVoice === id) setStatus({ state: 'ready' });
    } catch (e) {
      if (statusVoice === id) setStatus({ state: 'error', message: (e as Error).message });
    } finally {
      preparing = null;
    }
  })();
  return preparing;
}

function neuralAudio(id: VoiceId, text: string): Promise<string> {
  const key = `${id}|${text}`;
  let url = cache.get(key);
  if (!url) {
    url = tts()
      .then((lib) => lib.predict({ text, voiceId: id }))
      .then((wav) => URL.createObjectURL(wav));
    url.catch(() => cache.delete(key));
    cache.set(key, url);
  }
  return url;
}

function speakSystem(text: string): void {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  u.rate = 0.95;
  const choice = chosenVoice();
  const voice = systemVoices.find((v) => `system:${v.voiceURI}` === choice) ?? systemVoices[0];
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  }
  synth.speak(u);
}

export function stopSpeaking(): void {
  token++;
  playing?.pause();
  playing = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopSpeaking();
  else prepareVoice();
}

/**
 * Lit un texte. Avec la voix neuronale encore en téléchargement, on ne lit rien
 * (plutôt qu'une voix robotique) : l'interface affiche la progression.
 */
export function speak(text: string, force = false): void {
  if (!enabled && !force) return;
  stopSpeaking();
  const id = neuralId();
  if (!id) return speakSystem(text);
  if (status.state === 'error' && statusVoice === id) return speakSystem(text);
  if (status.state !== 'ready' || statusVoice !== id) {
    prepareVoice();
    return;
  }
  const mine = token;
  neuralAudio(id, text)
    .then((url) => {
      if (mine !== token) return;
      playing = new Audio(url);
      return playing.play();
    })
    .catch(() => speakSystem(text));
}
