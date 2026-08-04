/* ============================================================
   Small shared helpers.

   These moved out of components/OrbitTrivia.jsx so the road trip
   screen can use them without importing the whole game component.
   ============================================================ */

/* Fisher-Yates shuffle. Passing the same `seed` always gives the same
   order back — that is how the Daily Challenge shows everyone the same
   ten questions. Leave `seed` out for a genuinely random shuffle. */
export const shuffle = (arr, seed) => {
  const a = [...arr];
  let s = seed ?? Math.floor(Math.random() * 100000);
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* Real vibration where the browser exposes it (mainly Android Chrome).
   iOS Safari has no Vibration API at all, so this silently no-ops there —
   callers pair it with a visual pulse so something always happens. */
export const buzz = (pattern) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) { /* unsupported or blocked — the visual pulse still carries it */ }
};
