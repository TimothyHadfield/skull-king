// Rules engine tests: counts, trick resolution, legality, scoring, game flow.
// Each expected number is worked by hand from docs/rules-check.md.
'use strict';
const assert = require('assert');
const SK = require('../js/engine.js');
const { CARDS } = SK;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.log('FAIL', name, '\n  ', e.message); }
}

// card helpers
const N = (s, r) => s * 14 + (r - 1);
const BLACK = 0, YELLOW = 1, PURPLE = 2, GREEN = 3;
const ESC = [56, 57, 58, 59, 60], PIR = [61, 62, 63, 64, 65], TIG = 66, KING = 67, MER = [68, 69];
const KRAKEN = 70, WHALE = 71, LOOT = [72, 73];
const P = (plays) => plays.map((x, i) => (Array.isArray(x) ? { p: i, id: x[0], as: x[1] } : { p: i, id: x }));

// ------------------------------------------------------------- deck
test('base deck is 70 cards with the right mix', () => {
  const d = SK.deckIds({});
  assert.strictEqual(d.length, 70);
  const count = k => d.filter(id => CARDS[id].k === k).length;
  assert.strictEqual(count('num'), 56);
  assert.strictEqual(count('esc'), 5);
  assert.strictEqual(count('pir'), 5);
  assert.strictEqual(count('tig'), 1);
  assert.strictEqual(count('sk'), 1);
  assert.strictEqual(count('mer'), 2);
  for (let s = 0; s < 4; s++) assert.strictEqual(d.filter(id => CARDS[id].s === s).length, 14);
});
test('advanced cards make 74', () => {
  const d = SK.deckIds({ kraken: true, whale: true, loot: true });
  assert.strictEqual(d.length, 74);
  assert.strictEqual(d.filter(id => CARDS[id].k === 'loot').length, 2);
  assert.deepStrictEqual(SK.PIRATES.map(p => p.name).sort(),
    ["Bendt the Bandit", "Harry the Giant", "Juanita Jade", "Rascal of Roatan", "Rosie D'Laney"]);
});
test('ids line up with the helpers', () => {
  assert.strictEqual(SK.cardName(N(YELLOW, 14)), 'Yellow 14');
  assert.strictEqual(CARDS[TIG].k, 'tig');
  assert.strictEqual(CARDS[KING].k, 'sk');
  assert.strictEqual(CARDS[KRAKEN].k, 'kra');
  assert.strictEqual(CARDS[WHALE].k, 'wha');
});

