/* skprofile.js: Skull King's part of the player profile (shared kit js/profile.js, never edit that one here):
 * the computer levels' ratings, the achievements, the Daily game and turning a game into a result.
 *
 * What counts as one game: a whole game vs computers (or online). Leaving before the end counts as a loss.
 * A game where you used Hint or Undo counts as "with help" and isn't rated. The guided first game isn't counted.
 * Plain script: window.SKProfile in the browser, module.exports in node (tests/profile.test.js). */
(function (root) {
  'use strict';
  // Elo of each level from whole 4-player games, one level against three of another (tools/strength.js,
  // progress.md). A seat-0 win share s against a fair share of 1/4 is read as a head-to-head score
  // p = s / (s + (1 - s) / 3); difference = 400·log10(p / (1 − p)), rounded to 10. Easy anchored at 1200.
  //   Medium 46% vs 3 Easy -> p 0.72 -> +160.   Hard 76% vs 3 Medium -> p 0.90 -> +390.
  const LEVELS = [{ id: 'easy', name: 'Easy', rating: 1200 }, { id: 'medium', name: 'Medium', rating: 1360 }, { id: 'hard', name: 'Hard', rating: 1750 }];
  const RANK = { easy: 0, medium: 1, hard: 2 };

  const won = c => !!(c.last && c.last.won);
  const ex = c => (c.last && c.last.extra) || {};
  const ACH = [
    { id: 'first', title: 'First win', desc: 'Win a game of Skull King', test: c => c.stats.wins >= 1 },
    { id: 'medium', title: 'First mate', desc: 'Win against Medium', test: c => won(c) && RANK[c.last.level] >= 1 },
    { id: 'hard', title: 'Captain', desc: 'Win against Hard', test: c => won(c) && c.last.level === 'hard' },
    { id: 'perfect', title: 'Perfect voyage', desc: 'Hit every bid in a whole game', test: c => !ex(c).quit && ex(c).rounds >= 5 && ex(c).hits === ex(c).rounds },
    { id: 'zero', title: 'Lie low', desc: 'Bid 0 and make it with 8 or more cards', test: c => ex(c).bigZero >= 1 },
    { id: 'siren', title: 'Siren song', desc: 'Take the Skull King with a Mermaid', test: c => ex(c).siren >= 1 },
    { id: 'haul', title: 'Big haul', desc: 'Score 100 or more in one round', test: c => ex(c).best >= 100 },
    { id: 'crew', title: 'Full crew', desc: 'Win a game with 6 or more players', test: c => won(c) && ex(c).players >= 6 },
    { id: 'streak', title: 'Hat trick', desc: 'Win 3 in a row', test: c => c.stats.bestStreak >= 3 },
    { id: 'daily', title: 'Daily sailor', desc: '3-day Daily streak', test: c => c.daily.streak >= 3 },
  ];

  // Today's Daily game: the same deals for everyone that day. Standard rules and length, you + 3 Medium.
  const DAILY = { level: 'medium', computers: 3 };

  function init(onDaily) {
    if (!root.Profile) return false;
    root.Profile.init({
      game: 'skull-king', levels: LEVELS, achievements: ACH, draws: true,
      modes: { computer: { name: 'vs computer' }, help: { name: 'With help' }, online: { name: 'Online' } },
      daily: { title: 'Daily game', onPlay: () => onDaily && onDaily() },
    });
    return true;
  }

  /** The level a game vs computers is rated at: the strongest computer at the table. */
  function tableLevel(levels) {
    let best = null;
    (levels || []).forEach(l => { if (RANK[l] != null && (best == null || RANK[l] > RANK[best])) best = l; });
    return best;
  }

  /** What one game adds up to for me: bids hit, best round, rare moments. tricks = [{ r, w, how }]. */
  function summary(st, me, tricks) {
    let hits = 0, best = null, bigZero = 0;
    (st.history || []).forEach(h => {
      const r = h.results[me];
      if (!r) return;
      if (r.made) hits++;
      if (best == null || r.pts > best) best = r.pts;
      if (r.made && r.bid === 0 && h.cards >= 8) bigZero++;
    });
    const siren = (tricks || []).filter(t => t.w === me && t.how === 'mermaid-king').length;
    return { rounds: (st.history || []).length, hits, best: best == null ? 0 : best, bigZero, siren };
  }

  /** A finished (or abandoned) game -> Profile.recordResult input.
   *  g: { st, me, levels: [computer levels], helped, daily, online, tricks } */
  function result(g) {
    const st = g.st, me = g.me;
    const over = st.phase === 'over';
    let w = false, draw = false;
    if (over) {
      const win = root.SK ? root.SK.winners(st) : g.winners;
      if (win.indexOf(me) >= 0) { if (win.length > 1) draw = true; else w = true; }
    }
    const mode = g.online ? 'online' : g.helped ? 'help' : 'computer';
    const level = mode === 'computer' ? tableLevel(g.levels) : null;
    const extra = Object.assign(summary(st, me, g.tricks), { players: st.humans, score: st.scores[me] });
    if (!over) extra.quit = true;
    return { mode, level, won: w, draw, score: st.scores[me], daily: !!g.daily && mode !== 'online', extra };
  }

  const api = { LEVELS, ACH, DAILY, RANK, init, tableLevel, summary, result };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.SKProfile = api;
})(typeof window !== 'undefined' ? window : globalThis);
