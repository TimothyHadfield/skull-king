# Skull King: project rules

Live: https://timothyhadfield.github.io/skull-king/ · repo `TimothyHadfield/skull-king` (public, Pages from `main` root).
Read `progress.md` first. Tim's global rules (`~/.claude/CLAUDE.md`) and `Code Projects/CLAUDE.md` apply.

## Shape
- Static site, no build step. `index.html` + `css/app.css` + classic scripts `js/engine.js` (rules) → `js/ai.js` (computers, odds) → `js/art.js` (SVG faces) → `js/skgame.js` (online adapter) → `js/app.js` (UI). Shared kits copied unchanged: `js/fx.js`, `js/table.js`, `js/coach.js` + `css/coach.css` (rules sheet, guided first game), `js/profile.js` + `css/profile.css` (My stats, Daily), `js/pwa.js` + `sw.js` (install, offline). Game parts of the kits: `js/skcoach.js`, `js/skprofile.js`. `js/online.js` is the shared ES module, copied **unchanged** from `Board and Card Games/_online/` and loaded with a dynamic `import()` only when someone opens online play.
- Engine is pure: `newGame(config)`, `apply(state, action)` (returns a new state, throws if illegal), `view(state, seat)`, `whoActs(state)`. All randomness comes from `state.seed`. Keep it that way: online play depends on it.
- Bump the `?v=` numbers in `index.html` on every release (iPhone Safari caches hard).
- localStorage key `skullking:v1`, always inside try/catch. Online resume key `online.skull-king` belongs to online.js.

## Tests (run all before every push)
```
node tests/engine.test.js && node tests/ai.test.js && node tests/online.test.mjs && node tests/fx.test.js && node tests/profile.test.js && node tests/learn.test.js
```
Home-screen install + offline (WebKit, about 2 min): `node tools/pwa-check.mjs` (18 checks, config `tests/pwa-check.json`).
Strength: `node tools/strength.js <games> <levelA> <levelB> [players] [seed]` (hard is slow: about 7 s a game).

## Scripted checks
- `?auto=1`: a medium computer plays your seat and rounds advance on their own (end-to-end runs).
- `?netlocal=1`: the online screens driven by online.js's `createLocal` (no network).
- Two real browsers in one online room: `scratchpad/sk-two-browsers.mjs` pattern (Playwright from `~/.claude/tools`).

## Don'ts
- No rulebook text or official art (original SVG only). No Firebase changes from here: the shared project's rules live in `_online/`.
- Never edit `Hub/`, `PORTFOLIO.md` or the root manager files from this project.
