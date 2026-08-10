"use client";

import React from "react";
import { SFX } from "../../lib/sfx";
import { buzz } from "../../lib/util";
import { useTimeline } from "./fxTimeline";

/* ============================================================
   TARPON SPRINGS SPONGE DOCKS -- the diver, on the line.

   Every other water sequence on this corridor is about something
   graceful: mermaids in front of glass, a surfer riding a swell. This
   one is about labor. A man goes over the side in two hundred pounds
   of canvas and brass, walks the bottom on a weighted line, fills a
   bag by hand, and gets hauled back up by people who never let go of
   the rope. The hose is the whole point, so unlike the free-swimming
   mermaids or the riderless surf, it never leaves the frame -- it
   grows as he sinks and shortens as he is pulled back up, always
   connecting him to the boat overhead.

   The ending deliberately does not spend itself on the question. The
   quiz already tests the 1940s blight that nearly ended this trade;
   the sequence instead lands on the origin story from the blurb --
   1905, the first Greek divers off the boat from the Dodecanese --
   which pays off the culture without handing away the answer
   underneath it.

   Colours are hard-coded rather than themed for the same reason the
   spring water in WeekiWacheeFX is: brass, canvas and Gulf silt are
   not brand accents, and running them through the Moon or Mars
   palette would flatten the one thing this scene is actually about.

   Same three rules as every other sequence in this folder (see the
   header of PadLaunchFX.jsx): never takes a tap, never gates the
   question, never outlives the screen.
   ============================================================ */

const DOCK_LIGHT = "#F7E3B0";
const HULL_COLOR = "#4A3520";

const SHALLOW = "#6E8F72";
const MID = "#35564A";
const DEEP = "#16332B";
const SILT_FLOOR = "#3E3221";

const BRASS = "#C68A3B";
const BRASS_DARK = "#8A5A22";
const BRASS_LIGHT = "#F0C878";
const GLASS = "#274A52";
const SUIT = "#5B6B63";
const BOOT = "#2B2B2E";
const HOSE_COLOR = "#B5502A";
const SPONGE_COLOR = "#D9A44E";
const SPONGE_DARK = "#8B5A2B";
const MOTE = "#DCEBD8";

/* The dive, spelled out beat by beat rather than computed -- see the
   header of WeekiWacheeFX.jsx for why: this is tuned by eye, and a
   formula would only hide the numbers that matter. */
const SINK_AT = 350;
const PUMP = [700, 1050, 1400, 1750];
const BOTTOM_AT = 2450;
const HARVEST = [2650, 3050, 3450];
const FULL_AT = 3850;
const ASCEND_AT = 3950;
const RISE_AT = 4400;
const SURFACE_AT = 4850;
/* The fact needs real room: it fades in over 500ms and then has to sit
   still long enough to read before the sequence ends, the way the
   depth fact at the end of WeekiWacheeFX does. FACT_AT sits just past
   the veil fully clearing (SURFACE_AT + 300ms) so it never has to
   fight the underwater colour for contrast. The gap to DONE_AT gives
   it a solid two-second read once the fade-in finishes. */
const FACT_AT = 5200;
const DONE_AT = 7500;

/* The diver and the hose share one local clock, running from the
   moment he goes under to the moment he breaks the surface again. */
const DIVE_DUR = SURFACE_AT - SINK_AT;

const DIVER_W = 92;

/* Suspended silt, not clear-water bubbles -- this is Gulf floor, not
   spring water, and it should read that way even before anything
   else on screen tells you so. */
const MOTES = [
  { x: 10, top: 22, size: 3, delay: 200, dur: 3400 },
  { x: 28, top: 40, size: 2, delay: 900, dur: 3000 },
  { x: 52, top: 30, size: 3, delay: 1500, dur: 3600 },
  { x: 70, top: 52, size: 2, delay: 500, dur: 3100 },
  { x: 84, top: 38, size: 3, delay: 1100, dur: 3300 },
];

const FLOOR_SPONGES = [{ dx: -34 }, { dx: 8 }, { dx: 42 }];

const BAG_SPOTS = [
  { x: 10, y: 15 },
  { x: 19, y: 11 },
  { x: 15, y: 20 },
];

function Hull() {
  return (
    <svg width="220" height="46" viewBox="0 0 220 46" style={{ display: "block", overflow: "visible" }}>
      <path d="M0 0 L220 0 L202 34 C 168 43, 52 43, 18 34 Z" fill={HULL_COLOR} />
      <rect x="96" y="0" width="8" height="16" fill={HULL_COLOR} opacity="0.85" />
    </svg>
  );
}

