"use client";

import React from "react";
import { useC } from "../../lib/theme";
import { SFX } from "../../lib/sfx";
import { buzz } from "../../lib/util";
import { useTimeline } from "./fxTimeline";

/* ============================================================
   SEBASTIAN INLET — the wave.

   The sandbar on the north side of this inlet throws up the best wave
   in Florida, and the blurb for the zone says exactly that, so the
   arrival gets a set rolling through rather than a rocket.

   Ocean colours are hard-coded rather than themed, for the same reason
   the plume in StarshipCatch.jsx and the hazard strobes on the crawler
   are: water is not a brand accent. Running this through the Mars
   palette would produce a rust-coloured sea, which is a joke the rest
   of the pack has not earned.

   Same three rules as the launch and landing sequences (see the header
   of PadLaunchFX.jsx): never takes a tap, never gates the question,
   never outlives the screen.
   ============================================================ */

const BOTTOM = 300;
const RUN_MS = 5200;

/* Deep water through to the foam on the lip. Pitched bright rather
   than naturalistic: this plays over a near-black map at night, and a
   true deep-ocean blue simply disappears against it. */
const DEEP = "#0E4E78";
const MID = "#1B84B4";
const FACE = "#2FB8E0";
const CREST = "#9FE8F6";
const FOAM = "#F2FBFE";

/* Three sets, staggered, so it reads as surf rather than one lonely
   wave. The middle one is the biggest and carries the surfer. */
const SETS = [
  { delay: 0, h: 76, y: 0, op: 0.7 },
  { delay: 0.9, h: 116, y: -16, op: 1 },
  { delay: 2.1, h: 62, y: 12, op: 0.6 },
];

const SPRAY = [
  { sx: "-40px", sy: "-52px" },
  { sx: "-14px", sy: "-64px" },
  { sx: "16px", sy: "-56px" },
  { sx: "44px", sy: "-40px" },
  { sx: "-62px", sy: "-34px" },
];

/* One wave: a swell shape with a foaming lip, drawn wide enough to
   cross the screen without either end showing. */
