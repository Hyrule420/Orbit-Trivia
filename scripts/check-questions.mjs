#!/usr/bin/env node
/* ============================================================
   Guard against the kind of bugs a "does it parse" check can't see.

   The question bank has been through three review passes that each
   found real problems -- wrong answers, duplicated questions, and a
   whole 60-question block where the insight for one category got
   swapped with another's -- and every one of them shipped past checks
   that only verified shape: four options, a valid tier, a non-empty
   insight. Shape was fine in all three cases. Content was wrong.

   This script is the difference between those two things. The first
   group below is unambiguous and blocks the build, the same way
   check-styles.mjs does. The second group is a heuristic -- it has
   false positives on real, good content (see the header comment on
   FLAG_THRESHOLD below) -- so it prints a report but does not fail,
   because a script with false positives that blocks shipping trains
   people to ignore it.

   Usage: node scripts/check-questions.mjs
   ============================================================ */
import { QUESTIONS, CATEGORIES, TIER_META } from "../lib/questions.js";

const TIERS = Object.keys(TIER_META);
const errors = [];
const warnings = [];

/* ---- hard failures: unambiguous, zero legitimate exceptions ---- */

const seenQuestions = new Map();
const seenInsights = new Map();

for (const q of QUESTIONS) {
  const where = `[${q.c}] ${q.q}`;

  if (!Array.isArray(q.o) || q.o.length !== 4) {
    errors.push(`${where}\n    does not have exactly 4 options`);
  } else if (new Set(q.o).size !== 4) {
    errors.push(`${where}\n    has duplicate options: ${JSON.stringify(q.o)}`);
  } else if (!q.o.includes(q.a)) {
    errors.push(`${where}\n    answer "${q.a}" is not among its own options`);
  }

  if (!TIERS.includes(q.d)) {
    errors.push(`${where}\n    difficulty "${q.d}" is not one of: ${TIERS.join(", ")}`);
  }

  if (!CATEGORIES.includes(q.c)) {
    errors.push(`${where}\n    category "${q.c}" is not listed in CATEGORIES`);
  }

  if (!q.insight || q.insight.trim().length < 15) {
    errors.push(`${where}\n    insight is missing or too short`);
  } else if (q.insight.includes('"')) {
    errors.push(`${where}\n    insight contains a literal double-quote character`);
  }

  const qKey = q.q.trim().toLowerCase();
  if (seenQuestions.has(qKey)) {
    errors.push(`${where}\n    is a verbatim duplicate of an earlier question (in ${seenQuestions.get(qKey)})`);
  } else {
    seenQuestions.set(qKey, q.c);
  }

  if (q.insight) {
    const iKey = q.insight.trim().toLowerCase();
    if (seenInsights.has(iKey)) {
      errors.push(`${where}\n    has the exact same insight text as another question (in ${seenInsights.get(iKey)})`);
    } else {
      seenInsights.set(iKey, q.c);
    }
  }
}

/* ---- soft warnings: real signal, but with known false positives ----

   LENGTH_GAP catches the "just pick the longest option" tell -- a
   pass-3 fix brought every question under 15 characters of gap. A
   single new question landing above that is worth a human glance, not
   an automatic rewrite: sometimes a correct answer genuinely needs a
   few more words than three throwaway distractors, and only a person
   can tell whether that's true or just lazy option-writing.

   ZERO_OVERLAP catches the exact shape of the Deep Space / Planetary
   Science swap: an insight sharing no vocabulary at all with its own
   question and answer. Tested against the current, already-reviewed
   bank, this flags about 3% of questions that are completely fine --
   insights that refer back to the subject with "it" or "its" rather
   than repeating a proper noun, or that explain a mechanism in
   different words than the question uses. That false-positive rate is
   why this is a report, not a gate, but it's a short list worth a
   30-second read after any bulk content change. */

const LENGTH_GAP = 15;
const STOPWORDS = new Set([
  "what","is","the","a","an","of","in","on","for","to","which","was","were",
  "did","does","are","and","its","by","as","with","that","how","many","name",
  "at","from","it","this","has","have","when","who","be","used","after",
  "before","than","about","approximately","primary","main","or","into","over",
  "not","can","will","would","their","they","currently","one","two","three",
  "four","some","most","more","much","also","due","because","since","other",
  "such","only","out","up","down","if","so","no","yes","do",
]);
const keywords = (s) =>
  new Set(
    s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
  );

for (const q of QUESTIONS) {
  const distractors = q.o.filter((o) => o !== q.a);
  const gap = q.a.length - Math.max(...distractors.map((o) => o.length));
  if (gap > LENGTH_GAP) {
    warnings.push(
      `[${q.c}] ${q.q}\n` +
      `    answer is ${gap} characters longer than any distractor -- picking the longest option would win here`
    );
  }

  if (q.insight) {
    const qWords = keywords(q.q + " " + q.a);
    const iWords = keywords(q.insight);
    const overlap = [...qWords].some((w) => iWords.has(w));
    if (!overlap) {
      warnings.push(
        `[${q.c}] ${q.q}\n` +
        `    a: ${q.a}\n` +
        `    insight shares no keyword with the question or answer -- worth confirming it wasn't misassigned:\n` +
        `    i: ${q.insight}`
      );
    }
  }
}

/* ---- report ---- */

if (warnings.length) {
  console.warn(
    `\ncheck:questions -- ${warnings.length} item(s) worth a human look (not blocking):\n\n` +
    warnings.join("\n\n") + "\n"
  );
}

if (errors.length) {
  console.error(
    `\ncheck:questions -- ${errors.length} error(s) in lib/questions.js:\n\n` +
    errors.join("\n\n") + "\n"
  );
  process.exit(1);
}

console.log(
  `check:questions -- ${QUESTIONS.length} questions across ${CATEGORIES.length} categories, ` +
  `all structurally sound${warnings.length ? ` (${warnings.length} warning(s) above)` : ""}`
);
