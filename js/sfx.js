/* Skull King sounds, celebrations and animations, on top of the shared js/fx.js.
 * Everything is driven by comparing the table before and after a change
 * (react(prev, next, me)), so your moves, the computers' moves and other online
 * players' moves all sound and move the same way. Works in the browser
 * (window.SKFX) and in node (tests). */
(function (root) {
  'use strict';
  const SK = typeof module !== 'undefined' && module.exports ? require('./engine.js') : root.SK;
  const fx = () => root.FX || null;
  const CARDS = SK.CARDS;

  // ------------------------------------------------ the game's own sounds
  // (the shared palette has no pirates, mermaids or sea monsters)
  function defineSounds() {
    const F = fx();
    if (!F || F.sounds.indexOf('yoho') >= 0) return;
    const flick = k => k.noise({ f: 2500, f2: 4500, dur: 0.06, vol: 0.35 });
    // "Yo-ho-ho!": three fists on the table, each with a rising shout
    F.define('yoho', k => {
      [294, 370, 440].forEach((f, i) => {
        const at = i * 0.27;
        k.tone({ f: 150, f2: 60, dur: 0.11, vol: 0.4, at });
        k.noise({ f: 1400, filter: 'lowpass', dur: 0.05, vol: 0.35, at });
        k.tone({ f: f * 0.94, f2: f, dur: i === 2 ? 0.34 : 0.17, a: 0.02, vol: 0.09, type: 'sawtooth', lp: 1300, at: at + 0.01 });
      });
    }, 'moves');
    // a pirate: card plus the ring of a drawn cutlass
    F.define('cutlass', k => {
      flick(k);
      k.noise({ f: 5000, f2: 8000, filter: 'highpass', dur: 0.28, a: 0.03, vol: 0.18, at: 0.04 });
      k.tone({ f: 2350, dur: 0.3, vol: 0.05, at: 0.05 });
      k.tone({ f: 3710, dur: 0.22, vol: 0.035, at: 0.05 });
    }, 'moves');
    // the Skull King: card slammed down with a deep, dark thud
    F.define('skullKing', k => {
      flick(k);
      k.tone({ f: 140, f2: 55, dur: 0.22, vol: 0.45, at: 0.04 });
      k.noise({ f: 900, filter: 'lowpass', dur: 0.08, vol: 0.35, at: 0.04 });
      k.tone({ f: 110, f2: 98, dur: 0.5, vol: 0.08, type: 'sawtooth', lp: 600, at: 0.08 });
    }, 'moves');
    // a mermaid: card plus a soft harp run
    F.define('mermaid', k => {
      flick(k);
      [660, 784, 880, 1047, 1319].forEach((f, i) => k.tone({ f, dur: 0.3, vol: 0.07, type: 'triangle', at: 0.05 + i * 0.05 }));
    }, 'moves');
    // the Kraken: card plus a deep rumble from below and bubbles
    F.define('kraken', k => {
      flick(k);
      k.noise({ f: 320, f2: 70, filter: 'lowpass', dur: 0.9, a: 0.12, vol: 0.6, at: 0.04 });
      k.tone({ f: 55, f2: 36, dur: 0.85, vol: 0.4, at: 0.04 });
      for (let i = 0; i < 3; i++) { const f = k.rnd(380, 700); k.tone({ f, f2: f * 1.7, dur: 0.05, vol: 0.06, at: k.rnd(0.35, 0.85) }); }
    }, 'moves');
    // the White Whale: card plus a long low whale call
    F.define('whale', k => {
      flick(k);
      k.tone({ f: 170, f2: 260, dur: 0.45, a: 0.12, vol: 0.14, lp: 900, at: 0.05 });
      k.tone({ f: 260, f2: 150, dur: 0.5, vol: 0.12, lp: 900, at: 0.48 });
      k.noise({ f: 700, f2: 300, q: 0.7, dur: 0.4, a: 0.1, vol: 0.12, at: 0.55 });
    }, 'moves');
  }

  // ------------------------------------------------ events from a state change
  const bidsIn = st => (st.phase === 'bid' ? (st.bidIn ? st.bidIn.slice() : st.bids.map(b => b != null)) : st.bids.map(() => true));
  const eff = pl => { const k = CARDS[pl.id] ? CARDS[pl.id].k : ''; return k === 'tig' ? (pl.as === 'pir' ? 'pir' : 'esc') : k; };
  function myTurn(st, me) {
    if (!st || me == null || me < 0) return false;
    if (st.phase !== 'play' && st.phase !== 'ability' && st.phase !== 'cannon') return false;
    return SK.whoActs(st).indexOf(me) >= 0;
  }
  function trickEvent(lt) {
    const kinds = lt.plays.map(eff);
    let capture = false;
    if (lt.how === 'mermaid-king') capture = true;
    else if (lt.how === 'king') capture = kinds.indexOf('pir') >= 0;
    else if (lt.how === 'pirate') capture = kinds.indexOf('mer') >= 0;
    return { type: 'trick', winner: lt.winner, how: lt.how, bonus: lt.bonus || 0, capture, n: lt.plays.length };
  }

  // prev = the table before (null for a fresh deal), next = after, me = your seat.
  function events(prev, next, me) {
    const ev = [];
    if (!next || !next.players) return ev;
    if (prev && (next.round < prev.round || next.history.length < prev.history.length || next.players.length !== prev.players.length)) prev = null; // another game
    if (!prev) {
      if (next.phase === 'bid' && !next.history.length) ev.push({ type: 'deal', cards: next.cards });
      return ev;
    }
    if (prev.seq === next.seq && prev.round === next.round && prev.phase === next.phase) return ev;
    const ghost = next.ghost;
    const newRound = next.round !== prev.round;
    const histGrew = next.history.length > prev.history.length;
    // bids, then the reveal ("Yo-ho-ho!")
    if (prev.phase === 'bid') {
      const a = bidsIn(prev), b = newRound ? a.map(() => true) : bidsIn(next);
      for (let p = 0; p < a.length; p++) if (!a[p] && b[p] && p !== ghost) ev.push({ type: 'bid', p });
      if (next.phase !== 'bid' || newRound) ev.push({ type: 'reveal' });
    }
    // Cannonball / Grapeshot
    if (prev.phase === 'cannon') {
      const a = prev.cannonIn || [], b = next.phase === 'cannon' && !newRound ? (next.cannonIn || []) : a.map(() => true);
      for (let p = 0; p < a.length; p++) if (!a[p] && b[p] && p !== ghost) ev.push({ type: 'choose', p });
      if (next.phase !== 'cannon') ev.push({ type: 'cannonReveal', any: !newRound && (next.cannon || []).some(Boolean) });
    }
    // a pirate power used
    if (prev.phase === 'ability' && prev.pending && (next.phase !== 'ability' || newRound || histGrew)) {
      const p = prev.pending.seat;
      ev.push({ type: 'ability', a: prev.pending.ability, p, bet: newRound ? 0 : (next.bets[p] || 0) - (prev.bets[p] || 0) });
    }
    // cards played and tricks taken
    if (!newRound) {
      const done = next.tricksDone - prev.tricksDone;
      if (done === 0) next.trick.slice(prev.trick.length).forEach(pl => ev.push({ type: 'play', p: pl.p, id: pl.id, as: pl.as, slot: next.trick.indexOf(pl) }));
      else if (next.lastTrick) {
        const lt = next.lastTrick;
        const from = done === 1 ? prev.trick.length : 0;
        lt.plays.slice(from).forEach((pl, i) => ev.push({ type: 'play', p: pl.p, id: pl.id, as: pl.as, slot: next.trick.length ? -1 : from + i }));
        ev.push(trickEvent(lt));
        next.trick.forEach((pl, i) => ev.push({ type: 'play', p: pl.p, id: pl.id, as: pl.as, slot: i }));
      }
    } else if (histGrew && (prev.phase === 'play' || prev.phase === 'ability')) {
      // online: the round's last cards and the deal arrive together
      const left = prev.phase === 'play' ? Math.max(1, prev.n - prev.trick.length) : 0;
      for (let i = 0; i < left; i++) ev.push({ type: 'play', p: -1, id: -1, slot: -1 });
      if (left) ev.push({ type: 'trick', winner: null, how: '', bonus: 0, capture: false, n: prev.n });
    }
    if (next.phase === 'ability' && next.pending && !(prev.phase === 'ability' && prev.pending && prev.tricksDone === next.tricksDone)) {
      ev.push({ type: 'power', a: next.pending.ability, p: next.pending.seat });
    }
    // the round's results, the end of the game
    if (histGrew) {
      const h = next.history[next.history.length - 1];
      const r = me >= 0 ? h.results[me] : null;
      ev.push({ type: 'round', made: r ? !!r.made : null, pts: r ? r.pts : 0, results: h.results, totals: h.totals, before: prev.scores.slice() });
    }
    if (next.phase === 'over' && prev.phase !== 'over') {
      const w = SK.winners(next);
      ev.push({ type: 'over', win: w.indexOf(me) >= 0, winners: w });
    }
    if (newRound && next.phase !== 'over') ev.push({ type: 'deal', cards: next.cards });
    if (myTurn(next, me) && !(myTurn(prev, me) && !newRound && prev.phase === next.phase && prev.tricksDone === next.tricksDone && prev.trick.length === next.trick.length)) ev.push({ type: 'turn' });
    return ev;
  }

  function playSound(pl) {
    if (pl.id < 0) return 'cardFlip';
    const k = eff(pl);
    if (k === 'pir') return 'cutlass';
    if (k === 'sk') return 'skullKing';
    if (k === 'mer') return 'mermaid';
    if (k === 'kra') return 'kraken';
    if (k === 'wha') return 'whale';
    if (k === 'loot') return 'coins';
    return 'cardFlip'; // numbers, escapes, the Tigress as an escape
  }
  function trickSound(e) {
    if (e.capture) return 'capture';
    if (e.how === 'kraken') return 'sink';
    if (e.how === 'whale' && e.winner == null) return 'splash';
    return 'cardSlide'; // the trick is swept to its winner
  }

  // ------------------------------------------------ timing + playing
  let timer = (fn, ms) => setTimeout(fn, ms);
  const stats = { anims: 0, events: 0 };
  let env = null; // { visible(), root(), colors(seats), from() }
  const sp = () => { const F = fx(); return F && F.settings.animSpeed === 'fast' ? 0.55 : 1; };
  const animOn = () => { const F = fx(); return !!(F && F.settings.animations && env && env.visible()); };
  const play = (name, o) => { const F = fx(); return F ? F.play(name, o) : false; };
  const at = (ms, fn) => { if (ms <= 0) fn(); else timer(fn, Math.round(ms * sp())); };

  // ---- DOM helpers (all transforms/opacity; missing elements are skipped)
  const q = (sel) => { const r = env && env.root && env.root(); return r ? Array.from(r.querySelectorAll(sel)) : []; };
  // a player's place at the table (their seat, or the old score chip)
  const chip = p => q('.seatbox[data-seat="' + p + '"]')[0] || q('.chips .chip')[p] || null;
  // Key moments (a capture, a big round of yours): the card or chip swells with a gold glow.
  // Only when Animations is on and the phone isn't set to reduce motion.
  const BIG_ROUND = 60;
  const reducedMotion = () => { try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
  function spotlight(el, scale) {
    if (!el || !el.animate || reducedMotion()) return;
    stats.spotlights = (stats.spotlights || 0) + 1;
    const s = scale || 1.35;
    el.animate([
      { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 rgba(240,192,64,0))', zIndex: 5 },
      { transform: 'scale(' + s + ')', filter: 'drop-shadow(0 0 14px rgba(240,192,64,.95))', zIndex: 5, offset: 0.35 },
      { transform: 'scale(' + s + ')', filter: 'drop-shadow(0 0 10px rgba(240,192,64,.8))', zIndex: 5, offset: 0.7 },
      { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 rgba(240,192,64,0))', zIndex: 5 },
    ], { duration: Math.round(900 * sp()), easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function anim(fn) { if (!animOn()) return; stats.anims++; try { fn(); } catch (e) { /* never break the game */ } }
  function flyIn(el, from, delay) {
    if (!el || !from || !el.animate) return;
    const b = el.getBoundingClientRect();
    if (!b.width || !from.width) return;
    const dx = (from.left + from.width / 2) - (b.left + b.width / 2), dy = (from.top + from.height / 2) - (b.top + b.height / 2);
    const s = Math.max(0.35, Math.min(1.4, from.width / b.width));
    el.classList.remove('drop');
    el.animate([{ transform: `translate(${dx}px,${dy}px) scale(${s})`, opacity: 0.6 }, { transform: 'none', opacity: 1 }],
      { duration: Math.round(320 * sp()), delay: Math.round(delay * sp()), easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'backwards' });
  }

  function react(prev, next, me) {
    const F = fx();
    if (!F) return [];
    const ev = events(prev, next, me);
    stats.events += ev.length;
    let t = 0; // ms from now
    const slots = q('.trick .tcard .cardf');
    for (const e of ev) {
      if (e.type === 'deal') {
        const t0 = t; // after the round's last trick and results, when they arrive together online
        at(t0, () => play('shuffle'));
        const n = Math.min(e.cards, 6);
        for (let i = 0; i < n; i++) at(t0 + 450 + i * 90, () => play('cardDeal'));
        anim(() => q('.hand .cardf.deal').forEach((el, i) => { el.style.animationDelay = Math.round((Math.min(t0, 600) + 450 + i * 45) * sp()) + 'ms'; }));
        t = t0 + 450 + n * 90;
      } else if (e.type === 'bid' || e.type === 'choose') {
        at(t, () => play('place', { vol: 0.7 }));
        t += 90;
      } else if (e.type === 'reveal') {
        at(t + 120, () => play('yoho'));
        const t0 = t + 120;
        anim(() => q('.bidtok, .chips .chip .s span').forEach((el, i) => at(t0 + Math.min(i, 2) * 270, () => F.pop(el))));
        t += 900;
      } else if (e.type === 'cannonReveal') {
        if (e.any) at(t, () => play('hit', { vol: 0.8 }));
        t += e.any ? 300 : 0;
      } else if (e.type === 'play') {
        const name = playSound(e);
        at(t, () => play(name));
        const delay = t;
        anim(() => {
          const el = e.slot >= 0 ? slots[e.slot] : null;
          if (!el) return;
          const src = e.p === me && env.from ? env.from() : null;
          const c = chip(e.p);
          flyIn(el, src || (c && c.getBoundingClientRect()), delay);
        });
        t += 140;
      } else if (e.type === 'trick') {
        t += 240; // the card lands, then the outcome
        const name = trickSound(e);
        at(t, () => play(name));
        const t1 = t;
        if (e.how === 'mermaid-king' && e.winner === me && me >= 0) {
          at(t1 + 150, () => F.celebrate({ kind: 'big', at: q('.trick')[0] || null, colors: env && env.colors ? env.colors([me]) : undefined }));
        }
        if (e.capture) anim(() => { const w = q('.trick .tcard.win .cardf')[0]; if (w) at(t1, () => spotlight(w)); });
        anim(() => {
          if (e.winner == null) { const tr = q('.trick')[0]; if (tr && e.how) at(t1, () => F.shake(tr)); return; }
          const c = chip(e.winner);
          if (!c) return;
          at(t1, () => F.pop(c));
          if (e.bonus > 0) at(t1 + 80, () => F.floatText(c, '+' + e.bonus, 'var(--gold)'));
        });
        t += 300;
      } else if (e.type === 'power') {
        if (e.a === 'bendt') { at(t, () => play('cardDeal')); at(t + 110, () => play('cardDeal')); t += 220; }
      } else if (e.type === 'ability') {
        const name = { rosie: 'place', bendt: 'cardSlide', juanita: 'cardFlip', harry: 'place' }[e.a] || (e.bet > 0 ? 'chips' : 'place');
        at(t, () => play(name));
        t += 160;
      } else if (e.type === 'round') {
        t += 350;
        if (e.made != null) { const name = e.made ? 'ding' : 'miss'; at(t, () => play(name)); }
        const t2 = t;
        anim(() => {
          e.results.forEach((r, p) => {
            if (!r) return;
            const c = chip(p);
            const num = c && c.querySelector('b.num');
            if (!num) return;
            const from = e.before[p], to = e.totals[p];
            const fmt = n => { const v = Math.round(n); return v < 0 ? '−' + Math.abs(v) : String(v); };
            if (from !== to) { num.textContent = fmt(from); at(t2, () => F.countUp(num, from, to, { duration: 650, format: fmt })); }
            if (p === me && r.made && r.pts >= BIG_ROUND) at(t2, () => { F.flash(c, 'var(--gold)'); spotlight(c, 1.25); });
            if (r.pts) at(t2, () => F.floatText(c, (r.pts > 0 ? '+' : '−') + Math.abs(Math.round(r.pts)), r.pts > 0 ? 'var(--good)' : 'var(--bad)'));
          });
        });
        t += 500;
      } else if (e.type === 'over') {
        const kind = e.win ? 'win' : 'lose';
        const colors = env && env.colors ? env.colors(e.winners) : undefined;
        at(t + 300, () => F.celebrate({ kind, colors }));
        t += 300;
      } else if (e.type === 'turn') {
        at(t + 120, () => play('turn'));
        anim(() => { const c = chip(me); if (c) at(t + 120, () => F.pulse(c)); });
      }
    }
    return ev;
  }

  // A tap on a card you can't play: soft error + the card shakes.
  function illegal(el) {
    const F = fx(); if (!F) return;
    play('error');
    if (F.settings.animations && el) { stats.anims++; F.shake(el); }
  }

  defineSounds();
  const SKFX = {
    events, react, illegal, stats, defineSounds,
    setTimer(fn) { timer = fn; },
    attach(e) { env = e; },
    soundFor: { play: playSound, trick: trickSound },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = SKFX;
  else root.SKFX = SKFX;
})(typeof window !== 'undefined' ? window : globalThis);
