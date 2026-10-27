/* Skull King card art. Original SVG drawings (fan-made; no publisher art).
 * Plain script, no deps. Browser: window.SKArt. Node: module.exports.
 *   SKArt.face(id, opts?)  -> '<svg ...>' card face, viewBox 0 0 100 140
 *                             opts: { cls: 'class names', label: 'aria label' }
 *   SKArt.back(opts?)      -> card back svg
 *   SKArt.suitIcon(s)      -> 24x24 svg in the suit's own colours
 *   SKArt.kindIcon(k)      -> 24x24 svg, currentColor ('num','esc','pir','tig','sk','mer','kra','wha','loot')
 *   SKArt.SUIT_COLORS      -> card colours by suit (0 black/trump, 1 yellow, 2 purple, 3 green)
 *   SKArt.SUIT_INK         -> the same suits as colours that read on the dark site background
 * Card ids match js/engine.js: 0-55 numbers (suit = floor(id/14), rank = id%14+1),
 * 56-60 escape, 61-65 pirates, 66 tigress, 67 skull king, 68-69 mermaids,
 * 70 kraken, 71 white whale, 72-73 loot. No ids or gradients, so any number of
 * cards can share a page.
 */
(function (root) {
  'use strict';

  var SUIT_COLORS = ['#1c1f27', '#e2ad2b', '#8a5bc8', '#3a9d58'];
  var SUIT_INK = ['#e8eaf0', '#f0c040', '#b58cf0', '#5cc879'];
  var SUIT_NAMES = ['Black', 'Yellow', 'Purple', 'Green'];
  var PIRATES = ["Rosie D'Laney", 'Bendt the Bandit', 'Rascal of Roatan', 'Juanita Jade', 'Harry the Giant'];
  var FONT = 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
  var INK = '#2a2118';
  var PAPER = '#f4ecda';

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function info(id) {
    id = +id;
    if (id >= 0 && id < 56) return { k: 'num', s: Math.floor(id / 14), r: (id % 14) + 1 };
    if (id >= 56 && id <= 60) return { k: 'esc' };
    if (id >= 61 && id <= 65) return { k: 'pir', i: id - 61, name: PIRATES[id - 61] };
    if (id === 66) return { k: 'tig' };
    if (id === 67) return { k: 'sk' };
    if (id === 68 || id === 69) return { k: 'mer' };
    if (id === 70) return { k: 'kra' };
    if (id === 71) return { k: 'wha' };
    if (id === 72 || id === 73) return { k: 'loot' };
    return null;
  }

  var NAMES = { esc: 'Escape', tig: 'Tigress', sk: 'Skull King', mer: 'Mermaid', kra: 'Kraken', wha: 'White Whale', loot: 'Loot' };
  function cardName(c) {
    if (c.k === 'num') return SUIT_NAMES[c.s] + ' ' + c.r;
    if (c.k === 'pir') return c.name;
    return NAMES[c.k];
  }

  function svg(vb, body, label, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '"' +
      (cls ? ' class="' + esc(cls) + '"' : '') +
      (label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true"') + '>' + body + '</svg>';
  }

  // ------------------------------------------------------------ suit emblems
  // Drawn in a 48x48 box. f = main fill, k = outline ink, l = light detail.
  function flag(f, k, l) {
    return '<path d="M7 4v41" stroke="' + k + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M8.5 6c6-3 12 2 18 0s10-3 16-1v24c-6-2-10 1-16 2s-12-3-18 0z" fill="' + f + '" stroke="' + k + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M17 20l17 7M34 20l-17 7" stroke="' + l + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="25.5" cy="14.5" r="6" fill="' + l + '"/><rect x="22" y="17" width="7" height="5.5" rx="1.5" fill="' + l + '"/>' +
      '<circle cx="23.3" cy="14.6" r="1.7" fill="' + f + '"/><circle cx="27.7" cy="14.6" r="1.7" fill="' + f + '"/>' +
      '<path d="M24 20.5v2M27 20.5v2" stroke="' + f + '" stroke-width="1"/>';
  }
  function chest(f, k) {
    return '<path d="M6 21v-5a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v5z" fill="' + f + '" stroke="' + k + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<rect x="6" y="21" width="36" height="20" rx="2" fill="' + f + '" stroke="' + k + '" stroke-width="2"/>' +
      '<path d="M14 8.6V41M34 8.6V41" stroke="' + k + '" stroke-width="2.2"/>' +
      '<path d="M6 21h36" stroke="' + k + '" stroke-width="2.4"/>' +
      '<rect x="20.5" y="17.5" width="7" height="9" rx="1.5" fill="' + k + '"/><circle cx="24" cy="21.5" r="1.4" fill="' + f + '"/>';
  }
  function map(f, k) {
    return '<path d="M10 9h28v30H10z" fill="' + f + '" stroke="' + k + '" stroke-width="2"/>' +
      '<rect x="4" y="7" width="8" height="34" rx="4" fill="' + f + '" stroke="' + k + '" stroke-width="2"/>' +
      '<rect x="36" y="7" width="8" height="34" rx="4" fill="' + f + '" stroke="' + k + '" stroke-width="2"/>' +
      '<path d="M15 34c4-7 8 1 11-5s3-9 6-11" fill="none" stroke="' + k + '" stroke-width="1.8" stroke-dasharray="2.6 2.2"/>' +
      '<path d="M29 12l6 6M35 12l-6 6" stroke="' + k + '" stroke-width="2.6" stroke-linecap="round"/>';
  }
  function parrot(f, k) {
    return '<path d="M20 36l-5 10 6-2 4 4 2-11z" fill="' + f + '" stroke="' + k + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M16 17c-6 8-5 18 4 21 9 3 15-4 13-14-1-6-5-10-9-11z" fill="' + f + '" stroke="' + k + '" stroke-width="1.8"/>' +
      '<circle cx="23" cy="14" r="9" fill="' + f + '" stroke="' + k + '" stroke-width="1.8"/>' +
      '<path d="M23 22c9 1 12 9 8 15-3-5-6-9-8-15z" fill="' + k + '" opacity=".28"/>' +
      '<path d="M15.5 10c-6-1-9 5-6 10 1-3 3-4 6-4z" fill="#f2c14e" stroke="' + k + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<circle cx="22" cy="11.5" r="3" fill="#fff" stroke="' + k + '" stroke-width="1"/><circle cx="21.4" cy="11.6" r="1.4" fill="' + k + '"/>' +
      '<path d="M12 39h26" stroke="' + k + '" stroke-width="2.4" stroke-linecap="round"/>';
  }
  function emblem(s, f, k, l) {
    if (s === 0) return flag(f, k, l);
    if (s === 1) return chest(f, k);
    if (s === 2) return map(f, k);
    return parrot(f, k);
  }

  // ------------------------------------------------------------ card frame
  function base(bg, edge, frame) {
    return '<rect x="1" y="1" width="98" height="138" rx="8" fill="' + bg + '" stroke="' + edge + '" stroke-width="2"/>' +
      '<rect x="5.5" y="5.5" width="89" height="129" rx="5" fill="none" stroke="' + frame + '" stroke-width="1.4"/>';
  }
  // Corner index: a filled tab, top-left and rotated bottom-right.
  function corners(label, tab, txt) {
    label = String(label);
    var fs = label.length === 1 ? 29 : 23;
    var fit = label.length > 1 ? ' textLength="24" lengthAdjust="spacingAndGlyphs"' : '';
    var g = '<path d="M3 11a8 8 0 0 1 8-8h21v28a6 6 0 0 1-6 6H3z" fill="' + tab + '"/>' +
      '<text x="17.5" y="' + (label.length === 1 ? 31 : 29) + '" text-anchor="middle" font-family="' + FONT + '" font-weight="800" font-size="' + fs + '" fill="' + txt + '"' + fit + '>' + esc(label) + '</text>';
    return g + '<g transform="rotate(180 50 70)">' + g + '</g>';
  }
  function ribbon(text, fill, txt) {
    return '<rect x="12" y="91" width="76" height="11" rx="2" fill="' + fill + '"/>' +
      '<text x="50" y="99.2" text-anchor="middle" font-family="' + FONT + '" font-weight="700" font-size="7.6" fill="' + txt + '"' +
      (text.length > 13 ? ' textLength="70" lengthAdjust="spacingAndGlyphs"' : '') + '>' + esc(text) + '</text>';
  }

  // ------------------------------------------------------------ number cards
  // Suit-coloured card, a light texture of the suit's world, and the emblem large in the middle.
  // Corner tabs are paper with the suit's dark ink so the number stays easy to read at 40 px.
  // deep = dark suit ink, fill = the emblem's own colour, glow = the medallion behind it.
  var NUM_ART = [
    { bg: '#1a1d25', deep: '#0b0c10', frame: '#b9a66e', fill: '#0b0c10', glow: '#2c313e', ink: '#ece6d6', tab: '#ece6d6', tabInk: '#14161c' },
    { bg: '#e2ad2b', deep: '#8a5a00', frame: '#fbe7a6', fill: '#a9652c', glow: '#f3cf6a', ink: INK, tab: PAPER, tabInk: '#8a5a00' },
    { bg: '#8a5bc8', deep: '#5b3592', frame: '#d9c6f3', fill: '#f1e4c4', glow: '#a47ddb', ink: INK, tab: PAPER, tabInk: '#5b3592' },
    { bg: '#3a9d58', deep: '#1f6a3a', frame: '#bfe6c9', fill: '#d8452f', glow: '#5cb876', ink: INK, tab: PAPER, tabInk: '#1f6a3a' },
  ];
  function texture(s, k) {
    var g = '<g fill="none" stroke="' + k + '" stroke-width="1.3" opacity=".22">';
    if (s === 1) { // scattered doubloons
      [[22, 50], [80, 46], [16, 98], [84, 96], [30, 118], [72, 120], [50, 24], [70, 26]].forEach(function (p) {
        g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.2"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="2" stroke-width=".9"/>';
      });
    } else if (s === 2) { // a chart's grid and a compass rose
      for (var x = 20; x <= 80; x += 15) g += '<path d="M' + x + ' 8v124" stroke-dasharray="2 3"/>';
      for (var y = 25; y <= 125; y += 20) g += '<path d="M8 ' + y + 'h84" stroke-dasharray="2 3"/>';
      g += '<path d="M78 112l3-9 3 9-3 9zM70 112l11-3 11 3-11 3z" fill="' + k + '" stroke="none"/>';
    } else { // the sea (green: jungle leaves above it; black: storm waves)
      for (var w = 0; w < 4; w++) {
        var yy = 104 + w * 8;
        g += '<path d="M8 ' + yy + 'q5 -4 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0"/>';
      }
      if (s === 3) g += '<path d="M10 22c10-8 22-6 28 2-10 2-20 2-28-2zM90 30c-10-8-22-6-28 2 10 2 20 2 28-2zM14 44c8-6 16-4 20 2-8 1-14 1-20-2z" fill="' + k + '" stroke="none"/>';
      else g += '<path d="M14 24l-4 8h5l-3 8M86 28l-4 8h5l-3 8" stroke-width="1.6"/>';
    }
    return g + '</g>';
  }
  function numFace(c) {
    var a = NUM_ART[c.s];
    var light = c.s === 0 ? a.ink : '#fff';
    return '<rect x="1" y="1" width="98" height="138" rx="8" fill="' + a.bg + '" stroke="' + a.deep + '" stroke-width="2"/>' +
      texture(c.s, c.s === 0 ? a.frame : a.deep) +
      '<rect x="5.5" y="5.5" width="89" height="129" rx="5" fill="none" stroke="' + a.frame + '" stroke-width="1.4" opacity=".8"/>' +
      '<circle cx="50" cy="70" r="34" fill="' + a.glow + '"/>' +
      '<circle cx="50" cy="70" r="34" fill="none" stroke="' + a.deep + '" stroke-width="2" opacity=".55"/>' +
      '<circle cx="50" cy="70" r="30.5" fill="none" stroke="' + a.frame + '" stroke-width="1" stroke-dasharray="1.5 2.5"/>' +
      '<g transform="translate(13 33) scale(1.54)">' + (c.s === 0 ? flag(a.fill, a.ink, light) : emblem(c.s, a.fill, a.ink, light)) + '</g>' +
      corners(c.r, a.tab, a.tabInk);
  }

  // ------------------------------------------------------------ specials
  function whiteFlag(x, y, sc) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">' +
      '<path d="M7 3v42" stroke="#6b5a45" stroke-width="3" stroke-linecap="round"/><circle cx="7" cy="3" r="2.4" fill="#c9a23a"/>' +
      '<path d="M8.5 6c6-3 12 2 18 0s10-3 16-1v24c-6-2-10 1-16 2s-12-3-18 0z" fill="#fff" stroke="#7d8b99" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M14 12c5-2 9 1 14 0M14 19c5-2 9 1 14 0" stroke="#c8d2dc" stroke-width="1.4" fill="none"/></g>';
  }
  function escFace() {
    return base('#e3eaf0', '#5b7790', '#9fb2c3') +
      '<circle cx="50" cy="64" r="27" fill="#c9d6e2"/>' + whiteFlag(22, 38, 1.15) +
      ribbon('Escape', '#5b7790', '#fff') + corners('E', '#5b7790', '#fff');
  }

  // Pirate bust parts, card coords (head centre ~50,58).
  function bust(coat, skin, wide) {
    var w = wide ? 14 : 22;
    return '<path d="M' + w + ' 92c2-14 14-20 36-20s34 6 36 20z" fill="' + coat + '"/>' +
      '<path d="M44 72l6 10 6-10z" fill="#f3eee2"/>' +
      '<rect x="45" y="66" width="10" height="8" fill="' + skin + '"/>';
  }
  function eyes(y) { y = y || 58; return '<circle cx="45" cy="' + y + '" r="1.7" fill="#1a1410"/><circle cx="55" cy="' + y + '" r="1.7" fill="#1a1410"/>'; }
  function head(skin, r) { return '<circle cx="50" cy="58" r="' + (r || 13) + '" fill="' + skin + '"/>'; }

  var PORTRAITS = [
    function rosie() { // red bandana, long auburn hair, gold hoop
      var sk = '#eab993';
      return '<path d="M35 58c0-16 8-21 15-21s15 5 15 21v24h-30z" fill="#9c3b22"/>' + bust('#6e2430', sk) + head(sk) +
        '<path d="M36.5 55c0-11 6-15 13.5-15s13.5 4 13.5 15c-5-5-9-6-13.5-6s-8.5 1-13.5 6z" fill="#c8312b"/>' +
        '<path d="M62 50l9-2-3 6 4 4-9-3z" fill="#c8312b"/>' +
        '<circle cx="48" cy="44" r="1.3" fill="#fff"/><circle cx="54" cy="45" r="1.3" fill="#fff"/>' + eyes() +
        '<path d="M46 64q4 3 8 0" stroke="#8c3a2c" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<circle cx="37.5" cy="62" r="2.6" fill="none" stroke="#d9a520" stroke-width="1.4"/>';
    },
    function bendt() { // tricorn, eye patch, dark stubble
      var sk = '#c98d5e';
      return bust('#24324d', sk) + head(sk) +
        '<path d="M38 62c2 9 7 11 12 11s10-2 12-11c-3 3-7 4-12 4s-9-1-12-4z" fill="#3b2a20"/>' +
        '<path d="M26 50c8-4 16-14 24-14s16 10 24 14c-8 2-16-2-24-2s-16 4-24 2z" fill="#1d1d22"/>' +
        '<path d="M28 50c8 1 15-3 22-3s14 4 22 3" stroke="#d4a52a" stroke-width="1.4" fill="none"/>' +
        '<path d="M37 52l26 9" stroke="#1d1d22" stroke-width="1.4"/><ellipse cx="55" cy="58" rx="4.4" ry="3.6" fill="#1d1d22"/>' +
        '<circle cx="45" cy="58" r="1.7" fill="#1a1410"/>' +
        '<path d="M45 66h10" stroke="#1a1410" stroke-width="1.6" stroke-linecap="round"/>';
    },
    function rascal() { // wide hat with feather, curled moustache, grin
      var sk = '#f0c7a0';
      return bust('#2f6b44', sk) + head(sk) +
        '<path d="M22 49c6 2 18 2 28 2s22 0 28-2c-2-5-8-6-13-6-2-6-8-9-15-9s-13 3-15 9c-5 0-11 1-13 6z" fill="#5a3a22"/>' +
        '<path d="M36 43c10 2 18 2 28 0" stroke="#c8312b" stroke-width="2.2"/>' +
        '<path d="M62 42c6-10 14-12 20-10-4 2-10 6-14 12z" fill="#e2502f"/>' + eyes(57) +
        '<path d="M42 65c3-3 6-3 8-1 2-2 5-2 8 1-3 0-5 1-8 1s-5-1-8-1z" fill="#3b2418"/>' +
        '<path d="M46 67.5q4 3 8 0" stroke="#7a2e22" stroke-width="1.4" fill="#fff"/>';
    },
    function juanita() { // green head scarf, dark curls, jade earrings
      var sk = '#a86b45';
      var curls = '';
      [[36, 52], [35, 60], [37, 68], [64, 52], [65, 60], [63, 68], [40, 74], [60, 74]].forEach(function (p) {
        curls += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#241812"/>';
      });
      return curls + bust('#5b3a7a', sk) + head(sk, 12.5) +
        '<path d="M37 54c0-12 6-16 13-16s13 4 13 16c-4-6-8-8-13-8s-9 2-13 8z" fill="#2f8a5c"/>' +
        '<path d="M44 40l-4-4 1 7z" fill="#2f8a5c"/><path d="M56 40l4-4-1 7z" fill="#2f8a5c"/>' + eyes() +
        '<path d="M46 64q4 3 8 0" stroke="#5c2a1c" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<path d="M38 62l-2 4 2 4 2-4z" fill="#3fc68a"/><path d="M62 62l-2 4 2 4 2-4z" fill="#3fc68a"/>';
    },
    function harry() { // giant: bald, huge beard, broad shoulders
      var sk = '#d9a074';
      return bust('#5a4630', sk, true) + '<circle cx="50" cy="56" r="16" fill="' + sk + '"/>' +
        '<path d="M34 58c-2 18 8 32 16 32s18-14 16-32c-3 5-9 8-16 8s-13-3-16-8z" fill="#7a4a24"/>' +
        '<path d="M42 64c3-2 13-2 16 0-3 2-13 2-16 0z" fill="#5a3418"/>' +
        '<path d="M41 52l7 1M52 53l7-1" stroke="#5a3418" stroke-width="2.4" stroke-linecap="round"/>' + eyes(56) +
        '<ellipse cx="44" cy="45" rx="4" ry="2" fill="#fff" opacity=".35"/>' +
        '<circle cx="33.5" cy="60" r="2.4" fill="none" stroke="#d9a520" stroke-width="1.4"/>';
    },
  ];
  function pirFace(c) {
    return base('#f3e3c8', '#9e2b2b', '#c9876a') +
      '<rect x="12" y="30" width="76" height="63" rx="4" fill="#e6c9a0"/>' +
      '<path d="M12 40l76-8M12 56l76-8M12 72l76-8M12 88l76-8" stroke="#dcb98a" stroke-width="2"/>' +
      PORTRAITS[c.i]() + ribbon(c.name, '#9e2b2b', '#fff') + corners('P', '#9e2b2b', '#fff');
  }

  function cutlass(x, y, sc, col) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">' +
      '<path d="M6 40C14 26 26 12 40 4c-4 12-14 26-28 38z" fill="' + (col || '#dfe5ea') + '" stroke="#55606b" stroke-width="1.4"/>' +
      '<path d="M4 34l12 10" stroke="#c9a23a" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M8 40l-5 5" stroke="#5a3a22" stroke-width="3.4" stroke-linecap="round"/></g>';
  }
  function tigFace() {
    var sk = '#e9b48a';
    return '<rect x="1" y="1" width="98" height="138" rx="8" fill="#e3eaf0"/>' +
      '<path d="M9 1h41v138H9a8 8 0 0 1-8-8V9a8 8 0 0 1 8-8z" fill="#f3e3c8"/>' +
      '<rect x="1" y="1" width="98" height="138" rx="8" fill="none" stroke="#d9822b" stroke-width="2"/>' +
      '<rect x="5.5" y="5.5" width="89" height="129" rx="5" fill="none" stroke="#e0a865" stroke-width="1.4"/>' +
      '<path d="M50 5.5v129" stroke="#d9822b" stroke-width="1.2" stroke-dasharray="3 2"/>' +
      whiteFlag(68, 9, 0.48) + cutlass(9, 104, 0.5) +
      '<path d="M36 58c0-16 7-21 14-21s14 5 14 21v24h-28z" fill="#e0782a"/>' +
      '<path d="M37 62l5 1M36 70l6 0M63 62l-5 1M64 70l-6 0" stroke="#2a1d10" stroke-width="1.8" stroke-linecap="round"/>' +
      bust('#2b2b33', sk) + head(sk) +
      '<path d="M36.5 55c0-11 6-15 13.5-15s13.5 4 13.5 15c-5-5-9-6-13.5-6s-8.5 1-13.5 6z" fill="#f08c2e"/>' +
      '<path d="M41 44l3 5M48 41l1 6M55 42l-1 6M60 46l-3 4" stroke="#2a1d10" stroke-width="1.8" stroke-linecap="round"/>' +
      eyes() + '<path d="M46 64q4 3 8 0" stroke="#8c3a2c" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
      ribbon('Tigress', '#d9822b', '#fff') + corners('T', '#d9822b', '#fff');
  }

  function crownedSkull(x, y, sc, bone, dark, gold) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">' +
      '<path d="M8 18l5-14 8 9 7-11 7 11 8-9 5 14z" fill="' + gold + '" stroke="' + dark + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<circle cx="28" cy="7" r="2.2" fill="#c8312b"/><circle cx="13" cy="9" r="1.6" fill="#3a8fd9"/><circle cx="43" cy="9" r="1.6" fill="#3a8fd9"/>' +
      '<rect x="8" y="16" width="40" height="5" rx="1" fill="' + gold + '" stroke="' + dark + '" stroke-width="1.2"/>' +
      '<path d="M10 21c-2 6-1 16 4 20v6c0 2 2 4 4 4h20c2 0 4-2 4-4v-6c5-4 6-14 4-20z" fill="' + bone + '"/>' +
      '<ellipse cx="20" cy="31" rx="5" ry="5.4" fill="' + dark + '"/><ellipse cx="36" cy="31" rx="5" ry="5.4" fill="' + dark + '"/>' +
      '<path d="M28 36l-3 5h6z" fill="' + dark + '"/>' +
      '<path d="M18 46h20M22 44v6M28 44v6M34 44v6" stroke="' + dark + '" stroke-width="1.4"/></g>';
  }
  function skFace() {
    return base('#4a121b', '#2a070c', '#d4a52a') +
      '<circle cx="50" cy="64" r="28" fill="#6b1a26"/>' +
      crownedSkull(22, 36, 1.0, '#f1e9d6', '#2a070c', '#e6b532') +
      ribbon('Skull King', '#d4a52a', '#2a070c') + corners('SK', '#e6b532', '#2a070c');
  }

  function merFace() {
    return base('#d7efeb', '#1f7f7a', '#7cc3bb') +
      '<circle cx="50" cy="62" r="28" fill="#aedcd5"/>' +
      '<path d="M40 40c-4 9-3 19-9 28 8 0 12-6 12-13h14c0 7 4 13 12 13-6-9-5-19-9-28z" fill="#e2725b"/>' +
      '<path d="M43 68h14c3 9 0 14-6 17-5 2-9 2-13 1l1-4c5 0 8-1 10-3 2-3 0-6-6-11z" fill="#2fb5a0" stroke="#1f7f7a" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M39 84l-12-6 3 8-4 7 13-5z" fill="#2fb5a0" stroke="#1f7f7a" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M46 72q3 2 6 0M48 77q3 2 6 0M45 82q3 1 5-1" stroke="#1f7f7a" stroke-width="1" fill="none"/>' +
      '<path d="M44 52c-1 6-1 11-1 17h14c0-6 0-11-1-17z" fill="#f0c7a0"/>' +
      '<path d="M44 54l-3 13M56 54l3 13" stroke="#f0c7a0" stroke-width="3.4" stroke-linecap="round"/>' +
      '<circle cx="47.2" cy="58" r="2.7" fill="#f4a29a" stroke="#c45a4a" stroke-width=".8"/><circle cx="52.8" cy="58" r="2.7" fill="#f4a29a" stroke="#c45a4a" stroke-width=".8"/>' +
      '<rect x="47" y="48" width="6" height="6" fill="#f0c7a0"/>' +
      '<circle cx="50" cy="43" r="9" fill="#f0c7a0"/>' +
      '<path d="M40 44c0-8 5-11 10-11s10 3 10 11c-4-4-6-5-10-5s-6 1-10 5z" fill="#e2725b"/>' +
      '<circle cx="46.5" cy="44" r="1.4" fill="#1a1410"/><circle cx="53.5" cy="44" r="1.4" fill="#1a1410"/>' +
      '<path d="M47.5 48q2.5 2 5 0" stroke="#a04a3a" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      ribbon('Mermaid', '#1f7f7a', '#fff') + corners('M', '#1f7f7a', '#fff');
  }

  function kraFace() {
    var c = '#c2456a', d = '#7a2340';
    var t = '';
    [['M40 62c-10 6-20 4-22 14s8 12 10 6', 5], ['M60 62c10 6 20 4 22 14s-8 12-10 6', 5],
     ['M43 66c-4 10-12 14-10 22s8 4 6 0', 4.5], ['M57 66c4 10 12 14 10 22s-8 4-6 0', 4.5],
     ['M48 68c-1 8-3 14 1 20', 4], ['M52 68c1 8 3 14-1 20', 4]].forEach(function (p) {
      t += '<path d="' + p[0] + '" fill="none" stroke="' + c + '" stroke-width="' + p[1] + '" stroke-linecap="round"/>';
    });
    return base('#1e1a33', '#0d0b18', '#5a4a8a') +
      '<path d="M8 104c8-4 14 4 22 0s14-4 22 0 14 4 22 0 14-4 18 0" stroke="#3a3366" stroke-width="2" fill="none"/>' + t +
      '<path d="M36 60c-2-14 4-24 14-24s16 10 14 24c-4 6-24 6-28 0z" fill="' + c + '" stroke="' + d + '" stroke-width="1.6"/>' +
      '<circle cx="44" cy="56" r="4.2" fill="#f6e27a"/><circle cx="56" cy="56" r="4.2" fill="#f6e27a"/>' +
      '<rect x="43" y="53" width="2" height="6" rx="1" fill="#1a1410"/><rect x="55" y="53" width="2" height="6" rx="1" fill="#1a1410"/>' +
      '<circle cx="46" cy="44" r="1.6" fill="' + d + '"/><circle cx="54" cy="42" r="1.2" fill="' + d + '"/><circle cx="50" cy="47" r="1" fill="' + d + '"/>' +
      ribbon('Kraken', c, '#fff') + corners('K', c, '#fff');
  }

  function whaFace() {
    return base('#12304d', '#081a2b', '#3d6a92') +
      '<circle cx="50" cy="64" r="28" fill="#1b4269"/>' +
      '<path d="M44 40c-2-6 2-10 0-14M44 40c-4-4-8-4-10-8M44 40c4-4 8-4 10-8" stroke="#bfe3ff" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M18 66c0-14 14-22 30-22 14 0 24 8 28 18 4-2 8-8 14-8-2 6-4 10-8 12 4 2 6 6 8 10-6 0-10-4-14-6-6 10-16 14-30 14-16 0-28-6-28-18z" fill="#f5f7fa" stroke="#9fb2c3" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M22 72c8 8 26 10 42 4" stroke="#c8d4df" stroke-width="1.4" fill="none"/>' +
      '<path d="M26 78l3-4 3 4 3-4 3 4 3-4 3 4" stroke="#9fb2c3" stroke-width="1.2" fill="none"/>' +
      '<circle cx="30" cy="62" r="2" fill="#12304d"/>' +
      '<path d="M44 74c4 6 10 6 12 2" stroke="#c8d4df" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M10 92c6-3 10 3 16 0s10-3 16 0 10 3 16 0 10-3 16 0 10 3 16 0" stroke="#3d6a92" stroke-width="1.6" fill="none"/>' +
      ribbon('White Whale', '#e8eef4', '#12304d') + corners('W', '#e8eef4', '#12304d');
  }

  function coin(x, y, r) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#f2c94c" stroke="#9a6b12" stroke-width="1.3"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.6) + '" fill="none" stroke="#c99521" stroke-width="1"/>';
  }
  function lootFace() {
    return base(PAPER, '#9a6b12', '#d4a52a') +
      '<circle cx="50" cy="64" r="28" fill="#f0dca8"/>' +
      '<path d="M38 50c-14 8-18 30-6 36 10 4 26 4 36 0 12-6 8-28-6-36z" fill="#b07a3a" stroke="#5e3a16" stroke-width="1.6"/>' +
      '<path d="M40 50c4 3 16 3 20 0l2-6c-6-4-18-4-24 0z" fill="#9a6530" stroke="#5e3a16" stroke-width="1.6"/>' +
      '<path d="M38 50c8 3 16 3 24 0" stroke="#e2ad2b" stroke-width="2.4"/>' +
      '<circle cx="50" cy="70" r="9" fill="#e2ad2b" stroke="#5e3a16" stroke-width="1.6"/>' +
      '<path d="M50 64l1.8 3.8 4.2.5-3.1 2.9.8 4.1-3.7-2-3.7 2 .8-4.1-3.1-2.9 4.2-.5z" fill="#fff3c4"/>' +
      coin(28, 86, 6) + coin(70, 84, 6.5) + coin(62, 90, 5) + coin(36, 91, 4.5) +
      ribbon('Loot', '#9a6b12', '#fff') + corners('L', '#c9921f', '#2a1d00');
  }

  var SPECIAL = { esc: escFace, pir: pirFace, tig: tigFace, sk: skFace, mer: merFace, kra: kraFace, wha: whaFace, loot: lootFace };

  function face(id, opts) {
    opts = opts || {};
    var c = info(id);
    if (!c) return back(opts);
    var body = c.k === 'num' ? numFace(c) : SPECIAL[c.k](c);
    return svg('0 0 100 140', body, opts.label || cardName(c), opts.cls);
  }

  function back(opts) {
    opts = opts || {};
    var lines = '';
    for (var i = -130; i < 100; i += 12) {
      lines += 'M' + (8 + i) + ' 8l124 124M' + (92 - i) + ' 8l-124 124';
    }
    var spokes = '';
    for (var a = 0; a < 8; a++) {
      var ang = a * Math.PI / 4, long = a % 2 === 0 ? 24 : 15;
      var x = 50 + Math.sin(ang) * long, y = 70 - Math.cos(ang) * long;
      var l = 50 + Math.sin(ang + 0.32) * 6, ly = 70 - Math.cos(ang + 0.32) * 6;
      var r = 50 + Math.sin(ang - 0.32) * 6, ry = 70 - Math.cos(ang - 0.32) * 6;
      spokes += '<path d="M' + l.toFixed(1) + ' ' + ly.toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) + 'L' + r.toFixed(1) + ' ' + ry.toFixed(1) + 'z" fill="' + (a % 2 ? '#8a6a24' : '#e6b532') + '"/>';
    }
    var body = '<rect x="1" y="1" width="98" height="138" rx="8" fill="#141826" stroke="#0a0c14" stroke-width="2"/>' +
      '<svg x="8" y="8" width="84" height="124" viewBox="8 8 84 124"><path d="' + lines + '" stroke="#1f2538" stroke-width="2.2"/></svg>' +
      '<rect x="5.5" y="5.5" width="89" height="129" rx="5" fill="none" stroke="#d4a52a" stroke-width="1.6"/>' +
      '<rect x="9" y="9" width="82" height="122" rx="3" fill="none" stroke="#d4a52a" stroke-width=".7" stroke-dasharray="2 2"/>' +
      '<circle cx="50" cy="70" r="30" fill="#141826" stroke="#d4a52a" stroke-width="1.6"/>' +
      '<circle cx="50" cy="70" r="26" fill="none" stroke="#8a6a24" stroke-width=".8"/>' + spokes +
      crownedSkull(39.5, 58, 0.375, '#f1e9d6', '#141826', '#e6b532');
    return svg('0 0 100 140', body, opts.label || 'Card back', opts.cls);
  }

  // ------------------------------------------------------------ small icons
  function suitIcon(s) {
    s = +s;
    var b = s === 0 ? flag('#2b2f3a', '#d8dbe3', '#f2f2f2') : emblem(s, SUIT_COLORS[s], '#1c1810', '#fff');
    return svg('0 0 24 24', '<g transform="scale(.5)">' + b + '</g>', SUIT_NAMES[s]);
  }
  var KIND_ICONS = {
    num: '<rect x="5" y="2.5" width="14" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 9h6M9 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    esc: '<path d="M5 2.5v19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 4c3-1.5 6 1 9 0s4-1 5-.5v10c-1-.5-2-.5-5 .5s-6-1.5-9 0z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    pir: '<path d="M5 3l12.5 12.5M19 3L6.5 15.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M14 18.5l5-5M5 13.5l5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M17.5 17.5l3 3M6.5 17.5l-3 3" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    tig: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/><path d="M15 8l2 1M15 12h3M15 16l2-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    sk: '<path d="M3 18L4.5 7l4.5 4.5L12 5l3 6.5L19.5 7 21 18z" fill="currentColor"/><rect x="3" y="18.5" width="18" height="2.5" rx="1" fill="currentColor"/>',
    mer: '<path d="M9 2.5c5 3 6 8 3 12.5" stroke="currentColor" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M12 14c-1.5 3.5-4.5 5.5-8.5 5.5 3 2 6.5 2 8.5.5 2 1.5 5.5 1.5 8.5-.5-4 0-7-2-8.5-5.5z" fill="currentColor"/>',
    kra: '<path d="M7 10a5 5 0 0 1 10 0c0 2-1 3-2 3H9c-1 0-2-1-2-3z" fill="currentColor"/><path d="M9 13c-1 4-4 4-5 7M12 13v8M15 13c1 4 4 4 5 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    wha: '<path d="M2 13c0-4 4-6 9-6 4 0 7 2 8 5 1-1 2-3 4-3-1 2-1 3-2 4 1 1 2 2 2 4-2 0-3-1-4-2-2 3-5 4-9 4-5 0-8-2-8-6z" fill="currentColor"/><path d="M10 6c0-2 1-3 0-4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    loot: '<path d="M8 7c-4 3-5 10-2 12.5 3 1.5 9 1.5 12 0 3-2.5 2-9.5-2-12.5z" fill="currentColor"/><path d="M8.5 6.5l1-3h5l1 3z" fill="currentColor"/>',
  };
  function kindIcon(k) {
    var b = KIND_ICONS[k] || KIND_ICONS.num;
    return svg('0 0 24 24', b, NAMES[k] || (k === 'pir' ? 'Pirate' : 'Number'));
  }

  var SKArt = { face: face, back: back, suitIcon: suitIcon, kindIcon: kindIcon, SUIT_COLORS: SUIT_COLORS, SUIT_INK: SUIT_INK, cardName: function (id) { var c = info(id); return c ? cardName(c) : '?'; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = SKArt;
  if (root) root.SKArt = SKArt;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
