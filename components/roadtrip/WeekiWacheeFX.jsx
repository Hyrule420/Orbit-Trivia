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

/* ---------- the performer ----------

   Two earlier drafts of this read as a fish, and both failed the same
   way: the body was one long horizontal mass, so the eye had nothing
   to parse as a person. What actually carries the read, in order of
   how much work each does:

     1. A diagonal. The tail lies low-left, the torso climbs steeply
        out of it, the head sits high-right. A mermaid laid out flat
        along one axis is a dolphin no matter how much detail is on it.
     2. Long hair, streaming back over the body. This is the single
        strongest signifier there is, which is why there are three
        separate strands rather than one shape.
     3. Arms. Two of them — the far one trailing back at low opacity
        for depth, the near one reaching forward under the chin.
     4. A waist. The torso has to be visibly narrower than both the
        hips below it and the shoulders above it.

   Everything after that — face profile, scale rows, fin rays, the
   gradients — is detail that only survives because the silhouette
   underneath it already works.

   uid keeps the gradient ids unique: three of these render at once,
   and duplicate ids inside one document would have all three pulling
   whichever fill happened to be defined last. It comes from the pass
   key rather than useId() so the markup is identical on server and
   client. */
function Mermaid({ tail, tailDark, uid }) {
  const gTail = `ww-g-tail-${uid}`;
  const gSkin = `ww-g-skin-${uid}`;

  return (
    <svg width="150" height="90" viewBox="0 0 175 105" style={{ display: "block", overflow: "visible" }}>
      <defs>
        {/* lit from above, the way everything else in this scene is */}
        <linearGradient id={gTail} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="22%" stopColor={tail} />
          <stop offset="72%" stopColor={tail} />
          <stop offset="100%" stopColor={tailDark} />
        </linearGradient>
        <linearGradient id={gSkin} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="40%" stopColor={tail} />
          <stop offset="100%" stopColor={tailDark} />
        </linearGradient>
      </defs>

      {/* far arm, trailing back behind the body — drawn first so the
          torso covers its shoulder end, which is what sells it as the
          limb on the other side rather than a fin */}
      <path
        d="M120 34 C 114 42, 108 52, 102 62 C 108 54, 116 45, 124 39 Z"
        fill={tailDark}
        opacity="0.55"
      />

      {/* ---- tail ---- */}
      {/* The fluke gets its own flex, hinged at the stalk, running a
          little out of step with the body kick in the parent. A tail
          that swings only as part of one rigid sprite is the thing
          that makes cheap swimming animation look pasted on. */}
      <g
        className="ww-fluke"
        style={{ transformOrigin: "34px 78px", transformBox: "view-box", animation: "ww-fluke 620ms ease-in-out -160ms infinite" }}
      >
        <path
          d="M34 78 C 27 71, 17 61, 5 50 C 9 62, 15 71, 25 78 C 15 84, 9 90, 6 99 C 18 92, 28 86, 34 78 Z"
          fill={tailDark}
        />
        {/* fin rays, the give-away that a fluke is membrane over spines */}
        <g stroke={tail} strokeWidth="0.9" opacity="0.45" fill="none">
          <path d="M31 76 L 13 57" />
          <path d="M31 77 L 17 67" />
          <path d="M31 80 L 15 85" />
          <path d="M31 81 L 13 94" />
        </g>
      </g>

      {/* The tail runs low and near-level; all the climb is saved for
          the torso above it. Spreading the rise evenly across the whole
          body is what made two earlier drafts read as one tapering tube. */}
      <path
        d="M30 73 C 44 70, 58 67, 70 63 C 82 59, 92 55, 101 51 L 104 71 C 94 75, 84 78, 72 80 C 58 83, 42 84, 30 83 Z"
        fill={`url(#${gTail})`}
      />
      {/* scale rows, curving across the taper rather than straight */}
      <g stroke={tailDark} strokeWidth="1.1" fill="none" opacity="0.4">
        <path d="M44 70 C 48 76, 48 80, 46 83" />
        <path d="M58 66 C 63 73, 63 78, 60 82" />
        <path d="M72 61 C 78 68, 78 74, 74 79" />
        <path d="M86 56 C 93 63, 93 70, 88 75" />
      </g>
      {/* a hard specular line along the top of the tail — this is most
          of what makes it read as wet */}
      <path
        d="M32 72 C 46 69, 60 66, 72 62 C 84 58, 93 54, 101 51"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        opacity="0.4"
        fill="none"
        strokeLinecap="round"
      />

      {/* pelvic fin at the hip, trailing back */}
      <path
        d="M99 70 C 92 78, 84 84, 75 89 C 85 86, 95 81, 103 75 Z"
        fill={tailDark}
        opacity="0.8"
      />

      {/* ---- torso ----
          An hourglass, measured across the body axis rather than
          vertically: roughly 16 wide at the hip, pinched to 10 at the
          waist, back out to 18 at the bust. Those three numbers are the
          whole difference between a person and a tube. */}
      <path
        d="M99 53
           C 103 44, 110 32, 118 23
           C 122 18, 130 18, 132 24
           C 133 30, 133 34, 131 38
           C 130 43, 124 44, 118 46
           C 113 54, 109 64, 106 73
           C 103 77, 98 75, 98 68 Z"
        fill={`url(#${gSkin})`}
      />

      {/* ---- head, in profile: brow, nose, lip, chin ---- */}
      <path
        d="M136 3
           C 145 0, 153 4, 154 11
           C 154 14, 156 15, 156 17
           C 156 19, 153 19, 151 20
           C 153 22, 153 24, 150 25
           C 148 28, 143 29, 138 28
           C 131 27, 128 22, 128 15
           C 128 8, 131 4, 136 3 Z"
        fill={`url(#${gSkin})`}
      />
      <circle cx="147" cy="13" r="1.6" fill={tailDark} opacity="0.85" />

      {/* near arm, reaching forward under the chin */}
      <path
        d="M126 32
           C 136 32, 148 31, 158 29
           C 163 28, 168 27, 169 30
           C 170 33, 165 34, 160 35
           C 149 37, 136 40, 127 40 Z"
        fill={`url(#${gSkin})`}
      />

      {/* ---- hair ----
          Every strand starts ON the skull and then follows the line of
          the back down over the torso and tail, rather than arcing off
          into open water above her. Two earlier passes had them
          launching from the crown across empty blue, where they read as
          loose ribbons — or worse, as wings — instead of as hair
          belonging to anybody. Hair trails along the body, not beside it. */}
      <path
        d="M134 6 C 126 8, 116 16, 106 27 C 94 40, 82 54, 72 66 C 84 56, 96 44, 108 33 C 120 22, 130 14, 136 12 Z"
        fill={tailDark}
        opacity="0.92"
      />
      <path
        d="M131 13 C 122 16, 111 25, 100 37 C 88 50, 77 63, 68 75 C 79 64, 91 51, 103 40 C 115 29, 126 20, 132 18 Z"
        fill={tailDark}
        opacity="0.78"
      />
      <path
        d="M127 21 C 118 25, 108 34, 98 46 C 87 58, 78 70, 71 82 C 81 71, 92 58, 103 47 C 114 36, 123 28, 128 25 Z"
        fill={tailDark}
        opacity="0.62"
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
        /* the fluke flexing against the body kick rather than with it */
        @keyframes ww-fluke {
          0%, 100% { transform: rotate(-15deg); }
          50%      { transform: rotate(15deg); }
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
        html[data-motion=off] .ww-fluke,
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
              <Mermaid tail={p.tail} tailDark={p.tailDark} uid={p.key} />
              {/* the sparkle, timed to when this performer is centre stage */}
              {/* sits at her fingertips, not out by her face — the arm
                  reaches to the right edge of the box about a third of
                  the way down it */}
              <span
                className="nc-anim absolute"
                style={{
                  right: -2, top: 18,
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
