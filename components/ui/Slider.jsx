"use client";

import React from "react";
import { useC } from "../../lib/theme";

export default function Slider({ value, min, max, step, onChange, suffix }) {
  const C = useC();
  const steps = [];
  for (let i = min; i <= max; i += step) steps.push(i);
  return (
    <div className="flex gap-2">
      {steps.map((s) => {
        const on = value === s;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="flex-1 py-3 rounded-xl active:scale-95"
            style={{
              background: on ? `${C.ion}18` : C.hullLight,
              border: `1px solid ${on ? C.ion : C.edge}`,
              color: on ? C.ion : C.dim,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: 14,
              transition: "all .18s",
            }}
          >
            {s}{suffix}
          </button>
        );
      })}
    </div>
  );
}
