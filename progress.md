# Skull King: progress

## START HERE
Read in this order: this file → `CLAUDE.md` → `docs/rules-check.md` (rules and sources) → `docs/ideas.md`. Last updated **2026-10-20** (first build + phase 2 + QA fixes + visual design pass + sounds/celebrations/animations + real-table Play screen, assets ?v=6).

## Goal right now
A Skull King site for Tim's phone: a real-table scorekeeper and bid advisor (used most), plus the full game with exact rules against computers or friends online.

## Status
| Part | State |
|---|---|
| Scorekeeper (2–8 players, all schedules, bonuses, Rascal + Cannonball, Rascal bets, tie round) | Done |
| Bid advisor (trick-count chances, best bid by average points, Cannonball EV) + Card odds explorer | Done |
| Play vs computer (Easy / Medium / Hard), hint, study mode, odds on cards | Done |
| All variants: Kraken, White Whale, Loot, pirate powers, 2-player ghost, 8-player cap, 7 schedules | Done |
| Online rooms (code, seats = person or computer, reload resumes) | Done; two-browser game played to the end on the real Firebase project 2026-10-19 |
| Original SVG art for all 74 cards + icon | Done |
| QA round (2026-10-20): reload after round 1 froze vs-computer games (`PLAY.log` not restored); advisor hand/picker/chart overflow at 10/13/23 cards; impossible trick totals; New→Undo lost top buttons; 8-player side table clipped; stale sheet history on reload; duplicate online names; failed join cleared the code | Fixed; checked by scratch scripts `sk-qa-verify.mjs` + `sk-qa-net.mjs` (reload bug reproduced on the old live build first) |
| Visual design pass (2026-10-20): bigger hand/trick cards sized by count (hand = one row or two even rows, trick = one slot per player), centred bid pad, desktop Bid tab layout fixed, readable Game length dropdown, odds table corner specks gone, 40px steppers/bonus chips, true minus signs | Done; before/after screenshots in the manager's scratchpad `design/skull-king/` |
| Sound & effects (2026-10-20): shared `js/fx.js` 1.0.1 (copied unchanged from `_fx/`) + game-local `js/sfx.js` (state-diff → sounds/animations, 6 custom sounds); "Sound & effects" group in Settings; scorekeeper ticks/count-up/finish confetti | Done; see the event→sound map below |
| Real-table Play screen (2026-10-20): dark-wood table from the shared `_table` kit (`js/table.js` + `css/table.css`, byte copies). Opponents round the far side with a name plate, a fan of card backs and, in front of them, a bid token plus their won tricks as small face-down cards. Each trick card lies in front of whoever played it. The deck is on the table, your hand is fanned at the bottom, and a paper score pad on the table opens the round table on phone (the side panel shows it on laptop). Cards deal from the deck with a flip, opponents' cards turn up as they land, and the finished trick slides to the winner. fx.js re-copied at 1.0.3 | Done; research in the manager's scratchpad `table/skull-king/real.md`, before/after shots in `table/skull-king/` (10 states x 393, 1280, 320, 659-landscape: 40/40 with no overflow and no errors), 2 reviewer rounds |
| Tests: engine 37, ai 9, online 5, fx 9 (all pass); engine/ai/online each seen failing under a deliberate bug (50 mutations); fx test failed before sfx.js existed and caught 11/11 mutations | Done |

