"use client";

import React from "react";
import { useC } from "../../lib/theme";
import { SFX } from "../../lib/sfx";
import { buzz } from "../../lib/util";
import { StarshipBody, Falcon9Body, Plume, shipPalette } from "../StarshipCatch";
import { useTimeline } from "./fxTimeline";

/* ============================================================
   PAD IGNITION — the full-screen sequence for arriving at a pad
   something actually launches from.

   Driving past Launch Complex 39A should not feel like driving past a
   fishing village, so this is deliberately the loudest thing in the
   app: the ground lets go, a shock front crosses the screen, and a
   vehicle climbs out over the map.

   THREE THINGS IT IS NOT ALLOWED TO DO. The arrival pop-up next door
   promises that arriving is loud but answering is never rushed (see
   the header of ArrivalPopup.jsx), and this layer must not quietly
   break any of that:

     - It never takes a tap. `pointer-events: none` throughout, and it
       sits at z-30, underneath the pop-up's z-50 card. "Play it now"
       stays live for the whole sequence.
     - It never gates anything. The card's own eight-second drain runs
       on its own clock; this layer finishing early or late changes
       nothing about what happens to the question.
     - It never outlives the moment. Every timer is cleared on unmount
       (see fxTimeline.js) so leaving the map mid-launch takes the
       sequence with it.

   The sonic boom is at three seconds, not the sixty-odd it really
   takes to cross the water from Kennedy to US-1. A bang from a phone a
   minute after the card has gone is not a detail, it is a fright — and
   somebody in this mode may well be driving.
   ============================================================ */

/* Where the pad sits, measured up from the bottom of the screen. Clears
   the arrival card, so the climb happens across the map rather than
   behind the interface. */
const PAD_BOTTOM = 300;

const SHIP_H = 168;
const SHIP_W = (SHIP_H * 60) / 210;

const SMOKE = [0, 1, 2, 3, 4, 5, 6];
const STREAKS = [9, 23, 38, 54, 69, 84, 94];

export default function PadLaunchFX({ zone, tierColor, onDone }) {
  const C = useC();
  const P = shipPalette(C);
  const starship = zone.vehicle === "starship";

  useTimeline((at) => {
    /* Engines spool up first and the roar lands with the release, which
       is the order it happens in and also the order it reads in. */
    SFX.engineUp(0.5);
    SFX.rumble(1.9);
    at(150, () => buzz([30, 60, 30, 60, 120]));
    at(620, () => { SFX.engineOff(0.25); SFX.liftoff(true); });
    at(3000, () => { SFX.boom(false); buzz([60]); });
    at(4600, onDone);
  });

  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Everything that should feel the pad let go lives inside here.
          The shake is on this wrapper and nowhere higher: a transform on
          an ancestor of the arrival card would make this element the
          containing block for it, and the card — which is `fixed` —
          would jump. The map gets its own copy of the shake over in
          RoadTripScreen, for the same reason. */}
      <div
        className="nc-anim absolute inset-0"
        style={{ "--shake": 5, animation: "sc-groundshake 1.7s cubic-bezier(.2,.6,.4,1) .12s both" }}
      >
        {/* the flash the shock front puts across everything */}
        <div
          className="nc-anim absolute inset-0"
          style={{ background: C.star, animation: "sc-flash 1.3s ease-out .3s both" }}
        />

        {/* ignition bloom sitting on the pad */}
        <div
          className="nc-anim absolute"
          style={{
            left: "50%", bottom: PAD_BOTTOM - 40, width: 300, height: 150, marginLeft: -150,
            background: `radial-gradient(ellipse at 50% 100%, ${C.star} 0%, ${tierColor} 34%, transparent 72%)`,
            filter: "blur(22px)",
            animation: "edgepulse 2.4s ease-out both",
          }}
        />

        {/* the pressure wave going out across the map */}
        <div
          className="nc-anim absolute rounded-full"
          style={{
            left: "50%", bottom: PAD_BOTTOM - 340, width: 700, height: 700, marginLeft: -350,
            border: `3px solid ${tierColor}`,
            boxShadow: `0 0 40px ${tierColor}77, inset 0 0 40px ${tierColor}44`,
            animation: "sc-shock 1.6s cubic-bezier(.15,.75,.3,1) .34s both",
          }}
        />

        {/* the sky rushing past once it is really moving */}
        {STREAKS.map((x, i) => (
          <div
            key={`st-${i}`}
            className="nc-anim absolute"
            style={{
              left: `${x}%`, top: "-24%", width: 2, height: "36%",
              background: `linear-gradient(180deg, transparent, ${C.star})`,
              opacity: 0.45,
              animation: `skyfall 1.2s linear ${1.05 + i * 0.09}s both`,
            }}
          />
        ))}

        {/* pad smoke — thrown out at the base and left hanging there
            after the vehicle has gone, which is what sells that
            something very large just left */}
        {SMOKE.map((i) => (
          <div
            key={`sm-${i}`}
            className="nc-anim absolute rounded-full"
            style={{
              left: `calc(50% + ${(i - 3) * 40}px)`,
              bottom: PAD_BOTTOM - 60,
              width: 78 + (i % 3) * 30,
              height: 78 + (i % 3) * 30,
              background: `radial-gradient(circle, ${C.dim}77 0%, transparent 68%)`,
              filter: "blur(11px)",
              animation: `smokeout 3s ease-out ${0.5 + (i % 4) * 0.13}s both`,
            }}
          />
        ))}

        {/* THE VEHICLE.
            Two nested wrappers on purpose: the outer one owns the climb,
            the inner one the shudder against the hold-downs. Combining
            them into one transform would mean the shudder followed the
            vehicle up the screen instead of stopping at the pad. */}
        <div
          className="nc-anim absolute"
          style={{
            left: "50%", bottom: PAD_BOTTOM, marginLeft: -SHIP_W / 2,
            animation: "liftoff 2.9s cubic-bezier(.55,.02,.85,.4) both",
            willChange: "transform",
          }}
        >
          <div className="nc-anim" style={{ animation: "padshake .11s linear 0s 7" }}>
            <svg
              width={SHIP_W}
              height={SHIP_H}
              viewBox="0 0 60 210"
              fill="none"
              /* the plume is drawn well past y=210 and has to paint
                 outside the box, the same way it does on the home hero */
              style={{ overflow: "visible", display: "block", filter: `drop-shadow(0 0 20px ${tierColor}88)` }}
            >
              <g
                className="nc-anim"
                style={{
                  animation: "plume .14s ease-in-out infinite alternate",
                  transformBox: "fill-box",
                  transformOrigin: "50% 0%",
                }}
              >
                <Plume power={1} flicker={1} mix={1} alt={0} />
              </g>
              {starship ? <StarshipBody P={P} /> : <Falcon9Body P={P} />}
            </svg>
          </div>
        </div>
      </div>

      {/* The boom's own flash, outside the shake wrapper — by three
          seconds the ground has long stopped moving and only the sound
          is still arriving. */}
      <div
        className="nc-anim absolute inset-0"
        style={{ background: C.star, animation: "sc-flash .6s ease-out 3s both" }}
      />
    </div>
  );
}
