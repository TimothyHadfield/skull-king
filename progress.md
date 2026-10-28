# Skull King: progress

## START HERE
Read in this order: this file → `CLAUDE.md` → `docs/rules-check.md` (rules and sources) → `docs/ideas.md`. Last updated **2026-10-28** (wave 3: Videos in the rules sheet, Slow speed, "Tap twice to play", remembered computer table, "Change rules" on the setup, Bendt's drawn cards marked New, Medium/Easy now use Cannonball, ladder measured under every option; assets ?v=15. Before that, improve pass: opens on Play, Undo + trick review, My stats/Daily/rules/guided first game, install + offline, richer number-card art, capture spotlight; assets ?v=13. Before that, the visibility pass: bigger trick and tokens, ?v=9; earlier: first build + phase 2 + QA fixes + visual design pass + sounds/celebrations/animations + real-table Play screen + weird-scenario edge pass, assets ?v=8).

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
| Edge pass (2026-10-20): 59 weird scenarios tested, 15 failed on the old code, all fixed (see "Edge pass" below) | Done |
| Improve pass (2026-10-27, vs BGA / competitor-analysis `card.md`): opens on Play (Score only while a scoresheet is in progress); Undo your last move vs computers (up to the round's results, never in the Daily); Review every trick of any round (results sheet + game over); shared kits copied unchanged: `_coach` (rules sheet, guided first game, seed 17), `_profile` 1.1.0 (My stats, achievements, Daily game; Hint/Undo games "with help" and unrated, leaving mid-game = a loss, tutorial and online not counted), `_pwa` 1.2.0 (home-screen install + offline); record line at game over (bids hit %, rounds, best round); Settings "Learn" group; richer number cards (suit-coloured card, big emblem, texture, paper corner tabs); a capture swells the winning card, a made 60+ round lights your chip | Done; live at 8a3cb7b + later commits; WebKit scripted check 27/27 (scratch `improve/skull-king/sk-check.mjs`), pwa-check 18/18 (2/18 on the old build) |
| Wave 3 (2026-10-28): every rule option already applies to computer games (Settings "Rules for new games" is shared by Score and Play); setup now has a "Change rules" button to Settings. Rules sheet "Videos" tab (5 YouTube links, each checked by oEmbed 200 + title). Settings: Computer speed Slow/Normal/Fast; "Tap twice to play a card" (off by default; first tap lifts, Play button or second tap plays). The computer table (seats + levels) is remembered. Bendt's 2 drawn cards show a gold "New" badge while you discard. AI: Medium picks Cannonball from a 16-deal study (Hard 40), Easy gambles 25% of the time (before: only Hard ever fired it) | Done; WebKit check 42/42 (scratch `sk-w3/check.mjs`, 25/42 on the old live build), 393/320/659-landscape/1280/1440 no overflow, 0 errors |
| Tests: engine 39, ai 12, online 5, fx 10, profile 9, learn 4 (all pass); the 3 new ai tests and learn tests were seen failing first; engine/ai/online each seen failing under a deliberate bug (50 mutations); fx test failed before sfx.js existed and caught 11/11 mutations; the spotlight test and profile tests were each seen failing first | Done |

## Edge pass (2026-10-20): weird scenarios
59 scenarios (rare rules, odd people, odd taps, odd devices, odd screens) in the manager's scratchpad `edge/skull-king/scenarios.md`, with scripts `rules.cjs`, `ui.mjs`, `da.mjs`, `extra.mjs`, `tap.mjs` and shots. 41 passed on the old code, 3 were only covered indirectly, 15 failed and are fixed (each seen failing first):
| Failure on the old code | Fix |
|---|---|
| 10-card hand: 27–33 px tap strips (phone/SE/landscape); Bendt's discards couldn't be picked from 11 cards | Hand goes to two rows when one row would be under 42 px per card; landscape stays one row (45–48 px); turning the phone re-lays it out |
| Hint froze the screen 4–9 s with no feedback; double-tap computed twice; tapped while computers were still bidding, it showed nothing (each computer bid wiped it) | "Thinking…" at once, computed once; a bid hint survives the computers' bids |
| Junk saved data (unknown schedule, broken play state or scoresheet) crashed screens | Validated on load and dropped |
| Blank / null bid read as 0; emoji names cut in half | Engine refuses it; names cut by whole characters |
| Harry −1 at bid 0 enabled but did nothing | Disabled |
| Scorekeeper at 320 px: names shrank to "…", Total and Bids/Tricks cut off | Name on its own line, everything fits |
| Scorekeeper 2 players: ghost's trick blocked "Next" | Fewer tricks allowed with 2 players |
| Cannonball: computers' secret picks showed early; "Cannonball or Grapeshot?" with no buttons after you picked | Hidden until all are in; "Waiting for the others…" |
| Ghost's trick showed "+30 bonus" | Not shown for the ghost |
| Leave from Settings left the "Leave game" row | Settings re-renders |
| Online: round ended behind "Leave this game?" and its results were lost | Results wait and show when the sheet closes |
| Online: a refused/unanswered move locked all taps | Taps free again after 6 s or on error |

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
Re-measured 2026-10-27 on the improve-pass code: Medium vs 3 Easy 46.3% (400 games), Hard vs 3 Medium 75% (60 games). Ladder holds; no AI change. Profile ratings from these: Easy 1200, Medium 1360, Hard 1750 (`js/skprofile.js`).
**Every option (2026-10-28, `node tools/variant-ladder.js <games> <A> <B> [variant|all] [players]`)**, Medium vs 3 Easy, 300 games each (fair 25%): base 50%, Kraken 41%, Whale 40%, Loot 44%, all three 40%, pirate powers 46%, Rascal 46%, Even Keeled 42%, Skip to the Brawl 37%, Broadside 56%, Whirlpool 39%, everything on 42%; Cannonball 46% → **61%** (400 games) after Medium learned it. 2 players (fair 50%): base 65%, extras 68%, powers 67%, Cannonball 65%. Hard vs 3 Medium, 24 games each: extras 79%, powers 71%, Rascal 67%, Cannonball 88%, Skip to the Brawl 58%, everything 92%. Ladder holds under every option.
BID_SCALE 1.15 chosen by tuning (medium mirror avg score: 0.7 → −21, 0.85 → 10, 1.15 → 83, 1.3 → 92).

## Authorized next steps
- (2026-10-19) Nothing pending from Tim. The manager adds the Hub card.

## Standing instructions (Tim's words)
- "also skull king" (the game list: a bidding-odds trick-taking game).
- "build regular play online with a computer or other online players for all the games and their common varients that match exactly the play of the in-person game… Brainstorm what additions you can do… Implement your good ideas… Really work on the webdesign… art… make sure that everything works properlly… Make sure to get everything right like rules and artwork and specific numbers of cards…"
- "add opptional sounds you can add to the games that reflect what's happening in the game accurately as well as win celebrations, and other fun annimations to go along with everything. Just make sure everything is customizable in the settings so the user can play as preffered." (2026-10-20)
- "could you also make sure that each of the games also have a look to them so that the game (either board or card layout) looks almost identical to how the board or card layout looks like in real life, so it's easy to understand if you've already played it before, and also so it feels more like you're actually playing in real life rather than you're playing it online. Even things like how youre cards or other things are laid out infront of you, make it look like they are actual cards laid out similar to how it looks like in real life. Make the decks look like actual decks. Make the board have the same design as it does in real life with the same layouts. It should look kind of like you're looking through a camera that is connected to a user's glasses that is playing in real life (not actually, but the layout and style of everything should be similar)." (2026-10-20)
- "I've noticed the games often have good user interfaces but could be improved especially when a scenario happens that the game might've not really thought about or whatnot. Could you focus on making each game perfect especially in scenarios that the game doesn't expect or are a little weird." (2026-10-20)
- "for a lot of the games the cards or board layout is too small to easily see what's going on. Some games just need small design imporvements like filling the screen with the board view and fitting the cards and other things in the empty space, some have severe errors like TTR. Fix this so the view of what's happening and where everything is is very clear. Consider parts of the board that are dense in what's happening and if the user can reasonably see it." (visibility pass, done 2026-10-27)
- From the common brief: real-table companion first; odds at the point of decision; computers with measured strength; study mode; dark phone-first look on the Hub tokens; $0; no copyrighted art or rule text.

## Traps
- **Kits re-copied 2026-10-27 (kitfix):** game-coach 1.1.0 (rules tabs wrap instead of scrolling sideways; a note beside a tall target keeps title + 2 lines + buttons) and game-pwa 1.3.0 (`data-extra` on the pwa.js tag caches files loaded later by script). Copies stay byte-identical to `../_coach` / `../_pwa`.
- **online.js cache stamp (2026-10-27):** every import of `js/online.js` uses `?v=a3d0418b`, the `_online` content stamp. After a re-copy: put the new stamp from `node ../_online/tools/stamp.mjs` there, bump the importing file's `?v=` (and pwa.js `data-version`), then `node ../_online/tools/stamp.mjs --check .` must say OK.
- `?auto=1` runs: phone-view's `wait:` step seemed to stall the page's timers; use `waitms:` steps instead.
- Never use PowerShell Get-Content/Set-Content on project files (mojibake on the UTF-8 card symbols). Edit tool only.
- `import()` inside a classic script resolves against the script URL in some engines: app.js builds the URL from `document.baseURI`.
- Online: rounds advance by themselves (skgame.js `settle`), so the round sheet is shown from history growth, not a `roundEnd` phase.
- WebKit logs "access control checks" page errors for Firestore channels when a page reloads mid-game; harmless (the reload resumes fine).
- Saved state is validated on load in app.js (schedule, scoring, speed, scoresheet, play state via `playStateOk`). A new saved field needs a check there too. Valid schedule keys: standard, evenKeeled, skipBrawl, swift, broadside, whirlpool, bedtime.
- Hand CSS uses `.hand .cardf` (not `.hand > .cardf`): a two-row hand nests cards in `.hrow` divs.
- Headless WebKit on a busy laptop runs 1–2 frames a second: Playwright `page.click` on a moving or disabled button hangs to the timeout. Click with `page.evaluate(() => el.click())`, and wait 3 s after a viewport change (resize re-render is debounced).
- WebKit logs "ResizeObserver loop completed with undelivered notifications" when the phone turns; it comes from the shared `js/table.js` (old code too) and is harmless.
- online.js (shared, not ours to edit) gives a mid-game seat back to anyone who joins with the same name while that player is away. The app now refuses a duplicate name in the lobby, but binding mid-game rejoin to the uid needs an online.js change (flagged to the manager).
- Port 8231 on this laptop may be another agent's server; use your own port.
- `js/fx.js` is shared: never edit it here; re-copy from `Board and Card Games/_fx/fx.js` (it changed 1.0.0 → 1.0.1 mid-build). Game sounds go in `js/sfx.js` via `FX.define`.
- Headless WebKit on Windows has no Web Audio: `FX.play` returns false there. Check sounds with a spy on `FX.play` (pattern: manager scratchpad `design/skull-king-fx/sk-fx.mjs`) or with `--engine chrome`, which really plays.
- `js/table.js`, `css/table.css` are shared `_table` kit copies: never edit them here; re-copy. Game-side table styles live in app.css under "play: the table from your seat".
- Re-rendered fanned cards slide in from x=0 unless `.table` has `tbl-instant` while mounting (`mountTable` adds it and removes it after 2 frames). Headless WebKit stalls transitions and shows that bug clearly.
- The global `.empty` class (padding 18px) once squashed the empty bid token into an oval; the token uses `nobid` now. Don't reuse generic class names on the table.
- sfx.js finds seats by `.seatbox[data-seat]` and bid numbers by `.bidtok`: keep those selectors if the table markup changes.
- Other agents' Python servers sit on "random" ports and serve other games: use a node server on port 0 (scratch `table/skull-king/serve.cjs`).
- `.trick` is `pointer-events: none`: it lies over the whole felt and once blocked taps on the score pad. Keep it that way.
- Trick cards are placed in px by `fitTrick` in app.js (after every render and on resize), not by CSS. It tries the biggest size that keeps every card under its seat, clear of the deck, pad and message. Changing the deck, pad or msg position changes the fit.
- Measuring scripts for the visibility pass (states, shots, check, taps) are in the manager scratchpad `vis/skull-king/`.
- Your moves vs computers go through `myMove(a)` in app.js (takes the Undo snapshot, then applies). A new move type must go through it too or Undo skips it. Undo marks the game `helped` (unrated).
- `PLAY.tricks` is the per-trick list kept for Review and the profile summary (pushed in `logTrick`); Undo trims it. It's saved with the play state.
- Profile data lives in localStorage `profile:skull-king` (shared kit). `js/profile.js`, `css/profile.css`, `js/coach.js`, `css/coach.css`, `js/pwa.js`, `sw.js`, `tools/pwa-check.mjs`, `tools/make-icons.mjs` are kit copies: never edit here, re-copy. Game parts are `js/skprofile.js` and `js/skcoach.js`.
- Each release bumps every `?v=` in index.html AND `data-version` on the pwa.js tag (the service worker cache key).
- `recordGame()` runs once per game (`PLAY.recorded`); leaving mid-game records a loss before the new game starts.
- The computer table is saved as top-level `setup` in `skullking:v1` and checked by `setupOk` on load. `PLAY.sel` is also used by "Tap twice"; clear it before a move (online snapshots don't go through `applyAction`'s reset).
- Sounds are driven by `PLAY.fxArmed/fxPrev` (set in `applyAction`, `startGame`, `onNetSnap`; consumed in `afterChange`). A new state path must arm it too or it will be silent.

## Decisions
- Medium bids from simulated expected tricks × 1.15; Hard = 40-sample determinized Monte Carlo with medium rollouts.
- Cannonball implemented from the 2021 Rascal add-on text (see rules-check.md).
- Online round results aren't paused; each player sees the results sheet when the round ends.
- 6+ players: the side "This game" table shows 3-letter names (full name on hover) so all columns fit.
- Score Tricks phase: Next is disabled until tricks add up to the hand size (fewer allowed with Kraken/Whale in play, or with 2 players since the ghost's tricks aren't entered).
- Edge pass choices made without Tim (2026-10-20): 10-card hand in two rows on phone (front row's odds badge moves to the card's bottom); scorekeeper rows at ≤360 px wrap to two lines (name above) and the Bids/Tricks switch narrows; Hint button says "Thinking…" while it works.
- Play layout (2026-10-20, replaces the row layout): one fanned hand (76 px cards on phone, 100 px on laptop); trick cards are anchored in front of each seat (`trickAnchor` in app.js). Phone on its side moves the actions to the right edge. Laptop seats curve down toward the sides.
- Table look choices made without Tim: dark wood; bids as wooden tokens with a black dot for Cannonball; won tricks as mini face-down cards; card names under trick cards dropped except Tigress's "as Pirate/Escape"; deck at the bottom-left; score pad as a tap target at the bottom-right on phone.
- Visibility pass (2026-10-27), choices made without Tim:
  - On an upright phone the deck and score pad sit in the top corners.
  - Trick cards grow up to 104 px on phone and 132 px on laptop.
  - Bid tokens are 22–24 px.
  - Won piles show at most 4 backs plus a white count.
  - Sideways phone: the seats span only the felt, and the buttons take the full right column.
  - The 8-player scoresheet stacks bid/won in each cell and cuts names to 5 letters.
  - The "many" side table starts at 5+ opponents.
  - Assets are ?v=9.
- Study "every hand" reveal is local-only (online it would leak hands).
- The 2025 expansion pack isn't implemented (rules unsettled).
- Sound & effects is a Settings group after "Help while playing"; the "Fast" there is animation speed, separate from Computer speed.
- Improve pass (2026-10-27), choices made without Tim: open on Play (tab order unchanged); a My stats / Daily game / Rules row under the computer setup; achievement names (First mate, Captain, Perfect voyage, Lie low, Siren song, Big haul, Full crew, Hat trick, Daily sailor); Daily = standard 10 rounds vs 3 Medium; record line in the game-over sheet; Undo allowed until the round's results; Settings "Learn" group replaces the inline rules; online games aren't recorded in My stats; number-card colours and textures; spotlight threshold 60 points.
- Wave 3 choices made without Tim: videos picked (publisher, Brimley Games 4-min, Rules Girl/Dice Tower 6-min, GameRules Studio, Taylor's Trick-Taking Table review); setting name "Tap twice to play a card"; Slow = 1.2 s per computer card (2.4 s after a trick); "Change rules" button text; "New" badge wording; Easy fires Cannonball 25% of the time.
- The big celebration fires only when YOU take the Skull King with a mermaid; others' captures get the `capture` sound only.

## NOT verified
- On Tim's real iPhone (only WebKit headless at 393 px).
- How the sounds actually sound (synthesised; heard by no one yet). Real audio playback checked only in headless Chrome (`FX.play` returned true for every event).
- Sounds in a real 2-phone online room (checked through `?netlocal=1` only).
- Online with 3+ real people at once and host hand-over when the host closes the tab (online.js handles it; not exercised here).
- 10-card hand on a laptop shorter than 800 px (checked at 1280x800 only).
- Online lobby screen after the design pass (needs a real room; `?netlocal=1` jumps straight into a game).
- Table animations (deal flip, turn-up, trick sliding to the winner) seen only as code and single frames; headless WebKit stalls transitions, so nobody has watched them play smoothly.
- Two-row hand on a real thumb (measured ≥45 px tap strips in WebKit only).
- Online netBusy 6 s release: no test could make the host refuse a move (reasoned fix).
- Wave 3: no video found that teaches only the Kraken/Whale/Loot cards (none checked covers them for sure); "Tap twice" online seen only by code (same myMove path); Hard vs Medium per option measured with 24 games only.
- Left as is (edge pass): online, the round's last trick isn't shown before the next deal (rounds advance at once by design); an online player named "You" or a computer's name reads ambiguously; a scorekeeper tie-break round stays after an earlier round is edited out of the tie (finish it with zeros).
- Real Skull King card size (poker size) is reasoned, not confirmed.
- Visibility pass, still small (measured 2026-10-27): at 320 px with 6–8 players the trick cards are 37 px with a 10.6 px index; the round-10 trick at 393 is 69 px; overlapping trick cards hide each other's bottom index (the top-left one shows); names are cut ("Ed…") in tight seats.
- Improve pass: install to home screen and offline play checked by pwa-check in headless browsers only, not on a real iPhone; the guided first game walked in WebKit to the Scoring step, not to the end; the spotlight seen firing (count) but not watched smoothly; landscape 659x393 not re-checked after this pass; review names are cut to 6 letters ("Edwar").
- The bid "✓" renders as "√" in headless WebKit on Windows (font fallback); expected fine on iPhone.
- Reload-with-sheet-open fix checked only via `history.state` after reload, not by pressing Back on a phone.

## Rejected / parked
- ~~Bid-accuracy heatmap~~: needs stored history; hit rate covers it.
- ~~Pass-the-phone~~: hidden hands; online rooms instead.
- ~~2025 expansion cards~~: rules unsettled.
