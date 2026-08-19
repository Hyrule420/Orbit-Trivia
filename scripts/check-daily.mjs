#!/usr/bin/env node
/* ============================================================
   Guard the Daily 3-4-3 curve.

   Same contract as the live game: a date seed always yields the
   same ten questions, in Earthbound → Orbit → Martian order,
   with no duplicates. First Orbit / Escape / Crew never call
   this builder, so this script only proves Daily.

   Usage: node scripts/check-daily.mjs
   ============================================================ */
import { QUESTIONS } from "../lib/questions.js";
import { buildDailyDeck, DAILY_CURVE, dailyTierShape } from "../lib/daily.js";

const EXPECTED = [
  ...Array(DAILY_CURVE.Earthbound).fill("Earthbound"),
  ...Array(DAILY_CURVE.Orbit).fill("Orbit"),
  ...Array(DAILY_CURVE.Martian).fill("Martian"),
];
const TOTAL = EXPECTED.length;
const errors = [];

const byTier = { Earthbound: 0, Orbit: 0, Martian: 0 };
for (const q of QUESTIONS) {
  if (byTier[q.d] !== undefined) byTier[q.d]++;
}
for (const [tier, n] of Object.entries(DAILY_CURVE)) {
  if (byTier[tier] < n) {
    errors.push(`bank only has ${byTier[tier]} ${tier} questions, Daily needs ${n}`);
  }
}

function yyyymmdd(y, m, d) {
  return y * 10000 + m * 100 + d;
}

const seeds = [];
for (let d = 1; d <= 28; d++) {
  for (let m = 1; m <= 12; m++) seeds.push(yyyymmdd(2026, m, d));
}
{
  const d = new Date();
  seeds.push(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
}

let consecutiveSameCat = 0;
const seenDecks = new Set();

for (const seed of seeds) {
  const deck = buildDailyDeck(QUESTIONS, seed);
  const again = buildDailyDeck(QUESTIONS, seed);
  const where = `seed ${seed}`;

  if (deck.length !== TOTAL) {
    errors.push(`${where}: deck length ${deck.length}, expected ${TOTAL}`);
    continue;
  }

  const shape = dailyTierShape(deck);
  if (shape.join() !== EXPECTED.join()) {
    errors.push(`${where}: shape ${shape.join("-")}, expected ${EXPECTED.join("-")}`);
  }

  const qs = deck.map((q) => q.q);
  if (new Set(qs).size !== qs.length) {
    errors.push(`${where}: duplicate question in the daily ten`);
  }

  if (again.map((q) => q.q).join("\n") !== qs.join("\n")) {
    errors.push(`${where}: same seed produced two different decks`);
  }

  for (let i = 1; i < deck.length; i++) {
    if (deck[i].d === deck[i - 1].d && deck[i].c === deck[i - 1].c) {
      consecutiveSameCat++;
      errors.push(`${where}: back-to-back ${deck[i].c} inside ${deck[i].d}`);
    }
  }

  seenDecks.add(qs.join("\n"));
}

if (seenDecks.size < seeds.length * 0.8) {
  errors.push(
    `only ${seenDecks.size} unique decks across ${seeds.length} seeds — the date seed is not mixing the bank`
  );
}

if (errors.length) {
  console.error(`\ncheck:daily -- ${errors.length} error(s):\n\n${errors.slice(0, 40).join("\n")}\n`);
  process.exit(1);
}

console.log(
  `check:daily -- ${TOTAL}-question 3-4-3 curve holds for ${seeds.length} date seeds ` +
    `(${seenDecks.size} unique decks, ${consecutiveSameCat} same-category pairs)`
);