## Event → sound map (js/sfx.js; same for you, computers and online players)
| Event | Sound | Animation |
|---|---|---|
| Deal (new round) | `shuffle`, then `cardDeal` × cards (max 6) | hand cards deal in one after another |
| A bid / Cannonball choice locked in | `place` (soft knock) | none |
| All bids shown | `yoho` (custom: three fists on the table + rising "yo-ho-ho") | bid numbers pop in time with the fists |
| Cannonball revealed (anyone chose it) | `hit` | none |
| Card played: number / escape / Tigress-as-escape | `cardFlip` | card flies from your hand or the player's chip to its trick slot |
| Pirate / Tigress-as-pirate | `cutlass` (custom) | same |
| Skull King | `skullKing` (custom deep thud) | same |
| Mermaid | `mermaid` (custom harp run) | same |
| Kraken / White Whale | `kraken` / `whale` (custom) | same |
| Loot | `coins` | same |
| Trick taken (plain) | `cardSlide` | winner's chip pops; "+N" gold float if bonus points |
| Skull King takes pirates / pirate takes mermaid | `capture` | same |
| Mermaid takes the Skull King | `capture` + **big** celebration (stars) when it's you | same |
| Kraken trick sinks / Whale discards | `sink` / `splash` | trick shakes |
| Bendt draws 2 | `cardDeal` × 2 | none |
| Power used: Rosie / Harry / Juanita / Bendt discard / Rascal bet | `place` / `place` / `cardFlip` / `cardSlide` / `chips` (bet 10–20) | none |
| Your turn (play, power, Cannonball choice) | `turn` (only when it becomes yours) | your chip pulses |
| Illegal tap on a card | `error` | the card shakes |
| Round over | your bid made `ding`, missed `miss` | chip scores count up; ± points float on each chip |
| Game over | celebrate `win` (confetti in winners' colours) or `lose` | — |
| Scorekeeper | steppers `tick`, bonus + `coin`, Rascal bet `chips`, Bids in `yoho`, round scored `coins` | totals count up; finished sheet gets the win confetti |
Every other button: the shared quiet `tap`. Computer turns use the same sounds at the same volume.

## Measured strength (4 players, whole 10-round standard games, `tools/strength.js`)
| Seat 0 | vs 3× | Games | Seat-0 win share (fair 25%) | Avg gap | Bid hit (seat 0 / others) |
|---|---|---|---|---|---|
| Hard | Medium | 200 | **76%** | +247 | 68% / 57% |
| Hard | Easy | 200 | **86%** | +302 | 66% / 45% |
| Medium | Easy | 1000 | **46%** | +103 | 55% / 42% |
| Medium | Hard | 200 | **9%** | −131 | 61% / 60% |
| Easy | Medium | 1000 | **10%** | −112 | 41% / 55% |
BID_SCALE 1.15 chosen by tuning (medium mirror avg score: 0.7 → −21, 0.85 → 10, 1.15 → 83, 1.3 → 92).

## Authorized next steps
- (2026-10-19) Nothing pending from Tim. The manager adds the Hub card.

## Standing instructions (Tim's words)
- "also skull king" (the game list: a bidding-odds trick-taking game).
- "build regular play online with a computer or other online players for all the games and their common varients that match exactly the play of the in-person game… Brainstorm what additions you can do… Implement your good ideas… Really work on the webdesign… art… make sure that everything works properlly… Make sure to get everything right like rules and artwork and specific numbers of cards…"
- "add opptional sounds you can add to the games that reflect what's happening in the game accurately as well as win celebrations, and other fun annimations to go along with everything. Just make sure everything is customizable in the settings so the user can play as preffered." (2026-10-20)
- "could you also make sure that each of the games also have a look to them so that the game (either board or card layout) looks almost identical to how the board or card layout looks like in real life, so it's easy to understand if you've already played it before, and also so it feels more like you're actually playing in real life rather than you're playing it online. Even things like how youre cards or other things are laid out infront of you, make it look like they are actual cards laid out similar to how it looks like in real life. Make the decks look like actual decks. Make the board have the same design as it does in real life with the same layouts. It should look kind of like you're looking through a camera that is connected to a user's glasses that is playing in real life (not actually, but the layout and style of everything should be similar)." (2026-10-20)
- From the common brief: real-table companion first; odds at the point of decision; computers with measured strength; study mode; dark phone-first look on the Hub tokens; $0; no copyrighted art or rule text.

## Traps
- `?auto=1` runs: phone-view's `wait:` step seemed to stall the page's timers; use `waitms:` steps instead.
- Never use PowerShell Get-Content/Set-Content on project files (mojibake on the UTF-8 card symbols). Edit tool only.
- `import()` inside a classic script resolves against the script URL in some engines: app.js builds the URL from `document.baseURI`.
- Online: rounds advance by themselves (skgame.js `settle`), so the round sheet is shown from history growth, not a `roundEnd` phase.
- WebKit logs "access control checks" page errors for Firestore channels when a page reloads mid-game; harmless (the reload resumes fine).
- Saved state with an unknown `settings.schedule` key crashes render (`SK.SCHEDULES[S.schedule].name`). Valid keys: standard, evenKeeled, skipBrawl, swift, broadside, whirlpool, bedtime.
- online.js (shared, not ours to edit) gives a mid-game seat back to anyone who joins with the same name while that player is away. The app now refuses a duplicate name in the lobby, but binding mid-game rejoin to the uid needs an online.js change (flagged to the manager).
- Port 8231 on this laptop may be another agent's server; use your own port.
- `js/fx.js` is shared: never edit it here; re-copy from `Board and Card Games/_fx/fx.js` (it changed 1.0.0 → 1.0.1 mid-build). Game sounds go in `js/sfx.js` via `FX.define`.
- Headless WebKit on Windows has no Web Audio: `FX.play` returns false there. Check sounds with a spy on `FX.play` (pattern: manager scratchpad `design/skull-king-fx/sk-fx.mjs`) or with `--engine chrome`, which really plays.
- `js/table.js`, `css/table.css` are shared `_table` kit copies: never edit them here; re-copy. Game-side table styles live in app.css under "play: the table from your seat".
- Re-rendered fanned cards slide in from x=0 unless `.table` has `tbl-instant` while mounting (`mountTable` adds it and removes it after 2 frames). Headless WebKit stalls transitions and shows that bug clearly.
- The global `.empty` class (padding 18px) once squashed the empty bid token into an oval; the token uses `nobid` now. Don't reuse generic class names on the table.
- sfx.js finds seats by `.seatbox[data-seat]` and bid numbers by `.bidtok`: keep those selectors if the table markup changes.
- Other agents' Python servers sit on "random" ports and serve other games: use a node server on port 0 (scratch `table/skull-king/serve.cjs`).
- Sounds are driven by `PLAY.fxArmed/fxPrev` (set in `applyAction`, `startGame`, `onNetSnap`; consumed in `afterChange`). A new state path must arm it too or it will be silent.

## Decisions
- Medium bids from simulated expected tricks × 1.15; Hard = 40-sample determinized Monte Carlo with medium rollouts.
- Cannonball implemented from the 2021 Rascal add-on text (see rules-check.md).
- Online round results aren't paused; each player sees the results sheet when the round ends.
- 6+ players: the side "This game" table shows 3-letter names (full name on hover) so all columns fit.
- Score Tricks phase: Next is disabled until tricks add up to the hand size (fewer allowed only with Kraken/Whale in play).
- Play layout (2026-10-20, replaces the row layout): one fanned hand (76 px cards on phone, 100 px on laptop); trick cards are anchored in front of each seat (`trickAnchor` in app.js). Phone on its side moves the actions to the right edge. Laptop seats curve down toward the sides.
- Table look choices made without Tim: dark wood; bids as wooden tokens with a black dot for Cannonball; won tricks as mini face-down cards; card names under trick cards dropped except Tigress's "as Pirate/Escape"; deck at the bottom-left; score pad as a tap target at the bottom-right on phone.
- Study "every hand" reveal is local-only (online it would leak hands).
- The 2025 expansion pack isn't implemented (rules unsettled).
- Sound & effects is a Settings group after "Help while playing"; the "Fast" there is animation speed, separate from Computer speed.
- The big celebration fires only when YOU take the Skull King with a mermaid; others' captures get the `capture` sound only.

## NOT verified
- On Tim's real iPhone (only WebKit headless at 393 px).
- How the sounds actually sound (synthesised; heard by no one yet). Real audio playback checked only in headless Chrome (`FX.play` returned true for every event).
- Sounds in a real 2-phone online room (checked through `?netlocal=1` only).
- Online with 3+ real people at once and host hand-over when the host closes the tab (online.js handles it; not exercised here).
- 10-card hand on a laptop shorter than 800 px (checked at 1280x800 only).
- Online lobby screen after the design pass (needs a real room; `?netlocal=1` jumps straight into a game).
- Table animations (deal flip, turn-up, trick sliding to the winner) seen only as code and single frames; headless WebKit stalls transitions, so nobody has watched them play smoothly.
- A 9–10 card fan at 393 px leaves each card a strip about 27–35 px wide to tap (under the 40 px guideline); not tried on a real thumb.
- Real Skull King card size (poker size) is reasoned, not confirmed.
- The bid "✓" renders as "√" in headless WebKit on Windows (font fallback); expected fine on iPhone.
- Reload-with-sheet-open fix checked only via `history.state` after reload, not by pressing Back on a phone.

## Rejected / parked
- ~~Bid-accuracy heatmap~~: needs stored history; hit rate covers it.
- ~~Pass-the-phone~~: hidden hands; online rooms instead.
- ~~2025 expansion cards~~: rules unsettled.
