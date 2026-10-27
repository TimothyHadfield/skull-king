// My stats + guided first game: the parts in js/skprofile.js and js/skcoach.js (pure, no page).
// Whole real games are played with tools/strength.js so the results come from real data shapes.
'use strict';
const assert = require('assert');
const SK = require('../js/engine.js');
globalThis.SK = SK; // skprofile.js reads the winners from the engine, as in the page
const SKP = require('../js/skprofile.js');
const SKC = require('../js/skcoach.js');
const AI = require('../js/ai.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.log('FAIL', name, '\n  ', e.message); }
}

// A whole game: seat 0 at level `me`, the others `others`; the trick list kept like app.js keeps it.
function play(seed, me, others, n, extra) {
  const levels = [me].concat(new Array((n || 4) - 1).fill(others));
  let st = SK.newGame(Object.assign({ players: levels.map((l, i) => ({ name: 'P' + i, kind: i ? 'cpu' : 'human', level: l })), seed, firstDealer: seed % levels.length }, extra || {}));
  const tricks = [];
  let guard = 0;
  while (st.phase !== 'over' && guard++ < 5000) {
    if (st.phase === 'roundEnd') { st = SK.apply(st, { type: 'next' }); continue; }
    const p = SK.whoActs(st)[0];
    const prev = st;
    st = SK.apply(st, AI.act(SK.view(st, p), p, levels[p] || 'easy'));
    if (st.lastTrick && (st.tricksDone !== prev.tricksDone || st.round !== prev.round)) {
      const lt = st.lastTrick;
      if (!(prev.lastTrick && prev.tricksDone === st.tricksDone && prev.round === st.round)) tricks.push({ r: st.round, n: lt.n, plays: lt.plays, w: lt.winner, how: lt.how, bonus: lt.bonus });
    }
  }
  return { st, tricks };
}

