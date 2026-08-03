import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { Rocket, Play, Users, Trophy, X, Pause, ChevronRight, Check, Share2, Flame, Target, AlertTriangle, Repeat } from "lucide-react"
/* ============================================================
   PERSISTENCE
   The prototype ran inside a preview that provided window.storage.
   The deployed app has no such thing, so we back the same API with
   the browser's own localStorage. Wrapped in a guard because this
   module is also evaluated on the server, where window is undefined.
   ============================================================ */
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => {
      const value = window.localStorage.getItem(key);
      if (value === null) throw new Error(`No stored value for ${key}`);
      return { key, value };
    },
    set: async (key, value) => {
      window.localStorage.setItem(key, String(value));
      return { key, value };
    },
  };
}
 ;

/* ============================================================
   THEMES — look only. Same questions, same scoring, same rules.
   ============================================================ */
const THEMES = {
  moon: {
    id: "moon",
    name: "Moon",
    tagline: "Cold, precise, unforgiving",
    void: "#05070F",
    hull: "#0E1424",
    hullLight: "#161E33",
    edge: "#243049",
    ion: "#22D3EE",
    plasma: "#C026D3",
    thrust: "#34D399",
    abort: "#FB4E5A",
    star: "#E8ECF8",
    dim: "#7C89A8",
  },
  mars: {
    id: "mars",
    name: "Mars",
    tagline: "Hot, dusty, a long way from home",
    void: "#0D0604",
    hull: "#1C0F0A",
    hullLight: "#2A1811",
    edge: "#45291D",
    ion: "#FF8C42",
    plasma: "#E85D75",
    thrust: "#7BD389",
    abort: "#FF4D4D",
    star: "#FFF0E6",
    dim: "#A8836F",
  },
};

const ThemeCtx = createContext(THEMES.moon);
const useC = () => useContext(ThemeCtx);

const TIER_META = {
  Earthbound: { points: 100, key: "ion" },
  Orbit: { points: 200, key: "plasma" },
  Martian: { points: 300, key: "abort" },
};

const CATEGORIES = ["Tesla", "SpaceX", "Starship", "FSD", "Gigafactory", "Neuralink", "Twitter/X", "Elon Personal"];

/* ============================================================
   QUESTION BANK
   ============================================================ */
