/**
 * Lecture à voix haute (code verbal oral).
 *
 * Uniquement des voix neuronales (Piper) calculées dans le navigateur : elles sont
 * téléchargées une fois (~60 Mo), gardées sur l'appareil et fonctionnent hors
 * ligne. Les voix du système (souvent robotiques) ne sont jamais utilisées : tant
 * que la voix n'est pas prête, rien n'est lu.
 */
import type { VoiceId } from '@diffusionstudio/vits-web';
import type { VoiceReply, VoiceRequest } from './voice.worker';

const VOICE_KEY = 'numeria-voix';

export const NEURAL_VOICES: { id: VoiceId; label: string }[] = [
  { id: 'fr_FR-siwis-medium', label: 'Siwis — voix de femme (recommandée)' },
  { id: 'fr_FR-tom-medium', label: 'Tom — voix d’homme' },
  { id: 'fr_FR-upmc-medium', label: 'UPMC — voix de femme' },
];
export const DEFAULT_VOICE: VoiceId = NEURAL_VOICES[0].id;

export type VoiceStatus =
  | { state: 'idle' }
  | { state: 'downloading'; percent: number }
  | { state: 'ready' }
  | { state: 'error'; message: string };

let enabled = true;
let status: VoiceStatus = { state: 'idle' };
let statusVoice: VoiceId | null = null;
const listeners = new Set<(s: VoiceStatus) => void>();
const cache = new Map<string, Promise<string>>();
let playing: HTMLAudioElement | null = null;
let token = 0;
/** Voix imposée pour cette page quand le stockage local est indisponible. */
let forced: VoiceId | null = null;

type Tts = typeof import('@diffusionstudio/vits-web');
let ttsModule: Promise<Tts> | null = null;
const tts = () => (ttsModule ??= import('@diffusionstudio/vits-web'));

export function isVoiceAvailable(): boolean {
  return 'Audio' in window;
}

export function isNeuralVoice(id: string): id is VoiceId {
  return NEURAL_VOICES.some((v) => v.id === id);
}

/** Voix choisie sur cet appareil (les anciens réglages « système » reviennent à la voix par défaut). */
export function chosenVoice(): VoiceId {
  try {
    const raw = (localStorage.getItem(VOICE_KEY) ?? '').replace(/^piper:/, '');
    return isNeuralVoice(raw) ? raw : DEFAULT_VOICE;
  } catch {
    return DEFAULT_VOICE;
  }
}

export function setChosenVoice(choice: string): void {
  const id = choice.replace(/^piper:/, '');
  if (!isNeuralVoice(id)) return;
  try {
    localStorage.setItem(VOICE_KEY, id);
  } catch {
    /* stockage indisponible : la voix reste choisie pour cette page */
    forced = id;
  }
  prepareVoice();
}

const currentVoice = (): VoiceId => forced ?? chosenVoice();

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

/** Télécharge la voix choisie si besoin (en arrière-plan). */
export function prepareVoice(): Promise<void> {
  const id = currentVoice();
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

/** Synthèse dans un worker : la page ne se fige pas, le modèle n'est chargé qu'une fois. */
let worker: Worker | null = null;
let workerFailed = false;
let nextId = 0;
const pending = new Map<number, { resolve: (b: Blob) => void; reject: (e: Error) => void }>();

function voiceWorker(): Worker | null {
  if (worker || workerFailed || typeof Worker === 'undefined') return worker;
  try {
    worker = new Worker(new URL('./voice.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    workerFailed = true;
    return null;
  }
  worker.onmessage = (e: MessageEvent<VoiceReply>) => {
    const p = pending.get(e.data.id);
    pending.delete(e.data.id);
    if ('wav' in e.data) p?.resolve(e.data.wav);
    else p?.reject(new Error(e.data.error));
  };
  worker.onerror = () => {
    // le worker n'a pas pu démarrer : on revient à la synthèse dans la page
    workerFailed = true;
    worker = null;
    for (const p of pending.values()) p.reject(new Error('voix indisponible'));
    pending.clear();
  };
  return worker;
}

function synthesize(id: VoiceId, text: string): Promise<Blob> {
  const w = voiceWorker();
  if (!w) return tts().then((lib) => lib.predict({ text, voiceId: id }));
  return new Promise((resolve, reject) => {
    const req = nextId++;
    pending.set(req, { resolve, reject });
    w.postMessage({ id: req, voiceId: id, text } satisfies VoiceRequest);
  });
}

function neuralAudio(id: VoiceId, text: string): Promise<string> {
  const key = `${id}|${text}`;
  let url = cache.get(key);
  if (!url) {
    url = synthesize(id, text).then((wav) => URL.createObjectURL(wav));
    url.catch(() => cache.delete(key));
    cache.set(key, url);
  }
  return url;
}

export function stopSpeaking(): void {
  token++;
  playing?.pause();
  playing = null;
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopSpeaking();
  else prepareVoice();
}

/**
 * Lit un texte avec la voix neuronale. Tant qu'elle se télécharge (ou si le
 * téléchargement a échoué), on ne lit rien plutôt qu'une voix robotique :
 * l'interface affiche l'état de la voix.
 */
export function speak(text: string, force = false): void {
  if (!enabled && !force) return;
  stopSpeaking();
  const id = currentVoice();
  if (status.state !== 'ready' || statusVoice !== id) {
    if (status.state !== 'error' || statusVoice !== id) prepareVoice();
    return;
  }
  const mine = token;
  neuralAudio(id, text)
    .then((url) => {
      if (mine !== token) return;
      playing = new Audio(url);
      return playing.play();
    })
    .catch(() => undefined);
}
