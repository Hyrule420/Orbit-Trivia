"use client";

import React from "react";

/* ============================================================
   THE MOON — the near side, drawn in code, no image files.

   This is the face everyone has actually looked at: Imbrium and
   Serenitatis across the top, Tranquillitatis to their right with the
   Apollo 11 site in its south-west corner, Crisium as a separate oval
   off the eastern limb, Procellarum washing down the west, and Tycho
   throwing its ray system halfway across the southern highlands.
   Anyone who has pointed binoculars at it should recognise this.

   It does NOT rotate, and that is the accurate choice rather than a
   lazy one: the Moon is tidally locked, so it holds the same face
   toward us permanently. What it really does is librate — rock very
   slightly in longitude and latitude, which is how we get to see about
   59 percent of a body that only ever shows one side. That rocking is
   the motion here.

   It also gets a hard, crisp limb with no rim glow at all. The Moon
   has no atmosphere; Mars does, and giving one to both would throw
   away the most visible difference between them.
   ============================================================ */

/* Maria: the dark basalt plains.

   Drawn as irregular paths rather than ellipses, and mostly joined up,
   because that is what they are. Imbrium, Serenitatis and
   Tranquillitatis run into one another across the top of the near
   side, and Procellarum is an enormous ragged sprawl down the west,
   not a tidy oval. Crisium is the one that really is a clean isolated
   circle off the eastern limb, which is exactly what makes it the
   easiest feature to pick out with the naked eye. */
const MARIA = [
  /* Imbrium into Serenitatis into Tranquillitatis, one connected sweep */
  {
    d: `M44 60 Q46 34 74 30 Q100 26 108 40 Q118 32 132 40
        Q152 50 158 68 Q164 88 148 98 Q130 108 118 92
        Q106 78 92 82 Q66 88 52 78 Q42 70 44 60 Z`,
    o: 0.8,
  },
  /* Oceanus Procellarum, down the western limb */
  {
    d: `M20 70 Q30 46 48 52 Q60 58 56 78 Q64 96 58 116
        Q52 140 34 142 Q18 138 14 116 Q10 92 20 70 Z`,
    o: 0.7,
  },
  /* Nubium and Humorum, the southern seas */
  { d: `M62 128 Q84 120 104 130 Q118 140 108 150 Q86 158 70 150 Q58 142 62 128 Z`, o: 0.66 },
  /* Fecunditatis and Nectaris, lower east */
  { d: `M148 96 Q168 92 172 110 Q174 128 158 132 Q142 132 140 116 Q138 102 148 96 Z`, o: 0.62 },
  /* Frigoris, the long thin one along the northern edge */
  { d: `M62 26 Q92 14 126 22 Q136 26 128 32 Q94 26 66 34 Q56 32 62 26 Z`, o: 0.5 },
];

/* Crisium, kept separate on purpose — it genuinely is a clean isolated
   oval sitting off on its own near the eastern limb. */
const CRISIUM = { cx: 172, cy: 62, rx: 12, ry: 9, rot: 8 };

/* Scattered highland cratering. Deterministic, not random — a fresh
   arrangement on every render would flicker as the component redraws. */
const CRATERS = [
  { x: 82, y: 96, r: 7.5, bright: true },   // Copernicus
  { x: 52, y: 74, r: 5, bright: true },     // Kepler
  { x: 118, y: 150, r: 4.5 }, { x: 150, y: 140, r: 5.5 },
  { x: 66, y: 168, r: 4 }, { x: 128, y: 40, r: 3.4 },
  { x: 176, y: 92, r: 4.6 }, { x: 40, y: 122, r: 3.6 },
  { x: 108, y: 172, r: 5 }, { x: 158, y: 168, r: 3.8 },
  { x: 30, y: 62, r: 3.2 }, { x: 186, y: 122, r: 3.4 },
  { x: 74, y: 118, r: 3 }, { x: 122, y: 100, r: 2.8 },
];

/* Tycho is the youngest big crater on the near side, which is why its
   ejecta has not been weathered down yet and still reaches most of the
   way across the disc. It is the single most recognisable thing here. */
const TYCHO = { x: 94, y: 164, r: 5.6 };
const RAYS = [-84, -62, -40, -18, 6, 28, 52, 76, 104, 128, 152, 176, 200, 224, 250, 272];

