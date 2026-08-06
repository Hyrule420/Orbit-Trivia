"use client";

import React from "react";
import { useC } from "../../lib/theme";
import { SFX } from "../../lib/sfx";
import { buzz } from "../../lib/util";
import { StarshipBody, Falcon9Body, shipPalette } from "../StarshipCatch";
import { useTimeline } from "./fxTimeline";

/* ============================================================
   ROLLOUT — the Vehicle Assembly Building and the Crawlerway.

   Nothing launches from either of these, so PadLaunchFX would be a
   lie there — but they are not "nothing happens here" zones either.
   The VAB is where a stack goes together, and the Crawlerway is
   *specifically* the road the crawler-transporter uses to drag it out
   to the pad at about a mile an hour. That is a real, distinct event,
   just a slow and unglamorous one, and it deserves its own tone rather
   than being folded into the launch sequence or left silent.

   So this is deliberately the quiet one: a crawler creeps across the
   screen carrying an upright vehicle, kicks up a little dust, and
   that's it. No shockwave, no boom, no shake beyond the single jolt of
   six million pounds starting to move. Restraint here is the point —
   it is what tells the crawlerway apart from the pads next to it.

   Same three rules as PadLaunchFX and BoosterLandingFX (see the header
   of PadLaunchFX.jsx for why): never takes a tap, never gates the
   question, never outlives the screen.
   ============================================================ */

const BOTTOM = 300;
const SHIP_H = 108;
const SHIP_W = (SHIP_H * 60) / 210;
const DECK_W = 118;
const CRAWL_MS = 4800;

const DUST = [-1, -0.55, 0, 0.55, 1];

function Crawler({ P }) {
  return (
    <svg width={DECK_W} height="34" viewBox="0 0 118 34" style={{ display: "block", overflow: "visible" }}>
      {/* the mobile launcher platform deck */}
      <rect x="4" y="10" width="110" height="10" rx="2" fill={P.towerDark} />
      <rect x="4" y="10" width="110" height="3" fill={P.tower} opacity="0.6" />
      {/* four tracked trucks, one under each corner of the deck */}
      {[6, 30, 82, 106].map((x) => (
        <g key={x}>
          <rect x={x} y="19" width="14" height="11" rx="2" fill={P.steelDark} />
          {[2, 5, 8, 11].map((dy) => (
            <line key={dy} x1={x + 1} y1={19 + dy} x2={x + 13} y2={19 + dy} stroke={P.void} strokeWidth="0.8" opacity="0.4" />
          ))}
        </g>
      ))}
    </svg>
  );
}

export default function CrawlerRolloutFX({ zone, tierColor, onDone }) {
  const C = useC();
  const P = shipPalette(C);
  const starship = zone.vehicle !== "falcon";

  useTimeline((at) => {
    SFX.rumble(CRAWL_MS / 1000 - 0.2);
    at(120, () => buzz([15, 40, 15]));
    at(CRAWL_MS + 250, onDone);
  });

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* One jolt as it starts moving, then still. A continuous shake for
          five seconds would fight the whole point of this being the calm
          one — see the file header. */}
      <div
        className="nc-anim absolute inset-0"
        style={{ "--shake": 1.3, animation: "sc-groundshake 1s cubic-bezier(.2,.6,.4,1) both" }}
      >
        <div
          className="nc-anim absolute"
          style={{
            bottom: BOTTOM, left: -DECK_W - 40,
            animation: `sc-crawl ${CRAWL_MS}ms linear both`,
            willChange: "transform",
          }}
        >
          <div className="relative" style={{ width: DECK_W, height: SHIP_H + 34 }}>
            {/* dust kicked from the treads, trailing at ground level so it
                rides along with the crawler rather than staying put */}
            {DUST.map((d, i) => (
              <div
                key={i}
                className="nc-anim absolute rounded-full"
                style={{
                  left: DECK_W / 2 - 20, bottom: -6,
                  width: 40, height: 20,
                  "--dx": `${d * 46}px`,
                  background: `radial-gradient(circle, ${C.dim}77 0%, transparent 70%)`,
                  filter: "blur(5px)",
                  animation: `sc-dust 1s ease-out ${i * 0.16}s infinite`,
                }}
              />
            ))}

            <Crawler P={P} />

            {/* the vehicle, standing on the deck — no plume, nothing
                lit, it is being carried, not flying */}
            <svg
              width={SHIP_W}
              height={SHIP_H}
              viewBox="0 0 60 210"
              fill="none"
              style={{
                position: "absolute", left: DECK_W / 2 - SHIP_W / 2, bottom: 24,
                overflow: "visible", display: "block",
                filter: `drop-shadow(0 0 10px ${tierColor}66)`,
              }}
            >
              {starship ? <StarshipBody P={P} /> : <Falcon9Body P={P} />}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
