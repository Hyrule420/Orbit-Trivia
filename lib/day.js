/* ============================================================
   DAYS AND STREAKS
   All of this works off the player's local date, never UTC.
   ============================================================ */

export const todaySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};


/* Local-date key. Deliberately not toISOString(), which is UTC — that would
   roll the "day" over at a different moment than todaySeed() above, so a
   player could see tomorrow's questions while still marked done for today. */
export const dayKeyOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayKey = () => dayKeyOf(new Date());
export const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKeyOf(d);
};

/* A streak only counts if the last play was today or yesterday. Anything
   older is broken — reported as 0 without rewriting what's stored. */
export const liveDayStreak = (s) => {
  if (!s || !s.lastDate) return 0;
  return s.lastDate === todayKey() || s.lastDate === yesterdayKey() ? s.current : 0;
};

export const bumpDayStreak = (s) => {
  const today = todayKey();
  if (s.lastDate === today) return s;
  const current = s.lastDate === yesterdayKey() ? (s.current || 0) + 1 : 1;
  return { lastDate: today, current, best: Math.max(s.best || 0, current) };
};
