"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useC } from "../../lib/theme";
import { TESLA_MODELS } from "../../lib/questions";
import { TIER_ORDER } from "../../lib/spread";
import { tierPct } from "../../lib/skill";
import Starfield from "../art/Starfield";
import Section from "../ui/Section";
import Btn from "../ui/Btn";

export default function ProfileScreen({ profile, onSave, onBack, onReplayWelcome, skill }) {
  const C = useC();
  const [name, setName] = useState(profile.name || "");
  const [handle, setHandle] = useState(profile.handle || "");
  const [model, setModel] = useState(profile.model || "");

  const field = {
    background: C.hullLight,
    border: `1px solid ${C.edge}`,
    color: C.star,
    fontFamily: "'Chakra Petch', sans-serif",
  };

  return (
    <div className="relative min-h-screen p-6" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 max-w-md mx-auto pb-8">
        <div className="flex items-center justify-between mb-6 pt-2">
          <h1 style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 24, color: C.star }}>
            Your profile
          </h1>
          <button onClick={onBack} className="active:scale-90" style={{ transition: "transform .12s" }}>
            <X size={22} style={{ color: C.dim }} />
          </button>
        </div>

        <p className="text-sm mb-6" style={{ color: C.dim, lineHeight: 1.6 }}>
          Saved on this device only. Nothing is uploaded anywhere yet.
        </p>

        <Section label="YOUR ORBIT">
          {(skill?.seen || 0) < 8 ? (
            <p className="text-sm" style={{ color: C.dim, lineHeight: 1.55 }}>
              Play a Daily or an Adaptive Crew run — after a handful of answers the mix will start sliding with you.
            </p>
          ) : (
            <div className="flex items-center justify-around py-1">
              {TIER_ORDER.map((tier) => {
                const pct = tierPct(skill, tier);
                return (
                  <div key={tier} className="text-center">
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: C.star }}>
                      {pct === null ? "—" : `${pct}%`}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.dim, letterSpacing: "0.12em", marginTop: 4 }}>
                      {tier.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section label="DISPLAY NAME">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={18}
            placeholder="What should we call you?"
            className="w-full px-3 py-3 rounded-xl text-sm outline-none"
            style={field}
          />
        </Section>

        <Section label="X USERNAME · OPTIONAL">
          <div className="flex items-center gap-2 px-3 rounded-xl" style={field}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: C.dim }}>@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/^@+/, ""))}
              maxLength={15}
              placeholder="yourhandle"
              className="flex-1 py-3 text-sm outline-none bg-transparent"
              style={{ color: C.star, fontFamily: "'Chakra Petch', sans-serif", border: "none" }}
            />
          </div>
        </Section>

        <Section label="WHAT DO YOU DRIVE?">
          <div className="flex flex-wrap gap-2">
            {TESLA_MODELS.map((m) => {
              const on = model === m;
              return (
                <button
                  key={m}
                  onClick={() => setModel(on ? "" : m)}
                  className="px-3 py-2 rounded-full text-xs active:scale-95"
                  style={{
                    background: on ? `${C.ion}22` : C.hullLight,
                    border: `1px solid ${on ? C.ion : C.edge}`,
                    color: on ? C.ion : C.dim,
                    fontFamily: "'Chakra Petch', sans-serif",
                    fontWeight: 600,
                    transition: "all .18s",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </Section>

        <Btn
          full
          onClick={() => onSave({ name: name.trim(), handle: handle.trim(), model })}
          style={{ padding: "16px", fontSize: 16 }}
        >
          Save profile
        </Btn>

        {onReplayWelcome && (
          <Btn full variant="ghost" onClick={onReplayWelcome} style={{ marginTop: 12 }}>
            Replay First Orbit
          </Btn>
        )}
      </div>
    </div>
  );
}
