"use client";

import React from "react";
import { SFX } from "../../lib/sfx";
import { buzz } from "../../lib/util";
import { useTimeline } from "./fxTimeline";

/* ============================================================
   CRYSTAL RIVER ARCHAEOLOGICAL STATE PARK -- the mound, rising.

   This is a real, sacred pre-Columbian site -- a National Historic
   Landmark, not a theme-park subject -- so the sequence stays inside
   what the zone's own blurb and question actually say: temple mounds,
   burial mounds, a plaza, roughly sixteen hundred years of use, built
   basket by basket from shell and earth. Nothing here invents a tribal
   name, a ceremony, or any cultural specific beyond that text. The
   carriers are deliberately anonymous silhouettes with no face and no
   invented regalia. No boom, no bright flash finale -- this is a quiet
   accumulation, not a spectacle.

   Second pass. The first version was too quiet in the wrong ways: the
   carriers were small and nearly the same colour as the ground behind
   them, the moment a load landed and the moment the mound grew were
   two unrelated things happening near each other rather than one
   visible event, and the sun racing past three times had nothing
   telling a first-time viewer it meant "years," not "a ball moving."
   This pass fixes exactly those three things, plus slows the whole
   thing down to three beats instead of four waves crossed with three
   independent sun passes:

     - Carriers are bigger, fewer per beat, and coloured to actually
       stand out from both the sky and the ground.
     - Every deposit and every mound-growth step are driven off the
       same DEPOSIT timestamp and land at the same point on screen --
       a glow marks the spot, and that is where the new band appears.
     - The sky itself now visibly dips toward dusk and back on each
       pass, which reads as time passing on its own; a single caption
       up front, gone before the first beat starts, names what that
       device means once rather than narrating every cycle of it. That
       caption is the one deliberate exception to this component
       family's usual no-narration rule, made because the thing it
       fixes is specifically "a viewer who cannot tell what this is."

   Same three rules as every other sequence here: never takes a tap,
   never gates the question, never outlives the screen.
   ============================================================ */

const SKY_TOP = "#F0E2C4";
const SKY_HORIZON = "#C99A5E";
const DUSK_TOP = "#8C5A3E";
const DUSK_HORIZON = "#4A3020";
const SUN = "#F3C267";
const GROUND = "#B79A6B";
const GROUND_SHADOW = "#8E7148";

const SHELL = "#E6DBC3";
const SHELL_DARK = "#C9B98E";
const EARTH = "#7A5A3A";
const EARTH_DARK = "#5A3F27";

/* The darkest value in the whole palette, chosen so a carrier stands
   out against both the pale sky and the mid-tone ground instead of
   blending into EARTH_DARK the way the first pass did. */
const CARRIER = "#2E1D10";
/* A sunlit rim along the back -- ties each figure to the day/night
   cycle rather than sitting flat against it. */
const CARRIER_RIM = "#F0C88B";
/* Warm terracotta, the brightest thing on any figure, because the
   basket is the actual subject of this whole sequence. */
const BASKET = "#E0793C";

/* Three beats, not four waves crossed with three independent sun
   passes -- one thread at a time, spelled out rather than computed,
   same reasoning as every other timeline in this folder. */
const CAPTION_AT = 0;
const CAPTION_DUR = 1000;

const BEATS = [
  { key: "b1", delay: 1400, dur: 1300, count: 2, scale: 1 },
  { key: "b2", delay: 3200, dur: 1300, count: 3, scale: 1 },
  { key: "b3", delay: 5000, dur: 1400, count: 3, scale: 1.15 },
];
/* One deposit per beat, at the moment its walk-and-arrive finishes.
   Drives both the ground glow and the mound's next growth step off
   the same numbers, so the two can never drift apart. */
const DEPOSIT = BEATS.map((b) => b.delay + b.dur);

/* 1:1 with BEATS now, not staggered on their own separate clock. */
const ARCS = BEATS.map((b) => ({ key: b.key, delay: b.delay, dur: b.dur }));

const SETTLE_AT = DEPOSIT[2];
/* Learned from the sponge-diver piece: an ending fact needs real room
   after it fades in, not just enough to appear. */
const FACT_AT = SETTLE_AT + 300;
const DONE_AT = FACT_AT + 1400;

/* ---------- the carrier ----------

   Bigger than the first pass (34x54 against 18x30), and simplified to
   four shapes instead of five: the two leg slivers are fused into one
   base so the silhouette survives shrinking, and the rim stroke along
   the shoulder is what reads as "lit from the same sun that is racing
   overhead" rather than a flat cutout. */
