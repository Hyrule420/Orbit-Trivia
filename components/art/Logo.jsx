"use client";

import React from "react";
import { Rocket } from "lucide-react";
import { useC } from "../../lib/theme";

export default function Logo({ size = 28, palette, rocketPhase = "idle", onRocketTap }) {
  const ctx = useC();
  const C = palette || ctx;
  return (
    <div className="flex items-center gap-2">
      <div
        onClick={onRocketTap}
        className={`flex items-center justify-center rounded-xl ${onRocketTap ? "active:scale-90" : ""}`}
        style={{
          width: size + 12,
          height: size + 12,
          background: `linear-gradient(135deg, ${C.ion}22, ${C.plasma}33)`,
          border: `1px solid ${C.ion}55`,
          cursor: onRocketTap ? "pointer" : "default",
          transition: "transform .12s ease",
        }}
      >
        <span
          style={{
            position: "relative",
            display: "inline-block",
            animation:
              rocketPhase === "flying"
                ? "miniLaunch 1.7s cubic-bezier(.5,.02,.85,.4) both"
                : rocketPhase === "returning"
                ? "miniReturn .6s cubic-bezier(.2,.8,.2,1) both"
                : "none",
          }}
        >
          <Rocket size={size - 6} style={{ color: C.ion, animation: "drift 4.5s ease-in-out infinite" }} />
          {rocketPhase === "flying" && (
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: "68%",
                marginLeft: -6,
                width: 12,
                height: 34,
                background: `linear-gradient(180deg, #FFFFFF 0%, ${C.ion} 25%, ${C.abort} 60%, transparent 100%)`,
                filter: "blur(3px)",
                borderRadius: "50% 50% 50% 50% / 22% 22% 78% 78%",
                animation: "plume .14s ease-in-out infinite alternate",
              }}
            />
          )}
        </span>
      </div>
      <div>
        <div
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontWeight: 700,
            fontSize: size * 0.72,
            color: C.star,
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          ORBIT
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: size * 0.3,
            color: C.dim,
            letterSpacing: "0.22em",
            marginTop: 2,
          }}
        >
          TRIVIA
        </div>
      </div>
    </div>
  );
}
