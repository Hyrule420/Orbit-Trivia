"use client";

import React from "react";
import { Rocket } from "lucide-react";
import { useC } from "../../lib/theme";

const ALTITUDES = [{ at: 0 }, { at: 0.33 }, { at: 0.66 }, { at: 1 }];

export default function TrajectoryRail({ progress, heat = 0 }) {
  const C = useC();
  const p = Math.max(0, Math.min(1, progress));
  const h = Math.min(1, heat / 6);
  return (
    <div className="relative w-11 flex-shrink-0" aria-hidden="true">
      <div className="absolute rounded-full" style={{ left: 20, top: 0, bottom: 0, width: 2, background: C.edge }} />
      <div
        className="absolute rounded-full"
        style={{
          left: 20,
          bottom: 0,
          width: 2,
          height: `${p * 100}%`,
          background: `linear-gradient(0deg, ${C.ion}, ${C.plasma})`,
          transition: "height .7s cubic-bezier(.2,.8,.2,1)",
        }}
      />
      {ALTITUDES.map((m, i) => (
        <div key={i} className="absolute" style={{ bottom: `${m.at * 100}%`, left: 14 }}>
          <div
            className="rounded-full"
            style={{
              width: 14,
              height: 14,
              marginBottom: -7,
              background: p >= m.at ? C.ion : C.hull,
              border: `2px solid ${p >= m.at ? C.ion : C.edge}`,
              boxShadow: p >= m.at ? `0 0 12px ${C.ion}88` : "none",
              transition: "all .5s ease",
            }}
          />
        </div>
      ))}
      {h > 0 && (
        <div
          className="absolute rounded-full"
          style={{
            left: 16,
            bottom: `calc(${p * 100}% - 24px)`,
            width: 13,
            height: 13 + h * 22,
            background: `linear-gradient(180deg, ${C.abort}, transparent)`,
            filter: `blur(${3 + h * 3}px)`,
            opacity: 0.45 + h * 0.55,
            transition: "bottom .7s cubic-bezier(.2,.8,.2,1), height .4s ease, opacity .4s ease",
            animation: "flicker .35s ease-in-out infinite alternate",
          }}
        />
      )}
      <div
        className="absolute"
        style={{ left: 5, bottom: `calc(${p * 100}% - 15px)`, transition: "bottom .7s cubic-bezier(.2,.8,.2,1)" }}
      >
        <Rocket
          size={32}
          style={{
            color: C.star,
            filter: `drop-shadow(0 0 ${9 + h * 20}px ${h > 0 ? C.abort : C.plasma})`,
            transform: "rotate(-45deg)",
            animation: h >= 1 ? "blaze .9s ease-in-out infinite" : "none",
          }}
        />
      </div>
    </div>
  );
}
