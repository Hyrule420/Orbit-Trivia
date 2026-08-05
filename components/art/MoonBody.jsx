"use client";

import React from "react";

/* ============================================================
   PLANETS — rendered in code, no image files
   ============================================================ */
export default function MoonBody({ size = 200, dim = false }) {
  const craters = [
    { x: 30, y: 26, r: 13 }, { x: 62, y: 40, r: 8 }, { x: 44, y: 62, r: 16 },
    { x: 72, y: 70, r: 6 }, { x: 22, y: 58, r: 7 }, { x: 55, y: 20, r: 5 },
    { x: 36, y: 82, r: 9 }, { x: 78, y: 30, r: 5 },
  ];
  return (
    <div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 33% 30%, #E9EDF3 0%, #C3CAD6 38%, #8B93A3 66%, #4A5163 88%, #2A2F3D 100%)",
        boxShadow: dim ? "none" : "0 0 60px #A9B4C880, inset -14px -10px 40px #00000099",
        transition: "box-shadow .5s ease, filter .5s ease",
        filter: dim ? "saturate(.5) brightness(.6)" : "none",
      }}
    >
      {craters.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: `${c.r}%`,
            height: `${c.r}%`,
            background: "radial-gradient(circle at 38% 32%, #6E7686 0%, #9AA2B0 55%, #C8CFD9 100%)",
            boxShadow: "inset 1px 2px 3px #00000055",
            opacity: 0.75,
          }}
        />
      ))}
    </div>
  );
}
