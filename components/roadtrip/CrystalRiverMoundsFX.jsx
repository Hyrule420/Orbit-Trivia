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
   invented regalia, the same economy this game already draws people
   with (the sponge diver, the surfer). The story told is the one we
   were actually given: hand labour, repeated many times, across a very
   long span, building something that lasted. No boom, no bright flash
   finale -- this is a quiet accumulation, not a spectacle.

   Structurally this is closer to SatelliteFX than to the dive-and-
   recover pieces: one static frame for the whole sequence, passage of
   time sold by what happens on top of it rather than by moving the
   camera. Four waves of carriers arrive and deposit; the mound reveals
   one more band of itself after each one; a small sun races across the
   sky faster with every pass, standing in for many cycles rather than
   one literal sunrise. Colours are hard-coded to one warm, quiet
   neutral family -- real shell, real earth, real Florida haze -- for
   the same reason every other sequence in this folder keeps its own
   subject out of the Moon/Mars palette.

   Same three rules as every other sequence here: never takes a tap,
   never gates the question, never outlives the screen.
   ============================================================ */

const SKY_TOP = "#F0E2C4";
const SKY_HORIZON = "#C99A5E";
const PULSE = "#8C6B45";
const SUN = "#F3C267";
const GROUND = "#B79A6B";
const GROUND_SHADOW = "#8E7148";

const SHELL = "#E6DBC3";
const SHELL_DARK = "#C9B98E";
const EARTH = "#7A5A3A";
const EARTH_DARK = "#5A3F27";

const FIGURE = "#3A2C1C";
const BASKET = "#8C6B3F";

/* Four waves, each a little larger than the last -- a bigger, more
   established gathering, not a specific era. Spelled out rather than
   computed, same reasoning as every other timeline in this folder. */
const WAVES = [
  { key: "w1", delay: 500, dur: 850, count: 4 },
  { key: "w2", delay: 1950, dur: 850, count: 5 },
  { key: "w3", delay: 3400, dur: 900, count: 6 },
  { key: "w4", delay: 4800, dur: 1000, count: 7 },
];
/* One deposit per wave, at the moment each one finishes its dip. */
const DEPOSIT = WAVES.map((w) => w.delay + w.dur);

const ARCS = [
  { key: "a1", delay: 1450, dur: 800 },
  { key: "a2", delay: 2900, dur: 700 },
  { key: "a3", delay: 4400, dur: 600 },
];

const SETTLE_AT = 6050;
/* Learned from the sponge-diver piece: an ending fact needs real room
   after it fades in, not just enough to appear. Five hundred ms to
   fade, then a solid stretch to actually sit and be read. */
const FACT_AT = 6300;
const DONE_AT = 7700;

/* One simple, entirely anonymous figure -- no face, no regalia, a
   stoop and a basket doing all the storytelling. Reused many times
   rather than hand-drawn once each, the same economy SatelliteFX uses
   for its sixteen Starlink panels: one shape, staggered, cheap. */
function Carrier() {
  return (
    <svg width="18" height="30" viewBox="0 0 18 30" style={{ display: "block", overflow: "visible" }}>
      {/* legs -- a plain split base, no articulation */}
      <path d="M6 26 L5 30 L8 30 L9 26 Z" fill={FIGURE} />
      <path d="M10 26 L11 30 L14 30 L12 26 Z" fill={FIGURE} />
      {/* the stoop -- leaning into the load is what reads as weight */}
      <path d="M4 26 C 3 20, 5 13, 10 9 C 13 7, 15 8, 14 11 C 11 13, 8 18, 9 26 Z" fill={FIGURE} />
      {/* head, tucked low rather than upright */}
      <circle cx="12" cy="8" r="2.6" fill={FIGURE} />
      {/* the basket, carried low at the back */}
      <path d="M3 17 L9 15 L10 21 L4 23 Z" fill={BASKET} />
    </svg>
  );
}

/* The mound, drawn once at full height. Growth is handled entirely by
   a clip-path on the wrapper around this -- no second drawing needed,
   just a mask stepping open from the ground up. */
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
        @keyframes cm-arc {
          0%   { transform: translate(-10vw, 0); opacity: 0; }
          10%  { opacity: 1; }
          50%  { transform: translate(50vw, -6vh); }
          90%  { opacity: 1; }
          100% { transform: translate(110vw, 0); opacity: 0; }
        }
        @keyframes cm-pulse {
          0%, 100% { opacity: 0; }
          50%      { opacity: .35; }
        }
        @keyframes cm-settle {
          0%   { opacity: 0; transform: scale(.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cm-wave {
          0%   { transform: translateX(46px) rotate(0deg); opacity: 0; }
          15%  { opacity: 1; }
          70%  { transform: translateX(0) rotate(0deg); }
          85%  { transform: translateX(0) rotate(10deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes cm-grow {
          0%, 17.53%    { clip-path: inset(100% 0 0 0); }
          19.5%, 36.36%  { clip-path: inset(75% 0 0 0); }
          38.3%, 55.84%  { clip-path: inset(50% 0 0 0); }
          57.8%, 75.32%  { clip-path: inset(25% 0 0 0); }
          77.3%, 100%    { clip-path: inset(0% 0 0 0); }
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

      {/* the three quick passes standing in for many cycles */}
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
      {ARCS.map((a) => (
        <div
          key={`p-${a.key}`}
          className="nc-anim absolute inset-0"
          style={{ background: PULSE, animation: `cm-pulse ${a.dur}ms ease-in-out ${a.delay}ms both` }}
        />
      ))}

      {/* present day -- the sun settles and holds once the mound is done */}
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

      {/* four waves of carriers, each a little larger, each one a
          deposit -- a walk in and a dip, in a single wrapper transform
          so the children stay cheap. Same ground line as the mound, so
          they read as walking up to its base rather than floating. */}
      {WAVES.map((w) => (
        <div
          key={w.key}
          className="absolute"
          style={{
            left: "50%", bottom: "40vh", marginLeft: 30,
            animation: `cm-wave ${w.dur}ms ease-out ${w.delay}ms both`,
          }}
        >
          {Array.from({ length: w.count }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{ left: (i % 2 === 0 ? 1 : -1) * (4 + i * 5), bottom: (i * 3) % 9 }}
            >
              <Carrier />
            </div>
          ))}
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
