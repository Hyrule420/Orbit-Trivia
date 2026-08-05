"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/* ============================================================
   STARSHIP + MECHAZILLA — the Home screen hero.

   The flight itself is NOT owned here. components/home/Home.jsx
   drives the launch frame by frame (tapRocket -> ascend -> descend)
   because a mode card has to break on the exact frame the nose
   crosses it, and it writes the ship's transform straight onto
   `shipRef`. This file owns the artwork and everything that has to
   react to the flight: engine spool-up, plume chemistry, the
   belly-flop and flip, the tower, and the catch.

   Two channels come in from Home:
     phase   idle | ignition | ascent | hang | descent | weld
     flight  a ref, written every frame by Home's rAF, never state,
             so the cards don't re-render 60 times a second.

   Palette is passed in as a prop rather than read from context. That
   used to be load-bearing: OrbitTrivia.jsx kept a private ThemeCtx, so
   a useC() from lib/theme would have resolved to a different context
   and silently rendered Moon on every theme. There is one context now,
   so useC() would work here — the prop simply hasn't been changed.
   ============================================================ */

/* ---------- colour helpers ---------- */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const hex2rgb = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const mixHex = (a, b, t) => {
  const A = hex2rgb(a);
  const B = hex2rgb(b);
  const k = clamp01(t);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
};
/* mixHex returns rgb(), which can't take the `${colour}44` alpha suffix the
   rest of the app uses, so anything built here gets its alpha from an
   explicit opacity attribute instead. */
