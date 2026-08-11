"use client";

import { useEffect } from "react";

/* ============================================================
   Registers the offline shell worker -- production only.

   public/sw.js does not exist as real content until a production
   build has run: scripts/postbuild-sw.mjs generates it from that
   build's own asset list after next build finishes. next dev never
   runs that step, so registering here in dev would either 404 or,
   worse, pick up a stale worker left over from a previous production
   build served out of the same public/ folder. The NODE_ENV check is
   the entire guard; nothing else needs special-casing.

   Offline support is a bonus, never a requirement -- a failed
   registration is swallowed rather than surfaced, the same way a
   missing AudioContext never blocks the game in lib/sfx.js.
   ============================================================ */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
