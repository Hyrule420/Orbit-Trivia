"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { sweepZones, distanceM, MAX_ACCURACY_M, MIN_MOVE_M, MIN_ELAPSED_MS } from "./geo";

/* ============================================================
   Watches the position stream and says "you just arrived at X".

   Takes positions in, calls onEnter(zone) out. It also reports the
   nearest zone at all times, which is what powers the ambient
   "Next up — Weeki Wachee, 4.2 mi" line. That readout is what keeps
   the mode feeling alive on the long empty stretches.
   ============================================================ */

export function useZoneWatcher({ pos, zones, skipIds, onEnter }) {
  const [nearest, setNearest] = useState(null);

  /* Which zones we are currently standing inside. A ref, not state:
     it changes on every GPS fix and must never trigger a render. */
  const insideRef = useRef(new Set());

  /* The last position we actually bothered to do the maths for. */
  const lastEvalRef = useRef(null);

  /* Keep the latest callback and skip-set in refs so that the effect
     below depends only on `pos`. Otherwise every parent re-render would
     re-run the sweep and zones could double-fire. */
  const onEnterRef = useRef(onEnter);
  const skipRef = useRef(skipIds);
  useEffect(() => { onEnterRef.current = onEnter; }, [onEnter]);
  useEffect(() => { skipRef.current = skipIds; }, [skipIds]);

  useEffect(() => {
    if (!pos || !zones?.length) return;

    /* Throw away rubbish fixes. Under an overpass a phone will report a
       position with half a kilometre of uncertainty, and letting that
       "enter" a zone is a coin flip. */
    if (pos.accuracyM > MAX_ACCURACY_M) return;

    /* Skip the maths entirely if we have barely moved and it has not
       been long. Keeps a parked car from re-checking every zone every
       second for no reason. */
    const last = lastEvalRef.current;
    if (last) {
      const moved = distanceM(last.lat, last.lng, pos.lat, pos.lng);
      const elapsed = pos.t - last.t;
      if (moved < MIN_MOVE_M && elapsed < MIN_ELAPSED_MS) return;
    }
    lastEvalRef.current = { lat: pos.lat, lng: pos.lng, t: pos.t };

    const { entered, nearest: n } = sweepZones(
      pos.lat, pos.lng, zones, insideRef.current, skipRef.current
    );

    setNearest(n);
    entered.forEach((zone) => onEnterRef.current?.(zone));
  }, [pos, zones]);

  /* Forget which zones we are "inside". Used when trip history is
     reset, so that standing in a zone can fire it again. */
  const resetInside = useCallback(() => {
    insideRef.current = new Set();
    lastEvalRef.current = null;
  }, []);

  return { nearest, resetInside };
}
