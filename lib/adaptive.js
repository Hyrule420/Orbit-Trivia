import { shuffle } from "./util.js";
import { takeSpread, TIER_ORDER, TIER_RANK, emptyPiles, clonePiles, sortByTier } from "./spread.js";
import { emptySkill, tierRate, catRate } from "./skill.js";

/* ============================================================
   ADAPTIVE CREW
   Same climb as Daily — Earthbound, then Orbit, then Martian —
   but the mix slides with how this device has been playing.
   Daily stays a shared 3-4-3 and must never import this file.

   Cold start (fewer than 8 recorded answers) is 5-4-1, a notch
   kinder than Daily. After that the curve moves. Live shifts
   during a run can nudge leftover cards ±2 off the plan.
   ============================================================ */

export const ADAPTIVE_COLD = Object.freeze({ Earthbound: 5, Orbit: 4, Martian: 1 });
export const MAX_LIVE_SHIFTS = 2;

const TIER_SALT = { Earthbound: 3, Orbit: 11, Martian: 19 };
const UP = { Earthbound: "Orbit", Orbit: "Martian" };
const DOWN = { Martian: "Orbit", Orbit: "Earthbound" };

const CURVES = [
  { when: (eb, orb, mar) => eb < 0.55, shape: { Earthbound: 6, Orbit: 3, Martian: 1 } },
  { when: (eb, orb) => eb < 0.72 && orb < 0.5, shape: { Earthbound: 5, Orbit: 4, Martian: 1 } },
  { when: (eb, orb, mar) => orb >= 0.78 && mar >= 0.62, shape: { Earthbound: 1, Orbit: 3, Martian: 6 } },
  { when: (eb, orb, mar) => orb >= 0.7 && mar >= 0.42, shape: { Earthbound: 2, Orbit: 3, Martian: 5 } },
  { when: (eb, orb) => orb >= 0.55, shape: { Earthbound: 3, Orbit: 4, Martian: 3 } },
];
const FALLBACK = { Earthbound: 4, Orbit: 4, Martian: 2 };

export function scaleCurve(shape, count) {
  const n = Math.max(1, count | 0);
  if (n === 10) return { ...shape };
  const raw = TIER_ORDER.map((tier) => (shape[tier] * n) / 10);
  const floors = raw.map((x) => Math.floor(x));
  let left = n - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return {
    Earthbound: floors[0],
    Orbit: floors[1],
    Martian: floors[2],
  };
}

export function planAdaptiveCurve(skill, count = 10) {
  const s = skill || emptySkill();
  const seen = s.seen || 0;
  let shape;
  if (seen < 8) {
    shape = ADAPTIVE_COLD;
  } else {
    const eb = tierRate(s, "Earthbound");
    const orb = tierRate(s, "Orbit");
    const mar = tierRate(s, "Martian");
    const hit = CURVES.find((c) => c.when(eb, orb, mar));
    shape = hit ? hit.shape : FALLBACK;
  }
  return scaleCurve(shape, count);
}

export function formatCurve(curve) {
  return `${curve.Earthbound} Earthbound · ${curve.Orbit} Orbit · ${curve.Martian} Martian`;
}

function biasPile(pile, skill, mode) {
  if (mode === "none" || pile.length < 2) return pile;
  const scored = [...pile].sort((a, b) => {
    const d = catRate(skill, a.c) - catRate(skill, b.c);
    return mode === "weak" ? d : -d;
  });
  if (mode !== "mix") return scored;
  const out = [];
  let i = 0;
  let j = scored.length - 1;
  while (i <= j) {
    out.push(scored[i++]);
    if (i <= j) out.push(scored[j--]);
  }
  return out;
}

export function buildAdaptiveDeck(questions, skill, seed, count = 10) {
  const s = skill || emptySkill();
  const curve = planAdaptiveCurve(s, count);
  const byTier = emptyPiles();
  for (const q of questions) {
    if (byTier[q.d]) byTier[q.d].push(q);
  }
  const used = new Set();
  const picked = [];
  const bias = { Earthbound: "weak", Orbit: "mix", Martian: "mix" };

  for (const tier of TIER_ORDER) {
    const n = curve[tier];
    if (!n) continue;
    let pile = shuffle(byTier[tier], seed + TIER_SALT[tier]).filter((q) => !used.has(q.q));
    pile = biasPile(pile, s, bias[tier]);
    const slice = takeSpread(pile, n);
    if (slice.length < n) {
      const fillers = [];
      for (const other of TIER_ORDER) {
        if (other === tier) continue;
        fillers.push(...shuffle(byTier[other], seed + 41 + TIER_SALT[other]));
      }
      for (const q of fillers) {
        if (slice.length >= n) break;
        if (!used.has(q.q) && !slice.some((x) => x.q === q.q)) slice.push(q);
      }
    }
    for (const q of slice) used.add(q.q);
    picked.push(...slice);
  }

  const deck = sortByTier(picked).slice(0, count);
  const unused = emptyPiles();
  for (const q of questions) {
    if (byTier[q.d] && !used.has(q.q)) unused[q.d].push(q);
  }
  return { deck, unused, curve };
}

export function applyLiveShift(deck, fromIndex, unused, direction) {
  const want = direction === "up" ? UP : DOWN;
  const prefer = direction === "up" ? ["Earthbound", "Orbit"] : ["Martian", "Orbit"];
  const rest = deck.slice(fromIndex + 1);
  let hit = -1;
  let toTier = null;
  for (const fromTier of prefer) {
    const next = want[fromTier];
    if (!next || !unused[next] || unused[next].length === 0) continue;
    const i = rest.findIndex((q) => q.d === fromTier);
    if (i >= 0) {
      hit = i;
      toTier = next;
      break;
    }
  }
  if (hit < 0) return { shifted: false, deck, unused };

  const old = rest[hit];
  const incoming = unused[toTier][0];
  const nextUnused = clonePiles(unused);
  nextUnused[toTier] = nextUnused[toTier].slice(1);
  nextUnused[old.d] = [...nextUnused[old.d], old];
  rest[hit] = incoming;
  const nextDeck = deck.slice(0, fromIndex + 1).concat(sortByTier(rest));
  return { shifted: true, deck: nextDeck, unused: nextUnused, from: old.d, to: toTier };
}
