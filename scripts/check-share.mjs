#!/usr/bin/env node
/* ============================================================
   Guard the Daily share format.

   The climb has to stay comparable and spoiler-free: ten glyphs,
   three named stages, no question text, a stable flight id, and
   the same-ten kicker only on Daily.

   Usage: node scripts/check-share.mjs
   ============================================================ */
import {
  HIT,
  MISS,
  SITE,
  flightId,
  dayOfYear,
  stageLine,
  climbLines,
  buildReport,
  formatFlightText,
  spoilsQuestions,
  tagline,
} from "../lib/share.js";

const errors = [];
const push = (msg) => errors.push(msg);

{
  const d = new Date(2026, 7, 20); /* Aug 20 local */
  const id = flightId(d);
  if (!/^OT-2026\.\d{3}$/.test(id)) push(`flightId ${id} was not OT-YYYY.DDD`);
  if (dayOfYear(new Date(2026, 0, 1)) !== 1) push("Jan 1 should be day 1");
}

{
  const answers = [
    { d: "Earthbound", ok: true },
    { d: "Earthbound", ok: true },
    { d: "Earthbound", ok: false },
    { d: "Orbit", ok: true },
    { d: "Orbit", ok: false },
    { d: "Orbit", ok: true },
    { d: "Orbit", ok: true },
    { d: "Martian", ok: false },
    { d: "Martian", ok: true },
    { d: "Martian", ok: false },
  ];
  if (stageLine(answers, "Earthbound") !== `${HIT}${HIT}${MISS}`) push("Earthbound glyphs wrong");
  if (stageLine(answers, "Orbit") !== `${HIT}${MISS}${HIT}${HIT}`) push("Orbit glyphs wrong");
  const climb = climbLines(answers);
  if (climb.length !== 3) push(`expected 3 climb lines, got ${climb.length}`);
  if (!climb[0].startsWith("LIFTOFF")) push("first stage should be LIFTOFF");
  if (!climb[1].startsWith("ORBIT")) push("second stage should be ORBIT");
  if (!climb[2].startsWith("TRANS-MARS")) push("third stage should be TRANS-MARS");

  const report = buildReport({
    answers,
    score: 2140,
    correct: 6,
    total: 10,
    streak: 4,
    mode: "daily",
    when: new Date(2026, 7, 20),
  });
  const text = formatFlightText(report);
  if (!text.includes("DAILY")) push("Daily share missing DAILY");
  if (!text.includes("DAY 4")) push("Daily share missing streak");
  if (!text.includes("2,140 PTS")) push(`score formatting off: ${text}`);
  if (!text.includes("6/10")) push("correct count missing");
  if (!text.includes(SITE)) push("share missing site url");
  if (!text.includes("Same ten")) push("Daily kicker missing");
  if (spoilsQuestions(text)) push("share text contained a question mark — would leak a prompt");
  if (/\bWhat\b|\bWhich\b/.test(text)) push("share text looks like it leaked a prompt");
  const glyphs = [...text].filter((ch) => ch === HIT || ch === MISS).length;
  if (glyphs !== 10) push(`expected 10 climb glyphs, got ${glyphs}`);
}

{
  const t = tagline({ mode: "daily", correct: 10, total: 10 });
  if (!/Flawless/.test(t) || !/Same ten/.test(t)) push(`perfect Daily tagline off: ${t}`);
  const crew = formatFlightText(
    buildReport({ answers: [{ d: "Earthbound", ok: true }], score: 100, correct: 1, total: 1, mode: "custom" })
  );
  if (crew.includes("Same ten")) push("Crew share should not claim the same ten");
  if (crew.includes("DAY ")) push("Crew share should not show the Daily streak");
}

if (errors.length) {
  console.error(`\ncheck:share -- ${errors.length} error(s):\n\n${errors.join("\n")}\n`);
  process.exit(1);
}

console.log("check:share -- climb glyphs, no spoilers, Daily kicker, flight id");
