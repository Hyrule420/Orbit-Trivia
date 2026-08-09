"use client";

import React from "react";
import { SFX } from "../../lib/sfx";
import { buzz } from "../../lib/util";
import { useTimeline } from "./fxTimeline";

/* ============================================================
   WEEKI WACHEE — the mermaid show, then the drop past it.

   Everywhere else on this road gets a moment; this one gets the show.
   Weeki Wachee has been running mermaids in front of a glass wall
   since 1947, so the arrival opens on that: three performers crossing
   in front of the glass in sequence, same as a real set piece would
   be blocked, each one getting her own small flourish as she passes
   centre stage.

   Then it does the thing the show cannot: it keeps going past the
   glass, past the light, down into the spring itself, to the number
   the question already asks about. Divers have gone past 400 feet
   here without finding the bottom. That is the actual, sourced fact
   this zone is built around — the darkness at the end of this
   sequence is not invented spectacle, it is the honest shape of that
   fact rendered as a few seconds of falling light.

   Colours are hard-coded rather than themed, for the same reason the
   ocean in SurfFX is: spring water is not a brand accent, and running
   turquoise glass through the Mars palette would rust it. This is
   also why the component takes no tierColor prop at all — there is
   nothing here for a difficulty tier to invented-colour.

   Same three rules as every other sequence (see the header of
   PadLaunchFX.jsx): never takes a tap, never gates the question,
   never outlives the screen.
   ============================================================ */

const SURFACE = "#EAFFFB";
const SHALLOW = "#8FE9E2";
const WATER_MID = "#1C8FA8";
const WATER_DEEP = "#0B4C63";
const ABYSS = "#02141C";
const BUBBLE = "#EAFFFB";
const RAY = "#F5FFF9";

const TEAL = "#2FD9C4";
const TEAL_DARK = "#15806F";
const CORAL = "#FF6F91";
const CORAL_DARK = "#B23F5B";
const GOLD = "#FFD166";
const GOLD_DARK = "#B8923F";

/* Three performers, blocked the way a real set piece would be: staggered
   entrances, different lanes and arc heights so nobody swims through
   anybody else, and each one built to peak — arms out, sparkle, gone —
   at the midpoint of her own pass. peakAt is delay + half the pass's
   own duration, spelled out rather than computed, the same way PASSES
   is written out in SatelliteFX.jsx. */
const PASSES = [
  { key: "a", top: "35vh", peak: "-9vh", delay: 250, dur: 2100, peakAt: 1300, tail: TEAL, tailDark: TEAL_DARK, scale: 1 },
  { key: "b", top: "47vh", peak: "-5vh", delay: 950, dur: 2000, peakAt: 1950, tail: CORAL, tailDark: CORAL_DARK, scale: 0.9 },
  { key: "c", top: "40vh", peak: "-13vh", delay: 1650, dur: 2300, peakAt: 2800, tail: GOLD, tailDark: GOLD_DARK, scale: 1.05 },
];

const CRESCENDO_AT = 4000;
const DIVE_AT = 4300;
const DARKEN_MS = 1300;
const DEPTH_AT = DIVE_AT + DARKEN_MS + 100;
const FLASH_AT = DEPTH_AT + 1300;
const DONE_AT = FLASH_AT + 800;

/* Ambient bubbles, always drifting. Hard-coded rather than randomised —
   a client-only Math.random() here would render one layout on first
   paint and a different one on the next re-render, and there is no
   reason to court that for a fistful of circles. */
const AMBIENT = [
  { x: 8, size: 5, delay: 0, dur: 4200 },
  { x: 22, size: 3, delay: 600, dur: 3600 },
  { x: 38, size: 6, delay: 1400, dur: 4600 },
  { x: 54, size: 4, delay: 300, dur: 3900 },
  { x: 68, size: 3, delay: 1800, dur: 4100 },
  { x: 79, size: 5, delay: 900, dur: 4400 },
  { x: 90, size: 4, delay: 2100, dur: 3800 },
  { x: 15, size: 3, delay: 2600, dur: 4000 },
  { x: 62, size: 5, delay: 3100, dur: 4300 },
  { x: 46, size: 3, delay: 1100, dur: 3700 },
];

/* The rush of bubbles streaming past as the drop starts, timed inside
   the darken window rather than looping through it. */
const STREAKS = [12, 27, 41, 58, 71, 85].map((x, i) => ({ x, delay: i * 90 }));

/* Four separate shapes — fluke, tail, torso, head — each with clear air
   between it and the next, plus hair kept high and short so it never
   reads as part of the tail. The first draft merged all of those into
   one silhouette and it read as a leaf with an arm, not a mermaid; the
   fix was less overlap, not more detail. */
