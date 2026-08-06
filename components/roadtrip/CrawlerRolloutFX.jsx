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
   specifically the road the crawler-transporter uses to drag it out
   to the pad at about a mile an hour. That is a real, distinct event,
   just a slow and unglamorous one, and it deserves its own tone.

   So this is deliberately the quiet one: the whole rig creeps across
   the screen, lit up, and that is it. No shockwave, no boom, no shake
   beyond the single jolt of six million pounds starting to move.
   Restraint here is the point — it is what tells the crawlerway apart
   from the pads a few miles down the same road.

   What is actually on the deck, because the silhouette is most of the
   recognition: the mobile launcher is a tower riding alongside the
   vehicle, not just a flat platform, and the whole thing is covered in
   lights — amber strobes on the operator cabs at diagonal corners, red
   aviation beacons up the tower, floods washing the vehicle. A rollout
   is usually done overnight, and the lighting is the memorable part.

   Same three rules as PadLaunchFX and BoosterLandingFX (see the header
   of PadLaunchFX.jsx for why): never takes a tap, never gates the
   question, never outlives the screen.
   ============================================================ */

const BOTTOM = 300;

/* Everything scales off the vehicle. The rig reads as enormous only if
   the crawler under it is wide enough to look like it is straining. */
const SHIP_H = 150;
const SHIP_W = (SHIP_H * 60) / 210;
const DECK_W = 200;
const DECK_H = 46;          // the crawler drawing, deck plus trucks
const DECK_TOP = 32;        // deck surface, measured up from the ground
const TOWER_H = 172;
const CRAWL_MS = 5400;

const DUST = [-1, -0.6, -0.2, 0.2, 0.6, 1];

/* A hazard strobe is amber because that is what a hazard strobe is —
   the same reason the plume colours in StarshipCatch.jsx are hard-coded
   rather than themed. Using the palette here got them C.thrust, which
   is the success green, and a slow-moving six-million-pound vehicle
   does not warn you with a green light. */
const AMBER = "#FFB020";

/* ---------- the crawler-transporter ----------
   Four tracked trucks on hydraulic jacks under a deck, with an operator
   cab at diagonally opposite corners — that diagonal is real, and it is
   why the thing never looks symmetrical. */
function Crawler({ P, C }) {
  const trucks = [10, 52, 126, 168];
  return (
    <svg width={DECK_W} height={DECK_H} viewBox={`0 0 ${DECK_W} ${DECK_H}`} style={{ display: "block", overflow: "visible" }}>
      {/* the shadow it sits in */}
      <ellipse cx={DECK_W / 2} cy="44" rx={DECK_W * 0.52} ry="5" fill={P.void} opacity="0.55" />

      {/* tracked trucks */}
      {trucks.map((x) => (
        <g key={x}>
          <rect x={x} y="28" width="24" height="14" rx="3" fill={P.steelDark} />
          {/* individual track shoes — the detail that says "tracked", not "wheeled" */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={x + 1.5 + i * 3.1} y="29" width="2.2" height="12" rx="0.5" fill={P.void} opacity="0.42" />
          ))}
          <rect x={x} y="28" width="24" height="2" fill={P.tower} opacity="0.5" />
          {/* the jacking cylinders that keep the deck level up the ramp */}
          <rect x={x + 4} y="22" width="4" height="7" fill={P.tower} />
          <rect x={x + 16} y="22" width="4" height="7" fill={P.tower} />
        </g>
      ))}

      {/* deck */}
      <rect x="4" y="12" width={DECK_W - 8} height="11" rx="2" fill={P.towerDark} />
      <rect x="4" y="12" width={DECK_W - 8} height="3" rx="1.5" fill={P.tower} opacity="0.75" />
      {/* the flame hole through the middle of the platform */}
      <rect x={DECK_W / 2 - 16} y="13" width="32" height="9" fill={P.void} opacity="0.85" />

      {/* deck-edge marker lights */}
      {Array.from({ length: 11 }, (_, i) => (
        <circle key={i} cx={14 + i * 17} cy="13.5" r="1.4" fill={C.ion} opacity="0.85" />
      ))}

      {/* operator cabs, diagonally opposite */}
      {[{ x: 6, cls: "" }, { x: DECK_W - 24, cls: " cr-b" }].map(({ x, cls }) => (
        <g key={x}>
          <rect x={x} y="1" width="18" height="11" rx="2" fill={P.tower} />
          <rect x={x + 2} y="3" width="14" height="5" rx="1" fill={C.ion} opacity="0.45" />
          {/* amber strobe on the cab roof */}
          <circle className={`cr-beacon${cls}`} cx={x + 9} cy="0" r="2.6" fill={AMBER} />
          <circle className={`cr-beacon${cls}`} cx={x + 9} cy="0" r="7" fill={AMBER} opacity="0.4"
                  style={{ filter: "blur(3.5px)" }} />
        </g>
      ))}
    </svg>
  );
}

