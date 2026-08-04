"use client";

import React from "react";
import { useC } from "../../lib/theme";

/* ============================================================
   Local copies of the game's Btn and Panel.

   Why copies instead of importing the originals? The original Btn in
   components/OrbitTrivia.jsx plays a sound on every tap, and that sound
   comes from a 240-line audio engine defined in the middle of that same
   file. Pulling Btn out would mean pulling the audio engine out too,
   which is a much bigger and riskier change than copying forty lines of
   styling.

   If you ever do extract the audio engine to its own file, delete this
   file and import the real ones instead. Until then: if you restyle the
   buttons in OrbitTrivia.jsx, restyle them here too.
   ============================================================ */

export function Btn({ children, onClick, variant = "primary", full, disabled, style: st }) {
  const C = useC();
  const base = {
    fontFamily: "'Chakra Petch', system-ui, sans-serif",
    fontWeight: 600,
    letterSpacing: "0.04em",
    borderRadius: 14,
    transition: "transform .12s ease, box-shadow .2s ease, opacity .2s ease",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
  };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${C.ion}, ${C.plasma})`, color: C.void, boxShadow: `0 0 24px ${C.ion}44` },
    ghost: { background: "transparent", color: C.star, border: `1px solid ${C.edge}` },
    solid: { background: C.hullLight, color: C.star, border: `1px solid ${C.edge}` },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`px-5 py-3 text-sm active:scale-95 ${full ? "w-full" : ""}`}
      style={{ ...base, ...variants[variant], ...st }}
    >
      {children}
    </button>
  );
}

export function Panel({ children, style: st, className = "" }) {
  const C = useC();
  return (
    <div className={`rounded-2xl ${className}`} style={{ background: C.hull, border: `1px solid ${C.edge}`, ...st }}>
      {children}
    </div>
  );
}

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