function Mermaid({ tail, tailDark }) {
  return (
    <svg width="112" height="48" viewBox="0 0 112 48" style={{ display: "block", overflow: "visible" }}>
      {/* fluke: two lobes meeting at the stalk, the classic fishtail shape */}
      <path d="M22 24 L3 10 L12 24 L3 38 Z" fill={tailDark} />
      {/* tail, tapering from the fluke up to the waist */}
      <path
        d="M20 24 C 32 15, 48 11, 64 15 C 72 17, 78 21, 82 26 C 70 29, 56 31, 42 30 C 32 29, 24 27, 20 24 Z"
        fill={tail}
      />
      <path d="M30 20 C 38 23, 46 26, 54 27" stroke={tailDark} strokeWidth="1.2" fill="none" opacity="0.55" />
      <path d="M42 16 C 50 19, 58 23, 66 25" stroke={tailDark} strokeWidth="1.2" fill="none" opacity="0.55" />
      {/* waist, a narrow neck of colour joining tail to torso so the two
          read as one body instead of two shapes glued together */}
      <path d="M78 22 C 82 24, 85 26, 88 28 L 84 33 C 80 30, 77 27, 74 25 Z" fill={tail} />
      {/* torso */}
      <ellipse cx="92" cy="24" rx="11" ry="9" fill={tail} transform="rotate(-18 92 24)" />
      {/* arm, reaching forward past the head */}
      <path d="M98 18 C 104 13, 108 8, 110 2 L 106 1 C 103 7, 98 12, 92 16 Z" fill={tail} />
      {/* head, given real clearance from the torso so it reads as a head */}
      <circle cx="100" cy="10" r="6.5" fill={tail} />
      {/* hair, short and high — over the shoulder, never down into the tail */}
      <path
        d="M95 5 C 86 2, 76 4, 68 9 C 77 7, 85 8, 91 11 C 84 11, 77 13, 71 17 C 81 15, 89 13, 96 11 Z"
        fill={tailDark}
        opacity="0.7"
      />
    </svg>
  );
}

