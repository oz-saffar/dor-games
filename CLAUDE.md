# Dor Games — Project Instructions

Hebrew educational game platform for Dor (דור), a 4-year-old. React 19 + Vite + Tailwind CSS + Framer Motion. 21 lazy-loaded games with Hebrew audio, RTL support, and Dor's personal photos as rewards.

## Git / GitHub

- Remote: `git@github.com:oz-saffar/dor-games.git` (branch: `main`)
- SSH key: `~/.ssh/github` (ed25519)
- Local repo config already sets `core.sshCommand = ssh -i ~/.ssh/github -o StrictHostKeyChecking=no`
- Push: `git push origin main`

## Production Server

- **Host:** `167.235.90.88` | **Port:** `22` | **User:** `dor_game1`
- **SSH key:** `~/.ssh/dor_games_deploy` (ed25519, already authorized on server)
- **Website root:** `/var/www/74ac68ad-ffcb-4ff8-a109-6be506b93664/public_html/`

Connect:
```bash
ssh -o StrictHostKeyChecking=no -i ~/.ssh/dor_games_deploy -p 22 dor_game1@167.235.90.88
```

## Deployment Rules (always follow)

1. **Verify server identity first** — run `pwd && ls` and show output before any changes
2. **Wait for explicit confirmation** before uploading anything
3. **Never delete files** unless user confirms
4. **Never touch `assets/dor_photos/`** — always exclude from rsync (photos live only on server)
5. **Only work inside `public_html/`**

## Standard Deploy Steps

1. `npm run build`
2. Copy `dist/` to `/tmp/deploy-staging/`
3. Show user what will be uploaded
4. Wait for "yes, proceed"
5. rsync excluding `dor_photos`:
```bash
rsync -avz -e "ssh -o StrictHostKeyChecking=no -i ~/.ssh/dor_games_deploy -p 22" \
  --exclude='assets/dor_photos' \
  /tmp/deploy-staging/ \
  dor_game1@167.235.90.88:public_html/
```
6. Verify with `find public_html -maxdepth 3 | sort`

## Game Registry

All games are registered in three places — always update all three when adding a game:
- `src/lib/gameComponents.js` — lazy import
- `src/lib/gamesConfig.js` — title, icon, accent colour (`hiddenByDefault: true` keeps a retired game selectable in settings but off by default)
- `src/lib/defaultConfig.js` — difficulty default + `AUTO_SHOW_GAME_IDS_V{N}` + bump `GAME_VISIBILITY_SCHEMA_VERSION`
- `src/App.jsx` — pass difficulty prop via spread
- `src/components/ConfigScreen.jsx` — difficulty state + save + reset + UI selector

## Games

