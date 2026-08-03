import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { Rocket, Play, Users, Trophy, X, Pause, ChevronRight, Check, Share2, Flame, Target, AlertTriangle, Repeat } from "lucide-react";

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
