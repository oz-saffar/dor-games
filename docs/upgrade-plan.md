# Dor Games upgrade: ideas from "1000 Offline Games"

Rollback point: git tag `pre-1000-games-upgrade` (commit `e2c2120`).
`git checkout pre-1000-games-upgrade -- .` restores the code; redeploying that build restores prod.

## What the research found (2026-10-17)

- No single app owns the name. "1000 Offline Games" is a family of near-identical
  mini-game bundles on the App Store (Iram Shehzad, ID 6736561393; Connect Technologies
  FZE, ID 6739119699). Their home screen is a grid of game icons grouped by category,
  with XP/rank, daily challenges and streaks layered on top.
- Reviews complain about the same things every time: an ad after every game, close
  buttons that are hard to find, inflated game counts, and no instructions. **Copy none
  of that.** Dor's photo rewards already take the place of the ad slot.
- **The arrow game** is "Arrows – Puzzle Escape" (Lessmore GmbH, 4.8★, 100M+ downloads),
  plus many clones. The rules:
  - Every cell of a rectangular grid belongs to exactly one arrow. Arrows can be multi-cell
    "snakes" that bend, with the head at one end pointing up, down, left or right.
  - Tap an arrow. If the straight line from its head to the board edge is empty, the arrow
    slides out and its whole body follows its own path. Otherwise it is blocked.
  - Clear the whole board to win. A few hearts for blocked taps, no timer. A hint shows a
    safe move. The look is flat colour-coded arrows on a pale dotted grid.

## Plan, in priority order

### 1. חצים (arrows), the arrow-escape game: the headline feature
- id `arrow-escape`, folder `src/games/arrowEscape/`.
- Levels are **generated, and solvable by construction**: build the board in reverse by
  placing arrows one at a time so each new arrow's exit line is clear of the arrows already
  placed; tapping in reverse placement order then always works. Pin this with a test that
  solves every generated board with a greedy solver.
- Difficulty: קל = 4×4 board with straight 1–2-cell arrows; בינוני = 5×5 with some bent
  snakes; קשה = 6×6 or 7×7 with long snakes.
- For age 4: **no hearts and no fail state.** A blocked arrow wiggles, the arrow that blocks
  it flashes, and a soft "bump" sound plays. After about 8 seconds of no progress, gently
  pulse one arrow that can move. Each cleared board counts toward the photo celebration.
- Feel: the arrow follows its own body out (animate the path rather than a straight
  translate), plays a chime, and the board pops when it is empty. Colours come from the
  accent and `PLAY_COLORS` scale.
- Taps fire on `onPointerDown` (see CLAUDE.md, "Taps, not clicks"). Size the cells from
  both `vw` and `vh` for the iPhone 11 portrait and iPad landscape screens.

### 2. Home-screen shell upgrade (the part of "1000 games" that is worth copying)
- Group the grid by **icon categories, with no text needed** (numbers and letters, colours
  and shapes, puzzles, action, pretend play), shown as big tabs or section headers with an
  emoji or illustration.
- A "שיחקת לאחרונה" (played recently) row at the top, with the last 4 games played.
- Favourites: a heart on a long press, or toggled in settings. A ⭐ row.
- A **sticker book or star chart**: a star for every finished round, saved in
  localStorage. When there are enough stars, a sticker unlocks on a sticker page that Dor
  can open from the home screen. It never takes anything away, and missing a day costs
  nothing.
- A daily game spotlight: one highlighted tile per day, chosen deterministically from the
  date.

### 3. New games (each one simplified for a 4-year-old), ranked
1. **פופ-איט**: a sensory pop-it board. No fail state, just pops with haptics and sound,
   and it refills when every bubble is popped.
2. **מצא את ההבדלים** (find the differences): two pictures with 3 differences.
   Generated SVG scenes, where one scene with a few objects changed makes the pair.
3. **ארבע בשורה** (four in a row): a 6×5 board against a gentle AI that sometimes misses.
   Big chunky pieces that drop with a bounce.
4. **מיזוג חיות** (animal merge, a 2048-lite with pictures instead of numbers): drag two
   identical animals together to get a bigger animal. A small board that never locks up.
5. **מסדרים מטבח/ארון** (tidy the kitchen or closet, an ASMR sort): drag items onto their
   shelf by colour or type. `room-tidy` is related, so reuse its patterns.

Already covered by existing games, so skip these: water sort (מיון צבעים), memory, mazes,
puzzles and Simon.

## Constraints that always apply
Follow every rule in CLAUDE.md: the registry in all three places plus a bumped
`GAME_VISIBILITY_SCHEMA_VERSION`, accents from the palette, the tablet breakpoint, taps
rather than clicks, and never touching `dor_photos`.
