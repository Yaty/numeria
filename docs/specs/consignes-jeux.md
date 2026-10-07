# Brief for writing a portal game (shared by all games)

Project: /home/hugo/dev/erell. A Vite + TypeScript project (strict, `erasableSyntaxOnly`:
no enums, no parameter properties), vanilla DOM through `h()` (src/ui/dom.ts). These are
speech-therapy games for French-speaking children aged 5 to 11. ALL user-facing text is in
French, correct and natural, addressed to the child with « tu ». Code comments are in
French, in the existing style.

## Contract
- One file per game: `src/games/<slug>.ts`, with a `default` export of type `GameModule`
  (src/portal/types.ts). It is detected automatically (import.meta.glob); never edit
  `src/portal/registry.ts`.
- For an item-based game, use the shared engine `quizGame` (src/portal/quiz.ts). Read
  it, along with the reference example `src/games/lecture-flash.ts`. The engine provides:
  3 levels, 10 items per round, an adaptive level, stars, voice and recorded
  attempts.
- Item types:
  - **`choices`**: buttons, exactly ONE `correct: true`.
  - **`custom`**: your own rendering inside the answer area. Call `answer(correct, detail)`
    exactly once. Reuse the CSS classes `.tiles`, `.tile`, `.tile.placed`, `.quiz-choice`, `.btn`.
- Optional CSS goes in `src/games/<slug>.css`, imported by the module, with classes
  prefixed by the slug. Do not modify the shared files (src/portal/*, src/ui/*,
  src/style.css). If the shared engine is genuinely missing something, say so in your
  report instead.
- Utilities: `src/core/random.ts` (pick, shuffle, int, seeded).
- Speech: `say` is read by a neural TTS (Piper). Never put emojis in `say`, and avoid
  abbreviations. An isolated phoneme cannot be pronounced: always write « le son [f] comme
  dans fusée », i.e. the grapheme plus an anchor word. To make a word heard, put it in
  the sentence (« Écoute : château. »).
- Images: emojis only. Each emoji must be unambiguous for a 6-year-old and match the
  word exactly. Rule out any doubtful emoji (when in doubt, drop the word). Avoid emojis
  that are recent (Unicode > 14) or that render poorly.

## Content quality (essential)
The content is checked by a speech therapist. Before writing data, read up on the clinical
practice (WebSearch is allowed: phonological-awareness exercises, the progression
syllable → rhyme → phoneme, etc.). Then:
- Every linguistic piece of data must be right: oral syllables (spoken French, the final
  mute e does not count: « pomme » = 1, « tomate » = 2), phonetic rhymes (not
  spelling-based), phonemes, spelling, grammar.
- Avoid ambiguous words (variable internal mute e such as « fenêtre », « cheval »,
  « petit »; regional pronunciations; homographs).
- A clear difficulty progression across the 3 levels, documented in the file's header
  comment.
- Enough data for variety: at least about 30 items per level, or a generator.
- `explain`: a short teaching explanation shown after a mistake. It gives the right
  answer and the trick.

## Mandatory tests
Write `tests/games/<slug>.test.ts` (vitest). It covers:
1. Data integrity (no duplicates, consistent fields, syllable counts or properties
   consistent with the declarations).
2. For each level, `makeItem` over at least 300 seeds (via `seeded`): exactly one correct
   choice, no duplicate labels among the choices, a non-empty `key`, and `say` without
   emojis.

To test `makeItem`, export the `QuizGame` definition separately, e.g.
`export const game: QuizGame = {...}; export default quizGame(game);`.

## Verification before reporting
- `npx tsc --noEmit -p .` and `npx vitest run tests/games` pass.
- A Vite server already runs on http://localhost:5199. Test page:
  `http://localhost:5199/play.html?jeu=<slug>&muet` (`muet` = no voice; what would be
  read shows up in the console as `[voix]` and attempts as `[essai]`).
- Screenshot script: `node /tmp/claude-1000/-home-hugo-dev/ce9390e8-eb81-4f5e-bacb-3e3192407508/scratchpad/shot.mjs <url> <out.png> [selector to click…]`.
  Run it from that scratchpad folder, which holds playwright-core. Write your own
  scripts there if you need more interactions. Look at the screenshots: intro, an item,
  feedback after an error, and on a narrow screen (400 px) if your rendering is custom.
  Play at least one full round in automation for custom renderings.
- Do not commit. Do not touch files other than yours.

## Final report (short)
For each game, give:
- slug;
- title;
- domain;
- target age (e.g. « 5-8 ans »);
- a 1-sentence description for parents;
- 2-4 clinical goals for the speech therapist (precise vocabulary);
- the 3 levels;
- plus anything you could not do or doubts about the content.
