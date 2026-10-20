/* Skull King adapter for the shared online layer (js/online.js).
 * Wraps the pure engine (engine.js) and the computer players (ai.js) in the
 * game shape online.js expects: setup / toAct / apply / publicView /
 * privateView / bot / isOver. Works in the browser (window.SKGame) and in node. */
(function (root) {
  'use strict';
  const SK = typeof module !== 'undefined' && module.exports ? require('./engine.js') : root.SK;
  const AI = typeof module !== 'undefined' && module.exports ? require('./ai.js') : root.SKAI;
  const CPU_NAMES = ['Anne', 'Edward', 'Grace', 'Henry', 'Mary', 'William', 'Ching', 'Jack'];

  // Round results are part of the state's history, so the round-end pause is
  // skipped online: the next round is dealt at once and each player's app
  // shows the results from the history.
  function settle(st) {
    if (st.phase === 'roundEnd') st = SK.apply(st, { type: 'next' });
    return st;
  }

  const game = {
    id: 'skull-king',
    minSeats: 2, maxSeats: 8,
    setup(nSeats, options, rng, seats) {
      const o = options || {};
      let cpu = 0;
      const players = seats.map((s, i) => {
        const isCpu = s.kind === 'computer';
        const level = isCpu ? ((o.levels && o.levels[i]) || 'medium') : null;
        const name = isCpu ? CPU_NAMES[cpu++ % CPU_NAMES.length] : (s.name || 'Player ' + (i + 1));
        return { name, kind: isCpu ? 'cpu' : 'human', level };
      });
      return SK.newGame({
        players, opts: o.opts || {}, scoring: o.scoring, cannonball: o.cannonball, abilities: o.abilities,
        schedule: o.schedule, ghost: o.ghost, seed: Math.floor(rng() * 2147483647), firstDealer: Math.floor(rng() * nSeats),
      });
    },
    toAct(st) { return SK.whoActs(st); },
    apply(st, seat, action) {
      const a = Object.assign({}, action, { seat });
      if (a.type === 'next') throw new Error('rounds advance by themselves online');
      return settle(SK.apply(st, a));
    },
    publicView(st) {
      const v = SK.view(st, -1);
      v.hands = v.hands.map(() => null);
      return v;
    },
    // Only this seat's secrets; kept small and stable to save the free quota.
    privateView(st, seat) {
      const peek = st.phase === 'ability' && st.pending && st.pending.seat === seat && st.pending.ability === 'juanita';
      return {
        hand: (st.hands[seat] || []).slice(),
        bid: st.bids[seat] == null ? null : st.bids[seat],
        cannon: !!st.cannon[seat],
        undealt: peek ? st.undealt.slice() : null,
        drawn: st.pending && st.pending.seat === seat && st.pending.drawn ? st.pending.drawn.slice() : null,
      };
    },
    bot(ctx, seat, rng) {
      const st = ctx.state || merge(ctx.pub, ctx.mine, seat);
      const level = (st.players[seat] && st.players[seat].level) || 'medium';
      return AI.act(SK.view(st, seat), seat, level, rng);
    },
    isOver(st) { return st.phase === 'over'; },
  };

  // Rebuild a full-state-shaped object from what one seat may see, so the
  // same screens, odds and study tools work online. Other hands are filled
  // with -1 placeholders of the right length.
  function merge(pub, mine, seat) {
    const st = JSON.parse(JSON.stringify(pub));
    st.hands = (pub.handCounts || []).map((c, p) => (p === seat && mine ? mine.hand.slice() : new Array(c).fill(-1)));
    st.undealt = mine && mine.undealt ? mine.undealt.slice() : new Array(pub.undealtCount || 0).fill(-1);
    if (mine && seat >= 0) {
      st.bids[seat] = mine.bid;
      if (st.phase === 'cannon') st.cannon[seat] = mine.cannon;
      if (mine.drawn && st.pending) st.pending.drawn = mine.drawn.slice();
    }
    st.seed = 0;
    return st;
  }

  const SKGame = { game, merge, settle };
  if (typeof module !== 'undefined' && module.exports) module.exports = SKGame;
  else root.SKGame = SKGame;
})(typeof self !== 'undefined' ? self : this);
