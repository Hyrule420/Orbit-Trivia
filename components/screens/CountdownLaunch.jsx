"use client";

import React, { useState, useEffect, useRef } from "react";
import { Rocket } from "lucide-react";
import { useC } from "../../lib/theme";
import { buzz } from "../../lib/util";
import { SFX } from "../../lib/sfx";
import Starfield from "../art/Starfield";

const FLAVOR_LINES = [
  "TELEMETRY NOMINAL",
  "FUEL AT CAPACITY",
  "GUIDANCE LOCKED",
  "WEATHER IS GO",
  "RANGE IS CLEAR",
  "PROPELLANT PRESSURIZED",
  "STRONGBACK RETRACTED",
  "FLIGHT COMPUTER ARMED",
  "TRAJECTORY PLOTTED",
];

/* The exhaust, built outward from the core. Widest and softest first so
   it sits behind; the narrow bright core lands last and on top.

   Blur is roughly proportional to width on purpose: a wide layer needs
   a wide blur or its own silhouette shows through as an edge, which is
   what makes a plume look like a shape rather than light. Each layer
   churns at its own rate so they never pulse in unison. */
const PLUME = [
  { w: 76, scale: 1.30, blur: 22, churn: 0.31,
    bg: (C) => `radial-gradient(ellipse at 50% 6%, ${C.abort}AA 0%, ${C.abort}55 34%, ${C.plasma}22 58%, transparent 76%)` },
  { w: 48, scale: 1.12, blur: 14, churn: 0.25,
    bg: (C) => `linear-gradient(180deg, ${C.plasma}DD 0%, ${C.plasma}88 38%, ${C.abort}66 68%, transparent 94%)` },
  { w: 27, scale: 0.96, blur: 8, churn: 0.19,
    bg: (C) => `linear-gradient(180deg, #FFFFFF 0%, ${C.ion}DD 16%, ${C.plasma}77 58%, transparent 92%)` },
  { w: 10, scale: 0.74, blur: 3, churn: 0.13,
    bg: (C) => `linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 26%, ${C.ion}CC 62%, transparent 100%)` },
];

/* Standing shock diamonds down the core. Spaced unevenly and beating at
   different rates, because evenly spaced identical dots read as a
   pattern rather than as physics. */
const MACH = [
  { at: 0.20, w: 13, h: 7, beat: 0.21 },
  { at: 0.35, w: 10, h: 6, beat: 0.27 },
  { at: 0.49, w: 7,  h: 5, beat: 0.17 },
];

/* 3-2-1 on the pad before the first question. Tap anywhere to skip —
   nobody wants to sit through this on their twentieth run. */
