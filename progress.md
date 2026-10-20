# Skull King: progress

## START HERE
Read in this order: this file → `CLAUDE.md` → `docs/rules-check.md` (rules and sources) → `docs/ideas.md`. Last updated **2026-10-20** (first build + phase 2 + QA fixes + visual design pass, assets ?v=4).

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
| Tests: engine 37, ai 9, online 5 (all pass); each one seen failing under a deliberate bug (50 mutations, 51/51 covered) | Done |

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

## Decisions
- Medium bids from simulated expected tricks × 1.15; Hard = 40-sample determinized Monte Carlo with medium rollouts.
- Cannonball implemented from the 2021 Rascal add-on text (see rules-check.md).
- Online round results aren't paused; each player sees the results sheet when the round ends.
- 6+ players: the side "This game" table shows 3-letter names (full name on hover) so all columns fit.
- Score Tricks phase: Next is disabled until tricks add up to the hand size (fewer allowed only with Kraken/Whale in play).
- Play layout: hand cards up to 64 px (phone) / 88 px (laptop); more than 6 (phone) or 8 (laptop) cards split into two even rows. Bid pad up to 8 (phone) / 14 (laptop) per row. During bidding the empty trick area collapses so round 10 fits at 393x659.
- Study "every hand" reveal is local-only (online it would leak hands).
- The 2025 expansion pack isn't implemented (rules unsettled).

## NOT verified
- On Tim's real iPhone (only WebKit headless at 393 px).
- Online with 3+ real people at once and host hand-over when the host closes the tab (online.js handles it; not exercised here).
- 10-card hand on a laptop shorter than 800 px (checked at 1280x800 only).
- Online lobby screen after the design pass (needs a real room; `?netlocal=1` jumps straight into a game).
- The bid "✓" renders as "√" in headless WebKit on Windows (font fallback); expected fine on iPhone.
- Reload-with-sheet-open fix checked only via `history.state` after reload, not by pressing Back on a phone.

## Rejected / parked
- ~~Bid-accuracy heatmap~~: needs stored history; hit rate covers it.
- ~~Pass-the-phone~~: hidden hands; online rooms instead.
- ~~2025 expansion cards~~: rules unsettled.
