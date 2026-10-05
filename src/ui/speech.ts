let enabled = true;

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on) window.speechSynthesis?.cancel();
}

export function isVoiceAvailable(): boolean {
  return 'speechSynthesis' in window;
}

/** Lecture à voix haute en français (code verbal oral). */
export function speak(text: string): void {
  if (!enabled || !isVoiceAvailable()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  u.rate = 0.9;
  const voice = synth.getVoices().find((v) => v.lang.startsWith('fr'));
  if (voice) u.voice = voice;
  synth.speak(u);
}