export default function CountdownLaunch({ onDone }) {
  const C = useC();
  const [n, setN] = useState(3);
  const flavorOffset = useRef(Math.floor(Math.random() * FLAVOR_LINES.length));

  /* The liftoff hang time is tied to the CSS animation's own duration
     (see the "liftoff" keyframe usage below) -- it used to be shorter
     than the animation, cutting the rocket's climb off early. */
  const LIFTOFF_HANG_MS = 1400;

  useEffect(() => {
    const t = setTimeout(() => (n > 0 ? setN(n - 1) : onDone()), n > 0 ? 850 : LIFTOFF_HANG_MS);
    return () => clearTimeout(t);
  }, [n, onDone]);

  const lifting = n === 0;
  /* Grows through the count, then opens right up at ignition. Every
     plume layer is sized off this one number so they stay in
     proportion to each other. */
  const plumeH = lifting ? 120 : 34 + (3 - n) * 16;

  /* Engines spool up for the whole countdown, then hand off to the
     roar. Stopped on unmount too, so skipping past never leaves it
     humming under the first question. */
  useEffect(() => {
    SFX.engineUp(2.6);
    return () => SFX.engineOff(0.2);
  }, []);

  useEffect(() => {
    if (n > 0) SFX.count(n);
  }, [n]);

  useEffect(() => {
    if (lifting) {
      buzz([15, 40, 15, 40, 60]);
      SFX.engineOff(0.15);
      SFX.liftoff(true);
    }
  }, [lifting]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
      style={{ background: C.void }}
      onClick={onDone}
    >
      <Starfield comets={false} />

      {/* the number, or LIFTOFF */}
      <div className="relative z-10 text-center" style={{ marginBottom: "18vh" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: "0.32em" }}>
          {lifting ? "ALL SYSTEMS GO" : "LAUNCH SEQUENCE"}
        </div>
        <div
          key={n}
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontWeight: 700,
            fontSize: lifting ? 48 : 96,
            color: C.star,
            textShadow: `0 0 40px ${lifting ? C.abort : C.ion}`,
            lineHeight: 1.1,
            marginTop: 8,
            animation: lifting ? "verdictIn .5s cubic-bezier(.2,.8,.2,1) both" : "countBeat .85s ease-out both",
          }}
        >
          {lifting ? "LIFTOFF" : n}
        </div>
        {!lifting && (
          <div
            key={`f${n}`}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: C.ion,
              letterSpacing: "0.24em",
              marginTop: 12,
              animation: "verdictIn .4s ease-out .15s both",
            }}
          >
            {FLAVOR_LINES[(flavorOffset.current + n) % FLAVOR_LINES.length]}
          </div>
        )}
      </div>

      {/* rocket on the pad, engines building, then gone */}
      <div
        className="absolute"
        style={{
          left: "50%",
          bottom: "6vh",
          marginLeft: -26,
          animation: lifting ? "liftoff 1.4s cubic-bezier(.5,.02,.85,.4) both" : "none",
        }}
      >
        <div className="cl-anim" style={{ animation: "padshake .1s linear infinite" }}>
          <Rocket size={52} style={{ color: C.star, transform: "rotate(-45deg)", filter: `drop-shadow(0 0 20px ${C.ion})` }} />

          {/* The exhaust. Deliberately NOT one gradient bar -- a single
              strip of colour stops reads as stripes, because that is
              literally what it is. Real exhaust is light stacked on
              light: a narrow white core inside a wider hot sheath
              inside a broad soft bloom.

              Each layer blends with screen, so where they overlap the
              light ADDS the way real emission does, and the colour
              transitions come out of the compositing rather than being
              painted as bands. Widths and blurs are tuned so no layer
              has a visible edge of its own. */}
          {PLUME.map((p, i) => (
            <div
              key={i}
              className="cl-anim absolute"
              style={{
                left: "50%",
                top: 40,
                marginLeft: -p.w / 2,
                width: p.w,
                height: plumeH * p.scale,
                background: p.bg(C),
                filter: `blur(${p.blur}px)`,
                borderRadius: "50% 50% 46% 46% / 16% 16% 84% 84%",
                mixBlendMode: "screen",
                transformOrigin: "50% 0%",
                transition: "height .5s ease",
                animation: `plumeChurn ${p.churn}s ease-in-out infinite alternate`,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* White-hot bloom right at the nozzle, where the gas is
              densest and nothing has cooled yet. */}
          <div
            className="cl-anim absolute"
            style={{
              left: "50%",
              top: 34,
              marginLeft: -21,
              width: 42,
              height: 42,
              background: `radial-gradient(circle, #FFFFFF 0%, ${C.ion}CC 34%, ${C.plasma}55 62%, transparent 78%)`,
              filter: "blur(7px)",
              mixBlendMode: "screen",
              animation: "plumeChurn .17s ease-in-out infinite alternate",
              pointerEvents: "none",
            }}
          />

          {/* Shock diamonds, only once the engine is at full flow. */}
          {lifting && MACH.map((m, i) => (
            <div
              key={`m${i}`}
              className="cl-anim absolute"
              style={{
                left: "50%",
                top: 40 + plumeH * m.at,
                marginLeft: -m.w / 2,
                width: m.w,
                height: m.h,
                background: `radial-gradient(ellipse, #FFFFFF 0%, ${C.ion}AA 45%, transparent 72%)`,
                filter: "blur(2px)",
                borderRadius: "50%",
                mixBlendMode: "screen",
                animation: `machPulse ${m.beat}s ease-in-out infinite alternate`,
                pointerEvents: "none",
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="absolute inset-x-0 text-center"
        style={{ bottom: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.18em" }}
      >
        TAP TO SKIP
      </div>
    </div>
  );
}