function Carrier() {
  return (
    <svg width="34" height="54" viewBox="0 0 34 54" style={{ display: "block", overflow: "visible" }}>
      {/* base -- both legs as one mass, no articulation */}
      <path d="M8 46 L6 54 L20 54 L18 46 Z" fill={CARRIER} />
      {/* the stoop -- leaning into the load is what reads as weight */}
      <path
        d="M7 47 C 5 36, 9 23, 18 16 C 23 13, 27 14, 25 20 C 20 23, 14 32, 16 47 Z"
        fill={CARRIER}
      />
      {/* the sunlit rim, traced along the same back edge */}
      <path
        d="M25 20 C 20 23, 14 32, 16 47"
        fill="none"
        stroke={CARRIER_RIM}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* head, tucked low rather than upright */}
      <circle cx="22" cy="14" r="4.6" fill={CARRIER} />
      {/* the basket, carried low at the back -- the brightest shape here */}
      <path d="M5 31 L16 27 L18 38 L7 41 Z" fill={BASKET} />
    </svg>
  );
}

/* The mound, drawn once at full height. Growth is handled entirely by
   a clip-path on the wrapper around this -- no second drawing needed,
   just a mask stepping open from the ground up, one step per deposit. */
function Mound() {
  return (
    <svg width="220" height="170" viewBox="0 0 220 170" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <clipPath id="cm-hill-clip">
          <path d="M4 168 C 10 120, 40 60, 80 34 C 108 16, 128 16, 152 32 C 190 56, 210 116, 216 168 Z" />
        </clipPath>
      </defs>
      {/* alternating shell and earth strata, clipped to the hand-shaped
          hill rather than a geometric cone */}
      <g clipPath="url(#cm-hill-clip)">
        <rect x="0" y="0" width="220" height="170" fill={EARTH} />
        <rect x="0" y="34" width="220" height="136" fill={SHELL} />
        <rect x="0" y="68" width="220" height="102" fill={EARTH_DARK} />
        <rect x="0" y="102" width="220" height="68" fill={SHELL_DARK} />
        <rect x="0" y="136" width="220" height="34" fill={EARTH} />
      </g>
      {/* the edge, redrawn on top so the bands never look machine-cut */}
      <path
        d="M4 168 C 10 120, 40 60, 80 34 C 108 16, 128 16, 152 32 C 190 56, 210 116, 216 168 Z"
        fill="none"
        stroke={EARTH_DARK}
        strokeWidth="1.5"
        opacity="0.4"
      />
    </svg>
  );
}

