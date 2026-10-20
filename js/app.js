/* Skull King app: scorekeeper, bid advisor, play vs computer, settings.
 * One state object per section, render functions write template strings,
 * clicks go through data-act attributes (event delegation). */
(function () {
  'use strict';
  const SK = window.SK, AI = window.SKAI;
  const Art = window.SKArt || null;
  const { CARDS } = SK;
  const VERSION = '1.0';
  const KEY = 'skullking:v1';

  // ------------------------------------------------------------ helpers
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(Math.round(n));
  const neg = n => (n < 0 ? '−' + Math.abs(n) : String(n)); // true minus sign for totals
  const cls = n => (n > 0 ? 'pos' : n < 0 ? 'neg' : '');
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // red -> green for a 0..1 value
  function heat(t) {
    t = clamp(t, 0, 1);
    const h = Math.round(t * 125);
    return `hsl(${h} 62% ${48 + t * 6}%)`;
  }
  const PLAYER_COLORS = ['#f0b354', '#6ea8fe', '#6ee7a8', '#f08c8c', '#c59bf5', '#5fd3d0', '#f5a3c7', '#b8c26b'];
  const CPU_NAMES = ['Anne', 'Edward', 'Grace', 'Henry', 'Mary', 'William', 'Ching'];

  // Sound & effects (js/fx.js shared library + js/sfx.js for this game). All optional:
  // the switches live in Settings. Buttons with their own sound skip the generic tap.
  const FXL = window.FX || null, SFX = window.SKFX || null;
  const fxPlay = (name, o) => (FXL ? FXL.play(name, o) : false);
  if (FXL) {
    FXL.init({ game: 'skull-king', clickSelector: 'button:not([data-act="sc-step"]):not([data-act="sc-bstep"]):not([data-act="sc-bet"]):not([data-act="pl-bid"]):not([data-act="sc-phase"]), [role="button"]' });
    const still = () => document.body.classList.toggle('fx-still', !FXL.settings.animations); // Animations off = the card deal/drop too
    still(); FXL.onChange(still);
  }

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify({ settings: S, score: SC, adv: { players: ADV.players, cards: ADV.cards, before: ADV.before, hand: ADV.hand, mode: ADV.mode }, play: PLAY.state && !PLAY.net ? { state: PLAY.state, seats: PLAY.seats, study: PLAY.study, log: (PLAY.log || []).slice(-30), roundHands: PLAY.roundHands, shown: PLAY.shownRoundSheet } : null, tab })); } catch (e) { /* storage full or blocked */ }
    }, 120);
  }

  const saved = load();
  const S = Object.assign({
    scoring: 'sk', cannonball: false, kraken: false, whale: false, loot: false, abilities: false,
    schedule: 'standard', ghost: true, odds: true, study: false, speed: 'normal',
  }, saved.settings || {});

  // ---------------------------------------------------------- card faces
  function face(id, size, extra) {
    const c = 'cardf' + (size ? ' ' + size : '') + (extra ? ' ' + extra : '');
    if (Art) return `<div class="${c}" data-id="${id}">${Art.face(id)}</div>`;
    return `<div class="${c} fallback" data-id="${id}">${esc(SK.cardName(id))}</div>`;
  }
  function back(size) {
    return Art ? `<div class="cardf ${size || ''}">${Art.back()}</div>` : `<div class="cardf ${size || ''} fallback">?</div>`;
  }
  const SUIT_COLORS = (Art && Art.SUIT_COLORS) || ['#2b2f3a', '#e3b23c', '#8e6bd8', '#3fae6a'];
  function shortName(id) {
    const c = CARDS[id];
    if (c.k === 'num') return SK.SUIT_NAMES[c.s] + ' ' + c.r;
    if (c.k === 'pir') return 'Pirate';
    return SK.cardName(id);
  }

  // ------------------------------------------------------------- help
  const HELP = {
    scoring: 'Standard: bid 1+ and hit it = 20 per trick, miss = minus 10 per trick off. Bid 0 = plus or minus 10 per card dealt. Rascal: everyone plays for 10 per card dealt; exact gets all, off by one gets half.',
    cannonball: 'Rascal add-on from the 2021 rules. After bids are shown, choose Cannonball for 15 per card if exact and 0 if not, or Grapeshot for normal Rascal.',
    abilities: "Win a trick with a named pirate to use its power. Rosie picks who leads next. Bendt draws 2 and discards 2. Rascal bets 0, 10 or 20 on hitting your bid. Juanita looks at the undealt cards. Harry changes your bid by 1 (even after the last trick).",
    kraken: 'Nobody wins the trick. The player who would have won it leads next.',
    whale: 'Special cards count for nothing; the highest number wins, whatever its colour.',
    loot: 'Plays like an Escape. You and the trick winner each get +20 if you both hit your bids. Not used with 2 players.',
    ghost: "Official 2-player rule: a third face-down hand plays second each trick by flipping its top card. It doesn't bid or score.",
    schedule: 'Official shorter and longer games. The number is how many cards are dealt each round.',
    odds: 'Shows the chance each card in your hand wins the trick, counting which cards are still unseen.',
    study: 'After each bid and card, shows the best choice (from thousands of simulated deals) and the points you gave up. Shows every hand when the round ends.',
    advisor: 'Deals the unseen cards thousands of ways, plays each round out with medium-strength computer players, and counts how often you take exactly each number of tricks. The best bid has the highest average points.',
    unbeaten: 'If you lead this card: the chance nobody else holds a card that can legally beat it. Below 100% for a Skull King because a Mermaid beats it.',
    strength: 'Measured by playing whole 10-round games, 4 players, one level against three of another.',
    bonus: 'Bonus points count only when the bid is hit.',
    sum: 'Total of all bids against the tricks there are. Above means the table is fighting for tricks; below means some bids will come up short.',
    before: 'How many players play before you on the first trick. 0 means you lead.',
    online: 'New room gives you a 5-letter code. Friends open this site on their phones, tap Play, type their name and the code. Any open seat can be a computer. The rules for new games in Settings are used.',
  };
  function q(key) { return `<button class="q" data-help="${key}" aria-label="Why?">?</button>`; }
  function showPop(btn) {
    const pop = $('#pop');
    pop.textContent = HELP[btn.dataset.help] || '';
    pop.hidden = false;
    const r = btn.getBoundingClientRect();
    const w = Math.min(290, window.innerWidth - 24);
    pop.style.maxWidth = w + 'px';
    const left = clamp(r.left + r.width / 2 - w / 2, 12, window.innerWidth - w - 12);
    pop.style.left = left + 'px';
    const below = r.bottom + 8;
    pop.style.top = below + 'px';
    const ph = pop.offsetHeight;
    if (below + ph > window.innerHeight - 10) pop.style.top = Math.max(10, r.top - ph - 8) + 'px';
  }

  let toastTimer = 0;
  function toast(msg, undoFn) {
    const t = $('#toast');
    t.innerHTML = `<span>${esc(msg)}</span>` + (undoFn ? '<button data-act="undo-toast">Undo</button>' : '');
    t.hidden = false;
    toastUndo = undoFn || null;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; toastUndo = null; }, 4000);
  }
  let toastUndo = null;

  // ------------------------------------------------------------- sheet
  let sheetOpen = false;
  function openSheet(html) {
    $('#sheet').innerHTML = html;
    $('#sheetBack').hidden = false;
    if (!sheetOpen) history.pushState({ sheet: 1 }, '');
    sheetOpen = true;
  }
  function closeSheet(fromPop) {
    if (!sheetOpen) return;
    $('#sheetBack').hidden = true;
    sheetOpen = false;
    sheetKind = '';
    if (!fromPop) history.back();
  }
  let sheetKind = '';

  // ============================================================ SCORE
  let SC = saved.score || null;

  function bonusTotal(b) {
    if (!b) return 0;
    return 10 * (b.c14 || 0) + 20 * (b.b14 || 0) + 20 * (b.mer || 0) + 30 * (b.pir || 0) + 40 * (b.sk || 0) + 20 * (b.loot || 0);
  }
  function scCards(sc, ri) {
    const sizes = SK.SCHEDULES[sc.schedule].sizes;
    const want = ri < sizes.length ? sizes[ri] : sizes[sizes.length - 1];
    const hands = sc.players.length === 2 ? 3 : sc.players.length;
    return Math.min(want, Math.floor(70 / hands));
  }
  function scPts(sc, ri, p, scoring) {
    const r = sc.rounds[ri];
    if (!r || !r.done) return null;
    const bid = r.bids[p], won = r.tricks[p], b = r.bonus[p] || {};
    let pts = SK.roundScore(bid, won, bonusTotal(b), r.cards, scoring || sc.scoring, r.cannon[p]);
    if (b.bet) pts += bid === won ? b.bet : -b.bet;
    return pts;
  }
  function scTotals(sc, upto, scoring) {
    const t = sc.players.map(() => 0);
    sc.rounds.forEach((r, ri) => { if (ri <= upto) sc.players.forEach((_, p) => { t[p] += scPts(sc, ri, p, scoring) || 0; }); });
    return t;
  }
  function scNewRound(sc) {
    const ri = sc.rounds.length;
    const n = sc.players.length;
    sc.rounds.push({ cards: scCards(sc, ri), bids: new Array(n).fill(0), tricks: new Array(n).fill(0), bonus: Array.from({ length: n }, () => ({})), cannon: new Array(n).fill(false), done: false });
    sc.cur = ri; sc.phase = 'bid';
  }
  function scPlanned(sc) { return SK.SCHEDULES[sc.schedule].sizes.length; }
  function scFinished(sc) {
    const last = sc.rounds[sc.rounds.length - 1];
    if (!last || !last.done || sc.rounds.length < scPlanned(sc)) return false;
    const t = scTotals(sc, 99);
    const best = Math.max(...t);
    return t.filter(x => x === best).length === 1 || sc.noTiebreak;
  }

  let scSetupNames = (saved.lastNames && saved.lastNames.length ? saved.lastNames : null) || ['', '', '', ''];
  let scTableOpen = false;

  function renderScore() {
    const v = $('#v-score');
    if (!SC) { v.innerHTML = scoreSetupHTML(); return; }
    const sc = SC, r = sc.rounds[sc.cur], n = sc.players.length;
    const totals = scTotals(sc, sc.cur);
    const allTotals = scTotals(sc, 99);
    const best = Math.max(...allTotals);
    const finished = scFinished(sc);
    const isTr = sc.phase === 'tricks';
    const sumB = r.bids.reduce((a, b) => a + b, 0), sumT = r.tricks.reduce((a, b) => a + b, 0);
    // Tricks can't add up to more than were played; fewer only if a Kraken/Whale threw one away.
    const tricksBad = isTr && (sumT > r.cards || (sumT < r.cards && !(S.kraken || S.whale)));
    const rows = sc.players.map((name, p) => {
      const val = isTr ? r.tricks[p] : r.bids[p];
      const step = `<div class="step sm"><button data-act="sc-step" data-p="${p}" data-d="-1" ${val <= 0 ? 'disabled' : ''} aria-label="less">−</button><span class="val">${val}</span><button data-act="sc-step" data-p="${p}" data-d="1" ${val >= r.cards || (isTr && sumT >= r.cards) ? 'disabled' : ''} aria-label="more">+</button></div>`;
      const pts = scPts(sc, sc.cur, p);
      const ptsShow = isTr ? (r.done ? pts : livePts(sc, p)) : null;
      const bt = bonusTotal(r.bonus[p]) + (r.bonus[p].bet ? 1 : 0);
      const cannonMark = sc.scoring === 'rascal' && sc.cannonball ? `<button class="btn sm ghost" data-act="sc-cannon" data-p="${p}" style="height:24px;padding:0 6px;font-size:11px;${r.cannon[p] ? 'color:var(--gold);border-color:var(--gold)' : ''}">${r.cannon[p] ? 'Cannon' : 'Grape'}</button>` : '';
      return `<div class="sc-row ${isTr ? 'tr' : ''}">
        <div class="sc-name"><span style="color:${PLAYER_COLORS[p % 8]}">●</span> ${esc(name)}${isTr ? `<small>bid ${r.bids[p]}${r.cannon[p] ? ' · cannon' : ''}</small>` : (cannonMark ? `<small>${cannonMark}</small>` : '')}</div>
        ${step}
        ${isTr ? `<button class="bonus-chip ${bt ? 'has' : ''}" data-act="sc-bonus" data-p="${p}" aria-label="Bonus">${bt ? '+' + bonusTotal(r.bonus[p]) : '+'}</button>` : ''}
        <div class="sc-pts ${cls(ptsShow)}">${isTr ? sgn(ptsShow) : ''}</div>
        <div class="sc-tot num ${allTotals[p] === best ? 'lead' : ''}">${totals[p]}</div>
      </div>`;
    }).join('');
    const info = isTr
      ? `Tricks <b class="${sumT === r.cards ? '' : 'neg'}">${sumT} of ${r.cards}</b>`
      : `Bids <b>${sumB}</b> for <b>${r.cards}</b> tricks ${q('sum')}`;
    const lastRound = sc.cur === sc.rounds.length - 1;
    let primary;
    if (!isTr) primary = `<button class="btn primary" data-act="sc-phase" data-ph="tricks">Bids in</button>`;
    else if (!lastRound) primary = `<button class="btn primary" data-act="sc-goto" data-d="1" ${tricksBad ? 'disabled' : ''}>Next</button>`;
    else if (finished) primary = `<button class="btn primary" data-act="sc-new">New game</button>`;
    else primary = `<button class="btn primary" data-act="sc-done" ${tricksBad ? 'disabled' : ''}>${sc.rounds.length >= scPlanned(sc) ? 'Finish' : 'Next round'}</button>`;
    const banner = finished ? winnerBanner(sc) : '';
    const tableHtml = scoreTableHTML(sc);
    v.innerHTML = `<div class="sc-cols">
      <div class="sc">
        <div>
          ${banner}
          <div class="sc-head" style="${banner ? 'margin-top:10px' : ''}">
            <button class="navb" data-act="sc-goto" data-d="-1" ${sc.cur === 0 && sc.phase === 'bid' ? 'disabled' : ''} aria-label="Back">‹</button>
            <div class="sc-round"><span class="r">Round ${sc.cur + 1}</span><span class="c">· ${r.cards} card${r.cards > 1 ? 's' : ''}</span></div>
            <div class="seg" style="width:150px"><button data-act="sc-phase" data-ph="bid" class="${isTr ? '' : 'on'}">Bids</button><button data-act="sc-phase" data-ph="tricks" class="${isTr ? 'on' : ''}">Tricks</button></div>
          </div>
        </div>
        <div class="scroll" style="display:flex;flex-direction:column;gap:6px">
          <div class="sc-hdr lbl ${isTr ? 'tr' : ''}"><span>Player</span><span class="c2">${isTr ? 'Won' : 'Bid'}</span>${isTr ? '<span>Bonus</span>' : ''}<span>${isTr ? 'Round' : ''}</span><span>Total</span></div>
          <div class="sc-rows">${rows}</div>
        </div>
        <div class="sc-foot"><div class="info">${info}</div>${!isTr ? `<button class="btn sm ghost" data-act="sc-advisor">Advisor</button>` : ''}${primary}</div>
      </div>
      <div class="sc-side scroll" id="scSide">${tableHtml}</div>
    </div>`;
    $('#scSide').style.display = window.innerWidth >= 900 ? '' : 'none';
  }

  // After a round is scored: totals count up to their new values, and a finished
  // sheet gets the win celebration in the leaders' colours.
  function scoreFx(before, finishedNow) {
    if (!FXL || !SC || tab !== 'score') return;
    const after = scTotals(SC, SC.cur);
    let moved = false;
    document.querySelectorAll('#v-score .sc-tot').forEach((el, p) => {
      if (before[p] == null || before[p] === after[p]) return;
      moved = true;
      FXL.countUp(el, before[p], after[p], { duration: 650 });
    });
    if (moved) fxPlay('coins');
    if (finishedNow) {
      const t = scTotals(SC, 99), best = Math.max(...t);
      const colors = SC.players.map((_, p) => p).filter(p => t[p] === best).map(p => PLAYER_COLORS[p % 8]).concat(['#f0b354', '#e8eaf0']);
      FXL.celebrate({ kind: 'win', colors });
    }
  }

  function livePts(sc, p) {
    const r = sc.rounds[sc.cur];
    const b = r.bonus[p] || {};
    let pts = SK.roundScore(r.bids[p], r.tricks[p], bonusTotal(b), r.cards, sc.scoring, r.cannon[p]);
    if (b.bet) pts += r.bids[p] === r.tricks[p] ? b.bet : -b.bet;
    return pts;
  }

  function winnerBanner(sc) {
    const t = scTotals(sc, 99);
    const best = Math.max(...t);
    const names = sc.players.filter((_, p) => t[p] === best);
    return `<div class="banner"><h2>${esc(names.join(' & '))} win${names.length > 1 ? '' : 's'}</h2><p>${best} points after ${sc.rounds.length} rounds</p></div>`;
  }

  function scoreTableHTML(sc) {
    const n = sc.players.length;
    const head = sc.players.map(nm => `<th title="${esc(nm)}">${esc(nm.slice(0, 8))}</th>`).join('');
    const body = sc.rounds.map((r, ri) => {
      if (!r.done && ri !== sc.cur) return '';
      const tds = sc.players.map((_, p) => {
        const pts = r.done ? scPts(sc, ri, p) : null;
        return `<td class="${ri === sc.cur ? 'cur' : ''}"><span class="bt">${r.bids[p]}/${r.done ? r.tricks[p] : '–'}</span><span class="${cls(pts)}">${pts == null ? '' : sgn(pts)}</span></td>`;
      }).join('');
      return `<tr data-act="sc-jump" data-r="${ri}" style="cursor:pointer"><td>${ri + 1} <span class="bt">(${r.cards})</span></td>${tds}</tr>`;
    }).join('');
    const tot = scTotals(sc, 99);
    const hits = sc.players.map((_, p) => {
      const done = sc.rounds.filter(r => r.done);
      if (!done.length) return '–';
      return Math.round(100 * done.filter(r => r.bids[p] === r.tricks[p]).length / done.length) + '%';
    });
    const other = sc.scoring === 'rascal' ? 'sk' : 'rascal';
    const otherT = scTotals(sc, 99, other);
    return `<table class="grid-table"><thead><tr><th>Rd</th>${head}</tr></thead><tbody>${body}</tbody>
      <tfoot><tr><td>Total</td>${tot.map(x => `<td>${x}</td>`).join('')}</tr>
      <tr><td class="muted" style="font-weight:600">Hit rate</td>${hits.map(x => `<td class="muted" style="font-weight:600">${x}</td>`).join('')}</tr>
      <tr><td class="muted" style="font-weight:600">${other === 'sk' ? 'Standard' : 'Rascal'}</td>${otherT.map(x => `<td class="muted" style="font-weight:600">${x}</td>`).join('')}</tr></tfoot></table>`;
  }

  function scoreSetupHTML() {
    const rows = scSetupNames.map((nm, i) => `<div class="setup-row"><span class="dot" style="background:${PLAYER_COLORS[i]}"></span>
      <input type="text" maxlength="16" placeholder="Player ${i + 1}" value="${esc(nm)}" data-name="${i}" autocomplete="off" autocapitalize="words">
      <button class="xbtn" data-act="sc-del" data-i="${i}" ${scSetupNames.length <= 2 ? 'disabled' : ''} aria-label="Remove">×</button></div>`).join('');
    const sched = SK.SCHEDULES[S.schedule];
    return `<div style="display:flex;flex-direction:column;gap:12px;min-height:0;flex:1;max-width:520px;width:100%;margin:0 auto">
      <div class="row"><div class="grow"><div style="font-size:20px;font-weight:800">New scoresheet</div><div class="muted" style="font-size:13px">${esc(sched.name)} · ${S.scoring === 'rascal' ? 'Rascal' : 'Standard'} scoring</div></div></div>
      <div class="setup-list scroll" style="flex:0 1 auto">${rows}</div>
      <div class="row"><button class="btn grow" data-act="sc-add" ${scSetupNames.length >= 8 ? 'disabled' : ''}>Add player</button><button class="btn primary grow" data-act="sc-start">Start</button></div>
    </div>`;
  }

  function scoreBonusSheet(p) {
    const r = SC.rounds[SC.cur], b = r.bonus[p];
    const item = (key, label, sub, max) => `<div class="bonus-row"><div class="t">${label}<small>${sub}</small></div>
      <div class="step sm"><button data-act="sc-bstep" data-p="${p}" data-k="${key}" data-d="-1" ${(b[key] || 0) <= 0 ? 'disabled' : ''}>−</button><span class="val">${b[key] || 0}</span><button data-act="sc-bstep" data-p="${p}" data-k="${key}" data-d="1" ${(b[key] || 0) >= max ? 'disabled' : ''}>+</button></div></div>`;
    const bet = SC.abilities ? `<div class="bonus-row"><div class="t">Rascal bet<small>won if bid hit, lost if not</small></div><div class="seg" style="width:150px">${[0, 10, 20].map(x => `<button data-act="sc-bet" data-p="${p}" data-v="${x}" class="${(b.bet || 0) === x ? 'on' : ''}">${x}</button>`).join('')}</div></div>` : '';
    openSheet(`<h3>${esc(SC.players[p])}: bonus ${q('bonus')}</h3>
      <div class="bonus-list">
        ${item('c14', 'Colour 14s', '+10 each', 3)}
        ${item('b14', 'Black 14', '+20', 1)}
        ${item('mer', 'Mermaid taken by Pirate', '+20 each', 2)}
        ${item('pir', 'Pirate taken by Skull King', '+30 each', 6)}
        ${item('sk', 'Skull King taken by Mermaid', '+40', 1)}
        ${item('loot', 'Loot alliance', '+20 each', 2)}
        ${bet}
      </div>
      <div class="acts"><button class="btn primary" data-act="close-sheet">Done · +${bonusTotal(b)}</button></div>`);
    sheetKind = 'bonus:' + p;
  }

  function scoreAct(act, d) {
    const sc = SC;
    switch (act) {
      case 'sc-add': scSetupNames.push(''); renderScore(); return true;
      case 'sc-del': scSetupNames.splice(+d.i, 1); renderScore(); return true;
      case 'sc-start': {
        const names = scSetupNames.map((n, i) => n.trim() || 'Player ' + (i + 1));
        SC = { players: names, rounds: [], cur: 0, phase: 'bid', scoring: S.scoring, cannonball: S.scoring === 'rascal' && S.cannonball, abilities: S.abilities, schedule: S.schedule };
        saved.lastNames = scSetupNames.slice();
        try { const all = load(); all.lastNames = saved.lastNames; localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
        scNewRound(SC); renderScore(); save(); return true;
      }
      case 'sc-step': {
        const r = sc.rounds[sc.cur], p = +d.p, arr = sc.phase === 'tricks' ? r.tricks : r.bids;
        fxPlay('tick', { cat: 'ui', pitch: +d.d > 0 ? 1.12 : 0.9 });
        arr[p] = clamp(arr[p] + (+d.d), 0, r.cards); renderScore(); save(); return true;
      }
      case 'sc-cannon': { const r = sc.rounds[sc.cur]; r.cannon[+d.p] = !r.cannon[+d.p]; renderScore(); save(); return true; }
      case 'sc-phase': fxPlay(d.ph === 'tricks' && sc.phase === 'bid' ? 'yoho' : 'tap', d.ph === 'tricks' && sc.phase === 'bid' ? undefined : { cat: 'ui' }); sc.phase = d.ph; if (d.ph === 'bid') sc.rounds[sc.cur].done = sc.rounds[sc.cur].done; renderScore(); save(); return true;
      case 'sc-bonus': scoreBonusSheet(+d.p); return true;
      case 'sc-bstep': {
        const b = sc.rounds[sc.cur].bonus[+d.p];
        fxPlay(+d.d > 0 ? 'coin' : 'tick', +d.d > 0 ? undefined : { cat: 'ui' });
        b[d.k] = Math.max(0, (b[d.k] || 0) + (+d.d)); scoreBonusSheet(+d.p); renderScore(); save(); return true;
      }
      case 'sc-bet': { fxPlay(+d.v > 0 ? 'chips' : 'tick', +d.v > 0 ? undefined : { cat: 'ui' }); sc.rounds[sc.cur].bonus[+d.p].bet = +d.v; scoreBonusSheet(+d.p); renderScore(); save(); return true; }
      case 'sc-done': {
        const before = scTotals(sc, sc.cur), wasOver = scFinished(sc);
        sc.rounds[sc.cur].done = true;
        if (sc.rounds.length < scPlanned(sc) || !scFinished(sc)) {
          if (sc.rounds.length >= scPlanned(sc)) toast('Tied at the top: one more round');
          scNewRound(sc);
        }
        renderScore(); save(); scoreFx(before, !wasOver && scFinished(sc)); return true;
      }
      case 'sc-goto': {
        const dd = +d.d;
        if (dd > 0 && sc.cur < sc.rounds.length - 1) { const before = scTotals(sc, sc.cur); setTimeout(() => scoreFx(before, false), 0); }
        if (dd < 0) {
          if (sc.phase === 'tricks') sc.phase = 'bid';
          else if (sc.cur > 0) { sc.cur--; sc.phase = 'tricks'; }
        } else {
          if (sc.cur < sc.rounds.length - 1) { sc.rounds[sc.cur].done = true; sc.cur++; sc.phase = sc.rounds[sc.cur].done ? 'tricks' : 'bid'; }
        }
        renderScore(); save(); return true;
      }
      case 'sc-jump': sc.cur = +d.r; sc.phase = 'tricks'; if (sheetOpen) closeSheet(); renderScore(); save(); return true;
      case 'sc-new': {
        openSheet(`<h3>Start a new scoresheet?</h3><p class="muted" style="margin:0">This one is cleared. You can undo for a few seconds.</p>
          <div class="acts"><button class="btn" data-act="close-sheet">Cancel</button><button class="btn primary" data-act="sc-new-yes">New scoresheet</button></div>`);
        return true;
      }
      case 'sc-new-yes': {
        const old = SC; SC = null; closeSheet();
        scSetupNames = old.players.map((nm, i) => (nm === 'Player ' + (i + 1) ? '' : nm)); // default names stay placeholders
        renderScore(); renderTop(); save();
        toast('Scoresheet cleared', () => { SC = old; if (tab === 'score') { renderScore(); renderTop(); } save(); });
        return true;
      }
      case 'sc-table': openSheet(`<h3>Scoresheet</h3><div class="scroll">${scoreTableHTML(SC)}</div><div class="acts"><button class="btn" data-act="close-sheet">Close</button></div>`); sheetKind = 'table'; return true;
      case 'sc-advisor': {
        ADV.players = sc.players.length; ADV.cards = sc.rounds[sc.cur].cards;
        ADV.hand = ADV.hand.slice(0, ADV.cards);
        ADV.before = clamp(ADV.before, 0, ADV.players - 1);
        resetStudy(); setTab('bid'); return true;
      }
    }
    return false;
  }

  // ============================================================ ADVISOR
  const ADV = Object.assign({ players: 4, cards: 3, before: 0, hand: [], mode: 'hand' }, saved.adv || {});
  let advAcc = null, advKey = '', advTimer = 0, advGen = 0;
  const ADV_TARGET = 2000;

  function advOpts() { return { kraken: S.kraken, whale: S.whale, loot: S.loot && ADV.players > 2 }; }
  function maxCards(players) { return Math.floor(70 / (players === 2 && S.ghost ? 3 : players)); }

  function resetStudy() { advAcc = null; advKey = ''; advGen++; clearTimeout(advTimer); }
  function runStudy() {
    const key = JSON.stringify([ADV.players, ADV.before, ADV.hand.slice().sort((a, b) => a - b), advOpts(), S.scoring, S.ghost]);
    if (ADV.hand.length !== ADV.cards) { resetStudy(); return; }
    if (key !== advKey) { resetStudy(); advKey = key; }
    if (advAcc && advAcc.samples >= ADV_TARGET) return;
    const gen = advGen;
    const step = () => {
      if (gen !== advGen) return;
      const t0 = performance.now();
      do {
        advAcc = AI.bidStudy({ hand: ADV.hand, players: ADV.players, before: ADV.before, opts: advOpts(), scoring: S.scoring, ghost: S.ghost, samples: 10 }, advAcc);
      } while (performance.now() - t0 < 30 && advAcc.samples < ADV_TARGET);
      if (tab === 'bid') renderAdvisorResults();
      if (advAcc.samples < ADV_TARGET) advTimer = setTimeout(step, 16);
    };
    advTimer = setTimeout(step, 0);
  }

  function renderBid() {
    const v = $('#v-bid');
    ADV.cards = clamp(ADV.cards, 1, maxCards(ADV.players));
    ADV.before = clamp(ADV.before, 0, ADV.players - 1);
    const deck = SK.deckIds(advOpts());
    ADV.hand = ADV.hand.filter(id => deck.indexOf(id) >= 0).slice(0, ADV.cards);
    const seg = `<div class="seg" style="grid-column:1/-1"><button data-act="adv-mode" data-m="hand" class="${ADV.mode === 'hand' ? 'on' : ''}">My hand</button><button data-act="adv-mode" data-m="odds" class="${ADV.mode === 'odds' ? 'on' : ''}">Card odds</button></div>`;
    const stepper = (k, val, lo, hi, label, help) => `<div class="cell"><span class="lbl">${label}${help ? ' ' + q(help) : ''}</span><div class="step sm"><button data-act="adv-step" data-k="${k}" data-d="-1" ${val <= lo ? 'disabled' : ''}>−</button><span class="val">${val}</span><button data-act="adv-step" data-k="${k}" data-d="1" ${val >= hi ? 'disabled' : ''}>+</button></div></div>`;
    if (ADV.mode === 'odds') {
      v.innerHTML = `<div class="adv" style="grid-template-rows:auto auto 1fr">
        ${seg}
        <div class="adv-ctl">${stepper('players', ADV.players, 2, 8, 'Players')}${stepper('cards', ADV.cards, 1, maxCards(ADV.players), 'Cards each')}<div class="cell"><span class="lbl">Can it lose? ${q('unbeaten')}</span></div></div>
        <div class="scroll" id="oddsBox" style="grid-column:1/-1">${oddsTableHTML()}</div>
      </div>`;
      runOdds();
      return;
    }
    const slots = [];
    for (let i = 0; i < ADV.cards; i++) {
      slots.push(i < ADV.hand.length ? face(ADV.hand[i], 'xs', '').replace('class="cardf', 'data-act="adv-remove" data-i="' + i + '" class="cardf') : '<div class="slot"></div>');
    }
    v.innerHTML = `<div class="adv">
      ${seg}
      <div class="adv-ctl">${stepper('players', ADV.players, 2, 8, 'Players')}${stepper('cards', ADV.cards, 1, maxCards(ADV.players), 'Cards')}${stepper('before', ADV.before, 0, ADV.players - 1, 'Before you', 'before')}</div>
      <div class="adv-hand-row"><div class="adv-hand ${ADV.cards > 13 ? 'two' : ''}" id="advHand">${slots.join('')}</div>${ADV.hand.length ? `<button class="btn sm ghost" data-act="adv-clear">Clear</button>` : ''}</div>
      <div class="picker" id="picker">${pickerHTML()}</div>
      <div class="chart" id="advChart"></div>
    </div>`;
    renderAdvisorResults();
    runStudy();
  }

  function pickerHTML() {
    const inHand = new Set(ADV.hand);
    const full = ADV.hand.length >= ADV.cards;
    let h = '';
    for (const s of [0, 1, 2, 3]) {
      for (let r = 1; r <= 14; r++) {
        const id = s * 14 + r - 1, on = inHand.has(id);
        const col = SUIT_COLORS[s];
        const fg = s === 0 ? '#f2f2f2' : '#14161c';
        h += `<button class="pk ${on ? 'on' : ''}" data-act="adv-pick" data-id="${id}" ${!on && full ? 'disabled' : ''} style="background:${col};color:${fg};${s === 0 ? 'border-color:#555b70' : ''}" aria-label="${SK.SUIT_NAMES[s]} ${r}">${r}</button>`;
      }
    }
    h = `<div class="pk-grid">${h}</div><div class="pk-sp">`;
    const kinds = [['esc', 'Escape'], ['pir', 'Pirate'], ['tig', 'Tigress'], ['sk', 'Skull King'], ['mer', 'Mermaid']];
    if (S.kraken) kinds.push(['kra', 'Kraken']);
    if (S.whale) kinds.push(['wha', 'Whale']);
    if (S.loot && ADV.players > 2) kinds.push(['loot', 'Loot']);
    for (const [k, label] of kinds) {
      const ids = SK.deckIds(advOpts()).filter(id => CARDS[id].k === k);
      const have = ids.filter(id => inHand.has(id)).length;
      const icon = Art && Art.kindIcon ? `<span style="width:14px;height:14px;display:inline-block">${Art.kindIcon(k)}</span>` : '';
      h += `<button class="pk pk-special ${have ? 'on' : ''}" data-act="adv-kind" data-k="${k}" ${(full || have >= ids.length) && !have ? 'disabled' : ''}>${icon}${label}${have ? `<span class="cnt">${have}</span>` : ''}</button>`;
    }
    return h + '</div>';
  }

  function renderAdvisorResults() {
    const box = $('#advChart');
    if (!box) return;
    if (ADV.hand.length < ADV.cards) {
      const left = ADV.cards - ADV.hand.length;
      box.innerHTML = `<div class="empty">Pick ${left} more card${left > 1 ? 's' : ''} for your hand.</div>`;
      return;
    }
    if (!advAcc) { box.innerHTML = '<div class="empty">Dealing…</div>'; return; }
    const rows = advAcc.bids;
    const best = rows[advAcc.best];
    const maxC = Math.max(...rows.map(r => r.chance), 0.01);
    const evs = rows.map(r => r.avg);
    const lo = Math.min(...evs), hi = Math.max(...evs);
    const bars = rows.map(r => {
      const t = hi > lo ? (r.avg - lo) / (hi - lo) : 1;
      return `<div class="bar ${r.bid === best.bid ? 'best' : ''}"><span class="pct">${Math.round(r.chance * 100)}%</span><div class="fill" style="height:${Math.max(2, 100 * r.chance / maxC) * 0.72}%"></div><span class="b">${r.bid}</span><span class="ev" style="color:${heat(t)}">${sgn(r.avg)}</span></div>`;
    }).join('');
    let cannon = '';
    if (S.scoring === 'rascal' && S.cannonball) {
      cannon = best.avgCannon > best.avg ? ` · <b style="color:var(--gold)">Cannonball</b> ${sgn(best.avgCannon)}` : ` · Grapeshot`;
    }
    box.innerHTML = `<div class="verdict"><span class="lbl">Best bid</span><span class="big">${best.bid}</span><span class="muted" style="font-size:13.5px">hits ${Math.round(best.chance * 100)}% · avg ${sgn(best.avg)}${cannon}</span><span style="margin-left:auto">${q('advisor')}</span></div>
      <div class="bars" style="margin-top:8px">${bars}</div>
      <div class="row muted" style="font-size:11.5px;margin-top:6px;justify-content:space-between"><span>Bar = chance of exactly that many tricks · under = avg points</span><span class="num">${advAcc.samples.toLocaleString()} deals</span></div>`;
  }

  // Card odds table: rows of cards, columns of player counts.
  const ODDS_ROWS = [[67, 'Skull King'], [61, 'Pirate'], [68, 'Mermaid'], [13, 'Black 14'], [10, 'Black 11'], [6, 'Black 7'], [0, 'Black 1'], [27, 'Colour 14'], [25, 'Colour 12'], [22, 'Colour 9'], [19, 'Colour 6'], [15, 'Colour 2']];
  let oddsCache = {}, oddsGen = 0;
  function oddsTableHTML() {
    const cols = [2, 3, 4, 5, 6, 7, 8];
    const key = c => [ADV.cards, c, S.kraken, S.whale, S.loot].join(',');
    const head = cols.map(c => `<th class="${c === ADV.players ? '' : 'muted'}" style="${c === ADV.players ? 'color:var(--gold)' : ''}">${c}</th>`).join('');
    const body = ODDS_ROWS.map(([id, label]) => `<tr><td>${label}</td>${cols.map(c => {
      const v = oddsCache[key(c) + ':' + id];
      if (c * ADV.cards > 70 + (S.kraken ? 1 : 0)) return '<td class="muted">–</td>';
      return v == null ? '<td class="muted">…</td>' : `<td class="h" style="background:${heat(v)}">${Math.round(v * 100)}</td>`;
    }).join('')}</tr>`).join('');
    return `<table class="odds-table"><thead><tr><th class="lbl">Card · players</th>${head}</tr></thead><tbody>${body}</tbody></table>
      <p class="muted" style="font-size:12px;margin:8px 0 0">% chance nobody can beat it if you lead it, ${ADV.cards} card${ADV.cards > 1 ? 's' : ''} each.</p>`;
  }
  function runOdds() {
    const gen = ++oddsGen;
    const opts = { kraken: S.kraken, whale: S.whale, loot: S.loot };
    const jobs = [];
    for (const c of [2, 3, 4, 5, 6, 7, 8]) for (const [id] of ODDS_ROWS) {
      if (c * ADV.cards > 70) continue;
      const k = [ADV.cards, c, S.kraken, S.whale, S.loot].join(',') + ':' + id;
      if (oddsCache[k] == null) jobs.push([k, id, c]);
    }
    const step = () => {
      if (gen !== oddsGen || tab !== 'bid' || ADV.mode !== 'odds') return;
      const t0 = performance.now();
      while (jobs.length && performance.now() - t0 < 30) {
        const [k, id, c] = jobs.shift();
        oddsCache[k] = AI.unbeatenChance(id, c, ADV.cards, opts, 1500);
      }
      const box = $('#oddsBox'); if (box) box.innerHTML = oddsTableHTML();
      if (jobs.length) setTimeout(step, 16);
    };
    setTimeout(step, 0);
  }

  function bidAct(act, d) {
    switch (act) {
      case 'adv-mode': ADV.mode = d.m; renderBid(); save(); return true;
      case 'adv-step': {
        const lim = { players: [2, 8], cards: [1, maxCards(ADV.players)], before: [0, ADV.players - 1] }[d.k];
        ADV[d.k] = clamp(ADV[d.k] + (+d.d), lim[0], lim[1]);
        if (d.k === 'players') { ADV.cards = clamp(ADV.cards, 1, maxCards(ADV.players)); ADV.before = clamp(ADV.before, 0, ADV.players - 1); }
        renderBid(); save(); return true;
      }
      case 'adv-pick': {
        const id = +d.id, i = ADV.hand.indexOf(id);
        if (i >= 0) ADV.hand.splice(i, 1); else if (ADV.hand.length < ADV.cards) ADV.hand.push(id);
        renderBid(); save(); return true;
      }
      case 'adv-kind': {
        const ids = SK.deckIds(advOpts()).filter(id => CARDS[id].k === d.k);
        const free = ids.find(id => ADV.hand.indexOf(id) < 0);
        if (ADV.hand.length < ADV.cards && free != null) ADV.hand.push(free);
        else { const have = ids.filter(id => ADV.hand.indexOf(id) >= 0); if (have.length) ADV.hand.splice(ADV.hand.indexOf(have[have.length - 1]), 1); }
        renderBid(); save(); return true;
      }
      case 'adv-remove': ADV.hand.splice(+d.i, 1); renderBid(); save(); return true;
      case 'adv-clear': ADV.hand = []; renderBid(); save(); return true;
    }
    return false;
  }

  // ============================================================ PLAY
  const PLAY = {
    state: saved.play ? saved.play.state : null,
    seats: saved.play ? saved.play.seats : null,
    study: saved.play ? (saved.play.study || null) : null,
    log: (saved.play && saved.play.log) || [],
    roundHands: (saved.play && saved.play.roundHands) || null,
    shownRoundSheet: (saved.play && saved.play.shown) || 0,
    setup: null, gen: 0, timer: 0, me: 0, sel: null, hint: null, evalCache: null, bidCache: null, busy: false, discard: [],
  };
  if (!PLAY.setup) PLAY.setup = [{ kind: 'you' }, { kind: 'cpu', level: 'medium' }, { kind: 'cpu', level: 'medium' }, { kind: 'cpu', level: 'hard' }];
  if (PLAY.state && PLAY.state.v !== 2) { PLAY.state = null; }
  if (SFX) SFX.attach({
    visible: () => tab === 'play' && !document.hidden,
    root: () => $('#v-play'),
    colors: seats => seats.map(p => PLAYER_COLORS[p % 8]).concat(['#f0b354', '#e8eaf0']),
    from: () => PLAY.fxFrom || null,
  });

  const LEVEL_NOTE = { easy: 'plays by feel', medium: 'counts cards', hard: 'simulates' };

  function strengthNote() {
    return `<table class="res-table" style="font-size:13px"><tr><th>Level</th><th>Win share</th><th>vs</th></tr>${STRENGTH.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="muted">${r[2]}</td></tr>`).join('')}</table>
      <p class="muted" style="font-size:12px;margin:6px 0 0">${STRENGTH_NOTE}</p>`;
  }
  // Measured with tools/strength.js (see progress.md). Fair share with 4 players = 25%.
  const STRENGTH = [
    ['Hard', '76%', '3 Medium (200 games)'],
    ['Hard', '86%', '3 Easy (200 games)'],
    ['Medium', '46%', '3 Easy (1000 games)'],
    ['Medium', '9%', '3 Hard (200 games)'],
    ['Easy', '10%', '3 Medium (1000 games)'],
  ];
  const STRENGTH_NOTE = 'Whole 10-round games, 4 players. A fair share is 25%.';

  function renderPlay() {
    const v = $('#v-play');
    if (!PLAY.state) { v.innerHTML = PLAY.net ? lobbyHTML() : playSetupHTML(); return; }
    const st = PLAY.state, me = PLAY.me;
    const view = SK.view(st, me);
    const names = st.players.map(p => p.name);
    // chips
    const chips = st.players.map((pl, p) => {
      const ghost = p === st.ghost;
      const turn = SK.whoActs(st).indexOf(p) >= 0 && st.phase !== 'bid';
      let bidTxt;
      if (ghost) bidTxt = '–';
      else if (st.phase === 'bid') bidTxt = view.bidIn[p] ? (p === me ? String(st.bids[p]) : '<span class="pos">✓</span>') : '…';
      else bidTxt = st.bids[p] + (st.cannon[p] ? '●' : '');
      const sc = st.scores[p];
      return `<div class="chip ${turn ? 'turn' : ''} ${ghost ? 'ghost' : ''}"><div class="n"><span style="color:${PLAYER_COLORS[p % 8]}">●</span> ${esc(p === me ? 'You' : pl.name)}</div>
        <div class="s"><span>${ghost ? 'won ' + st.won[p] : `<b>${st.won[p]}</b>/${bidTxt}`}</span><b class="num">${ghost ? '' : neg(sc)}</b></div></div>`;
    }).join('');
    // felt: current trick, or the last finished trick
    let trickHtml = '', msg = '';
    const showing = st.trick.length ? st.trick : (st.lastTrick && st.phase !== 'bid' ? st.lastTrick.plays : []);
    const winnerP = !st.trick.length && st.lastTrick && st.phase !== 'bid' ? st.lastTrick.winner : null;
    const fresh = PLAY.lastSeq !== st.seq; // only animate a card the first time it lands
    PLAY.lastSeq = st.seq;
    trickHtml = showing.map((pl, i) => {
      const isNew = fresh && st.trick.length && i === st.trick.length - 1;
      const asTxt = CARDS[pl.id].k === 'tig' ? (pl.as === 'esc' ? ' · esc' : ' · pirate') : '';
      return `<div class="tcard ${winnerP === pl.p ? 'win' : ''}">${face(pl.id, '', isNew ? 'drop' : '')}<span class="who">${esc(pl.p === me ? 'You' : names[pl.p])}${asTxt}</span></div>`;
    }).join('');
    msg = playMessage(st, view);
    // actions
    const actions = playActionsHTML(st, view);
    // hand
    const hand = view.hands[me] || [];
    const myTurn = st.phase === 'play' && st.turn === me;
    const legal = myTurn ? SK.legalPlays(st, me) : [];
    let odds = null;
    if (myTurn && S.odds && !(PLAY.hint && PLAY.hint.ev)) odds = AI.cardOdds(view, me);
    const discardMode = st.phase === 'ability' && st.pending && st.pending.seat === me && st.pending.ability === 'bendt';
    const handHtml = hand.map(id => {
      const can = myTurn ? legal.indexOf(id) >= 0 : discardMode;
      let extra = can ? 'can' : (myTurn ? 'dim' : '');
      if (PLAY.sel === id || (discardMode && PLAY.discard.indexOf(id) >= 0)) extra += ' sel';
      if (PLAY.hint && PLAY.hint.best === id) extra += ' best';
      if (st.round !== PLAY.dealtRound) extra += ' deal';
      let badge = '';
      if (PLAY.hint && PLAY.hint.ev && PLAY.hint.ev[id] != null) badge = `<span class="badge" style="color:${heat(PLAY.hint.t[id])}">${sgn(PLAY.hint.ev[id])}</span>`;
      else if (odds && odds[id] != null) badge = `<span class="badge" style="color:${heat(odds[id])}">${Math.round(odds[id] * 100)}%</span>`;
      return face(id, '', extra).replace('</div>', badge + '</div>').replace('class="cardf', `data-act="${discardMode ? 'pl-discard' : 'pl-card'}" class="cardf`);
    }).join('');
    PLAY.dealtRound = st.round;
    const studyLine = PLAY.study && S.study && PLAY.study.last ? `<div class="study">${PLAY.study.last}</div>` : '';
    // Layout counts for the CSS grids: cards per hand row (one row, or two even
    // rows when the hand is long), and one trick column per player.
    const wide = window.innerWidth >= 900;
    const perRow = hand.length <= (wide ? 8 : 6) ? Math.max(hand.length, 1) : Math.ceil(hand.length / 2);
    v.innerHTML = `<div class="pl">
      <div class="chips">${chips}</div>
      <div class="felt ${st.phase === 'bid' ? 'bidding' : ''}"><div class="msg">${msg}</div><div class="trick ${st.players.length >= 7 ? 'many' : ''}" style="--tn:${st.players.length}">${trickHtml}</div></div>
      <div class="actions-wrap">${studyLine}<div class="actions">${actions}</div></div>
      <div class="hand ${odds || (PLAY.hint && PLAY.hint.ev) ? 'badges' : ''}" style="--per:${perRow}">${handHtml}</div>
      <div class="pl-side">${playSideHTML(st)}</div>
    </div>`;
  }

  function playMessage(st, view) {
    const me = PLAY.me, nm = p => (p === me ? 'You' : st.players[p].name);
    const R = `Round ${st.round}${st.round > SK.SCHEDULES[st.schedule].sizes.length ? ' (tie-break)' : ''} · ${st.cards} card${st.cards > 1 ? 's' : ''}`;
    if (st.phase === 'over') {
      const w = SK.winners(st);
      return `${w.map(nm).join(' & ')} win${w.length === 1 && w[0] !== me ? 's' : ''}! <small>${st.scores.filter((_, p) => p !== st.ghost).join(' · ')}</small>`;
    }
    if (st.phase === 'bid') return `${R}<small>${view.bids[me] == null ? 'How many tricks will you take?' : 'Waiting for bids…'}</small>`;
    if (st.phase === 'cannon') return `${R}<small>Cannonball or Grapeshot?</small>`;
    if (st.phase === 'roundEnd') return `Round ${st.round} over<small>${resultLine(st)}</small>`;
    if (st.phase === 'ability') {
      const p = st.pending.seat, a = st.pending.ability;
      const what = { rosie: 'chooses who leads', bendt: 'draws 2, discards 2', rascal: 'places a bet', juanita: 'looks at the undealt cards', harry: 'may change the bid' }[a];
      return `${nm(p)} won with ${SK.PIRATES.find(x => x.ability === a).name}<small>${p === me ? 'Use the power' : what}</small>`;
    }
    let sub = '';
    if (!st.trick.length && st.lastTrick) {
      const lt = st.lastTrick;
      sub = lt.winner == null ? (lt.how === 'kraken' ? 'Kraken! Nobody takes it' : 'The White Whale discards it')
        : `${nm(lt.winner)} took it${lt.bonus ? ` (+${lt.bonus} bonus)` : ''}${lt.winner === st.ghost ? '' : ''}`;
    }
    const whose = st.turn === me ? (st.trick.length ? 'Your turn' : 'Your lead') : `${nm(st.turn)}…`;
    return `${whose}<small>${sub || `Trick ${st.tricksDone + 1} of ${st.cards}`}</small>`;
  }
  function resultLine(st) {
    const h = st.history[st.history.length - 1];
    const r = h.results[PLAY.me];
    return `You bid ${r.bid}, took ${r.won}: <b class="${cls(r.pts)}">${sgn(r.pts)}</b>`;
  }

  function playActionsHTML(st, view) {
    const me = PLAY.me;
    if (st.phase === 'over') return `<button class="btn" data-act="pl-results">Results</button><button class="btn primary" data-act="pl-again">New game</button>`;
    if (st.phase === 'roundEnd') return `<button class="btn" data-act="pl-results">Results</button><button class="btn primary" data-act="pl-next">Next round</button>`;
    if (st.phase === 'bid' && view.bids[me] == null) {
      const hintBid = PLAY.hint && PLAY.hint.bid != null ? PLAY.hint.bid : -1;
      let pad = '';
      for (let b = 0; b <= st.cards; b++) pad += `<button class="btn ${b === hintBid ? 'hint' : ''}" data-act="pl-bid" data-b="${b}">${b}</button>`;
      const n = st.cards + 1, wide = window.innerWidth >= 900;
      const cols = n <= (wide ? 14 : 8) ? n : Math.ceil(n / Math.ceil(n / (wide ? 14 : 8)));
      return `<div class="bidpad" style="--bn:${cols}">${pad}</div><button class="btn sm ghost" data-act="pl-hint">${PLAY.hint && PLAY.hint.bidText ? PLAY.hint.bidText : 'Hint'}</button>`;
    }
    if (st.phase === 'cannon' && !st.cannonIn[me]) {
      return `<button class="btn" data-act="pl-cannon" data-on="0">Grapeshot</button><button class="btn primary" data-act="pl-cannon" data-on="1">Cannonball</button>${q('cannonball')}`;
    }
    if (st.phase === 'play' && st.turn === me) {
      if (PLAY.sel != null && CARDS[PLAY.sel].k === 'tig') {
        return `<button class="btn" data-act="pl-tig" data-as="esc">As Escape</button><button class="btn primary" data-act="pl-tig" data-as="pir">As Pirate</button><button class="btn ghost sm" data-act="pl-unsel">Cancel</button>`;
      }
      return `<button class="btn sm ghost" data-act="pl-hint">${PLAY.hint ? 'Best: ' + esc(shortName(PLAY.hint.best)) + (PLAY.hint.bestAs ? (PLAY.hint.bestAs === 'esc' ? ' (escape)' : ' (pirate)') : '') : 'Hint'}</button>`;
    }
    if (st.phase === 'ability' && st.pending.seat === me) {
      const a = st.pending.ability;
      if (a === 'rosie') return `<span class="muted" style="font-size:13px">Who leads next?</span>` + st.players.map((pl, p) => (p === st.ghost ? '' : `<button class="btn sm" data-act="pl-ab" data-k="lead" data-v="${p}">${esc(p === me ? 'You' : pl.name)}</button>`)).join('');
      if (a === 'bendt') return `<span class="muted" style="font-size:13px">Pick ${st.pending.drawn.length} to discard</span><button class="btn primary sm" data-act="pl-ab-discard" ${PLAY.discard.length !== st.pending.drawn.length ? 'disabled' : ''}>Discard</button>`;
      if (a === 'rascal') return `<span class="muted" style="font-size:13px">Bet on your bid</span>` + [0, 10, 20].map(x => `<button class="btn sm" data-act="pl-ab" data-k="bet" data-v="${x}">${x}</button>`).join('');
      if (a === 'harry') return `<span class="muted" style="font-size:13px">Bid ${st.bids[me]}, won ${st.won[me]}</span>` + [-1, 0, 1].map(x => `<button class="btn sm" data-act="pl-ab" data-k="delta" data-v="${x}">${x === 0 ? 'Keep' : (x > 0 ? '+1' : '−1')}</button>`).join('');
      if (a === 'juanita') {
        const und = view.undealt || [];
        return `<div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;max-height:96px;overflow:auto">${und.map(id => face(id, 'xs')).join('') || '<span class="muted">No undealt cards</span>'}</div><button class="btn primary sm" data-act="pl-ab" data-k="ok" data-v="1">Done</button>`;
      }
    }
    return '';
  }

  function playSideHTML(st) {
    const items = [];
    const log = (PLAY.log || []).slice(-14).reverse();
    items.push(`<div class="panel" style="padding:12px"><div class="lbl" style="margin-bottom:6px">This game</div>${roundsTableHTML(st)}</div>`);
    if (S.study && PLAY.study) {
      items.push(`<div class="panel" style="padding:12px"><div class="lbl" style="margin-bottom:6px">Study · points given up</div><div class="row" style="gap:18px"><div><div class="muted" style="font-size:12px">Bids</div><b class="num">${Math.round(PLAY.study.bidLost || 0)}</b></div><div><div class="muted" style="font-size:12px">Cards</div><b class="num">${Math.round(PLAY.study.playLost || 0)}</b></div></div></div>`);
    }
    items.push(`<div class="panel scroll" style="padding:12px;flex:1"><div class="lbl" style="margin-bottom:6px">What happened</div><ul class="log">${log.map(l => `<li>${l}</li>`).join('')}</ul></div>`);
    return items.join('');
  }

  function roundsTableHTML(st) {
    const seats = st.players.map((p, i) => i).filter(i => i !== st.ghost);
    const many = seats.length > 5; // 6+ players: short names so every column fits the side panel
    const head = seats.map(p => `<th title="${esc(st.players[p].name)}">${esc(p === PLAY.me ? 'You' : st.players[p].name.slice(0, many ? 3 : 6))}</th>`).join('');
    const rows = st.history.map(h => `<tr><td>${h.round}</td>${seats.map(p => `<td><span class="bt">${h.results[p].bid}/${h.results[p].won}</span><span class="${cls(h.results[p].pts)}">${sgn(h.results[p].pts)}</span></td>`).join('')}</tr>`).join('');
    return `<div class="rt-wrap ${seats.length > 5 ? 'many' : ''}"><table class="grid-table"><thead><tr><th>Rd</th>${head}</tr></thead><tbody>${rows}</tbody><tfoot><tr><td>Total</td>${seats.map(p => `<td>${neg(st.scores[p])}</td>`).join('')}</tr></tfoot></table></div>`;
  }

  function resultsSheet() {
    const st = PLAY.state;
    const h = st.history[st.history.length - 1];
    if (!h) return;
    const rows = st.players.map((pl, p) => {
      if (p === st.ghost) return '';
      const r = h.results[p];
      return `<tr><td>${esc(p === PLAY.me ? 'You' : pl.name)}</td><td>${r.bid}${r.cannon ? '●' : ''}</td><td>${r.won}</td><td>${r.bonus ? '+' + r.bonus : ''}${r.bet ? ` <span class="${cls(r.bet)}">${sgn(r.bet)}</span>` : ''}</td><td class="${cls(r.pts)}"><b>${sgn(r.pts)}</b></td><td class="num">${neg(st.scores[p])}</td></tr>`;
    }).join('');
    let reveal = '';
    if (S.study && !PLAY.net && PLAY.roundHands && PLAY.roundHands.round === h.round) {
      reveal = `<div class="lbl">Every hand this round</div><div class="reveal scroll" style="max-height:170px">${PLAY.roundHands.hands.map((hand, p) => `<div class="rh"><span class="nm">${esc(p === PLAY.me ? 'You' : st.players[p].name)}</span><div class="cs">${hand.map(id => face(id, 'xs')).join('')}</div></div>`).join('')}</div>`;
    }
    let lost = '';
    if (S.study && PLAY.study && PLAY.study.round === h.round) {
      lost = `<p class="muted" style="margin:0;font-size:13.5px">Points given up this round: bid <b style="color:var(--text)">${Math.round(PLAY.study.rBid || 0)}</b> · cards <b style="color:var(--text)">${Math.round(PLAY.study.rPlay || 0)}</b></p>`;
    }
    const over = st.phase === 'over';
    const w = SK.winners(st);
    openSheet(`<h3>${over ? `${w.map(p => (p === PLAY.me ? 'You' : st.players[p].name)).join(' & ')} win${w.length === 1 && w[0] !== PLAY.me ? 's' : ''}!` : `Round ${h.round} results`}</h3>
      <table class="res-table"><thead><tr><th>Player</th><th>Bid</th><th>Won</th><th>Bonus</th><th>Round</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
      ${lost}${reveal}
      <div class="acts"><button class="btn" data-act="close-sheet">Close</button>${over ? `<button class="btn primary" data-act="pl-again">${PLAY.net ? 'Leave room' : 'New game'}</button>` : st.phase === 'roundEnd' ? '<button class="btn primary" data-act="pl-next">Next round</button>' : ''}</div>`);
    sheetKind = 'results';
  }

  function playSetupHTML() {
    const seats = PLAY.setup.map((s, i) => {
      if (s.kind === 'you') return `<div class="seat"><span style="color:${PLAYER_COLORS[0]}">●</span><span class="nm">You</span></div>`;
      return `<div class="seat"><span style="color:${PLAYER_COLORS[i % 8]}">●</span><span class="nm">${CPU_NAMES[(i - 1) % 7]}</span>
        <div class="seg" style="width:210px">${['easy', 'medium', 'hard'].map(l => `<button data-act="pl-level" data-i="${i}" data-l="${l}" class="${s.level === l ? 'on' : ''}">${l[0].toUpperCase() + l.slice(1)}</button>`).join('')}</div>
        <button class="xbtn" data-act="pl-del" data-i="${i}" ${PLAY.setup.length <= 2 ? 'disabled' : ''} aria-label="Remove" style="height:38px">×</button></div>`;
    }).join('');
    const rules = [SK.SCHEDULES[S.schedule].name, S.scoring === 'rascal' ? 'Rascal' + (S.cannonball ? ' + Cannonball' : '') : 'Standard scoring']
      .concat(S.kraken ? ['Kraken'] : [], S.whale ? ['White Whale'] : [], S.loot ? ['Loot'] : [], S.abilities ? ['Pirate powers'] : []);
    return `<div style="display:flex;flex-direction:column;gap:12px;min-height:0;flex:1;max-width:560px;width:100%;margin:0 auto">
      <div><div style="font-size:20px;font-weight:800">Play the computer</div><div class="muted" style="font-size:13px">${esc(rules.join(' · '))}</div></div>
      <div class="seat-list scroll" style="flex:0 1 auto">${seats}</div>
      <div class="row"><button class="btn grow" data-act="pl-add" ${PLAY.setup.length >= 8 ? 'disabled' : ''}>Add computer</button><button class="btn primary grow" data-act="pl-start">Deal</button></div>
      <div class="row muted" style="font-size:12.5px;gap:6px">Easy plays by feel · Medium counts cards · Hard simulates <span style="margin-left:auto;white-space:nowrap">How strong?</span> ${q('strength')}</div>
      ${PLAY.setup.length === 2 && S.ghost ? `<div class="muted" style="font-size:12.5px">Two players: Graybeard's ghost hand joins. ${q('ghost')}</div>` : ''}
      <div class="panel net-box">
        <div class="row" style="justify-content:space-between"><div class="lbl">Play online</div>${q('online')}</div>
        <input type="text" class="net-in" data-net-name maxlength="20" placeholder="Your name" value="${esc(S.netName || '')}" aria-label="Your name" autocomplete="nickname">
        <div class="row"><button class="btn grow" data-act="net-create">New room</button><input type="text" class="net-in code" data-net-code maxlength="5" placeholder="CODE" value="${esc(PLAY.netCode || '')}" aria-label="Room code" autocapitalize="characters" autocomplete="off"><button class="btn" data-act="net-join">Join</button></div>
      </div>
    </div>`;
  }

  // ---- online rooms (js/online.js + js/skgame.js). Firebase loads only when used.
  const NET_KEY = 'online.skull-king';
  let NET = null, netMod = null;
  async function netOpen() {
    if (!netMod) netMod = await import(new URL('js/online.js?v=3', document.baseURI).href);
    if (!NET) {
      NET = netMod.createOnline({ game: window.SKGame.game, gameId: 'skull-king', botDelayMs: 700 });
      NET.on('change', onNetSnap);
      NET.on('error', msg => toast(msg));
    }
    return NET;
  }
  function netName() {
    const n = String(S.netName || '').trim();
    if (!n) { toast('Type your name first'); const i = $('[data-net-name]'); if (i) i.focus(); return ''; }
    return n;
  }
  async function netCreate() {
    const name = netName(); if (!name) return;
    PLAY.net = { status: 'joining' }; renderPlay();
    try {
      const net = await netOpen();
      const seats = PLAY.setup.map((s, i) => (i === 0 ? 'human' : 'empty'));
      const r = await net.createRoom({ name, seats, options: { opts: { kraken: S.kraken, whale: S.whale, loot: S.loot }, scoring: S.scoring, cannonball: S.cannonball,
        abilities: S.abilities, schedule: S.schedule, ghost: S.ghost, levels: PLAY.setup.map(s => s.level || null) } });
      if (!r.ok) netReset();
    } catch (e) { toast("Couldn't reach the online service"); netReset(); }
  }
  async function netJoin() {
    const name = netName(); if (!name) return;
    const code = String(($('[data-net-code]') || {}).value || '').trim().toUpperCase();
    PLAY.netCode = code; // kept in the box if the join fails
    if (code.length !== 5) { toast('Room codes have 5 letters'); return; }
    PLAY.net = { status: 'joining' }; renderPlay();
    try {
      const net = await netOpen();
      const r = await net.joinRoom(code, name);
      if (!r.ok) netReset();
    } catch (e) { toast("Couldn't reach the online service"); netReset(); }
  }
  function netReset() {
    PLAY.net = null; PLAY.state = null; PLAY.netBusy = false; PLAY.gen++;
    if (tab === 'play') { renderPlay(); renderTop(); }
  }
  async function netLeave() {
    const net = NET;
    netReset();
    if (net) { try { await net.leave(); } catch (e) { /* gone already */ } }
  }
  async function netResume() {
    try {
      const net = await netOpen();
      PLAY.net = { status: 'joining' };
      if (!(await net.resume())) netReset();
    } catch (e) { netReset(); }
  }
  // ?netlocal=1: the same online screens driven by online.js's createLocal room
  // (no network). Used for scripted checks of the online code path.
  async function netLocalTest() {
    netMod = await import(new URL('js/online.js?v=3', document.baseURI).href);
    PLAY.net = { status: 'joining' };
    NET = netMod.createLocal({ game: window.SKGame.game, seats: ['human', 'computer', 'computer', 'computer'], names: ['Tim'],
      options: { schedule: S.schedule, opts: { kraken: S.kraken, whale: S.whale, loot: S.loot }, abilities: S.abilities, scoring: S.scoring, cannonball: S.cannonball }, botDelayMs: 300 });
    NET.on('change', onNetSnap);
    NET.start();
  }
  function onNetSnap(snap) {
    if (!PLAY.net) return; // left already
    if (snap.status === 'closed' || snap.status === 'left') { toast(snap.status === 'closed' ? 'The room was closed' : 'You left the room'); netReset(); return; }
    // Names must be unique in a room (a name is how a dropped player gets their
    // seat back): the later of two same-named players steps out again.
    if (snap.status === 'lobby' && snap.mySeat > 0 && !snap.isHost) {
      const nm = s => String((s && s.name) || '').trim().toLowerCase();
      const mine = nm(snap.seats[snap.mySeat]);
      if (mine && snap.seats.some((s, i) => i !== snap.mySeat && s.kind === 'human' && i < snap.mySeat && nm(s) === mine)) {
        toast('Someone in that room already uses that name. Pick another.');
        netLeave(); return;
      }
    }
    PLAY.net = snap; PLAY.netBusy = false;
    if ((snap.status === 'playing' || snap.status === 'finished') && snap.pub && snap.mine && snap.mySeat >= 0) {
      const prev = PLAY.state;
      const st = window.SKGame.merge(snap.pub, snap.mine, snap.mySeat);
      if (!PLAY.fxArmed) { PLAY.fxArmed = true; PLAY.fxPrev = prev; } // sounds come from the snapshot diff
      PLAY.me = snap.mySeat;
      PLAY.seats = st.players.map(p => (p.kind === 'ghost' ? { kind: 'ghost' } : p.kind === 'cpu' ? { kind: 'cpu', level: p.level } : { kind: 'net' }));
      PLAY.state = st;
      if (!prev) {
        PLAY.gen++; PLAY.log = []; PLAY.hint = null; PLAY.sel = null; PLAY.discard = [];
        PLAY.study = { bidLost: 0, playLost: 0, rBid: 0, rPlay: 0, round: st.round, last: '' };
        PLAY.shownRoundSheet = st.history.length;
        onRoundStart();
      } else if (st.seq !== prev.seq || st.round !== prev.round) {
        if (st.tricksDone !== prev.tricksDone || st.round !== prev.round || st.history.length !== prev.history.length) logTrick(prev, st);
        if (st.round !== prev.round) onRoundStart();
        PLAY.hint = null; PLAY.sel = null;
        if (st.phase !== 'ability') PLAY.discard = [];
      }
    }
    if (tab === 'play') renderTop();
    afterChange();
    if (AUTO && snap.myTurn && PLAY.state) {
      const st = PLAY.state;
      setTimeout(() => { if (PLAY.state === st) applyAction(AI.act(SK.view(st, PLAY.me), PLAY.me, 'medium')); }, 60);
    }
  }
  function lobbyHTML() {
    const n = PLAY.net || {};
    if (n.status !== 'lobby') return `<div class="lobby"><div class="muted">${n.status === 'joining' ? 'Joining…' : 'Connecting…'}</div><button class="btn" data-act="net-leave">Cancel</button></div>`;
    const seats = (n.seats || []).map((s, i) => {
      const mine = i === n.mySeat;
      const label = s.kind === 'human' ? esc(mine ? s.name + ' (you)' : s.name) + (s.isHost && !mine ? ' · host' : '') + (s.online ? '' : ' · away') : s.kind === 'computer' ? 'Computer' : '<span class="muted">Open seat</span>';
      const ctl = n.isHost && !mine ? `<div class="seg" style="width:170px"><button data-act="net-seat" data-i="${i}" data-k="empty" class="${s.kind !== 'computer' ? 'on' : ''}">${s.kind === 'human' ? 'Player' : 'Open'}</button><button data-act="net-seat" data-i="${i}" data-k="computer" class="${s.kind === 'computer' ? 'on' : ''}">Computer</button></div>` : '';
      return `<div class="seat"><span style="color:${PLAYER_COLORS[i % 8]}">●</span><span class="nm">${label}</span>${ctl}</div>`;
    }).join('');
    return `<div class="lobby">
      <div class="muted" style="font-size:13px">Room code</div>
      <div class="room-code">${esc(n.code || '')}</div>
      <div class="muted" style="font-size:13px;text-align:center">Friends open this site, tap Play and join with this code.</div>
      <div class="seat-list scroll" style="width:100%">${seats}</div>
      ${n.isHost ? '<div class="muted" style="font-size:12.5px">Open seats become computers when you start.</div>' : '<div class="muted" style="font-size:13px">Waiting for the host to start…</div>'}
      <div class="row" style="width:100%"><button class="btn grow" data-act="net-leave">Leave</button>${n.isHost ? '<button class="btn primary grow" data-act="net-start">Start</button>' : ''}</div>
    </div>`;
  }

  // ---- game flow
  function startGame() {
    const seats = PLAY.setup.map((s, i) => (s.kind === 'you' ? { kind: 'you' } : { kind: 'cpu', level: s.level }));
    const players = seats.map((s, i) => ({ name: s.kind === 'you' ? 'You' : CPU_NAMES[(i - 1) % 7], kind: s.kind === 'you' ? 'human' : 'cpu', level: s.level || null }));
    PLAY.state = SK.newGame({ players, opts: { kraken: S.kraken, whale: S.whale, loot: S.loot }, scoring: S.scoring, cannonball: S.cannonball,
      abilities: S.abilities, schedule: S.schedule, ghost: S.ghost, firstDealer: Math.floor(Math.random() * players.length) });
    PLAY.seats = PLAY.state.players.map((p, i) => (p.kind === 'ghost' ? { kind: 'ghost' } : seats[i]));
    PLAY.me = 0; PLAY.gen++; PLAY.log = []; PLAY.hint = null; PLAY.sel = null; PLAY.discard = [];
    PLAY.study = { bidLost: 0, playLost: 0, rBid: 0, rPlay: 0, round: 1, last: '' };
    PLAY.shownRoundSheet = 0;
    PLAY.fxArmed = true; PLAY.fxPrev = null; // the first deal
    onRoundStart();
    afterChange();
  }

  function onRoundStart() {
    const st = PLAY.state;
    PLAY.roundHands = { round: st.round, hands: st.hands.map(h => h.slice()) };
    if (PLAY.study) { PLAY.study.round = st.round; PLAY.study.rBid = 0; PLAY.study.rPlay = 0; PLAY.study.last = ''; }
  }

  function logTrick(prev, st) {
    const lt = st.lastTrick;
    if (!lt || (prev.lastTrick && prev.tricksDone === st.tricksDone && prev.round === st.round)) return;
    const nm = p => (p === PLAY.me ? 'You' : st.players[p].name);
    const cards = lt.plays.map(pl => `${esc(nm(pl.p))} ${esc(shortName(pl.id))}`).join(', ');
    const res = lt.winner == null ? (lt.how === 'kraken' ? 'Kraken: nobody' : 'Whale: discarded') : `<b>${esc(nm(lt.winner))}</b> wins${lt.bonus ? ' +' + lt.bonus : ''}`;
    if (!PLAY.log) PLAY.log = [];
    PLAY.log.push(`${res} · ${cards}`);
    if (PLAY.log.length > 60) PLAY.log.shift();
  }

  function applyAction(a) {
    if (PLAY.net) {
      // Online: the host's browser applies it; the new table arrives as a snapshot.
      if (PLAY.netBusy || !NET) return false;
      PLAY.netBusy = true;
      const body = Object.assign({}, a); delete body.seat;
      Promise.resolve(NET.act(body)).then(r => { if (!r.ok) { PLAY.netBusy = false; if (tab === 'play') renderPlay(); } });
      return true;
    }
    const prev = PLAY.state;
    let next;
    try { next = SK.apply(prev, a); } catch (e) { toast(e.message); return false; }
    if (!PLAY.fxArmed) { PLAY.fxArmed = true; PLAY.fxPrev = prev; }
    PLAY.state = next;
    if (next.tricksDone !== prev.tricksDone || next.round !== prev.round || next.history.length !== prev.history.length) logTrick(prev, next);
    if (next.round !== prev.round) onRoundStart();
    PLAY.hint = null; PLAY.sel = null;
    if (next.phase !== 'ability') PLAY.discard = [];
    return true;
  }

  function delay() {
    const st = PLAY.state;
    const fast = S.speed === 'fast';
    if (st.phase === 'play' && st.trick.length === 0 && st.lastTrick) return fast ? 700 : 1400; // let the finished trick be seen
    return fast ? 260 : 650;
  }

  function afterChange() {
    save();
    if (tab === 'play') renderPlay();
    const st = PLAY.state;
    if (PLAY.fxArmed) {
      PLAY.fxArmed = false;
      if (SFX && st) SFX.react(PLAY.fxPrev, st, PLAY.me);
      PLAY.fxPrev = null; PLAY.fxFrom = null;
    }
    if (!st) return;
    if ((st.phase === 'roundEnd' || st.phase === 'over' || (PLAY.net && st.history.length)) && PLAY.shownRoundSheet !== st.history.length && tab === 'play') {
      PLAY.shownRoundSheet = st.history.length;
      setTimeout(() => { if (PLAY.state === st && tab === 'play') resultsSheet(); }, 700);
    }
    schedule();
    prepareStudy();
  }

  // ?auto=1 in the URL: your seat is played by a medium computer and rounds
  // advance by themselves (used for scripted end-to-end checks).
  const AUTO = /[?&]auto=1/.test(location.search);
  function seatLevel(p) { return PLAY.seats[p].kind === 'cpu' ? PLAY.seats[p].level : 'medium'; }
  function cpuSeats(st) { return SK.whoActs(st).filter(p => PLAY.seats[p] && (PLAY.seats[p].kind === 'cpu' || (AUTO && p === PLAY.me))); }

  function schedule() {
    clearTimeout(PLAY.timer);
    const st = PLAY.state;
    if (!st || PLAY.net) return; // online computers run in the host's browser
    if (AUTO && st.phase === 'roundEnd') {
      PLAY.timer = setTimeout(() => { if (PLAY.state === st) { if (sheetOpen) closeSheet(); applyAction({ type: 'next' }); afterChange(); } }, 900);
      return;
    }
    const seats = cpuSeats(st);
    if (!seats.length) return;
    const gen = PLAY.gen;
    const wait = AUTO ? 20 : st.phase === 'bid' || st.phase === 'cannon' ? 350 : delay();
    PLAY.timer = setTimeout(() => {
      if (gen !== PLAY.gen || PLAY.state !== st) return;
      if (st.phase === 'bid' || st.phase === 'cannon') {
        let s = st;
        for (const p of seats) {
          const a = AI.act(SK.view(s, p), p, seatLevel(p));
          PLAY.state = s; applyAction(a); s = PLAY.state;
        }
      } else {
        const p = seats[0];
        const a = AI.act(SK.view(st, p), p, seatLevel(p));
        if (a) applyAction(a);
      }
      afterChange();
    }, wait);
  }

  // Study: evaluate my options in the background when it's my turn.
  function prepareStudy() {
    const st = PLAY.state;
    if (!st || !(S.study)) return;
    const me = PLAY.me, gen = PLAY.gen, seq = st.seq;
    if (st.phase === 'play' && st.turn === me && (!PLAY.evalCache || PLAY.evalCache.seq !== seq)) {
      setTimeout(() => {
        if (gen !== PLAY.gen || PLAY.state.seq !== seq) return;
        PLAY.evalCache = { seq, opts: AI.evaluatePlays(SK.view(st, me), me, 80) };
      }, 60);
    }
    if (st.phase === 'bid' && st.bids[me] == null && (!PLAY.bidCache || PLAY.bidCache.key !== st.round + ':' + st.seed)) {
      setTimeout(() => {
        if (gen !== PLAY.gen || PLAY.state.round !== st.round) return;
        PLAY.bidCache = { key: st.round + ':' + st.seed, acc: AI.bidStudy({ hand: st.hands[me], players: st.humans, before: AI.beforeCount(st, me), opts: st.opts, scoring: st.scoring, ghost: st.ghost >= 0, samples: 250 }) };
      }, 60);
    }
  }

  function studyAfterPlay(choice) {
    if (!S.study || !PLAY.study) return;
    const st = PLAY.state;
    let opts = PLAY.evalCache && PLAY.evalCache.seq === st.seq ? PLAY.evalCache.opts : null;
    if (!opts) opts = AI.evaluatePlays(SK.view(st, PLAY.me), PLAY.me, 60);
    if (opts.length < 2) { PLAY.study.last = ''; return; }
    const best = opts[0];
    const mine = opts.find(o => o.id === choice.id && (!o.as || o.as === choice.as)) || best;
    const lost = Math.max(0, best.ev - mine.ev);
    PLAY.study.playLost += lost; PLAY.study.rPlay += lost;
    const bn = shortName(best.id) + (best.as ? (best.as === 'esc' ? ' as escape' : ' as pirate') : '');
    PLAY.study.last = lost < 0.5 ? `Best play <b>✓</b> (${sgn(mine.ev)} avg)` : `Best was <b>${esc(bn)}</b> ${sgn(best.ev)} · yours ${sgn(mine.ev)} · <span class="neg">−${Math.round(lost)}</span>`;
  }
  function studyAfterBid(bid) {
    if (!S.study || !PLAY.study) return;
    const st = PLAY.state;
    let acc = PLAY.bidCache && PLAY.bidCache.key === st.round + ':' + st.seed ? PLAY.bidCache.acc : null;
    if (!acc) acc = AI.bidStudy({ hand: st.hands[PLAY.me], players: st.humans, before: AI.beforeCount(st, PLAY.me), opts: st.opts, scoring: st.scoring, ghost: st.ghost >= 0, samples: 150 });
    const best = acc.bids[acc.best], mine = acc.bids[bid];
    const lost = Math.max(0, best.avg - mine.avg);
    PLAY.study.bidLost += lost; PLAY.study.rBid += lost;
    PLAY.study.last = lost < 0.5 ? `Best bid <b>✓</b> (hits ${Math.round(mine.chance * 100)}%)` : `Best bid was <b>${best.bid}</b> ${sgn(best.avg)} · yours ${sgn(mine.avg)} · <span class="neg">−${Math.round(lost)}</span>`;
  }

  function hint() {
    const st = PLAY.state, me = PLAY.me;
    if (st.phase === 'bid') {
      const acc = AI.bidStudy({ hand: st.hands[me], players: st.humans, before: AI.beforeCount(st, me), opts: st.opts, scoring: st.scoring, ghost: st.ghost >= 0, samples: 400 });
      const b = acc.bids[acc.best];
      PLAY.hint = { bid: acc.best, bidText: `Bid ${acc.best}: hits ${Math.round(b.chance * 100)}%, avg ${sgn(b.avg)}` };
    } else if (st.phase === 'play') {
      const opts = AI.evaluatePlays(SK.view(st, me), me, 120);
      const ev = {}, t = {};
      const byId = {};
      for (const o of opts) if (byId[o.id] == null || o.ev > byId[o.id]) byId[o.id] = o.ev;
      const vals = Object.values(byId), lo = Math.min(...vals), hi = Math.max(...vals);
      for (const id in byId) { ev[id] = byId[id]; t[id] = hi > lo ? (byId[id] - lo) / (hi - lo) : 1; }
      PLAY.hint = { best: opts[0].id, bestAs: opts[0].as, ev, t };
    }
    renderPlay();
  }

  function playAct(act, d, el) {
    const st = PLAY.state, me = PLAY.me;
    switch (act) {
      case 'pl-level': PLAY.setup[+d.i].level = d.l; renderPlay(); return true;
      case 'pl-add': PLAY.setup.push({ kind: 'cpu', level: 'medium' }); renderPlay(); return true;
      case 'pl-del': PLAY.setup.splice(+d.i, 1); renderPlay(); return true;
      case 'pl-start': startGame(); return true;
      case 'pl-bid': studyAfterBid(+d.b); applyAction({ type: 'bid', seat: me, bid: +d.b }); afterChange(); return true;
      case 'pl-cannon': applyAction({ type: 'cannon', seat: me, on: d.on === '1' }); afterChange(); return true;
      case 'pl-card': {
        if (!(st.phase === 'play' && st.turn === me)) { if (st.phase === 'play' && SFX) SFX.illegal(el); return true; }
        const id = +el.dataset.id;
        if (SK.legalPlays(st, me).indexOf(id) < 0) { if (SFX) SFX.illegal(el); toast('Follow the suit that was led'); return true; }
        if (CARDS[id].k === 'tig') { PLAY.sel = id; renderPlay(); return true; }
        PLAY.fxFrom = el.getBoundingClientRect(); // the card flies from here to the table
        studyAfterPlay({ id }); applyAction({ type: 'play', seat: me, card: id }); afterChange(); return true;
      }
      case 'pl-tig': { const id = PLAY.sel; studyAfterPlay({ id, as: d.as });
        const src = document.querySelector(`#v-play .hand [data-id="${id}"]`); if (src) PLAY.fxFrom = src.getBoundingClientRect(); applyAction({ type: 'play', seat: me, card: id, as: d.as }); afterChange(); return true; }
      case 'pl-unsel': PLAY.sel = null; renderPlay(); return true;
      case 'pl-hint': hint(); return true;
      case 'pl-ab': {
        const body = { type: 'ability', seat: me };
        if (d.k !== 'ok') body[d.k] = +d.v;
        applyAction(body); afterChange(); return true;
      }
      case 'pl-discard': {
        const id = +el.dataset.id, i = PLAY.discard.indexOf(id);
        if (i >= 0) PLAY.discard.splice(i, 1); else if (PLAY.discard.length < st.pending.drawn.length) PLAY.discard.push(id);
        renderPlay(); return true;
      }
      case 'pl-ab-discard': applyAction({ type: 'ability', seat: me, discard: PLAY.discard.slice() }); afterChange(); return true;
      case 'pl-next': if (sheetOpen) closeSheet(); if (PLAY.state.phase === 'roundEnd') { applyAction({ type: 'next' }); afterChange(); } return true;
      case 'pl-results': resultsSheet(); return true;
      case 'net-create': netCreate(); return true;
      case 'net-join': netJoin(); return true;
      case 'net-leave': if (sheetOpen) closeSheet(); netLeave(); return true;
      case 'net-start': if (NET) NET.start(); return true;
      case 'net-seat': {
        const cur = PLAY.net && PLAY.net.seats && PLAY.net.seats[+d.i];
        if (NET && cur && !(cur.kind === d.k || (cur.kind === 'human' && d.k === 'empty'))) NET.setSeat(+d.i, d.k);
        return true;
      }
      case 'pl-again': if (sheetOpen) closeSheet(); if (PLAY.net) { netLeave(); return true; } PLAY.gen++; clearTimeout(PLAY.timer); PLAY.state = null; save(); renderPlay(); return true;
      case 'pl-quit': {
        openSheet(`<h3>Leave this game?</h3><p class="muted" style="margin:0">${PLAY.net ? 'A computer takes your seat.' : 'The game is thrown away.'}</p><div class="acts"><button class="btn" data-act="close-sheet">Keep playing</button><button class="btn primary" data-act="pl-again">Leave</button></div>`);
        return true;
      }
    }
    return false;
  }

  // ============================================================ SETTINGS
  function renderSettings() {
    const v = $('#v-settings');
    const sw = (k, label, help, disabled) => `<div class="set-row"><div class="t">${label} ${help ? q(help) : ''}</div><label class="switch"><input type="checkbox" data-set="${k}" ${S[k] ? 'checked' : ''} ${disabled ? 'disabled' : ''} aria-label="${esc(label)}"><span></span></label></div>`;
    const sched = Object.keys(SK.SCHEDULES).map(k => `<option value="${k}" ${S.schedule === k ? 'selected' : ''}>${esc(SK.SCHEDULES[k].name)} (${SK.SCHEDULES[k].sizes.join(',').replace(/^(.{0,20}).*$/, (m, a) => a.length < m.length ? a + '…' : a)})</option>`).join('');
    v.innerHTML = `<div class="scroll" style="flex:1"><div class="set">
      <div class="set-group"><h3>Rules for new games</h3>
        <div class="set-row"><div class="t">Scoring ${q('scoring')}</div><div class="seg" style="width:180px"><button data-act="set-scoring" data-v="sk" class="${S.scoring === 'sk' ? 'on' : ''}">Standard</button><button data-act="set-scoring" data-v="rascal" class="${S.scoring === 'rascal' ? 'on' : ''}">Rascal</button></div></div>
        ${S.scoring === 'rascal' ? sw('cannonball', 'Cannonball', 'cannonball') : ''}
        <div class="set-row"><div class="t">Game length ${q('schedule')}</div><select data-set-sel="schedule" aria-label="Game length" style="max-width:190px">${sched}</select></div>
        ${sw('abilities', 'Pirate powers', 'abilities')}
        ${sw('kraken', 'Kraken', 'kraken')}
        ${sw('whale', 'White Whale', 'whale')}
        ${sw('loot', 'Loot', 'loot')}
        ${sw('ghost', '2 players: ghost hand', 'ghost')}
      </div>
      <div class="set-group"><h3>Help while playing</h3>
        ${sw('odds', 'Odds on cards', 'odds')}
        ${sw('study', 'Study mode', 'study')}
        <div class="set-row"><div class="t">Computer speed</div><div class="seg" style="width:160px"><button data-act="set-speed" data-v="normal" class="${S.speed === 'normal' ? 'on' : ''}">Normal</button><button data-act="set-speed" data-v="fast" class="${S.speed === 'fast' ? 'on' : ''}">Fast</button></div></div>
        ${PLAY.state ? `<div class="set-row"><div class="t">Current game</div><button class="btn sm" data-act="pl-quit">Leave game</button></div>` : ''}
      </div>
      ${FXL ? '<div class="set-group"><h3>Sound &amp; effects</h3><div id="fxSet"></div></div>' : ''}
      <div class="set-group"><h3>How strong are the computers? ${q('strength')}</h3><div style="padding:4px 14px 12px">${strengthNote()}</div></div>
      <div class="set-group"><details class="rules"><summary>How Skull King works ›</summary><div class="rules-body">${RULES_HTML}</div></details></div>
      <div class="set-group"><div class="set-row"><div class="t"><a href="../">More board &amp; card games</a></div><span class="muted" style="font-size:12px">v${VERSION}</span></div></div>
    </div></div>`;
    if (FXL && $('#fxSet')) FXL.renderSettings($('#fxSet'));
  }

  const RULES_HTML = `
    <p>Ten rounds; in round N everyone gets N cards. Everyone bids at once how many tricks they will take, then you play the tricks.</p>
    <h4>Playing a trick</h4>
    <ul><li>Follow the suit that was led if you can. Special cards can always be played.</li>
    <li>Black is trump. Otherwise the highest card of the led suit wins.</li>
    <li>Pirates beat all numbers. The Skull King beats pirates. Mermaids beat the Skull King (and numbers) but lose to pirates. Among the same kind, the first played wins.</li>
    <li>Escapes lose. If everyone escapes, the first escape wins. The Tigress is a pirate or an escape, your choice.</li></ul>
    <h4>Scoring</h4>
    <ul><li>Bid 1+ and hit it: 20 per trick, plus bonuses. Miss: minus 10 for each trick off.</li>
    <li>Bid 0 and take none: 10 per card dealt. Take any: minus 10 per card dealt.</li>
    <li>Bonuses (only when your bid is hit): each colour 14 +10, black 14 +20, mermaid taken by a pirate +20, pirate taken by the Skull King +30, Skull King taken by a mermaid +40.</li></ul>`;

  function settingsAct(act, d) {
    switch (act) {
      case 'set-scoring': S.scoring = d.v; renderSettings(); save(); return true;
      case 'set-speed': S.speed = d.v; renderSettings(); save(); return true;
    }
    return false;
  }

  // ============================================================ TABS
  let tab = ['score', 'bid', 'play', 'settings'].indexOf(saved.tab) >= 0 ? saved.tab : 'score';
  function setTab(t, fromPop) {
    if (sheetOpen) closeSheet(fromPop);
    $('#pop').hidden = true;
    if (t !== tab && !fromPop) history.pushState({ tab: t }, '');
    tab = t;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + t));
    renderTop();
    render();
    save();
  }
  function render() {
    if (tab === 'score') renderScore();
    else if (tab === 'bid') renderBid();
    else if (tab === 'play') { renderPlay(); if (PLAY.state) { schedule(); prepareStudy(); } }
    else renderSettings();
  }
  function renderTop() {
    const t = $('#topActions');
    let h = '';
    if (tab === 'score' && SC) h = `${window.innerWidth < 900 ? '<button class="btn sm" data-act="sc-table">Table</button>' : ''}<button class="btn sm ghost" data-act="sc-new">New</button>`;
    if (tab === 'play' && PLAY.net && PLAY.net.code && PLAY.state) h = `<span class="muted" style="font-size:13px">Room <b style="color:var(--text);letter-spacing:.06em">${esc(PLAY.net.code)}</b></span>`;
    if (tab === 'play' && PLAY.state) h += `<button class="btn sm ghost" data-act="pl-quit">Leave</button>`;
    t.innerHTML = h;
  }

  // ============================================================ EVENTS
  document.addEventListener('click', e => {
    const help = e.target.closest('[data-help]');
    if (help) { e.stopPropagation(); showPop(help); return; }
    $('#pop').hidden = true;
    const tb = e.target.closest('.tabs button');
    if (tb) { setTab(tb.dataset.tab); return; }
    if (e.target.id === 'sheetBack') { closeSheet(); return; }
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, d = el.dataset;
    if (el.disabled) return;
    if (act === 'close-sheet') { closeSheet(); return; }
    if (act === 'undo-toast') { if (toastUndo) toastUndo(); $('#toast').hidden = true; return; }
    if (scoreAct(act, d) || bidAct(act, d) || playAct(act, d, el) || settingsAct(act, d)) { renderTop(); }
  });
  document.addEventListener('input', e => {
    const n = e.target.dataset.name;
    if (n != null) { scSetupNames[+n] = e.target.value; }
    if (e.target.hasAttribute('data-net-name')) { S.netName = e.target.value.slice(0, 20); save(); }
    if (e.target.hasAttribute('data-net-code')) e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });
  document.addEventListener('change', e => {
    const k = e.target.dataset.set;
    if (k) { S[k] = e.target.checked; save(); resetStudy(); oddsCache = {}; renderSettings(); return; }
    const sk = e.target.dataset.setSel;
    if (sk) { S[sk] = e.target.value; save(); renderSettings(); }
  });
  window.addEventListener('popstate', e => {
    if (sheetOpen) { closeSheet(true); return; }
    const t = e.state && e.state.tab;
    if (t && t !== tab) setTab(t, true);
  });
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if ((lastW >= 900) !== (window.innerWidth >= 900)) { renderTop(); render(); }
    lastW = window.innerWidth;
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

  // ============================================================ BOOT
  if (Art) $('#brandMark').innerHTML = Art.kindIcon ? Art.kindIcon('sk') : '';
  // A reload while a sheet was open leaves a stale sheet entry in history: step
  // off it so the next Back really goes back.
  if (history.state && history.state.sheet) history.back();
  else history.replaceState({ tab }, '');
  setTab(tab, true);
  // Back in an online room after a reload (only loads Firebase if a room was open).
  if (/[?&]netlocal=1/.test(location.search)) netLocalTest();
  else try { if (localStorage.getItem(NET_KEY) && window.SKGame) netResume(); } catch (e) { /* storage blocked */ }

  // for scripted checks
  window.App = { get play() { return PLAY; }, get score() { return SC; }, get adv() { return ADV; }, settings: S, setTab };
})();
