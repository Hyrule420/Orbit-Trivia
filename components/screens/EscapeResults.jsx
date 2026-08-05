"use client";

import React, { useState } from "react";
import { Trophy, Check, Share2, Flame } from "lucide-react";
import { useC } from "../../lib/theme";
import { ESCAPE } from "../../lib/escape";
import Starfield from "../art/Starfield";
import LaunchCelebration from "../art/LaunchCelebration";
import Panel from "../ui/Panel";
import Stat from "../ui/Stat";
import Btn from "../ui/Btn";

export default function EscapeResults({ data, profile = {}, prevBest, onHome, onAgain }) {
  const C = useC();
  const { velocity, cleared, peakMult, escaped } = data;
  const [celebrating, setCelebrating] = useState(escaped);
  const newBest = (prevBest || 0) > 0 && velocity > prevBest;

  /* Where you ended up, in plain terms. */
  const verdict = velocity >= 29.8
    ? { label: "OUTRAN THE PLANET", note: "Faster than Earth's own trip around the Sun.", color: C.plasma }
    : velocity >= 16.6
    ? { label: "SOLAR ESCAPE", note: "Fast enough to leave the Sun's grip entirely.", color: C.plasma }
    : escaped
    ? { label: "BROKE FREE", note: "Past 11.2 km/s — Earth couldn't hold you.", color: C.thrust }
    : velocity >= 7.8
    ? { label: "IN ORBIT", note: "Fast enough to circle, not enough to leave.", color: C.ion }
    : { label: "FELL BACK", note: "Gravity got you before orbit.", color: C.abort };

  const share = () => {
    const ride = profile.model && profile.model !== "Not yet" ? ` ${profile.model} owner here.` : "";
    const text = escaped
      ? `Hit ${velocity.toFixed(1)} km/s on Orbit Trivia's Escape Velocity run and broke free of Earth — ${cleared} questions deep before gravity won.${ride} Escape velocity is 11.2 km/s. Beat it. 🚀`
      : `Got to ${velocity.toFixed(1)} km/s on Orbit Trivia's Escape Velocity run — ${cleared} questions deep. Need 11.2 km/s to break free of Earth.${ride} 🚀`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="relative min-h-screen p-6" style={{ background: C.void }}>
      <Starfield />
      {celebrating && (
        <LaunchCelebration kicker="ESCAPE VELOCITY" title={`${velocity.toFixed(1)} KM/S`} onDone={() => setCelebrating(false)} />
      )}
      <div className="relative z-10 max-w-md mx-auto">
        <div className="text-center pt-10 pb-8">
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: "0.22em" }}>
            FINAL VELOCITY
          </div>
          <h1
            className="mt-1"
            style={{
              fontFamily: "'Chakra Petch', sans-serif",
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 1.05,
              color: C.star,
              textShadow: `0 0 40px ${verdict.color}`,
            }}
          >
            {velocity.toFixed(1)}
            <span style={{ fontSize: 20, color: C.dim, marginLeft: 6 }}>km/s</span>
          </h1>
          <div
            className="inline-block mt-3 px-3 py-1.5 rounded-full"
            style={{
              background: `${verdict.color}14`,
              border: `1px solid ${verdict.color}66`,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: verdict.color,
            }}
          >
            {verdict.label}
          </div>
          <p className="text-sm mt-3" style={{ color: C.dim }}>{verdict.note}</p>
          {newBest && (
            <div
              className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full"
              style={{
                background: `${C.thrust}14`,
                border: `1px solid ${C.thrust}66`,
                boxShadow: `0 0 24px ${C.thrust}33`,
                animation: "verdictIn .6s cubic-bezier(.2,.8,.2,1) .4s both",
              }}
            >
              <Trophy size={13} style={{ color: C.thrust }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: C.thrust, letterSpacing: "0.16em" }}>
                NEW PERSONAL BEST
              </span>
            </div>
          )}
        </div>

        {/* how far along the climb you got */}
        <Panel className="p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.16em" }}>
              PAD
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: escaped ? C.thrust : C.dim, letterSpacing: "0.16em" }}>
              11.2 — ESCAPE
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: C.edge }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (velocity / 11.2) * 100)}%`,
                background: escaped ? C.thrust : `linear-gradient(90deg, ${C.ion}, ${C.plasma})`,
                boxShadow: escaped ? `0 0 16px ${C.thrust}` : "none",
                transition: "width 1s cubic-bezier(.2,.8,.2,1)",
              }}
            />
          </div>
        </Panel>

        <Panel className="p-4 mb-6">
          <div className="flex items-center justify-around">
            <Stat icon={<Check size={14} />} label="CLEARED" value={cleared} color={C.thrust} />
            <div style={{ width: 1, height: 32, background: C.edge }} />
            <Stat icon={<Flame size={14} />} label="PEAK MULT" value={`×${peakMult.toFixed(2)}`} color={C.plasma} />
            <div style={{ width: 1, height: 32, background: C.edge }} />
            <Stat icon={<Trophy size={14} />} label="BEST" value={Math.max(prevBest || 0, velocity).toFixed(1)} color={C.ion} />
          </div>
        </Panel>

        <div className="flex flex-col gap-2 pb-8">
          <Btn full onClick={share} style={{ padding: "15px", fontSize: 15 }}>
            <span className="flex items-center justify-center gap-2"><Share2 size={17} /> Share to X</span>
          </Btn>
          <Btn full variant="solid" onClick={onAgain}>Launch again</Btn>
          <Btn full variant="ghost" onClick={onHome}>Back to launchpad</Btn>
        </div>
      </div>
    </div>
  );
}
