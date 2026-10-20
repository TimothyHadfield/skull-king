// Odds maths and computer players: checked against brute force / exact answers.
'use strict';
const assert = require('assert');
const SK = require('../js/engine.js');
const AI = require('../js/ai.js');
const { playGame, mulberry } = require('../tools/strength.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.log('FAIL', name, '\n  ', e.message); }
}

function choose(n, k) { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; }

test('noneOf matches the hypergeometric formula C(U-B,H)/C(U,H)', () => {
  for (const [U, B, H] of [[69, 2, 1], [60, 7, 9], [30, 5, 12], [20, 20, 1], [10, 0, 10], [12, 3, 9]]) {
    const exact = choose(U - B, H) / choose(U, H);
    assert.ok(Math.abs(AI.noneOf(U, B, H) - exact) < 1e-12, `${U},${B},${H}`);
  }
});
test('noneOf matches brute-force enumeration on a small deck', () => {
  // 8 unseen cards, 3 beaters, opponents hold 3: count subsets with no beater
  let good = 0, all = 0;
  for (let m = 0; m < 256; m++) {
    let bits = 0, x = m; while (x) { bits += x & 1; x >>= 1; }
    if (bits !== 3) continue;
    all++;
    if ((m & 0b111) === 0) good++;
  }
  assert.ok(Math.abs(AI.noneOf(8, 3, 3) - good / all) < 1e-12);
});

// Exact: 2 players (no ghost), 1 card each, I lead the Skull King. I lose only
// if the other player holds one of the 2 mermaids among the 69 unseen cards.
test('advisor: Skull King alone hits a bid of 1 in 67/69 deals', () => {
  const acc = AI.bidStudy({ hand: [67], players: 2, before: 0, opts: {}, ghost: false, samples: 6000, rand: mulberry(11) });
  const exact = 67 / 69;
  assert.ok(Math.abs(acc.bids[1].chance - exact) < 0.012, acc.bids[1].chance + ' vs ' + exact);
  assert.strictEqual(acc.best, 1);
  // average points for bid 1 = 20*P(hit) - 10*P(miss) (no bonus possible except 14s... Skull King capturing a pirate +30)
});
// Exact: I lead a mermaid; I lose only to a pirate (5) or the Tigress, which the
// other player (bidding 1 with it) plays as a pirate: 63/69.
test('advisor: Mermaid alone hits a bid of 1 in 63/69 deals', () => {
  const acc = AI.bidStudy({ hand: [68], players: 2, before: 0, opts: {}, ghost: false, samples: 6000, rand: mulberry(12) });
  assert.ok(Math.abs(acc.bids[1].chance - 63 / 69) < 0.015, String(acc.bids[1].chance));
});
test('advisor: an Escape alone should bid 0', () => {
  const acc = AI.bidStudy({ hand: [56], players: 4, before: 2, opts: {}, samples: 800, rand: mulberry(3) });
  assert.strictEqual(acc.best, 0);
  assert.ok(acc.bids[0].chance > 0.95);
});
test('advisor: strong hand bids high, weak hand bids low (5 cards, 4 players)', () => {
  const strong = AI.bidStudy({ hand: [67, 61, 62, 13, 68], players: 4, before: 0, opts: {}, samples: 400, rand: mulberry(5) });
  const weak = AI.bidStudy({ hand: [14, 15, 29, 43, 56], players: 4, before: 0, opts: {}, samples: 400, rand: mulberry(5) });
  assert.ok(strong.best >= 3, 'strong ' + strong.best);
  assert.ok(weak.best <= 1, 'weak ' + weak.best);
});
test('trick distributions add up to the sample count', () => {
  const acc = AI.bidStudy({ hand: [1, 20, 40, 61], players: 3, before: 1, opts: {}, samples: 100, rand: mulberry(8) });
  for (const row of acc.bids) assert.strictEqual(row.dist.reduce((a, b) => a + b, 0), 100);
});

test('every level only makes legal moves (with advanced cards, abilities, 2-8 players)', () => {
  for (const [levels, extra] of [
    [['easy', 'medium', 'hard'], { opts: { kraken: true, whale: true, loot: true }, abilities: true, schedule: 'swift' }],
    [['hard', 'easy'], { schedule: 'evenKeeled' }],
    [['medium', 'medium', 'medium', 'medium', 'medium', 'medium', 'medium', 'medium'], { scoring: 'rascal', cannonball: true }],
  ]) {
    const r = playGame(levels, 7, extra.opts || {}, extra.scoring || 'sk', extra);
    assert.strictEqual(r.state.phase, 'over');
  }
});
test('hard evaluates every option and ranks them', () => {
  let st = SK.newGame({ players: [{}, {}, {}, {}], seed: 21, schedule: 'swift' });
  for (let p = 0; p < 4; p++) st = SK.apply(st, { type: 'bid', seat: p, bid: 1 });
  const seat = st.turn;
  const opts = AI.evaluatePlays(SK.view(st, seat), seat, 20, mulberry(2));
  assert.ok(opts.length >= 1);
  for (let i = 1; i < opts.length; i++) assert.ok(opts[i - 1].ev >= opts[i].ev);
});

console.log(`ai: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