/* ---------- the mobile launcher tower ----------
   This is what actually rides out with the vehicle, and it is the half
   of the silhouette people recognise. Lattice, crown, and a stack of
   red aviation beacons up the mast. */
function LauncherTower({ P, C }) {
  const W = 30;
  const H = TOWER_H;
  const bays = 9;
  const bayH = (H - 14) / bays;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      {/* legs */}
      <rect x="3" y="8" width="5" height={H - 8} fill={P.tower} />
      <rect x={W - 8} y="8" width="5" height={H - 8} fill={P.tower} />
      <rect x="8" y="8" width={W - 16} height={H - 8} fill={P.towerDark} opacity="0.55" />

      {/* lattice */}
      <g stroke={P.tower} strokeWidth="1.3" opacity="0.85" fill="none">
        {Array.from({ length: bays }, (_, i) => {
          const y = 8 + i * bayH;
          return (
            <React.Fragment key={i}>
              <line x1="5" y1={y} x2={W - 5} y2={y} />
              <line x1={i % 2 ? 5 : W - 5} y1={y} x2={i % 2 ? W - 5 : 5} y2={y + bayH} />
            </React.Fragment>
          );
        })}
      </g>

      {/* crew access arm reaching toward the vehicle */}
      <rect x="-14" y={H * 0.3} width="16" height="5" rx="1.5" fill={P.tower} />
      <rect x="-16" y={H * 0.3 - 3} width="6" height="11" rx="1.5" fill={P.steelDark} />

      {/* floodlight housings — the source the beams come out of, so the
          light on the vehicle has somewhere to have come from */}
      {[H * 0.3, H * 0.62].map((y, i) => (
        <g key={i}>
          <rect x="-4" y={y - 4} width="7" height="8" rx="1.5" fill={P.steelDark} />
          <circle className="cr-flood" cx="-4" cy={y} r="3" fill={C.star} opacity="0.9" />
          <circle className="cr-flood" cx="-4" cy={y} r="8" fill={C.star} opacity="0.28"
                  style={{ filter: "blur(4px)" }} />
        </g>
      ))}

      {/* crown and mast */}
      <rect x="0" y="2" width={W} height="7" rx="1.5" fill={P.tower} />
      <rect x={W / 2 - 1} y="-12" width="2" height="14" fill={P.tower} />

      {/* red aviation beacons up the mast, alternating so the tower
          reads as blinking rather than pulsing as one block */}
      {[-12, H * 0.22, H * 0.5, H * 0.78].map((y, i) => (
        <g key={i} className={`cr-beacon${i % 2 ? " cr-b" : ""}`}>
          <circle cx={W / 2} cy={y} r="2.2" fill={C.abort} />
          <circle cx={W / 2} cy={y} r="5.5" fill={C.abort} opacity="0.35" style={{ filter: "blur(2.5px)" }} />
        </g>
      ))}
    </svg>
  );
}

