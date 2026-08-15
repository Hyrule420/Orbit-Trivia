"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { useC } from "../../lib/theme";
import Starfield from "../art/Starfield";
import Logo from "../art/Logo";
import Btn from "../ui/Btn";

/* ============================================================
   WELCOME — shown exactly once, the first time a device ever
   reaches the app (after the Moon/Mars pick, which happens on
   every launch and so can't be the "have they been here before"
   signal itself — see OrbitTrivia.jsx). Also reachable on demand
   from the profile screen, for testing and for anyone who wants
   to replay First Orbit.

   Full-screen and unmissable on purpose, the same weight as
   PlanetPicker gets, rather than a card competing with the rest
   of Home for attention. Start is the obvious, styled choice;
   Skip is real and always available, just visually quieter.
   ============================================================ */
export default function Welcome({ onStart, onSkip }) {
  const C = useC();

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        <div className="mb-6" style={{ animation: "verdictIn .6s cubic-bezier(.2,.8,.2,1) both" }}>
          <Logo size={34} />
        </div>

        <div style={{ animation: "verdictIn .6s cubic-bezier(.2,.8,.2,1) .1s both" }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: C.ion }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.ion, letterSpacing: "0.18em" }}>
              NEW HERE?
            </span>
          </div>
          <h1 style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 28, color: C.star, lineHeight: 1.15 }}>
            Welcome aboard
          </h1>
          <p className="text-sm mt-3" style={{ color: C.dim, lineHeight: 1.6 }}>
            First Orbit is ten easy questions with the good stuff explained as you go —
            the fastest way to get a feel for the game before you're thrown at the hard stuff.
          </p>
        </div>

        <div className="w-full mt-8" style={{ animation: "verdictIn .6s cubic-bezier(.2,.8,.2,1) .2s both" }}>
          <Btn full onClick={onStart} style={{ padding: "16px", fontSize: 16 }}>
            Start First Orbit
          </Btn>
          <button
            onClick={onSkip}
            className="w-full mt-4 active:scale-95"
            style={{
              fontFamily: "'Chakra Petch', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: C.dim,
              transition: "transform .12s ease, color .2s ease",
            }}
          >
            Skip, take me straight in
          </button>
        </div>
      </div>
    </div>
  );
}
