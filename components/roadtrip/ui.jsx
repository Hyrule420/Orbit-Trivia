"use client";

import React from "react";
import { useC } from "../../lib/theme";

/* ============================================================
   Shared bits for the road trip screens.

   Btn and Panel used to be copied into this file. The reason was that
   the real Btn plays a sound on tap, and that sound came from a
   240-line audio engine defined in the middle of components/
   OrbitTrivia.jsx — importing one meant importing the other.

   The audio engine now lives in lib/sfx.js and the buttons live in
   components/ui/, so the copies are gone and the real components are
   re-exported here instead. Importers keep working unchanged:
   `import { Btn, Panel, Kicker, formatDistance } from "./ui"`.

   One behavioural difference to know about: the real Btn calls
   SFX.ui() on tap, so road trip buttons click now. The copies did not.
   ============================================================ */
export { default as Btn } from "../ui/Btn";
export { default as Panel } from "../ui/Panel";

/* A small all-caps mono label — the game uses this look everywhere for
   kickers like "TODAY ONLY" and "PASS AND PLAY". */
export function Kicker({ children, color, style: st }) {
  const C = useC();
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.18em",
        color: color || C.dim,
        ...st,
      }}
    >
      {children}
    </span>
  );
}

/* Distances read better in miles on a Florida road trip. */
export function formatDistance(metres) {
  const miles = metres / 1609.34;
  if (miles < 0.1) return "here";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
