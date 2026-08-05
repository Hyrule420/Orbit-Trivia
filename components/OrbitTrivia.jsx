import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { Rocket, Play, Users, Trophy, X, Pause, ChevronRight, Check, Share2, Share, Flame, Target, AlertTriangle, Repeat, User, Volume2, VolumeX } from "lucide-react";
import StarshipHero from "@/components/StarshipCatch";

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

const TESLA_MODELS = ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck", "Roadster", "Semi", "Cybercab", "Not yet"];

/* ============================================================
   QUESTION BANK
   ============================================================ */
const QUESTIONS = [
  { q: "In what year did Martin Eberhard and Marc Tarpenning found the company that became Tesla?", o: ["2001", "2003", "2004", "2006"], a: "2003", d: "Earthbound", c: "Tesla" },
  { q: "When did Elon Musk first invest in Tesla and join as Chairman of the Board?", o: ["2003", "2004", "2006", "2008"], a: "2004", d: "Earthbound", c: "Tesla" },
  { q: "What was the first production vehicle delivered by Tesla?", o: ["Model S", "Roadster", "Model 3", "Model X"], a: "Roadster", d: "Earthbound", c: "Tesla" },
  { q: "In what year did Tesla go public with its IPO on the Nasdaq?", o: ["2008", "2010", "2012", "2013"], a: "2010", d: "Earthbound", c: "Tesla" },
  { q: "What year did Tesla begin deliveries of the Model S?", o: ["2010", "2012", "2014", "2015"], a: "2012", d: "Earthbound", c: "Tesla" },
  { q: "In what year did Tesla begin shipping Autopilot hardware in its vehicles?", o: ["2012", "2014", "2016", "2018"], a: "2014", d: "Orbit", c: "FSD" },
  { q: "In October 2016, Tesla announced all new vehicles would ship with FSD-capable hardware. What sensor change came with it?", o: ["Removal of all cameras", "8 surround cameras for 360° visibility", "Reliance on LiDAR alone", "Ultrasonic sensors alone"], a: "8 surround cameras for 360° visibility", d: "Orbit", c: "FSD" },
  { q: "When did Tesla first release FSD Beta to a limited group of customers?", o: ["2018", "October 2020", "2022", "2024"], a: "October 2020", d: "Orbit", c: "FSD" },
  { q: "FSD version 12 marked a major architectural shift in 2023–2024. What was the primary change?", o: ["Addition of more LiDAR", "End-to-end neural network replacing most explicit C++ code", "Switch to radar-only", "Complete removal of cameras"], a: "End-to-end neural network replacing most explicit C++ code", d: "Martian", c: "FSD" },
  { q: "Where is Tesla's original vehicle factory located (formerly the NUMMI plant)?", o: ["Austin, Texas", "Fremont, California", "Reno, Nevada", "Shanghai"], a: "Fremont, California", d: "Earthbound", c: "Gigafactory" },
  { q: "When did Gigafactory Nevada begin major battery production operations?", o: ["2014", "2016", "2018", "2019"], a: "2016", d: "Orbit", c: "Gigafactory" },
  { q: "Which was Tesla's first Gigafactory outside the United States?", o: ["Berlin", "Shanghai", "Texas", "Mexico"], a: "Shanghai", d: "Earthbound", c: "Gigafactory" },
  { q: "In what year did both Gigafactory Berlin-Brandenburg and Gigafactory Texas begin vehicle production?", o: ["2020", "2021", "2022", "2023"], a: "2022", d: "Orbit", c: "Gigafactory" },
  { q: "SpaceX was founded in which year?", o: ["2001", "2002", "2004", "2006"], a: "2002", d: "Earthbound", c: "SpaceX" },
  { q: "What was the payload on the first Falcon Heavy test flight in February 2018?", o: ["A Starlink satellite", "Elon Musk's personal Tesla Roadster with Starman", "A Dragon capsule", "A weather satellite"], a: "Elon Musk's personal Tesla Roadster with Starman", d: "Earthbound", c: "SpaceX" },
  { q: "What is the primary long-term goal of the Starship program?", o: ["Replacing commercial airliners", "Making life multi-planetary", "Servicing the ISS", "Deploying weather satellites"], a: "Making life multi-planetary", d: "Earthbound", c: "Starship" },
  { q: "By mid-2026, how many integrated Starship flight tests had SpaceX conducted?", o: ["8", "13", "19", "25"], a: "13", d: "Martian", c: "Starship" },
  { q: "What major upper-stage capability did Starship flights in 2025–2026 demonstrate?", o: ["Permanent orbital station", "In-space Raptor engine relight and payload deployment", "Crewed lunar landing", "Interstellar travel"], a: "In-space Raptor engine relight and payload deployment", d: "Orbit", c: "Starship" },
  { q: "Neuralink was co-founded by Elon Musk in which year?", o: ["2014", "2016", "2018", "2020"], a: "2016", d: "Earthbound", c: "Neuralink" },
  { q: "When did Neuralink perform its first human implant?", o: ["2022", "January 2024", "2025", "2023"], a: "January 2024", d: "Orbit", c: "Neuralink" },
  { q: "How many ultra-thin flexible threads does the Neuralink N1 implant use to record brain activity?", o: ["16", "32", "64", "128"], a: "64", d: "Martian", c: "Neuralink" },
  { q: "What is the name of Neuralink's speech restoration clinical trial?", o: ["PRIME", "VOICE", "Blindsight", "CONVOY"], a: "VOICE", d: "Martian", c: "Neuralink" },
  { q: "In what year did Elon Musk complete the acquisition of Twitter?", o: ["2021", "2022", "2023", "2024"], a: "2022", d: "Earthbound", c: "Twitter/X" },
  { q: "What was the agreed purchase price for Twitter in 2022?", o: ["$30 billion", "$44 billion", "$60 billion", "$20 billion"], a: "$44 billion", d: "Earthbound", c: "Twitter/X" },
  { q: "What did Elon Musk rebrand Twitter as after the acquisition?", o: ["Twttr", "X", "MuskNet", "Starlink Social"], a: "X", d: "Earthbound", c: "Twitter/X" },
  { q: "In March 2025, Elon Musk's xAI acquired X in an all-stock deal. What entity then acquired xAI itself in early 2026?", o: ["Tesla", "SpaceX", "Neuralink", "The Boring Company"], a: "SpaceX", d: "Martian", c: "Twitter/X" },
  { q: "In what year did Elon Musk found his tunnel-construction company?", o: ["2014", "2016", "2019", "2021"], a: "2016", d: "Orbit", c: "Elon Personal" },
  { q: "xAI was founded by Elon Musk in which year?", o: ["2021", "2022", "2023", "2024"], a: "2023", d: "Earthbound", c: "Elon Personal" },
  { q: "Tesla unveiled which model in 2016 as its first vehicle targeting a $35,000 starting price?", o: ["Model S", "Model X", "Model 3", "Model Y"], a: "Model 3", d: "Earthbound", c: "Tesla" },
  { q: "Tesla's first quarterly profit as a public company was reported in which year?", o: ["2010", "2013", "2016", "2018"], a: "2013", d: "Orbit", c: "Tesla" },
  { q: "SpaceX's Starbase launch and production site is located in which U.S. state?", o: ["Florida", "Texas", "California", "New Mexico"], a: "Texas", d: "Earthbound", c: "SpaceX" },
  { q: "Gigafactory Shanghai reached 1 million vehicles produced in roughly how many years after opening?", o: ["Less than 3 years", "5 years", "7 years", "10 years"], a: "Less than 3 years", d: "Orbit", c: "Gigafactory" },
  { q: "By July 2026, Tesla had produced approximately how many total vehicles across its factories?", o: ["5 million", "10 million", "15 million", "2 million"], a: "10 million", d: "Martian", c: "Tesla" },
  { q: "Which hardware version introduced significantly higher resolution cameras and a more powerful computer for FSD?", o: ["HW1", "HW2", "HW3", "HW4 / AI4"], a: "HW4 / AI4", d: "Orbit", c: "FSD" },
  { q: "What is the name of Neuralink's implant system used in human trials?", o: ["Link", "N1", "Telepathy Chip", "Cortex"], a: "N1", d: "Orbit", c: "Neuralink" },
  { q: "In which U.S. state is Gigafactory Texas, and Tesla's current global headquarters, located?", o: ["California", "Nevada", "Texas", "New York"], a: "Texas", d: "Earthbound", c: "Gigafactory" },
  { q: "How does SpaceX recover the Super Heavy booster instead of using landing legs?", o: ["Parachute recovery at sea", "Caught by arms on the launch tower", "Runway landing like a plane", "It is not recovered"], a: "Caught by arms on the launch tower", d: "Orbit", c: "Starship" },
  { q: "What is the standard character limit for a post on X for non-subscribers?", o: ["140", "280", "500", "1,000"], a: "280", d: "Earthbound", c: "Twitter/X" },
  { q: "Which company did Tesla acquire in 2016 to expand into solar energy?", o: ["SolarCity", "SunPower", "First Solar", "Enphase"], a: "SolarCity", d: "Orbit", c: "Tesla" },
  { q: "What is the primary focus of Neuralink's Blindsight program?", o: ["Hearing restoration", "Vision restoration by stimulating the visual cortex", "Memory enhancement", "Mood regulation"], a: "Vision restoration by stimulating the visual cortex", d: "Martian", c: "Neuralink" },
  { q: "SpaceX's Starship is designed to be fully reusable. What does this primarily aim to achieve?", o: ["Higher launch costs", "Dramatically lower cost per kilogram to orbit", "Single-use only missions", "Exclusively military use"], a: "Dramatically lower cost per kilogram to orbit", d: "Earthbound", c: "Starship" },
  { q: "In which year did Tesla open its first Supercharger stations?", o: ["2010", "2012", "2015", "2018"], a: "2012", d: "Orbit", c: "Tesla" },
  { q: "What was the original name of the company before it was shortened to just Tesla?", o: ["Tesla Electric", "Tesla Motors", "Electric Cars Inc.", "Musk Motors"], a: "Tesla Motors", d: "Earthbound", c: "Tesla" },
  { q: "Which AI company did Elon Musk co-found in 2015 before later departing its board?", o: ["OpenAI", "DeepMind", "Anthropic", "xAI"], a: "OpenAI", d: "Orbit", c: "Elon Personal" },
  { q: "By mid-2026 reports, cumulative FSD (Supervised) miles driven exceeded approximately what level?", o: ["1 billion", "Several billion", "100 million", "500 million"], a: "Several billion", d: "Martian", c: "FSD" },
  { q: "What year did Cybertruck production and customer deliveries begin at Gigafactory Texas?", o: ["2021", "2022", "2023", "2024"], a: "2023", d: "Orbit", c: "Gigafactory" },
  { q: "Neuralink aims for high-volume production and more automated surgery starting in which year, per its late-2025 announcement?", o: ["2024", "2025", "2026", "2028"], a: "2026", d: "Martian", c: "Neuralink" },
  { q: "Which rocket launched the first commercial crewed mission to the ISS for NASA in 2020?", o: ["Falcon Heavy", "Falcon 9", "Starship", "Falcon 1"], a: "Falcon 9", d: "Orbit", c: "SpaceX" },
  { q: "In the March 2025 xAI–X deal, what was the approximate valuation assigned to X itself?", o: ["$80 billion", "Around $33 billion", "$44 billion", "$12 billion"], a: "Around $33 billion", d: "Martian", c: "Twitter/X" },
  { q: "Tesla's Model Y entered production at which factory first, in 2020?", o: ["Shanghai", "Fremont", "Berlin", "Texas"], a: "Fremont", d: "Orbit", c: "Tesla" },
  { q: "SpaceX's acquisition of xAI in February 2026 combined the companies into an entity with roughly what valuation, ahead of a planned IPO?", o: ["$80 billion", "$500 billion", "$1.25 trillion", "$250 billion"], a: "$1.25 trillion", d: "Martian", c: "Elon Personal" },
  { q: "In 2025, Tesla disclosed an investment in xAI as part of its Series E funding round. Approximately how much did Tesla invest?", o: ["$500 million", "$2 billion", "$10 billion", "$50 million"], a: "$2 billion", d: "Martian", c: "Elon Personal" },
  { q: "By June 2026, Neuralink had reached how many implanted patients, up from 21 confirmed earlier in the year?", o: ["23", "26", "30", "40"], a: "26", d: "Martian", c: "Neuralink" },
  { q: "What is the name of Tesla's humanoid robot program?", o: ["Optimus","Atlas","Ares","Cortex"], a: "Optimus", d: "Earthbound", c: "Elon Personal" },
  { q: "Which Tesla factory began converting part of its production line to build Optimus robots in 2026?", o: ["Fremont","Gigafactory Texas","Gigafactory Berlin","Gigafactory Shanghai"], a: "Fremont", d: "Earthbound", c: "Gigafactory" },
  { q: "What is Tesla's purpose-built robotaxi vehicle called?", o: ["Cybertruck","Cybercab","Model R","Roadtrip"], a: "Cybercab", d: "Earthbound", c: "Tesla" },
  { q: "The Cybercab was designed without which of the following?", o: ["A battery","A steering wheel and pedals","Doors","Wheels"], a: "A steering wheel and pedals", d: "Earthbound", c: "Tesla" },
  { q: "In which Texas city did Tesla first launch its Robotaxi ride-hailing service?", o: ["Dallas","Houston","Austin","San Antonio"], a: "Austin", d: "Earthbound", c: "Tesla" },
  { q: "What does FSD stand for?", o: ["Full Self-Driving","Fast Systems Design","Fleet Software Distribution","Final Safety Diagnostic"], a: "Full Self-Driving", d: "Earthbound", c: "FSD" },
  { q: "Neuralink's first human patient used the implant primarily to control what?", o: ["A computer cursor", "A wheelchair", "A prosthetic leg", "A hearing aid"], a: "A computer cursor", d: "Earthbound", c: "Neuralink" },
  { q: "Which company owns and operates the Starlink satellite internet network?", o: ["Tesla","SpaceX","xAI","The Boring Company"], a: "SpaceX", d: "Earthbound", c: "SpaceX" },
  { q: "What is the name of Elon Musk's tunnel-construction company?", o: ["The Boring Company","Tunnel Corp","Digger Inc.","Underland"], a: "The Boring Company", d: "Earthbound", c: "Elon Personal" },
  { q: "In which country was Elon Musk born?", o: ["South Africa", "Canada", "United States", "Australia"], a: "South Africa", d: "Earthbound", c: "Elon Personal" },
  { q: "What is the name of xAI's chatbot?", o: ["Grok","Ada","Nova","Echo"], a: "Grok", d: "Earthbound", c: "Elon Personal" },
  { q: "Which Tesla vehicle line ended production in 2026 after more than a decade on the market?", o: ["Model 3","Model Y","Model S and Model X","Cybertruck"], a: "Model S and Model X", d: "Earthbound", c: "Tesla" },
  { q: "Roughly how many unique parts does Tesla's Optimus robot have, according to Elon Musk?", o: ["About 1,000","About 10,000","About 100,000","About 500"], a: "About 10,000", d: "Orbit", c: "Elon Personal" },
  { q: "What long-term annual production capacity is Tesla designing its second Optimus line at Gigafactory Texas for?", o: ["100,000 robots","1 million robots","10 million robots","500,000 robots"], a: "10 million robots", d: "Orbit", c: "Gigafactory" },
  { q: "Which generation of Optimus is the first designed for mass production?", o: ["Gen 1","Gen 2","Gen 3","Gen 4"], a: "Gen 3", d: "Orbit", c: "Elon Personal" },
  { q: "Which Tesla model was the first built at Gigafactory Berlin-Brandenburg?", o: ["Model 3", "Model Y", "Model S", "Cybertruck"], a: "Model Y", d: "Orbit", c: "Tesla" },
  { q: "Which Florida city hosted Tesla's first Robotaxi service outside Texas and California?", o: ["Orlando","Tampa","Miami","Jacksonville"], a: "Miami", d: "Orbit", c: "Tesla" },
  { q: "What upcoming FSD architecture is planned to scale the driving model roughly tenfold in parameter count?", o: ["FSD v12","FSD v13","FSD v14","FSD v15"], a: "FSD v15", d: "Orbit", c: "FSD" },
  { q: "How many electrodes does the Neuralink N1 implant used in human trials have?", o: ["256","1,024","3,072","10,000"], a: "1,024", d: "Orbit", c: "Neuralink" },
  { q: "What surgical innovation is Neuralink using to help scale up the number of implant procedures it can perform?", o: ["A remote-controlled scalpel","A dedicated surgical robot","Fully manual surgery only","3D-printed skull plates"], a: "A dedicated surgical robot", d: "Orbit", c: "Neuralink" },
  { q: "Starship's 13th flight test in July 2026 achieved a first for which product line?", o: ["Deployment of next-generation Starlink V3 satellites","First crewed flight","First Mars flyby","First flight without Super Heavy"], a: "Deployment of next-generation Starlink V3 satellites", d: "Orbit", c: "Starship" },
  { q: "What nickname did SpaceX employees give Starship's 13th flight test?", o: ["Lucky 13","The Big One","Ironclad","Final Countdown"], a: "Lucky 13", d: "Orbit", c: "Starship" },
  { q: "Starship's 13th flight test splashed down in which ocean?", o: ["Atlantic Ocean","Pacific Ocean","Indian Ocean","Arctic Ocean"], a: "Indian Ocean", d: "Orbit", c: "Starship" },
  { q: "What generation of Super Heavy-Starship vehicle flew for the first time on Flight 12 in May 2026?", o: ["V1","V2","V3","V4"], a: "V3", d: "Orbit", c: "Starship" },
  { q: "What major corporate event did SpaceX complete shortly before Starship's 13th flight test in 2026?", o: ["A merger with Tesla","An initial public offering (IPO)","A bankruptcy filing","A move to a new headquarters"], a: "An initial public offering (IPO)", d: "Orbit", c: "SpaceX" },
  { q: "What is the diameter of the Neuralink N1 implant, roughly comparable to the size of a coin?", o: ["About 10 mm","About 23 mm","About 50 mm","About 5 mm"], a: "About 23 mm", d: "Orbit", c: "Neuralink" },
  { q: "What consumer-facing product name did Neuralink give its first brain-computer interface?", o: ["Telepathy", "Mindlink", "Synapse", "Cortex"], a: "Telepathy", d: "Orbit", c: "Neuralink" },
  { q: "What is the name of the surgical robot Neuralink built to insert its implant threads?", o: ["R1", "N1", "V1", "Mechazilla"], a: "R1", d: "Orbit", c: "Neuralink" },
  { q: "Roughly how many total vehicles had the Tesla Model S and Model X produced combined by the end of their run?", o: ["Around 100,000","Around 300,000","Over 600,000","Over 2 million"], a: "Over 600,000", d: "Orbit", c: "Tesla" },
  { q: "What price point has Tesla targeted for the Cybercab to sell under?", o: ["$20,000","$25,000","$30,000","$40,000"], a: "$30,000", d: "Orbit", c: "Tesla" },
  { q: "Where did the first production Cybercab roll off the assembly line in early 2026?", o: ["Fremont","Gigafactory Texas","Gigafactory Nevada","Gigafactory Berlin"], a: "Gigafactory Texas", d: "Orbit", c: "Gigafactory" },
  { q: "Elon Musk earned undergraduate degrees in physics and economics from which university?", o: ["Stanford", "University of Pennsylvania", "MIT", "Queen's University"], a: "University of Pennsylvania", d: "Orbit", c: "Elon Personal" },
  { q: "How many Raptor engines power the Super Heavy booster on a full Starship stack?", o: ["9","20","33","44"], a: "33", d: "Martian", c: "Starship" },
  { q: "What is the name of the launch tower system SpaceX uses to catch the Super Heavy booster during landing?", o: ["Mechazilla","Ironclad","Titan Arm","Catchframe"], a: "Mechazilla", d: "Martian", c: "Starship" },
  { q: "What key structural test did Starship's 12th flight perform on its rear flaps during reentry?", o: ["A cooling system test","An intentional stress test of structural limits","A repainting test","A camera calibration test"], a: "An intentional stress test of structural limits", d: "Martian", c: "Starship" },
  { q: "What raw material processing does Tesla now perform in Texas to support battery production, beyond cell assembly?", o: ["Cathode material production and lithium refining","Rubber tire manufacturing","Glass tempering only","Steel smelting"], a: "Cathode material production and lithium refining", d: "Martian", c: "Gigafactory" },
  { q: "Approximately how much operating cash flow did Tesla report for Q1 2026?", o: ["$1.2 billion","$3.9 billion","$8 billion","$500 million"], a: "$3.9 billion", d: "Martian", c: "Tesla" },
  { q: "What GAAP gross margin did Tesla report alongside its Q1 2026 operating cash flow figures?", o: ["9%","15%","21%","35%"], a: "21%", d: "Martian", c: "Tesla" },
  { q: "What new processor is Tesla developing to support Optimus and vehicle autonomy compute needs?", o: ["AI5","M4","Cortex Prime","Dojo 3"], a: "AI5", d: "Martian", c: "Elon Personal" },
  { q: "What is the approximate manufacturing cost Neuralink cited for its newer surgical robots, down from $10–20 million for earlier versions?", o: ["$50,000","$500,000","$2 million","$5 million"], a: "$500,000", d: "Martian", c: "Neuralink" },
  { q: "In which four countries had Neuralink's PRIME Study enrolled patients as of 2026?", o: ["US, Canada, UK, UAE","US, Germany, Japan, Australia","US, Mexico, Brazil, UK","US, China, India, UAE"], a: "US, Canada, UK, UAE", d: "Martian", c: "Neuralink" },
  { q: "How many patients were enrolled in Neuralink's GB PRIME study in Great Britain as of May 2026?", o: ["Two","Seven","Fifteen","Twenty"], a: "Seven", d: "Martian", c: "Neuralink" },
  { q: "What size battery capacity was Tesla targeting for Phase 1 of a training-data energy system tied to Optimus development, expected online in April 2026?", o: ["50 MW","100 MW","250 MW","500 MW"], a: "250 MW", d: "Martian", c: "Elon Personal" },
  { q: "Tesla's 4680 battery cell is named after its dimensions. What are they?", o: ["40mm x 68mm", "46mm x 80mm", "48mm x 60mm", "44mm x 68mm"], a: "46mm x 80mm", d: "Martian", c: "Tesla" },
  { q: "What cell type is Tesla increasing production of to support Cybercab and Tesla Semi ramps?", o: ["18650","2170","4680","21700-XL"], a: "4680", d: "Martian", c: "Gigafactory" },
  { q: "The tri-motor Tesla Model S Plaid produces approximately how much peak horsepower?", o: ["760 hp", "1,020 hp", "1,340 hp", "620 hp"], a: "1,020 hp", d: "Martian", c: "Tesla" },
  { q: "How many years was the Tesla Model S in production before the line ended in 2026?", o: ["8 years","11 years","14 years","18 years"], a: "14 years", d: "Martian", c: "Tesla" },
  { q: "How many years was the Tesla Model X in production before its line ended in 2026?", o: ["6 years","8 years","11 years","14 years"], a: "11 years", d: "Martian", c: "Tesla" },
  { q: "Tesla's first Florida Robotaxi service launched with a geofenced area of roughly what size?", o: ["1–3 sq mi", "10–14 sq mi", "50 sq mi", "100 sq mi"], a: "10–14 sq mi", d: "Martian", c: "Tesla" },
  { q: "What communications technology did Tesla integrate into Cybercab robotaxi vehicles, benefiting SpaceX as well?", o: ["Starlink connectivity","5G-only modems","Ham radio","Bluetooth mesh networking"], a: "Starlink connectivity", d: "Martian", c: "Tesla" },
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

/* Real vibration where the browser exposes it (mainly Android Chrome).
   iOS Safari has no Vibration API at all, so this silently no-ops there —
   callers pair it with a visual pulse so something always happens. */
const buzz = (pattern) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) { /* unsupported or blocked — the visual pulse still carries it */ }
};

