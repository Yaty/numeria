import { describe, expect, it } from 'vitest';
import { pcmToWav } from '../../src/ui/wav';

describe('pcmToWav', () => {
  it('en-tête WAV mono 16 bits et échantillons bornés', async () => {
    const wav = pcmToWav(Float32Array.from([0, 1, -1, 2]), 22050);
    const v = new DataView(await wav.arrayBuffer());
    expect(wav.size).toBe(44 + 8);
    expect(String.fromCharCode(...new Uint8Array(await wav.slice(0, 4).arrayBuffer()))).toBe('RIFF');
    expect(v.getUint32(24, true)).toBe(22050);
    expect([0, 1, 2, 3].map((i) => v.getInt16(44 + i * 2, true))).toEqual([0, 32767, -32767, 32767]);
  });
});