const QUESTIONS = [
  { q: "In what year was Tesla Motors founded by Martin Eberhard and Marc Tarpenning?", o: ["2001", "2003", "2004", "2006"], a: "2003", d: "Earthbound", c: "Tesla" },
  { q: "When did Elon Musk first invest in Tesla and join as Chairman of the Board?", o: ["2003", "2004", "2006", "2008"], a: "2004", d: "Earthbound", c: "Tesla" },
  { q: "What was the first production vehicle delivered by Tesla?", o: ["Model S", "Roadster", "Model 3", "Model X"], a: "Roadster", d: "Earthbound", c: "Tesla" },
  { q: "In what year did Tesla go public with its IPO on the Nasdaq?", o: ["2008", "2010", "2012", "2013"], a: "2010", d: "Earthbound", c: "Tesla" },
  { q: "What year did Tesla begin deliveries of the Model S?", o: ["2010", "2012", "2014", "2015"], a: "2012", d: "Earthbound", c: "Tesla" },
  { q: "Which Tesla vehicle was the first to offer Autopilot hardware as standard, starting in late 2014?", o: ["Roadster", "Model S", "Model 3", "Cybertruck"], a: "Model S", d: "Orbit", c: "FSD" },
  { q: "In October 2016, Tesla announced all new vehicles would ship with hardware for full self-driving. What sensor change came with it?", o: ["Removal of all cameras", "8 surround cameras for 360° visibility", "Exclusive reliance on LiDAR", "Only ultrasonic sensors"], a: "8 surround cameras for 360° visibility", d: "Orbit", c: "FSD" },
  { q: "When did Tesla first release FSD Beta to a limited group of customers?", o: ["2018", "October 2020", "2022", "2024"], a: "October 2020", d: "Orbit", c: "FSD" },
  { q: "FSD version 12 marked a major architectural shift in 2023–2024. What was the primary change?", o: ["Addition of more LiDAR", "End-to-end neural network replacing most explicit C++ code", "Switch to radar-only", "Complete removal of cameras"], a: "End-to-end neural network replacing most explicit C++ code", d: "Martian", c: "FSD" },
  { q: "Where is Tesla's original vehicle factory located (formerly the NUMMI plant)?", o: ["Austin, Texas", "Fremont, California", "Reno, Nevada", "Shanghai"], a: "Fremont, California", d: "Earthbound", c: "Gigafactory" },
  { q: "When did Gigafactory Nevada begin major battery production operations?", o: ["2014", "2016", "2018", "2019"], a: "2016", d: "Orbit", c: "Gigafactory" },
  { q: "Which was Tesla's first Gigafactory outside the United States?", o: ["Berlin", "Shanghai", "Texas", "Mexico"], a: "Shanghai", d: "Earthbound", c: "Gigafactory" },
  { q: "In what year did both Gigafactory Berlin-Brandenburg and Gigafactory Texas begin vehicle production?", o: ["2020", "2021", "2022", "2023"], a: "2022", d: "Orbit", c: "Gigafactory" },
  { q: "SpaceX was founded in which year?", o: ["2001", "2002", "2004", "2006"], a: "2002", d: "Earthbound", c: "SpaceX" },
  { q: "What was the payload on the first Falcon Heavy test flight in February 2018?", o: ["A Starlink satellite", "Elon Musk's personal Tesla Roadster with Starman", "A Dragon capsule", "A weather satellite"], a: "Elon Musk's personal Tesla Roadster with Starman", d: "Earthbound", c: "SpaceX" },
  { q: "What is the primary long-term goal of the Starship program?", o: ["Only satellite deployment", "Making life multi-planetary, including Mars missions", "Only lunar tourism", "Atmospheric research only"], a: "Making life multi-planetary, including Mars missions", d: "Earthbound", c: "Starship" },
  { q: "By mid-2026, roughly how many integrated Starship flight tests had been conducted?", o: ["5", "Around 13", "25", "50"], a: "Around 13", d: "Martian", c: "Starship" },
  { q: "What major upper-stage capability did Starship flights in 2025–2026 demonstrate?", o: ["Permanent orbital station", "In-space Raptor engine relight and payload deployment", "Crewed lunar landing", "Interstellar travel"], a: "In-space Raptor engine relight and payload deployment", d: "Orbit", c: "Starship" },
  { q: "Neuralink was co-founded by Elon Musk in which year?", o: ["2014", "2016", "2018", "2020"], a: "2016", d: "Earthbound", c: "Neuralink" },
  { q: "When did Neuralink perform its first human implant?", o: ["2022", "January 2024", "2025", "2023"], a: "January 2024", d: "Orbit", c: "Neuralink" },
  { q: "By early 2026, approximately how many people had received Neuralink implants in clinical trials?", o: ["3", "12", "21", "50"], a: "21", d: "Martian", c: "Neuralink" },
  { q: "What is the name of Neuralink's speech restoration clinical trial?", o: ["PRIME", "VOICE", "Blindsight", "CONVOY"], a: "VOICE", d: "Martian", c: "Neuralink" },
  { q: "In what year did Elon Musk complete the acquisition of Twitter?", o: ["2021", "2022", "2023", "2024"], a: "2022", d: "Earthbound", c: "Twitter/X" },
  { q: "What was the agreed purchase price for Twitter in 2022?", o: ["$30 billion", "$44 billion", "$60 billion", "$20 billion"], a: "$44 billion", d: "Earthbound", c: "Twitter/X" },
  { q: "What did Elon Musk rebrand Twitter as after the acquisition?", o: ["Twttr", "X", "MuskNet", "Starlink Social"], a: "X", d: "Earthbound", c: "Twitter/X" },
  { q: "In March 2025, Elon Musk's xAI acquired X in an all-stock deal. What entity then acquired xAI itself in early 2026?", o: ["Tesla", "SpaceX", "Neuralink", "The Boring Company"], a: "SpaceX", d: "Martian", c: "Twitter/X" },
  { q: "What year was The Boring Company founded?", o: ["2014", "2016", "2019", "2021"], a: "2016", d: "Orbit", c: "Elon Personal" },
  { q: "xAI was founded by Elon Musk in which year?", o: ["2021", "2022", "2023", "2024"], a: "2023", d: "Earthbound", c: "Elon Personal" },
  { q: "Which Tesla model was the first mass-market vehicle aiming for a roughly $35,000 starting price?", o: ["Model S", "Model X", "Model 3", "Model Y"], a: "Model 3", d: "Earthbound", c: "Tesla" },
  { q: "Tesla's first quarterly profit as a public company was reported in which year?", o: ["2010", "2013", "2016", "2018"], a: "2013", d: "Orbit", c: "Tesla" },
  { q: "What significant event involving a Tesla vehicle occurred on the first Falcon Heavy launch?", o: ["It was used as a battery pack", "A Roadster was sent into heliocentric orbit as the dummy payload", "It landed on the Moon", "It was destroyed on the pad"], a: "A Roadster was sent into heliocentric orbit as the dummy payload", d: "Earthbound", c: "SpaceX" },
  { q: "Gigafactory Shanghai reached 1 million vehicles produced in roughly how many years after opening?", o: ["Less than 3 years", "5 years", "7 years", "10 years"], a: "Less than 3 years", d: "Orbit", c: "Gigafactory" },
  { q: "By July 2026, Tesla had produced approximately how many total vehicles across its factories?", o: ["5 million", "10 million", "15 million", "2 million"], a: "10 million", d: "Martian", c: "Tesla" },
  { q: "Which hardware version introduced significantly higher resolution cameras and a more powerful computer for FSD?", o: ["HW1", "HW2", "HW3", "HW4 / AI4"], a: "HW4 / AI4", d: "Orbit", c: "FSD" },
  { q: "What is the name of Neuralink's implant system used in human trials?", o: ["Link", "N1", "Telepathy Chip", "Cortex"], a: "N1", d: "Orbit", c: "Neuralink" },
  { q: "In which U.S. state is Gigafactory Texas, and Tesla's current global headquarters, located?", o: ["California", "Nevada", "Texas", "New York"], a: "Texas", d: "Earthbound", c: "Gigafactory" },
  { q: "What major Starship milestone involves catching the booster with the launch tower arms, nicknamed \"Mechazilla\"?", o: ["Soft ocean landing only", "Tower catch of the Super Heavy booster", "Parachute recovery", "No recovery attempted"], a: "Tower catch of the Super Heavy booster", d: "Orbit", c: "Starship" },
  { q: "Elon Musk's initial offer to buy Twitter in April 2022 was valued at approximately how much?", o: ["$20 billion", "$44 billion", "$70 billion", "$100 billion"], a: "$44 billion", d: "Earthbound", c: "Twitter/X" },
  { q: "Which company did Tesla acquire in 2016 to expand into solar energy?", o: ["SolarCity", "SunPower", "First Solar", "Enphase"], a: "SolarCity", d: "Orbit", c: "Tesla" },
  { q: "What is the primary focus of Neuralink's Blindsight program?", o: ["Hearing restoration", "Vision restoration by stimulating the visual cortex", "Memory enhancement", "Mood regulation"], a: "Vision restoration by stimulating the visual cortex", d: "Martian", c: "Neuralink" },
  { q: "SpaceX's Starship is designed to be fully reusable. What does this primarily aim to achieve?", o: ["Higher launch costs", "Dramatically lower cost per kilogram to orbit", "Single-use only missions", "Exclusively military use"], a: "Dramatically lower cost per kilogram to orbit", d: "Earthbound", c: "Starship" },
  { q: "In which year did Tesla open its first Supercharger stations?", o: ["2010", "2012", "2015", "2018"], a: "2012", d: "Orbit", c: "Tesla" },
  { q: "What was the original name of the company before it was shortened to just Tesla?", o: ["Tesla Electric", "Tesla Motors", "Electric Cars Inc.", "Musk Motors"], a: "Tesla Motors", d: "Earthbound", c: "Tesla" },
  { q: "Which of the following is NOT one of Elon Musk's primary companies today?", o: ["SpaceX", "Neuralink", "OpenAI", "The Boring Company"], a: "OpenAI", d: "Orbit", c: "Elon Personal" },
  { q: "By mid-2026 reports, cumulative FSD (Supervised) miles driven exceeded approximately what level?", o: ["1 billion", "Several billion", "100 million", "500 million"], a: "Several billion", d: "Martian", c: "FSD" },
  { q: "What year did Cybertruck production and customer deliveries begin at Gigafactory Texas?", o: ["2021", "2022", "2023", "2024"], a: "2023", d: "Orbit", c: "Gigafactory" },
  { q: "Neuralink aims for high-volume production and more automated surgery starting in which year, per its late-2025 announcement?", o: ["2024", "2025", "2026", "2028"], a: "2026", d: "Martian", c: "Neuralink" },
  { q: "Which rocket launched the first commercial crewed mission to the ISS for NASA in 2020?", o: ["Falcon Heavy", "Falcon 9", "Starship", "Falcon 1"], a: "Falcon 9", d: "Orbit", c: "SpaceX" },
  { q: "In the March 2025 xAI–X deal, what was the approximate valuation assigned to X itself?", o: ["$80 billion", "Around $33 billion", "$44 billion", "$12 billion"], a: "Around $33 billion", d: "Martian", c: "Twitter/X" },
  { q: "Tesla's Model Y entered production at which factory first, in 2020?", o: ["Shanghai", "Fremont", "Berlin", "Texas"], a: "Fremont", d: "Orbit", c: "Tesla" },
  { q: "SpaceX's acquisition of xAI in February 2026 combined the companies into an entity with roughly what valuation, ahead of a planned IPO?", o: ["$80 billion", "$500 billion", "$1.25 trillion", "$250 billion"], a: "$1.25 trillion", d: "Martian", c: "Elon Personal" },
  { q: "In 2025, Tesla disclosed an investment in xAI as part of its Series E funding round. Approximately how much did Tesla invest?", o: ["$500 million", "$2 billion", "$10 billion", "$50 million"], a: "$2 billion", d: "Martian", c: "Elon Personal" },
  { q: "By June 2026, Neuralink had reached how many implanted patients, up from 21 confirmed earlier in the year?", o: ["23", "26", "30", "40"], a: "26", d: "Martian", c: "Neuralink" },
];