// ------------------------------------------------------- tricks
test('highest of the led suit wins; off-suit loses', () => {
  const r = SK.resolveTrick(P([N(YELLOW, 5), N(PURPLE, 13), N(YELLOW, 9)]));
  assert.strictEqual(r.winner, 2);
});
test('black is trump', () => {
  const r = SK.resolveTrick(P([N(YELLOW, 14), N(BLACK, 1), N(BLACK, 3)]));
  assert.strictEqual(r.winner, 2);
  assert.strictEqual(r.bonus, 10); // yellow 14 captured
});
test('black 14 bonus is 20', () => {
  const r = SK.resolveTrick(P([N(BLACK, 14), N(GREEN, 14), PIR[0]]));
  assert.strictEqual(r.winner, 2);
  assert.strictEqual(r.bonus, 30);
});
test('first pirate wins among pirates (Tigress as pirate counts)', () => {
  assert.strictEqual(SK.resolveTrick(P([N(BLACK, 14), [TIG, 'pir'], PIR[2]])).winner, 1);
});
test('Skull King beats pirates, +30 each (Tigress pirate too)', () => {
  const r = SK.resolveTrick(P([PIR[0], KING, [TIG, 'pir'], N(YELLOW, 2)]));
  assert.strictEqual(r.winner, 1);
  assert.strictEqual(r.bonus, 60);
});
test('Tigress as escape is not captured as a pirate', () => {
  const r = SK.resolveTrick(P([PIR[0], KING, [TIG, 'esc']]));
  assert.strictEqual(r.bonus, 30);
});
test('mermaid takes the Skull King (+40) even with pirates in the trick', () => {
  const r = SK.resolveTrick(P([PIR[0], KING, MER[0], MER[1]]));
  assert.strictEqual(r.winner, 2);
  assert.strictEqual(r.bonus, 40);
});
test('pirate takes mermaids (+20 each)', () => {
  const r = SK.resolveTrick(P([MER[0], PIR[3], MER[1]]));
  assert.strictEqual(r.winner, 1);
  assert.strictEqual(r.bonus, 40);
});
test('mermaid beats numbers, first mermaid wins', () => {
  assert.strictEqual(SK.resolveTrick(P([N(BLACK, 14), MER[1], MER[0]])).winner, 1);
});
test('all escapes: first one played wins', () => {
  assert.strictEqual(SK.resolveTrick(P([ESC[0], ESC[1], [TIG, 'esc']])).winner, 0);
});
test('escape led: next number sets the suit', () => {
  const plays = P([ESC[0], N(GREEN, 3), N(YELLOW, 13)]);
  assert.strictEqual(SK.leadSuit(plays), GREEN);
  assert.strictEqual(SK.resolveTrick(plays).winner, 1);
});
test('Kraken: nobody wins; the would-be winner leads next', () => {
  const r = SK.resolveTrick(P([N(YELLOW, 4), KRAKEN, N(YELLOW, 12), PIR[0]]));
  assert.strictEqual(r.winner, null);
  assert.strictEqual(r.destroyed, true);
  assert.strictEqual(r.next, 3);
});
test('White Whale: highest number wins, any suit; tie goes to first', () => {
  let r = SK.resolveTrick(P([N(BLACK, 9), WHALE, N(GREEN, 11), KING, N(YELLOW, 11)]));
  assert.strictEqual(r.winner, 2);
  r = SK.resolveTrick(P([N(PURPLE, 14), WHALE, N(BLACK, 3)]));
  assert.strictEqual(r.winner, 0);
  assert.strictEqual(r.bonus, 10);
});
test('White Whale with only specials: discarded, would-be winner leads', () => {
  const r = SK.resolveTrick(P([ESC[0], WHALE, PIR[1]]));
  assert.strictEqual(r.winner, null);
  assert.strictEqual(r.next, 2);
});
test('Kraken + Whale: the second one played acts', () => {
  let r = SK.resolveTrick(P([N(YELLOW, 5), KRAKEN, WHALE, N(GREEN, 9)]));
  assert.strictEqual(r.how, 'whale'); assert.strictEqual(r.winner, 3);
  r = SK.resolveTrick(P([N(YELLOW, 5), WHALE, KRAKEN, N(GREEN, 9)]));
  assert.strictEqual(r.how, 'kraken'); assert.strictEqual(r.winner, null); assert.strictEqual(r.next, 0);
});

// ------------------------------------------------------ legality
test('must follow suit with a number, specials always allowed', () => {
  const hand = [N(YELLOW, 2), N(GREEN, 9), PIR[0], ESC[0]];
  const legal = SK.legalFrom(hand, P([N(YELLOW, 10)]));
  assert.deepStrictEqual(legal.sort((a, b) => a - b), [N(YELLOW, 2), ESC[0], PIR[0]].sort((a, b) => a - b));
});
test('void in the led suit: anything', () => {
  const hand = [N(BLACK, 2), N(GREEN, 9)];
  assert.strictEqual(SK.legalFrom(hand, P([N(YELLOW, 10)])).length, 2);
});
test('character, Kraken or Whale led: no suit for the trick', () => {
  const hand = [N(YELLOW, 2), N(GREEN, 9)];
  for (const lead of [PIR[0], KING, MER[0], KRAKEN, WHALE, [TIG, 'pir']]) {
    assert.strictEqual(SK.legalFrom(hand, P([lead, N(YELLOW, 4)])).length, 2);
  }
});
test('escape/loot led then a number: follow that number', () => {
  const hand = [N(YELLOW, 2), N(GREEN, 9)];
  assert.deepStrictEqual(SK.legalFrom(hand, P([LOOT[0], N(GREEN, 4)])), [N(GREEN, 9)]);
  assert.deepStrictEqual(SK.legalFrom(hand, P([[TIG, 'esc'], N(GREEN, 4)])), [N(GREEN, 9)]);
});

