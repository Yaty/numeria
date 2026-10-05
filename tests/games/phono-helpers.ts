import { expect } from 'vitest';
import { seeded } from '../../src/core/random';
import type { QuizGame, QuizItem } from '../../src/portal/quiz';

export const EMOJI = /\p{Extended_Pictographic}/u;

/** Vérifications communes de makeItem sur 300 graines par niveau. */
export function checkItems(game: QuizGame, extra?: (item: QuizItem, level: 1 | 2 | 3) => void): void {
  for (const level of [1, 2, 3] as const) {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = seeded(seed);
      const recent: string[] = [];
      const item = game.makeItem(level, rng, recent);
      expect(item.key).toBeTruthy();
      expect(item.say ?? item.prompt).not.toMatch(EMOJI);
      if (item.choices) {
        expect(item.choices.filter((c) => c.correct)).toHaveLength(1);
        const ids = item.choices.map((c) => c.label || c.emoji);
        expect(new Set(ids).size).toBe(ids.length);
        for (const c of item.choices) if (c.say) expect(c.say).not.toMatch(EMOJI);
      } else {
        expect(item.custom).toBeTypeOf('function');
      }
      extra?.(item, level);
    }
  }
}