/* ============================================================
   HELPERS
   ============================================================ */
const shuffle = (arr, seed) => {
  const a = [...arr];
  let s = seed ?? Math.floor(Math.random() * 100000);
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const todaySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};
const todayKey = () => new Date().toISOString().slice(0, 10);

const ALTITUDES = [{ at: 0 }, { at: 0.33 }, { at: 0.66 }, { at: 1 }];

/* ============================================================
   PLANETS — rendered in code, no image files
   ============================================================ */
function MoonBody({ size = 200, dim = false }) {
  const craters = [
    { x: 30, y: 26, r: 13 }, { x: 62, y: 40, r: 8 }, { x: 44, y: 62, r: 16 },
    { x: 72, y: 70, r: 6 }, { x: 22, y: 58, r: 7 }, { x: 55, y: 20, r: 5 },
    { x: 36, y: 82, r: 9 }, { x: 78, y: 30, r: 5 },
  ];
  return (
    <div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 33% 30%, #E9EDF3 0%, #C3CAD6 38%, #8B93A3 66%, #4A5163 88%, #2A2F3D 100%)",
        boxShadow: dim ? "none" : "0 0 60px #A9B4C880, inset -14px -10px 40px #00000099",
        transition: "box-shadow .5s ease, filter .5s ease",
        filter: dim ? "saturate(.5) brightness(.6)" : "none",
      }}
    >
      {craters.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: `${c.r}%`,
            height: `${c.r}%`,
            background: "radial-gradient(circle at 38% 32%, #6E7686 0%, #9AA2B0 55%, #C8CFD9 100%)",
            boxShadow: "inset 1px 2px 3px #00000055",
            opacity: 0.75,
          }}
        />
      ))}
    </div>
  );
}

function MarsBody({ size = 200, dim = false }) {
  const marks = [
    { x: 24, y: 34, w: 26, h: 14, o: 0.3 }, { x: 56, y: 24, w: 20, h: 10, o: 0.22 },
    { x: 40, y: 58, w: 32, h: 18, o: 0.28 }, { x: 66, y: 66, w: 16, h: 12, o: 0.2 },
    { x: 18, y: 66, w: 14, h: 9, o: 0.24 },
  ];
  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 34% 30%, #FFB380 0%, #E8703C 32%, #C2481F 62%, #7E2A12 86%, #43150A 100%)",
        boxShadow: dim ? "none" : "0 0 60px #FF7A3D66, inset -14px -10px 40px #00000099",
        transition: "box-shadow .5s ease, filter .5s ease",
        filter: dim ? "saturate(.5) brightness(.6)" : "none",
      }}
    >
      {marks.map((m, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: `${m.w}%`,
            height: `${m.h}%`,
            background: "#5E2210",
            opacity: m.o,
            filter: "blur(3px)",
          }}
        />
      ))}
      <div
        className="absolute rounded-full"
        style={{ left: "30%", top: "-7%", width: "40%", height: "18%", background: "#FFF3E8", opacity: 0.82, filter: "blur(4px)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ left: "36%", bottom: "-5%", width: "28%", height: "13%", background: "#FFF3E8", opacity: 0.6, filter: "blur(4px)" }}
      />
    </div>
  );
}

/* ============================================================
   SHARED UI
   ============================================================ */
