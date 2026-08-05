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

/* 3-2-1 on the pad before the first question. Tap anywhere to skip —
   nobody wants to sit through this on their twentieth run. */
export default function CountdownLaunch({ onDone }) {
  const C = useC();
  const [n, setN] = useState(3);
  const flavorOffset = useRef(Math.floor(Math.random() * FLAVOR_LINES.length));

  useEffect(() => {
    const t = setTimeout(() => (n > 0 ? setN(n - 1) : onDone()), n > 0 ? 850 : 950);
    return () => clearTimeout(t);
  }, [n, onDone]);

  const lifting = n === 0;

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
          animation: lifting ? "liftoff 1.1s cubic-bezier(.5,.02,.85,.4) both" : "none",
        }}
      >
        <div style={{ animation: "padshake .1s linear infinite" }}>
          <Rocket size={52} style={{ color: C.star, transform: "rotate(-45deg)", filter: `drop-shadow(0 0 20px ${C.ion})` }} />
          <div
            className="absolute"
            style={{
              left: "50%",
              top: 40,
              marginLeft: -14,
              width: 28,
              height: lifting ? 110 : 34 + (3 - n) * 16,
              background: `linear-gradient(180deg, #FFFFFF 0%, ${C.ion} 24%, ${C.abort} 58%, transparent 100%)`,
              filter: "blur(6px)",
              borderRadius: "50% 50% 50% 50% / 22% 22% 78% 78%",
              transition: "height .5s ease",
              animation: "plume .16s ease-in-out infinite alternate",
            }}
          />
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
