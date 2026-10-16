/** Phonétiseur Piper (Emscripten) livré dans vits-web, sans types ni export public. */
declare module 'piper-phonemize' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createPiperPhonemize(options: Record<string, unknown>): Promise<any>;
}
