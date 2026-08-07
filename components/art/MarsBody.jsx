"use client";

import React from "react";

/* ============================================================
   MARS — drawn in code, no image files.

   Unlike the Moon, this one turns: a Martian day is about forty
   minutes longer than ours, so the surface is a full 360 degree map
   scrolling behind a circular window rather than a fixed face.

   The map is real geography, laid out east from zero longitude:

     Syrtis Major    70E,  8N    the dark triangle, sharp enough that
                                 Huygens used it to time the day in 1659
     Hellas          70E, 45S    a bright impact basin the size of the
                                 Caribbean, directly south of Syrtis
     Olympus Mons   225E, 18N    the biggest volcano in the solar system
     Tharsis Montes ~250E        three shields in a diagonal line, just
                                 east of Olympus
     Valles Marineris 260-330E, 14S   four thousand kilometres of canyon
                                 running east-west below the equator
     Acidalia       340E, 45N    the dark northern plain

   It also gets a thin rim of atmosphere, which the Moon deliberately
   does not. Mars has air — not much, under one percent of ours, but
   enough to catch light at the limb and enough for the dust that turns
   the whole sky butterscotch. That glow is the quickest way to tell
   the two bodies apart at a glance.
   ============================================================ */

/* The map is 720 x 360, so x = degrees east times two, and
   y = (90 - latitude) times two. */
const MAP_W = 720;
const MAP_H = 360;

const lon = (d) => d * 2;
const lat = (d) => (90 - d) * 2;

/* Dark albedo regions — these are not shadows, they are areas swept
   free of bright dust, which is why they hold their shape for
   centuries and why early observers could map them at all. */
const DARK = [
  { cx: lon(70), cy: lat(8), rx: 44, ry: 58, rot: 14, o: 0.78 },   // Syrtis Major
  { cx: lon(340), cy: lat(45), rx: 96, ry: 44, rot: -8, o: 0.5 },  // Acidalia
  { cx: lon(120), cy: lat(-22), rx: 78, ry: 34, rot: 6, o: 0.46 }, // Mare Tyrrhenum
  { cx: lon(20), cy: lat(-18), rx: 60, ry: 30, rot: -10, o: 0.42 },// Sinus Sabaeus
  { cx: lon(200), cy: lat(-30), rx: 70, ry: 32, rot: 8, o: 0.4 },  // Mare Sirenum
  { cx: lon(285), cy: lat(30), rx: 54, ry: 30, rot: -6, o: 0.34 }, // Tempe
];

/* Bright dust-covered basins and plains. */
const BRIGHT = [
  { cx: lon(70), cy: lat(-45), rx: 62, ry: 44, rot: 0, o: 0.4 },   // Hellas
  { cx: lon(20), cy: lat(20), rx: 66, ry: 46, rot: 0, o: 0.26 },   // Arabia
  { cx: lon(150), cy: lat(25), rx: 52, ry: 34, rot: 0, o: 0.22 },  // Elysium
];

/* Olympus Mons plus the three Tharsis shields, which really do sit in
   a neat diagonal line south-west to north-east. */
const VOLCANOES = [
  { cx: lon(225), cy: lat(18), r: 26, big: true },  // Olympus Mons
  { cx: lon(241), cy: lat(12), r: 13 },             // Ascraeus
  { cx: lon(247), cy: lat(0), r: 12 },              // Pavonis
  { cx: lon(253), cy: lat(-9), r: 13 },             // Arsia
];

