/* Skull King rules engine. Pure functions, no DOM, works in the browser and Node.
 * Rules follow the current official rulebook (2024 printing); every number is
 * checked in docs/rules-check.md.
 *
 * Shape (so local, computer and online seats are interchangeable):
 *   newGame(config)         -> state   (plain JSON, card ids only)
 *   apply(state, action)    -> new state (throws Error on an illegal action)
 *   view(state, seat)       -> copy of state with other players' secrets hidden
 *   legalPlays(state, seat) -> card ids that seat may play now
 *   whoActs(state)          -> seats the game is waiting on
 * Randomness comes from a seed stored in the state, so every client that applies
 * the same actions gets the same deal.
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- cards
  // Suits: 0 black (Jolly Roger, trump), 1 yellow (treasure chest),
  // 2 purple (pirate map), 3 green (parrot). Ids are fixed whatever the options,
  // so a saved hand or an online action means the same card everywhere.
  const SUIT_NAMES = ['Black', 'Yellow', 'Purple', 'Green'];
  const PIRATES = [
    { name: "Rosie D'Laney", ability: 'rosie' },
    { name: 'Bendt the Bandit', ability: 'bendt' },
    { name: 'Rascal of Roatan', ability: 'rascal' },
    { name: 'Juanita Jade', ability: 'juanita' },
    { name: 'Harry the Giant', ability: 'harry' },
  ];
  const CARDS = [];
  (function build() {
    let id = 0;
    for (let s = 0; s < 4; s++) for (let r = 1; r <= 14; r++) CARDS.push({ id: id++, k: 'num', s, r });
    for (let i = 0; i < 5; i++) CARDS.push({ id: id++, k: 'esc', s: -1, r: 0 });
    for (let i = 0; i < 5; i++) CARDS.push({ id: id++, k: 'pir', s: -1, r: 0, name: PIRATES[i].name, ability: PIRATES[i].ability });
    CARDS.push({ id: id++, k: 'tig', s: -1, r: 0 });
    CARDS.push({ id: id++, k: 'sk', s: -1, r: 0 });
    for (let i = 0; i < 2; i++) CARDS.push({ id: id++, k: 'mer', s: -1, r: 0 });
    // ids 70..73: the optional advanced cards
    CARDS.push({ id: id++, k: 'kra', s: -1, r: 0 });
    CARDS.push({ id: id++, k: 'wha', s: -1, r: 0 });
    for (let i = 0; i < 2; i++) CARDS.push({ id: id++, k: 'loot', s: -1, r: 0 });
  })();
  const BASE_COUNT = 70; // 56 numbers + 5 escapes + 5 pirates + Tigress + Skull King + 2 mermaids

  // Official round-length variants (rulebook "Variable Card Counts").
  const SCHEDULES = {
    standard: { name: 'Standard', sizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    evenKeeled: { name: 'Even Keeled', sizes: [2, 4, 6, 8, 10] },
    skipBrawl: { name: 'Skip to the Brawl', sizes: [6, 7, 8, 9, 10] },
    swift: { name: 'Swift-n-Salty', sizes: [5, 5, 5, 5, 5] },
    broadside: { name: 'Broadside Barrage', sizes: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10] },
    whirlpool: { name: 'Whirlpool', sizes: [9, 7, 5, 3, 1, 9, 7, 5, 3, 1] },
    bedtime: { name: 'Past Your Bedtime', sizes: [1] },
  };

  function deckIds(opts) {
    opts = opts || {};
    const ids = [];
    for (const c of CARDS) {
      if (c.id < BASE_COUNT) ids.push(c.id);
      else if (c.k === 'kra' && opts.kraken) ids.push(c.id);
      else if (c.k === 'wha' && opts.whale) ids.push(c.id);
      else if (c.k === 'loot' && opts.loot) ids.push(c.id);
    }
    return ids;
  }

  function cardName(id) {
    const c = CARDS[id];
    switch (c.k) {
      case 'num': return SUIT_NAMES[c.s] + ' ' + c.r;
      case 'esc': return 'Escape';
      case 'pir': return c.name;
      case 'tig': return 'Tigress';
      case 'sk': return 'Skull King';
      case 'mer': return 'Mermaid';
      case 'kra': return 'Kraken';
      case 'wha': return 'White Whale';
      case 'loot': return 'Loot';
    }
    return '?';
  }

  // ------------------------------------------------------------------ rng
  function rngNext(state) { // mulberry32 on a seed kept in the state
    let t = (state.seed = (state.seed + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function shuffle(arr, rand) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------------------------------------------------------- trick rules
  // A play is {p: seat, id: cardId, as?: 'pir'|'esc'}. `as` is how the Tigress
  // is used; the engine also sets as:'esc' internally to make a Kraken or White
  // Whale count as an escape when the other one is the one in force.
  function eff(pl) {
    const k = CARDS[pl.id].k;
    if (k === 'tig') return pl.as === 'esc' ? 'esc' : 'pir';
    if (pl.as === 'esc') return 'esc';
    return k;
  }

  // Suit everyone must follow, or -1 when there is none: nothing led yet, only
  // escapes/loot so far, or a character/Kraken/White Whale came first.
  function leadSuit(plays) {
    for (const pl of plays) {
      const e = eff(pl);
      if (e === 'esc' || e === 'loot') continue;
      if (e === 'num') return CARDS[pl.id].s;
      return -1;
    }
    return -1;
  }

  // Special cards may always be played; a suited card must match the lead suit
  // if you hold that suit.
  function legalFrom(hand, plays) {
    const ls = leadSuit(plays);
    if (ls < 0) return hand.slice();
    const has = hand.some(id => CARDS[id].k === 'num' && CARDS[id].s === ls);
    if (!has) return hand.slice();
    return hand.filter(id => CARDS[id].k !== 'num' || CARDS[id].s === ls);
  }

  function bonus14(plays) {
    let b = 0;
    for (const pl of plays) {
      const c = CARDS[pl.id];
      if (c.k === 'num' && c.r === 14) b += c.s === 0 ? 20 : 10;
    }
    return b;
  }

  // Resolution with no Kraken/White Whale in force.
  function resolveNormal(plays) {
    let king = -1, firstMer = -1, firstPir = -1, mers = 0, pirs = 0;
    for (let i = 0; i < plays.length; i++) {
      const e = eff(plays[i]);
      if (e === 'sk') king = i;
      else if (e === 'mer') { mers++; if (firstMer < 0) firstMer = i; }
      else if (e === 'pir') { pirs++; if (firstPir < 0) firstPir = i; }
    }
    let wi, charBonus = 0, how;
    // A mermaid takes the Skull King (even with pirates in the trick): only the +40 is paid.
    if (king >= 0 && firstMer >= 0) { wi = firstMer; charBonus = 40; how = 'mermaid-king'; }
    else if (king >= 0) { wi = king; charBonus = 30 * pirs; how = 'king'; }
    else if (firstPir >= 0) { wi = firstPir; charBonus = 20 * mers; how = 'pirate'; }
    else if (firstMer >= 0) { wi = firstMer; how = 'mermaid'; }
    else {
      const ls = leadSuit(plays);
      let bestB = -1, bestL = -1;
      for (let i = 0; i < plays.length; i++) {
        if (eff(plays[i]) !== 'num') continue;
        const c = CARDS[plays[i].id];
        if (c.s === 0) { if (bestB < 0 || c.r > CARDS[plays[bestB].id].r) bestB = i; }
        else if (c.s === ls) { if (bestL < 0 || c.r > CARDS[plays[bestL].id].r) bestL = i; }
      }
      if (bestB >= 0) { wi = bestB; how = 'trump'; }
      else if (bestL >= 0) { wi = bestL; how = 'suit'; }
      else { wi = 0; how = 'escapes'; } // all escapes: first one played wins
    }
    return { wi, winner: plays[wi].p, next: plays[wi].p, destroyed: false, how,
      charBonus, bonus: charBonus + bonus14(plays) };
  }

  function asEscape(pl) { return { p: pl.p, id: pl.id, as: 'esc' }; }

  // Full resolution of a trick (partial tricks too, for the computer players).
  // Returns {winner|null, wi, next, destroyed, bonus, charBonus, how}.
  function resolveTrick(plays) {
    let kr = -1, wh = -1;
    for (let i = 0; i < plays.length; i++) {
      const k = CARDS[plays[i].id].k;
      if (k === 'kra') kr = i; else if (k === 'wha') wh = i;
    }
    if (kr < 0 && wh < 0) return resolveNormal(plays);
    // Both in one trick: the second one played acts, the first is an escape.
    if (kr > wh) {
      // Kraken: nobody takes the trick; whoever would have won leads next.
      const rest = [];
      for (let i = 0; i < plays.length; i++) {
        if (i === kr) continue;
        rest.push(i === wh ? asEscape(plays[i]) : plays[i]);
      }
      const r = rest.length ? resolveNormal(rest) : null;
      return { wi: -1, winner: null, next: r ? r.winner : plays[kr].p, destroyed: true, how: 'kraken', bonus: 0, charBonus: 0 };
    }
    // White Whale: special cards count for nothing; the highest number wins,
    // whatever its suit (first played wins a tie).
    let best = -1;
    for (let i = 0; i < plays.length; i++) {
      const c = CARDS[plays[i].id];
      if (c.k === 'num' && (best < 0 || c.r > CARDS[plays[best].id].r)) best = i;
    }
    if (best < 0) {
      // Only specials: trick discarded; the player who would have won leads (2024 rulebook).
      const rest = [];
      for (let i = 0; i < plays.length; i++) if (i !== wh) rest.push(i === kr ? asEscape(plays[i]) : plays[i]);
      const r = rest.length ? resolveNormal(rest) : null;
      return { wi: -1, winner: null, next: r ? r.winner : plays[wh].p, destroyed: true, how: 'whale', bonus: 0, charBonus: 0 };
    }
    return { wi: best, winner: plays[best].p, next: plays[best].p, destroyed: false, how: 'whale',
      charBonus: 0, bonus: bonus14(plays) };
  }

  // -------------------------------------------------------------- scoring
  // mode 'sk' (standard) or 'rascal'. cards = cards dealt that round.
  // bonus = bonus points captured (only paid on a hit; half on a Rascal glancing blow).
  function roundScore(bid, tricks, bonus, cards, mode, cannon) {
    const d = Math.abs(bid - tricks);
    if (mode === 'rascal') {
      if (cannon) return d === 0 ? 15 * cards + bonus : 0;
      if (d === 0) return 10 * cards + bonus;
      if (d === 1) return (10 * cards + bonus) / 2;
      return 0;
    }
    if (bid === 0) return tricks === 0 ? 10 * cards + bonus : -10 * cards;
    return d === 0 ? 20 * bid + bonus : -10 * d;
  }

  // --------------------------------------------------------------- the game
  function cardsFor(st, round) {
    const sizes = SCHEDULES[st.schedule].sizes;
    const want = round <= sizes.length ? sizes[round - 1] : sizes[sizes.length - 1]; // tie-break rounds repeat the last size
    return Math.min(want, Math.floor(BASE_COUNT / st.n)); // 8 players: 8 cards max
  }

  /* config: {
   *   players: [{name, kind:'human'|'cpu'|'online', level?}]  (2-8),
   *   opts: {kraken, whale, loot}, scoring: 'sk'|'rascal', cannonball: bool,
   *   abilities: bool (pirate abilities), schedule: key of SCHEDULES,
   *   ghost: bool (2 players: Graybeard's ghost hand, default true), tiebreak: bool (default true),
   *   seed?: int, firstDealer?: int } */
  function newGame(config) {
    const players = config.players.map((p, i) => ({
      name: Array.from(String(p.name || 'Player ' + (i + 1))).slice(0, 20).join(''), kind: p.kind || 'human', level: p.level || null }));
    if (players.length < 2 || players.length > 8) throw new Error('2 to 8 players');
    const humans = players.length;
    let ghost = -1;
    if (humans === 2 && config.ghost !== false) {
      ghost = 2;
      players.push({ name: "Graybeard's ghost", kind: 'ghost', level: null });
    }
    const n = players.length;
    const opts = Object.assign({ kraken: false, whale: false, loot: false }, config.opts || {});
    if (humans === 2) opts.loot = false; // Loot isn't used with two players
    const st = {
      v: 2, n, humans, ghost, players, opts,
      scoring: config.scoring === 'rascal' ? 'rascal' : 'sk',
      cannonball: config.scoring === 'rascal' && !!config.cannonball,
      abilities: !!config.abilities,
      schedule: SCHEDULES[config.schedule] ? config.schedule : 'standard',
      tiebreak: config.tiebreak !== false,
      seed: (config.seed == null ? Math.floor(Math.random() * 2147483647) : config.seed) | 0,
      dealer: ((config.firstDealer == null ? humans - 1 : config.firstDealer) % humans),
      round: 0, phase: 'idle', scores: new Array(n).fill(0), history: [],
      hands: [], undealt: [], bids: [], cannon: [], cannonIn: [], won: [], bonus: [], bets: [], alliances: [],
      trick: [], order: [], lastTrick: null, leader: 0, roundLeader: 0, turn: -1, tricksDone: 0, cards: 0,
      voids: [], played: [], pending: null, seq: 0,
    };
    return startRound(st);
  }

  function clone(s) { return JSON.parse(JSON.stringify(s)); }

  function trickOrder(st, leader) {
    if (st.ghost < 0) {
      const o = [];
      for (let i = 0; i < st.n; i++) o.push((leader + i) % st.n);
      return o;
    }
    // Two players + ghost: the ghost always plays second; if it leads, the
    // player who led the round goes next.
    if (leader === st.ghost) return [st.ghost, st.roundLeader, 1 - st.roundLeader];
    return [leader, st.ghost, 1 - leader];
  }

  function startRound(st) {
    st.round++;
    st.dealer = (st.dealer + 1) % st.humans;
    const deck = shuffle(deckIds(st.opts), () => rngNext(st));
    st.cards = cardsFor(st, st.round);
    st.hands = [];
    for (let p = 0; p < st.n; p++) {
      const h = deck.slice(p * st.cards, (p + 1) * st.cards);
      st.hands.push(p === st.ghost ? h : h.sort((a, b) => a - b)); // the ghost's pile stays in deal order
    }
    st.undealt = deck.slice(st.n * st.cards);
    st.bids = st.players.map((pl, p) => (p === st.ghost ? 0 : null));
    st.cannon = new Array(st.n).fill(false);
    st.cannonIn = new Array(st.n).fill(false);
    st.won = new Array(st.n).fill(0);
    st.bonus = new Array(st.n).fill(0);
    st.bets = new Array(st.n).fill(0);
    st.alliances = [];
    st.trick = []; st.lastTrick = null; st.tricksDone = 0; st.pending = null;
    st.roundLeader = (st.dealer + 1) % st.humans;
    st.leader = st.roundLeader;
    st.order = trickOrder(st, st.leader);
    st.turn = -1;
    st.voids = Array.from({ length: st.n }, () => [false, false, false, false]);
    st.played = [];
    st.phase = 'bid';
    return st;
  }

  function legalPlays(st, seat) {
    if (st.phase !== 'play' || st.turn !== seat) return [];
    if (seat === st.ghost) return st.hands[seat].slice(0, 1);
    return legalFrom(st.hands[seat], st.trick);
  }

  function whoActs(st) {
    if (st.phase === 'bid') return st.bids.map((b, p) => (b == null ? p : -1)).filter(p => p >= 0);
    if (st.phase === 'cannon') return st.cannonIn.map((c, p) => (!c && p !== st.ghost ? p : -1)).filter(p => p >= 0);
    if (st.phase === 'play') return [st.turn];
    if (st.phase === 'ability') return [st.pending.seat];
    return [];
  }

  function beginPlay(st) {
    st.phase = 'play';
    st.order = trickOrder(st, st.leader);
    st.turn = st.order[0];
    ghostMoves(st);
  }

  function ghostMoves(st) {
    while (st.phase === 'play' && st.turn === st.ghost) {
      const id = st.hands[st.ghost][0];
      doPlay(st, st.ghost, id, 'esc'); // the ghost always uses the Tigress as an escape
    }
  }

  function doPlay(st, p, id, as) {
    const hand = st.hands[p];
    const pl = { p, id };
    if (CARDS[id].k === 'tig') pl.as = as;
    const ls = leadSuit(st.trick);
    if (ls >= 0 && p !== st.ghost && CARDS[id].k === 'num' && CARDS[id].s !== ls) st.voids[p][ls] = true;
    hand.splice(hand.indexOf(id), 1);
    st.trick.push(pl);
    st.played.push(id);
    if (st.trick.length < st.n) { st.turn = st.order[st.trick.length]; return; }
    // trick complete
    const res = resolveTrick(st.trick);
    let w = res.winner;
    if (w != null && w !== st.ghost) {
      st.won[w]++;
      st.bonus[w] += res.bonus;
      for (const t of st.trick) {
        if (CARDS[t.id].k === 'loot' && t.p !== w) st.alliances.push([t.p, w]);
      }
    } else if (w === st.ghost) {
      st.won[w]++; // the ghost's tricks count for nobody
    }
    st.lastTrick = { plays: st.trick, winner: w, how: res.how, bonus: res.bonus, next: res.next, n: st.tricksDone + 1 };
    st.trick = [];
    st.tricksDone++;
    st.leader = res.next;
    st.turn = -1;
    // Pirate abilities: only when a (real) pirate wins the trick for a player.
    if (st.abilities && w != null && w !== st.ghost && res.how === 'pirate') {
      const wc = CARDS[st.lastTrick.plays[res.wi].id];
      if (wc.k === 'pir') {
        const last = st.tricksDone === st.cards;
        if (!last || wc.ability === 'harry') {
          st.pending = { seat: w, ability: wc.ability };
          if (wc.ability === 'bendt') {
            const drawn = st.undealt.splice(0, 2);
            st.pending.drawn = drawn;
            st.hands[w].push(...drawn);
            st.hands[w].sort((a, b) => a - b);
            if (!drawn.length) st.pending = null; // nothing left to draw
          }
          if (st.pending) { st.phase = 'ability'; return; }
        }
      }
    }
    afterTrick(st);
  }

  function afterTrick(st) {
    if (st.tricksDone === st.cards) { endRound(st); return; }
    st.phase = 'play';
    st.order = trickOrder(st, st.leader);
    st.turn = st.order[0];
  }

  function apply(state, action) {
    const st = clone(state);
    st.seq = (st.seq || 0) + 1;
    const p = action.seat;
    switch (action.type) {
      case 'bid': {
        if (st.phase !== 'bid') throw new Error('not bidding now');
        if (!(p >= 0 && p < st.n) || p === st.ghost) throw new Error('bad seat');
        if (st.bids[p] != null) throw new Error('already bid');
        const raw = action.bid; // a missing/blank bid must not count as 0
        const b = typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '') ? Number(raw) : NaN;
        if (!Number.isInteger(b) || b < 0 || b > st.cards) throw new Error('bid out of range');
        st.bids[p] = b;
        if (st.bids.every(x => x != null)) {
          if (st.cannonball) st.phase = 'cannon';
          else beginPlay(st);
        }
        return st;
      }
      case 'cannon': { // Rascal add-on: chosen after bids are shown
        if (st.phase !== 'cannon') throw new Error('not choosing now');
        if (!(p >= 0 && p < st.n) || p === st.ghost || st.cannonIn[p]) throw new Error('bad seat');
        st.cannon[p] = !!action.on;
        st.cannonIn[p] = true;
        if (st.cannonIn.every((c, i) => c || i === st.ghost)) beginPlay(st);
        return st;
      }
      case 'play': {
        if (st.phase !== 'play') throw new Error('not playing now');
        const id = action.card;
        if (p !== st.turn || p === st.ghost) throw new Error('not your turn');
        if (st.hands[p].indexOf(id) < 0) throw new Error('card not in hand');
        if (legalFrom(st.hands[p], st.trick).indexOf(id) < 0) throw new Error('must follow suit');
        if (CARDS[id].k === 'tig' && action.as !== 'pir' && action.as !== 'esc') throw new Error('choose pirate or escape');
        doPlay(st, p, id, action.as);
        ghostMoves(st);
        return st;
      }
      case 'ability': {
        if (st.phase !== 'ability' || !st.pending || p !== st.pending.seat) throw new Error('no ability to use');
        const a = st.pending.ability;
        if (a === 'rosie') {
          const lead = Number(action.lead);
          if (!(lead >= 0 && lead < st.n)) throw new Error('pick a player');
          st.leader = lead;
        } else if (a === 'bendt') {
          const ds = action.discard || [];
          const need = st.pending.drawn.length;
          if (ds.length !== need || new Set(ds).size !== need || ds.some(id => st.hands[p].indexOf(id) < 0)) throw new Error('discard ' + need + ' cards');
          for (const id of ds) st.hands[p].splice(st.hands[p].indexOf(id), 1);
        } else if (a === 'rascal') {
          const bet = Number(action.bet);
          if ([0, 10, 20].indexOf(bet) < 0) throw new Error('bet 0, 10 or 20');
          st.bets[p] += bet;
        } else if (a === 'harry') {
          const d = Number(action.delta);
          if ([-1, 0, 1].indexOf(d) < 0) throw new Error('change by -1, 0 or +1');
          st.bids[p] = Math.max(0, Math.min(st.cards, st.bids[p] + d));
        } // juanita: looking is the whole ability
        st.pending = null;
        afterTrick(st);
        ghostMoves(st);
        return st;
      }
      case 'next': {
        if (st.phase !== 'roundEnd') throw new Error('round not over');
        startRound(st);
        return st;
      }
      default: throw new Error('unknown action ' + action.type);
    }
  }

  function roundResults(st) {
    const out = [];
    for (let p = 0; p < st.n; p++) {
      if (p === st.ghost) { out.push(null); continue; }
      const made = st.bids[p] === st.won[p];
      let ally = 0;
      for (const [a, b] of st.alliances) {
        if ((a === p || b === p) && st.bids[a] === st.won[a] && st.bids[b] === st.won[b]) ally += 20;
      }
      const bonus = st.bonus[p] + ally;
      let pts = roundScore(st.bids[p], st.won[p], bonus, st.cards, st.scoring, st.cannon[p]);
      const bet = st.bets[p] ? (made ? st.bets[p] : -st.bets[p]) : 0; // Rascal of Roatan wager
      pts += bet;
      const d = Math.abs(st.bids[p] - st.won[p]);
      const bonusPaid = made ? bonus : (st.scoring === 'rascal' && !st.cannon[p] && d === 1 ? bonus / 2 : 0);
      out.push({ bid: st.bids[p], won: st.won[p], made, bonus: bonusPaid, bet, pts, cannon: st.cannon[p] });
    }
    return out;
  }

  function endRound(st) {
    const res = roundResults(st);
    res.forEach((r, p) => { if (r) st.scores[p] += r.pts; });
    st.history.push({ round: st.round, cards: st.cards, results: res, totals: st.scores.slice() });
    st.turn = -1;
    const planned = SCHEDULES[st.schedule].sizes.length;
    const tied = winners(st).length > 1;
    st.phase = st.round >= planned && !(st.tiebreak && tied) ? 'over' : 'roundEnd';
  }

  // Hide what this seat can't see: other hands (count only), other bids until
  // everyone has bid, the undealt cards (unless Juanita lets this seat look),
  // and the seed so the next deal can't be predicted.
  function view(state, seat) {
    const v = clone(state);
    delete v.seed;
    v.handCounts = state.hands.map(h => h.length);
    v.hands = state.hands.map((h, p) => (p === seat ? h.slice() : null));
    const peek = state.phase === 'ability' && state.pending && state.pending.seat === seat && state.pending.ability === 'juanita';
    v.undealt = peek ? state.undealt.slice() : null;
    v.undealtCount = state.undealt.length;
    if (state.pending && state.pending.seat !== seat) delete v.pending.drawn;
    if (state.phase === 'bid') {
      v.bids = state.bids.map((b, p) => (p === seat || p === state.ghost ? b : null));
      v.bidIn = state.bidIn ? state.bidIn.slice() : state.bids.map(b => b != null); // a rebuilt online view keeps the room's list
    }
    if (state.phase === 'cannon') v.cannon = state.cannon.map((c, p) => (p === seat ? c : false));
    v.seat = seat;
    return v;
  }

  function winners(st) {
    let best = -Infinity;
    for (let p = 0; p < st.n; p++) if (p !== st.ghost && st.scores[p] > best) best = st.scores[p];
    const out = [];
    for (let p = 0; p < st.n; p++) if (p !== st.ghost && st.scores[p] === best) out.push(p);
    return out;
  }

  const SK = {
    CARDS, SUIT_NAMES, PIRATES, BASE_COUNT, SCHEDULES, deckIds, cardName,
    eff, leadSuit, legalFrom, resolveTrick, bonus14, roundScore, cardsFor, trickOrder,
    newGame, apply, view, legalPlays, whoActs, roundResults, winners, clone, shuffle, rngNext,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = SK;
  else root.SK = SK;
})(typeof self !== 'undefined' ? self : this);
