/* skcoach.js: Skull King's part of the shared coach kit (js/coach.js, never edit that one here):
 * the rules sheet and the guided first game.
 *   SKCoach.SEED, SKCoach.DEALER   the guided game's deals (same cards every time: round 1 you hold a pirate)
 *   SKCoach.steps(ctx)             ctx: { state() -> the game state or null, sheet() -> true while a sheet is open }
 *   SKCoach.RULES                  COACH.rules() options
 * Plain script: window.SKCoach in the browser, module.exports in node. */
(function (root) {
  'use strict';
  const SEED = 17, DEALER = 3, ID = 'skull-king-first';
  const ME = 0;

  function steps(ctx) {
    const st = () => ctx.state();
    const phase = () => { const s = st(); return s ? s.phase : ''; };
    const round = () => { const s = st(); return s ? s.round : 0; };
    const myBidIn = () => { const s = st(); return !!s && s.bids[ME] != null; };
    const myTurn = () => { const s = st(); return !!s && s.phase === 'play' && s.turn === ME; };
    return [
      { title: 'Your first game of Skull King', html: 'You against three Easy computers. Round 1 deals <b>1 card</b> each, round 2 deals 2, and so on up to 10. Each round you guess <b>exactly</b> how many tricks you will take. Get it right to score.' },
      { target: '.mine .hand', title: 'Your card', html: 'You hold a <b>pirate</b>. Pirates beat every number card. Only the Skull King or a Mermaid could stop it, and nobody has one this round (I checked).', when: () => phase() === 'bid' && round() === 1 && !myBidIn(), skipIf: () => myBidIn() || round() > 1 },
      { target: '.bidpad', title: 'Bid', html: 'Everyone bids at the same time: how many tricks will you take? Your pirate should win, so tap <b>1</b>.', when: () => phase() === 'bid' && round() === 1 && !myBidIn(), until: () => myBidIn(), skipIf: () => myBidIn() || round() > 1 },
      { target: ['.opps', '.trick .tcard'], title: 'Bids are shown', html: 'All bids turn up at once. Each player\'s bid is the wooden token in front of them; their won tricks pile up next to it.', when: () => round() === 1 && phase() !== 'bid', skipIf: () => round() > 1 },
      { target: '.mine .hand', title: 'Play it', html: 'When it is your turn, tap your card to play it. Players must follow the colour that was led if they can; special cards can always be played.', when: () => myTurn() && round() === 1, until: () => !myTurn() || round() > 1, skipIf: () => round() > 1 },
      { target: '.pad', title: 'Scoring', html: 'Hit a bid of 1 or more: <b>20 per trick</b>. Miss: <b>−10</b> for each trick you are off. Bid 0 and take none: <b>10 per card</b> dealt (lose that much if you take one). The score pad shows every round.', when: () => round() >= 2 || phase() === 'roundEnd' || phase() === 'over', next: true },
      { target: '[data-act="pl-hint"]', title: 'Stuck?', html: '<b>Hint</b> works out the best bid or card from thousands of simulated deals. <b>Undo</b> takes back your last move. Either one makes that game count as "with help" in My stats.', when: () => round() >= 2 && phase() === 'bid' && !myBidIn() },
      { title: 'You\'ve got it', html: 'Black cards are trump. The Skull King beats pirates, Mermaids beat the Skull King, pirates beat Mermaids. Play on to round 10. The full rules are in <b>Settings</b> → Rules.' },
    ];
  }

  const RULES = {
    title: 'How to play Skull King',
    sections: [
      { id: 'goal', short: 'Goal', title: 'Goal', html: '<p>Ten rounds. In round 1 everyone gets 1 card, in round 2 two cards, up to 10 cards in round 10. Each round you bid how many tricks you will take, then try to take exactly that many. Most points after the last round wins.</p><p class="tip">2 to 8 players. With 2 players a third "ghost" hand plays along (Settings).</p>' },
      { id: 'bid', short: 'Bid', title: 'Bidding', html: '<ul><li>Look at your cards, then everyone shows a bid at the same time: 0 up to the number of cards dealt.</li><li>Bids stay on the table all round, so everyone knows who needs tricks.</li></ul>' },
      { id: 'trick', short: 'Tricks', title: 'Playing a trick', html: '<ul><li>The player left of the dealer leads the first trick; whoever wins a trick leads the next.</li><li>Follow the colour that was led if you can. Special cards can always be played, even when you could follow.</li><li><b>Black is trump</b>: any black number beats every other colour.</li><li>Otherwise the highest card of the colour led wins.</li><li>If a special card leads, the next number played sets the colour.</li></ul>' },
      { id: 'special', short: 'Specials', title: 'Special cards', html: '<ul><li><b>Escape</b>: always loses. If everyone escapes, the first escape wins.</li><li><b>Pirate</b> (5): beats every number. Between pirates the first played wins.</li><li><b>Tigress</b>: you choose when you play it: a pirate or an escape.</li><li><b>Skull King</b>: beats pirates and numbers.</li><li><b>Mermaid</b> (2): beat numbers and the Skull King, but lose to pirates. If a pirate, the Skull King and a Mermaid meet, the Mermaid wins.</li></ul>' },
      { id: 'score', short: 'Score', title: 'Scoring', html: '<ul><li>Bid 1 or more and hit it exactly: <b>20 per trick</b> bid, plus bonuses.</li><li>Miss: <b>−10 for each trick</b> you are over or under.</li><li>Bid 0 and take none: <b>10 × cards dealt</b>. Take any: <b>−10 × cards dealt</b>.</li></ul><h4>Bonuses (only when you hit your bid)</h4><ul><li>Each colour 14 you take: +10. The black 14: +20.</li><li>A Mermaid taken by a pirate: +20 each. A pirate taken by the Skull King: +30 each. The Skull King taken by a Mermaid: +40.</li></ul>' },
      { id: 'options', short: 'Options', title: 'Options (Settings)', html: '<ul><li><b>Rascal scoring</b>: every bid is worth 10 per card dealt. Exact gets it all, one off gets half, more is nothing. <b>Cannonball</b>: bet on exact for 15 per card.</li><li><b>Pirate powers</b>: win with a named pirate to use its power (pick the leader, draw and discard, bet, peek at the undealt cards, change your bid).</li><li><b>Kraken</b>: nobody wins that trick. <b>White Whale</b>: specials count for nothing, highest number wins. <b>Loot</b>: an escape that teams you up with the trick winner for +20 each.</li><li><b>Game length</b>: the official shorter and longer schedules.</li></ul>' },
      { id: 'videos', short: 'Videos', title: 'Videos', html: '<p>Watch the game played (opens YouTube).</p><ul>' + [
        ['xlFHfCqY-5Y', 'How to play', "Grandpa Beck's Games, the publisher"],
        ['YkaFYJOAWbc', 'The rules in 4 minutes', 'Brimley Games'],
        ['GKCeKMEI1ts', 'The rules in 6 minutes', 'The Rules Girl, The Dice Tower'],
        ['OFhtYdmvroo', 'Full walkthrough with examples', 'GameRules Studio'],
        ['wqTr78rMvi8', 'Review: how it plays and the different editions', "Taylor's Trick-Taking Table"],
      ].map(v => `<li><a href="https://www.youtube.com/watch?v=${v[0]}" target="_blank" rel="noopener noreferrer"><b>${v[1]}</b></a><br><span style="opacity:.7;font-size:14px">${v[2]}</span></li>`).join('') + '</ul>' },
    ],
  };

  const api = { SEED, DEALER, ID, ME, steps, RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.SKCoach = api;
})(typeof window !== 'undefined' ? window : globalThis);
