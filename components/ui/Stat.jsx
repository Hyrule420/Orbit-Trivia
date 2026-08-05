"use client";

import React from "react";
import { useC } from "../../lib/theme";

export default function Stat({ icon, label, value, color }) {
  const C = useC();
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: C.star }}>{value}</div>
    </div>
  );
}
