import { TIER_ORDER } from "./spread.js";

/* ============================================================
   PLAYER SKILL
   One profile per device. Daily, solo Adaptive Crew, and Escape
   write into it; First Orbit and pass-and-play friends do not,
   so a tutorial or a buddy in the passenger seat cannot yank
   the mix around.

   Adaptive reads this. Daily never does.
   ============================================================ */

const SKILL_KEY = "orbit:skill";

export function emptySkill() {
  return {
    byTier: {
      Earthbound: { right: 0, total: 0 },
      Orbit: { right: 0, total: 0 },
      Martian: { right: 0, total: 0 },
    },
    byCat: {},
    seen: 0,
  };
}

export function parseSkill(raw) {
  const base = emptySkill();
  if (!raw || typeof raw !== "object") return base;
  for (const tier of TIER_ORDER) {
    const row = raw.byTier?.[tier];
    if (row && Number.isFinite(row.right) && Number.isFinite(row.total)) {
      base.byTier[tier] = {
        right: Math.max(0, row.right | 0),
        total: Math.max(0, row.total | 0),
      };
    }
  }
  if (raw.byCat && typeof raw.byCat === "object") {
    for (const [cat, row] of Object.entries(raw.byCat)) {
      if (row && Number.isFinite(row.right) && Number.isFinite(row.total)) {
        base.byCat[cat] = {
          right: Math.max(0, row.right | 0),
          total: Math.max(0, row.total | 0),
        };
      }
    }
  }
  base.seen = Math.max(0, raw.seen | 0);
  return base;
}

export function applyAnswers(skill, answers) {
  const next = parseSkill(skill);
  if (!Array.isArray(answers) || !answers.length) return next;
  for (const a of answers) {
    if (!a || !TIER_ORDER.includes(a.d)) continue;
    const ok = !!a.ok;
    next.byTier[a.d].total += 1;
    if (ok) next.byTier[a.d].right += 1;
    if (a.c) {
      if (!next.byCat[a.c]) next.byCat[a.c] = { right: 0, total: 0 };
      next.byCat[a.c].total += 1;
      if (ok) next.byCat[a.c].right += 1;
    }
    next.seen += 1;
  }
  return next;
}

/* Smoothed rate so one miss on a new tier doesn't slam the mix. */
export function tierRate(skill, tier) {
  const row = skill?.byTier?.[tier] || { right: 0, total: 0 };
  return (row.right + 1) / (row.total + 2);
}

export function catRate(skill, cat) {
  const row = skill?.byCat?.[cat] || { right: 0, total: 0 };
  return (row.right + 1) / (row.total + 2);
}

export function tierPct(skill, tier) {
  const row = skill?.byTier?.[tier];
  if (!row || !row.total) return null;
  return Math.round((100 * row.right) / row.total);
}

export const SKILL_STORAGE_KEY = SKILL_KEY;