/* ============================================================
   SOUND
   Every sound here is built from oscillators and noise at the
   moment it plays. Nothing is loaded, nothing is downloaded,
   and the whole kit costs a couple of kilobytes of code instead
   of a couple of megabytes of samples.

   Two things browsers force on us:
   - Audio cannot start until the player has touched the screen,
     so unlock() is wired to the first tap anywhere.
   - Everything must survive an audio system that refuses to
     start at all, hence the try/catch around the whole module.
   ============================================================ */
const SFX = (() => {
  let ctx = null;
  let bus = null;      // everything runs through a compressor so the big
  let enabled = true;  // liftoff roar can't clip against a stacked chord
  let tune = 1;        // Moon runs bright; Mars sits lower and warmer
  let noiseBuf = null;
  let engineSrc = null;
  let engineGain = null;
  let stuck = 0;

  const build = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 8;
    bus = ctx.createGain();
    bus.gain.value = 0.85;
    bus.connect(comp);
    comp.connect(ctx.destination);
    noiseBuf = null;   // buffers belong to the context that made them
    return true;
  };

  /* Tear it all down and start over. Some iOS builds park a context
     in a state it will never come back from, and the only reliable
     way out is a brand new one. */
  const rebuild = () => {
    try { if (ctx) ctx.close(); } catch (e) { /* already gone */ }
    ctx = null;
    bus = null;
    noiseBuf = null;
    engineSrc = null;
    engineGain = null;
    try { build(); } catch (e) { /* audio unavailable */ }
  };

  const live = () => {
    if (!enabled || typeof window === "undefined") return false;
    try {
      if (!ctx && !build()) return false;
      /* WebKit parks the context in "interrupted" — a state that isn't
         in the spec — whenever the app is backgrounded or the screen
         locks. Checking only for "suspended" meant audio never came
         back once that happened. Resume on anything that isn't running. */
      if (ctx.state !== "running") {
        ctx.resume().catch(() => {});
        stuck += 1;
        if (stuck > 3) { rebuild(); stuck = 0; }
        return false;
      }
      stuck = 0;
      return true;
    } catch (e) {
      return false;
    }
  };

  /* Brown-ish noise: white noise is thin and hissy, this leans low
     and reads as thrust rather than static. */
  const noise = () => {
    if (!noiseBuf) {
      const len = Math.floor(ctx.sampleRate * 2);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.023 * (Math.random() * 2 - 1)) / 1.023;
        d[i] = Math.max(-1, Math.min(1, last * 3.6));
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    return src;
  };

  /* exponentialRamp can never touch zero, so envelopes start and
     end at a value low enough to be inaudible instead. */
  const env = (g, t, peak, attack, dur) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  };

  const blip = (t, freq, peak, dur, type = "sine", glideTo) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq * tune, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo * tune, t + dur);
    env(g, t, peak, 0.006, dur);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  };

  const guard = (fn) => (...args) => {
    if (!live()) return;
    try { fn(ctx.currentTime, ...args); } catch (e) { /* never break the game over a sound */ }
  };

  return {
    unlock() { live(); },
    /* Called when the app comes back to the foreground. iOS may refuse
       to resume outside a gesture, but the next tap retries anyway. */
    revive() {
      if (!enabled || !ctx) { live(); return; }
      try { if (ctx.state !== "running") ctx.resume().catch(() => {}); } catch (e) { /* next tap will retry */ }
    },
    setEnabled(v) {
      enabled = !!v;
      if (!enabled) { try { this.engineOff(0.08); } catch (e) {} }
    },
    setTheme(id) { tune = id === "mars" ? 0.84 : 1; },

    /* soft tap under every button */
    ui: guard((t) => {
      blip(t, 520, 0.05, 0.045, "triangle", 380);
    }),

    /* answer locked in and correct — a rising confirm with an
       electric tail that matches the lightning on screen */
    correct: guard((t) => {
      [[523.25, 0], [783.99, 0.07], [1046.5, 0.14]].forEach(([f, d]) => blip(t + d, f, 0.14, 0.32));
      const n = noise();
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 1.8;
      bp.frequency.setValueAtTime(1700 * tune, t);
      bp.frequency.exponentialRampToValueAtTime(5400 * tune, t + 0.22);
      const g = ctx.createGain();
      env(g, t, 0.055, 0.005, 0.26);
      n.connect(bp); bp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + 0.32);
    }),

    /* wrong answer — a short descending buzz, not a punishment siren */
    wrong: guard((t, timedOut) => {
      const o = ctx.createOscillator();
      const lp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      const dur = timedOut ? 0.62 : 0.42;
      o.type = "sawtooth";
      o.frequency.setValueAtTime(228 * tune, t);
      o.frequency.exponentialRampToValueAtTime((timedOut ? 58 : 76) * tune, t + dur);
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(920, t);
      lp.frequency.exponentialRampToValueAtTime(210, t + dur);
      env(g, t, 0.15, 0.012, dur);
      o.connect(lp); lp.connect(g); g.connect(bus);
      o.start(t); o.stop(t + dur + 0.05);
    }),

    /* final three seconds — climbs in pitch as the clock closes */
    tick: guard((t, urgency = 0) => {
      blip(t, 690 + urgency * 145, 0.085, 0.06, "square");
    }),

    /* the 3-2-1 numbers, dropping a step each time */
    count: guard((t, n) => {
      const base = 190 + n * 46;
      blip(t, base, 0.3, 0.32, "sine", base * 0.52);
      blip(t, base * 4, 0.06, 0.04, "square");
    }),

    /* engines spooling up under the countdown */
    engineUp: guard((t, build = 2.6) => {
      if (engineSrc) return;
      const n = noise();
      const lp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(110, t);
      lp.frequency.linearRampToValueAtTime(430, t + build);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + build);
      n.connect(lp); lp.connect(g); g.connect(bus);
      n.start(t);
      engineSrc = n;
      engineGain = g;
    }),

    engineOff(fade = 0.35) {
      if (!engineSrc || !ctx) return;
      const src = engineSrc, g = engineGain;
      engineSrc = null;
      engineGain = null;
      try {
        const t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(Math.max(0.0002, g.gain.value), t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + fade);
        src.stop(t + fade + 0.05);
      } catch (e) { try { src.stop(); } catch (e2) {} }
    },

    /* the big one — full-stack roar with a sub-bass drop underneath */
    liftoff: guard((t, big = true) => {
      const dur = big ? 2.9 : 1.7;
      const n = noise();
      const lp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(190, t);
      lp.frequency.exponentialRampToValueAtTime(1500, t + 0.45);
      lp.frequency.exponentialRampToValueAtTime(280, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(big ? 0.4 : 0.28, t + 0.16);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(lp); lp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + dur + 0.1);
      blip(t, 74, big ? 0.44 : 0.3, dur * 0.72, "sine", 27);
    }),

    /* altitude milestone / streak milestone */
    promo: guard((t) => {
      [[659.25, 0], [880, 0.09], [1318.5, 0.18]].forEach(([f, d]) => blip(t + d, f, 0.12, 0.36, "triangle"));
    }),

    /* rocket passing through something */
    whoosh: guard((t) => {
      const n = noise();
      const bp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      bp.type = "bandpass";
      bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(320, t);
      bp.frequency.exponentialRampToValueAtTime(2600, t + 0.3);
      env(g, t, 0.16, 0.05, 0.38);
      n.connect(bp); bp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + 0.45);
    }),
  };
})();

