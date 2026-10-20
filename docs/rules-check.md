# Skull King rules check (Grandpa Beck's, current edition)

Researched 2026-10-19. Primary source: the official English rulebook PDF linked from the publisher's how-to-play page (© 2012, 2021, 2024; PDF created Feb 2024, 20 pages), plus the publisher's FAQ, Rascal Scoring PDF and Expansion Pack rulebook. All rules below are paraphrased.

**Sources (short names used in the tables)**
- **RB24**: official rulebook, https://cdnm.heyzine.com/files/uploaded/46b5bd7166a9f579404e175e4990c9d415b4aac7.pdf (linked from https://www.grandpabecksgames.com/pages/skull-king, flipbook https://heyzine.com/flip-book/46b5bd7166.html)
- **FAQ**: publisher FAQ on https://www.grandpabecksgames.com/pages/skull-king
- **RASC**: official Rascal Scoring PDF, https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Rascal_Scoring.pdf
- **EXP**: official Expansion Pack rulebook (2025), https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Expansion_Rulebook_Web.pdf (page https://www.grandpabecksgames.com/pages/skull-king-expansion)
- **BGA**: Board Game Arena licensed implementation help, https://en.doc.boardgamearena.com/Gamehelpskullking
- **RP**: RulesPal copy of the 2021 rulebook, https://rulespal.com/skull-king/rulebook
- **BGF**: Board Game Family "The new Skull King" (2021), https://www.theboardgamefamily.com/2021/09/the-new-skull-king
- **UBG**: UltraBoardGames (older edition), https://ultraboardgames.com/skull-king/game-rules.php
- **BGQ**: BoardGameQuest review, https://www.boardgamequest.com/skull-king-review/
- **GR**: gamerules.com, https://gamerules.com/rules/skull-king/

---

## Summary for the engine

- **Deck (base, 70 cards):** 4 suits x 1-14 = 56: Parrot green, Treasure Chest yellow, Pirate Map purple, Jolly Roger black (= trump). 5 Escape, 5 Pirate, 1 Tigress, 1 Skull King, 2 Mermaid.
- **Advanced cards (optional, +4 = 74):** 2 Loot, 1 Kraken, 1 White Whale. (Box also has 4 blanks, not played.)
- **Pirate names:** Rosie D'Laney, Bendt the Bandit, Rascal of Roatan, Juanita Jade, Harry the Giant (abilities only in the optional Pirate Abilities rule).
- **Rounds:** 10; round N deals N cards. 2-8 players. With 8 players deal 8 in rounds 9 and 10 (general rule: cap at deck/players, everyone equal).
- **Dealer/lead:** player left of dealer leads trick 1; trick winner leads next. Next round's dealer = the player who led first this round (so deal passes left).
- **Bid:** simultaneous ("Yo-ho-ho", 3 pounds), any 0..cards dealt, no "hook"/sum restriction.
- **Follow suit:** if a suited card is led you must follow suit with a suited card if you have that suit; special cards may ALWAYS be played instead. Void -> anything.
- **Lead by Escape / Tigress-as-Escape / Loot:** next suited card played sets the suit. **Lead by Pirate / Tigress-as-Pirate / Skull King / Mermaid / Kraken / White Whale:** no suit, anything goes for the whole trick.
- **Winner:** Mermaid beats SK; SK beats Pirates (incl. Tigress-as-Pirate); Pirates beat Mermaids; all characters beat suited; black beats other suits; else highest of lead suit. Ties of same type -> first played. **Pirate + SK + Mermaid all present -> Mermaid wins** (first Mermaid if two). All Escapes (incl. Tigress-escape, Loot) -> first played wins.
- **Kraken:** trick destroyed, nobody wins it; next lead = player who would have won without it.
- **White Whale:** specials are ignored; highest number wins regardless of suit/colour; tie -> first played. If no suited cards: trick discarded (lead: see conflict below). Kraken + Whale: the **second** one played acts, the first acts as an Escape.
- **Loot:** plays as an Escape; alliance between Loot player and trick winner; +20 each if BOTH hit their bids. Loot player winning the trick (all others escapes) -> no alliance, no bonus. Not used in 2-player.
- **Scoring:** bid >=1 hit: +20 x bid. Miss: -10 x |diff|. Bid 0 hit: +10 x cards dealt that round; bid 0 miss: -10 x cards dealt (flat, not per trick). "Cards dealt" (not round number) matters with 8 players / variable-count variants.
- **Bonuses (only if bid hit, incl. bid 0 hit):** each captured 14: +10 (green/yellow/purple), +20 (black); Mermaid captured by a Pirate +20 each; Pirate captured by SK +30 each; SK captured by Mermaid +40; Loot alliance +20. Order of play irrelevant.
- **Tie at game end:** play another round until broken (RB24). BGA instead shares the win.
- **2-player:** deal 3 hands; third is "Graybeard's ghost" (no bid/score), always plays 2nd by flipping his top card, never has to follow suit, Tigress = escape, leads if he wins; players alternate leading rounds; no Loot.
- **Rascal scoring:** potential = 10 x cards dealt; exact = all, off by 1 = half, off by 2+ = 0; bonuses same full/half/none. Optional 2021 add-on "Cannonball/Grapeshot" (see section 6).
- **Variable-length variants:** Even Keeled, Skip to the Brawl, Swift-n-Salty Skirmish, Broadside Barrage, Whirlpool, Past Your Bedtime (section 7).

**Could not verify / conflicts**
- White Whale with only specials: RB24 says the player who *would have won* leads next; BGA and RP (2021 text) say the *White Whale player* leads. Use RB24 (newest).
- Kraken next lead: FAQ admits a "printing discrepancy"; official ruling is the would-have-won player. Some older printings said otherwise (wording not found).
- Cannonball/Grapeshot appears only in 2021-era rulebook text (RP, BGF); the current RASC PDF (2 pages) no longer includes it.
- Whether a Loot alliance also forms when the trick is Krakened/Whaled: not stated anywhere.
- Older (pre-2021) deck composition and pirate names: only partial, one-source data (section 8).
- 2-8 player count comes from box/retailer listings and the 8-player deal note in RB24; the rulebook text itself has no "2-8" line.

---

## 1. Deck composition

| Item | Rule / number | Sources | Status |
|---|---|---|---|
| Suits | Parrot (green), Treasure Chest (yellow), Pirate Map (purple), Jolly Roger (black, trump); each 1-14 = 56 | RB24 p3, p8; BGA | Confirmed |
| Escape | 5 | RB24 p3; BGA | Confirmed |
| Pirate | 5 (names above) | RB24 p3, p18; BGA | Confirmed |
| Tigress | 1 | RB24; BGA | Confirmed |
| Skull King | 1 | RB24; BGA | Confirmed |
| Mermaid | 2 | RB24; BGA | Confirmed |
| Loot / Kraken / White Whale | 2 / 1 / 1, "advanced", removed for basic game | RB24 p3, p5; BGA | Confirmed |
| Totals | 70 basic, 74 with advanced cards; also 4 blank cards, 16 player aids, 16 bid-reminder cards | RB24; BGA; GR (74) | Confirmed |
| Expansion Pack (2025, separate box) | one 7, one 8, one 0/14 per suit (12), Wild Monkey 15 (1), pirate Mary Thorne (1), Last Volley (1), First Mate Con (1), Spotted Stingray (1), Davy Jones' Locker (1), Walk the Plank (3) = 21 more cards -> 95 total; supports up to 9 players for 10 full rounds | EXP | One source (official) |

Expansion Pack card rules (EXP, for completeness, not the core game): extra 7s/8s tie -> first played; capturing an expansion 8 = +5, a 7 = -5 (bid hit only). 0/14 declared on play, no 14 bonus. Wild 15 = 15 of the led non-black suit (or chosen colour if no suit yet), never black, loses to trump. Mary Thorne = pirate; power: pick a random card from any hand, that card must be played next trick. First Mate Con beats pirates, loses to Mermaid and SK; SK/Mermaid taking him +30. Walk the Plank removes one pirate from the trick. Spotted Stingray = lowest number wins. Last "Sea Monster" played (Kraken/Whale/Stingray) acts. Davy Jones' Locker cancels all Sea Monsters, +20 per monster. Last Volley: play an extra card at end of trick, skip the round's final trick. Trick of only non-winning specials: discarded, leader leads again. 2-player: no Wild 15, Walk the Plank, 0/14.

## 2. Players, deal, lead

| Item | Rule | Sources | Status |
|---|---|---|---|
| Players | 2-8 | Retail listings (GR, BGQ "up to 8"); RB24 8-player note | Confirmed (box) |
| Cards per round | Round N: N cards, rounds 1-10 | RB24 p5; BGA; BGF | Confirmed |
| 8 players | 70 cards / 8 = 8 max: rounds 9 and 10 deal 8 each. Same idea for any count (equal hands) | RB24 p5 | One source (official) |
| Who leads | Left of dealer leads trick 1; trick winner leads next | RB24 p7, p11 | One source (official), BGA consistent |
| Next dealer | The player who played first this round deals next round | RB24 p11 | One source (official) |
| 2-player | Graybeard's ghost rules (see summary) | RB24 p15; BGF | Confirmed |

## 3. Bidding

Simultaneous: fists pounded 3 times chanting "Yo-ho-ho", fingers show bid (closed fist = 0, say it aloud above 5). Any bid 0..cards dealt; no limit on total bids. Sources: RB24 p6; BGF. **Confirmed.**

## 4. Trick rules

| Item | Rule | Sources | Status |
|---|---|---|---|
| Follow suit | Suited lead: if playing a suited card, must match lead suit when able; specials any time; void = any card | RB24 p7-8; BGA | Confirmed |
| Off-suit | Non-lead, non-black suited card always loses | RB24 p9; BGA | Confirmed |
| Trump | Any black beats any other suit | RB24 p9; BGA | Confirmed |
| Escape / Tigress-escape lead | Next player's card sets suit; repeats if they also escape | RB24 p11 | One source (official) |
| Character lead | No suit for the trick | RB24 p11; BGA | Confirmed |
| Pirates | Beat all suited; equal to each other, first played wins | RB24 p10; BGA | Confirmed |
| Tigress | Declared Pirate or Escape when played | RB24 p10; BGA | Confirmed |
| Skull King | Beats suited + Pirates (incl. Tigress pirate); loses only to Mermaids | RB24 p10; BGA | Confirmed |
| Mermaids | Beat SK and suited, lose to Pirates; two mermaids -> first wins | RB24 p10; BGA | Confirmed |
| Pirate + SK + Mermaid | Mermaid wins regardless of order; only the SK-capture bonus is paid | RB24 p10; FAQ | Confirmed |
| All escapes | First escape played wins | RB24 p11; RP | Confirmed |
| Kraken | Trick destroyed, set aside; would-have-won player leads next; Kraken lead = no suit | RB24 p16, p19; FAQ; BGA | Confirmed |
| White Whale | Specials destroyed, numbers lose suit; highest number wins, tie -> first; only specials -> discard | RB24 p17; BGA; BGF | Confirmed |
| Whale: next lead when only specials | RB24: who would have won leads. BGA/RP: White Whale player leads | RB24 vs BGA, RP | **Conflicting**: use RB24 |
| Whale played after a suit is set | Later players must still follow the suit if able (FAQ). RB24 p19 says cards after a mid-trick Kraken/Whale need not follow suit | FAQ vs RB24 | **Conflicting**: newest is FAQ (web); RB24 is printed |
| Kraken + Whale | Second played acts, first acts as an escape; Kraken sets no suit; Whale does not change the lead | RB24 p17; FAQ; BGA | Confirmed |
| Loot | Plays as escape; alliance loot player + winner; +20 each if both hit | RB24 p17; FAQ; BGA; BGF | Confirmed |
| Loot lead | No suit; next suited card sets it. If all others escape, the Loot player wins, no alliance/bonus | RB24 p19; FAQ | Confirmed |
| Pirate Abilities (optional) | Only when you WIN the trick with that pirate; use immediately; only Harry may be used after the last trick | RB24 p18; FAQ; BGA | Confirmed |
| Ability list | Rosie: choose next leader. Bendt: draw 2 from undealt deck, discard 2. Rascal: optionally bet 10 or 20 on hitting your bid (+/-). Juanita: privately view undealt cards. Harry: change bid by +1/-1 or keep | RB24 p18; BGA ("0, 10 or 20") | Confirmed |
| Graybeard plays Tigress | Acts as escape, no capture bonus | RB24 p15; FAQ | Confirmed |

## 5. Scoring

| Item | Rule | Sources | Status |
|---|---|---|---|
| Bid >=1 hit | +20 per trick | RB24 p12; BGA; BGQ | Confirmed |
| Bid >=1 miss | -10 per trick off; trick points lost | RB24 p12; BGA | Confirmed |
| Bid 0 hit / miss | +/-10 x **cards dealt** (rulebook example uses round no. which equals cards in normal play; BGA says round number) | RB24 p12; BGQ ("cards in the round"); BGA | Confirmed (use cards dealt) |
| Bonuses need bid hit | Yes, including a successful zero bid | RB24 p13; BGA; BGQ | Confirmed |
| 14s | +10 each green/yellow/purple, +20 black, whoever played it | RB24 p13; BGA; BGQ | Confirmed |
| Mermaid taken by Pirate | +20 each | RB24 p13; BGA; BGF | Confirmed |
| Pirate taken by SK | +30 each (Tigress-as-pirate counts) | RB24 p13; BGA | Confirmed |
| SK taken by Mermaid | +40 | RB24 p13; BGA; BGF | Confirmed |
| Loot | +20 each, both must hit | RB24 p17; FAQ; BGA | Confirmed |

Note (reasoned): a successful bid-0 player took no tricks, so it can't hold captured 14s or characters; the only bonus it can earn is the Loot alliance (play Loot, the winner also hits -> +20 each).

## 6. Rascal scoring (optional)

- **Current (RASC PDF):** each player's potential = 10 x cards dealt, whatever the bid. Direct Hit (exact) = all; Glancing Blow (off by 1) = half; Complete Miss (off by 2+) = 0. Bonuses scaled the same (all/half/none). No negative scores. Sources: RASC; RP; BGF. **Confirmed.**
- **FAQ rulings:** under Rascal, a Rascal-of-Roatan wager is lost if off by 1 (exact bid needed); Loot bonus needs both players exact even under Rascal. One source (FAQ).
- **Cannonball / Grapeshot (2021 rulebook add-on):** after bids, everyone secretly picks and reveals together: open hand = Grapeshot (normal Rascal), closed fist = Cannonball: 15 x cards dealt if exact, 0 if off at all, bonuses only if exact. Example 6 cards: Grapeshot 60/30/0, Cannonball 90/0. Sources: RP; BGF. **Confirmed (2 secondary)**, but absent from the current official RASC PDF and RB24.
- **Rascal of Roatan bet** (pirate ability, not a scoring system): bet 0/10/20; +bet if exact, -bet if not. Same in 2021 and 2024 texts. RB24; BGA. **Confirmed.**

## 7. Other official variants (RB24 p15, "Variable Card Counts"; one source, official)

| Name | Hand sizes |
|---|---|
| Even Keeled | 5 rounds: 2, 4, 6, 8, 10 |
| Skip to the Brawl | 5 rounds: 6, 7, 8, 9, 10 |
| Swift-n-Salty Skirmish | 5 rounds of 5 |
| Broadside Barrage | 10 rounds of 10 |
| Whirlpool | 10 rounds: 9, 7, 5, 3, 1, 9, 7, 5, 3, 1 ("two rounds of 9,7,5,3,1") |
| Past Your Bedtime | 1 round of 1 card (joke option) |

Also official: Pirate Abilities, each advanced card chosen à la carte ("menu"), 2-player Graybeard rules. No "Skyward" variant exists. Zero-bid scoring uses cards dealt, which is why it matters here.

## 8. Older (pre-2021) editions

| Item | Older rule | Sources | Status |
|---|---|---|---|
| Suits | 4 suits numbered 1-13 (52 cards), black trump | UBG | One source |
| Tigress | Called "Scary Mary" (pirate or escape) | UBG; misutmeeple | Confirmed |
| Deck | 64 base (52 + 5 escape + 5 pirate + Scary Mary + SK); UBG lists 66 including 2 Mermaids; "Legendary Expansion" box (2-6 players) added Mermaids, Loot, Kraken | UBG; publisher earlier-editions photos | One source each |
| No White Whale | White Whale new in 2021 | BGF | One source |
| No 14 bonuses / no Mermaid-by-Pirate bonus | Old bonuses: SK takes pirate +30 each, Mermaid takes SK +50 | UBG; BGF; BGQ (50) | Confirmed |
| Bid 0 | +/-10 x round number | UBG | One source |
| Bid display | Large numbered bid cards (2021: two cards, 0-4 and 5-9) | BGF | One source |
| Old SK-capture bonus order | Old version cared about play order for pirates captured by SK; 2021 removed that | BGF | One source |

Engine recommendation: implement the current (2021/2024) rules only; old-edition scoring could be a later toggle (Mermaid-captures-SK 50, no 14/Mermaid bonuses).
