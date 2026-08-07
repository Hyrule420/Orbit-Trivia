"use client";

import React, { useState, useEffect } from "react";
import { THEMES, ThemeCtx } from "../../lib/theme";
import { SFX } from "../../lib/sfx";
import Starfield from "../art/Starfield";
import Logo from "../art/Logo";
import MoonBody from "../art/MoonBody";
import MarsBody from "../art/MarsBody";
import Orbiter from "../art/Orbiter";

/* ============================================================
   PLANET CHOOSER — the first thing anyone sees.

   Two worlds, side by side, each one a window rather than a swatch:
   the body itself with real geography, the light falling on it, the
   glow of its sky behind it, and something of ours in orbit around it.

   The pair is deliberately built to contrast. The Moon turns nothing,
   has no air and takes a hard-edged limb; Mars rotates, carries a
   dusty atmosphere and glows at the edge. Both of those are true, and
   the difference is doing most of the work of telling them apart.
   ============================================================ */

const WORLDS = [
  {
    t: THEMES.moon,
    Body: MoonBody,
    craft: "apollo",
    /* the sky behind each one, and the light on its horizon */
    halo: "#A9B4C8",
    ground: "linear-gradient(180deg, #05070F 0%, #080C1A 52%, #101A33 100%)",
    orbitSec: 30,
  },
  {
    t: THEMES.mars,
    Body: MarsBody,
    craft: "starship",
    halo: "#FF7A3D",
    ground: "linear-gradient(180deg, #0D0604 0%, #180B06 52%, #33150B 100%)",
    orbitSec: 24,
  },
];

export default function PlanetPicker({ onPick }) {
  const [hover, setHover] = useState(null);

  /* The bodies are drawn at a real pixel size because the orbit radii
     are derived from it. Side by side on a desktop there is room for a
     big one; stacked on a phone there is not, and an oversized planet
     would push the buttons off the bottom of a short screen. */
  const [size, setSize] = useState(168);
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      /* Below the sm breakpoint the two halves stack, so the screen has
         to fit two of everything and height is the binding constraint,
         not width. Above it they sit side by side and there is room. */
      const stacked = w < 640;
      const next = stacked
        ? Math.min(w * 0.34, h * 0.145)
        : Math.min(w * 0.2, h * 0.3);
      setSize(Math.max(88, Math.min(196, Math.round(next))));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <ThemeCtx.Provider value={THEMES.moon}>
      <div className="relative min-h-screen flex flex-col" style={{ background: "#03040A" }}>
        <Starfield />

        <div className="relative z-10 pt-5 sm:pt-8 pb-1 px-6 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <Logo size={30} palette={THEMES.moon} />
          </div>
          <h1 style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 30, color: "#E8ECF8", lineHeight: 1.1 }}>
            Choose your side
          </h1>
          <p className="text-sm mt-2" style={{ color: "#7C89A8" }}>
            Same questions either way. Pick the one you&apos;d rather look at.
          </p>
        </div>

        <div className="relative z-10 flex-1 flex flex-col sm:flex-row">
          {WORLDS.map(({ t, Body, craft, halo, ground, orbitSec }) => {
            const dimmed = hover !== null && hover !== t.id;
            const lit = hover === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { SFX.unlock(); SFX.setTheme(t.id); SFX.whoosh(); onPick(t.id); }}
                onMouseEnter={() => setHover(t.id)}
                onMouseLeave={() => setHover(null)}
                className="relative flex-1 flex flex-col items-center justify-center gap-2 sm:gap-5 py-3 sm:py-7 px-6 overflow-hidden active:scale-95"
                style={{
                  background: ground,
                  transition: "opacity .45s ease, transform .2s ease",
                  opacity: dimmed ? 0.42 : 1,
                }}
              >
                {/* the sky of that world, sitting behind its planet */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: "50%", top: "42%",
                    width: size * 2.6, height: size * 2.6,
                    marginLeft: -size * 1.3, marginTop: -size * 1.3,
                    background: `radial-gradient(circle, ${halo}2E 0%, ${halo}14 38%, transparent 68%)`,
                    opacity: lit ? 1 : 0.65,
                    transition: "opacity .45s ease",
                  }}
                />
                {/* ground light, so the half has a floor and not just a bottom edge */}
                <div
                  className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{
                    height: "34%",
                    background: `linear-gradient(180deg, transparent, ${halo}1F)`,
                  }}
                />

                {/* the body, with something of ours going round it.
                    The orbiter is a SIBLING of the planet, not a parent
                    or a child: its two halves sit at z 1 and z 3 and the
                    planet at z 2, which is what lets the craft pass in
                    front on the near side and vanish behind on the far
                    side. Nothing here may create a stacking context
                    between them or the occlusion collapses. */}
                <div className="relative" style={{ width: size, height: size }}>
                  <Orbiter
                    kind={craft}
                    C={t}
                    size={size}
                    rx={size * 0.78}
                    ry={size * 0.2}
                    seconds={orbitSec}
                  />
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <Body size={size} dim={dimmed} />
                  </div>
                </div>

                <div className="text-center relative" style={{ zIndex: 4 }}>
                  <div
                    style={{
                      fontFamily: "'Chakra Petch', sans-serif",
                      fontWeight: 700,
                      fontSize: 26,
                      color: t.star,
                      letterSpacing: "0.06em",
                      textShadow: `0 0 26px ${halo}55`,
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
                  className="px-5 py-2.5 rounded-xl relative"
                  style={{
                    zIndex: 4,
                    background: `linear-gradient(135deg, ${t.ion}, ${t.plasma})`,
                    color: t.void,
                    fontFamily: "'Chakra Petch', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    boxShadow: `0 0 ${lit ? 34 : 22}px ${t.ion}${lit ? "88" : "55"}`,
                    transition: "box-shadow .35s ease",
                  }}
                >
                  PICK {t.name.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative z-10 text-center py-2 sm:py-3 px-6">
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#5A6580", letterSpacing: "0.16em" }}>
            YOU CAN SWITCH ANY TIME
          </p>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