export default function MoonBody({ size = 200, dim = false }) {
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        transition: "filter .5s ease, opacity .5s ease",
        filter: dim ? "saturate(.4) brightness(.55)" : "none",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: "block", overflow: "visible" }}>
        <defs>
          {/* the regolith itself, lit from the upper left */}
          <radialGradient id="mn-surface" cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#F2F5FA" />
            <stop offset="34%" stopColor="#CFD6E1" />
            <stop offset="66%" stopColor="#96A0B0" />
            <stop offset="88%" stopColor="#5A6273" />
            <stop offset="100%" stopColor="#333A49" />
          </radialGradient>
          {/* limb darkening — the thing that turns a disc into a sphere */}
          <radialGradient id="mn-limb" cx="50%" cy="50%" r="50%">
            <stop offset="62%" stopColor="#000000" stopOpacity="0" />
            <stop offset="88%" stopColor="#000308" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#000308" stopOpacity="0.8" />
          </radialGradient>
          {/* the terminator, thrown from the lower right */}
          <linearGradient id="mn-term" x1="18%" y1="10%" x2="94%" y2="96%">
            <stop offset="40%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#00030A" stopOpacity="0.6" />
          </linearGradient>
          <clipPath id="mn-disc">
            <circle cx="100" cy="100" r="99" />
          </clipPath>
        </defs>

        {/* everything inside the disc librates together */}
        <g clipPath="url(#mn-disc)">
          <circle cx="100" cy="100" r="99" fill="url(#mn-surface)" />

          <g
            className={dim ? undefined : "pl-anim"}
            style={dim ? undefined : { animation: "pl-librate 42s ease-in-out infinite", transformOrigin: "100px 100px" }}
          >
            {/* Tycho ray system, under the maria so the dark plains
                still read as dark where the rays cross them */}
            <g stroke="#EDF1F7" strokeLinecap="round" opacity="0.24">
              {RAYS.map((a, i) => {
                const r = (a * Math.PI) / 180;
                const len = 52 + (i % 4) * 26;
                return (
                  <line
                    key={a}
                    x1={TYCHO.x + Math.cos(r) * 7}
                    y1={TYCHO.y + Math.sin(r) * 7}
                    x2={TYCHO.x + Math.cos(r) * len}
                    y2={TYCHO.y + Math.sin(r) * len}
                    strokeWidth={i % 3 === 0 ? 2.4 : 1.3}
                  />
                );
              })}
            </g>

            {/* the maria, with a soft edge rather than a cut-out one —
                the real boundary between a sea and the highlands is a
                gradual shore, not a line */}
            <g style={{ filter: "blur(2.2px)" }}>
              {MARIA.map((m, i) => (
                <path key={i} d={m.d} fill="#3B4355" opacity={m.o} />
              ))}
              <ellipse
                cx={CRISIUM.cx} cy={CRISIUM.cy} rx={CRISIUM.rx} ry={CRISIUM.ry}
                transform={`rotate(${CRISIUM.rot} ${CRISIUM.cx} ${CRISIUM.cy})`}
                fill="#3B4355" opacity="0.74"
              />
            </g>

            {/* craters: a lit rim on the sunward side, shadow opposite */}
            {CRATERS.map((c, i) => (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r={c.r} fill="#5F6879" opacity="0.55" />
                <circle cx={c.x - c.r * 0.16} cy={c.y - c.r * 0.16} r={c.r * 0.82} fill="#8E97A6" opacity="0.5" />
                <path
                  d={`M${c.x - c.r} ${c.y} A${c.r} ${c.r} 0 0 1 ${c.x} ${c.y - c.r}`}
                  fill="none" stroke="#E4E9F1" strokeWidth={c.r * 0.3} opacity={c.bright ? 0.75 : 0.45}
                />
                {c.bright && (
                  <circle cx={c.x} cy={c.y} r={c.r * 2.3} fill="#EDF1F7" opacity="0.1" style={{ filter: "blur(3px)" }} />
                )}
              </g>
            ))}

            {/* Tycho itself */}
            <circle cx={TYCHO.x} cy={TYCHO.y} r={TYCHO.r} fill="#6B7486" />
            <circle cx={TYCHO.x - 1} cy={TYCHO.y - 1} r={TYCHO.r * 0.72} fill="#AAB3C1" />
            <circle cx={TYCHO.x} cy={TYCHO.y} r={TYCHO.r * 1.7} fill="#F2F5FA" opacity="0.2" style={{ filter: "blur(2px)" }} />
          </g>

          {/* lighting sits above the surface and does not librate with it */}
          <circle cx="100" cy="100" r="99" fill="url(#mn-term)" />
          <circle cx="100" cy="100" r="99" fill="url(#mn-limb)" />
        </g>

        {/* A hard edge, no rim light. There is no air up there to catch
            the sun, and that razor limb is exactly what says so. */}
        <circle cx="100" cy="100" r="99" fill="none" stroke="#0A0D16" strokeWidth="1.4" opacity="0.55" />
      </svg>
    </div>
  );
}
