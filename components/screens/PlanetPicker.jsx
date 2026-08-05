"use client";

import React, { useState } from "react";
import { THEMES, ThemeCtx } from "../../lib/theme";
import { SFX } from "../../lib/sfx";
import Starfield from "../art/Starfield";
import Logo from "../art/Logo";
import MoonBody from "../art/MoonBody";
import MarsBody from "../art/MarsBody";

/* ============================================================
   PLANET CHOOSER
   ============================================================ */
export default function PlanetPicker({ onPick }) {
  const [hover, setHover] = useState(null);
  return (
    <ThemeCtx.Provider value={THEMES.moon}>
      <div className="relative min-h-screen flex flex-col" style={{ background: "#03040A" }}>
        <Starfield />

        <div className="relative z-10 pt-10 pb-2 px-6 text-center">
          <div className="flex justify-center mb-6">
            <Logo size={30} palette={THEMES.moon} />
          </div>
          <h1 style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 30, color: "#E8ECF8", lineHeight: 1.1 }}>
            Choose your side
          </h1>
          <p className="text-sm mt-2" style={{ color: "#7C89A8" }}>
            Same questions either way. Pick the one you'd rather look at.
          </p>
        </div>

        <div className="relative z-10 flex-1 flex flex-col sm:flex-row">
          {[
            { t: THEMES.moon, Body: MoonBody },
            { t: THEMES.mars, Body: MarsBody },
          ].map(({ t, Body }) => {
            const dimmed = hover !== null && hover !== t.id;
            return (
              <button
                key={t.id}
                onClick={() => { SFX.unlock(); SFX.setTheme(t.id); SFX.whoosh(); onPick(t.id); }}
                onMouseEnter={() => setHover(t.id)}
                onMouseLeave={() => setHover(null)}
                className="relative flex-1 flex flex-col items-center justify-center gap-5 py-10 px-6 active:scale-95"
                style={{
                  background:
                    t.id === "moon"
                      ? "linear-gradient(180deg, #05070F 0%, #0B1020 100%)"
                      : "linear-gradient(180deg, #0D0604 0%, #1C0F0A 100%)",
                  transition: "all .4s ease",
                  opacity: dimmed ? 0.45 : 1,
                }}
              >
                <Body size={150} dim={dimmed} />
                <div className="text-center">
                  <div
                    style={{
                      fontFamily: "'Chakra Petch', sans-serif",
                      fontWeight: 700,
                      fontSize: 26,
                      color: t.star,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {t.name.toUpperCase()}
                  </div>
                  <div
                    className="mt-1"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: t.dim, letterSpacing: "0.14em" }}
                  >
                    {t.tagline.toUpperCase()}
                  </div>
                </div>
                <div
                  className="px-5 py-2.5 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${t.ion}, ${t.plasma})`,
                    color: t.void,
                    fontFamily: "'Chakra Petch', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    boxShadow: `0 0 22px ${t.ion}55`,
                  }}
                >
                  PICK {t.name.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative z-10 text-center py-4 px-6">
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#5A6580", letterSpacing: "0.16em" }}>
            YOU CAN SWITCH ANY TIME
          </p>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
