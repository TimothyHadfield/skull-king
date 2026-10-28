/* Skull King computer players, bid advisor and hints.
 *
 * Three levels:
 *   easy   - rough bid (off by one a lot), plays by feel (about a third of its
 *            cards are random)
 *   medium - counts the unseen cards: for each card it works out the chance that
 *            nobody still to play holds something that beats it, then plays to
 *            hit its bid (cheapest likely winner when it needs tricks, sheds its
 *            most dangerous safe card when it doesn't)
 *   hard   - Monte Carlo: deals the unseen cards many ways (respecting suits a
 *            player has shown they are out of), plays each option out to the end
 *            of the round with medium players, and keeps the best average score.
 * The bid advisor is the same Monte Carlo used for hard's bid.
 */
(function (root) {
  'use strict';
  const SK = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.SK;
  const { CARDS, resolveTrick, legalFrom, roundScore } = SK;

  // ------------------------------------------------------------ counting
  function newCounts() { return { U: 0, sk: 0, mer: 0, pir: 0, kra: 0, wha: 0, esc: 0, num: new Int16Array(60) }; }
  function addCard(cn, id, d) {
    if (id < 0) return;
    const c = CARDS[id];
    cn.U += d;
    switch (c.k) {
      case 'num': cn.num[c.s * 15 + c.r] += d; break;
      case 'sk': cn.sk += d; break;
      case 'mer': cn.mer += d; break;
      case 'pir': case 'tig': cn.pir += d; break;
      case 'kra': cn.kra += d; break;
      case 'wha': cn.wha += d; break;
      default: cn.esc += d;
    }
  }
  function copyCounts(a) {
    return { U: a.U, sk: a.sk, mer: a.mer, pir: a.pir, kra: a.kra, wha: a.wha, esc: a.esc, num: a.num.slice() };
  }
  function countsOf(ids) { const cn = newCounts(); for (const id of ids) addCard(cn, id, 1); return cn; }
  function suitAbove(cn, s, r) { let t = 0; for (let x = r + 1; x <= 14; x++) t += cn.num[s * 15 + x]; return t; }
  function anyAbove(cn, r) { let t = 0; for (let s = 0; s < 4; s++) t += suitAbove(cn, s, r); return t; }

  // Chance that none of the H cards held by the players still to act is one of
  // the B beaters, when those H cards are a random part of the U unseen cards
  // (hypergeometric).
  function noneOf(U, B, H) {
    let p = 1;
    for (let i = 0; i < H; i++) {
      const den = U - i;
      if (den <= 0) break;
      p *= Math.max(0, U - B - i) / den;
      if (p <= 0) return 0;
    }
    return p;
  }

  // Chance that seat `me` ends up winning `plays` (which already includes its own
  // card) given H unseen cards in the hands of the players still to act.
  function pWin(plays, me, cn, H) {
    const res = resolveTrick(plays);
    if (res.winner !== me) return 0;
    if (H <= 0) return 1;
    const wc = CARDS[plays[res.wi].id];
    const spoil = cn.kra + cn.wha;
    let B;
    switch (res.how) {
      case 'whale': B = anyAbove(cn, wc.r) + cn.kra; break;
      case 'mermaid-king': B = spoil; break;
      case 'mermaid': B = cn.pir + spoil; break;
      case 'king': B = cn.mer + spoil; break;
      case 'pirate': B = cn.sk + spoil; break;
      case 'trump': B = suitAbove(cn, 0, wc.r) + cn.pir + cn.sk + cn.mer + spoil; break;
      case 'suit': {
        let blacks = 0; for (let x = 1; x <= 14; x++) blacks += cn.num[x];
        B = suitAbove(cn, wc.s, wc.r) + 0.5 * blacks + cn.pir + cn.sk + cn.mer + spoil;
        break;
      }
      default: B = cn.U - cn.esc; // only escapes so far: almost anything beats it
    }
    return noneOf(cn.U, B, H);
  }

  // How much a card is worth keeping for later tricks (rough "power").
  function power(id, as) {
    const c = CARDS[id];
    switch (c.k) {
      case 'num': return c.s === 0 ? 0.5 + c.r / 28 : (c.r / 14) * 0.6;
      case 'sk': return 0.95;
      case 'pir': return 0.9;
      case 'tig': return as === 'esc' ? 0.05 : 0.9;
      case 'mer': return 0.8;
      case 'wha': return 0.3;
      default: return 0.02; // escape, loot, kraken
    }
  }

  function optionsFor(legal) {
    const out = [];
    for (const id of legal) {
      if (CARDS[id].k === 'tig') { out.push({ id, as: 'pir' }); out.push({ id, as: 'esc' }); }
      else out.push({ id });
    }
    return out;
  }

  // --------------------------------------------------------------- sim
  // A small mutable round used for rollouts (much faster than engine.apply).
  // Pirate abilities are not modelled inside rollouts.
  function simFromState(st, hands) {
    const rem = countsOf(SK.deckIds(st.opts));
    for (const id of st.played) addCard(rem, id, -1);
    return {
      n: st.n, cards: st.cards, scoring: st.scoring, ghost: st.ghost == null ? -1 : st.ghost,
      roundLeader: st.roundLeader || 0,
      hands: hands.map(h => h.slice()), bids: st.bids.slice(), cannon: st.cannon.slice(),
      won: st.won.slice(), bonus: st.bonus.slice(), bets: (st.bets || []).slice(),
      alliances: st.alliances.map(a => a.slice()),
      trick: st.trick.map(t => Object.assign({}, t)), order: st.order.slice(),
      turn: st.turn, tricksDone: st.tricksDone, rem,
    };
  }

  function simPlay(sim, p, id, as) {
    const h = sim.hands[p];
    h.splice(h.indexOf(id), 1);
    const pl = { p, id };
    if (CARDS[id].k === 'tig') pl.as = as === 'esc' ? 'esc' : 'pir';
    sim.trick.push(pl);
    addCard(sim.rem, id, -1);
    if (sim.trick.length < sim.n) { sim.turn = sim.order[sim.trick.length]; return; }
    const res = resolveTrick(sim.trick);
    const w = res.winner;
    if (w != null) {
      sim.won[w]++;
      if (w !== sim.ghost) {
        sim.bonus[w] += res.bonus;
        for (const t of sim.trick) if (CARDS[t.id].k === 'loot' && t.p !== w) sim.alliances.push([t.p, w]);
      }
    }
    sim.trick = [];
    sim.tricksDone++;
    sim.order = SK.trickOrder(sim, res.next);
    sim.turn = sim.order[0];
  }

  function simScore(sim, p, bidOverride, cannonOverride) {
    const bids = sim.bids;
    const bid = bidOverride == null ? bids[p] : bidOverride;
    let ally = 0;
    for (const [a, b] of sim.alliances) {
      if ((a === p || b === p) && bids[a] === sim.won[a] && bids[b] === sim.won[b]) ally += 20;
    }
    const cannon = cannonOverride == null ? sim.cannon[p] : cannonOverride;
    let pts = roundScore(bid, sim.won[p], sim.bonus[p] + ally, sim.cards, sim.scoring, cannon);
    if (sim.bets && sim.bets[p]) pts += bid === sim.won[p] ? sim.bets[p] : -sim.bets[p];
    return pts;
  }

  function cardsAfter(sim) { // cards held by the players still to act after the current one
    let H = 0;
    for (let k = sim.trick.length + 1; k < sim.n; k++) H += sim.hands[sim.order[k]].length;
    return H;
  }

  // ------------------------------------------------------- medium policy
  function mediumChoice(sim, p, legal) {
    const hand = sim.hands[p];
    legal = legal || legalFrom(hand, sim.trick);
    const opts = optionsFor(legal);
    if (opts.length === 1) return opts[0];
    const cn = copyCounts(sim.rem);
    for (const id of hand) addCard(cn, id, -1);
    const H = cardsAfter(sim);
    const need = sim.bids[p] - sim.won[p];
    const left = sim.cards - sim.tricksDone;
    let best = null, bestScore = -Infinity;
    for (const o of opts) {
      const plays = sim.trick.concat([o.as ? { p, id: o.id, as: o.as } : { p, id: o.id }]);
      o.pw = pWin(plays, p, cn, H);
      o.pow = power(o.id, o.as);
    }
    if (need > 0) {
      const must = need >= left;
      let maxPw = 0; for (const o of opts) if (o.pw > maxPw) maxPw = o.pw;
      if (must || maxPw >= 0.35) {
        for (const o of opts) {
          const s = o.pw - (must ? 0.02 : 0.3) * o.pow;
          if (s > bestScore) { bestScore = s; best = o; }
        }
      } else {
        // Can't win this one: throw away the weakest card (keep escapes a little).
        for (const o of opts) {
          const k = CARDS[o.id].k;
          const cost = (k === 'esc' || k === 'loot' || (k === 'tig' && o.as === 'esc')) ? 0.25 : o.pow;
          const s = -cost - o.pw * 0.5;
          if (s > bestScore) { bestScore = s; best = o; }
        }
      }
    } else {
      // Want to lose: lowest chance of winning; among those, shed the most dangerous card.
      let minPw = 1; for (const o of opts) if (o.pw < minPw) minPw = o.pw;
      for (const o of opts) {
        if (o.pw > minPw + 0.03) continue;
        const s = o.pow - o.pw;
        if (s > bestScore) { bestScore = s; best = o; }
      }
    }
    return best;
  }

  function easyChoice(sim, p, rand) {
    const legal = legalFrom(sim.hands[p], sim.trick);
    if (rand() < 0.35) {
      const id = legal[Math.floor(rand() * legal.length)];
      return CARDS[id].k === 'tig' ? { id, as: rand() < 0.5 ? 'pir' : 'esc' } : { id };
    }
    return mediumChoice(sim, p, legal);
  }

  function ghostChoice(sim, p) { return { id: sim.hands[p][0], as: 'esc' }; }

  // ------------------------------------------------------------- bidding
  // Expected tricks from a hand: each card's chance of winning if led into
  // everyone else.
  function expectedTricksCounts(hand, others, cards, deckCounts) {
    const cn = copyCounts(deckCounts);
    for (const id of hand) addCard(cn, id, -1);
    const H = others * cards;
    let E = 0;
    for (const id of hand) {
      const k = CARDS[id].k;
      if (k === 'kra' || k === 'loot' || k === 'esc') continue;
      const pl = k === 'tig' ? { p: 0, id, as: 'pir' } : { p: 0, id };
      E += pWin([pl], 0, cn, H);
    }
    return E;
  }
  // Tuned with tools/strength.js (medium vs medium, see progress.md). SK_BIDSCALE
  // overrides it in Node for tuning runs.
  const BID_SCALE = (typeof process !== 'undefined' && process.env && +process.env.SK_BIDSCALE) || 1.15;
  function mediumBid(hand, others, cards, deckCounts) {
    const E = expectedTricksCounts(hand, others, cards, deckCounts);
    return Math.max(0, Math.min(cards, Math.round(E * BID_SCALE)));
  }

  // --------------------------------------------------------- determinize
  // Deal the cards `me` can't see to the other hands, honouring suits they have
  // shown they are out of. Returns full hands (me keeps its real hand).
  function determinize(st, me, rand) {
    const seen = new Set(st.played);
    for (const id of st.hands[me]) seen.add(id);
    const unknown = SK.deckIds(st.opts).filter(id => !seen.has(id));
    const sizes = st.hands.map((h, p) => (p === me ? 0 : (h ? h.length : st.handCounts[p])));
    for (let attempt = 0; attempt < 12; attempt++) {
      SK.shuffle(unknown, rand);
      const hands = st.hands.map((h, p) => (p === me ? h.slice() : []));
      for (const id of unknown) {
        const c = CARDS[id];
        let pick = -1, seenN = 0;
        for (let p = 0; p < st.n; p++) {
          if (p === me || hands[p].length >= sizes[p]) continue;
          if (c.k === 'num' && st.voids[p][c.s]) continue;
          seenN++;
          if (rand() * seenN < 1) pick = p; // reservoir pick
        }
        if (pick >= 0) hands[pick].push(id);
      }
      let ok = true;
      for (let p = 0; p < st.n; p++) if (p !== me && hands[p].length < sizes[p]) { ok = false; break; }
      if (ok) return hands;
    }
    SK.shuffle(unknown, rand); // fallback: ignore what we know about voids
    let k = 0;
    return st.hands.map((h, p) => (p === me ? h.slice() : unknown.slice(k, (k += sizes[p]))));
  }

  function rollout(sim, rand, levels) {
    while (sim.tricksDone < sim.cards) {
      const p = sim.turn;
      const o = p === sim.ghost ? ghostChoice(sim, p)
        : (levels && levels[p] === 'easy') ? easyChoice(sim, p, rand) : mediumChoice(sim, p);
      simPlay(sim, p, o.id, o.as);
    }
    return sim;
  }

  // Average round score of each option for seat `me` (hard player, hints, study).
  function evaluatePlays(st, me, samples, rand) {
    rand = rand || Math.random;
    const legal = legalFrom(st.hands[me], st.trick);
    const opts = optionsFor(legal);
    for (const o of opts) { o.sum = 0; o.n = 0; }
    if (opts.length > 1) {
      for (let s = 0; s < samples; s++) {
        const hands = determinize(st, me, rand);
        for (const o of opts) {
          const sim = simFromState(st, hands);
          simPlay(sim, me, o.id, o.as);
          rollout(sim, rand);
          o.sum += simScore(sim, me); o.n++;
        }
      }
    }
    for (const o of opts) o.ev = o.n ? o.sum / o.n : 0;
    opts.sort((a, b) => b.ev - a.ev);
    return opts;
  }

  /* Monte Carlo bid study for a hand.
   * spec: {hand, players (2-8, people at the table), before (how many play before
   *        you on the first trick), opts, scoring, ghost (2 players), samples, rand}
   * Returns per bid: hit chance, average points, trick distribution; plus best.
   * Run it in chunks by passing `acc` back in. */
  function bidStudy(spec, acc) {
    const rand = spec.rand || Math.random;
    const humans = spec.players;
    const ghost = humans === 2 && spec.ghost !== false ? 2 : -1;
    const n = ghost >= 0 ? 3 : humans;
    const opts = Object.assign({}, spec.opts || {});
    if (humans === 2) opts.loot = false;
    const deck = SK.deckIds(opts);
    const cards = spec.hand.length;
    const deckCounts = countsOf(deck);
    if (!acc) {
      acc = { samples: 0, bids: [] };
      for (let b = 0; b <= cards; b++) acc.bids.push({ bid: b, hit: 0, pts: 0, ptsCannon: 0, dist: new Array(cards + 1).fill(0) });
    }
    const handSet = new Set(spec.hand);
    const rest = deck.filter(id => !handSet.has(id));
    const me = 0;
    const before = Math.max(0, Math.min(humans - 1, spec.before || 0));
    const leader = ghost >= 0 ? (before ? 1 : 0) : (humans - before) % humans;
    for (let s = 0; s < spec.samples; s++) {
      SK.shuffle(rest, rand);
      const hands = [spec.hand.slice()];
      for (let p = 1; p < n; p++) hands.push(rest.slice((p - 1) * cards, p * cards));
      const bids = hands.map((h, p) => (p === me || p === ghost ? 0 : mediumBid(h, humans - 1, cards, deckCounts)));
      const fake = {
        n, cards, scoring: spec.scoring || 'sk', opts, played: [], ghost, roundLeader: leader,
        bids, cannon: new Array(n).fill(false), won: new Array(n).fill(0), bonus: new Array(n).fill(0),
        alliances: [], trick: [], order: SK.trickOrder({ n, ghost, roundLeader: leader }, leader), tricksDone: 0,
      };
      fake.turn = fake.order[0];
      for (const row of acc.bids) {
        fake.bids[me] = row.bid;
        const sim = simFromState(fake, hands);
        rollout(sim, rand);
        const w = sim.won[me];
        row.dist[w]++;
        if (w === row.bid) row.hit++;
        row.pts += simScore(sim, me);
        if (fake.scoring === 'rascal') row.ptsCannon += simScore(sim, me, null, true);
      }
      acc.samples++;
    }
    let best = null;
    for (const row of acc.bids) {
      row.chance = row.hit / acc.samples;
      row.avg = row.pts / acc.samples;
      row.avgCannon = row.ptsCannon / acc.samples;
      if (!best || row.avg > best.avg) best = row;
    }
    acc.best = best.bid;
    return acc;
  }

  function beforeCount(st, seat) {
    const order = SK.trickOrder(st, st.roundLeader);
    let k = 0;
    for (const p of order) { if (p === seat) break; if (p !== st.ghost) k++; }
    return k;
  }

  // ------------------------------------------------------------ players
  // All take a view (what that seat may see) and return an action body.
  function decideBid(st, seat, level, rand) {
    rand = rand || Math.random;
    const hand = st.hands[seat];
    const others = st.humans - 1 + (st.ghost >= 0 ? 1 : 0);
    if (level === 'hard') {
      const acc = bidStudy({ hand, players: st.humans, before: beforeCount(st, seat), opts: st.opts,
        scoring: st.scoring, ghost: st.ghost >= 0, samples: 60, rand });
      return { bid: acc.best };
    }
    let b = mediumBid(hand, others, st.cards, countsOf(SK.deckIds(st.opts)));
    if (level === 'easy') {
      const r = rand();
      if (r < 0.25) b -= 1; else if (r > 0.75) b += 1;
      b = Math.max(0, Math.min(st.cards, b));
    }
    return { bid: b };
  }

  function decideCannon(st, seat, level, rand) {
    rand = rand || Math.random;
    if (level === 'easy') return { on: rand() < 0.25 }; // by feel: a gamble now and then
    // Medium looks at a small sample of deals, Hard at a bigger one.
    const acc = bidStudy({ hand: st.hands[seat], players: st.humans, before: beforeCount(st, seat), opts: st.opts,
      scoring: 'rascal', ghost: st.ghost >= 0, samples: level === 'hard' ? 40 : 16, rand });
    const row = acc.bids[st.bids[seat]];
    return { on: row.avgCannon > row.avg };
  }

  function seatSim(st, seat) {
    return simFromState(st, st.hands.map((h, p) => (p === seat ? h : new Array(h ? h.length : st.handCounts[p]).fill(-1))));
  }

  function decidePlay(st, seat, level, rand) {
    rand = rand || Math.random;
    if (level === 'hard') {
      const opts = evaluatePlays(st, seat, 40, rand);
      return { id: opts[0].id, as: opts[0].as };
    }
    const sim = seatSim(st, seat);
    return level === 'easy' ? easyChoice(sim, seat, rand) : mediumChoice(sim, seat);
  }

  // Chance each legal card wins the current trick if played now (medium's
  // estimate from the unseen cards). Tigress counted as a pirate.
  function cardOdds(st, seat) {
    const sim = seatSim(st, seat);
    const cn = copyCounts(sim.rem);
    for (const id of st.hands[seat]) addCard(cn, id, -1);
    const H = cardsAfter(sim);
    const out = {};
    for (const id of legalFrom(st.hands[seat], st.trick)) {
      const pl = CARDS[id].k === 'tig' ? { p: seat, id, as: 'pir' } : { p: seat, id };
      out[id] = pWin(st.trick.concat([pl]), seat, cn, H);
    }
    return out;
  }

  // "Can it be beaten?" table: chance that nobody else holds a card that can
  // legally beat `id` when you lead it, by random deal (Monte Carlo).
  function unbeatenChance(id, players, cards, opts, samples, rand) {
    rand = rand || Math.random;
    const deck = SK.deckIds(opts).filter(x => x !== id);
    const lead = CARDS[id].k === 'tig' ? { p: 0, id, as: 'pir' } : { p: 0, id };
    let safe = 0;
    for (let s = 0; s < samples; s++) {
      SK.shuffle(deck, rand);
      let beaten = false;
      for (let p = 1; p < players && !beaten; p++) {
        const hand = deck.slice((p - 1) * cards, p * cards);
        for (const x of legalFrom(hand, [lead])) {
          const pl = CARDS[x].k === 'tig' ? { p, id: x, as: 'pir' } : { p, id: x };
          const r = resolveTrick([lead, pl]);
          if (r.winner === p || r.destroyed) { beaten = true; break; }
        }
      }
      if (!beaten) safe++;
    }
    return safe / samples;
  }

  // Pirate abilities for computer seats (simple rules of thumb).
  function decideAbility(st, seat) {
    const a = st.pending.ability;
    const need = st.bids[seat] - st.won[seat];
    const hand = st.hands[seat];
    if (a === 'rosie') {
      if (need > 0) return { lead: seat };
      let p = (seat + 1) % st.n; if (p === st.ghost) p = (p + 1) % st.n;
      return { lead: p };
    }
    if (a === 'bendt') {
      const k = st.pending.drawn ? st.pending.drawn.length : 2;
      const sorted = hand.slice().sort((x, y) => (need > 0 ? power(x) - power(y) : power(y) - power(x)));
      // when trying to lose, keep escapes; when trying to win, drop the weakest
      const keepEsc = sorted.filter(id => !(need <= 0 && power(id) < 0.05));
      return { discard: (keepEsc.length >= k ? keepEsc : sorted).slice(0, k) };
    }
    if (a === 'rascal') {
      const left = hand.length;
      if (need === 0 && hand.every(id => power(id) < 0.45)) return { bet: 20 };
      if (need === 0 || (need > 0 && need <= left && left <= 1)) return { bet: 10 };
      return { bet: 0 };
    }
    if (a === 'harry') {
      const left = st.cards - st.tricksDone;
      const sim = seatSim(st, seat);
      const cn = copyCounts(sim.rem); for (const id of hand) addCard(cn, id, -1);
      let E = 0;
      for (const id of hand) {
        const k = CARDS[id].k;
        if (k === 'kra' || k === 'loot' || k === 'esc') continue;
        E += pWin([{ p: seat, id, as: k === 'tig' ? 'pir' : undefined }], seat, cn, cardsAfterLead(st, seat));
      }
      const target = st.won[seat] + (left ? Math.round(E) : 0);
      const d = Math.max(-1, Math.min(1, target - st.bids[seat]));
      return { delta: d };
    }
    return {}; // juanita
  }
  function cardsAfterLead(st, seat) {
    let H = 0;
    for (let p = 0; p < st.n; p++) if (p !== seat) H += st.hands[p] ? st.hands[p].length : st.handCounts[p];
    return H;
  }

  // One entry point for a computer seat: returns the action to apply, or null.
  function act(view, seat, level, rand) {
    if (view.phase === 'bid' && view.bids[seat] == null) return Object.assign({ type: 'bid', seat }, decideBid(view, seat, level, rand));
    if (view.phase === 'cannon' && !view.cannonIn[seat]) return Object.assign({ type: 'cannon', seat }, decideCannon(view, seat, level, rand));
    if (view.phase === 'play' && view.turn === seat) {
      const d = decidePlay(view, seat, level, rand);
      return { type: 'play', seat, card: d.id, as: d.as };
    }
    if (view.phase === 'ability' && view.pending && view.pending.seat === seat) return Object.assign({ type: 'ability', seat }, decideAbility(view, seat));
    return null;
  }

  const AI = {
    newCounts, addCard, countsOf, copyCounts, noneOf, pWin, power, optionsFor,
    simFromState, simPlay, simScore, rollout, mediumChoice, easyChoice,
    expectedTricksCounts, mediumBid, determinize, evaluatePlays, bidStudy, beforeCount,
    decideBid, decideCannon, decidePlay, decideAbility, act, cardOdds, unbeatenChance,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = AI;
  else root.SKAI = AI;
})(typeof self !== 'undefined' ? self : this);
