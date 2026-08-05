"use client";

import React from "react";
import { useC } from "../../lib/theme";

/* ============================================================
   SHARED UI
   ============================================================ */
export default function Starfield({ comets = true }) {
  const C = useC();
  const stars = React.useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: (i * 37.5) % 100,
        y: (i * 61.7) % 100,
        s: (i % 3) + 1,
        o: 0.15 + ((i * 13) % 40) / 100,
      })),
    []
  );

  /* Long cycles with a brief visible window, so a comet crosses every
     17-31s rather than streaming past constantly. */
  const trails = [
    { top: "8%", dur: 17, delay: 3 },
    { top: "26%", dur: 23, delay: 11 },
    { top: "54%", dur: 31, delay: 19 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, background: C.star, opacity: s.o }}
        />
      ))}

      {comets &&
        trails.map((t, i) => (
          <div
            key={`c-${i}`}
            className="absolute"
            style={{
              top: t.top,
              left: "-16%",
              width: 130,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${C.star})`,
              borderRadius: 2,
              filter: `drop-shadow(0 0 6px ${C.ion})`,
              opacity: 0,
              animation: `comet ${t.dur}s linear ${t.delay}s infinite`,
            }}
          />
        ))}
    </div>
  );
}
