/* ============================================================
   Shared deck helpers.

   Daily and Adaptive both pick a fixed number of cards per tier and
   spread categories so a run doesn't cluster on Tesla or NASA.
   The greedy walk lives here so the two modes cannot drift apart.
   ============================================================ */

export const TIER_ORDER = ["Earthbound", "Orbit", "Martian"];
export const TIER_RANK = { Earthbound: 0, Orbit: 1, Martian: 2 };

export function takeSpread(pile, n) {
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

export function sortByTier(deck) {
  return [...deck].sort((a, b) => TIER_RANK[a.d] - TIER_RANK[b.d]);
}

export function emptyPiles() {
  return { Earthbound: [], Orbit: [], Martian: [] };
}

export function clonePiles(piles) {
  return {
    Earthbound: [...piles.Earthbound],
    Orbit: [...piles.Orbit],
    Martian: [...piles.Martian],
  };
}