// -------------------------------------------------------- scoring
test('standard scoring', () => {
  assert.strictEqual(SK.roundScore(2, 2, 30, 5, 'sk'), 70);
  assert.strictEqual(SK.roundScore(3, 1, 30, 5, 'sk'), -20);
  assert.strictEqual(SK.roundScore(3, 5, 0, 5, 'sk'), -20);
  assert.strictEqual(SK.roundScore(0, 0, 0, 7, 'sk'), 70);
  assert.strictEqual(SK.roundScore(0, 2, 0, 7, 'sk'), -70);
});
test('Rascal scoring: all / half / none, bonuses scaled the same', () => {
  assert.strictEqual(SK.roundScore(2, 2, 20, 6, 'rascal'), 80);
  assert.strictEqual(SK.roundScore(2, 3, 20, 6, 'rascal'), 40);
  assert.strictEqual(SK.roundScore(2, 4, 20, 6, 'rascal'), 0);
  assert.strictEqual(SK.roundScore(2, 2, 0, 6, 'rascal', true), 90);
  assert.strictEqual(SK.roundScore(2, 3, 0, 6, 'rascal', true), 0);
});
test('cards per round: 8 players cap at 8', () => {
  const g8 = SK.newGame({ players: Array.from({ length: 8 }, () => ({})), seed: 1 });
  assert.strictEqual(SK.cardsFor(g8, 10), 8);
  assert.strictEqual(SK.cardsFor(g8, 7), 7);
  const g7 = SK.newGame({ players: Array.from({ length: 7 }, () => ({})), seed: 1 });
  assert.strictEqual(SK.cardsFor(g7, 10), 10);
});
test('variant schedules', () => {
  const g = SK.newGame({ players: [{}, {}, {}], schedule: 'whirlpool', seed: 1 });
  assert.deepStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => SK.cardsFor(g, r)), [9, 7, 5, 3, 1, 9, 7, 5, 3, 1]);
  assert.strictEqual(g.cards, 9);
});

// ------------------------------------------------------- game flow
function randomGame(seed, cfg) {
  let rs = seed;
  const rand = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; };
  let st = SK.newGame(Object.assign({ players: [{}, {}, {}, {}], seed }, cfg));
  const roundTricks = [];
  let guard = 0;
  while (st.phase !== 'over' && guard++ < 5000) {
    if (st.phase === 'roundEnd') { st = SK.apply(st, { type: 'next' }); continue; }
    const seat = SK.whoActs(st)[0];
    if (st.phase === 'bid') { st = SK.apply(st, { type: 'bid', seat, bid: Math.floor(rand() * (st.cards + 1)) }); continue; }
    if (st.phase === 'cannon') { st = SK.apply(st, { type: 'cannon', seat, on: rand() < 0.5 }); continue; }
    if (st.phase === 'ability') {
      const a = st.pending.ability;
      const body = a === 'rosie' ? { lead: 0 } : a === 'bendt' ? { discard: st.hands[seat].slice(0, st.pending.drawn.length) }
        : a === 'rascal' ? { bet: 10 } : a === 'harry' ? { delta: -1 } : {};
      st = SK.apply(st, Object.assign({ type: 'ability', seat }, body));
      continue;
    }
    const legal = SK.legalPlays(st, seat);
    const id = legal[Math.floor(rand() * legal.length)];
    const before = st.history.length;
    st = SK.apply(st, { type: 'play', seat, card: id, as: rand() < 0.5 ? 'pir' : 'esc' });
    if (st.history.length > before) roundTricks.push(st);
  }
  return st;
}