export default function CrystalRiverMoundsFX({ onDone }) {
  useTimeline((at) => {
    SFX.rumble(0.4);
    buzz([8, 16]);
    DEPOSIT.forEach((ms, i) => at(ms, () => { SFX.tick(0.1 * i); buzz([12, 8, 12]); }));
    ARCS.forEach((a) => at(a.delay, () => SFX.whoosh()));
    at(SETTLE_AT, () => SFX.rumble(0.5));
    at(FACT_AT, () => { SFX.promo(); buzz([15, 30, 15]); });
    at(DONE_AT, onDone);
  });

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* No apostrophes, quotes or angle brackets in here -- see the
          header of components/GlobalStyles.jsx and the build guard in
          scripts/check-styles.mjs. Nothing in this file loops, so
          there is no html[data-motion=off] override to add -- every
          animation here is one-shot and already clamped by the global
          rule in GlobalStyles.jsx. */}
      <style>{`
        @keyframes cm-caption {
          0%   { opacity: 0; transform: translateY(6px); }
          20%  { opacity: 1; transform: translateY(0); }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes cm-arc {
          0%   { transform: translate(-10vw, 0); opacity: 0; }
          10%  { opacity: 1; }
          50%  { transform: translate(50vw, -6vh); }
          90%  { opacity: 1; }
          100% { transform: translate(110vw, 0); opacity: 0; }
        }
        @keyframes cm-dusk {
          0%, 100% { opacity: 0; }
          50%      { opacity: .85; }
        }
        @keyframes cm-settle {
          0%   { opacity: 0; transform: scale(.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cm-wave {
          0%   { transform: translateX(56px) rotate(0deg); opacity: 0; }
          15%  { opacity: 1; }
          70%  { transform: translateX(0) rotate(0deg); }
          85%  { transform: translateX(0) rotate(9deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes cm-glow {
          0%   { transform: scale(.4); opacity: 0; }
          35%  { transform: scale(1.2); opacity: .9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes cm-grow {
          0%, 33.33%     { clip-path: inset(100% 0 0 0); }
          35.19%, 55.56% { clip-path: inset(67% 0 0 0); }
          57.41%, 79.01% { clip-path: inset(33% 0 0 0); }
          80.86%, 100%   { clip-path: inset(0% 0 0 0); }
        }
        @keyframes cm-factin {
          0%   { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0);   opacity: 1; }
        }
      `}</style>

      {/* the whole frame, sky over ground, for the whole sequence */}
      <div
        className="nc-anim absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${SKY_TOP} 0%, ${SKY_HORIZON} 60%, ${GROUND} 60%, ${GROUND_SHADOW} 100%)`,
          animation: "verdictIn 600ms ease-out both",
        }}
      />

      {/* years passing, read straight off the sky rather than off a
          moving dot -- one dusk dip per beat, timed to its own arc */}
      {ARCS.map((a) => (
        <div
          key={`dusk-${a.key}`}
          className="nc-anim absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${DUSK_TOP} 0%, ${DUSK_HORIZON} 60%, ${DUSK_HORIZON} 100%)`,
            animation: `cm-dusk ${a.dur}ms ease-in-out ${a.delay}ms both`,
          }}
        />
      ))}

      {/* named once, up front, before anything else moves -- the one
          exception this piece makes to the usual no-narration rule */}
      <div className="absolute inset-x-0" style={{ top: "18vh", textAlign: "center" }}>
        <div
          className="nc-anim inline-block font-mono uppercase"
          style={{
            fontSize: 12, letterSpacing: 2, color: EARTH_DARK,
            textShadow: `0 0 10px ${SKY_TOP}`,
            animation: `cm-caption ${CAPTION_DUR}ms ease-in-out ${CAPTION_AT}ms both`,
          }}
        >
          Generations pass
        </div>
      </div>

      {/* the sun, racing the sky through each dusk dip */}
      {ARCS.map((a) => (
        <div
          key={a.key}
          className="nc-anim absolute rounded-full"
          style={{
            left: 0, top: "14vh", width: 26, height: 26,
            background: SUN, boxShadow: `0 0 18px ${SUN}AA`,
            willChange: "transform",
            animation: `cm-arc ${a.dur}ms ease-in-out ${a.delay}ms both`,
          }}
        />
      ))}

      {/* present day -- the sun settles and holds at the exact instant
          the mound is finished, so the payoff and the arrival share a
          moment instead of being two separate events */}
      <div
        className="nc-anim absolute rounded-full"
        style={{
          left: "50%", top: "10vh", width: 30, height: 30, marginLeft: -15,
          background: SUN, boxShadow: `0 0 22px ${SUN}CC`,
          animation: `cm-settle 500ms ease-out ${SETTLE_AT}ms both`,
        }}
      />

      {/* the mound, rising one band at a time. Anchored high enough to
          clear the arrival card, which covers roughly the bottom third
          of the screen the whole time this plays. */}
      <div
        className="absolute"
        style={{ left: "50%", bottom: "40vh", marginLeft: -110, animation: `cm-grow ${DONE_AT}ms linear both` }}
      >
        <Mound />
      </div>

      {/* the ground glow marking exactly where each deposit lands --
          same point, same moment as the mound's next growth step, so
          the two read as one event instead of two coincidences */}
      {DEPOSIT.map((ms, i) => (
        <div
          key={`glow-${i}`}
          className="nc-anim absolute rounded-full"
          style={{
            left: "50%", bottom: "39vh", width: 30, height: 30, marginLeft: -15,
            background: BASKET, boxShadow: `0 0 20px ${BASKET}CC`,
            animation: `cm-glow 500ms ease-out ${ms}ms both`,
          }}
        />
      ))}

      {/* three beats of carriers, converging on the mound's own anchor
          point rather than sitting beside it, each one a walk in and a
          dip, in a single wrapper transform so the children stay cheap */}
      {BEATS.map((b) => (
        <div
          key={b.key}
          className="absolute"
          style={{
            left: "50%", bottom: "40vh", marginLeft: 0,
            animation: `cm-wave ${b.dur}ms ease-out ${b.delay}ms both`,
          }}
        >
          <div style={{ transform: b.scale !== 1 ? `scale(${b.scale})` : undefined }}>
            {Array.from({ length: b.count }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{ left: (i - (b.count - 1) / 2) * 40, bottom: 0 }}
              >
                <Carrier />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* the fact, in the open sky above the mound once it is finished
          and the light has settled */}
      <div className="absolute inset-x-0" style={{ top: "23vh", textAlign: "center" }}>
        <div
          className="nc-anim inline-block font-mono uppercase"
          style={{
            fontSize: 13, letterSpacing: 1.4, color: EARTH_DARK,
            textShadow: `0 0 10px ${SKY_TOP}`,
            animation: `cm-factin 500ms ease-out ${FACT_AT}ms both`,
          }}
        >
          1,600 years · one of the longest-held sites in Florida
        </div>
      </div>
    </div>
  );
}
