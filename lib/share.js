import { TIER_ORDER } from "./spread.js";
import { todayKey } from "./day.js";

/* ============================================================
   FLIGHT REPORT
   The thing people actually post. Two artifacts, one identity:

     1. A three-line climb of █ and ░ — LIFTOFF / ORBIT / TRANS-MARS.
        Same job as Wordle's grid: comparable, no spoilers, works in
        iMessage and X without an image.
     2. A visual card (FlightCard + optional PNG) of the same flight.

   Daily is the share moment ("same ten as everyone on Earth").
   Crew/Adaptive can reuse the climb; they drop the same-ten line.
   ============================================================ */

export const SITE = "https://orbit-trivia.vercel.app";
export const HIT = "█";
export const MISS = "░";

export const STAGES = Object.freeze([
  { d: "Earthbound", name: "LIFTOFF" },
  { d: "Orbit", name: "ORBIT" },
  { d: "Martian", name: "TRANS-MARS" },
]);

const PAD = 11;

export function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

export function flightId(d = new Date()) {
  return `OT-${d.getFullYear()}.${String(dayOfYear(d)).padStart(3, "0")}`;
}

export function flightDateLabel(d = new Date()) {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function stageLine(answers, tier) {
  return (answers || [])
    .filter((a) => a && a.d === tier)
    .map((a) => (a.ok ? HIT : MISS))
    .join("");
}

export function climbLines(answers) {
  return STAGES.map((s) => {
    const glyphs = stageLine(answers, s.d);
    if (!glyphs) return null;
    return `${s.name.padEnd(PAD)}${glyphs}`;
  }).filter(Boolean);
}

export function tagline({ mode, correct, total }) {
  const daily = mode === "daily";
  const n = total > 0 ? correct / total : 0;
  if (daily) {
    if (total && correct === total) return "Flawless flight. Same ten. Beat it.";
    if (n >= 0.8) return "Almost orbital. Same ten. Your move.";
    if (n >= 0.5) return "Made orbit. Same ten. Your move.";
    if (correct > 0) return "Rode it out. Same ten. Your move.";
    return "Scrubbed. Same ten tomorrow.";
  }
  if (total && correct === total) return "Flawless flight. Your move.";
  return "Your move.";
}

export function modeLabel(mode) {
  if (mode === "daily") return "DAILY";
  if (mode === "firstorbit") return "FIRST ORBIT";
  if (mode === "escape") return "ESCAPE";
  return "CREW";
}

export function buildReport({
  answers = [],
  score = 0,
  correct = 0,
  total = 0,
  streak = 0,
  mode = "daily",
  when = new Date(),
} = {}) {
  const daily = mode === "daily";
  return {
    answers,
    score,
    correct,
    total,
    streak: daily ? streak : 0,
    mode,
    daily,
    id: flightId(when),
    dateLabel: flightDateLabel(when),
    dayKey: todayKey(),
    headline: modeLabel(mode),
    tagline: tagline({ mode, correct, total }),
    climb: climbLines(answers),
    perfect: total > 0 && correct === total,
  };
}

export function formatFlightText(report) {
  const pts = Number(report.score || 0).toLocaleString("en-US");
  const lines = [
    `ORBIT TRIVIA  ·  ${report.headline}`,
    report.id,
    "",
    ...report.climb,
    "",
    `${pts} PTS  ·  ${report.correct}/${report.total}`,
  ];
  if (report.daily && report.streak > 0) {
    lines[lines.length - 1] += `  ·  DAY ${report.streak}`;
  }
  lines.push(report.tagline);
  lines.push(SITE);
  return lines.join("\n");
}

export function spoilsQuestions(text) {
  /* Guard: a share string must never carry a prompt. */
  return /\?/g.test(text);
}