const rgba = (hex, a) => {
  const [r, g, b] = hex2rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

/* Structure and accents follow the theme; flame colour does not.
   A methalox plume is orange when it is fuel-rich at startup and blue
   once the flow cleans up — that is chemistry, not branding, so it
   stays the same on Moon and on Mars. */
const FLAME = {
  hot: "#FF6A18",
  hotMid: "#FFA845",
  hotCore: "#FFE6A8",
  cool: "#2F6BFF",
  coolMid: "#8AC4FF",
  coolCore: "#F4FBFF",
};

function shipPalette(C) {
  return {
    steel: mixHex("#C9D2DC", C.star, 0.3),
    steelDark: mixHex("#8A97A6", C.dim, 0.4),
    tile: mixHex("#14171E", C.hull, 0.6),
    tower: mixHex("#5A6675", C.edge, 0.55),
    towerDark: mixHex("#39424F", C.hull, 0.6),
    ion: C.ion,
    void: C.void,
  };
}

/* ============================================================
   STARSHIP — native viewBox 60 x 210
   Blunt ogive nose, fat barrel, black windward tiles down one side,
   small forward flaps high and large delta aft flaps low, six engines
   (3 RVac on the ring, 3 sea-level in the middle), and the catch pins
   under the forward flaps that the chopsticks actually take the load on.
   ============================================================ */
export function StarshipBody({ P, reentry = 0 }) {
  return (
    <g>
      {/* aft flaps — large deltas, behind the barrel */}
      <path d="M14 128 L1 152 L1 178 L14 172 Z" fill={P.steelDark} />
      <path d="M46 128 L59 152 L59 178 L46 172 Z" fill={P.steelDark} />
      <path d="M14 128 L4 150 L4 174 L14 170 Z" fill={P.tile} opacity="0.55" />

      {/* forward flaps — small, hinged flat against the hull */}
      <path d="M15 54 L4 66 L4 86 L15 80 Z" fill={P.steelDark} />
      <path d="M45 54 L56 66 L56 86 L45 80 Z" fill={P.steelDark} />
      <path d="M15 54 L6 65 L6 84 L15 79 Z" fill={P.tile} opacity="0.55" />

      {/* nose cone */}
      <path
        d="M30 2 C35.5 2 39.5 9 42 21 C44.4 32 46 41 46 48 L14 48
           C14 41 15.6 32 18 21 C20.5 9 24.5 2 30 2 Z"
        fill={P.steel}
      />

      {/* barrel */}
      <rect x="14" y="47" width="32" height="130" fill={P.steel} />

      {/* specular highlight down the leeward side — stainless, not paint */}
      <rect x="35" y="47" width="7" height="130" fill="#FFFFFF" opacity="0.09" />

      {/* heat shield, nose and barrel, windward side only */}
      <path
        d="M30 2 C24.5 2 20.5 9 18 21 C15.6 32 14 41 14 48
           L14 177 L23 177 L23 48
           C23 41 23.8 32 25 21 C26.2 9 27.5 2 30 2 Z"
        fill={P.tile}
        opacity="0.92"
      />

      {/* ring welds */}
      <g stroke={P.void} strokeWidth="0.6" opacity="0.28">
        {[58, 72, 86, 100, 114, 128, 142, 156, 170].map((y) => (
          <line key={y} x1="14" y1={y} x2="46" y2={y} />
        ))}
      </g>

      {/* re-entry: the tile side lights up, because that is the side
          taking the flow. The leeward steel stays cold. */}
      {reentry > 0.01 && (
        <g opacity={reentry}>
          <path
            d="M30 2 C24.5 2 20.5 9 18 21 C15.6 32 14 41 14 48
               L14 177 L23 177 L23 48
               C23 41 23.8 32 25 21 C26.2 9 27.5 2 30 2 Z"
            fill={FLAME.hotMid}
            opacity="0.55"
          />
          <path
            d="M30 2 C26 2 22.5 9 20 21 C17.6 32 16 41 16 48 L16 177 L19 177 L19 48
               C19 41 20 32 21.5 21 C23 9 27.5 2 30 2 Z"
            fill={FLAME.coolCore}
            opacity="0.85"
          />
          <ellipse cx="19" cy="26" rx="16" ry="30" fill={FLAME.hot} opacity="0.4"
                   style={{ filter: "blur(6px)" }} />
        </g>
      )}

      {/* catch pins — the load path, and what the chopsticks grab */}
      <rect x="10.5" y="56" width="4.5" height="7" rx="1" fill={P.ion} />
      <rect x="45" y="56" width="4.5" height="7" rx="1" fill={P.ion} />

      {/* engine skirt */}
      <rect x="13" y="176" width="34" height="12" rx="1" fill={P.steelDark} />
      <rect x="13" y="176" width="34" height="3" fill={P.void} opacity="0.35" />

      {/* engines: 3 RVac outboard, 3 sea-level inboard */}
      <g>
        <ellipse cx="19" cy="194" rx="5.4" ry="7" fill={P.towerDark} />
        <ellipse cx="41" cy="194" rx="5.4" ry="7" fill={P.towerDark} />
        <ellipse cx="30" cy="196" rx="5.8" ry="7.4" fill={P.towerDark} />
        <ellipse cx="24.5" cy="191" rx="3.4" ry="4.4" fill={P.tower} />
        <ellipse cx="35.5" cy="191" rx="3.4" ry="4.4" fill={P.tower} />
        <ellipse cx="30" cy="189" rx="3.4" ry="4.4" fill={P.tower} />
      </g>
    </g>
  );
}

/* ============================================================
   PLUME
   mix  0 fuel-rich sooty orange startup  ->  1 clean methalox blue-white
   alt  0 sea level, tight plume and hard shock diamonds
        1 vacuum, the plume balloons and the diamonds wash out
   ============================================================ */
function Plume({ power, flicker, mix, alt }) {
  if (power <= 0.01) return null;

  const j = flicker;
  const outer = mixHex(FLAME.hot, FLAME.cool, mix);
  const midC = mixHex(FLAME.hotMid, FLAME.coolMid, mix);
  const core = mixHex(FLAME.hotCore, FLAME.coolCore, mix);

  /* ambient pressure falls off with altitude, so the plume expands */
  const bloom = 1 + alt * 1.8;
  const L = 118 * power * (1 + alt * 0.3);
  const w = (12 + 5 * power) * bloom;

  /* shock diamonds need dense air and clean, well developed flow */
  const dia = power * Math.pow(1 - alt, 1.7) * (0.3 + 0.7 * mix);

  const nodes = [];
  if (dia > 0.05) {
    let y = 210;
    let gap = 15 * (0.92 + 0.16 * j);
    for (let i = 0; i < 7; i++) {
      if (y > 198 + L * 0.92) break;
      const decay = Math.pow(1 - i / 7, 1.25);
      nodes.push({ y, rx: w * 0.34 * decay + 1.2, ry: gap * 0.42 * decay, o: decay * dia });
      y += gap;
      gap *= 1.16;
    }
  }

  return (
    <g>
      {/* outer expansion shell */}
      <path
        d={`M${30 - w} 198 Q30 ${205 + L * 1.25 * j} ${30 + w} 198 Z`}
        fill={outer}
        opacity={0.3 * power}
      />
      {/* main plume */}
      <path
        d={`M${30 - w * 0.62} 198 Q30 ${203 + L * j} ${30 + w * 0.62} 198 Z`}
        fill={midC}
        opacity={(0.62 + 0.16 * mix) * power}
      />
      {/* supersonic core column */}
      <path
        d={`M${30 - w * 0.24} 197 Q30 ${201 + L * 0.62 * j} ${30 + w * 0.24} 197 Z`}
        fill={core}
        opacity={0.92 * power}
      />

      {/* Mach diamonds */}
      {nodes.map((n, i) => (
        <g key={i}>
          <path
            d={`M${30 - n.rx} ${n.y} L30 ${n.y - n.ry} L${30 + n.rx} ${n.y} L30 ${n.y + n.ry} Z`}
            fill={core}
            opacity={n.o * 0.55}
          />
          <path
            d={`M${30 - n.rx * 0.45} ${n.y} L30 ${n.y - n.ry * 0.55} L${30 + n.rx * 0.45} ${n.y} L30 ${
              n.y + n.ry * 0.55
            } Z`}
            fill="#FFFFFF"
            opacity={n.o * 0.85}
          />
        </g>
      ))}

      {/* the throat stays hot whatever the downstream colour is doing */}
      <ellipse cx="30" cy="199" rx={w * 0.3} ry={5 * power} fill={FLAME.hotCore} opacity={0.9 * power} />
    </g>
  );
}

/* ============================================================
   FLIGHT MODEL
   Turns Home's coarse phase plus the live altitude into everything
   the artwork needs. Kept pure so it can be reasoned about on its own.
   ============================================================ */
const IGNITION_MS = 850; // must match LAUNCH.ignitionMs in components/home/launch.js

function flightModel(phase, tMs, alt) {
  const t = tMs / 1000;
  let power = 0;
  let mix = 0;
  let reentry = 0;
  let tilt = 0;
  let shake = 0;

  if (phase === "ignition") {
    /* spin up on the hold-down clamps: sooty and orange, then the flow cleans up */
    power = smooth(t / (IGNITION_MS / 1000));
    mix = smooth((t - 0.22) / 0.5);
    shake = power;
  } else if (phase === "ascent") {
    power = 1;
    mix = 1;
    shake = 0.55 * (1 - clamp01(t / 0.9));
  } else if (phase === "hang") {
    power = 0;
  } else if (phase === "descent") {
    /* Falls belly-first behind a plasma sheath, then flips upright and
       relights for the last stretch. Altitude runs 1 -> 0, but the ship
       only clears the top of the screen around alt 0.35, so the whole
       flip has to fit under that or nobody ever sees it. */
    reentry = smooth((alt - 0.11) / 0.2) * 0.9;
    tilt = 66 * smooth((alt - 0.07) / 0.26);
    if (alt < 0.27) {
      power = smooth((0.27 - alt) / 0.15) * 0.66;
      mix = smooth((0.24 - alt) / 0.16) * 0.92;
      shake = power * 0.35;
    }
  } else if (phase === "weld") {
    /* clamped in the arms — engines already shut down */
    power = Math.max(0, 0.5 - t * 2.2);
    mix = 0.92;
  }

  return { power, mix, reentry, tilt, shake };
}

/* ============================================================
   MECHAZILLA — the tower, the carriage, and the chopsticks
   Drawn in CSS-pixel user units (see the viewBox note in the hero),
   so every coordinate here lines up with the HTML ship on top of it.
   ============================================================ */
function TowerBack({ P, C, g }) {
  const { towerX, ground, towerTop } = g;
  const halfW = 19;
  const bays = Math.max(4, Math.floor((ground - towerTop) / 26));
  const bayH = (ground - towerTop) / bays;

  return (
    <g>
      {/* legs */}
      <rect x={towerX - halfW} y={towerTop} width={halfW * 2} height={ground - towerTop} fill={P.towerDark} />
      <rect x={towerX - halfW} y={towerTop} width={5} height={ground - towerTop} fill={P.tower} />
      <rect x={towerX + halfW - 5} y={towerTop} width={5} height={ground - towerTop} fill={P.tower} />

      {/* lattice: horizontals plus alternating diagonals */}
      <g stroke={P.tower} strokeWidth="1.6" opacity="0.8" fill="none">
        {Array.from({ length: bays }, (_, i) => {
          const y = towerTop + i * bayH;
          const l = towerX - halfW + 4;
          const r = towerX + halfW - 4;
          return (
            <React.Fragment key={i}>
              <line x1={l} y1={y} x2={r} y2={y} />
              <line x1={i % 2 ? l : r} y1={y} x2={i % 2 ? r : l} y2={y + bayH} />
            </React.Fragment>
          );
        })}
      </g>

      {/* crown, lightning rod, aviation beacon.
          The beacon pulses in CSS rather than from a clock read during
          render — a Date.now() here would differ between the server pass
          and hydration, and it would also freeze whenever the scene is
          idle and nothing is re-rendering. */}
      <rect x={towerX - halfW - 5} y={towerTop - 9} width={halfW * 2 + 10} height={9} rx="2" fill={P.tower} />
      <rect x={towerX - 1} y={towerTop - 24} width={2} height={15} fill={P.tower} />
      <g className="sc-beacon">
        <circle cx={towerX} cy={towerTop - 26} r="2.6" fill={C.abort} />
        <circle cx={towerX} cy={towerTop - 26} r="6" fill={C.abort} opacity="0.3"
                style={{ filter: "blur(3px)" }} />
      </g>
    </g>
  );
}

/* One chopstick. The real arms are long horizontal beams that ride a
   carriage on the tower and swing in the horizontal plane, so head-on
   they extend and retract rather than pivot into a V. `far` puts an arm
   behind the ship and slightly higher, which is what sells the depth:
   the ship is genuinely between the two of them. */
function Arm({ P, C, g, close, clamped, far }) {
  const { towerX, pinY, shipCx, pinX } = g;
  const hingeX = towerX - 16;
  const dir = far ? -1 : 1;
  /* Open, the far arm rides high on the carriage and the near one low —
     that vertical offset is the whole reason the two read as a pair and
     not as one thick bar. Closing brings them back to the pins, so the
     cradles actually take the load where the ship carries it. */
  const dy = dir * (4 + 13 * close);
  /* seated: the cradle sits on the catch pin. open: drawn back just far
     enough to clear the hull, because head-on an arm that swings out in
     the horizontal plane reads as one that shortens */
  const seated = shipCx + dir * pinX;
  const retracted = shipCx + pinX + (far ? 30 : 52);
  const tipX = seated + (retracted - seated) * close;
  const len = hingeX - tipX;

  return (
    <g
      style={{
        transform: `translateY(${dy}px) rotate(${dir * 8 * close}deg)`,
        transformOrigin: `${hingeX}px ${pinY}px`,
        transition: "transform .62s cubic-bezier(.28,.9,.32,1)",
      }}
    >
      {/* beam, with a lit top chord so it doesn't read as a flat bar */}
      <rect x={tipX} y={pinY - 5} width={len} height="10" rx="3" fill={far ? P.towerDark : P.tower} />
      <rect x={tipX} y={pinY - 5} width={len} height="3" rx="1.5" fill={P.steel} opacity={far ? 0.18 : 0.34} />
      {/* the cradle that actually takes the load */}
      <rect x={tipX - 7} y={pinY - 9} width={15} height="18" rx="3" fill={P.steelDark} />
      <circle cx={tipX} cy={pinY} r="2.4" fill={C.ion} opacity={clamped ? 1 : 0.3}
              style={{ transition: "opacity .3s" }} />
      {clamped && (
        <circle cx={tipX} cy={pinY} r="8" fill={C.ion} opacity="0.4" style={{ filter: "blur(4px)" }} />
      )}
    </g>
  );
}

function Carriage({ P, C, g, clamped }) {
  const { towerX, pinY } = g;
  return (
    <g>
      <rect x={towerX - 22} y={pinY - 32} width={22} height={64} rx="3" fill={P.tower} />
      <rect x={towerX - 22} y={pinY - 32} width={22} height={4} rx="2" fill={P.steel} opacity="0.28" />
      <rect x={towerX - 18} y={pinY - 24} width={14} height={2} fill={C.ion} opacity={clamped ? 0.9 : 0.3}
            style={{ transition: "opacity .3s" }} />
      <rect x={towerX - 18} y={pinY + 20} width={14} height={2} fill={C.ion} opacity={clamped ? 0.9 : 0.3}
            style={{ transition: "opacity .3s" }} />
    </g>
  );
}

/* Contact sparks off the pins the instant the cradles take the load. */
function CatchSparks({ C, g }) {
  const { pinY, shipCx, pinX } = g;
  return (
    <g>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const side = i % 2 ? 1 : -1;
        const x = shipCx + side * pinX;
        return (
          <line
            key={i}
            x1={x}
            y1={pinY}
            x2={x + Math.cos(a) * 18}
            y2={pinY + Math.sin(a) * 18}
            stroke={i % 3 ? C.ion : "#FFFFFF"}
            strokeWidth="1.5"
            strokeLinecap="round"
            className="sc-spark"
            style={{ animationDelay: `${(i % 4) * 28}ms` }}
          />
        );
      })}
    </g>
  );
}