export default function WeekiWacheeFX({ onDone }) {
  useTimeline((at) => {
    SFX.wave(2.4);
    at(140, () => buzz([10, 20]));
    PASSES.forEach((p, i) => at(p.peakAt, () => SFX.tick(i * 0.35)));
    at(CRESCENDO_AT, () => { SFX.wave(1.8); buzz([15, 30, 15]); });
    at(DIVE_AT, () => { SFX.whoosh(); buzz([30, 50, 90]); });
    at(DIVE_AT + 400, () => SFX.rumble(1.4));
    at(DEPTH_AT, () => SFX.promo());
    at(DONE_AT, onDone);
  });

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* No apostrophes, quotes or angle brackets in here — see the
          header of components/GlobalStyles.jsx and the build guard in
          scripts/check-styles.mjs. */}
      <style>{`
        @keyframes ww-sway {
          0%, 100% { opacity: .18; }
          50%      { opacity: .36; }
        }
        @keyframes ww-rise {
          0%   { transform: translateY(0);       opacity: 0; }
          12%  { opacity: .8; }
          85%  { opacity: .5; }
          100% { transform: translateY(-70vh);   opacity: 0; }
        }
        @keyframes ww-kick {
          0%, 100% { transform: rotate(-9deg); }
          50%      { transform: rotate(9deg); }
        }
        @keyframes ww-sparkle {
          0%   { transform: scale(0)   rotate(0deg);  opacity: 0; }
          40%  { transform: scale(1)   rotate(45deg); opacity: 1; }
          100% { transform: scale(.25) rotate(90deg); opacity: 0; }
        }
        @keyframes ww-darken {
          0%   { opacity: 0; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes ww-streak {
          0%   { transform: translateY(0);      opacity: 0; }
          15%  { opacity: .8; }
          100% { transform: translateY(-90vh);  opacity: 0; }
        }
        @keyframes ww-depth {
          0%   { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0);   opacity: 1; }
        }
        html[data-motion=off] .ww-ray,
        html[data-motion=off] .ww-bub,
        html[data-motion=off] .ww-kick { animation: none !important; }
      `}</style>

      {/* The view from inside the glass, looking up toward the surface —
          that is the show's actual gimmick, so the whole scene is lit
          that way rather than as a generic underwater backdrop. */}
      <div
        className="nc-anim absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${SURFACE} 0%, ${SHALLOW} 22%, ${WATER_MID} 58%, ${WATER_DEEP} 100%)`,
          animation: "verdictIn 700ms ease-out both",
        }}
      />

      {/* light shafts from the surface, hard-coded rotation, only the
          opacity ever animates — see the header of this file for why a
          static transform and an animated one never share an element. */}
      {[{ left: "18%", rot: -14, w: 90 }, { left: "58%", rot: 10, w: 70 }, { left: "78%", rot: -6, w: 50 }].map((r, i) => (
        <div
          key={i}
          className="ww-ray absolute"
          style={{
            left: r.left, top: "-10vh", width: r.w, height: "80vh",
            background: `linear-gradient(to bottom, ${RAY}55, transparent 75%)`,
            transform: `rotate(${r.rot}deg)`,
            filter: "blur(6px)",
            animation: `ww-sway ${3.4 + i * 0.6}s ease-in-out ${i * 0.4}s infinite`,
          }}
        />
      ))}

      {/* ambient bubbles, drifting the whole time the water is lit */}
      {AMBIENT.map((b, i) => (
        <div
          key={i}
          className="ww-bub absolute rounded-full"
          style={{
            left: `${b.x}%`, bottom: "-4vh", width: b.size, height: b.size,
            background: BUBBLE, opacity: 0,
            boxShadow: `0 0 ${b.size}px ${BUBBLE}88`,
            animation: `ww-rise ${b.dur}ms ease-in ${b.delay}ms infinite`,
          }}
        />
      ))}

      {/* the three passes */}
      {PASSES.map((p) => (
        <div
          key={p.key}
          className="nc-anim absolute"
          style={{
            top: p.top, left: "-120px",
            "--peak": p.peak,
            animation: `sc-satpass ${p.dur}ms cubic-bezier(.4,.05,.6,.95) ${p.delay}ms both`,
            willChange: "transform",
          }}
        >
          {/* Scale is static (each performer is drawn at the same size and
              sized per-lane here), the kick is animated — kept on two
              divs rather than one. A static transform and a keyframe that
              also animates transform never combine on a single element;
              the animation replaces the static value outright instead of
              composing with it. See the file header for why this matters
              enough to spell out twice. */}
          <div className="relative" style={{ transform: `scale(${p.scale})` }}>
            <div className="ww-kick relative" style={{ animation: `ww-kick ${520 / p.scale}ms ease-in-out infinite` }}>
              <Mermaid tail={p.tail} tailDark={p.tailDark} />
              {/* the sparkle, timed to when this performer is centre stage */}
              <span
                className="nc-anim absolute"
                style={{
                  right: 2, top: 2,
                  animation: `ww-sparkle 550ms ease-out ${p.peakAt}ms both`,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M8 0 L9.4 6.6 L16 8 L9.4 9.4 L8 16 L6.6 9.4 L0 8 L6.6 6.6 Z" fill={SURFACE} />
                </svg>
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* the crescendo — every performer at once, then the hush before
          the drop */}
      <div
        className="nc-anim absolute inset-0"
        style={{ background: SURFACE, animation: `sc-flash 480ms ease-out ${CRESCENDO_AT}ms both` }}
      />

      {/* the drop past the glass, down toward the number the question
          asks about */}
      <div
        className="nc-anim absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${WATER_DEEP} 0%, ${ABYSS} 75%)`,
          transformOrigin: "50% 30%",
          animation: `ww-darken ${DARKEN_MS}ms ease-in ${DIVE_AT}ms both`,
        }}
      />
      {STREAKS.map((s, i) => (
        <div
          key={i}
          className="nc-anim absolute rounded-full"
          style={{
            left: `${s.x}%`, bottom: "-6vh", width: 3, height: 34,
            background: `linear-gradient(to top, transparent, ${BUBBLE}CC)`,
            animation: `ww-streak 900ms ease-in ${DIVE_AT + s.delay}ms both`,
          }}
        />
      ))}

      {/* the fact itself, surfacing once the screen has gone dark
          enough to read it against */}
      <div className="absolute inset-x-0" style={{ top: "46vh", textAlign: "center" }}>
        <div
          className="nc-anim inline-block font-mono uppercase"
          style={{
            fontSize: 13, letterSpacing: 1.4, color: SHALLOW,
            textShadow: `0 0 14px ${WATER_MID}`,
            animation: `ww-depth 600ms ease-out ${DEPTH_AT}ms both`,
          }}
        >
          400+ ft down · still no bottom found
        </div>
      </div>

      {/* surfacing back to light before the sequence ends */}
      <div
        className="nc-anim absolute inset-0"
        style={{ background: SURFACE, animation: `sc-flash 500ms ease-out ${FLASH_AT}ms both` }}
      />
    </div>
  );
}
