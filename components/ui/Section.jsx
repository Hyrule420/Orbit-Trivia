"use client";

import React from "react";
import { useC } from "../../lib/theme";

export default function Section({ label, children }) {
  const C = useC();
  return (
    <div className="mb-6">
      <div className="mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: "0.18em" }}>
        {label}
      </div>
      {children}
    </div>
  );
}