test('random full games: invariants hold', () => {
  for (let seed = 1; seed <= 150; seed++) {
    const cfg = seed % 3 === 0 ? { opts: { kraken: true, whale: true, loot: true }, abilities: true }
      : seed % 3 === 1 ? { scoring: 'rascal', cannonball: true } : { players: [{}, {}] };
    const st = randomGame(seed, cfg);
    assert.strictEqual(st.phase, 'over', 'game ' + seed + ' finished');
    let total = new Array(st.n).fill(0);
    for (const h of st.history) {
      h.results.forEach((r, p) => { if (r) total[p] += r.pts; });
      const tricks = h.results.reduce((a, r) => a + (r ? r.won : 0), 0);
      assert.ok(tricks <= h.cards, 'tricks <= cards');
    }
    assert.deepStrictEqual(total, st.scores);
    assert.ok(st.hands.every(h => h.length === 0));
    assert.ok(st.history.length >= 10);
  }
});
test('every deal uses distinct cards', () => {
  const st = SK.newGame({ players: Array.from({ length: 7 }, () => ({})), seed: 9, schedule: 'broadside' });
  const all = st.hands.flat().concat(st.undealt);
  assert.strictEqual(new Set(all).size, 70);
  assert.strictEqual(all.length, 70);
});
test('same seed + same actions = same game (online sync)', () => {
  const a = randomGame(42, {}), b = randomGame(42, {});
  assert.deepStrictEqual(a.scores, b.scores);
});
test('view hides other hands, bids until all are in, and the seed', () => {
  let st = SK.newGame({ players: [{}, {}, {}], seed: 3 });
  st = SK.apply(st, { type: 'bid', seat: 0, bid: 1 });
  const v = SK.view(st, 1);
  assert.strictEqual(v.hands[0], null);
  assert.ok(Array.isArray(v.hands[1]));
  assert.strictEqual(v.bids[0], null);
  assert.strictEqual(v.bidIn[0], true);
  assert.strictEqual(v.seed, undefined);
  assert.strictEqual(v.undealt, null);
});
test('illegal actions are refused', () => {
  let st = SK.newGame({ players: [{}, {}, {}], seed: 5, schedule: 'swift' });
  assert.throws(() => SK.apply(st, { type: 'bid', seat: 0, bid: 6 }));
  assert.throws(() => SK.apply(st, { type: 'play', seat: 0, card: st.hands[0][0] }));
  for (let p = 0; p < 3; p++) st = SK.apply(st, { type: 'bid', seat: p, bid: 1 });
  const wrong = (st.turn + 1) % 3;
  assert.throws(() => SK.apply(st, { type: 'play', seat: wrong, card: st.hands[wrong][0] }));
  assert.throws(() => SK.apply(st, { type: 'play', seat: st.turn, card: st.hands[wrong][0] }));
});
test('leader: left of dealer leads, deal passes left each round', () => {
  let st = SK.newGame({ players: [{}, {}, {}, {}], seed: 2, firstDealer: 0 });
  assert.strictEqual(st.dealer, 1); assert.strictEqual(st.roundLeader, 2);
  for (let p = 0; p < 4; p++) st = SK.apply(st, { type: 'bid', seat: p, bid: 0 });
  assert.strictEqual(st.turn, 2);
});
test('two players: ghost hand plays second and never scores; no loot', () => {
  let st = SK.newGame({ players: [{}, {}], seed: 4, opts: { loot: true } });
  assert.strictEqual(st.n, 3); assert.strictEqual(st.ghost, 2);
  assert.strictEqual(st.opts.loot, false);
  assert.deepStrictEqual(SK.trickOrder(st, 0), [0, 2, 1]);
  assert.deepStrictEqual(SK.trickOrder(st, 1), [1, 2, 0]);
  st = randomGame(4, { players: [{}, {}] });
  assert.strictEqual(st.scores[2], 0);
});
test('loot alliance pays 20 each when both hit', () => {
  let st = SK.newGame({ players: [{}, {}, {}], seed: 1, opts: { loot: true } });
  // force round 1 hands
  st.hands = [[LOOT[0]], [N(YELLOW, 3)], [N(YELLOW, 9)]];
  st.leader = st.roundLeader = 0; st.order = SK.trickOrder(st, 0);
  st = SK.apply(st, { type: 'bid', seat: 0, bid: 0 });
  st = SK.apply(st, { type: 'bid', seat: 1, bid: 0 });
  st = SK.apply(st, { type: 'bid', seat: 2, bid: 1 });
  st = SK.apply(st, { type: 'play', seat: 0, card: LOOT[0] });
  st = SK.apply(st, { type: 'play', seat: 1, card: N(YELLOW, 3) });
  st = SK.apply(st, { type: 'play', seat: 2, card: N(YELLOW, 9) });
  const r = st.history[0].results;
  assert.strictEqual(r[0].pts, 10 + 20);
  assert.strictEqual(r[2].pts, 20 + 20);
  assert.strictEqual(r[1].pts, 10);
});
test('pirate abilities: Rascal bet and Harry after the last trick', () => {
  let st = SK.newGame({ players: [{}, {}, {}], seed: 1, abilities: true, schedule: 'evenKeeled' });
  st.hands = [[PIR[2], N(GREEN, 1)], [N(YELLOW, 3), N(YELLOW, 4)], [N(YELLOW, 9), N(YELLOW, 10)]];
  st.leader = st.roundLeader = 0; st.order = SK.trickOrder(st, 0);
  st = SK.apply(st, { type: 'bid', seat: 0, bid: 2 });
  st = SK.apply(st, { type: 'bid', seat: 1, bid: 0 });
  st = SK.apply(st, { type: 'bid', seat: 2, bid: 1 });
  st = SK.apply(st, { type: 'play', seat: 0, card: PIR[2] });
  st = SK.apply(st, { type: 'play', seat: 1, card: N(YELLOW, 3) });
  st = SK.apply(st, { type: 'play', seat: 2, card: N(YELLOW, 9) });
  assert.strictEqual(st.phase, 'ability');
  assert.strictEqual(st.pending.ability, 'rascal');
  st = SK.apply(st, { type: 'ability', seat: 0, bet: 20 });
  st = SK.apply(st, { type: 'play', seat: 0, card: N(GREEN, 1) });
  st = SK.apply(st, { type: 'play', seat: 1, card: N(YELLOW, 4) });
  st = SK.apply(st, { type: 'play', seat: 2, card: N(YELLOW, 10) });
  // green 1 led, the others are out of green: seat 0 takes both, bid 2 hit (+40) and wins the bet (+20)
  assert.strictEqual(st.history[0].results[0].pts, 40 + 20);

  st = SK.newGame({ players: [{}, {}, {}], seed: 1, abilities: true, schedule: 'bedtime' });
  st.hands = [[PIR[4]], [N(YELLOW, 3)], [N(YELLOW, 9)]];
  st.leader = st.roundLeader = 0; st.order = SK.trickOrder(st, 0);
  for (let p = 0; p < 3; p++) st = SK.apply(st, { type: 'bid', seat: p, bid: 0 });
  st = SK.apply(st, { type: 'play', seat: 0, card: PIR[4] });
  st = SK.apply(st, { type: 'play', seat: 1, card: N(YELLOW, 3) });
  st = SK.apply(st, { type: 'play', seat: 2, card: N(YELLOW, 9) });
  assert.strictEqual(st.phase, 'ability');
  st = SK.apply(st, { type: 'ability', seat: 0, delta: 1 });
  assert.strictEqual(st.history[0].results[0].pts, 20);
});
test('Juanita lets only her player see the undealt cards', () => {
  let st = SK.newGame({ players: [{}, {}, {}], seed: 1, abilities: true, schedule: 'evenKeeled' });
  st.hands = [[PIR[3], N(GREEN, 1)], [N(YELLOW, 3), N(YELLOW, 4)], [N(YELLOW, 9), N(YELLOW, 10)]];
  st.leader = st.roundLeader = 0; st.order = SK.trickOrder(st, 0);
  for (let p = 0; p < 3; p++) st = SK.apply(st, { type: 'bid', seat: p, bid: 1 });
  st = SK.apply(st, { type: 'play', seat: 0, card: PIR[3] });
  st = SK.apply(st, { type: 'play', seat: 1, card: N(YELLOW, 3) });
  st = SK.apply(st, { type: 'play', seat: 2, card: N(YELLOW, 9) });
  assert.strictEqual(st.pending.ability, 'juanita');
  assert.ok(SK.view(st, 0).undealt.length > 0);
  assert.strictEqual(SK.view(st, 1).undealt, null);
});
test('a tie at the end adds a round', () => {
  let st = SK.newGame({ players: [{}, {}, {}], seed: 1, schedule: 'bedtime' });
  st.hands = [[ESC[0]], [ESC[1]], [ESC[2]]];
  st.leader = st.roundLeader = 0; st.order = SK.trickOrder(st, 0);
  st = SK.apply(st, { type: 'bid', seat: 0, bid: 1 });
  st = SK.apply(st, { type: 'bid', seat: 1, bid: 0 });
  st = SK.apply(st, { type: 'bid', seat: 2, bid: 0 });
  for (let i = 0; i < 3; i++) st = SK.apply(st, { type: 'play', seat: st.turn, card: st.hands[st.turn][0] });
  // seat 0 won with the first escape: 20; seats 1 and 2: 10 each -> 0 wins outright
  assert.strictEqual(st.phase, 'over');
  st = SK.newGame({ players: [{}, {}, {}], seed: 1, schedule: 'bedtime' });
  st.hands = [[ESC[0]], [ESC[1]], [ESC[2]]];
  st.leader = st.roundLeader = 0; st.order = SK.trickOrder(st, 0);
  for (let p = 0; p < 3; p++) st = SK.apply(st, { type: 'bid', seat: p, bid: 0 });
  for (let i = 0; i < 3; i++) st = SK.apply(st, { type: 'play', seat: st.turn, card: st.hands[st.turn][0] });
  assert.strictEqual(st.phase, 'roundEnd'); // seats 1 and 2 tied on 10
  st = SK.apply(st, { type: 'next' });
  assert.strictEqual(st.round, 2); assert.strictEqual(st.cards, 1);
});

console.log(`engine: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