function Starfield() {
  const C = useC();
  const stars = React.useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: (i * 37.5) % 100,
        y: (i * 61.7) % 100,
        s: (i % 3) + 1,
        o: 0.15 + ((i * 13) % 40) / 100,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, background: C.star, opacity: s.o }}
        />
      ))}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", full, disabled, style: st }) {
  const C = useC();
  const base = {
    fontFamily: "'Chakra Petch', system-ui, sans-serif",
    fontWeight: 600,
    letterSpacing: "0.04em",
    borderRadius: 14,
    transition: "transform .12s ease, box-shadow .2s ease, opacity .2s ease",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
  };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${C.ion}, ${C.plasma})`, color: C.void, boxShadow: `0 0 24px ${C.ion}44` },
    ghost: { background: "transparent", color: C.star, border: `1px solid ${C.edge}` },
    solid: { background: C.hullLight, color: C.star, border: `1px solid ${C.edge}` },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`px-5 py-3 text-sm active:scale-95 ${full ? "w-full" : ""}`}
      style={{ ...base, ...variants[variant], ...st }}
    >
      {children}
    </button>
  );
}

function Panel({ children, style: st, className = "" }) {
  const C = useC();
  return (
    <div className={`rounded-2xl ${className}`} style={{ background: C.hull, border: `1px solid ${C.edge}`, ...st }}>
      {children}
    </div>
  );
}

function Logo({ size = 28, palette }) {
  const ctx = useC();
  const C = palette || ctx;
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          width: size + 12,
          height: size + 12,
          background: `linear-gradient(135deg, ${C.ion}22, ${C.plasma}33)`,
          border: `1px solid ${C.ion}55`,
        }}
      >
        <Rocket size={size - 6} style={{ color: C.ion }} />
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

function TrajectoryRail({ progress }) {
  const C = useC();
  const p = Math.max(0, Math.min(1, progress));
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
      <div
        className="absolute"
        style={{ left: 8, bottom: `calc(${p * 100}% - 12px)`, transition: "bottom .7s cubic-bezier(.2,.8,.2,1)" }}
      >
        <Rocket size={26} style={{ color: C.star, filter: `drop-shadow(0 0 8px ${C.plasma})`, transform: "rotate(-45deg)" }} />
      </div>
    </div>
  );
}

/* Blue electrical discharge — origin at the center of the button,
   forking outward the way a real strike branches. */
const BOLT_CORE = "#EAF6FF";   // white-hot channel
const BOLT_GLOW = "#3FA9FF";   // blue halo
const BOLT_HALO = "#0A6BE0";   // deep blue outer bloom

/* Build a jagged path from the center outward toward an angle,
   with a fork partway along. Deterministic so it doesn't jitter on re-render. */
function makeBolt(angleDeg, reach, seed) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const rad = (angleDeg * Math.PI) / 180;
  const cx = 50, cy = 50;
  const segs = 5;
  let x = cx, y = cy;
  let d = `M${cx},${cy}`;
  const pts = [[cx, cy]];
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const dist = reach * t;
    const jitter = (rnd() - 0.5) * 26 * (1 - t * 0.45);
    const perp = rad + Math.PI / 2;
    x = cx + Math.cos(rad) * dist + Math.cos(perp) * jitter;
    y = cy + Math.sin(rad) * dist + Math.sin(perp) * jitter;
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
    pts.push([x, y]);
  }
  // fork off the third node
  const [fx, fy] = pts[2];
  const forkAngle = rad + (rnd() > 0.5 ? 0.55 : -0.55);
  const fLen = reach * 0.42;
  let fd = `M${fx.toFixed(1)},${fy.toFixed(1)}`;
  for (let i = 1; i <= 3; i++) {
    const t = i / 3;
    const jitter = (rnd() - 0.5) * 16;
    const perp = forkAngle + Math.PI / 2;
    const nx = fx + Math.cos(forkAngle) * fLen * t + Math.cos(perp) * jitter;
    const ny = fy + Math.sin(forkAngle) * fLen * t + Math.cos(perp) * jitter;
    fd += ` L${nx.toFixed(1)},${ny.toFixed(1)}`;
  }
  return { main: d, fork: fd };
}

const BOLT_ANGLES = [8, 52, 128, 172, 216, 262, 308, 340];

function Lightning({ active }) {
  if (!active) return null;
  const bolts = BOLT_ANGLES.map((a, i) => ({
    ...makeBolt(a, 44 + (i % 3) * 9, 1337 + i * 977),
    delay: (i % 4) * 0.045,
  }));

  const Stroke = ({ d, width, color, opacity, blur, delay }) => (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      style={{
        filter: blur ? `blur(${blur}px)` : "none",
        animation: `strike .5s ease-out ${delay}s both`,
      }}
    />
  );

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ overflow: "visible", zIndex: 2 }}
      aria-hidden="true"
    >
      <svg
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: 300,
          height: 300,
          marginLeft: -150,
          marginTop: -150,
          overflow: "visible",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* three passes per bolt: outer bloom, blue channel, white core */}
        {bolts.map((b, i) => (
          <g key={`halo-${i}`}>
            <Stroke d={b.main} width={7} color={BOLT_HALO} opacity={0.5} blur={3} delay={b.delay} />
            <Stroke d={b.fork} width={5} color={BOLT_HALO} opacity={0.4} blur={3} delay={b.delay + 0.03} />
          </g>
        ))}
        {bolts.map((b, i) => (
          <g key={`glow-${i}`}>
            <Stroke d={b.main} width={3.2} color={BOLT_GLOW} opacity={0.95} blur={0.6} delay={b.delay} />
            <Stroke d={b.fork} width={2.2} color={BOLT_GLOW} opacity={0.85} blur={0.6} delay={b.delay + 0.03} />
          </g>
        ))}
        {bolts.map((b, i) => (
          <g key={`core-${i}`}>
            <Stroke d={b.main} width={1.1} color={BOLT_CORE} opacity={1} delay={b.delay} />
            <Stroke d={b.fork} width={0.8} color={BOLT_CORE} opacity={0.9} delay={b.delay + 0.03} />
          </g>
        ))}
      </svg>

      {/* discharge flash at the origin point */}
      <div
        className="absolute rounded-full"
        style={{
          left: "50%",
          top: "50%",
          width: 90,
          height: 90,
          marginLeft: -45,
          marginTop: -45,
          background: `radial-gradient(circle, ${BOLT_CORE} 0%, ${BOLT_GLOW}99 28%, ${BOLT_HALO}44 55%, transparent 72%)`,
          animation: "flash .45s ease-out both",
        }}
      />
    </div>
  );
}

/* ============================================================
   PLANET CHOOSER
   ============================================================ */
function PlanetPicker({ onPick }) {
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
                onClick={() => onPick(t.id)}
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

/* ============================================================
   SCREENS
   ============================================================ */
function DrivingCheck({ onConfirm, onCancel }) {
  const C = useC();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "#000000cc" }}>
      <Panel style={{ maxWidth: 380, borderColor: `${C.abort}66` }} className="p-6">
        <div className="flex justify-center mb-4">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 56, height: 56, background: `${C.abort}22`, border: `1px solid ${C.abort}66` }}
          >
            <AlertTriangle size={26} style={{ color: C.abort }} />
          </div>
        </div>
        <h2 className="text-center mb-2" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 22, color: C.star }}>
          Are you driving?
        </h2>
        <p className="text-center text-sm mb-6" style={{ color: C.dim, lineHeight: 1.6 }}>
          Hand the phone to a passenger. Keep your eyes on the road — the trivia will still be here when you park.
        </p>
        <div className="flex flex-col gap-2">
          <Btn full onClick={onConfirm}>I'm not driving</Btn>
          <Btn full variant="ghost" onClick={onCancel}>I'm driving — go back</Btn>
        </div>
      </Panel>
    </div>
  );
}

function Stat({ icon, label, value, color }) {
  const C = useC();
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: C.star }}>{value}</div>
    </div>
  );
}

function Home({ onDaily, onCustom, stats, dailyDone, onSwapTheme, themeName }) {
  const C = useC();
  return (
    <div className="relative min-h-screen p-6 flex flex-col" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 flex flex-col flex-1 max-w-md w-full mx-auto">
        <div className="pt-4 pb-8 flex items-center justify-between">
          <Logo size={32} />
          <button
            onClick={onSwapTheme}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-90"
            style={{ background: C.hullLight, border: `1px solid ${C.edge}`, transition: "transform .12s" }}
          >
            <Repeat size={13} style={{ color: C.ion }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.14em" }}>
              {themeName.toUpperCase()}
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={onDaily} className="text-left active:scale-95" style={{ transition: "transform .12s" }}>
            <Panel className="p-5" style={{ borderColor: dailyDone ? C.edge : `${C.ion}66`, boxShadow: dailyDone ? "none" : `0 0 30px ${C.ion}18` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={16} style={{ color: C.ion }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.ion, letterSpacing: "0.18em" }}>
                      {dailyDone ? "COMPLETE" : "TODAY ONLY"}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 20, color: C.star }}>
                    Daily Challenge
                  </div>
                  <div className="text-sm mt-1" style={{ color: C.dim }}>
                    Ten questions. Same ten for everyone today.
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: C.dim, marginTop: 20 }} />
              </div>
            </Panel>
          </button>

          <button onClick={onCustom} className="text-left active:scale-95" style={{ transition: "transform .12s" }}>
            <Panel className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={16} style={{ color: C.plasma }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.plasma, letterSpacing: "0.18em" }}>
                      PASS AND PLAY
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 20, color: C.star }}>
                    Road Trip Mode
                  </div>
                  <div className="text-sm mt-1" style={{ color: C.dim }}>
                    Everyone in the car takes a turn. You set the rules.
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: C.dim, marginTop: 20 }} />
              </div>
            </Panel>
          </button>
        </div>

        <div className="mt-auto pt-8">
          <Panel className="p-4">
            <div className="flex items-center justify-around">
              <Stat icon={<Trophy size={14} />} label="BEST" value={stats.best} color={C.ion} />
              <div style={{ width: 1, height: 32, background: C.edge }} />
              <Stat icon={<Flame size={14} />} label="STREAK" value={stats.streak} color={C.plasma} />
              <div style={{ width: 1, height: 32, background: C.edge }} />
              <Stat icon={<Rocket size={14} />} label="RUNS" value={stats.runs} color={C.thrust} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  const C = useC();
  return (
    <div className="mb-6">
      <div className="mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: "0.18em" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Slider({ value, min, max, step, onChange, suffix }) {
  const C = useC();
  const steps = [];
  for (let i = min; i <= max; i += step) steps.push(i);
  return (
    <div className="flex gap-2">
      {steps.map((s) => {
        const on = value === s;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="flex-1 py-3 rounded-xl active:scale-95"
            style={{
              background: on ? `${C.ion}18` : C.hullLight,
              border: `1px solid ${on ? C.ion : C.edge}`,
              color: on ? C.ion : C.dim,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: 14,
              transition: "all .18s",
            }}
          >
            {s}{suffix}
          </button>
        );
      })}
    </div>
  );
}

function CustomSetup({ onStart, onBack }) {
  const C = useC();
  const [players, setPlayers] = useState(["Player 1", "Player 2"]);
  const [difficulty, setDifficulty] = useState("Mixed");
  const [cats, setCats] = useState([]);
  const [count, setCount] = useState(10);
  const [timer, setTimer] = useState(15);
  const [sameQ, setSameQ] = useState(false);

  const toggleCat = (c) => setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const addPlayer = () => players.length < 8 && setPlayers([...players, `Player ${players.length + 1}`]);
  const rmPlayer = (i) => players.length > 1 && setPlayers(players.filter((_, x) => x !== i));
  const setName = (i, v) => setPlayers(players.map((p, x) => (x === i ? v : p)));

  const pool = QUESTIONS.filter((q) => (difficulty === "Mixed" || q.d === difficulty) && (cats.length === 0 || cats.includes(q.c)));
  const enough = pool.length >= count;

  return (
    <div className="relative min-h-screen p-6" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 max-w-md mx-auto pb-8">
        <div className="flex items-center justify-between mb-6 pt-2">
          <h1 style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 24, color: C.star }}>Set up the run</h1>
          <button onClick={onBack} className="active:scale-90" style={{ transition: "transform .12s" }}>
            <X size={22} style={{ color: C.dim }} />
          </button>
        </div>

        <Section label="WHO'S PLAYING">
          <div className="flex flex-col gap-2">
            {players.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={p}
                  onChange={(e) => setName(i, e.target.value)}
                  maxLength={14}
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: C.hullLight, border: `1px solid ${C.edge}`, color: C.star, fontFamily: "'Chakra Petch', sans-serif" }}
                />
                {players.length > 1 && (
                  <button onClick={() => rmPlayer(i)} className="p-2 active:scale-90">
                    <X size={16} style={{ color: C.dim }} />
                  </button>
                )}
              </div>
            ))}
            {players.length < 8 && <Btn variant="ghost" onClick={addPlayer} full>+ Add player</Btn>}
          </div>
        </Section>

        <Section label="DIFFICULTY">
          <div className="grid grid-cols-2 gap-2">
            {["Mixed", "Earthbound", "Orbit", "Martian"].map((t) => {
              const on = difficulty === t;
              const col = TIER_META[t] ? C[TIER_META[t].key] : C.star;
              return (
                <button
                  key={t}
                  onClick={() => setDifficulty(t)}
                  className="px-3 py-3 rounded-xl text-left active:scale-95"
                  style={{ background: on ? `${col}18` : C.hullLight, border: `1px solid ${on ? col : C.edge}`, transition: "all .18s" }}
                >
                  <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 14, color: on ? col : C.star }}>{t}</div>
                  {TIER_META[t] && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, marginTop: 2 }}>
                      {TIER_META[t].points} PTS
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        <Section label={`CATEGORIES ${cats.length === 0 ? "· ALL" : `· ${cats.length}`}`}>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = cats.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className="px-3 py-2 rounded-full text-xs active:scale-95"
                  style={{
                    background: on ? `${C.plasma}22` : C.hullLight,
                    border: `1px solid ${on ? C.plasma : C.edge}`,
                    color: on ? C.plasma : C.dim,
                    fontFamily: "'Chakra Petch', sans-serif",
                    fontWeight: 600,
                    transition: "all .18s",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Section>

        <Section label="QUESTIONS PER PLAYER">
          <Slider value={count} min={5} max={20} step={5} onChange={setCount} suffix="" />
        </Section>

        <Section label="SECONDS PER TURN">
          <Slider value={timer} min={5} max={45} step={5} onChange={setTimer} suffix="s" />
        </Section>

        <Section label="QUESTION SET">
          <button
            onClick={() => setSameQ(!sameQ)}
            className="w-full p-4 rounded-xl text-left active:scale-95"
            style={{ background: C.hullLight, border: `1px solid ${sameQ ? C.ion : C.edge}`, transition: "all .18s" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 14, color: C.star }}>
                  {sameQ ? "Everyone gets the same questions" : "Everyone gets different questions"}
                </div>
                <div className="text-xs mt-1" style={{ color: C.dim }}>
                  {sameQ ? "Head to head. Same test, no excuses." : "Fresh questions each turn. Nobody overhears an answer."}
                </div>
              </div>
              <div
                className="rounded-full flex-shrink-0"
                style={{ width: 44, height: 26, background: sameQ ? C.ion : C.edge, padding: 3, transition: "background .2s" }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: 20,
                    height: 20,
                    background: C.void,
                    transform: sameQ ? "translateX(18px)" : "translateX(0)",
                    transition: "transform .2s cubic-bezier(.2,.8,.2,1)",
                  }}
                />
              </div>
            </div>
          </button>
        </Section>

        {!enough && (
          <div className="p-3 rounded-xl mb-4 text-xs" style={{ background: `${C.abort}18`, border: `1px solid ${C.abort}55`, color: C.abort }}>
            Only {pool.length} questions match those filters. Widen the categories or difficulty, or drop the question count.
          </div>
        )}

        <Btn full disabled={!enough} onClick={() => onStart({ players, difficulty, cats, count, timer, sameQ, pool })} style={{ padding: "16px", fontSize: 16 }}>
          <span className="flex items-center justify-center gap-2"><Play size={18} /> Launch</span>
        </Btn>
      </div>
    </div>
  );
}

function Handoff({ name, onReady, roundNum, totalRounds }) {
  const C = useC();
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 text-center max-w-sm">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: "0.22em", marginBottom: 20 }}>
          QUESTION {roundNum} OF {totalRounds}
        </div>
        <div
          className="mx-auto mb-6 flex items-center justify-center rounded-full"
          style={{ width: 88, height: 88, background: `linear-gradient(135deg, ${C.ion}22, ${C.plasma}33)`, border: `1px solid ${C.ion}55` }}
        >
          <Rocket size={38} style={{ color: C.ion, transform: "rotate(-45deg)" }} />
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.dim, letterSpacing: "0.2em" }}>
          PASS THE PHONE TO
        </div>
        <h1 className="my-3" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 38, color: C.star }}>
          {name}
        </h1>
        <p className="text-sm mb-8" style={{ color: C.dim }}>
          Tap when you've got it. The timer starts immediately.
        </p>
        <Btn full onClick={onReady} style={{ padding: "16px", fontSize: 16 }}>I'm ready</Btn>
      </div>
    </div>
  );
}

function Game({ config, mode, onFinish, onQuit }) {
  const C = useC();
  const { players, timer, sameQ, count } = config;
  const totalRounds = count;

  const [qIndex, setQIndex] = useState(0);
  const [pIndex, setPIndex] = useState(0);
  const [scores, setScores] = useState(() => players.map(() => 0));
  const [correctCounts, setCorrectCounts] = useState(() => players.map(() => 0));
  const [streaks, setStreaks] = useState(() => players.map(() => 0));
  const [bestStreaks, setBestStreaks] = useState(() => players.map(() => 0));
  const [phase, setPhase] = useState(players.length > 1 ? "handoff" : "asking");
  const [picked, setPicked] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timer);
  const [paused, setPaused] = useState(false);
  const [shake, setShake] = useState(false);
  const [zap, setZap] = useState(false);

  const deckRef = useRef(null);
  if (deckRef.current === null) {
    if (sameQ || players.length === 1) {
      const shared = shuffle(config.pool, mode === "daily" ? todaySeed() : undefined).slice(0, totalRounds);
      deckRef.current = players.map(() => shared);
    } else {
      const big = shuffle(config.pool);
      deckRef.current = players.map((_, i) => {
        const out = [];
        for (let r = 0; r < totalRounds; r++) out.push(big[(r * players.length + i) % big.length]);
        return out;
      });
    }
  }

  const question = deckRef.current[pIndex][qIndex];
  const shuffledOpts = React.useMemo(() => (question ? shuffle(question.o, question.q.length * 7 + qIndex) : []), [question, qIndex]);

  const lockIn = useCallback(
    (choice) => {
      if (picked !== null) return;
      const isRight = choice === question.a;
      setPicked(choice ?? "__timeout__");
      if (isRight) {
        setZap(true);
        setTimeout(() => setZap(false), 750);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 420);
      }
      const speedBonus = isRight ? Math.round(TIER_META[question.d].points * 0.5 * (timeLeft / timer)) : 0;
      const gain = isRight ? TIER_META[question.d].points + speedBonus : 0;

      setScores((s) => s.map((v, i) => (i === pIndex ? v + gain : v)));
      setCorrectCounts((s) => s.map((v, i) => (i === pIndex ? v + (isRight ? 1 : 0) : v)));
      setStreaks((s) => {
        const next = s.map((v, i) => (i === pIndex ? (isRight ? v + 1 : 0) : v));
        setBestStreaks((b) => b.map((v, i) => Math.max(v, next[i])));
        return next;
      });
      setPhase("revealed");
    },
    [picked, question, timeLeft, timer, pIndex]
  );

  useEffect(() => {
    if (phase !== "asking" || paused) return;
    if (timeLeft <= 0) {
      lockIn(null);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, paused, lockIn]);

  const advance = () => {
    const lastPlayer = pIndex === players.length - 1;
    const lastQuestion = qIndex === totalRounds - 1;
    if (lastPlayer && lastQuestion) {
      onFinish({ players, scores, correctCounts, bestStreaks, totalRounds });
      return;
    }
    setPicked(null);
    setTimeLeft(timer);
    if (lastPlayer) {
      setPIndex(0);
      setQIndex((v) => v + 1);
    } else {
      setPIndex((v) => v + 1);
    }
    setPhase(players.length > 1 ? "handoff" : "asking");
  };

  if (phase === "handoff") {
    return (
      <Handoff
        name={players[pIndex]}
        roundNum={qIndex + 1}
        totalRounds={totalRounds}
        onReady={() => {
          setTimeLeft(timer);
          setPhase("asking");
        }}
      />
    );
  }

  const tierColor = C[TIER_META[question.d].key];
  const answered = picked !== null;
  const timedOut = picked === "__timeout__";
  const gotIt = picked === question.a;
  const maxScore = totalRounds * 300 * 1.5;
  const progress = Math.min(1, scores[pIndex] / (maxScore * 0.6));

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 flex-1 flex flex-col max-w-md w-full mx-auto p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={onQuit} className="p-2 -ml-2 active:scale-90">
            <X size={20} style={{ color: C.dim }} />
          </button>
          <div className="text-center">
            <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 15, color: C.star }}>{players[pIndex]}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.16em" }}>
              {qIndex + 1} / {totalRounds}
              {streaks[pIndex] >= 2 && <span style={{ color: C.plasma }}> · {streaks[pIndex]}🔥</span>}
            </div>
          </div>
          <button onClick={() => setPaused((p) => !p)} className="p-2 -mr-2 active:scale-90" disabled={answered}>
            <Pause size={20} style={{ color: answered ? C.edge : paused ? C.ion : C.dim }} />
          </button>
        </div>

        <div className="rounded-full mb-6 overflow-hidden" style={{ height: 4, background: C.edge }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${(timeLeft / timer) * 100}%`,
              background: timeLeft / timer > 0.4 ? `linear-gradient(90deg, ${C.ion}, ${C.plasma})` : C.abort,
              transition: "width 1s linear, background .3s",
            }}
          />
        </div>

        <div className="flex gap-3 flex-1">
          <TrajectoryRail progress={progress} />

          <div className="flex-1 flex flex-col">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2 py-1 rounded-md"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    color: tierColor,
                    background: `${tierColor}18`,
                    border: `1px solid ${tierColor}44`,
                  }}
                >
                  {question.d.toUpperCase()}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.14em" }}>
                  {question.c.toUpperCase()}
                </span>
              </div>
              <h2 style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 20, lineHeight: 1.4, color: C.star, fontWeight: 500 }}>
                {question.q}
              </h2>
            </div>

            <div className="flex flex-col gap-2.5 mb-4">
              {shuffledOpts.map((opt) => {
                const isCorrect = opt === question.a;
                const isPicked = opt === picked;
                let bg = C.hull, border = C.edge, color = C.star, glow = "none";
                if (answered) {
                  if (isCorrect) {
                    bg = `${C.thrust}1E`; border = C.thrust; color = C.thrust;
                    glow = `0 0 26px ${C.thrust}55`;
                  } else if (isPicked) {
                    bg = `${C.abort}1E`; border = C.abort; color = C.abort;
                  } else {
                    color = C.dim
; bg = C.hull;
                  }
                }
                return (
                  <div key={opt} className="relative">
                    {isCorrect && <Lightning active={zap} />}
                    <button
                      onClick={() => lockIn(opt)}
                      disabled={answered || paused}
                      className="w-full p-4 rounded-xl text-left active:scale-95 relative"
                      style={{
                        background: bg,
                        border: `1px solid ${border}`,
                        color,
                        boxShadow: glow,
                        opacity: answered && !isCorrect && !isPicked ? 0.4 : 1,
                        transform: isPicked && !isCorrect && shake ? "translateX(6px)" : "none",
                        transition: "all .28s cubic-bezier(.2,.8,.2,1)",
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 15,
                        lineHeight: 1.4,
                        animation: isCorrect && zap ? "chargeup .6s ease-out" : "none",
                      }}
                    >
                      <span className="flex items-center gap-3">
                        {answered && isCorrect && <Check size={16} style={{ flexShrink: 0 }} />}
                        {answered && isPicked && !isCorrect && <X size={16} style={{ flexShrink: 0 }} />}
                        {opt}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {answered && (
              <div className="mt-auto">
                <div
                  className="p-4 rounded-xl mb-3 text-center"
                  style={{ background: gotIt ? `${C.thrust}12` : `${C.abort}12`, border: `1px solid ${gotIt ? C.thrust : C.abort}44` }}
                >
                  <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 18, color: gotIt ? C.thrust : C.abort }}>
                    {gotIt ? "Nailed it" : timedOut ? "Out of time" : "Not quite"}
                  </div>
                  {gotIt && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.star, marginTop: 4 }}>
                      +{TIER_META[question.d].points + Math.round(TIER_META[question.d].points * 0.5 * (timeLeft / timer))} pts
                    </div>
                  )}
                </div>
                <Btn full onClick={advance} style={{ padding: "15px", fontSize: 15 }}>
                  {pIndex === players.length - 1 && qIndex === totalRounds - 1
                    ? "See results"
                    : players.length > 1
                    ? "Next player"
                    : "Next question"}
                </Btn>
              </div>
            )}
          </div>
        </div>

        {paused && !answered && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-6" style={{ background: "#000000dd", backdropFilter: "blur(4px)" }}>
            <div className="text-center">
              <Pause size={44} style={{ color: C.ion, margin: "0 auto 16px" }} />
              <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 26, color: C.star }} className="mb-2">
                Paused
              </div>
              <div className="text-sm mb-6" style={{ color: C.dim }}>Timer's stopped. Nobody's cheating.</div>
              <Btn onClick={() => setPaused(false)}>Resume</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Results({ data, onHome, onAgain }) {
  const C = useC();
  const { players, scores, correctCounts, bestStreaks, totalRounds } = data;
  const ranked = players
    .map((name, i) => ({ name, score: scores[i], correct: correctCounts[i], streak: bestStreaks[i] }))
    .sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const solo = players.length === 1;

  const share = () => {
    const text = solo
      ? `I scored ${winner.score} on Orbit Trivia — ${winner.correct}/${totalRounds} on Tesla, SpaceX and Elon deep cuts. Think you can beat that? 🚀`
      : `${winner.name} just took the car with ${winner.score} points on Orbit Trivia 🚀 Tesla + SpaceX deep cuts. Who's beating that?`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="relative min-h-screen p-6" style={{ background: C.void }}>
      <Starfield />
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

/* ============================================================
   ROOT
   ============================================================ */
export default function OrbitTrivia() {
  const [themeId, setThemeId] = useState(null);
  const [booted, setBooted] = useState(false);
  const [screen, setScreen] = useState("home");
  const [pendingMode, setPendingMode] = useState(null);
  const [config, setConfig] = useState(null);
  const [mode, setMode] = useState("daily");
  const [results, setResults] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [stats, setStats] = useState({ best: 0, streak: 0, runs: 0 });
  const [dailyDone, setDailyDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await window.storage.get("orbit:theme");
        if (t?.value && THEMES[t.value]) setThemeId(t.value);
      } catch (e) { /* first visit — show the picker */ }
      try {
        const r = await window.storage.get("orbit:stats");
        if (r?.value) setStats(JSON.parse(r.value));
      } catch (e) { /* nothing saved yet */ }
      try {
        const d = await window.storage.get("orbit:daily");
        if (d?.value && JSON.parse(d.value).date === todayKey()) setDailyDone(true);
      } catch (e) { /* no daily record yet */ }
      setBooted(true);
    })();
  }, []);

  const pickTheme = async (id) => {
    setThemeId(id);
    try { await window.storage.set("orbit:theme", id); } catch (e) { /* not fatal */ }
  };

  const saveStats = async (next) => {
    setStats(next);
    try { await window.storage.set("orbit:stats", JSON.stringify(next)); } catch (e) { /* session only */ }
  };

  const afterDrivingCheck = () => {
    if (pendingMode === "daily") {
      setMode("daily");
      setConfig({ players: ["You"], timer: 20, sameQ: true, count: 10, pool: QUESTIONS, difficulty: "Mixed", cats: [] });
      setRunKey((k) => k + 1);
      setScreen("game");
    } else {
      setScreen("custom");
    }
  };

  const finish = async (data) => {
    setResults(data);
    setScreen("results");
    const topScore = Math.max(...data.scores);
    const topStreak = Math.max(...data.bestStreaks);
    await saveStats({
      best: Math.max(stats.best, topScore),
      streak: Math.max(stats.streak, topStreak),
      runs: stats.runs + 1,
    });
    if (mode === "daily") {
      setDailyDone(true);
      try { await window.storage.set("orbit:daily", JSON.stringify({ date: todayKey(), score: topScore })); } catch (e) { /* not fatal */ }
    }
  };

  const fonts = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500&display=swap');
      * { -webkit-tap-highlight-color: transparent; }
      button:focus-visible, input:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
      /* real strikes flicker — bright, stutter, re-strike, fade */
      @keyframes strike {
        0%   { opacity: 0; }
        6%   { opacity: 1; }
        14%  { opacity: .25; }
        22%  { opacity: 1; }
        38%  { opacity: .5; }
        48%  { opacity: 1; }
        70%  { opacity: .7; }
        100% { opacity: 0; }
      }
      @keyframes flash {
        0%   { transform: scale(.3); opacity: 0; }
        12%  { transform: scale(1);  opacity: .95; }
        30%  { transform: scale(1.1); opacity: .4; }
        45%  { transform: scale(1.2); opacity: .7; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      @keyframes chargeup {
        0%   { transform: scale(1); }
        35%  { transform: scale(1.035); }
        100% { transform: scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        * { transition-duration: .01ms !important; animation-duration: .01ms !important; }
      }
    `}</style>
  );

  if (!booted) {
    return (
      <div style={{ background: "#03040A", minHeight: "100vh" }}>
        {fonts}
      </div>
    );
  }

  if (!themeId) {
    return (
      <>
        {fonts}
        <PlanetPicker onPick={pickTheme} />
      </>
    );
  }

  const theme = THEMES[themeId];

  return (
    <ThemeCtx.Provider value={theme}>
      {fonts}
      <div style={{ background: theme.void, minHeight: "100vh", transition: "background .4s ease" }}>
        {screen === "home" && (
          <Home
            onDaily={() => { setPendingMode("daily"); setScreen("driving"); }}
            onCustom={() => { setPendingMode("custom"); setScreen("driving"); }}
            stats={stats}
            dailyDone={dailyDone}
            themeName={theme.name}
            onSwapTheme={() => pickTheme(themeId === "moon" ? "mars" : "moon")}
          />
        )}

        {screen === "driving" && (
          <>
            <Home onDaily={() => {}} onCustom={() => {}} stats={stats} dailyDone={dailyDone} themeName={theme.name} onSwapTheme={() => {}} />
            <DrivingCheck onConfirm={afterDrivingCheck} onCancel={() => setScreen("home")} />
          </>
        )}

        {screen === "custom" && (
          <CustomSetup
            onBack={() => setScreen("home")}
            onStart={(cfg) => { setMode("custom"); setConfig(cfg); setRunKey((k) => k + 1); setScreen("game"); }}
          />
        )}

        {screen === "game" && config && (
          <Game key={runKey} config={config} mode={mode} onFinish={finish} onQuit={() => setScreen("home")} />
        )}

        {screen === "results" && results && (
          <Results
            data={results}
            onHome={() => setScreen("home")}
            onAgain={() => { setRunKey((k) => k + 1); setScreen("game"); }}
          />
        )}
      </div>
    </ThemeCtx.Provider>
  );
}
