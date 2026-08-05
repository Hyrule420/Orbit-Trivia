"use client";

import React from "react";

export default function MarsBody({ size = 200, dim = false }) {
  const marks = [
    { x: 24, y: 34, w: 26, h: 14, o: 0.3 }, { x: 56, y: 24, w: 20, h: 10, o: 0.22 },
    { x: 40, y: 58, w: 32, h: 18, o: 0.28 }, { x: 66, y: 66, w: 16, h: 12, o: 0.2 },
    { x: 18, y: 66, w: 14, h: 9, o: 0.24 },
  ];
  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 34% 30%, #FFB380 0%, #E8703C 32%, #C2481F 62%, #7E2A12 86%, #43150A 100%)",
        boxShadow: dim ? "none" : "0 0 60px #FF7A3D66, inset -14px -10px 40px #00000099",
        transition: "box-shadow .5s ease, filter .5s ease",
        filter: dim ? "saturate(.5) brightness(.6)" : "none",
      }}
    >
      {marks.map((m, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: `${m.w}%`,
            height: `${m.h}%`,
            background: "#5E2210",
            opacity: m.o,
            filter: "blur(3px)",
          }}
        />
      ))}
      <div
        className="absolute rounded-full"
        style={{ left: "30%", top: "-7%", width: "40%", height: "18%", background: "#FFF3E8", opacity: 0.82, filter: "blur(4px)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ left: "36%", bottom: "-5%", width: "28%", height: "13%", background: "#FFF3E8", opacity: 0.6, filter: "blur(4px)" }}
      />
    </div>
  );
}
