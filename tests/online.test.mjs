// The online adapter (js/skgame.js) and the shared layer (js/online.js), no network.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const SK = require('../js/engine.js');
const { game, merge } = require('../js/skgame.js');
// js/online.js is an ES module inside a classic-script site; load a copy as .mjs.
const tmp = mkdtempSync(join(tmpdir(), 'sk-online-'));
writeFileSync(join(tmp, 'online.mjs'), readFileSync(join(here, '../js/online.js'), 'utf8'));
const { createLocal } = await import(pathToFileURL(join(tmp, 'online.mjs')).href);

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; } catch (e) { failed++; console.log('FAIL', name, '\n  ', e.message); }
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const seatsOf = n => Array.from({ length: n }, (_, i) => ({ kind: i === 0 ? 'human' : 'computer', name: i === 0 ? 'Tim' : '' }));
const CONFIGS = [
  {},
  { opts: { kraken: true, whale: true, loot: true }, abilities: true, schedule: 'swift' },
  { scoring: 'rascal', cannonball: true, schedule: 'swift' },
];

await test('bot-only games through the adapter: toAct never empty, state survives JSON, no round-end stop', () => {
  for (let g = 0; g < 60; g++) {
    const rng = mulberry(g + 1);
    const n = 2 + (g % 7);
    let s = game.setup(n, Object.assign({ schedule: 'swift' }, CONFIGS[g % 3]), rng, seatsOf(n));
    let steps = 0;
    while (!game.isOver(s)) {
      assert.notEqual(s.phase, 'roundEnd', 'online skips the round-end pause');
      const toAct = game.toAct(s);
      assert.ok(toAct.length > 0, 'someone must act');
      for (const seat of toAct) {
        if (game.isOver(s) || !game.toAct(s).includes(seat)) continue;
        const ctx = { pub: game.publicView(s), mine: game.privateView(s, seat), state: s };
        s = game.apply(JSON.parse(JSON.stringify(s)), seat, game.bot(ctx, seat, rng));
      }
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
      assert.ok(++steps < 5000);
    }
    assert.equal(s.history.length >= SK.SCHEDULES.swift.sizes.length, true);
  }
});

await test('secrecy: the public view has no hands, seed, undealt cards or hidden bids', () => {
  let s = game.setup(4, { abilities: true }, mulberry(9), seatsOf(4));
  const pub = game.publicView(s);
  assert.ok(pub.hands.every(h => h === null));
  assert.equal(pub.undealt, null);
  assert.equal(pub.seed, undefined);
  s = game.apply(s, 2, { type: 'bid', bid: 1 });
  const pub2 = game.publicView(s);
  assert.equal(pub2.bids[2], null, 'bid stays hidden until everyone has bid');
  assert.equal(pub2.bidIn[2], true);
  assert.equal(game.privateView(s, 2).bid, 1);
  assert.equal(game.privateView(s, 1).bid, null, "seat 1 can't see seat 2's bid");
  for (let p = 0; p < 4; p++) {
    const mine = game.privateView(s, p);
    assert.deepEqual(mine.hand, s.hands[p]);
    for (let q = 0; q < 4; q++) if (q !== p) for (const c of s.hands[q]) assert.ok(mine.hand.indexOf(c) < 0);
  }
});

await test("merge(public, private) gives the seat the same view as the full state", () => {
  let s = game.setup(3, { opts: { kraken: true } }, mulberry(4), seatsOf(3));
  const rng = mulberry(5);
  for (let k = 0; k < 40 && !game.isOver(s); k++) {
    for (let seat = 0; seat < 3; seat++) {
      const a = SK.view(s, seat);
      const b = SK.view(merge(game.publicView(s), game.privateView(s, seat), seat), seat);
      for (const f of ['phase', 'round', 'trick', 'bids', 'scores', 'won', 'turn', 'handCounts', 'undealtCount', 'cards', 'bidIn']) assert.deepEqual(b[f], a[f], f);
      assert.deepEqual(b.hands[seat], a.hands[seat]);
      assert.deepEqual(SK.legalPlays(merge(game.publicView(s), game.privateView(s, seat), seat), seat), SK.legalPlays(s, seat));
    }
    const seat = game.toAct(s)[0];
    s = game.apply(s, seat, game.bot({ state: s }, seat, rng));
  }
});

await test('apply rejects a card from another hand and moves out of turn', () => {
  let s = game.setup(3, {}, mulberry(2), seatsOf(3));
  for (let p = 0; p < 3; p++) s = game.apply(s, p, { type: 'bid', bid: 0 });
  const t = s.turn, other = (t + 1) % 3;
  assert.throws(() => game.apply(s, t, { type: 'play', card: s.hands[other][0] }));
  assert.throws(() => game.apply(s, other, { type: 'play', card: s.hands[other][0] }));
  assert.throws(() => game.apply(s, t, { type: 'next' }));
});

await test('createLocal: one human and three computers play a whole game', async () => {
  const room = createLocal({ game, seats: ['human', 'computer', 'computer', 'computer'], names: ['You'], options: { schedule: 'swift' }, botDelayMs: 0, rng: mulberry(11) });
  let last = null, errors = 0;
  room.on('change', snap => { last = snap; });
  room.on('error', () => errors++);
  room.start();
  for (let i = 0; i < 4000 && last.status !== 'finished'; i++) {
    if (last.myTurn) {
      const st = merge(last.pub, last.mine, last.mySeat);
      const v = SK.view(st, last.mySeat);
      const a = v.phase === 'bid' ? { type: 'bid', bid: 1 } : v.phase === 'play' ? { type: 'play', card: SK.legalPlays(st, last.mySeat)[0], as: 'pir' } : { type: 'ability' };
      assert.equal(room.act(a).ok, true);
    }
    await new Promise(r => setTimeout(r, 1));
  }
  assert.equal(last.status, 'finished');
  assert.equal(errors, 0);
  assert.equal(last.pub.phase, 'over');
});

console.log(`online: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