function Wave({ h, opacity }) {
  const W = 620;
  return (
    <svg width={W} height={h + 40} viewBox={`0 0 ${W} ${h + 40}`} style={{ display: "block", overflow: "visible" }} opacity={opacity}>
      <defs>
        <linearGradient id={`sf-face-${h}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CREST} />
          <stop offset="38%" stopColor={FACE} />
          <stop offset="100%" stopColor={DEEP} />
        </linearGradient>
      </defs>

      {/* the body of the swell, peaking left of centre where it breaks */}
      <path
        d={`M0 ${h + 40}
            L0 ${h * 0.72}
            C ${W * 0.16} ${h * 0.66}, ${W * 0.26} ${h * 0.1}, ${W * 0.38} ${h * 0.06}
            C ${W * 0.5} ${h * 0.02}, ${W * 0.6} ${h * 0.42}, ${W * 0.74} ${h * 0.6}
            C ${W * 0.86} ${h * 0.74}, ${W * 0.94} ${h * 0.78}, ${W} ${h * 0.8}
            L ${W} ${h + 40} Z`}
        fill={`url(#sf-face-${h})`}
      />

      {/* the barrel: a darker scoop under the lip where it is throwing */}
      <path
        d={`M ${W * 0.3} ${h * 0.12}
            C ${W * 0.36} ${h * 0.3}, ${W * 0.4} ${h * 0.52}, ${W * 0.48} ${h * 0.6}
            C ${W * 0.4} ${h * 0.5}, ${W * 0.34} ${h * 0.32}, ${W * 0.3} ${h * 0.12} Z`}
        fill={MID}
        opacity="0.75"
      />

      {/* foam along the lip, and the whitewater trailing behind it */}
      <path
        d={`M ${W * 0.22} ${h * 0.3}
            C ${W * 0.3} ${h * 0.08}, ${W * 0.46} ${h * 0.0}, ${W * 0.56} ${h * 0.36}
            C ${W * 0.46} ${h * 0.14}, ${W * 0.32} ${h * 0.2}, ${W * 0.22} ${h * 0.3} Z`}
        fill={FOAM}
        opacity="0.95"
      />
      <ellipse cx={W * 0.12} cy={h * 0.74} rx={W * 0.14} ry="7" fill={FOAM} opacity="0.35" />
      <ellipse cx={W * 0.03} cy={h * 0.8} rx={W * 0.1} ry="5" fill={FOAM} opacity="0.22" />
    </svg>
  );
}

/* A surfer, tiny, mid-face. Just enough shape to read as a person on a
   board at this size — any more detail is lost. */
function Surfer({ color }) {
  return (
    <svg width="34" height="30" viewBox="0 0 34 30" style={{ display: "block", overflow: "visible" }}>
      <ellipse cx="17" cy="25" rx="15" ry="3.4" fill={FOAM} opacity="0.9" />
      <g fill={color}>
        {/* legs, crouched */}
        <path d="M12 24 L14 17 L17 17 L15 24 Z" />
        <path d="M21 24 L20 17 L23 17 L24 24 Z" />
        {/* torso leaning into the turn */}
        <path d="M14 18 L16 9 L21 9 L23 18 Z" />
        {/* head */}
        <circle cx="18.5" cy="6" r="3.2" />
        {/* trailing arm out for balance */}
        <path d="M21 11 L29 7 L30 9 L22 13 Z" />
      </g>
    </svg>
  );
}

export default function SurfFX({ onDone }) {
  const C = useC();

  useTimeline((at) => {
    SFX.wave(2.6);
    at(900, () => { SFX.wave(3.0); buzz([12, 60, 12]); });
    at(2400, () => SFX.wave(2.2));
    at(RUN_MS + 200, onDone);
  });

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* A wash of sea light under the whole thing, so the waves read as
          coming out of water rather than off a black background. */}
      <div
        className="nc-anim absolute inset-x-0"
        style={{
          bottom: BOTTOM - 60, height: 300,
          background: `linear-gradient(to top, ${DEEP}CC, ${MID}44 45%, transparent)`,
          animation: "edgepulse 5s ease-out both",
        }}
      />

      {SETS.map((set, i) => (
        <div
          key={i}
          className="nc-anim absolute"
          style={{
            bottom: BOTTOM + set.y, right: "-620px",
            animation: `sc-swell ${RUN_MS - i * 300}ms cubic-bezier(.35,.05,.5,1) ${set.delay}s both`,
            willChange: "transform",
          }}
        >
          <Wave h={set.h} opacity={set.op} />
        </div>
      ))}

      {/* Spray off the lip of the big one, timed to when it stands up. */}
      <div
        className="nc-anim absolute"
        style={{
          bottom: BOTTOM + 60, right: "38%",
          animation: `sc-swell ${RUN_MS - 300}ms cubic-bezier(.35,.05,.5,1) .9s both`,
        }}
      >
        {SPRAY.map((s, i) => (
          <span
            key={i}
            className="nc-anim absolute rounded-full"
            style={{
              width: 7, height: 7,
              background: FOAM,
              "--sx": s.sx,
              "--sy": s.sy,
              filter: "blur(1px)",
              animation: `sc-spray ${1.5 + i * 0.12}s ease-out ${1.5 + i * 0.09}s infinite`,
            }}
          />
        ))}
      </div>

      {/* The ride, on the face of the middle wave. */}
      <div
        className="nc-anim absolute"
        style={{
          bottom: BOTTOM + 52, right: "18%",
          animation: `sc-ride ${RUN_MS - 400}ms cubic-bezier(.3,.05,.5,1) 1.1s both`,
          filter: `drop-shadow(0 0 8px ${C.star}66)`,
          willChange: "transform",
        }}
      >
        <Surfer color={C.void} />
      </div>
    </div>
  );
}