export default function CrawlerRolloutFX({ zone, tierColor, onDone }) {
  const C = useC();
  const P = shipPalette(C);
  const starship = zone.vehicle !== "falcon";
  const RIG_H = DECK_TOP + Math.max(SHIP_H, TOWER_H);

  useTimeline((at) => {
    SFX.rumble(CRAWL_MS / 1000 - 0.3);
    at(120, () => buzz([15, 40, 15]));
    at(CRAWL_MS + 250, onDone);
  });

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* No apostrophes, quotes or angle brackets in here — see the
          header of components/GlobalStyles.jsx and the build guard in
          scripts/check-styles.mjs. */}
      <style>{`
        @keyframes cr-beacon { 0%, 100% { opacity: .2; } 50% { opacity: 1; } }
        .cr-beacon { animation: cr-beacon 1.15s ease-in-out infinite; }
        .cr-beacon.cr-b { animation-delay: .58s; }
        @keyframes cr-flood { 0%, 100% { opacity: .42; } 50% { opacity: .62; } }
        .cr-flood { animation: cr-flood 2.6s ease-in-out infinite; }
        @keyframes cr-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
        .cr-bob { animation: cr-bob 1.9s ease-in-out infinite; }
        html[data-motion=off] .cr-beacon,
        html[data-motion=off] .cr-flood,
        html[data-motion=off] .cr-bob { animation: none !important; }
      `}</style>

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
            bottom: BOTTOM, left: -DECK_W - 60,
            animation: `sc-crawl ${CRAWL_MS}ms linear both`,
            willChange: "transform",
          }}
        >
          {/* the rig rocks very slightly as it goes, which is what stops
              it reading as a sticker sliding across the screen */}
          <div className="cr-bob relative" style={{ width: DECK_W, height: RIG_H }}>

            {/* floodlight wash coming up off the deck onto the vehicle */}
            <div
              className="cr-flood absolute"
              style={{
                left: DECK_W * 0.06, bottom: DECK_TOP - 8,
                width: DECK_W * 0.86, height: RIG_H * 0.7,
                background: `radial-gradient(ellipse at 45% 100%, ${tierColor}66 0%, ${tierColor}22 45%, transparent 74%)`,
                filter: "blur(14px)",
              }}
            />

            {/* Two floodlights on the tower, thrown across at the vehicle.
                A rollout is done overnight and this is the shot everybody
                knows: the stack picked out of the dark by the pad lights.
                Clipped into wedges so they read as beams with a source
                rather than as a general glow. */}
            {[
              { top: RIG_H * 0.30, spread: 34 },
              { top: RIG_H * 0.62, spread: 26 },
            ].map((beam, i) => (
              <div
                key={i}
                className="cr-flood absolute"
                style={{
                  left: DECK_W * 0.20,
                  top: beam.top,
                  width: DECK_W * 0.52,
                  height: beam.spread * 2.4,
                  background: `linear-gradient(270deg, ${C.star}4D 0%, ${tierColor}26 45%, transparent 85%)`,
                  clipPath: "polygon(100% 38%, 100% 62%, 0% 100%, 0% 0%)",
                  filter: "blur(5px)",
                  animationDelay: `${i * 0.9}s`,
                }}
              />
            ))}

            {/* dust rolling off the treads */}
            {DUST.map((d, i) => (
              <div
                key={i}
                className="nc-anim absolute rounded-full"
                style={{
                  left: DECK_W / 2 - 26, bottom: -8,
                  width: 52, height: 24,
                  "--dx": `${d * 74}px`,
                  background: `radial-gradient(circle, ${C.dim}88 0%, transparent 70%)`,
                  filter: "blur(6px)",
                  animation: `sc-dust 1.2s ease-out ${i * 0.17}s infinite`,
                }}
              />
            ))}

            {/* the tower, standing behind the vehicle on the same deck */}
            <div style={{ position: "absolute", left: DECK_W * 0.66, bottom: DECK_TOP }}>
              <LauncherTower P={P} C={C} />
            </div>

            {/* the vehicle: carried, not flying, so nothing is lit under it */}
            <svg
              width={SHIP_W}
              height={SHIP_H}
              viewBox="0 0 60 210"
              fill="none"
              style={{
                position: "absolute", left: DECK_W * 0.3 - SHIP_W / 2, bottom: DECK_TOP,
                overflow: "visible", display: "block",
                filter: `drop-shadow(0 0 14px ${tierColor}55)`,
              }}
            >
              {starship ? <StarshipBody P={P} /> : <Falcon9Body P={P} />}
            </svg>

            {/* crawler last, so the deck reads in front of the skirt and
                the vehicle looks like it is standing down inside it */}
            <div style={{ position: "absolute", left: 0, bottom: 0 }}>
              <Crawler P={P} C={C} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
