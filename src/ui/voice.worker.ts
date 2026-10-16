/**
 * Synthèse de la voix neuronale (Piper), hors du fil de la page.
 *
 * `predict` de vits-web recharge à chaque phrase le modèle (~60 Mo), les données
 * d'espeak (~18 Mo) et recrée le moteur d'inférence : la page se figeait plusieurs
 * secondes et la mémoire finissait par faire planter l'onglet. Ici, tout est chargé
 * une fois et gardé ; seul le petit programme de phonétisation est relancé (il
 * s'arrête après chaque phrase), à partir des octets déjà en mémoire.
 *
 * Messages : { id, voiceId, text } → { id, wav } ou { id, error } ; une demande
 * remplacée par une plus récente avant d'être traitée répond { error: 'remplacée' }.
 */
import * as ort from 'onnxruntime-web';
import { HF_BASE, ONNX_BASE, PATH_MAP, WASM_BASE, type VoiceId } from '@diffusionstudio/vits-web';
import { createPiperPhonemize } from 'piper-phonemize';
import { pcmToWav } from './wav';

export interface VoiceRequest {
  id: number;
  voiceId: VoiceId;
  text: string;
}
export type VoiceReply = { id: number; wav: Blob } | { id: number; error: string };

interface VoiceConfig {
  audio: { sample_rate: number };
  espeak: { voice: string };
  inference: { noise_scale: number; length_scale: number; noise_w: number };
  speaker_id_map: Record<string, number>;
}

ort.env.wasm.wasmPaths = ONNX_BASE;
ort.env.wasm.numThreads = 1;

const bytes = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.arrayBuffer();
};

/** Fichier de la voix gardé sur l'appareil par vits-web (OPFS), sinon téléchargé. */
async function voiceFile(url: string): Promise<Blob> {
  try {
    const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('piper');
    return await (await dir.getFileHandle(url.split('/').at(-1)!)).getFile();
  } catch {
    return new Blob([await bytes(url)]);
  }
}

let phonemizer: Promise<{ wasm: WebAssembly.Module; data: ArrayBuffer }> | null = null;
const phonemizerFiles = () =>
  (phonemizer ??= Promise.all([bytes(`${WASM_BASE}.wasm`).then((b) => WebAssembly.compile(b)), bytes(`${WASM_BASE}.data`)]).then(
    ([wasm, data]) => ({ wasm, data }),
  ));
phonemizerFiles().catch(() => (phonemizer = null));

async function phonemeIds(text: string, espeakVoice: string): Promise<number[]> {
  const { wasm, data } = await phonemizerFiles();
  return new Promise((resolve, reject) => {
    createPiperPhonemize({
      print: (line: string) => resolve(JSON.parse(line).phoneme_ids),
      printErr: (line: string) => reject(new Error(line)),
      instantiateWasm: (imports: WebAssembly.Imports, ready: (i: WebAssembly.Instance, m: WebAssembly.Module) => void) => {
        WebAssembly.instantiate(wasm, imports).then((i) => ready(i, wasm), reject);
        return {};
      },
      // copie : le module peut garder ou détacher le tampon
      getPreloadedPackage: () => data.slice(0),
      locateFile: (f: string) => (f.endsWith('.wasm') ? `${WASM_BASE}.wasm` : f.endsWith('.data') ? `${WASM_BASE}.data` : f),
    })
      .then((m: { callMain(args: string[]): void }) =>
        m.callMain(['-l', espeakVoice, '--input', JSON.stringify([{ text: text.trim() }]), '--espeak_data', '/espeak-ng-data']),
      )
      .catch(reject);
  });
}

const sessions = new Map<VoiceId, Promise<{ session: ort.InferenceSession; config: VoiceConfig }>>();
function sessionFor(voiceId: VoiceId) {
  let s = sessions.get(voiceId);
  if (!s) {
    const url = `${HF_BASE}/${PATH_MAP[voiceId]}`;
    s = Promise.all([voiceFile(`${url}.json`).then((b) => b.text()), voiceFile(url).then((b) => b.arrayBuffer())]).then(
      async ([json, model]) => ({ config: JSON.parse(json) as VoiceConfig, session: await ort.InferenceSession.create(model) }),
    );
    s.catch(() => sessions.delete(voiceId));
    sessions.set(voiceId, s);
  }
  return s;
}

async function synthesize({ voiceId, text }: VoiceRequest): Promise<Blob> {
  const { session, config } = await sessionFor(voiceId);
  const ids = await phonemeIds(text, config.espeak.voice);
  const { noise_scale, length_scale, noise_w } = config.inference;
  const feeds: Record<string, ort.Tensor> = {
    input: new ort.Tensor('int64', BigInt64Array.from(ids, BigInt), [1, ids.length]),
    input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)])),
    scales: new ort.Tensor('float32', Float32Array.from([noise_scale, length_scale, noise_w])),
  };
  if (Object.keys(config.speaker_id_map).length) feeds.sid = new ort.Tensor('int64', BigInt64Array.from([0n]));
  const { output } = await session.run(feeds);
  return pcmToWav(output.data as Float32Array, config.audio.sample_rate);
}

// lib DOM du projet : le postMessage du worker n'a qu'un argument
const post = (r: VoiceReply) => (self as unknown as { postMessage(m: VoiceReply): void }).postMessage(r);

// Une phrase à la fois. La page ne veut que la dernière demandée : celles qui
// attendaient encore sont abandonnées (l'enfant est déjà passé à la suite).
let waiting: VoiceRequest[] = [];
let busy = false;
async function run(): Promise<void> {
  if (busy) return;
  busy = true;
  while (waiting.length) {
    const req = waiting.pop()!;
    for (const old of waiting) post({ id: old.id, error: 'remplacée' });
    waiting = [];
    try {
      post({ id: req.id, wav: await synthesize(req) });
    } catch (err) {
      post({ id: req.id, error: String((err as Error)?.message ?? err) });
    }
  }
  busy = false;
}
self.onmessage = (e: MessageEvent<VoiceRequest>) => {
  waiting.push(e.data);
  void run();
};
