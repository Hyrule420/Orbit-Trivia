"use client";

import React, { useEffect } from "react";
import { Rocket } from "lucide-react";
import { useC } from "../../lib/theme";
import { SFX } from "../../lib/sfx";

/* Full-screen liftoff for a perfect round. Plays once, then clears itself.
   Real launches don't just slide upward — the vehicle shudders on the pad,
   then accelerates away while smoke hangs where it stood. */
export default function LaunchCelebration({ onDone, small = false, kicker = "FLAWLESS RUN", title = "PERFECT" }) {
  const C = useC();
  useEffect(() => {
    const t = setTimeout(onDone, small ? 2600 : 3400);
    return () => clearTimeout(t);
  }, [onDone, small]);

  /* The pad shudder runs for about a second before the vehicle
     actually moves, so the roar waits for it rather than firing
     the instant the screen appears. */
  useEffect(() => {
    const t = setTimeout(() => SFX.liftoff(!small), small ? 500 : 750);
    return () => clearTimeout(t);
  }, [small]);

  const smoke = small ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6, 7];
  const streaks = [12, 26, 41, 57, 72, 88];
  const rocketSize = small ? 48 : 68;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* speed streaks — the sky rushing past */}
      {streaks.map((x, i) => (
        <div
          key={`st-${i}`}
          className="absolute"
          style={{
            left: `${x}%`,
            top: "-20%",
            width: 2,
            height: "34%",
            background: `linear-gradient(180deg, transparent, ${C.star})`,
            opacity: 0.5,
            animation: `skyfall 1.1s linear ${0.9 + i * 0.12}s both`,
          }}
        />
      ))}

      {/* the vehicle: shudder on the pad, then liftoff */}
      <div
        className="absolute"
        style={{
          left: "50%",
          bottom: 0,
          marginLeft: small ? -24 : -34,
          animation: `liftoff ${small ? 2.2 : 3.2}s cubic-bezier(.55,.02,.85,.4) both`,
        }}
      >
        <div style={{ animation: "padshake .12s linear 0s 8" }}>
          <Rocket size={rocketSize} style={{ color: C.star, transform: "rotate(-45deg)", filter: `drop-shadow(0 0 26px ${C.ion})` }} />
          {/* exhaust plume — blooms wider than the vehicle */}
          <div
            className="absolute"
            style={{
              left: "50%",
              top: small ? 38 : 52,
              marginLeft: small ? -13 : -17,
              width: small ? 26 : 34,
              height: small ? 95 : 130,
              background: `linear-gradient(180deg, #FFFFFF 0%, ${C.ion} 22%, ${C.abort} 55%, transparent 100%)`,
              filter: "blur(7px)",
              borderRadius: "50% 50% 50% 50% / 22% 22% 78% 78%",
              animation: "plume .16s ease-in-out infinite alternate",
            }}
          />
        </div>
      </div>

      {/* pad smoke — hangs low after the rocket is gone */}
      {smoke.map((i) => (
        <div
          key={`sm-${i}`}
          className="absolute rounded-full"
          style={{
            left: `calc(50% + ${(i - 3.5) * 34}px)`,
            bottom: -26,
            width: 62 + (i % 3) * 22,
            height: 62 + (i % 3) * 22,
            background: `radial-gradient(circle, ${C.dim}66 0%, transparent 68%)`,
            filter: "blur(9px)",
            animation: `smokeout 2.6s ease-out ${0.55 + (i % 4) * 0.14}s both`,
          }}
        />
      ))}

      {/* the verdict */}
      <div
        className="absolute inset-x-0 text-center px-6"
        style={{ top: "34%", animation: `verdictIn .7s cubic-bezier(.2,.8,.2,1) ${small ? 1.0 : 1.5}s both` }}
      >
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.ion, letterSpacing: "0.3em" }}>
          {kicker}
        </div>
        <div
          className="truncate"
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontWeight: 700,
            fontSize: small ? 30 : 44,
            color: C.star,
            textShadow: `0 0 34px ${C.ion}`,
            marginTop: 6,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
