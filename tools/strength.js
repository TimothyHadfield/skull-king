// Measures how strong each computer level is by playing whole 10-round games.
// usage: node tools/strength.js <games> <levelA> <levelB> [players=4] [seed=1]
// Seat 0 plays levelA, all the others play levelB. Prints seat-0 win share,
// average score gap and bid hit rate. Fair share = 1/players.
'use strict';
const SK = require('../js/engine.js');
const AI = require('../js/ai.js');

function mulberry(seed) {
  return function () {
    let t = (seed = (seed + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function playGame(levels, seed, opts, scoring, extra) {
  const rand = mulberry(seed * 7919 + 13);
  let st = SK.newGame(Object.assign({ players: levels.map((l, i) => ({ name: 'P' + i, kind: 'cpu', level: l })), seed, opts, scoring,
    firstDealer: seed % levels.length }, extra || {}));
  const hits = new Array(st.n).fill(0);
  let rounds = 0;
  while (st.phase !== 'over') {
    if (st.phase === 'roundEnd') {
      st = SK.apply(st, { type: 'next' });
      continue;
    }
    const seats = SK.whoActs(st);
    const p = seats[0];
    const a = AI.act(SK.view(st, p), p, levels[p], rand);
    const before = st.history.length;
    st = SK.apply(st, a);
    if (st.history.length > before) {
      rounds++;
      st.history[st.history.length - 1].results.forEach((r, i) => { if (r && r.made) hits[i]++; });
    }
  }
  return { scores: st.scores.slice(0, levels.length), hits, rounds, state: st };
}

if (require.main === module) {
  const games = +process.argv[2] || 100;
  const A = process.argv[3] || 'medium', B = process.argv[4] || 'easy';
  const n = +process.argv[5] || 4;
  const seed0 = +process.argv[6] || 1;
  const opts = { kraken: process.env.EXTRAS === '1', whale: process.env.EXTRAS === '1', loot: process.env.EXTRAS === '1' };
  let wins = 0, gap = 0, hitA = 0, hitB = 0, sumA = 0;
  const t0 = Date.now();
  for (let g = 0; g < games; g++) {
    const levels = [A]; for (let i = 1; i < n; i++) levels.push(B);
    const r = playGame(levels, seed0 + g, opts, 'sk');
    const best = Math.max(...r.scores);
    const tied = r.scores.filter(s => s === best).length;
    if (r.scores[0] === best) wins += 1 / tied;
    const others = r.scores.slice(1);
    gap += r.scores[0] - others.reduce((a, b) => a + b, 0) / others.length;
    sumA += r.scores[0];
    hitA += r.hits[0] / r.rounds;
    hitB += r.hits.slice(1, n).reduce((a, b) => a + b, 0) / (r.rounds * (n - 1));
  }
  const out = {
    games, players: n, seat0: A, others: B, extras: opts.kraken,
    winShare: +(wins / games).toFixed(3), fairShare: +(1 / n).toFixed(3),
    avgScore0: Math.round(sumA / games), avgGap: Math.round(gap / games),
    bidHit0: +(hitA / games).toFixed(3), bidHitOthers: +(hitB / games).toFixed(3),
    seconds: Math.round((Date.now() - t0) / 1000),
  };
  console.log(JSON.stringify(out));
}
module.exports = { playGame, mulberry };
