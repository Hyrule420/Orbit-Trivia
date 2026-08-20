import { shuffle } from "./util.js";
import { takeSpread, TIER_ORDER } from "./spread.js";

/* ============================================================
   DAILY CHALLENGE CURVE
   Everyone on Earth still gets the same ten questions today —
   the seed is the local date, same as before. What changed is
   which ten: 3 Earthbound, 4 Orbit, 3 Martian, in that order,
   with a greedy category spread so the run doesn't cluster on
   one topic.

   First Orbit is already the all-easy on-ramp, so Daily is
   allowed to climb. Adaptive difficulty lives in lib/adaptive.js
   and Crew setup; this file must never look at a player's history.
   ============================================================ */

export const DAILY_CURVE = Object.freeze({
  Earthbound: 3,
  Orbit: 4,
  Martian: 3,
});

/* Different salts so the same date doesn't put the first card
   of each tier in lockstep from one shuffle stream. */
const TIER_SALT = { Earthbound: 0, Orbit: 7, Martian: 13 };

export function buildDailyDeck(questions, seed) {
  const byTier = { Earthbound: [], Orbit: [], Martian: [] };
  for (const q of questions) {
    if (byTier[q.d]) byTier[q.d].push(q);
  }
  const deck = [];
  for (const tier of TIER_ORDER) {
    const n = DAILY_CURVE[tier];
    const pile = shuffle(byTier[tier], seed + TIER_SALT[tier]);
    const slice = takeSpread(pile, n);
    /* takeSpread only returns short when the bank itself is smaller than
       the curve. There is nothing left in pile to top up from — fail loud
       instead of shipping a Daily with fewer than ten questions. */
    if (slice.length < n) {
      throw new Error(`Daily ${tier} bank has ${pile.length}, need ${n}`);
    }
    deck.push(...slice);
  }
  return deck;
}

export function dailyTierShape(deck) {
  return deck.map((q) => q.d);
}