/* Local-date key. Deliberately not toISOString(), which is UTC — that would
   roll the "day" over at a different moment than todaySeed() above, so a
   player could see tomorrow's questions while still marked done for today. */
const dayKeyOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayKey = () => dayKeyOf(new Date());
const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKeyOf(d);
};

/* A streak only counts if the last play was today or yesterday. Anything
   older is broken — reported as 0 without rewriting what's stored. */
const liveDayStreak = (s) => {
  if (!s || !s.lastDate) return 0;
  return s.lastDate === todayKey() || s.lastDate === yesterdayKey() ? s.current : 0;
};

const bumpDayStreak = (s) => {
  const today = todayKey();
  if (s.lastDate === today) return s;
  const current = s.lastDate === yesterdayKey() ? (s.current || 0) + 1 : 1;
  return { lastDate: today, current, best: Math.max(s.best || 0, current) };
};

const ALTITUDES = [{ at: 0 }, { at: 0.33 }, { at: 0.66 }, { at: 1 }];

/* ============================================================
   ESCAPE VELOCITY
   An endless run measured in real orbital physics. Every correct
   answer adds velocity, the multiplier climbs with the streak,
   and one wrong answer means gravity wins.

   The thresholds aren't invented: 7.8 km/s is low Earth orbit,
   11.2 is escape from Earth, 16.6 is escape from the Sun.
   ============================================================ */
const ESCAPE = {
  gain: { Earthbound: 0.5, Orbit: 0.7, Martian: 0.95 },  // km/s before multipliers
  multStep: 0.04,
  timerStart: 15,
  timerFloor: 7,
  timerDrop: 0.4,   // seconds shaved off the clock each question
  /* Every threshold is a real figure, which is what makes the
     climb mean something. Roughly: orbit around Q9, escape around
     Q12, and Earth's own orbital speed at about Q22 — a long way
     out for anyone who gets there. */
  marks: [
    { at: 7.8, label: "LOW EARTH ORBIT" },
    { at: 11.2, label: "ESCAPE VELOCITY", big: true },
    { at: 16.6, label: "SOLAR ESCAPE" },
    { at: 29.8, label: "EARTH'S ORBITAL SPEED" },
  ],
};

/* The clock tightens as you climb — 15 seconds at the pad, 7 by
   the time you're deep into Martian territory. */
const escapeTimer = (i) => Math.max(ESCAPE.timerFloor, Math.round(ESCAPE.timerStart - i * ESCAPE.timerDrop));

/* Questions get harder the higher you get: four Earthbound to
   start, eight Orbit through the middle, Martian from there on.
   Whatever's left over is appended so a freakishly long run can
   never run the deck dry. */
