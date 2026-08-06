"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   A one-shot timeline for the arrival sequences.

   Visual timing lives in CSS `animation-delay`, where the compositor
   owns it. This is only for the things CSS cannot do: firing a sound,
   buzzing the phone, and telling the parent the sequence is over.

   Two rules it exists to enforce:

     1. Every timer is cleared on unmount. These sequences run on a
        screen someone can leave at any moment — tapping "Play it now"
        unmounts the layer mid-flight — and a stray timeout would fire
        a sonic boom over the question card.
     2. It runs exactly once. The FX components are mounted with a
        `key` of the zone id, so a fresh arrival is a fresh mount; the
        empty dependency list is the point, not an oversight.
   ============================================================ */
export function useTimeline(run) {
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    const timers = [];
    const at = (ms, fn) => { timers.push(setTimeout(fn, ms)); };
    runRef.current(at);
    return () => timers.forEach(clearTimeout);
  }, []);
}
