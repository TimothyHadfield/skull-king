// Sounds, celebrations and animations (js/sfx.js on top of the shared js/fx.js).
// A fake AudioContext lets fx.js really "play" in node, so FX.stats.plays counts
// what a phone would hear; FX.play and FX.celebrate are spied on.
'use strict';
const assert = require('assert');

// ---- fake Web Audio (enough for fx.js to build its voices)
const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
const node = extra => Object.assign({ connect() {}, start() {}, stop() {} }, extra);
class FakeAC {
  constructor() { this.state = 'running'; this.t = 0; this.sampleRate = 8000; this.destination = node(); }
  get currentTime() { return (this.t += 0.1); } // time moves on between sounds (no throttling in the test)
  createGain() { return node({ gain: param() }); }
  createDynamicsCompressor() { return node(); }
  createOscillator() { return node({ frequency: param(), type: 'sine' }); }
  createBiquadFilter() { return node({ frequency: param(), Q: param(), type: 'lowpass' }); }
  createBufferSource() { return node({ buffer: null, loop: false }); }
  createStereoPanner() { return node({ pan: param() }); }
  createBuffer(ch, n) { return { getChannelData: () => new Float32Array(n) }; }
  resume() { return Promise.resolve(); }
}
globalThis.AudioContext = FakeAC;

require('../js/fx.js');
const FX = globalThis.FX;
const SK = require('../js/engine.js');
const AI = require('../js/ai.js');
const SKFX = require('../js/sfx.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.log('FAIL', name, '\n  ', e.message); }
}

// ---- spies
let heard = [], celebrations = [];
const realPlay = FX.play, realCelebrate = FX.celebrate;
FX.play = (name, o) => { const ok = realPlay(name, o); heard.push({ name, ok }); return ok; };
FX.celebrate = o => { celebrations.push(o.kind); return realCelebrate(o); };
SKFX.setTimer(fn => fn()); // run the paced sounds at once
// a stand-in screen: every animation request that passes the switches is counted
SKFX.attach({ visible: () => true, root: () => null, colors: () => ['#f0b354'] });
FX.unlock(); // the first tap

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Play a whole short game with computers in every seat, reacting as seat `me` would.
function playGame(cfg, me, seed) {
  let st = SK.newGame(Object.assign({ players: [{ name: 'You' }, { name: 'A' }, { name: 'B' }], schedule: 'swift', seed, firstDealer: 0 }, cfg));
  SKFX.react(null, st, me);
  const rng = mulberry(seed);
  let plays = 0, steps = 0;
  while (st.phase !== 'over' && steps++ < 2000) {
    if (st.phase === 'roundEnd') { const nx = SK.apply(st, { type: 'next' }); SKFX.react(st, nx, me); st = nx; continue; }
    const p = SK.whoActs(st)[0];
    const a = AI.act(SK.view(st, p), p, 'easy', rng);
    const before = st.played.length;
    const nx = SK.apply(st, a);
    plays += nx.played.length - before;
    SKFX.react(st, nx, me);
    st = nx;
  }
  return { st, plays };
}
const names = () => heard.filter(h => h.ok).map(h => h.name);
const count = (arr, n) => arr.filter(x => x === n).length;
const PLAY_SOUNDS = ['cardFlip', 'cutlass', 'skullKing', 'mermaid', 'kraken', 'whale', 'coins'];

test('a scripted game makes the right sounds for each event', () => {
  heard = []; celebrations = [];
  const { st, plays } = playGame({ opts: { kraken: true, whale: true, loot: true } }, 0, 7);
  const h = names();
  assert.equal(count(h, 'shuffle'), st.round, 'one shuffle per deal');
  assert.ok(count(h, 'cardDeal') >= st.round * 5, 'dealt cards sound like cards');
  assert.equal(count(h, 'yoho'), st.round, 'one "Yo-ho-ho" bid reveal per round');
  assert.equal(count(h, 'place'), st.round * 3, 'every bid is knocked in');
  const playSounds = h.filter(n => PLAY_SOUNDS.indexOf(n) >= 0).length;
  assert.equal(playSounds, plays, 'one card sound per card played');
  const made = st.history.filter(r => r.results[0].made).length;
  assert.equal(count(h, 'ding'), made, 'bid made = ding');
  assert.equal(count(h, 'miss'), st.history.length - made, 'bid missed = miss');
  assert.ok(count(h, 'turn') > 0, 'your-turn chime');
  assert.ok(heard.every(x => x.ok), 'every sound played');
});