const buildEscapeDeck = () => {
  const tier = (t) => shuffle(QUESTIONS.filter((q) => q.d === t));
  const ladder = [...tier("Earthbound").slice(0, 4), ...tier("Orbit").slice(0, 8), ...tier("Martian")];
  const used = new Set(ladder);
  return [...ladder, ...shuffle(QUESTIONS.filter((q) => !used.has(q)))];
};

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
function Starfield({ comets = true }) {
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

  /* Long cycles with a brief visible window, so a comet crosses every
     17-31s rather than streaming past constantly. */
  const trails = [
    { top: "8%", dur: 17, delay: 3 },
    { top: "26%", dur: 23, delay: 11 },
    { top: "54%", dur: 31, delay: 19 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, background: C.star, opacity: s.o }}
        />
      ))}

      {comets &&
        trails.map((t, i) => (
          <div
            key={`c-${i}`}
            className="absolute"
            style={{
              top: t.top,
              left: "-16%",
              width: 130,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${C.star})`,
              borderRadius: 2,
              filter: `drop-shadow(0 0 6px ${C.ion})`,
              opacity: 0,
              animation: `comet ${t.dur}s linear ${t.delay}s infinite`,
            }}
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
      onClick={disabled ? undefined : (e) => { SFX.ui(); onClick && onClick(e); }}
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

function Logo({ size = 28, palette, rocketPhase = "idle", onRocketTap }) {
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

function TrajectoryRail({ progress, heat = 0 }) {
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
    const ny = fy + Math.sin(forkAngle) * fLen * t + Math.sin(perp) * jitter;
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
          Behind the wheel?
        </h2>
        <p className="text-center text-sm mb-6" style={{ color: C.dim, lineHeight: 1.6 }}>
          Let a passenger hold the phone and answer for you — you can still call out the answers.
        </p>
        <div className="flex flex-col gap-2">
          <Btn full onClick={onConfirm}>I'm a passenger — let's go</Btn>
          <Btn full variant="ghost" onClick={onCancel}>Maybe later</Btn>
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

/* Four jagged shards that together tile a card. Shared fracture edges,
   so when they separate the background shows through real gaps. */
const CARD_SHARDS = [
  { clip: "polygon(0% 0%, 48% 0%, 52% 20%, 46% 45%, 30% 40%, 14% 48%, 0% 44%)", x: "-14px", y: "-12px", r: "-3deg" },
  { clip: "polygon(48% 0%, 100% 0%, 100% 66%, 84% 70%, 68% 62%, 51% 70%, 46% 45%, 52% 20%)", x: "16px", y: "-9px", r: "2.5deg" },
  { clip: "polygon(0% 44%, 14% 48%, 30% 40%, 46% 45%, 51% 70%, 49% 100%, 0% 100%)", x: "-12px", y: "12px", r: "2deg" },
  { clip: "polygon(51% 70%, 68% 62%, 84% 70%, 100% 66%, 100% 100%, 49% 100%)", x: "14px", y: "11px", r: "-2.5deg" },
];

/* ============================================================
   ADD TO HOME SCREEN
   iOS never prompts on its own — the player has to be told the
   Share sheet exists. Android fires a real install event we can
   trigger from a button, so both paths are handled here.
   ============================================================ */
const isInstalled = () => {
  if (typeof window === "undefined") return false;
  return window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
};

/* Only Safari on iOS can add to the home screen. Chrome and
   Firefox on iOS can't, so showing them the instructions would
   just be wrong. iPads report themselves as Macs now, hence the
   touch-point check. */
const isIOSSafari = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const otherBrowser = /crios|fxios|edgios|opios|opr\//i.test(ua);
  return ios && !otherBrowser;
};

function InstallHint({ onDismiss, androidPrompt }) {
  const C = useC();
  return (
    <Panel className="p-4 mb-3" style={{ borderColor: `${C.ion}44`, background: `${C.ion}0A` }}>
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 34, height: 34, background: `${C.ion}18`, border: `1px solid ${C.ion}44` }}
        >
          <Rocket size={16} style={{ color: C.ion, transform: "rotate(-45deg)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 15, color: C.star }}>
            Keep it on your home screen
          </div>
          <div className="text-sm mt-1" style={{ color: C.dim, lineHeight: 1.5 }}>
            {androidPrompt ? (
              "Install it and it opens fullscreen, like any other app."
            ) : (
              <>
                Tap <Share size={13} style={{ display: "inline", verticalAlign: "-2px", color: C.ion }} /> below,
                then <span style={{ color: C.star }}>Add to Home Screen</span>. It opens fullscreen and your streak
                stops expiring.
              </>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {androidPrompt && (
              <Btn onClick={androidPrompt} style={{ padding: "8px 14px", fontSize: 13 }}>Install</Btn>
            )}
            <Btn variant="ghost" onClick={onDismiss} style={{ padding: "8px 14px", fontSize: 13 }}>
              {androidPrompt ? "Not now" : "Got it"}
            </Btn>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ============================================================
   HOME LAUNCH
   The ascent and the catch are driven by requestAnimationFrame,
   not by CSS keyframes, because a card has to break on the frame
   the nose actually crosses it — a fixed delay drifts on every
   different screen height. Everything tunable lives here.
   ============================================================ */
const LAUNCH = {
  ignitionMs: 850,     // hold-down before release
  ascentSec: 1.55,     // pad to out-of-frame
  hangMs: 1500,        // debris floating, rocket out of sight
  descentSec: 2.2,     // re-entry, retro-burn, catch
  exitFactor: 1.9,     // screen heights travelled before turnaround
  armsCloseAt: 0.68,   // fraction of the descent when the chopsticks move
  shatterSec: 1.0,     // one card coming apart
  weldSec: 0.95,       // one card welding back
  spread: 3.2,         // debris throw, x the shard's base offset
  spread2: 3.6,        // drift limit while floating
};

/* the shared fracture edges of CARD_SHARDS, as one path in a
   0..100 box — drawn over a broken card so the cracks can glow */
const CRACK_PATH =
  "M48 0 L52 20 L46 45 M0 44 L14 48 L30 40 L46 45 L51 70 L68 62 L84 70 L100 66 M51 70 L49 100";

/* Rendered INSIDE a shard, so the shard's clip-path cuts the path down to
   that piece's own broken edge — and the glow travels with the piece.
   Each side shows half a stroke; when the pieces meet, the halves make one
   full-brightness seam, which is what reads as a weld. */
function CardCracks({ welding }) {
  const C = useC();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 pointer-events-none"
      style={{
        width: "100%",
        height: "100%",
        animation: welding
          ? `weldSeam ${LAUNCH.weldSec}s ease-out both`
          : "edgeCool .35s ease-out both",
      }}
    >
      {/* outer bloom, then the hot core — both straddle the fracture line */}
      <path d={CRACK_PATH} fill="none" stroke={C.ion} strokeWidth={7} opacity={0.5}
            vectorEffect="non-scaling-stroke" style={{ filter: "blur(3px)" }} />
      <path d={CRACK_PATH} fill="none" stroke={C.star} strokeWidth={3} opacity={0.75}
            vectorEffect="non-scaling-stroke" style={{ filter: "blur(1px)" }} />
      <path d={CRACK_PATH} fill="none" stroke="#FFFFFF" strokeWidth={1.4}
            vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Home({ onDaily, onCustom, onEscape, escapeBest = 0, stats, dailyDone, onSwapTheme, themeName, profile, dayStreak, onOpenProfile, streakMilestone, onDismissMilestone, soundOn, onToggleSound, showInstall, onDismissInstall, androidPrompt }) {
  const C = useC();
  const named = (profile.name || "").trim();

  /* idle | ignition | ascent | hang | descent | weld */
  const [phase, setPhase] = useState("idle");
  const [hitCards, setHitCards] = useState([]);   // indices the rocket has struck
  const [arms, setArms] = useState("open");       // open | closing | clamped

  const rocketRef = useRef(null);
  const cardRefs = useRef([]);
  const rafRef = useRef(null);
  const timers = useRef([]);

  /* Live flight state for the artwork. A ref, not state, on purpose: the
     Starship's plume, plasma sheath and belly-flop all need the altitude
     every frame, and putting that in Home's state would re-render the
     mode cards sixty times a second mid-shatter. StarshipHero reads this
     from its own rAF instead. */
  const flightRef = useRef({ y: 0, alt: 0 });

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => stopAll, []);
  const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));

  const setRocket = (y, scale) => {
    if (rocketRef.current) rocketRef.current.style.transform = `translateY(${y}px) scale(${scale})`;
    /* normalised against one screen height, so "altitude" means the same
       thing on a phone and on a desktop */
    const H = typeof window !== "undefined" ? window.innerHeight : 800;
    flightRef.current.y = y;
    flightRef.current.alt = Math.min(1, -y / (H * 0.85));
  };

  const tapRocket = () => {
    if (phase !== "idle") return;
    stopAll();

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { SFX.ui(); buzz(20); return; }

    buzz([20, 30, 20, 40, 80]);
    SFX.engineUp(0.55);
    setPhase("ignition");
    at(LAUNCH.ignitionMs, ascend);
  };

  /* ---- climb: cards break on contact, not on a timer ---- */
  const ascend = () => {
    SFX.engineOff(0.08);
    SFX.liftoff(true);
    buzz([40, 30, 90]);
    setPhase("ascent");

    const H = typeof window !== "undefined" ? window.innerHeight : 800;
    const dist = LAUNCH.exitFactor * H;
    const T = LAUNCH.ascentSec;
    const accel = (2 * dist) / (T * T);           // constant-thrust climb

    const noseStart = rocketRef.current ? rocketRef.current.getBoundingClientRect().top : 0;
    /* the underside of each card, measured once — nothing reflows mid-launch */
    const edges = cardRefs.current.map((n) => (n ? n.getBoundingClientRect().bottom : -1));
    const struck = new Set();
    const t0 = performance.now();
    let lastHit = t0;

    const step = (now) => {
      const t = (now - t0) / 1000;
      const y = -0.5 * accel * t * t;
      setRocket(y, Math.max(0.6, 1 - -y / (dist * 2.4)));

      const nose = noseStart + y;
      edges.forEach((edge, i) => {
        if (edge >= 0 && !struck.has(i) && nose <= edge) {
          struck.add(i);
          lastHit = now;
          SFX.whoosh();
          buzz(28);
          setHitCards((h) => (h.includes(i) ? h : [...h, i]));
        }
      });

      if (t < T) rafRef.current = requestAnimationFrame(step);
      else {
        setRocket(-dist, 0.6);
        /* the last card hit is still coming apart — let it finish before the
           shards switch over to their floating loop, or it snaps mid-throw */
        const settle = Math.max(0, LAUNCH.shatterSec * 1000 - (performance.now() - lastHit));
        at(settle, () => {
          setPhase("hang");
          at(LAUNCH.hangMs, descend);
        });
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  /* ---- the catch: retro-burn to zero right at the arms ---- */
  const descend = () => {
    setPhase("descent");
    SFX.engineUp(0.4);
    setArms("open");

    const H = typeof window !== "undefined" ? window.innerHeight : 800;
    const dist = LAUNCH.exitFactor * H;
    const T = LAUNCH.descentSec;
    const t0 = performance.now();
    let armed = false;

    const step = (now) => {
      const t = Math.min((now - t0) / 1000, T);
      const k = t / T;
      /* (1-k)^2 lands with velocity zero — a suicide burn, not a drop */
      const y = -dist * (1 - k) * (1 - k);
      setRocket(y, 0.6 + 0.4 * k);

      if (!armed && k >= LAUNCH.armsCloseAt) {
        armed = true;
        setArms("closing");
        SFX.ui();
      }

      if (t < T) rafRef.current = requestAnimationFrame(step);
      else {
        setRocket(0, 1);
        SFX.engineOff(0.22);
        buzz([60, 40, 140]);
        setArms("clamped");
        setPhase("weld");                     // caught — now the cards come home
        at(LAUNCH.weldSec * 1000 + 260, () => {
          setPhase("idle");
          setHitCards([]);
          setArms("open");
          if (rocketRef.current) rocketRef.current.style.transform = "";
        });
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const launching = phase !== "idle";

  const milestoneLabel =
    streakMilestone === 7 ? "ONE WEEK STRONG" : streakMilestone === 30 ? "ONE MONTH STRONG" : streakMilestone === 100 ? "CENTURION" : null;
  return (
    <div className="relative min-h-screen p-6 flex flex-col" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 flex flex-col flex-1 max-w-md w-full mx-auto">
        <div className="pt-4 pb-4 flex items-center justify-between">
          <Logo size={32} />
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSound}
              aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
              className="flex items-center justify-center rounded-xl active:scale-90"
              style={{
                width: 36,
                height: 34,
                background: C.hullLight,
                border: `1px solid ${soundOn ? `${C.ion}55` : C.edge}`,
                transition: "transform .12s, border-color .2s",
              }}
            >
              {soundOn
                ? <Volume2 size={14} style={{ color: C.ion }} />
                : <VolumeX size={14} style={{ color: C.dim }} />}
            </button>
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
        </div>

        <div className="flex items-center gap-2 pb-6">
          <button
            onClick={onOpenProfile}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl active:scale-95"
            style={{ background: C.hullLight, border: `1px solid ${C.edge}`, transition: "transform .12s" }}
          >
            <User size={14} style={{ color: named ? C.ion : C.dim, flexShrink: 0 }} />
            <span
              className="truncate text-left"
              style={{
                fontFamily: "'Chakra Petch', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: named ? C.star : C.dim,
              }}
            >
              {named || "Set up your profile"}
            </span>
          </button>

          {dayStreak > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl flex-shrink-0"
              style={{ background: `${C.abort}14`, border: `1px solid ${C.abort}55` }}
            >
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: C.abort }}>
                {dayStreak}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.dim, letterSpacing: "0.12em" }}>
                {dayStreak === 1 ? "DAY" : "DAYS"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {[
            {
              key: "daily",
              onTap: onDaily,
              card: (
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
              ),
            },
            {
              key: "road",
              onTap: onCustom,
              card: (
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
              ),
            },
            {
              key: "escape",
              onTap: onEscape,
              card: (
                <Panel className="p-5" style={{ borderColor: `${C.abort}44` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame size={16} style={{ color: C.abort }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.abort, letterSpacing: "0.18em" }}>
                          {escapeBest > 0 ? `BEST ${escapeBest.toFixed(1)} KM/S` : "ONE MISS ENDS IT"}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 20, color: C.star }}>
                        Escape Velocity
                      </div>
                      <div className="text-sm mt-1" style={{ color: C.dim }}>
                        Keep answering, keep accelerating. Reach 11.2 km/s to break free.
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: C.dim, marginTop: 20 }} />
                  </div>
                </Panel>
              ),
            },
          ].map(({ key, onTap, card }, idx) => {
            const hit = hitCards.includes(idx);
            const welding = phase === "weld";
            return (
              <div key={key} className="relative" ref={(el) => { cardRefs.current[idx] = el; }}>
                {/* the real, tappable card — disappears the instant the nose reaches it */}
                <button
                  onClick={onTap}
                  tabIndex={launching ? -1 : 0}
                  aria-hidden={hit}
                  className="text-left active:scale-95 w-full block"
                  style={{
                    transition: "transform .12s",
                    /* an opacity-0 card is still tappable, so the pointer goes with it */
                    pointerEvents: launching ? "none" : "auto",
                    opacity: hit && !welding ? 0 : 1,
                    animation: hit && welding
                      ? `cardreturn .01s linear ${LAUNCH.weldSec * 0.8}s both`
                      : "none",
                  }}
                >
                  {card}
                </button>

                {/* the same card as four shards, thrown apart and welded back */}
                {hit &&
                  CARD_SHARDS.map((sh, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        clipPath: sh.clip,
                        WebkitClipPath: sh.clip,
                        willChange: "transform, opacity",
                        "--sx": sh.x,
                        "--sy": sh.y,
                        "--sr": sh.r,
                        "--spread": LAUNCH.spread,
                        "--spread2": LAUNCH.spread2,
                        animation: welding
                          ? `hardSnap ${LAUNCH.weldSec}s cubic-bezier(.25,.85,.35,1) both`
                          : phase === "ascent"
                          ? `extremeShatter ${LAUNCH.shatterSec}s cubic-bezier(.25,.7,.3,1) both`
                          : `zeroFloat 3.4s ease-in-out ${idx * 0.25}s infinite both`,
                      }}
                    >
                      {card}
                      <CardCracks welding={welding} />
                    </div>
                  ))}
              </div>
            );
          })}
        </div>

        {/* ---- Starship on the pad, and the tower that catches it ---- */}
        <div className="flex-1 flex items-end justify-center" style={{ minHeight: 248 }}>
          <StarshipHero
            C={C}
            phase={phase}
            arms={arms}
            shipRef={rocketRef}
            flightRef={flightRef}
            onTap={tapRocket}
          />
        </div>

        <div className="mt-auto pt-8">
          {showInstall && <InstallHint onDismiss={onDismissInstall} androidPrompt={androidPrompt} />}
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

      {milestoneLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "#000000dd", backdropFilter: "blur(4px)" }}>
          <Panel className="p-7 text-center" style={{ maxWidth: 340, borderColor: `${C.abort}66`, boxShadow: `0 0 60px ${C.abort}33` }}>
            <div style={{ fontSize: 44, animation: "chargeup .8s ease-out" }}>🔥</div>
            <div className="mt-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.abort, letterSpacing: "0.28em" }}>
              {streakMilestone} DAY STREAK
            </div>
            <div className="mt-2" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 28, color: C.star, textShadow: `0 0 26px ${C.abort}` }}>
              {milestoneLabel}
            </div>
            <p className="text-sm mt-3 mb-6" style={{ color: C.dim, lineHeight: 1.6 }}>
              {streakMilestone === 7
                ? "Seven daily challenges in a row. The launch cadence is real."
                : streakMilestone === 30
                ? "Thirty straight days. That's mission-critical consistency."
                : "One hundred consecutive days. Legendary."}
            </p>
            <Btn full onClick={onDismissMilestone}>Keep it going</Btn>
          </Panel>
        </div>
      )}
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

function ProfileScreen({ profile, onSave, onBack }) {
  const C = useC();
  const [name, setName] = useState(profile.name || "");
  const [handle, setHandle] = useState(profile.handle || "");
  const [model, setModel] = useState(profile.model || "");

  const field = {
    background: C.hullLight,
    border: `1px solid ${C.edge}`,
    color: C.star,
    fontFamily: "'Chakra Petch', sans-serif",
  };

  return (
    <div className="relative min-h-screen p-6" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 max-w-md mx-auto pb-8">
        <div className="flex items-center justify-between mb-6 pt-2">
          <h1 style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 24, color: C.star }}>
            Your profile
          </h1>
          <button onClick={onBack} className="active:scale-90" style={{ transition: "transform .12s" }}>
            <X size={22} style={{ color: C.dim }} />
          </button>
        </div>

        <p className="text-sm mb-6" style={{ color: C.dim, lineHeight: 1.6 }}>
          Saved on this device only. Nothing is uploaded anywhere yet.
        </p>

        <Section label="DISPLAY NAME">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={18}
            placeholder="What should we call you?"
            className="w-full px-3 py-3 rounded-xl text-sm outline-none"
            style={field}
          />
        </Section>

        <Section label="X USERNAME · OPTIONAL">
          <div className="flex items-center gap-2 px-3 rounded-xl" style={field}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: C.dim }}>@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/^@+/, ""))}
              maxLength={15}
              placeholder="yourhandle"
              className="flex-1 py-3 text-sm outline-none bg-transparent"
              style={{ color: C.star, fontFamily: "'Chakra Petch', sans-serif", border: "none" }}
            />
          </div>
        </Section>

        <Section label="WHAT DO YOU DRIVE?">
          <div className="flex flex-wrap gap-2">
            {TESLA_MODELS.map((m) => {
              const on = model === m;
              return (
                <button
                  key={m}
                  onClick={() => setModel(on ? "" : m)}
                  className="px-3 py-2 rounded-full text-xs active:scale-95"
                  style={{
                    background: on ? `${C.ion}22` : C.hullLight,
                    border: `1px solid ${on ? C.ion : C.edge}`,
                    color: on ? C.ion : C.dim,
                    fontFamily: "'Chakra Petch', sans-serif",
                    fontWeight: 600,
                    transition: "all .18s",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </Section>

        <Btn
          full
          onClick={() => onSave({ name: name.trim(), handle: handle.trim(), model })}
          style={{ padding: "16px", fontSize: 16 }}
        >
          Save profile
        </Btn>
      </div>
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

const FLAVOR_LINES = [
  "TELEMETRY NOMINAL",
  "FUEL AT CAPACITY",
  "GUIDANCE LOCKED",
  "WEATHER IS GO",
  "RANGE IS CLEAR",
  "PROPELLANT PRESSURIZED",
  "STRONGBACK RETRACTED",
  "FLIGHT COMPUTER ARMED",
  "TRAJECTORY PLOTTED",
];

/* 3-2-1 on the pad before the first question. Tap anywhere to skip —
   nobody wants to sit through this on their twentieth run. */
function CountdownLaunch({ onDone }) {
  const C = useC();
  const [n, setN] = useState(3);
  const flavorOffset = useRef(Math.floor(Math.random() * FLAVOR_LINES.length));

  useEffect(() => {
    const t = setTimeout(() => (n > 0 ? setN(n - 1) : onDone()), n > 0 ? 850 : 950);
    return () => clearTimeout(t);
  }, [n, onDone]);

  const lifting = n === 0;

  /* Engines spool up for the whole countdown, then hand off to the
     roar. Stopped on unmount too, so skipping past never leaves it
     humming under the first question. */
  useEffect(() => {
    SFX.engineUp(2.6);
    return () => SFX.engineOff(0.2);
  }, []);

  useEffect(() => {
    if (n > 0) SFX.count(n);
  }, [n]);

  useEffect(() => {
    if (lifting) {
      buzz([15, 40, 15, 40, 60]);
      SFX.engineOff(0.15);
      SFX.liftoff(true);
    }
  }, [lifting]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
      style={{ background: C.void }}
      onClick={onDone}
    >
      <Starfield comets={false} />

      {/* the number, or LIFTOFF */}
      <div className="relative z-10 text-center" style={{ marginBottom: "18vh" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: "0.32em" }}>
          {lifting ? "ALL SYSTEMS GO" : "LAUNCH SEQUENCE"}
        </div>
        <div
          key={n}
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontWeight: 700,
            fontSize: lifting ? 48 : 96,
            color: C.star,
            textShadow: `0 0 40px ${lifting ? C.abort : C.ion}`,
            lineHeight: 1.1,
            marginTop: 8,
            animation: lifting ? "verdictIn .5s cubic-bezier(.2,.8,.2,1) both" : "countBeat .85s ease-out both",
          }}
        >
          {lifting ? "LIFTOFF" : n}
        </div>
        {!lifting && (
          <div
            key={`f${n}`}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: C.ion,
              letterSpacing: "0.24em",
              marginTop: 12,
              animation: "verdictIn .4s ease-out .15s both",
            }}
          >
            {FLAVOR_LINES[(flavorOffset.current + n) % FLAVOR_LINES.length]}
          </div>
        )}
      </div>

      {/* rocket on the pad, engines building, then gone */}
      <div
        className="absolute"
        style={{
          left: "50%",
          bottom: "6vh",
          marginLeft: -26,
          animation: lifting ? "liftoff 1.1s cubic-bezier(.5,.02,.85,.4) both" : "none",
        }}
      >
        <div style={{ animation: "padshake .1s linear infinite" }}>
          <Rocket size={52} style={{ color: C.star, transform: "rotate(-45deg)", filter: `drop-shadow(0 0 20px ${C.ion})` }} />
          <div
            className="absolute"
            style={{
              left: "50%",
              top: 40,
              marginLeft: -14,
              width: 28,
              height: lifting ? 110 : 34 + (3 - n) * 16,
              background: `linear-gradient(180deg, #FFFFFF 0%, ${C.ion} 24%, ${C.abort} 58%, transparent 100%)`,
              filter: "blur(6px)",
              borderRadius: "50% 50% 50% 50% / 22% 22% 78% 78%",
              transition: "height .5s ease",
              animation: "plume .16s ease-in-out infinite alternate",
            }}
          />
        </div>
      </div>

      <div
        className="absolute inset-x-0 text-center"
        style={{ bottom: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.18em" }}
      >
        TAP TO SKIP
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
  const [phase, setPhase] = useState("countdown");
  const [picked, setPicked] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timer);
  const [paused, setPaused] = useState(false);
  const [shake, setShake] = useState(false);
  const [zap, setZap] = useState(false);
  const [promo, setPromo] = useState(null);
  const [gainInfo, setGainInfo] = useState(null);
  const [pulse, setPulse] = useState(null);

  /* Escape Velocity run state. Unused in the other two modes. */
  const isEscape = mode === "escape";
  const [velocity, setVelocity] = useState(0);
  const [mult, setMult] = useState(1);
  const [kmGain, setKmGain] = useState(null);
  const [escapeBig, setEscapeBig] = useState(null);
  const [dead, setDead] = useState(false);
  const escapeMarkRef = useRef(0);

  /* The clock is fixed in Daily and Road Trip, but tightens every
     question in an Escape run. */
  const liveTimer = isEscape ? escapeTimer(qIndex) : timer;

  const milestoneRef = useRef(null);
  if (milestoneRef.current === null) milestoneRef.current = players.map(() => 0);

  const wasWrongRef = useRef(null);
  if (wasWrongRef.current === null) wasWrongRef.current = players.map(() => false);

  const tickedRef = useRef(null);

  const deckRef = useRef(null);
  if (deckRef.current === null) {
    if (isEscape) {
      /* Already laddered by difficulty — shuffling here would undo it. */
      deckRef.current = [config.pool.slice(0, totalRounds)];
    } else if (sameQ || players.length === 1) {
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
      const timedOut = choice === null;
      setPicked(choice ?? "__timeout__");
      if (isRight) {
        setZap(true);
        setTimeout(() => setZap(false), 750);
        buzz(30);
        SFX.correct();
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 420);
        buzz(timedOut ? 90 : [25, 60, 25]);
        SFX.wrong(timedOut);
      }
      setPulse(isRight ? "good" : "bad");
      setTimeout(() => setPulse(null), 260);
      const speedBonus = isRight ? Math.round(TIER_META[question.d].points * 0.5 * (timeLeft / liveTimer)) : 0;
      const gain = isRight ? TIER_META[question.d].points + speedBonus : 0;
      const comeback = isRight && wasWrongRef.current[pIndex];
      wasWrongRef.current[pIndex] = !isRight;
      setGainInfo(isRight ? { base: TIER_META[question.d].points, bonus: speedBonus, comeback } : null);

      if (isEscape) {
        if (isRight) {
          /* Answering fast is worth up to half as much again. */
          const speed = 1 + 0.5 * (timeLeft / liveTimer);
          const add = ESCAPE.gain[question.d] * mult * speed;
          const nv = velocity + add;
          setVelocity(nv);
          setMult((m) => Math.round((m + ESCAPE.multStep) * 100) / 100);
          setKmGain({ km: add, mult, speed: Math.round((speed - 1) * 100) });
          for (const mk of ESCAPE.marks) {
            if (nv >= mk.at && escapeMarkRef.current < mk.at) {
              escapeMarkRef.current = mk.at;
              if (mk.big) {
                setEscapeBig(mk.label);   // breaking free earns the full launch
              } else {
                SFX.promo();
                setPromo(mk.label);
                setTimeout(() => setPromo(null), 1700);
              }
            }
          }
        } else {
          setDead(true);   // one wrong answer ends the run
        }
      }

      if (isRight && !isEscape) {
        const maxS = totalRounds * 300 * 1.5;
        const np = Math.min(1, (scores[pIndex] + gain) / (maxS * 0.6));
        const marks = [[0.33, "ORBIT REACHED"], [0.66, "MARTIAN REACHED"], [1, "ESCAPE VELOCITY"]];
        for (const [at, label] of marks) {
          if (np >= at && milestoneRef.current[pIndex] < at) {
            milestoneRef.current[pIndex] = at;
            SFX.promo();
            setPromo(label);
            setTimeout(() => setPromo(null), 1700);
          }
        }
      }

      setScores((s) => s.map((v, i) => (i === pIndex ? v + gain : v)));
      setCorrectCounts((s) => s.map((v, i) => (i === pIndex ? v + (isRight ? 1 : 0) : v)));
      setStreaks((s) => {
        const next = s.map((v, i) => (i === pIndex ? (isRight ? v + 1 : 0) : v));
        setBestStreaks((b) => b.map((v, i) => Math.max(v, next[i])));
        return next;
      });
      setPhase("revealed");
    },
    [picked, question, timeLeft, liveTimer, pIndex, isEscape, mult, velocity]
  );

  useEffect(() => {
    if (phase !== "asking" || paused) return;
    if (timeLeft <= 0) {
      lockIn(null);
      return;
    }
    /* One tick per second in the last three. The ref stops a pause
       or a re-render from firing the same second twice. */
    if (timeLeft <= 3 && tickedRef.current !== timeLeft) {
      tickedRef.current = timeLeft;
      SFX.tick(3 - timeLeft);
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, paused, lockIn]);

  const advance = () => {
    if (isEscape) {
      if (dead || qIndex === totalRounds - 1) {
        onFinish({
          players,
          scores,
          correctCounts,
          bestStreaks,
          totalRounds: qIndex + 1,
          escape: true,
          velocity,
          cleared: correctCounts[0],
          peakMult: mult,
          escaped: velocity >= 11.2,
        });
        return;
      }
      setPicked(null);
      setGainInfo(null);
      setKmGain(null);
      setTimeLeft(escapeTimer(qIndex + 1));
      tickedRef.current = null;
      setQIndex((v) => v + 1);
      setPhase("asking");
      return;
    }

    const lastPlayer = pIndex === players.length - 1;
    const lastQuestion = qIndex === totalRounds - 1;
    if (lastPlayer && lastQuestion) {
      onFinish({ players, scores, correctCounts, bestStreaks, totalRounds });
      return;
    }
    setPicked(null);
    setGainInfo(null);
    setTimeLeft(timer);
    tickedRef.current = null;
    if (lastPlayer) {
      setPIndex(0);
      setQIndex((v) => v + 1);
    } else {
      setPIndex((v) => v + 1);
    }
    setPhase(players.length > 1 ? "handoff" : "asking");
  };

  if (phase === "countdown") {
    return (
      <CountdownLaunch
        onDone={() => {
          setTimeLeft(isEscape ? escapeTimer(0) : timer);
          tickedRef.current = null;
          setPhase(players.length > 1 ? "handoff" : "asking");
        }}
      />
    );
  }

  if (phase === "handoff") {
    return (
      <Handoff
        name={players[pIndex]}
        roundNum={qIndex + 1}
        totalRounds={totalRounds}
        onReady={() => {
          setTimeLeft(isEscape ? escapeTimer(0) : timer);
          tickedRef.current = null;
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
  const progress = isEscape
    ? Math.min(1, velocity / 11.2)
    : Math.min(1, scores[pIndex] / (maxScore * 0.6));

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: C.void }}>
      <Starfield comets={false} />
      {escapeBig && (
        <LaunchCelebration
          kicker="11.2 KM/S — YOU'RE FREE"
          title="ESCAPE VELOCITY"
          onDone={() => setEscapeBig(null)}
        />
      )}
      <div
        className="relative z-10 flex-1 flex flex-col max-w-md w-full mx-auto p-5"
        style={{ animation: shake ? "screenshake .4s ease-out" : "none" }}
      >
        {pulse && (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: 40,
              boxShadow: `inset 0 0 60px ${pulse === "good" ? C.thrust : C.abort}`,
              animation: "edgepulse .26s ease-out both",
            }}
          />
        )}
        {promo && (
          <div className="absolute inset-x-0 z-30 text-center pointer-events-none" style={{ top: "36%" }}>
            <div style={{ animation: "promoPop 1.7s ease-out both" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.ion, letterSpacing: "0.3em" }}>
                {isEscape ? "VELOCITY MILESTONE" : "ALTITUDE MILESTONE"}
              </div>
              <div
                style={{
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontWeight: 700,
                  fontSize: 30,
                  color: C.star,
                  textShadow: `0 0 28px ${C.ion}`,
                  marginTop: 4,
                }}
              >
                {promo}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-5">
          <button onClick={onQuit} className="p-2 -ml-2 active:scale-90">
            <X size={20} style={{ color: C.dim }} />
          </button>
          <div className="text-center">
            {isEscape ? (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 19, color: velocity >= 11.2 ? C.thrust : C.star, textShadow: velocity >= 11.2 ? `0 0 16px ${C.thrust}` : "none", lineHeight: 1.1 }}>
                  {velocity.toFixed(1)}
                  <span style={{ fontSize: 10, color: C.dim, marginLeft: 3, letterSpacing: "0.1em" }}>KM/S</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.14em", marginTop: 2 }}>
                  <span style={{ color: mult >= 2 ? C.plasma : C.dim }}>×{mult.toFixed(2)}</span>
                  {" · "}{correctCounts[0]} CLEARED
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 15, color: C.star }}>{players[pIndex]}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.16em" }}>
                  {qIndex + 1} / {totalRounds}
                  {streaks[pIndex] >= 2 && (
                    <span style={{ color: streaks[pIndex] >= 6 ? C.abort : C.plasma }}>
                      {" · "}{streaks[pIndex]}
                      {"🔥".repeat(Math.min(3, Math.floor(streaks[pIndex] / 2)))}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <button onClick={() => setPaused((p) => !p)} className="p-2 -mr-2 active:scale-90" disabled={answered}>
            <Pause size={20} style={{ color: answered ? C.edge : paused ? C.ion : C.dim }} />
          </button>
        </div>

        <div className="rounded-full mb-2 overflow-hidden" style={{ height: 4, background: C.edge }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${(timeLeft / liveTimer) * 100}%`,
              background: timeLeft / liveTimer > 0.4 ? `linear-gradient(90deg, ${C.ion}, ${C.plasma})` : C.abort,
              transition: "width 1s linear, background .3s",
              animation: !answered && timeLeft <= 3 ? "urgent .6s ease-in-out infinite" : "none",
            }}
          />
        </div>

        {/* close-call countdown — fixed height so the layout never jumps */}
        <div className="text-center mb-3" style={{ height: 28 }}>
          {!answered && timeLeft <= 3 && timeLeft > 0 && (
            <span
              key={timeLeft}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 25,
                fontWeight: 700,
                color: C.abort,
                display: "inline-block",
                textShadow: `0 0 16px ${C.abort}`,
                animation: "countIn .5s cubic-bezier(.2,.8,.2,1) both",
              }}
            >
              {timeLeft}
            </span>
          )}
        </div>

        <div className="flex gap-3 flex-1">
          <TrajectoryRail progress={progress} heat={streaks[pIndex]} />

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
                    color = C.dim; bg = C.hull;
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
                  className="p-4 rounded-xl mb-3 text-center relative"
                  style={{ background: gotIt ? `${C.thrust}12` : `${C.abort}12`, border: `1px solid ${gotIt ? C.thrust : C.abort}44` }}
                >
                  <div
                    style={{
                      fontFamily: "'Chakra Petch', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: gotIt ? (gainInfo?.comeback ? C.plasma : C.thrust) : C.abort,
                      textShadow: gotIt && gainInfo?.comeback ? `0 0 18px ${C.plasma}` : "none",
                    }}
                  >
                    {gotIt
                      ? isEscape
                        ? "Still climbing"
                        : gainInfo?.comeback
                        ? "Back in it"
                        : "Nailed it"
                      : isEscape
                      ? "Gravity wins"
                      : timedOut
                      ? "Out of time"
                      : "Not quite"}
                  </div>
                  {isEscape && gotIt && kmGain && (
                    <>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.star, marginTop: 4 }}>
                        +{kmGain.km.toFixed(2)} km/s
                        <span style={{ color: C.dim }}>{"  ×"}{kmGain.mult.toFixed(2)}</span>
                      </div>
                      {kmGain.speed > 0 && (
                        <div
                          className="absolute inset-x-0 pointer-events-none"
                          style={{ top: 6, animation: "speedFloat 1.5s cubic-bezier(.2,.8,.2,1) both" }}
                        >
                          <span
                            className="px-2 py-1 rounded-md"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              color: C.ion,
                              background: `${C.ion}1A`,
                              border: `1px solid ${C.ion}66`,
                              textShadow: `0 0 12px ${C.ion}`,
                            }}
                          >
                            +{kmGain.speed}% SPEED
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {isEscape && !gotIt && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.dim, marginTop: 4 }}>
                      {timedOut ? "The clock ran out." : "Correct answer above."}
                    </div>
                  )}
                  {gotIt && !isEscape && gainInfo && (
                    <>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.star, marginTop: 4 }}>
                        +{gainInfo.base + gainInfo.bonus} pts
                      </div>
                      {gainInfo.bonus > 0 && (
                        <div
                          className="absolute inset-x-0 pointer-events-none"
                          style={{ top: 6, animation: "speedFloat 1.5s cubic-bezier(.2,.8,.2,1) both" }}
                        >
                          <span
                            className="px-2 py-1 rounded-md"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              color: C.ion,
                              background: `${C.ion}1A`,
                              border: `1px solid ${C.ion}66`,
                              textShadow: `0 0 12px ${C.ion}`,
                            }}
                          >
                            +{gainInfo.bonus} SPEED
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <Btn full onClick={advance} style={{ padding: "15px", fontSize: 15 }}>
                  {isEscape
                    ? dead
                      ? "See how far you got"
                      : "Keep climbing"
                    : pIndex === players.length - 1 && qIndex === totalRounds - 1
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

/* Full-screen liftoff for a perfect round. Plays once, then clears itself.
   Real launches don't just slide upward — the vehicle shudders on the pad,
   then accelerates away while smoke hangs where it stood. */
function LaunchCelebration({ onDone, small = false, kicker = "FLAWLESS RUN", title = "PERFECT" }) {
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

function EscapeResults({ data, profile = {}, prevBest, onHome, onAgain }) {
  const C = useC();
  const { velocity, cleared, peakMult, escaped } = data;
  const [celebrating, setCelebrating] = useState(escaped);
  const newBest = (prevBest || 0) > 0 && velocity > prevBest;

  /* Where you ended up, in plain terms. */
  const verdict = velocity >= 29.8
    ? { label: "OUTRAN THE PLANET", note: "Faster than Earth's own trip around the Sun.", color: C.plasma }
    : velocity >= 16.6
    ? { label: "SOLAR ESCAPE", note: "Fast enough to leave the Sun's grip entirely.", color: C.plasma }
    : escaped
    ? { label: "BROKE FREE", note: "Past 11.2 km/s — Earth couldn't hold you.", color: C.thrust }
    : velocity >= 7.8
    ? { label: "IN ORBIT", note: "Fast enough to circle, not enough to leave.", color: C.ion }
    : { label: "FELL BACK", note: "Gravity got you before orbit.", color: C.abort };

  const share = () => {
    const ride = profile.model && profile.model !== "Not yet" ? ` ${profile.model} owner here.` : "";
    const text = escaped
      ? `Hit ${velocity.toFixed(1)} km/s on Orbit Trivia's Escape Velocity run and broke free of Earth — ${cleared} questions deep before gravity won.${ride} Escape velocity is 11.2 km/s. Beat it. 🚀`
      : `Got to ${velocity.toFixed(1)} km/s on Orbit Trivia's Escape Velocity run — ${cleared} questions deep. Need 11.2 km/s to break free of Earth.${ride} 🚀`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="relative min-h-screen p-6" style={{ background: C.void }}>
      <Starfield />
      {celebrating && (
        <LaunchCelebration kicker="ESCAPE VELOCITY" title={`${velocity.toFixed(1)} KM/S`} onDone={() => setCelebrating(false)} />
      )}
      <div className="relative z-10 max-w-md mx-auto">
        <div className="text-center pt-10 pb-8">
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: "0.22em" }}>
            FINAL VELOCITY
          </div>
          <h1
            className="mt-1"
            style={{
              fontFamily: "'Chakra Petch', sans-serif",
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 1.05,
              color: C.star,
              textShadow: `0 0 40px ${verdict.color}`,
            }}
          >
            {velocity.toFixed(1)}
            <span style={{ fontSize: 20, color: C.dim, marginLeft: 6 }}>km/s</span>
          </h1>
          <div
            className="inline-block mt-3 px-3 py-1.5 rounded-full"
            style={{
              background: `${verdict.color}14`,
              border: `1px solid ${verdict.color}66`,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: verdict.color,
            }}
          >
            {verdict.label}
          </div>
          <p className="text-sm mt-3" style={{ color: C.dim }}>{verdict.note}</p>
          {newBest && (
            <div
              className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full"
              style={{
                background: `${C.thrust}14`,
                border: `1px solid ${C.thrust}66`,
                boxShadow: `0 0 24px ${C.thrust}33`,
                animation: "verdictIn .6s cubic-bezier(.2,.8,.2,1) .4s both",
              }}
            >
              <Trophy size={13} style={{ color: C.thrust }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: C.thrust, letterSpacing: "0.16em" }}>
                NEW PERSONAL BEST
              </span>
            </div>
          )}
        </div>

        {/* how far along the climb you got */}
        <Panel className="p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.16em" }}>
              PAD
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: escaped ? C.thrust : C.dim, letterSpacing: "0.16em" }}>
              11.2 — ESCAPE
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: C.edge }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (velocity / 11.2) * 100)}%`,
                background: escaped ? C.thrust : `linear-gradient(90deg, ${C.ion}, ${C.plasma})`,
                boxShadow: escaped ? `0 0 16px ${C.thrust}` : "none",
                transition: "width 1s cubic-bezier(.2,.8,.2,1)",
              }}
            />
          </div>
        </Panel>

        <Panel className="p-4 mb-6">
          <div className="flex items-center justify-around">
            <Stat icon={<Check size={14} />} label="CLEARED" value={cleared} color={C.thrust} />
            <div style={{ width: 1, height: 32, background: C.edge }} />
            <Stat icon={<Flame size={14} />} label="PEAK MULT" value={`×${peakMult.toFixed(2)}`} color={C.plasma} />
            <div style={{ width: 1, height: 32, background: C.edge }} />
            <Stat icon={<Trophy size={14} />} label="BEST" value={Math.max(prevBest || 0, velocity).toFixed(1)} color={C.ion} />
          </div>
        </Panel>

        <div className="flex flex-col gap-2 pb-8">
          <Btn full onClick={share} style={{ padding: "15px", fontSize: 15 }}>
            <span className="flex items-center justify-center gap-2"><Share2 size={17} /> Share to X</span>
          </Btn>
          <Btn full variant="solid" onClick={onAgain}>Launch again</Btn>
          <Btn full variant="ghost" onClick={onHome}>Back to launchpad</Btn>
        </div>
      </div>
    </div>
  );
}

function Results({ data, onHome, onAgain, profile = {} }) {
  const C = useC();
  const { players, scores, correctCounts, bestStreaks, totalRounds } = data;
  const ranked = players
    .map((name, i) => ({ name, score: scores[i], correct: correctCounts[i], streak: bestStreaks[i] }))
    .sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const solo = players.length === 1;
  const perfect = winner.correct === totalRounds && totalRounds >= 5;
  const winnerLaunch = !perfect && !solo;
  const [celebrating, setCelebrating] = useState(perfect || winnerLaunch);
  const newBest = solo && (data.prevBest || 0) > 0 && winner.score > data.prevBest;

  const share = () => {
    const ride = profile.model && profile.model !== "Not yet" ? ` ${profile.model} owner here.` : "";
    const text = solo
      ? `I scored ${winner.score} on Orbit Trivia — ${winner.correct}/${totalRounds} on Tesla, SpaceX and Elon deep cuts.${ride} Think you can beat that? 🚀`
      : `${winner.name} just took the car with ${winner.score} points on Orbit Trivia 🚀 Tesla + SpaceX deep cuts. Who's beating that?`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="relative min-h-screen p-6" style={{ background: C.void }}>
      <Starfield />
      {celebrating && (
        <LaunchCelebration
          small={!perfect}
          kicker={perfect ? "FLAWLESS RUN" : "ROAD TRIP CHAMPION"}
          title={perfect ? "PERFECT" : winner.name.toUpperCase()}
          onDone={() => setCelebrating(false)}
        />
      )}
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
          {newBest && (
            <div
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full"
              style={{
                background: `${C.thrust}14`,
                border: `1px solid ${C.thrust}66`,
                boxShadow: `0 0 24px ${C.thrust}33`,
                animation: "verdictIn .6s cubic-bezier(.2,.8,.2,1) .4s both",
              }}
            >
              <Trophy size={13} style={{ color: C.thrust }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: C.thrust, letterSpacing: "0.16em" }}>
                NEW PERSONAL BEST
              </span>
            </div>
          )}
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
  const [profile, setProfile] = useState({ name: "", handle: "", model: "" });
  const [dayStreakData, setDayStreakData] = useState({ lastDate: null, current: 0, best: 0 });
  const [streakMilestone, setStreakMilestone] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [escapeBest, setEscapeBest] = useState(0);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [androidEvt, setAndroidEvt] = useState(null);

  /* Android and desktop Chrome fire this when the site qualifies as
     installable. Holding onto it lets a real Install button work. */
  useEffect(() => {
    const grab = (e) => { e.preventDefault(); setAndroidEvt(e); };
    window.addEventListener("beforeinstallprompt", grab);
    const done = () => setAndroidEvt(null);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", grab);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  /* The hint waits until someone has finished a run. Asking a
     first-time visitor to install something they haven't played
     yet is how you get it dismissed forever. */
  const showInstall =
    !installDismissed && !isInstalled() && stats.runs >= 1 && (androidEvt !== null || isIOSSafari());

  const dismissInstall = async () => {
    setInstallDismissed(true);
    try { await window.storage.set("orbit:installhint", "off"); } catch (e) { /* session only */ }
  };

  const runAndroidInstall = androidEvt
    ? async () => {
        try {
          androidEvt.prompt();
          await androidEvt.userChoice;
        } catch (e) { /* dismissed */ }
        setAndroidEvt(null);
        dismissInstall();
      }
    : null;

  /* Browsers refuse to start audio until the player has touched the
     screen at least once. This listens for that first touch anywhere
     and opens the audio system inside it, so nothing is swallowed. */
  useEffect(() => {
    const open = () => SFX.unlock();
    window.addEventListener("pointerdown", open);
    window.addEventListener("touchstart", open);
    /* Coming back from the home screen, a phone call, or a locked
       screen leaves audio interrupted — try to bring it back rather
       than waiting for the player to notice it's gone. */
    const wake = () => { if (!document.hidden) SFX.revive(); };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("pageshow", wake);
    window.addEventListener("focus", wake);
    return () => {
      window.removeEventListener("pointerdown", open);
      window.removeEventListener("touchstart", open);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pageshow", wake);
      window.removeEventListener("focus", wake);
    };
  }, []);

  useEffect(() => { SFX.setEnabled(soundOn); }, [soundOn]);
  useEffect(() => { if (themeId) SFX.setTheme(themeId); }, [themeId]);

  useEffect(() => {
    (async () => {
      try {
        const s = await window.storage.get("orbit:sound");
        if (s?.value === "off") setSoundOn(false);
      } catch (e) { /* default is on */ }
      /* The saved theme is deliberately NOT restored here. Every fresh
         launch starts on the Moon/Mars picker, even for returning players. */
      try {
        const r = await window.storage.get("orbit:stats");
        if (r?.value) setStats(JSON.parse(r.value));
      } catch (e) { /* nothing saved yet */ }
      try {
        const d = await window.storage.get("orbit:daily");
        if (d?.value && JSON.parse(d.value).date === todayKey()) setDailyDone(true);
      } catch (e) { /* no daily record yet */ }
      try {
        const p = await window.storage.get("orbit:profile");
        if (p?.value) setProfile({ name: "", handle: "", model: "", ...JSON.parse(p.value) });
      } catch (e) { /* no profile yet */ }
      try {
        const ds = await window.storage.get("orbit:daystreak");
        if (ds?.value) setDayStreakData({ lastDate: null, current: 0, best: 0, ...JSON.parse(ds.value) });
      } catch (e) { /* no day streak yet */ }
      try {
        const m = await window.storage.get("orbit:milestone");
        if (m?.value) setStreakMilestone(parseInt(m.value, 10));
      } catch (e) { /* no pending milestone */ }
      try {
        const ev = await window.storage.get("orbit:escape");
        if (ev?.value) setEscapeBest(parseFloat(ev.value) || 0);
      } catch (e) { /* no escape run yet */ }
      try {
        const ih = await window.storage.get("orbit:installhint");
        if (ih?.value === "off") setInstallDismissed(true);
      } catch (e) { /* never dismissed */ }
      setBooted(true);
    })();
  }, []);

  const pickTheme = async (id) => {
    setThemeId(id);
    SFX.setTheme(id);
    try { await window.storage.set("orbit:theme", id); } catch (e) { /* not fatal */ }
  };

  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    SFX.setEnabled(next);
    if (next) SFX.ui();  // confirm it came back on
    try { await window.storage.set("orbit:sound", next ? "on" : "off"); } catch (e) { /* session only */ }
  };

  const dismissMilestone = async () => {
    setStreakMilestone(null);
    try { await window.storage.set("orbit:milestone", ""); } catch (e) { /* not fatal */ }
  };

  const saveProfile = async (next) => {
    setProfile(next);
    try { await window.storage.set("orbit:profile", JSON.stringify(next)); } catch (e) { /* session only */ }
    setScreen("home");
  };

  const saveStats = async (next) => {
    setStats(next);
    try { await window.storage.set("orbit:stats", JSON.stringify(next)); } catch (e) { /* session only */ }
  };

  const afterDrivingCheck = () => {
    const who = (profile.name || "").trim() || "You";
    if (pendingMode === "daily") {
      setMode("daily");
      setConfig({ players: [who], timer: 20, sameQ: true, count: 10, pool: QUESTIONS, difficulty: "Mixed", cats: [] });
      setRunKey((k) => k + 1);
      setScreen("game");
    } else if (pendingMode === "escape") {
      const deck = buildEscapeDeck();
      setMode("escape");
      setConfig({ players: [who], timer: ESCAPE.timerStart, sameQ: true, count: deck.length, pool: deck, difficulty: "Ladder", cats: [] });
      setRunKey((k) => k + 1);
      setScreen("game");
    } else {
      setScreen("custom");
    }
  };

  /* A fresh Escape run needs a fresh ladder, so "Launch again"
     rebuilds the deck instead of replaying the same order. */
  const relaunchEscape = () => {
    const deck = buildEscapeDeck();
    setConfig((c) => ({ ...c, count: deck.length, pool: deck }));
    setRunKey((k) => k + 1);
    setScreen("game");
  };

  const finish = async (data) => {
    if (data.escape) {
      setResults({ ...data, prevBestV: escapeBest });
      setScreen("results");
      if (data.velocity > escapeBest) {
        setEscapeBest(data.velocity);
        try { await window.storage.set("orbit:escape", String(data.velocity)); } catch (e) { /* session only */ }
      }
      await saveStats({ ...stats, runs: stats.runs + 1 });
      return;
    }
    setResults({ ...data, prevBest: stats.best });
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
      const nextStreak = bumpDayStreak(dayStreakData);
      if (nextStreak !== dayStreakData) {
        setDayStreakData(nextStreak);
        try { await window.storage.set("orbit:daystreak", JSON.stringify(nextStreak)); } catch (e) { /* not fatal */ }
        if (nextStreak.current === 7 || nextStreak.current === 30 || nextStreak.current === 100) {
          setStreakMilestone(nextStreak.current);
          try { await window.storage.set("orbit:milestone", String(nextStreak.current)); } catch (e) { /* not fatal */ }
        }
      }
    }
  };

  /* Fonts are loaded as real <link> tags in app/layout.jsx, not via
     @import in this <style> block — see the comment there for why. */
  const fonts = (
    <style>{`
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
      @keyframes urgent {
        0%, 100% { opacity: 1; }
        50%      { opacity: .4; }
      }
      @keyframes countIn {
        0%   { transform: scale(1.9); opacity: 0; }
        40%  { transform: scale(1);   opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes blaze {
        0%, 100% { transform: rotate(-45deg) scale(1); }
        50%      { transform: rotate(-45deg) scale(1.14); }
      }
      @keyframes flicker {
        from { transform: scaleY(1) translateY(0);      opacity: .7; }
        to   { transform: scaleY(1.3) translateY(2px);  opacity: 1; }
      }
      @keyframes liftoff {
        0%   { transform: translateY(0); }
        28%  { transform: translateY(0); }
        45%  { transform: translateY(-14vh); }
        100% { transform: translateY(-160vh); }
      }
      @keyframes padshake {
        0%, 100% { transform: translateX(0); }
        25%      { transform: translateX(-2px); }
        75%      { transform: translateX(2px); }
      }
      @keyframes plume {
        from { opacity: .85; transform: scaleY(1); }
        to   { opacity: 1;   transform: scaleY(1.18); }
      }
      @keyframes smokeout {
        0%   { transform: translateY(0) scale(.6);      opacity: 0; }
        18%  { opacity: .85; }
        100% { transform: translateY(-52px) scale(2.2); opacity: 0; }
      }
      @keyframes skyfall {
        0%   { transform: translateY(0);      opacity: 0; }
        15%  { opacity: .55; }
        100% { transform: translateY(130vh);  opacity: 0; }
      }
      @keyframes verdictIn {
        0%   { transform: scale(.7) translateY(12px); opacity: 0; }
        100% { transform: scale(1)  translateY(0);    opacity: 1; }
      }
      @keyframes screenshake {
        0%, 100% { transform: translateX(0); }
        20%      { transform: translateX(-5px); }
        40%      { transform: translateX(4px); }
        60%      { transform: translateX(-3px); }
        80%      { transform: translateX(2px); }
      }
      @keyframes promoPop {
        0%   { transform: scale(.6);  opacity: 0; }
        12%  { transform: scale(1.06); opacity: 1; }
        20%  { transform: scale(1); }
        78%  { opacity: 1; }
        100% { transform: scale(1);  opacity: 0; }
      }
      @keyframes countBeat {
        0%   { transform: scale(2.2); opacity: 0; }
        18%  { transform: scale(1);   opacity: 1; }
        75%  { transform: scale(1);   opacity: 1; }
        100% { transform: scale(.88); opacity: .35; }
      }
      /* brief visible window inside a long cycle = an occasional comet */
      @keyframes comet {
        0%   { transform: translate(0, 0) rotate(14deg);          opacity: 0; }
        1%   { opacity: 0; }
        3%   { opacity: .9; }
        7%   { opacity: .9; }
        9%   { transform: translate(150vw, 34vh) rotate(14deg);   opacity: 0; }
        100% { transform: translate(150vw, 34vh) rotate(14deg);   opacity: 0; }
      }
      @keyframes speedFloat {
        0%   { transform: translateY(14px) scale(.8); opacity: 0; }
        20%  { transform: translateY(0) scale(1.08);  opacity: 1; }
        32%  { transform: translateY(0) scale(1); }
        70%  { transform: translateY(-6px);          opacity: 1; }
        100% { transform: translateY(-26px);         opacity: 0; }
      }
      @keyframes edgepulse {
        0%   { opacity: 0; }
        30%  { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes drift {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50%      { transform: translateY(-3px) rotate(-5deg); }
      }
      @keyframes miniLaunch {
        0%   { transform: translateY(0); }
        14%  { transform: translateY(2px); }
        100% { transform: translateY(-105vh); }
      }
      @keyframes miniReturn {
        0%   { transform: translateY(-64px); opacity: 0; }
        60%  { transform: translateY(3px);   opacity: 1; }
        100% { transform: translateY(0);     opacity: 1; }
      }
      @keyframes shatter {
        0%   { transform: translate(0, 0) rotate(0deg); }
        18%  { transform: translate(calc(var(--sx) * .3), calc(var(--sy) * .3)) rotate(calc(var(--sr) * .5)); }
        60%  { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); }
        100% { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); }
      }
      @keyframes reassemble {
        0%   { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); filter: none; }
        70%  { transform: translate(0, 0) rotate(0deg); filter: brightness(1.7); }
        100% { transform: translate(0, 0) rotate(0deg); filter: none; }
      }
      @keyframes cardvanish { from { opacity: 1; } to { opacity: 0; } }
      @keyframes cardreturn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes chargeup {
        0%   { transform: scale(1); }
        35%  { transform: scale(1.035); }
        100% { transform: scale(1); }
      }
      /* ---- home launch sequence ----
         Spread is driven by --spread / --spread2 so the throw distance can be
         tuned from the LAUNCH block in JS without touching these rules. */
      /* a freshly broken edge glows, then cools while the piece drifts */
      @keyframes edgeCool {
        0%   { opacity: 0;   filter: brightness(2.4); }
        18%  { opacity: 1;   filter: brightness(2.4); }
        100% { opacity: .45; filter: brightness(1); }
      }
      /* ...and goes white-hot as the pieces meet, then fades out welded */
      @keyframes weldSeam {
        0%   { opacity: .45; filter: brightness(1); }
        70%  { opacity: .9;  filter: brightness(1.8); }
        84%  { opacity: 1;   filter: brightness(3.4) drop-shadow(0 0 7px #FFFFFF); }
        92%  { opacity: .8;  filter: brightness(2.2); }
        100% { opacity: 0;   filter: brightness(1); }
      }
      @keyframes padBloom {
        0%, 100% { transform: scaleX(1);    opacity: .8; }
        50%      { transform: scaleX(1.14); opacity: 1; }
      }
      @keyframes extremeShatter {
        0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; filter: brightness(1.4); }
        16%  { transform: translate(calc(var(--sx) * .5), calc(var(--sy) * .5)) rotate(calc(var(--sr) * 1.1)) scale(1.02); opacity: 1; }
        65%  { transform: translate(calc(var(--sx) * var(--spread)), calc(var(--sy) * var(--spread))) rotate(calc(var(--sr) * 3.4)) scale(.93); opacity: .55; }
        100% { transform: translate(calc(var(--sx) * var(--spread)), calc(var(--sy) * var(--spread))) rotate(calc(var(--sr) * 4)) scale(.9); opacity: .3; filter: none; }
      }
      @keyframes zeroFloat {
        0%   { transform: translate(calc(var(--sx) * var(--spread)),  calc(var(--sy) * var(--spread)))  rotate(calc(var(--sr) * 4))   scale(.9);  opacity: .3; }
        50%  { transform: translate(calc(var(--sx) * var(--spread2)), calc(var(--sy) * var(--spread2))) rotate(calc(var(--sr) * 4.8)) scale(.88); opacity: .2; }
        100% { transform: translate(calc(var(--sx) * var(--spread)),  calc(var(--sy) * var(--spread)))  rotate(calc(var(--sr) * 4))   scale(.9);  opacity: .3; }
      }
      @keyframes hardSnap {
        0%   { transform: translate(calc(var(--sx) * var(--spread)), calc(var(--sy) * var(--spread))) rotate(calc(var(--sr) * 4)) scale(.9); opacity: .3; }
        35%  { opacity: 1; }
        80%  { transform: translate(0, 0) rotate(0deg) scale(1.02); opacity: 1; filter: brightness(1.5); }
        100% { transform: translate(0, 0) rotate(0deg) scale(1);    opacity: 1; filter: none; }
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
            onEscape={() => { setPendingMode("escape"); setScreen("driving"); }}
            escapeBest={escapeBest}
            stats={stats}
            dailyDone={dailyDone}
            themeName={theme.name}
            onSwapTheme={() => pickTheme(themeId === "moon" ? "mars" : "moon")}
            profile={profile}
            dayStreak={liveDayStreak(dayStreakData)}
            onOpenProfile={() => setScreen("profile")}
            streakMilestone={streakMilestone}
            onDismissMilestone={dismissMilestone}
            soundOn={soundOn}
            onToggleSound={toggleSound}
            showInstall={showInstall}
            onDismissInstall={dismissInstall}
            androidPrompt={runAndroidInstall}
          />
        )}

        {screen === "profile" && (
          <ProfileScreen profile={profile} onSave={saveProfile} onBack={() => setScreen("home")} />
        )}

        {screen === "driving" && (
          <>
            <Home
              onDaily={() => {}}
              onCustom={() => {}}
              onEscape={() => {}}
              escapeBest={escapeBest}
              stats={stats}
              dailyDone={dailyDone}
              themeName={theme.name}
              onSwapTheme={() => {}}
              profile={profile}
              dayStreak={liveDayStreak(dayStreakData)}
              onOpenProfile={() => {}}
              streakMilestone={null}
              onDismissMilestone={() => {}}
              soundOn={soundOn}
              onToggleSound={() => {}}
              showInstall={false}
              onDismissInstall={() => {}}
              androidPrompt={null}
            />
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
          results.escape ? (
            <EscapeResults
              data={results}
              profile={profile}
              prevBest={results.prevBestV}
              onHome={() => setScreen("home")}
              onAgain={relaunchEscape}
            />
          ) : (
            <Results
              data={results}
              profile={profile}
              onHome={() => setScreen("home")}
              onAgain={() => { setRunKey((k) => k + 1); setScreen("game"); }}
            />
          )
        )}
      </div>
    </ThemeCtx.Provider>
  );
}