| ID | Title | File | Notes |
|----|-------|------|-------|
| `dino-sneak` | דינוזאור מתגנב | `dinoSneak/DinoSneakGame.jsx` | Red-light/green-light stealth. Hold anywhere = dino tiptoes toward picnicking kids; a kid telegraphs a turn ("!" bubble) and you must release to freeze. Caught moving = kids laugh and scoot away. |
| `dino-stomp` | רעידת אדמה | `dinoStomp/DinoStompGame.jsx` | Lane timing. Tap a lane to slam a giant foot on kids sprinting across 3–4 perspective lanes. Miss = foot stuck briefly. Combo counter. |
| `web-sling` | רשת! | `webSling/WebSlingGame.jsx` | Spidey and His Amazing Friends. Pick a hero (Spidey / Ghost-Spider / Spin), then tap villains who pop up from rooftop ledges — Rhino, Doc Ock, Zola — or glide past on Green Goblin's glider. Every tap fires a web; a hit wraps the villain in a cocoon. **Endless — no win state, no celebration, and this game plays no sounds** (deliberate, per request). Characters are cut-out PNG sprites, see below. |
| `maze-rescue` | המבוך | `MazeRescueGame.jsx` | Randomised depth-first carve (`mazeRescue/mazeBuilder.js`), regenerated until `monotoneSolvable()` says the flag **cannot** be reached with ➡️ and ⬇️ alone — the exact property that was wrong before, checked directly and pinned by `mazeBuilder.test.js`. Grids are odd (9/11/13) so walls sit between passages, and the maze is left **perfect**: braiding it measurably hands the player back the plain down-and-right shortcut (26% → 2% of 7×7 mazes stayed honest). D-pad sits beside the maze in landscape, under it in portrait. |
| `photo-puzzle` | פאזל תמונות | `photoPuzzle/PhotoPuzzleGame.jsx` | The board takes the **photo's own aspect ratio** (probed from `naturalWidth/naturalHeight`) and the grid follows the picture, not the screen — cells are only square when the picture is. Never stretch the image to fill. |
| `monster-drag-chomp` | מפלצת מעל החברים | `monsterDragChomp/MonsterDragChompGame.jsx` | Drag the eater so its **mouth** lands on someone on the tray. A pill under the banner flips the whole thing round: a monster eating friends (`MonsterIllustration` + `PersonPuppet`), or a kid eating monsters (`KidIllustration` + `MonsterPuppet`). Everything that differs lives in the `MODES` table at the top of the file; the flip restarts the round. Both eaters share the 420×500 viewBox and a hinged lower jaw, and each declares its own mouth box in `MOUTH_INSET_BY_MODE` — that box, padded, *is* the hit test. Headcount (3–15) comes from settings and applies to both directions. Pinned by `monsterDragChomp.test.jsx`. |
| `snake-garden` | הנחש הרעב | `snakeGarden/SnakeGardenGame.jsx` | Snake, steered by finger — the head turns toward wherever you touch (full 360°, no D-pad). Eat fruit to grow; golden stars are worth double. Head touching its own body resets the length only — score and fruit already eaten are kept. The hedge is a **bumper rail**, not a wall: pushing into it glides the snake along and around corners, because steering it back inward used to reverse it onto its own trail. Canvas play layer; tuning lives in `snakeConfig.js` and is pinned by `snakeGarden.test.jsx`. |
| `arrow-escape` | חצים | `arrowEscape/ArrowEscapeGame.jsx` | Tap an arrow (a multi-cell snake with a triangular head) and it slides out along its own path if the straight ray from its head to the edge is clear of other arrows; otherwise it wiggles, the first blocker flashes, a soft bump plays. No fail state; hint pulse after ~8s. Boards come from `arrowBoard.js`: built by **reverse insertion** (each new arrow's ray is clear of arrows already placed; removal order is the reverse), so every board is solvable; pinned by `arrowBoard.test.js`. Tunables in `arrowConfig.js`. Arrow elements expose `data-arrow-id` / `data-movable`. |
| `pop-it` | פופ-איט | `popIt/PopItGame.jsx` | Sensory pop-it slab, no fail state and no timer. Tap a dome and it inverts with a synthesized pop (`popAudio.js`) and a 12ms haptic; popped bubbles only wobble. Clearing the slab celebrates, then it flips over and every bubble is raised again. Shape masks per difficulty in `popItConfig.js` (4×4, a 16-bubble heart, 6×6). Bubbles expose `data-bubble` / `data-popped`. |
| `spot-difference` | מצא את ההבדלים | `spotDifference/SpotDifferenceGame.jsx` | Two copies of a **generated** SVG scene (`sceneBuilder.js`, seeded: garden/beach/room/farm backdrop + 6–9 non-overlapping objects); the second has 3/4/5 differences (missing, recoloured, swapped, mirrored, bigger) that never overlap, pinned by `sceneBuilder.test.js`. Tap either picture to ring a difference on both. Misses only ripple — no penalty, no timer; a hint pulses after ~10s. Stacked in portrait, side by side in landscape. Targets expose `data-diff-id` / `data-found` / `data-picture`. |
| `animal-merge` | מיזוג חיות | `animalMerge/AnimalMergeGame.jsx` | A 2048-lite with pictures: drag (or tap-tap) two identical animals together to get the next one up the ladder 🐣→🐥→🐔→🐑→🐷→🐴→🐘→🐳. Board 3×3 / 4×3 / 4×4; goal 🐑 / 🐷 / 🐴. **Never locks up**: `spawn()` in `mergeLogic.js` guarantees a legal merge exists, pinned over 3000 seeded games by `mergeLogic.test.js`. No fail state, no timer. Tiles expose `data-tile` / `data-tier`. |
| `four-in-row` | ארבע בשורה | `fourInRow/FourInRowGame.jsx` | 6×5 connect-four against a smiling opponent (`Opponent.jsx`, reused by איקס עיגול). Tap a column; discs drop with a bounce. The AI in `fourInRowLogic.js` is deliberately **gentle** (easy misses most wins and blocks; medium always wins when it can; hard always blocks) and only looks one move ahead. Dor always starts. Opponent win or draw = a giggle and a fresh board, never a losing sound. Hooks: `data-column`, `data-cell`/`data-owner`, `data-turn`. |
| `kitchen-sort` | מסדרים מטבח | `kitchenSort/KitchenSortGame.jsx` | ASMR tidy-up of a kitchen cabinet; reuses `roomTidy/roomTidyConfig.js` helpers (do not rename them). Rounds alternate sorting **by colour** (shelf marked with a swatch) and **by type** (ghost silhouette). Drag or tap-item-then-shelf; a wrong shelf wobbles it back, no penalty. 2/3/4 shelves, 6/9/12 items. Doors close with a thunk, then the celebration. Hooks: `data-item`/`data-target-shelf`/`data-placed`, `data-shelf`. |
| `tic-tac-toe` | איקס עיגול | `ticTacToe/TicTacToeGame.jsx` | Tic-tac-toe with pictures: Dor picks 🦖 or 🚀 once (`dor-tic-tac-toe-piece` in localStorage), the opponent (four-in-row's `Opponent.jsx`) plays ⭐/🐙. Gentle one-ply AI in `ticTacToeLogic.js`, never minimax, so hard is still beatable. Dor always starts; a bot win or draw is "עוד פעם?" and a fresh board. Hooks: `data-cell`/`data-owner`, `data-turn`, `data-piece`. |

## רשת! character sprites

Sprites live in `public/assets/characters/` and are generated, never hand-edited:

```bash
node scripts/prepare-character-sprites.mjs [sourceDir]   # default: assets/character-sources/
```

The script keys out the background (border flood-fill, gradient-aware; or a
luminance key for plain white studio shots), drops stray blobs left over from
group-image crops, trims, scales to a uniform height, writes
`src/games/webSling/sprites.json`, and emits `character-sheet.png` to eyeball.

- Source images go in `assets/character-sources/`, named after the character
  (`spidey.png`, `ghost-spider.webp`, `rhino.jpg`, …). Git-ignored.
- **Have sprites:** spidey, ghost-spider, spin, rhino, goblin
- **Still drawn SVG** (`Villains.jsx` fallback): `ock`, `zola` — their supplied
  sources are stills from the show with the full set behind them, so there is no
  flat backdrop to key. They need a cut-out or plain-background shot; drop one in
  and remove the `skip` flag in the script's `CHARACTERS` list.

Both dino games are pure slapstick — caught kids poof into stars and bounce off giggling, never harmed.

## Design system — Warm Paper & Clay

Soft Montessori: cream paper, warm charcoal ink, muted nature accents, tactile
depth instead of glow. Tokens live in `src/index.css` `:root` (+ a warm
`[data-theme='twilight']` override) and are aliased in `tailwind.config.js` as
`dor-*`; `src/lib/palette.js` mirrors the scale as plain hex for inline styles
and SVG.

- **Accent scale:** sage `#8fa98a`, terracotta `#c97b5a`, ochre `#d9a441`,
  dusty blue `#7e9bb5`, clay `#c08b8b`, moss `#6e8b6e`, plum `#9887a8`,
  sand `#c9b08a`. Every game's `accent` in `gamesConfig.js` must be one of these
  (enforced by `src/games/gameSmoke.test.jsx`).
- **Per-game theming:** `App.jsx` publishes the active game's accent as
  `--game-accent` on `<html>`. Games use `var(--game-surface)` for their
  full-bleed background and `var(--game-accent)` for chrome — both follow the
  light/dark theme automatically via `color-mix`. Never hardcode a game accent.
- **Depth:** 1px `--dor-border` + `--dor-shadow-card` + a 3px `--dor-lip` bottom
  edge (the `.dor-lip` / `shadow-dor-lip` helpers). No gradient rims, no glass
  blur, no neon glow — those were the old language and were removed.
- **Colour as mechanic:** מיון צבעים, צבעים, תופסים את הצבע, צורות and סיימון
  need hues that stay tellable apart, so they use `PLAY_COLORS` from
  `palette.js`, not the soft accent washes.
- **Type:** display = Varela Round, UI = Rubik (both Hebrew, loaded in `index.html`).

## Screen sizes

Two devices matter: **iPhone 11 portrait (414×896)** and **Dor's iPad 11" landscape
(~1194×834)**. `useViewport()` (`src/hooks/useViewport.js`) is the single source —
`isTablet` is `min(width, height) >= 700`, which separates every iPad from every
iPhone whichever way it is held.

- Most sizes are `clamp(min, Nvw, MAX)`; on a phone the `Nvw` term wins, so raising
  `MAX` behind `isTablet` is a no-op on the iPhone by construction. Prefer that.
- Where a layout stretches rows to fill the height (memory, סופרים ביחד), compute an
  explicit tile size from both `vw` and `vh` and centre the block instead.
- **Never change a phone-portrait value to fix the iPad.**

## Taps, not clicks

Games run behind a global `touchmove` + `preventDefault` scroll lock in `App.jsx`.
iOS swallows the click that follows a prevented touchmove, and a finger always drifts
a pixel or two — which is why memory cards used to need several presses. Two rules:

- The scroll lock skips any touch that starts on a control (`button`, `[role="button"]`,
  `a`, inputs, `[data-tap-target]`). Nothing can scroll behind a game anyway.
- For the primary tap target of a game, fire on `onPointerDown` and keep `onClick`
  only for keyboard activation (`e.detail === 0`), so a tap never counts twice.
- Never gate a tap target behind `disabled` during a timed reveal — a disabled
  button swallows `pointerdown` outright, and a child reads "nothing happened" as
  "press it again". Let the tap cut the reveal short instead (see זיכרון).

## Which build is live?

`vite.config.js` stamps `__BUILD_STAMP__` (UTC, minute precision) into the bundle
and the settings header shows it after "מסוף בקרה". When a fix seems not to have
landed, read that stamp first — it separates "not deployed / cached" from "not
fixed", which is otherwise guesswork.

## Settings screen

Difficulty is **not** a separate list: every game's own settings (difficulty,
piece/pair counts, the מרוץ 3D character) render on that game's row in the
משחקים tab, from the `gameControls` map in `ConfigScreen.jsx`. Hidden games show
no controls, so you can only tune a game that is actually on the home screen. Add
a game's setting there, and to `handleSave`/`handleReset`.

## Shared game components (src/components/game/)

- `GameBackButton` — exit button, fixed top-**right** (RTL), safe area aware
- `GameScoreBadge` — top-**left** score display, accent stripe on the inline start
- `GameInstructionsOverlay` — modal with title + Hebrew instructions + start button
- `GameCelebrationOverlay` — confetti + card + optional Dor photo (every N goals)

## Hooks

- `useSoundManager` — `playCorrect()`, `playWin()`, `playEncouragement()`, `startBgMusic()`, `stopBgMusic()`
- `useDorPhotos` — `getRandomPhoto()`, `hasPhotos` (photos live only on server, never in repo)
- `useIsLandscape` — from `useOrientation`
- `normalizeGameDifficulty` — from `gameDifficulties`

## Deployment note

Never rsync `assets/dor_photos/` — the folder exists only on the server (142 photos of Dor). The `--exclude='assets/dor_photos'` flag must always be present. Never use `--delete`.