test('levels are rated in order Easy < Medium < Hard', () => {
  const r = SKP.LEVELS.map(l => l.rating);
  assert.ok(r[0] < r[1] && r[1] < r[2], r.join(','));
});
test('a table is rated at its strongest computer', () => {
  assert.strictEqual(SKP.tableLevel(['easy', 'hard', 'medium']), 'hard');
  assert.strictEqual(SKP.tableLevel(['easy', 'easy']), 'easy');
  assert.strictEqual(SKP.tableLevel([]), null);
});
test('a finished game: won/lost/draw from the engine, one result per game, bids hit counted', () => {
  let wins = 0, losses = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const { st, tricks } = play(seed, 'hard', 'easy');
    assert.strictEqual(st.phase, 'over');
    const res = SKP.result({ st, me: 0, levels: ['easy', 'easy', 'easy'], helped: false, tricks });
    const w = SK.winners(st);
    assert.strictEqual(res.won, w.length === 1 && w[0] === 0, 'won, seed ' + seed);
    assert.strictEqual(res.draw, w.length > 1 && w.indexOf(0) >= 0, 'draw, seed ' + seed);
    assert.strictEqual(res.mode, 'computer'); assert.strictEqual(res.level, 'easy');
    assert.strictEqual(res.score, st.scores[0]);
    assert.strictEqual(res.extra.rounds, st.history.length);
    assert.strictEqual(res.extra.hits, st.history.filter(h => h.results[0].made).length);
    assert.strictEqual(res.extra.best, Math.max(...st.history.map(h => h.results[0].pts)));
    assert.ok(!res.extra.quit);
    if (res.won) wins++; else losses++;
  }
  assert.ok(wins > 0 && losses >= 0, 'Hard should win some of 12 games vs Easy');
});
test('a shared first place is a draw, not a win', () => {
  const { st } = play(5, 'medium', 'medium');
  const tied = Object.assign({}, st, { scores: [120, 120, 40, -10] }); // a tie the tie-break round was switched off for
  const r = SKP.result({ st: tied, me: 0, levels: ['medium'], tricks: [] });
  assert.strictEqual(r.won, false); assert.strictEqual(r.draw, true);
  const r2 = SKP.result({ st: tied, me: 2, levels: ['medium'], tricks: [] });
  assert.strictEqual(r2.won, false); assert.strictEqual(r2.draw, false);
});
test('Hint/Undo makes a game "with help" (not rated); leaving early is a loss', () => {
  const { st, tricks } = play(3, 'medium', 'medium');
  const helped = SKP.result({ st, me: 0, levels: ['hard'], helped: true, tricks });
  assert.strictEqual(helped.mode, 'help'); assert.strictEqual(helped.level, null);
  // the same game left in round 4
  let s = SK.newGame({ players: [0, 1, 2, 3].map(i => ({ name: 'P' + i, kind: i ? 'cpu' : 'human', level: 'medium' })), seed: 9 });
  while (s.round < 4) { if (s.phase === 'roundEnd') { s = SK.apply(s, { type: 'next' }); continue; } const p = SK.whoActs(s)[0]; s = SK.apply(s, AI.act(SK.view(s, p), p, 'medium')); }
  const left = SKP.result({ st: s, me: 0, levels: ['medium', 'medium', 'medium'], helped: false, tricks: [] });
  assert.strictEqual(left.won, false); assert.strictEqual(left.draw, false); assert.ok(left.extra.quit);
  assert.strictEqual(left.extra.rounds, 3);
});
test('achievements fire on the right games only', () => {
  const ach = id => SKP.ACH.find(a => a.id === id);
  const ctx = (last, stats) => ({ stats: Object.assign({ wins: 0, bestStreak: 0 }, stats || {}), last, daily: { streak: 0 } });
  assert.ok(ach('hard').test(ctx({ won: true, level: 'hard', extra: {} })));
  assert.ok(!ach('hard').test(ctx({ won: true, level: 'medium', extra: {} })));
  assert.ok(ach('medium').test(ctx({ won: true, level: 'hard', extra: {} })));
  assert.ok(ach('perfect').test(ctx({ won: false, extra: { rounds: 10, hits: 10 } })));
  assert.ok(!ach('perfect').test(ctx({ won: false, extra: { rounds: 3, hits: 3, quit: true } })));
  assert.ok(ach('siren').test(ctx({ extra: { siren: 1 } })));
  assert.ok(!ach('crew').test(ctx({ won: true, extra: { players: 5 } })));
  assert.ok(ach('crew').test(ctx({ won: true, extra: { players: 6 } })));
  assert.ok(!ach('first').test(ctx(null)), 'init re-check with no game');
});
test('Siren song is counted from a real trick where a mermaid takes the Skull King', () => {
  let found = 0;
  for (let seed = 1; seed <= 40 && !found; seed++) {
    const { st, tricks } = play(seed, 'easy', 'easy');
    const mine = tricks.filter(t => t.w === 0 && t.how === 'mermaid-king').length;
    const res = SKP.result({ st, me: 0, levels: ['easy'], tricks });
    assert.strictEqual(res.extra.siren, mine);
    found += mine;
  }
  assert.ok(found > 0, 'no mermaid-king trick for seat 0 in 40 games');
});
test('the guided first game deals you a pirate nobody can beat in round 1', () => {
  const st = SK.newGame({ players: [{ name: 'You' }, { name: 'A', kind: 'cpu', level: 'easy' }, { name: 'B', kind: 'cpu', level: 'easy' }, { name: 'C', kind: 'cpu', level: 'easy' }], seed: SKC.SEED, firstDealer: SKC.DEALER, scoring: 'sk', schedule: 'standard' });
  const mine = SK.CARDS[st.hands[0][0]];
  assert.strictEqual(st.cards, 1);
  assert.strictEqual(mine.k, 'pir');
  for (let p = 1; p < 4; p++) assert.ok(['num', 'esc'].indexOf(SK.CARDS[st.hands[p][0]].k) >= 0, 'seat ' + p + ' holds a special that could beat it');
});
test('the guided game steps and rules sheet are well formed', () => {
  const steps = SKC.steps({ state: () => null });
  assert.ok(steps.length >= 5);
  steps.forEach(s => assert.ok(s.title && (s.text || s.html)));
  assert.ok(SKC.RULES.sections.length >= 5);
  SKC.RULES.sections.forEach(s => assert.ok(s.id && s.title && s.short && s.html));
});

console.log(`profile: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