test('your-turn chime only when it becomes your turn, not every turn', () => {
  let st = SK.newGame({ players: [{ name: 'You' }, { name: 'A' }, { name: 'B' }], schedule: 'bedtime', seed: 3, firstDealer: 2 });
  for (const p of [0, 1, 2]) st = SK.apply(st, { type: 'bid', seat: p, bid: 0 });
  // round 1, 1 card: seat 1 leads, so a play by seat 1 doesn't make it my turn yet
  assert.equal(st.turn, 1);
  heard = [];
  let nx = SK.apply(st, { type: 'play', seat: 1, card: st.hands[1][0] });
  SKFX.react(st, nx, 0);
  assert.equal(count(names(), 'turn'), 0, 'seat 2 is next, not me');
  heard = [];
  const n2 = SK.apply(nx, { type: 'play', seat: 2, card: SK.legalPlays(nx, 2)[0] });
  SKFX.react(nx, n2, 0);
  assert.equal(count(names(), 'turn'), 1, 'now it is my turn');
  // Cannonball choices are made together: one chime when the choice opens, none
  // while the others choose and I still haven't.
  let c = SK.newGame({ players: [{ name: 'You' }, { name: 'A' }, { name: 'B' }], scoring: 'rascal', cannonball: true, schedule: 'bedtime', seed: 3, firstDealer: 2 });
  c = SK.apply(SK.apply(c, { type: 'bid', seat: 1, bid: 0 }), { type: 'bid', seat: 2, bid: 0 });
  heard = [];
  let c2 = SK.apply(c, { type: 'bid', seat: 0, bid: 1 });
  SKFX.react(c, c2, 0);
  assert.equal(c2.phase, 'cannon');
  assert.equal(count(names(), 'turn'), 1, 'choice opens');
  heard = [];
  const c3 = SK.apply(c2, { type: 'cannon', seat: 1, on: true });
  SKFX.react(c2, c3, 0);
  assert.equal(count(names(), 'turn'), 0, 'still my choice: no second chime');
  assert.equal(count(names(), 'place'), 1, 'their choice is knocked in');
});

// Fabricated tricks: the right sound for each outcome.
function trickPair(plays, me) {
  const base = SK.newGame({ players: [{ name: 'You' }, { name: 'A' }, { name: 'B' }], schedule: 'swift', seed: 1, firstDealer: 0, opts: { kraken: true, whale: true } });
  const prev = JSON.parse(JSON.stringify(base));
  // an online snapshot can bring a whole trick at once: all three cards, then the outcome
  prev.phase = 'play'; prev.bids = [1, 1, 1]; prev.trick = []; prev.turn = plays[0][0];
  const next = JSON.parse(JSON.stringify(prev));
  const full = plays.map(([p, id]) => ({ p, id }));
  const res = SK.resolveTrick(full);
  next.trick = []; next.tricksDone = 1; next.turn = res.next; next.seq++;
  next.lastTrick = { plays: full, winner: res.winner, how: res.how, bonus: res.bonus, next: res.next, n: 1 };
  heard = []; celebrations = [];
  SKFX.react(prev, next, me);
  return names();
}
const ID = k => SK.CARDS.find(c => c.k === k).id;
const PIR = ID('pir'), KING = ID('sk'), MER = ID('mer'), KRA = ID('kra'), WHA = ID('wha');
const num = (s, r) => SK.CARDS.find(c => c.k === 'num' && c.s === s && c.r === r).id;

