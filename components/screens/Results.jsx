"use client";

import React, { useState } from "react";
import { Trophy, Share2 } from "lucide-react";
import { useC } from "../../lib/theme";
import Starfield from "../art/Starfield";
import LaunchCelebration from "../art/LaunchCelebration";
import Panel from "../ui/Panel";
import Btn from "../ui/Btn";

export default function Results({ data, onHome, onAgain, profile = {} }) {
  const C = useC();
  const { players, scores, correctCounts, bestStreaks, totalRounds } = data;
  const ranked = players
    .map((name, i) => ({ name, score: scores[i], correct: correctCounts[i], streak: bestStreaks[i] }))
    .sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const solo = players.length === 1;
  const perfect = winner.correct === totalRounds && totalRounds >= 5;
  const winnerLaunch = !perfect && !solo;
  const [celebrating, setCelebrating] = useState(perfect || winnerLaunch);
  const newBest = solo && (data.prevBest || 0) > 0 && winner.score > data.prevBest;

  const share = () => {
    const ride = profile.model && profile.model !== "Not yet" ? ` ${profile.model} owner here.` : "";
    const text = solo
      ? `I scored ${winner.score} on Orbit Trivia — ${winner.correct}/${totalRounds} on Tesla, SpaceX and Elon deep cuts.${ride} Think you can beat that? 🚀`
      : `${winner.name} just took the car with ${winner.score} points on Orbit Trivia 🚀 Tesla + SpaceX deep cuts. Who's beating that?`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="relative min-h-screen p-6" style={{ background: C.void }}>
      <Starfield />
      {celebrating && (
        <LaunchCelebration
          small={!perfect}
          kicker={perfect ? "FLAWLESS RUN" : "ROAD TRIP CHAMPION"}
          title={perfect ? "PERFECT" : winner.name.toUpperCase()}
          onDone={() => setCelebrating(false)}
        />
      )}
      <div className="relative z-10 max-w-md mx-auto">
        <div className="text-center pt-8 pb-8">
          <div
            className="mx-auto mb-5 flex items-center justify-center rounded-full"
            style={{
              width: 76,
              height: 76,
              background: `linear-gradient(135deg, ${C.ion}22, ${C.plasma}33)`,
              border: `1px solid ${C.ion}66`,
              boxShadow: `0 0 40px ${C.ion}33`,
            }}
          >
            <Trophy size={32} style={{ color: C.ion }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: "0.22em" }}>
            {solo ? "RUN COMPLETE" : "FINAL STANDINGS"}
          </div>
          <h1 className="mt-2" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 32, color: C.star }}>
            {solo ? `${winner.score} points` : `${winner.name} wins`}
          </h1>
          {newBest && (
            <div
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full"
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
          {!solo && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: C.ion, marginTop: 4 }}>{winner.score} PTS</div>
          )}
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {ranked.map((p, i) => (
            <Panel key={p.name + i} className="p-4" style={{ borderColor: i === 0 ? `${C.ion}66` : C.edge, background: i === 0 ? `${C.ion}0E` : C.hull }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    background: i === 0 ? `${C.ion}22` : C.hullLight,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: i === 0 ? C.ion : C.dim,
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 16, color: C.star }}>
                    {p.name}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, marginTop: 2 }}>
                    {p.correct}/{totalRounds} CORRECT · BEST STREAK {p.streak}
                  </div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 700, color: i === 0 ? C.ion : C.star }}>
                  {p.score}
                </div>
              </div>
            </Panel>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Btn full onClick={share} style={{ padding: "15px", fontSize: 15 }}>
            <span className="flex items-center justify-center gap-2"><Share2 size={17} /> Share to X</span>
          </Btn>
          <Btn full variant="solid" onClick={onAgain}>Run it again</Btn>
          <Btn full variant="ghost" onClick={onHome}>Back to launchpad</Btn>
        </div>
      </div>
    </div>
  );
}
