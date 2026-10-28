// Rules sheet "Videos" section: 2-5 real YouTube links (checked by oEmbed when added),
// each opening in a new tab without giving the page access to the opener.
'use strict';
const assert = require('assert');
const SKC = require('../js/skcoach.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.log('FAIL', name, '\n  ', e.message); }
}

const vid = SKC.RULES.sections.find(s => s.id === 'videos');
test('rules sheet has a Videos section, last', () => {
  assert.ok(vid, 'no videos section');
  assert.strictEqual(SKC.RULES.sections[SKC.RULES.sections.length - 1], vid);
  assert.strictEqual(vid.short, 'Videos');
});
const links = vid ? (vid.html.match(/<a [^>]*>/g) || []) : [];
test('2 to 5 YouTube links', () => {
  assert.ok(links.length >= 2 && links.length <= 5, 'links: ' + links.length);
  for (const a of links) assert.ok(/href="https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}"/.test(a), a);
});
test('each link opens in a new tab with rel=noopener', () => {
  for (const a of links) {
    assert.ok(/target="_blank"/.test(a), a);
    assert.ok(/rel="noopener[^"]*"/.test(a), a);
  }
});
test('no duplicate videos', () => {
  const ids = links.map(a => a.match(/v=([\w-]{11})/)[1]);
  assert.strictEqual(new Set(ids).size, ids.length);
});

console.log(`learn: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
