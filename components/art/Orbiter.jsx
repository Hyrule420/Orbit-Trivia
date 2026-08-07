"use client";

import React from "react";
import { StarshipBody, shipPalette } from "../StarshipCatch";

/* ============================================================
   SOMETHING IN ORBIT.

   A craft going round a planet on the chooser screen. It is drawn
   twice — once above the planet and once below it — and the two
   copies hand the pass between them halfway round, so it crosses in
   front of the disc coming toward you and is properly hidden behind it
   going away. One copy with a clever z-index would not do this: you
   cannot occlude with z-index alone once a transform is involved.

   Which craft goes where is not arbitrary. Apollo is the only thing
   that has ever carried people around the Moon, and Starship is what
   is being built to reach Mars, so each planet gets the vehicle that
   actually belongs to it.
   ============================================================ */

/* Apollo: service module, command module cone, and the high-gain dish
   on its boom. Tiny, so this is a silhouette rather than a model. */
function ApolloCSM({ C }) {
  return (
    <svg width="34" height="16" viewBox="0 0 68 32" style={{ display: "block", overflow: "visible" }}>
      {/* the engine bell at the back */}
      <path d="M2 16 L11 10 L11 22 Z" fill="#7E8798" />
      {/* service module */}
      <rect x="10" y="9" width="34" height="14" rx="1.5" fill="#C7CDD3" />
      <rect x="10" y="9" width="34" height="4" fill="#FFFFFF" opacity="0.35" />
      {/* command module, blunt cone forward */}
      <path d="M44 9 L58 14 L58 18 L44 23 Z" fill="#E4E9F1" />
      <path d="M58 14 L63 15.5 L63 16.5 L58 18 Z" fill="#8A93A0" />
      {/* high-gain antenna on its boom */}
      <line x1="20" y1="23" x2="16" y2="30" stroke="#8A93A0" strokeWidth="1.2" />
      <ellipse cx="15" cy="30.5" rx="4.5" ry="2" fill="#AAB3C1" />
      {/* a light so it reads as a craft and not a speck */}
      <circle cx="47" cy="16" r="1.8" fill={C.ion} />
    </svg>
  );
}

export default function Orbiter({ kind, C, size, rx, ry, seconds = 26, delay = 0 }) {
  const craft =
    kind === "starship" ? (
      <svg width="14" height="42" viewBox="0 0 60 210" style={{ display: "block", overflow: "visible" }}>
        <g transform="rotate(90 30 105)">
          <StarshipBody P={shipPalette(C)} />
        </g>
      </svg>
    ) : (
      <ApolloCSM C={C} />
    );

  /* Both copies run the identical orbit; only their stacking and which
     half of the cycle they are visible for differ. */
  const path = {
    "--rx": `${rx}px`,
    "--ry": `${ry}px`,
    animation: `pl-orbit ${seconds}s linear ${delay}s infinite`,
    willChange: "transform",
  };

  const Half = ({ front }) => (
    <div
      className="pl-anim absolute"
      style={{
        left: "50%", top: "50%",
        marginLeft: -17, marginTop: -12,
        zIndex: front ? 3 : 1,
        ...path,
      }}
    >
      <div
        className="pl-anim"
        style={{
          animation: `${front ? "pl-orb-front" : "pl-orb-back"} ${seconds}s step-end ${delay}s infinite`,
          filter: `drop-shadow(0 0 6px ${C.ion}88)`,
          /* the far half sits a little smaller, which is most of what
             sells one side of the orbit as further away than the other */
          transform: front ? "scale(1)" : "scale(.78)",
          opacity: front ? 1 : 0.85,
        }}
      >
        {craft}
      </div>
    </div>
  );

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: 0, top: 0, width: size, height: size }}
      aria-hidden="true"
    >
      <Half front={false} />
      <Half front />
    </div>
  );
}