export default function MarsBody({ size = 200, dim = false }) {
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        transition: "filter .5s ease, opacity .5s ease",
        filter: dim ? "saturate(.45) brightness(.55)" : "none",
      }}
    >
      {/* the atmosphere, sitting just outside the limb */}
      {!dim && (
        <div
          className="absolute rounded-full"
          style={{
            inset: -size * 0.06,
            background: "radial-gradient(circle, transparent 60%, #FF8C4288 76%, #FF6A1E33 86%, transparent 96%)",
            filter: "blur(5px)",
          }}
        />
      )}

      <div
        className="relative rounded-full overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* THE SURFACE, scrolling.
            Two copies of the same 360 degree map side by side, shifted
            by exactly one map width, so the loop has no seam. The
            window is one diameter wide and the map is two, which means
            you are looking at 180 degrees of longitude at a time —
            which is what you would actually see of a sphere. */}
        <div
          className={dim ? undefined : "pl-anim"}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "400%",
            display: "flex",
            animation: dim ? undefined : "pl-spin 140s linear infinite",
            willChange: "transform",
          }}
        >
          {[0, 1].map((copy) => (
            <svg
              key={copy}
              width="50%"
              height="100%"
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              preserveAspectRatio="none"
              style={{ display: "block", flexShrink: 0 }}
            >
              <defs>
                <linearGradient id={`ma-base-${copy}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D98A55" />
                  <stop offset="38%" stopColor="#D2703C" />
                  <stop offset="70%" stopColor="#B9522A" />
                  <stop offset="100%" stopColor="#8E3A1C" />
                </linearGradient>
              </defs>

              <rect x="0" y="0" width={MAP_W} height={MAP_H} fill={`url(#ma-base-${copy})`} />

              {/* Dust mottling, so the plains are not flat colour. Kept
                  small and faint on purpose — turned up, this stops
                  reading as windblown dust and starts reading as the
                  whole planet being out of focus. */}
              <g fill="#F0A472" opacity="0.09">
                {Array.from({ length: 30 }, (_, i) => (
                  <ellipse
                    key={i}
                    cx={(i * 137) % MAP_W}
                    cy={30 + ((i * 83) % (MAP_H - 60))}
                    rx={14 + (i % 5) * 7}
                    ry={9 + (i % 3) * 5}
                  />
                ))}
              </g>

              {BRIGHT.map((b, i) => (
                <ellipse
                  key={`b-${i}`}
                  cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry}
                  transform={`rotate(${b.rot} ${b.cx} ${b.cy})`}
                  fill="#F3C89A" opacity={b.o}
                  style={{ filter: "blur(4px)" }}
                />
              ))}

              {DARK.map((d, i) => (
                <ellipse
                  key={`d-${i}`}
                  cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry}
                  transform={`rotate(${d.rot} ${d.cx} ${d.cy})`}
                  fill="#4A2012" opacity={d.o}
                  style={{ filter: "blur(2px)" }}
                />
              ))}

              {/* Valles Marineris: a long gash just south of the
                  equator, widening toward its eastern end */}
              <g opacity="0.72">
                <path
                  d={`M${lon(258)} ${lat(-9)}
                      Q${lon(285)} ${lat(-15)} ${lon(310)} ${lat(-13)}
                      Q${lon(325)} ${lat(-12)} ${lon(334)} ${lat(-8)}
                      L${lon(334)} ${lat(-16)}
                      Q${lon(322)} ${lat(-20)} ${lon(305)} ${lat(-21)}
                      Q${lon(282)} ${lat(-22)} ${lon(258)} ${lat(-14)} Z`}
                  fill="#4A1F10"
                />
                <path
                  d={`M${lon(262)} ${lat(-11)}
                      Q${lon(288)} ${lat(-16)} ${lon(312)} ${lat(-15)}
                      Q${lon(326)} ${lat(-14)} ${lon(331)} ${lat(-11)}`}
                  fill="none" stroke="#2E1109" strokeWidth="5" opacity="0.8"
                />
              </g>

              {/* the shields, each with a caldera */}
              {VOLCANOES.map((v, i) => (
                <g key={`v-${i}`}>
                  <circle cx={v.cx} cy={v.cy} r={v.r * 1.5} fill="#8A3E1E" opacity="0.3" style={{ filter: "blur(5px)" }} />
                  <circle cx={v.cx} cy={v.cy} r={v.r} fill="#C9713F" opacity="0.75" />
                  <circle cx={v.cx - v.r * 0.2} cy={v.cy - v.r * 0.2} r={v.r * 0.78} fill="#E39560" opacity="0.5" />
                  <circle cx={v.cx} cy={v.cy} r={v.r * (v.big ? 0.34 : 0.3)} fill="#4E2010" opacity="0.85" />
                </g>
              ))}

            </svg>
          ))}
        </div>

        {/* THE POLAR CAPS, which deliberately are NOT on the map above.
            A cap drawn into an equirectangular strip stops being a cap:
            the projection stretches the pole across every longitude, so
            it arrives as a straight white band lying across the middle
            of the planet. On a sphere it is a cap at the top and the
            bottom, and it does not slide past as the planet turns —
            the poles are the one part of a rotating body that stays
            where it is. So they are drawn on the disc instead. */}
        <div
          className="absolute rounded-full"
          style={{
            left: "50%", top: "-7%",
            width: "58%", height: "22%", marginLeft: "-29%",
            background: "radial-gradient(ellipse at 50% 78%, #FFF8F1 0%, #FFE6D2 52%, transparent 76%)",
            filter: "blur(3px)",
            opacity: 0.95,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "50%", bottom: "-6%",
            width: "42%", height: "16%", marginLeft: "-21%",
            background: "radial-gradient(ellipse at 50% 22%, #FFF4EA 0%, #FFDCC2 52%, transparent 78%)",
            filter: "blur(3px)",
            opacity: 0.72,
          }}
        />

        {/* lighting, above the moving surface and not moving with it */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: "linear-gradient(128deg, transparent 44%, #1A060090 100%)" }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 50%, transparent 60%, #2A0A0270 86%, #170500C4 100%)",
          }}
        />
        {/* the haze the atmosphere puts over the limb from the inside */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: "inset 0 0 18px #FFB98044, inset -12px -10px 40px #120300AA",
          }}
        />
      </div>
    </div>
  );
}
