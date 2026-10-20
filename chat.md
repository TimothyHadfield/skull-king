# Skull King: chat log

## 2026-10-19: first build + phase 2 (builder agent)
- **Asked:** Skull King site modelled on Cribbage: scorekeeper + bid advisor, full game vs computers with special cards and variants, then exact-rules online play, ideas, art, QA.
- **Built:** engine (all rules + variants), computers (easy/medium/hard), scorekeeper, advisor, card odds explorer, play tab with hint/study/odds, original SVG art (sub-agent), online rooms via shared `online.js` + `js/skgame.js` adapter, docs/rules-check.md (research sub-agent), docs/ideas.md.
- **Verified:** 51 node tests pass, and each one failed under a deliberate bug (50 mutations). Full games played to the end headless at 393 px (`?auto=1`, all extras), plus an online-path game through createLocal (`?netlocal=1`). Two WebKit browsers played one real online room to the end with identical scores, and the guest reloaded mid-game and came back. Every tab screenshotted at phone and laptop width, with no overflow and no exceptions.
- **Open:** a real-iPhone check, and 3+ people online.
