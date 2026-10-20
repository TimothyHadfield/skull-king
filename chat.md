# Skull King: chat log

## 2026-10-20: real-table look (builder agent)
- Asked (Tim, via manager): make each game look like the real table "like you're looking through a camera ... connected to a user's glasses".
- Built: Play screen rebuilt from your seat on the shared `_table` kit. It has a wood table, opponents' fans of backs, bid tokens, won tricks face down, the trick in front of each player, the deck, your fanned hand and a score pad. Cards deal from the deck with a 3-D flip, opponents' cards turn up and the trick slides to the winner. Landscape keeps the actions on the right. sfx.js selectors were updated for the new seats. fx.js was re-copied at 1.0.3. Assets ?v=6. No rule changes.
- Verified: tests 37/9/5/9 pass. Scratch `table/skull-king/shots.mjs` covers 10 states (setup, bid 1, bid 10, mid trick, late trick, 8 players, 2-player ghost, game over, results, online `?netlocal=1`) at 393x659 WebKit, 1280x800, 320 and 659x393: 40/40 with no overflow and no console errors. Two read-only reviewer rounds; fixed what they found (8 names clipped at 320, the oval bid token, opponents' hands hidden in landscape, the trick ring spacing).
- Open: animations not watched in motion; tap width on a 10-card fan.

## 2026-10-20: sounds, celebrations, animations (builder agent)
- Asked (Tim, via manager): "add opptional sounds … win celebrations, and other fun annimations … customizable in the settings".
- Built: `js/fx.js` (shared 1.0.1, unchanged copy) + `js/sfx.js` (state diff → sounds + animations, custom yoho/cutlass/skullKing/mermaid/kraken/whale sounds); hooks in app.js (arm on applyAction/startGame/onNetSnap, illegal-tap shake, scorekeeper ticks/count-up/confetti); "Sound & effects" Settings group; CSS so its rows match the page; `.fx-still` turns off card deal/drop when Animations is off. Assets ?v=5. No rules changes; online.js untouched.
- Verified: `tests/fx.test.js` (9) failed before sfx.js existed, 11/11 mutations caught; engine/ai/online still pass. Headless WebKit 393x659 + 1280x800 (`sk-fx.mjs`, `score.mjs`, `net.mjs` in manager scratchpad `design/skull-king-fx/`): real taps, 0 errors, 0 overflow, confetti on a won game, storage blocked OK, online path (`?netlocal=1`) sounds in order; headless Chrome played every sound for real.
- Open: nobody has heard the sounds; real 2-phone room not tried.

## 2026-10-20: visual design pass (builder agent)
- Asked (manager, Tim's words): "review them again for design improvements especially visually."
- Built: play cards sized by count (hand one row or two even rows, up to 64/88 px; trick one slot per player), dimmed unplayable cards desaturated, hover/press lift, winning trick card lifts with gold name, turn chip glow, centred bid pad, felt message bigger; desktop Bid tab grid fixed (was pushed to the bottom) with the chart in a panel; odds table separated cells; dark custom select; settings groups no longer stretch; steppers/bonus chips/back button 40 px; picker 36 px; header centred; green ✓ for bids in; true minus on totals. Assets ?v=4. No rules/behaviour changes.
- Verified: tests 37/9/5 pass; scratch `design/sk-shots.mjs` 16 states x phone (393x659 WebKit) + 1280x800: 32/32 no overflow, no console errors; `?auto=1` full game to round 10 "over" with 0 errors; real tap flow (Deal, bid, play a card) works.
- Open: online lobby not re-screenshotted.

## 2026-10-20: QA fixes (builder agent)
- Asked (coordinator): fix 9 QA findings.
- Built: play log/round hands/sheet marker saved and restored (reload froze vs-computer games after round 1); advisor hand row is a wrapping grid with Clear beside it, picker numbers/specials split, `.adv` column capped and bid chart scrolls when wide; score Tricks blocks impossible totals; New→Undo re-renders the top bar; New keeps default names as placeholders; 6+ player side table uses short names; reload steps off a stale sheet history entry; failed join keeps the code; duplicate names refused in the lobby. Assets ?v=3.
- Verified: tests 37/9/5 pass; `scratchpad/sk-qa-verify.mjs` (reload bug reproduced on old live build, then 2 rounds played after reload with 0 errors locally; advisor 10/13/23 cards no overflow; 8p desktop table fits 274 px); `sk-qa-net.mjs` (bad code kept, duplicate "host " turned away, "Guest" seated).
- Open: mid-game rejoin by name is in shared online.js (flagged).

## 2026-10-19: first build + phase 2 (builder agent)
- **Asked:** Skull King site modelled on Cribbage: scorekeeper + bid advisor, full game vs computers with special cards and variants, then exact-rules online play, ideas, art, QA.
- **Built:** engine (all rules + variants), computers (easy/medium/hard), scorekeeper, advisor, card odds explorer, play tab with hint/study/odds, original SVG art (sub-agent), online rooms via shared `online.js` + `js/skgame.js` adapter, docs/rules-check.md (research sub-agent), docs/ideas.md.
- **Verified:** 51 node tests pass, and each one failed under a deliberate bug (50 mutations). Full games played to the end headless at 393 px (`?auto=1`, all extras), plus an online-path game through createLocal (`?netlocal=1`). Two WebKit browsers played one real online room to the end with identical scores, and the guest reloaded mid-game and came back. Every tab screenshotted at phone and laptop width, with no overflow and no exceptions.
- **Open:** a real-iPhone check, and 3+ people online.
