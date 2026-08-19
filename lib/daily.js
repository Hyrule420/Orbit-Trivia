import { shuffle } from "./util.js";

/* ============================================================
   DAILY CHALLENGE CURVE
   Everyone on Earth still gets the same ten questions today —
   the seed is the local date, same as before. What changed is
   which ten: 3 Earthbound, 4 Orbit, 3 Martian, in that order,
   with a greedy category spread so the run doesn't cluster on
   one topic.

   First Orbit is already the all-easy on-ramp, so Daily is
   allowed to climb. Adaptive difficulty lives elsewhere; this
   file must never look at a player's history.
   ============================================================ */

export const DAILY_CURVE = Object.freeze({
  Earthbound: 3,
  Orbit: 4,
  Martian: 3,
});

const TIER_ORDER = ["Earthbound", "Orbit", "Martian"];
/* Different salts so the same date doesn't put the first card
   of each tier in lockstep from one shuffle stream. */
const TIER_SALT = { Earthbound: 0, Orbit: 7, Martian: 13 };

function takeSpread(pile, n) {
  const picked = [];
  const rest = [...pile];
  while (picked.length < n && rest.length) {
    const lastCat = picked.length ? picked[picked.length - 1].c : null;
    const used = new Set(picked.map((q) => q.c));
    let idx = rest.findIndex((q) => q.c !== lastCat && !used.has(q.c));
    if (idx < 0) idx = rest.findIndex((q) => q.c !== lastCat);
    if (idx < 0) idx = 0;
    picked.push(rest.splice(idx, 1)[0]);
  }
  return picked;
}

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
    if (slice.length < n) {
      const have = new Set(slice.map((q) => q.q));
      for (const q of pile) {
        if (slice.length >= n) break;
        if (!have.has(q.q)) {
          slice.push(q);
          have.add(q.q);
        }
      }
    }
    deck.push(...slice);
  }
  return deck;
}

export function dailyTierShape(deck) {
  return deck.map((q) => q.d);
}
