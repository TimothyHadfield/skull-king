// Checks the computer ladder (Hard >= Medium >= Easy) under every rule option
// a computer game can use. One seat plays levelA, the others levelB.
// usage: node tools/variant-ladder.js <games> <levelA> <levelB> [variant|all] [players=4]
// Prints one JSON line per variant: seat-0 win share (fair = 1/players) and average gap.
'use strict';
const { playGame } = require('./strength.js');

const VARIANTS = {
  base: {},
  kraken: { opts: { kraken: true } },
  whale: { opts: { whale: true } },
  loot: { opts: { loot: true } },
  extras: { opts: { kraken: true, whale: true, loot: true } },
  powers: { extra: { abilities: true } },
  rascal: { scoring: 'rascal' },
  cannonball: { scoring: 'rascal', extra: { cannonball: true } },
  evenKeeled: { extra: { schedule: 'evenKeeled' } },
  skipBrawl: { extra: { schedule: 'skipBrawl' } },
  broadside: { extra: { schedule: 'broadside' } },
  whirlpool: { extra: { schedule: 'whirlpool' } },
  everything: { opts: { kraken: true, whale: true, loot: true }, scoring: 'rascal', extra: { cannonball: true, abilities: true } },
};

function ladder(games, A, B, variant, n, seed0) {
  const v = VARIANTS[variant];
  let wins = 0, gap = 0;
  const t0 = Date.now();
  for (let g = 0; g < games; g++) {
    const levels = [A]; for (let i = 1; i < n; i++) levels.push(B);
    const r = playGame(levels, (seed0 || 1) + g, v.opts || {}, v.scoring || 'sk', v.extra);
    const best = Math.max(...r.scores);
    const tied = r.scores.filter(s => s === best).length;
    if (r.scores[0] === best) wins += 1 / tied;
    const others = r.scores.slice(1);
    gap += r.scores[0] - others.reduce((a, b) => a + b, 0) / others.length;
  }
  return { variant, games, players: n, seat0: A, others: B, winShare: +(wins / games).toFixed(3), fairShare: +(1 / n).toFixed(3),
    avgGap: Math.round(gap / games), seconds: Math.round((Date.now() - t0) / 1000) };
}

if (require.main === module) {
  const games = +process.argv[2] || 100;
  const A = process.argv[3] || 'medium', B = process.argv[4] || 'easy';
  const which = process.argv[5] || 'all';
  const n = +process.argv[6] || 4;
  for (const k of which === 'all' ? Object.keys(VARIANTS) : which.split(',')) console.log(JSON.stringify(ladder(games, A, B, k, n)));
}
module.exports = { ladder, VARIANTS };