function LaunchMount({ P, C, g, power, mix, flicker, alt }) {
  const { shipCx, ground, deckY } = g;
  const hot = mixHex(FLAME.hot, FLAME.coolMid, mix * 0.55);
  const hotCore = mixHex(FLAME.hotCore, FLAME.coolCore, mix * 0.6);
  /* the pad only burns while the engines are still near it — once the ship
     is climbing, the trench goes quiet even though the engines are at full */
  const pad = power * (1 - smooth(alt / 0.12));

  return (
    <g>
      {/* ground plane and the horizon it sits against */}
      <rect x="0" y={ground} width={g.w} height={g.h - ground} fill={P.towerDark} opacity="0.5" />

      {/* deluge steam — water on the deck, not exhaust, so it stays white */}
      {pad > 0.04 && (
        <g opacity={0.34 * pad}>
          <ellipse cx={shipCx - 34} cy={ground - 4} rx={30 + 18 * pad} ry={11}
                   fill="#FFFFFF" opacity="0.13" className="sc-deluge"
                   style={{ filter: "blur(7px)" }} />
          <ellipse cx={shipCx + 40} cy={ground - 2} rx={26 + 16 * pad} ry={10}
                   fill="#FFFFFF" opacity="0.11" className="sc-deluge"
                   style={{ filter: "blur(7px)", animationDelay: "-0.5s" }} />
        </g>
      )}

      {/* flame trench bloom */}
      {pad > 0.04 && (
        <g opacity={0.6 * pad} style={{ filter: "blur(8px)" }}>
          <ellipse cx={shipCx} cy={ground - 2} rx={(46 + 30 * pad) * flicker} ry={15} fill={hot} opacity="0.5" />
          <ellipse cx={shipCx} cy={ground - 6} rx={(26 + 18 * pad) * flicker} ry={11} fill={hotCore} opacity="0.5" />
        </g>
      )}

      {/* orbital launch mount: one deck on four legs, with the flame
          trench cut through the middle so the plume goes down through
          the pad instead of across the front of it */}
      <rect x={shipCx - 52} y={deckY} width={104} height={12} rx="2" fill={P.towerDark} />
      <rect x={shipCx - 52} y={deckY} width={104} height="3" fill={P.tower} opacity="0.7" />
      <rect x={shipCx - 14} y={deckY + 1} width={28} height={11} fill={P.void} opacity="0.85" />
      {[-44, -24, 20, 40].map((dx) => (
        <rect key={dx} x={shipCx + dx} y={deckY + 12} width={7} height={ground - deckY - 12} fill={P.towerDark} />
      ))}
      {/* deck edge picks up the light coming out of the trench */}
      <rect
        x={shipCx - 52}
        y={deckY - 1}
        width={104}
        height={2}
        fill={C.ion}
        opacity={0.16 + 0.5 * clamp01(pad)}
      />
    </g>
  );
}

