/**
 * Lecture à voix haute (code verbal oral). Les voix dépendent de l'appareil :
 * on choisit automatiquement la plus naturelle, et l'orthophoniste peut en
 * imposer une (mémorisée sur cet appareil).
 */
const VOICE_KEY = 'numeria-voix';
let enabled = true;
let voices: SpeechSynthesisVoice[] = [];

export function isVoiceAvailable(): boolean {
  return 'speechSynthesis' in window;
}

function refreshVoices(): void {
  voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr'));
}

if (isVoiceAvailable()) {
  refreshVoices();
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}

/** Plus le score est haut, plus la voix est naturelle. */
function score(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  let s = 0;
  if (/natural|neural|online|premium|enhanced|amélioré/.test(name)) s += 60; // voix neuronales Edge / Apple
  if (name.includes('google')) s += 40;
  if (/amélie|audrey|aurélie|thomas|marie|denise|henri|eloise|vivienne|remy|julie|paul/.test(name)) s += 25;
  if (/espeak|pico|mbrola|festival/.test(name)) s -= 100; // voix robotiques Linux
  if (v.lang === 'fr-FR' || v.lang === 'fr_FR') s += 10;
  return s;
}

/** Voix françaises de l'appareil, la meilleure en premier. */
export function frenchVoices(): SpeechSynthesisVoice[] {
  return [...voices].sort((a, b) => score(b) - score(a));
}

function storedVoiceURI(): string | null {
  try {
    return localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}

export function chosenVoiceURI(): string | null {
  return storedVoiceURI();
}

export function setChosenVoice(uri: string | null): void {
  try {
    if (uri) localStorage.setItem(VOICE_KEY, uri);
    else localStorage.removeItem(VOICE_KEY);
  } catch {
    /* stockage indisponible : on garde le choix automatique */
  }
}

function currentVoice(): SpeechSynthesisVoice | undefined {
  const uri = storedVoiceURI();
  return voices.find((v) => v.voiceURI === uri) ?? frenchVoices()[0];
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on && isVoiceAvailable()) window.speechSynthesis.cancel();
}

export function speak(text: string, force = false): void {
  if ((!enabled && !force) || !isVoiceAvailable()) return;
  const synth = window.speechSynthesis;
  if (voices.length === 0) refreshVoices();
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  u.rate = 0.95;
  const voice = currentVoice();
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  }
  synth.speak(u);
}