test('Skull King captures a pirate: cutlass, skull king, capture', () => {
  const h = trickPair([[1, PIR], [2, KING], [0, num(1, 3)]], 0);
  assert.ok(h.indexOf('cutlass') >= 0 && h.indexOf('skullKing') >= 0 && h.indexOf('capture') >= 0, h.join(','));
  assert.equal(celebrations.length, 0);
});
test('Mermaid captures the Skull King: capture + a big moment when it is you', () => {
  let h = trickPair([[1, KING], [2, num(2, 5)], [0, MER]], 0);
  assert.ok(h.indexOf('mermaid') >= 0 && h.indexOf('capture') >= 0, h.join(','));
  assert.deepEqual(celebrations, ['big']);
  h = trickPair([[1, KING], [2, MER], [0, num(2, 5)]], 0);
  assert.deepEqual(celebrations, [], 'no big moment for someone else');
});
test('Kraken sinks the trick, White Whale has its own call, a plain trick is swept', () => {
  let h = trickPair([[1, num(1, 9)], [2, KRA], [0, num(1, 3)]], 0);
  assert.ok(h.indexOf('kraken') >= 0 && h.indexOf('sink') >= 0, h.join(','));
  h = trickPair([[1, num(1, 9)], [2, WHA], [0, num(1, 3)]], 0);
  assert.ok(h.indexOf('whale') >= 0, h.join(','));
  h = trickPair([[1, num(1, 9)], [2, num(1, 4)], [0, num(1, 3)]], 0);
  assert.deepEqual(h, ['cardFlip', 'cardFlip', 'cardFlip', 'cardSlide']);
});

test('Sound off: no sound plays; Game sounds off: no card sounds but the chime stays', () => {
  FX.set('sound', false);
  const before = FX.stats.plays;
  heard = [];
  playGame({}, 0, 11);
  assert.equal(FX.stats.plays, before, 'nothing reached the speaker');
  assert.ok(heard.length > 0 && heard.every(x => !x.ok));
  FX.set('sound', true);
  FX.set('moves', false);
  heard = [];
  playGame({}, 0, 11);
  const h = names();
  assert.ok(h.indexOf('cardFlip') < 0 && h.indexOf('shuffle') < 0, h.join(','));
  assert.ok(h.indexOf('turn') >= 0, 'alerts still on');
  FX.set('moves', true);
});

test('Animations off: no animation runs; on: they do', () => {
  FX.set('animations', true);
  let a0 = SKFX.stats.anims;
  playGame({}, 0, 5);
  assert.ok(SKFX.stats.anims > a0, 'animations requested');
  FX.set('animations', false);
  a0 = SKFX.stats.anims;
  playGame({}, 0, 5);
  assert.equal(SKFX.stats.anims, a0, 'none with Animations off');
  FX.set('animations', true);
});

test('game over celebrates win for the winner and lose for the others', () => {
  celebrations = [];
  const { st } = playGame({}, 0, 21);
  const w = SK.winners(st);
  assert.deepEqual(celebrations.filter(k => k !== 'big'), [w.indexOf(0) >= 0 ? 'win' : 'lose']);
  // the same final step seen from the other seats
  for (const me of [1, 2]) {
    celebrations = [];
    const prev = JSON.parse(JSON.stringify(st)); prev.phase = 'play'; prev.history = prev.history.slice(0, -1);
    SKFX.react(prev, st, me);
    assert.deepEqual(celebrations, [w.indexOf(me) >= 0 ? 'win' : 'lose'], 'seat ' + me);
  }
  FX.set('celebrations', false);
  celebrations = [];
  const prev = JSON.parse(JSON.stringify(st)); prev.phase = 'play'; prev.history = prev.history.slice(0, -1);
  heard = [];
  const p0 = FX.stats.plays;
  SKFX.react(prev, st, 0);
  assert.equal(FX.stats.plays - p0, names().length, 'no fanfare with Celebrations off (only the game sounds played)');
  FX.set('celebrations', true);
  heard = [];
  const p1 = FX.stats.plays;
  SKFX.react(prev, st, 0);
  assert.ok(FX.stats.plays - p1 > names().length, 'the fanfare plays with Celebrations on');
  FX.set('celebrations', true);
});

test('no sound before the first tap (iOS)', () => {
  // a fresh copy of fx.js that has never seen a gesture
  delete require.cache[require.resolve('../js/fx.js')];
  const saved = globalThis.FX; delete globalThis.FX;
  require('../js/fx.js');
  const fresh = globalThis.FX;
  assert.equal(fresh.play('cardFlip'), false);
  globalThis.FX = saved;
});

console.log(`fx: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
