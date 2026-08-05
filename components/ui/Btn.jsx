"use client";

import React from "react";
import { useC } from "../../lib/theme";
import { SFX } from "../../lib/sfx";

export default function Btn({ children, onClick, variant = "primary", full, disabled, style: st }) {
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
      onClick={disabled ? undefined : (e) => { SFX.ui(); onClick && onClick(e); }}
      disabled={disabled}
      className={`px-5 py-3 text-sm active:scale-95 ${full ? "w-full" : ""}`}
      style={{ ...base, ...variants[variant], ...st }}
    >
      {children}
    </button>
  );
}
