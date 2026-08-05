"use client";

import React from "react";
import { useC } from "../../lib/theme";
import { LAUNCH, CRACK_PATH } from "./launch";

/* Rendered INSIDE a shard, so the shard's clip-path cuts the path down to
   that piece's own broken edge — and the glow travels with the piece.
   Each side shows half a stroke; when the pieces meet, the halves make one
   full-brightness seam, which is what reads as a weld. */
export default function CardCracks({ welding }) {
  const C = useC();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 pointer-events-none"
      style={{
        width: "100%",
        height: "100%",
        animation: welding
          ? `weldSeam ${LAUNCH.weldSec}s ease-out both`
          : "edgeCool .35s ease-out both",
      }}
    >
      {/* outer bloom, then the hot core — both straddle the fracture line */}
      <path d={CRACK_PATH} fill="none" stroke={C.ion} strokeWidth={7} opacity={0.5}
            vectorEffect="non-scaling-stroke" style={{ filter: "blur(3px)" }} />
      <path d={CRACK_PATH} fill="none" stroke={C.star} strokeWidth={3} opacity={0.75}
            vectorEffect="non-scaling-stroke" style={{ filter: "blur(1px)" }} />
      <path d={CRACK_PATH} fill="none" stroke="#FFFFFF" strokeWidth={1.4}
            vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