/* ---------- the diver ----------

   What sells a hard-hat suit over an astronaut or a scuba diver, in
   order of how much work each detail does:

     1. The collar. A flared, bolted corselet distinctly wider than
        the head, with no neck visible at all. An astronaut suit
        tapers smoothly instead -- the flare is the single detail
        that keeps this from reading as a space helmet.
     2. One viewport. A single round bolted window, not a full clear
        visor. A visor reads as a face; one small port reads as a
        machine with a person looking out of it.
     3. Mass, not shape. The torso is one stiff canvas block and the
        boots are oversized and blocky -- the opposite of a
        swimmer's tapered, sleek lower body.
     4. The hose. It never disconnects, and it is drawn as its own
        separate element outside this component so it can grow and
        shrink with the depth animation below.
   ---------------------------------------------------------------- */
function Diver() {
  return (
    <svg width={DIVER_W} height="132" viewBox="0 0 92 132" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="sd-g-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRASS_LIGHT} />
          <stop offset="55%" stopColor={BRASS} />
          <stop offset="100%" stopColor={BRASS_DARK} />
        </linearGradient>
      </defs>

      {/* hose stub, meeting the full-length hose drawn behind this svg */}
      <path d="M46 4 C 44 -6, 48 -14, 46 -22" stroke={HOSE_COLOR} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.9" />

      {/* the flared, bolted collar -- wider than the head, no neck */}
      <path
        d="M14 40 C 14 34, 20 30, 30 29 L 62 29 C 72 30, 78 34, 78 40
           L 82 52 C 82 57, 76 60, 66 60 L 26 60 C 16 60, 10 57, 10 52 Z"
        fill={BRASS_DARK}
      />
      <path
        d="M16 41 C 16 37, 21 34, 30 33 L 62 33 C 71 34, 76 37, 76 41 L 78 48 L 14 48 Z"
        fill="url(#sd-g-brass)"
      />
      {[18, 30, 46, 62, 74].map((x) => (
        <circle key={x} cx={x} cy="44" r="1.6" fill={BRASS_DARK} opacity="0.7" />
      ))}

      {/* the dome, seated down into the collar rather than perched above it */}
      <circle cx="46" cy="20" r="22" fill="url(#sd-g-brass)" />
      <circle cx="46" cy="20" r="22" fill="none" stroke={BRASS_DARK} strokeWidth="1.4" opacity="0.5" />
      {/* the single bolted viewport */}
      <circle cx="54" cy="22" r="9" fill={GLASS} />
      <circle cx="54" cy="22" r="9" fill="none" stroke={BRASS_DARK} strokeWidth="2.4" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <circle key={deg} cx={54 + Math.cos(rad) * 9} cy={22 + Math.sin(rad) * 9} r="1.1" fill={BRASS_DARK} />
        );
      })}
      <ellipse cx="50" cy="15" rx="6" ry="3" fill="#FFFFFF" opacity="0.25" />

      {/* torso -- one stiff canvas mass */}
      <path d="M22 58 L70 58 L76 100 C 76 108, 68 112, 46 112 C 24 112, 16 108, 16 100 Z" fill={SUIT} />
      <path d="M22 58 L70 58 L74 78 L18 78 Z" fill={SUIT} opacity="0.6" />

      {/* far arm, trailing behind the body for depth */}
      <path d="M70 62 C 80 66, 86 76, 86 88 C 82 78, 76 70, 68 66 Z" fill={SUIT} opacity="0.7" />
      {/* near arm, working the bed -- a small permanent sway, the one
          part of the suit that ever looks alive */}
      <path
        className="sd-arm"
        style={{ transformOrigin: "24px 62px", transformBox: "view-box", animation: "sd-arm-sway 900ms ease-in-out infinite" }}
        d="M24 62 C 12 68, 4 80, 2 94 C 8 84, 16 74, 28 68 Z"
        fill={SUIT}
      />

      {/* weighted boots -- blocky, the opposite of a fin */}
      <path d="M16 100 L34 100 L32 122 C 32 126, 26 128, 20 126 C 16 124, 14 120, 16 116 Z" fill={BOOT} />
      <path d="M58 100 L76 100 L76 116 C 78 120, 76 124, 72 126 C 66 128, 60 126, 60 122 Z" fill={BOOT} />
    </svg>
  );
}

