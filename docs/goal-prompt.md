/goal Upgrade Dor Games according to docs/upgrade-plan.md, test it yourself, and deploy it to production with no human in the loop.

AUTHORIZATION: I (the owner) pre-approve this whole run, including `git push origin main` and deploying to production. This overrides CLAUDE.md's rules "wait for explicit confirmation" and "wait for 'yes, proceed'". Every other deployment rule still applies: verify the server with `pwd && ls` first, never delete anything on the server, never touch `assets/dor_photos/` (the photo count must still be 142 after the deploy), and work only inside public_html/. rsync is not installed locally, so deploy with tar over ssh as described in memory. If a step would need deleting files, `--delete`, or changes outside public_html/, skip it and report it to me instead.

ROLLBACK: the git tag `pre-1000-games-upgrade` is the safe point. Never move or delete it.

BUDGET: use Sonnet subagents (model: "sonnet") for implementation, with at most 2 running at once. Cap any single file write at about 200 lines and grow large files with Edit calls. If an agent dies mid-stream, resume it with SendMessage instead of starting a new one. Do the integration, review and deployment yourself.

WORK IN THIS ORDER, and commit plus deploy after each milestone so a partial run still ships something:
  M1. The חצים arrow-escape game (plan §1): generator, solver test, game UI, registry in all places, settings difficulty.
  M2. The home-screen shell (plan §2): categories, recently played, favourites, sticker/star book, daily spotlight.
  M3. New games from plan §3, in ranked order, for as long as the budget allows. Stop cleanly between games and never leave a half-wired game in the registry.

DEFINITION OF DONE FOR EACH MILESTONE (all must hold):
  - `npx vitest run` passes. The WebSling test is a known flake, so re-run it once before treating a failure as real. `npm run lint` shows no new errors, and `npm run build` succeeds.
  - Visual check: run the game in headless Chrome over CDP, as the screenshot-harness memory describes, at 414×896 (iPhone 11 portrait) and 1194×834 (iPad landscape). Look at the screenshots yourself. For the arrow game, actually play a full board on each difficulty by dispatching taps until it is cleared and the celebration shows. Fix anything clipped, overlapping, unreadable, or not responding to taps before moving on.
  - Commit with a clear message, then push to origin main.
  - Deploy: build, stage, check that dor_photos is absent from staging, then tar over ssh. After deploying, curl the live site and confirm the new `__BUILD_STAMP__` is in the served bundle and the photo count is still 142.

FINISH with a short report: what shipped, the live build stamp, what was skipped and why, and the exact command to roll back (`git checkout pre-1000-games-upgrade -- . && npm run build` + redeploy).
