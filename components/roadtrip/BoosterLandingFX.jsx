"use client";

import React, { useState } from "react";
import { useC } from "../../lib/theme";
import { SFX } from "../../lib/sfx";
import { buzz } from "../../lib/util";
import { Falcon9Body, Plume, shipPalette } from "../StarshipCatch";
import { useTimeline } from "./fxTimeline";

/* ============================================================
   BOOSTER RETURN — Landing Zones 1 & 2.

   The other half of the pad sequence, run backwards. A booster comes
   down out of the top of the screen still canted over from the entry,
   flips upright, lights one engine, and sets down in its own dust.

   On a "Heavy" day two of them come home a fraction apart, which is
   the whole reason the double sonic boom exists — see heavyDay() in
   lib/day.js for why that is derived from the date rather than stored.

   Same three promises as PadLaunchFX: never takes a tap, never gates
   the question, never outlives the screen. The comment at the top of
   that file explains why those matter.
   ============================================================ */

const PAD_BOTTOM = 300;

const SHIP_H = 150;
const SHIP_W = (SHIP_H * 60) / 210;

/* How far apart the pair sit. LZ-1 and LZ-2 are two separate circles of
   concrete a few hundred metres apart, so they should not overlap. */
const HEAVY_SPREAD = 52;

const DUST = [-1, -0.6, -0.25, 0.25, 0.6, 1];

export default function BoosterLandingFX({ tierColor, heavy = false, onDone }) {
  const C = useC();
  const P = shipPalette(C);

  /* Grid fins and legs are geometry, not CSS, so they are flipped by
     state at the right moment and transition themselves into place —
     the transitions live on the shapes inside Falcon9Body. */
  const [fins, setFins] = useState(0);
  const [legs, setLegs] = useState(0);
  const [entry, setEntry] = useState(0.85);

  const boosters = heavy ? [-HEAVY_SPREAD, HEAVY_SPREAD] : [0];

  useTimeline((at) => {
    at(220, () => setFins(1));
    at(1300, () => setEntry(0));
    at(1500, () => SFX.rumble(1.1));
    at(1850, () => setLegs(1));
    /* Touchdown. The buzz is the only part of this a phone in a pocket
       would notice, and on iOS there is no vibration API at all, so the
       dust and the shake have to carry it on their own. */
    at(2450, () => buzz(heavy ? [50, 40, 90, 60, 90] : [50, 40, 90]));
    at(2900, () => SFX.boom(heavy));
    at(4200, onDone);
  });

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* The touchdown knock. Much shorter and lighter than a launch —
          a booster landing is a thump, not the ground letting go. Same
          containing-block rule as PadLaunchFX: this transform stays
          inside the fixed layer and never wraps the arrival card. */}
      <div
        className="nc-anim absolute inset-0"
        style={{ "--shake": 3, animation: "sc-groundshake .9s cubic-bezier(.2,.6,.4,1) 2.42s both" }}
      >
        {boosters.map((dx, i) => (
          <div
            key={dx}
            className="nc-anim absolute"
            style={{
              left: "50%", bottom: PAD_BOTTOM, marginLeft: dx - SHIP_W / 2,
              animation: `sc-descend 2.5s cubic-bezier(.5,.04,.55,.98) ${i * 0.18}s both`,
              willChange: "transform",
            }}
          >
            {/* the flip, hinged around the middle of the vehicle */}
            <div
              className="nc-anim"
              style={{
                "--cant": `${dx < 0 ? -34 : 34}deg`,
                animation: `sc-flip 1.05s cubic-bezier(.3,.8,.3,1) ${0.75 + i * 0.18}s both`,
                transformOrigin: "50% 55%",
              }}
            >
              <svg
                width={SHIP_W}
                height={SHIP_H}
                viewBox="0 0 60 210"
                fill="none"
                style={{ overflow: "visible", display: "block", filter: `drop-shadow(0 0 14px ${tierColor}66)` }}
              >
                {/* The landing burn — one centre engine, not nine. Held
                    at sea level so the shock diamonds stay hard, which is
                    what a single Merlin at full throttle in thick air
                    actually looks like. */}
                <g
                  className="nc-anim"
                  style={{
                    animation: `sc-burn 1.5s ease-out ${1.25 + i * 0.18}s both`,
                    transformBox: "fill-box",
                    transformOrigin: "50% 0%",
                  }}
                >
                  <Plume power={0.42} flicker={1} mix={0.25} alt={0} />
                </g>
                <Falcon9Body P={P} fins={fins} legs={legs} reentry={entry} />
              </svg>
            </div>
          </div>
        ))}

        {/* Dust and steam thrown outward across the pad. Sideways rather
            than upward — the exhaust has nowhere else to send it. */}
        {boosters.map((bx) =>
          DUST.map((d, i) => (
            <div
              key={`${bx}-${i}`}
              className="nc-anim absolute rounded-full"
              style={{
                left: "50%", bottom: PAD_BOTTOM - 34,
                marginLeft: bx - 30,
                width: 60, height: 42,
                "--dx": `${d * 120}px`,
                background: `radial-gradient(circle, ${C.dim}88 0%, transparent 70%)`,
                filter: "blur(9px)",
                animation: `sc-dust 1.9s cubic-bezier(.1,.7,.3,1) ${2.42 + Math.abs(d) * 0.06}s both`,
              }}
            />
          ))
        )}

        {/* the concrete lighting up under the burn */}
        <div
          className="nc-anim absolute"
          style={{
            left: "50%", bottom: PAD_BOTTOM - 44, width: 260, height: 80, marginLeft: -130,
            background: `radial-gradient(ellipse at 50% 100%, ${tierColor}CC 0%, transparent 70%)`,
            filter: "blur(16px)",
            animation: "edgepulse 1.9s ease-out 1.4s both",
          }}
        />
      </div>

      {/* The boom, arriving after it is already down. */}
      <div
        className="nc-anim absolute inset-0"
        style={{ background: C.star, animation: "sc-flash .55s ease-out 2.9s both" }}
      />
      {heavy && (
        <div
          className="nc-anim absolute inset-0"
          style={{ background: C.star, animation: "sc-flash .55s ease-out 3.28s both" }}
        />
      )}
    </div>
  );
}
