#!/usr/bin/env node
/* ============================================================
   Guard Adaptive Crew.

   Daily is not covered here — that's check-daily.mjs, and Adaptive
   must never change it. This file proves the mix always sums to
   the asked length, cold-start is 5-4-1, a hot streak climbs, a
   live shift stays inside ±2, and the same skill+seed is stable.

   Usage: node scripts/check-adaptive.mjs
   ============================================================ */
import { QUESTIONS } from "../lib/questions.js";
import { emptySkill, applyAnswers, parseSkill, tierRate } from "../lib/skill.js";
import {
  planAdaptiveCurve,
  buildAdaptiveDeck,
  applyLiveShift,
  ADAPTIVE_COLD,
  MAX_LIVE_SHIFTS,
} from "../lib/adaptive.js";
import { TIER_ORDER } from "../lib/spread.js";
import { buildDailyDeck, DAILY_CURVE } from "../lib/daily.js";
import { todaySeed } from "../lib/day.js";

const errors = [];
const push = (msg) => errors.push(msg);

function shapeOf(deck) {
  const s = { Earthbound: 0, Orbit: 0, Martian: 0 };
  for (const q of deck) if (s[q.d] !== undefined) s[q.d]++;
  return s;
}

function sameShape(a, b) {
  return TIER_ORDER.every((t) => a[t] === b[t]);
}

{
  const cold = planAdaptiveCurve(emptySkill(), 10);
  if (!sameShape(cold, ADAPTIVE_COLD)) {
    push(`cold start was ${JSON.stringify(cold)}, expected ${JSON.stringify(ADAPTIVE_COLD)}`);
  }
}

{
  const hot = emptySkill();
  hot.seen = 40;
  hot.byTier.Earthbound = { right: 18, total: 20 };
  hot.byTier.Orbit = { right: 16, total: 18 };
  hot.byTier.Martian = { right: 10, total: 12 };
  const curve = planAdaptiveCurve(hot, 10);
  if (!sameShape(curve, { Earthbound: 1, Orbit: 3, Martian: 6 })) {
    push(`hot streak curve was ${JSON.stringify(curve)}, expected 1-3-6`);
  }
}

{
  const mid = emptySkill();
  mid.seen = 20;
  mid.byTier.Earthbound = { right: 8, total: 10 };
  mid.byTier.Orbit = { right: 6, total: 10 };
  mid.byTier.Martian = { right: 2, total: 8 };
  const curve = planAdaptiveCurve(mid, 10);
  if (!sameShape(curve, { Earthbound: 3, Orbit: 4, Martian: 3 })) {
    push(`calibrated curve was ${JSON.stringify(curve)}, expected 3-4-3`);
  }
}

{
  for (const count of [5, 10, 15, 20]) {
    const curve = planAdaptiveCurve(emptySkill(), count);
    const sum = curve.Earthbound + curve.Orbit + curve.Martian;
    if (sum !== count) push(`scaled cold curve at ${count} summed to ${sum}`);
  }
}

{
  const skill = emptySkill();
  const a = buildAdaptiveDeck(QUESTIONS, skill, 42, 10);
  const b = buildAdaptiveDeck(QUESTIONS, skill, 42, 10);
  if (a.deck.map((q) => q.q).join("\n") !== b.deck.map((q) => q.q).join("\n")) {
    push("same skill+seed produced two different Adaptive decks");
  }
  if (a.deck.length !== 10) push(`adaptive deck length ${a.deck.length}, expected 10`);
  if (new Set(a.deck.map((q) => q.q)).size !== a.deck.length) push("duplicate in adaptive deck");
  const shape = shapeOf(a.deck);
  if (!sameShape(shape, a.curve) && a.deck.length === 10) {
    /* Fill-from-neighbor can change the shape when a filtered bank is
       short. The full bank must not need that. */
    push(`full-bank adaptive shape ${JSON.stringify(shape)} !== plan ${JSON.stringify(a.curve)}`);
  }
  let last = -1;
  const rank = { Earthbound: 0, Orbit: 1, Martian: 2 };
  for (const q of a.deck) {
    const r = rank[q.d];
    if (r < last) push("adaptive deck was not ordered Earthbound → Orbit → Martian");
    last = r;
  }
}

{
  const skill = applyAnswers(emptySkill(), [
    { d: "Earthbound", c: "Tesla", ok: true },
    { d: "Earthbound", c: "NASA", ok: false },
    { d: "Orbit", c: "FSD", ok: true },
  ]);
  if (skill.seen !== 3) push(`seen ${skill.seen}, expected 3`);
  if (skill.byTier.Earthbound.total !== 2 || skill.byTier.Earthbound.right !== 1) {
    push("Earthbound tally after three answers was wrong");
  }
  if (skill.byCat.Tesla.right !== 1) push("Tesla category tally was wrong");
  const roundTrip = parseSkill(JSON.parse(JSON.stringify(skill)));
  if (roundTrip.seen !== 3) push("parseSkill dropped seen");
  if (tierRate(emptySkill(), "Orbit") !== 0.5) push("empty tierRate should be 1/2");
}

{
  const built = buildAdaptiveDeck(QUESTIONS, emptySkill(), 7, 10);
  const before = built.deck.map((q) => q.d).join(",");
  const no = applyLiveShift(built.deck, 9, built.unused, "up");
  if (no.shifted) push("live shift on the last card should be a no-op");

  let upped = false;
  let state = built;
  for (let i = 0; i < 9; i++) {
    const res = applyLiveShift(state.deck, i, state.unused, "up");
    if (res.shifted) {
      upped = true;
      if (TIER_ORDER.indexOf(res.to) !== TIER_ORDER.indexOf(res.from) + 1) {
        push(`up-shift jumped ${res.from} → ${res.to}`);
      }
      state = res;
      break;
    }
  }
  if (!upped) push("could not climb a leftover Earthbound/Orbit on a cold 5-4-1 deck");
  if (state.deck.length !== 10) push("live shift changed deck length");
  if (new Set(state.deck.map((q) => q.q)).size !== 10) push("live shift introduced a duplicate");
  void before;
}

{
  if (MAX_LIVE_SHIFTS !== 2) push("MAX_LIVE_SHIFTS drifted from the ±2 cap");
}

{
  /* Adaptive must not change today's Daily. Same seed, same ten. */
  const seed = todaySeed();
  const d1 = buildDailyDeck(QUESTIONS, seed).map((q) => q.q).join("\n");
  const d2 = buildDailyDeck(QUESTIONS, seed).map((q) => q.q).join("\n");
  if (d1 !== d2) push("Daily lost its determinism while Adaptive was added");
  const daily = buildDailyDeck(QUESTIONS, seed);
  const want = [
    ...Array(DAILY_CURVE.Earthbound).fill("Earthbound"),
    ...Array(DAILY_CURVE.Orbit).fill("Orbit"),
    ...Array(DAILY_CURVE.Martian).fill("Martian"),
  ];
  if (daily.map((q) => q.d).join() !== want.join()) push("Daily 3-4-3 shape changed");
}

if (errors.length) {
  console.error(`\ncheck:adaptive -- ${errors.length} error(s):\n\n${errors.join("\n")}\n`);
  process.exit(1);
}

console.log("check:adaptive -- cold 5-4-1, hot 1-3-6, scaled counts, live shift, Daily untouched");