function Bag() {
  return (
    <svg width="30" height="26" viewBox="0 0 30 26" style={{ display: "block", overflow: "visible" }}>
      <path
        d="M4 6 C 2 6, 1 9, 2 12 L 5 22 C 6 25, 9 26, 15 26 C 21 26, 24 25, 25 22 L 28 12 C 29 9, 28 6, 26 6 Z"
        fill={SUIT}
        opacity="0.92"
      />
      <g stroke={BOOT} strokeWidth="0.6" opacity="0.4">
        <path d="M4 10 L27 10" />
        <path d="M5 16 L26 16" />
      </g>
      {/* three sponges, fading in as the harvest lands each one */}
      {BAG_SPOTS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r="3"
          fill={i % 2 === 0 ? SPONGE_COLOR : SPONGE_DARK}
          style={{
            transformBox: "fill-box",
            transformOrigin: "50% 50%",
            animation: `sd-bagpop 260ms ease-out ${HARVEST[i] + 150}ms both`,
          }}
        />
      ))}
    </svg>
  );
}

/* irregular on purpose -- a circle reads as a rock, a lumpy asymmetric
   outline is the only thing that reads as a sponge */
function Sponge() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" style={{ display: "block", overflow: "visible" }}>
      <path
        d="M2 11 C 1 6, 5 2, 9 4 C 11 0, 17 0, 19 4 C 24 3, 25 9, 21 12 C 23 15, 18 18, 15 15 C 11 18, 5 16, 4 13 C 1 14, 0 12, 2 11 Z"
        fill={SPONGE_COLOR}
      />
      <ellipse cx="9" cy="8" rx="1.7" ry="1.2" fill={SPONGE_DARK} opacity="0.6" />
      <ellipse cx="16" cy="10" rx="1.4" ry="1.9" fill={SPONGE_DARK} opacity="0.55" />
      <ellipse cx="12" cy="13" rx="1.8" ry="1.1" fill={SPONGE_DARK} opacity="0.5" />
    </svg>
  );
}

