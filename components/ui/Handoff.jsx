"use client";

import React from "react";
import { Rocket } from "lucide-react";
import { useC } from "../../lib/theme";
import Starfield from "../art/Starfield";
import Btn from "./Btn";

export default function Handoff({ name, onReady, roundNum, totalRounds }) {
  const C = useC();
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 text-center max-w-sm">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: "0.22em", marginBottom: 20 }}>
          QUESTION {roundNum} OF {totalRounds}
        </div>
        <div
          className="mx-auto mb-6 flex items-center justify-center rounded-full"
          style={{ width: 88, height: 88, background: `linear-gradient(135deg, ${C.ion}22, ${C.plasma}33)`, border: `1px solid ${C.ion}55` }}
        >
          <Rocket size={38} style={{ color: C.ion, transform: "rotate(-45deg)" }} />
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.dim, letterSpacing: "0.2em" }}>
          PASS THE PHONE TO
        </div>
        <h1 className="my-3" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 38, color: C.star }}>
          {name}
        </h1>
        <p className="text-sm mb-8" style={{ color: C.dim }}>
          Tap when you've got it. The timer starts immediately.
        </p>
        <Btn full onClick={onReady} style={{ padding: "16px", fontSize: 16 }}>I'm ready</Btn>
      </div>
    </div>
  );
}