/* ============================================================
   HERO
   ============================================================ */
export default function StarshipHero({
  C,
  phase = "idle",
  arms = "open",
  shipRef,
  flightRef,
  onTap,
  height = 248,
}) {
  const P = shipPalette(C);
  const wrapRef = useRef(null);
  const tiltRef = useRef(null);

  /* The scene is one SVG whose viewBox is the container's own CSS pixel
     box, so one user unit is one CSS pixel. That is what lets the tower
     and the arms be authored in SVG while the ship stays an HTML element
     whose transform Home writes in real pixels — the two coordinate
     systems stay identical at every screen width, with no distortion
     from preserveAspectRatio. */
  const [box, setBox] = useState({ w: 380, h: height });

  useLayoutEffect(() => {
    const node = wrapRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const r = node.getBoundingClientRect();
      if (r.width > 0) setBox({ w: r.width, h: r.height || height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [height]);

  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  /* Live artwork state. Only ticks while something is burning, and only
     re-renders this subtree — Home's mode cards are untouched. */
  const [fx, setFx] = useState({ power: 0, mix: 0, reentry: 0, tilt: 0, shake: 0, flicker: 1 });
  const rafRef = useRef(null);
  const phaseT0 = useRef(0);

  useEffect(() => {
    phaseT0.current = performance.now();
    if (reduced || phase === "idle") {
      setFx({ power: 0, mix: 0, reentry: 0, tilt: 0, shake: 0, flicker: 1 });
      return;
    }
    const tick = (now) => {
      const alt = flightRef?.current?.alt ?? 0;
      const m = flightModel(phase, now - phaseT0.current, alt);
      setFx({ ...m, flicker: 0.85 + Math.random() * 0.3 });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, reduced, flightRef]);

  const alt = flightRef?.current?.alt ?? 0;

  /* ---------- geometry, all in CSS pixels ---------- */
  const SHIP_H = Math.min(186, box.h - 52);
  const SHIP_W = (SHIP_H * 60) / 210;
  /* Anchor the tower near the right edge and hang the ship off it at a
     fixed arm reach, so the chopsticks keep a believable length at every
     width instead of the two drifting apart on a wide screen. */
  const towerX = box.w - 46;
  const reach = Math.min(118, box.w * 0.34);
  const shipCx = Math.max(SHIP_W / 2 + 16, towerX - reach - SHIP_W / 2);
  const g = {
    w: box.w,
    h: box.h,
    ground: box.h - 5,
    deckY: box.h - 26,
    towerTop: 34,
    shipCx,
    towerX,
  };
  /* the skirt sits down into the mount, not on top of it */
  const shipBottom = g.deckY + 9;
  const noseY = shipBottom - SHIP_H;
  /* the pins, from the ship's own drawing: y 56-63 and x centred on 12.75
     and 47.25 of the 60-unit box. The cradles seat here, not on the hull
     edge — the flared aft flaps make the box wider than the barrel. */
  g.pinY = noseY + SHIP_H * (59.5 / 210);
  g.pinX = SHIP_W * (17.25 / 60);

  const close = arms === "open" ? 1 : 0;
  const clamped = arms === "clamped";

  /* pad shake: the whole scene, not just the ship, the way a launch feels */
  const jitter = fx.shake ? (Math.random() - 0.5) * 2.4 * fx.shake : 0;

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{ height, transform: `translate(${jitter}px, ${jitter * 0.4}px)` }}
    >
      <style>{`
        @keyframes sc-deluge {
          0%,100% { transform: translateY(0) scaleX(1); opacity: .5; }
          50%     { transform: translateY(-7px) scaleX(1.13); opacity: .82; }
        }
        .sc-deluge { animation: sc-deluge 1.5s ease-in-out infinite; }
        @keyframes sc-spark {
          0%   { opacity: 1; transform: scale(.15); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        .sc-spark { animation: sc-spark .5s ease-out both; transform-box: fill-box; transform-origin: 0 50%; }
        @keyframes sc-drift {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-5px); }
        }
        .sc-drift { animation: sc-drift 4.5s ease-in-out infinite; }
        @keyframes sc-holddown {
          0%,100% { transform: translate(0,0); }
          25%     { transform: translate(1.1px,-.5px); }
          75%     { transform: translate(-1.1px,.5px); }
        }
        .sc-holddown { animation: sc-holddown .09s linear infinite; }
        @keyframes sc-beacon { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
        .sc-beacon { animation: sc-beacon 1.7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sc-deluge, .sc-spark, .sc-drift, .sc-holddown, .sc-beacon { animation: none !important; }
        }
      `}</style>

      {/* ---------- BACK: tower, mount, pad fire ---------- */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={g.w}
        height={g.h}
        viewBox={`0 0 ${g.w} ${g.h}`}
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        {/* Ground haze, so the pad reads as sitting on something. Radial and
            centred on the mount rather than a band across the block — a
            linear one stops dead at the edges and the whole hero reads as
            a lighter rectangle pasted onto the page. */}
        <defs>
          <radialGradient id="sc-haze" cx={g.shipCx} cy={g.ground} r={g.w * 0.62} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={C.ion} stopOpacity="0.16" />
            <stop offset="55%" stopColor={C.ion} stopOpacity="0.06" />
            <stop offset="100%" stopColor={C.ion} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={g.w} height={g.h} fill="url(#sc-haze)" />
        <TowerBack P={P} C={C} g={g} />
        {/* the far chopstick reaches around behind the ship */}
        <Arm P={P} C={C} g={g} close={close} clamped={clamped} far />
      </svg>

      {/* ---------- SHIP ---------- */}
      <button
        type="button"
        onClick={onTap}
        aria-label="Launch the Starship"
        className="absolute active:scale-95"
        style={{
          left: g.shipCx - SHIP_W / 2 - 26,
          top: noseY - 16,
          width: SHIP_W + 52,
          padding: "16px 26px 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          transition: "transform .12s ease",
          zIndex: 2,
        }}
      >
        {/* Home writes translateY/scale straight onto this node every frame,
            and measures its top as the nose for the card collisions. Nothing
            here may set `transform` in JSX or it would fight that. */}
        <span
          ref={shipRef}
          className={
            phase === "ignition" ? "sc-holddown" : phase === "idle" ? "sc-drift" : undefined
          }
          style={{ display: "block", willChange: "transform" }}
        >
          <span
            ref={tiltRef}
            style={{
              display: "block",
              transform: `rotate(${fx.tilt}deg)`,
              transformOrigin: "50% 60%",
              filter:
                fx.power > 0.1
                  ? `drop-shadow(0 0 22px ${rgba(C.ion, 0.5)})`
                  : `drop-shadow(0 2px 5px ${rgba(C.void, 0.9)}) drop-shadow(0 0 9px ${rgba(C.ion, 0.28)})`,
              transition: "filter .3s ease",
            }}
          >
            <svg
              width={SHIP_W}
              height={SHIP_H}
              viewBox="0 0 60 210"
              fill="none"
              aria-hidden="true"
              /* the plume is drawn past y=210 and paints outside the box —
                 keeping the layout box the hull alone is what keeps the
                 nose-versus-card measurement honest */
              style={{ overflow: "visible", display: "block" }}
            >
              <Plume power={fx.power} flicker={fx.flicker} mix={fx.mix} alt={alt} />
              <StarshipBody P={P} reentry={fx.reentry} />
            </svg>
          </span>
        </span>
      </button>

      {/* ---------- FRONT: the chopsticks close over the ship ---------- */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={g.w}
        height={g.h}
        viewBox={`0 0 ${g.w} ${g.h}`}
        aria-hidden="true"
        style={{ zIndex: 3, overflow: "visible" }}
      >
        {/* The pad goes in front of the ship, so the skirt reads as sitting
            down inside the mount and the plume disappears into the trench
            rather than painting across the deck. */}
        <LaunchMount P={P} C={C} g={g} power={fx.power} mix={fx.mix} flicker={fx.flicker} alt={alt} />
        <Carriage P={P} C={C} g={g} clamped={clamped} />
        <Arm P={P} C={C} g={g} close={close} clamped={clamped} />
        {clamped && <CatchSparks key={arms} C={C} g={g} />}
      </svg>
    </div>
  );
}