export default function TarponSpongeDocksFX({ onDone }) {
  useTimeline((at) => {
    SFX.wave(1.4);
    buzz([10, 20]);
    at(SINK_AT, () => { SFX.rumble(0.5); buzz([20, 15, 25]); });
    /* the hand-cranked air pump, four slow strokes on the way down */
    PUMP.forEach((ms, i) => at(ms, () => SFX.tick(i * 0.15)));
    at(BOTTOM_AT, () => { SFX.rumble(0.4); buzz([25, 10, 25]); });
    HARVEST.forEach((ms, i) => at(ms, () => SFX.tick(0.1 + i * 0.2)));
    /* the rope-pull signal to the tender -- a real code hard-hat
       divers used long before radio, standing in for dialogue here */
    at(FULL_AT, () => { SFX.beacon(2, 0.16); buzz([15, 30, 15]); });
    at(ASCEND_AT, () => { SFX.whoosh(); buzz([20, 40, 60]); });
    at(RISE_AT, () => SFX.wave(1.0));
    at(FACT_AT, () => SFX.promo());
    at(DONE_AT, onDone);
  });

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* No apostrophes, quotes or angle brackets in here -- see the
          header of components/GlobalStyles.jsx and the build guard in
          scripts/check-styles.mjs. */}
      <style>{`
        @keyframes sd-veil {
          0%, 4.7%    { opacity: 0; }
          8.7%, 64.7% { opacity: 1; }
          68.7%, 100% { opacity: 0; }
        }
        @keyframes sd-hull {
          0%, 4.7%     { opacity: 1; transform: translateY(0); }
          8.7%         { opacity: 0; transform: translateY(-2vh); }
          64.7%        { opacity: 0; }
          68.7%, 100%  { opacity: 1; transform: translateY(0); }
        }
        @keyframes sd-depth {
          0%    { transform: translateY(-8vh); opacity: 0; }
          3%    { opacity: 1; }
          46.7% { transform: translateY(54vh); }
          77.8% { transform: translateY(54vh); }
          80%   { transform: translateY(52vh); }
          90%   { transform: translateY(14vh); }
          97%   { opacity: 1; }
          100%  { transform: translateY(-8vh); opacity: 0; }
        }
        @keyframes sd-hose {
          0%    { transform: scaleY(0); opacity: 0; }
          3%    { opacity: 1; }
          46.7% { transform: scaleY(1); }
          77.8% { transform: scaleY(1); }
          90%   { transform: scaleY(.22); }
          100%  { transform: scaleY(0); opacity: 0; }
        }
        @keyframes sd-plucked {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(.4); }
        }
        @keyframes sd-bagpop {
          0%   { opacity: 0; transform: scale(.3); }
          60%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes sd-tug {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(-9deg); }
          55%  { transform: rotate(7deg); }
          80%  { transform: rotate(-3deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes sd-arm-sway {
          0%, 100% { transform: rotate(-4deg); }
          50%      { transform: rotate(6deg); }
        }
        @keyframes sd-bubrise {
          0%   { transform: translateY(0); opacity: 0; }
          15%  { opacity: .7; }
          90%  { opacity: .2; }
          100% { transform: translateY(-30px); opacity: 0; }
        }
        @keyframes sd-drift {
          0%   { transform: translate(0, 0); opacity: 0; }
          15%  { opacity: .45; }
          85%  { opacity: .25; }
          100% { transform: translate(10px, -50px); opacity: 0; }
        }
        @keyframes sd-factin {
          0%   { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0);   opacity: 1; }
        }
        html[data-motion=off] .sd-bub,
        html[data-motion=off] .sd-mote,
        html[data-motion=off] .sd-arm { animation: none !important; }
      `}</style>

      {/* dockside base -- always present, the light this sequence
          starts and ends on */}
      <div
        className="nc-anim absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, #FCEFC7 0%, ${DOCK_LIGHT} 45%, #C9A15C 100%)`,
          animation: "verdictIn 600ms ease-out both",
        }}
      />
      <div
        className="nc-anim absolute"
        style={{ left: "50%", top: "-8vh", marginLeft: -110, animation: `sd-hull ${DONE_AT}ms linear both` }}
      >
        <Hull />
      </div>

      {/* the underwater scene, veiled in for the dive and out again for
          the surface */}
      <div className="absolute inset-0" style={{ animation: `sd-veil ${DONE_AT}ms linear both` }}>
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${SHALLOW} 0%, ${MID} 45%, ${DEEP} 80%, ${SILT_FLOOR} 100%)` }}
        />

        {MOTES.map((m, i) => (
          <div
            key={i}
            className="sd-mote absolute rounded-full"
            style={{
              left: `${m.x}%`, top: `${m.top}vh`, width: m.size, height: m.size,
              background: MOTE, opacity: 0,
              animation: `sd-drift ${m.dur}ms ease-in-out ${m.delay}ms infinite`,
            }}
          />
        ))}

        {/* three sponges on the bed, plucked into the bag one at a time */}
        {FLOOR_SPONGES.map((s, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: "50%", top: "62vh", marginLeft: s.dx, animation: `sd-plucked 260ms ease-in ${HARVEST[i]}ms both` }}
          >
            <Sponge />
          </div>
        ))}

        {/* the hose, growing with the descent and shortening with the
            haul-up -- never off screen, the lifeline never let go */}
        <div
          className="absolute"
          style={{
            left: "50%", top: 0, marginLeft: -2, width: 4, height: "60vh",
            background: `linear-gradient(to bottom, ${HOSE_COLOR}, ${HOSE_COLOR}CC)`,
            borderRadius: 2,
            transformOrigin: "top",
            willChange: "transform",
            animation: `sd-hose ${DIVE_DUR}ms ease-in-out ${SINK_AT}ms both`,
          }}
        />

        <div
          className="absolute"
          style={{
            left: "50%", top: "8vh", marginLeft: -DIVER_W / 2,
            willChange: "transform",
            animation: `sd-depth ${DIVE_DUR}ms ease-in-out ${SINK_AT}ms both`,
          }}
        >
          <Diver />

          {/* exhaust, venting from the one point a real helmet vents
              from rather than trailing off the whole body */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="sd-bub absolute rounded-full"
              style={{
                left: 48 + i * 4, top: 16, width: 3, height: 3,
                background: MOTE, opacity: 0,
                animation: `sd-bubrise 1300ms ease-in ${i * 260}ms infinite`,
              }}
            />
          ))}

          <div className="absolute" style={{ left: 4, top: 74, animation: `sd-tug 260ms ease-in-out ${FULL_AT}ms 1` }}>
            <Bag />
          </div>
        </div>
      </div>

      {/* the two hard cuts -- under, then back up into the light */}
      <div className="nc-anim absolute inset-0" style={{ background: MID, animation: `sc-flash 350ms ease-out ${SINK_AT}ms both` }} />
      <div className="nc-anim absolute inset-0" style={{ background: DOCK_LIGHT, animation: `sc-flash 450ms ease-out ${SURFACE_AT}ms both` }} />

      {/* the fact, once the light is back */}
      <div className="absolute inset-x-0" style={{ top: "44vh", textAlign: "center" }}>
        <div
          className="nc-anim inline-block font-mono uppercase"
          style={{
            fontSize: 13, letterSpacing: 1.4, color: HULL_COLOR,
            textShadow: `0 0 10px ${DOCK_LIGHT}`,
            animation: `sd-factin 500ms ease-out ${FACT_AT}ms both`,
          }}
        >
          1905 · first hard-hat descent, from the Dodecanese
        </div>
      </div>
    </div>
  );
}
